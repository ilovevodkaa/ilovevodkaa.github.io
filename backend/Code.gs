/**
 * Бэкенд портфолио _ilovevodka.
 * Google Таблица — хранилище, этот скрипт — веб-приложение.
 * Секреты только в Script Properties: ADMIN_PASSWORD, TELEGRAM_BOT_TOKEN,
 * TELEGRAM_CHAT_ID и (если скрипт не привязан к таблице) SPREADSHEET_ID.
 * Как развернуть — в SETUP.md в корне репозитория.
 *
 * Запусти функцию setup один раз из редактора: она создаст листы.
 */

var SHEET_ORDERS = 'Заказы';
var SHEET_SLOTS = 'Занятость';

var ORDER_HEADERS = ['Когда', 'Услуги', 'Срочно', 'Наценка', 'Оценка', 'Срок', 'Дата', 'Задача', 'Имя', 'Контакт', 'Язык'];
var SLOT_HEADERS = ['id', 'Дата', 'Начало', 'Конец', 'Статус', 'Заметка', 'Обновлено'];

var STATUS_RU = { busy: 'занят', working: 'работаю', unavailable: 'недоступен' };
var STATUS_ID = {
  'занят': 'busy', 'работаю': 'working', 'недоступен': 'unavailable',
  busy: 'busy', working: 'working', unavailable: 'unavailable',
};

var DEADLINES = { asap: 'срочно · как можно скорее', week: '1–2 недели', month: 'месяц', flex: 'не горит' };

function setup() {
  var ss = book_();
  ensureOrders_(ss, true);
  ensureSlots_(ss, true);
}

function doGet(e) {
  e = e || {};
  var p = e.parameter || {};
  try {
    if (p.action === 'availability') {
      var body = { ok: true, slots: readSlots_() };
      return scriptOrJson_(body, p.callback);
    }
  } catch (err) {
    return scriptOrJson_({ ok: true, slots: [] }, p.callback);
  }
  return HtmlService.createHtmlOutput('<p style="font-family:sans-serif">ок. скрипт на месте, заявки принимаются.</p>');
}

function doPost(e) {
  var payload = {};
  try {
    payload = parse_(e);
    return respond_(e, handle_(payload));
  } catch (err) {
    return respond_(e, { ok: false, error: 'server' });
  }
}

function handle_(payload) {
  payload = payload || {};
  var action = String(payload.action || '');
  if (action === 'order') return saveOrder_(payload);
  if (action === 'login' || action === 'slots' || action === 'save' || action === 'delete') {
    var auth = adminOk_(payload.password);
    if (!auth.ok) return auth;
    if (action === 'login') return { ok: true };
    if (action === 'slots') return { ok: true, slots: readSlots_() };
    if (action === 'save') return saveSlot_(payload.slot || {});
    if (action === 'delete') return deleteSlot_(payload.id);
  }
  return { ok: false, error: 'bad' };
}

function saveOrder_(p) {
  if (p.hp_field) return { ok: true };
  var services = Array.isArray(p.services) ? p.services.slice(0, 12) : [];
  if (!services.length) return { ok: false, error: 'validation' };
  var description = clip_(p.description, 4000);
  var name = clip_(p.name, 80);
  var contact = clip_(p.contact, 120);
  if (description.length < 10 || name.length < 2 || contact.length < 5) return { ok: false, error: 'validation' };
  var deadline = DEADLINES[p.deadline] ? p.deadline : '';
  if (!deadline) return { ok: false, error: 'validation' };
  var contactKey = contact.toLowerCase().replace(/\s+/g, '');
  if (!rateOk_('ord:' + hash_(contactKey), 4, 3600)) return { ok: false, error: 'rate' };
  if (!rateOk_('ord-all', 40, 3600)) return { ok: false, error: 'rate' };

  var urgent = !!p.urgent || deadline === 'asap';
  var rate = Number(p.surcharge);
  if (!isFinite(rate) || rate < 0) rate = 0;
  if (rate > 1) rate = 1;
  if (!urgent) rate = 0;

  var lines = [];
  var base = 0;
  var custom = false;
  services.forEach(function (s) {
    if (!s || typeof s !== 'object') return;
    var title = clip_(s.titleRu || s.title || s.id, 160);
    var price = (typeof s.price === 'number' && isFinite(s.price) && s.price >= 0 && s.price < 1e8) ? s.price : null;
    if (price == null) {
      custom = true;
      lines.push(title + ' — по договорённости');
    } else {
      base += price;
      lines.push(title + ' — от ' + rub_(price));
    }
  });
  if (!lines.length) return { ok: false, error: 'validation' };
  var total = base * (1 + rate);
  var estimate = custom && base === 0
    ? 'по договорённости'
    : 'от ' + rub_(total) + (custom ? ' + по договорённости' : '');
  var date = /^\d{4}-\d{2}-\d{2}$/.test(String(p.deadlineDate || '')) ? String(p.deadlineDate) : '';
  var when = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Europe/Moscow', 'yyyy-MM-dd HH:mm');

  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var sheet = ensureOrders_(book_(), false);
    sheet.appendRow([
      cell_(when),
      cell_(lines.join('\n')),
      urgent ? 'да' : 'нет',
      urgent ? percent_(rate) + '%' : '0%',
      cell_(estimate),
      cell_(DEADLINES[deadline]),
      cell_(date),
      cell_(description),
      cell_(name),
      cell_(contact),
      p.lang === 'en' ? 'en' : 'ru',
    ]);
  } finally {
    lock.releaseLock();
  }

  try {
    notify_(telegramText_({
      lines: lines, urgent: urgent, rate: rate, estimate: estimate,
      deadline: DEADLINES[deadline], date: date, name: name, contact: contact,
      description: description, lang: p.lang === 'en' ? 'en' : 'ru',
    }));
  } catch (err) {}

  return { ok: true };
}

function telegramText_(o) {
  var parts = ['Новая заявка с сайта', '', 'Услуги:', o.lines.map(function (l) { return '• ' + l; }).join('\n'), ''];
  parts.push(o.urgent ? 'Срочность: срочно (+' + percent_(o.rate) + '%)' : 'Срочность: нет');
  parts.push('Оценка: ' + o.estimate);
  parts.push('Срок: ' + o.deadline);
  if (o.date) parts.push('Дата: ' + o.date);
  parts.push('Имя: ' + o.name);
  parts.push('Контакт: ' + o.contact);
  parts.push('Язык сайта: ' + (o.lang === 'en' ? 'английский' : 'русский'));
  parts.push('', 'Задача:', o.description);
  return parts.join('\n');
}

function saveSlot_(slot) {
  var date = String(slot.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: 'validation' };
  var status = STATUS_ID[slot.status] || '';
  if (!status) return { ok: false, error: 'validation' };
  var start = timeOrEmpty_(slot.start);
  var end = timeOrEmpty_(slot.end);
  if (start === null || end === null) return { ok: false, error: 'validation' };
  if (start && end && start >= end) return { ok: false, error: 'validation' };
  var note = clip_(slot.note, 300);
  var id = clip_(slot.id, 80);
  var now = new Date().toISOString();

  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var sheet = ensureSlots_(book_(), false);
    var row = id ? findIdRow_(sheet, id) : 0;
    if (!row) {
      id = Utilities.getUuid();
      row = sheet.getLastRow() + 1;
    }
    writeSlotRow_(sheet, row, [id, date, start, end, STATUS_RU[status], note, now]);
  } finally {
    lock.releaseLock();
  }
  return { ok: true, slots: readSlots_() };
}

function deleteSlot_(id) {
  id = clip_(id, 80);
  if (!id) return { ok: false, error: 'validation' };
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var sheet = ensureSlots_(book_(), false);
    var row = findIdRow_(sheet, id);
    if (row) sheet.deleteRow(row);
  } finally {
    lock.releaseLock();
  }
  return { ok: true, slots: readSlots_() };
}

function readSlots_() {
  var sheet = ensureSlots_(book_(), false);
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var values = sheet.getRange(2, 1, last - 1, SLOT_HEADERS.length).getValues();
  var out = [];
  for (var i = 0; i < values.length; i++) {
    var id = String(values[i][0] || '').trim();
    var date = normalizeDate_(values[i][1]);
    var status = STATUS_ID[String(values[i][4] || '').trim()] || '';
    if (!id || !date || !status) continue;
    out.push({
      id: id,
      date: date,
      start: timeOrEmpty_(values[i][2]) || '',
      end: timeOrEmpty_(values[i][3]) || '',
      status: status,
      note: clip_(values[i][5], 300),
    });
  }
  out.sort(function (a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return String(a.start).localeCompare(String(b.start));
  });
  return out.slice(0, 500);
}

function adminOk_(password) {
  var expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD') || '';
  if (!expected) return { ok: false, error: 'config' };
  if (password && String(password) === String(expected)) return { ok: true };
  var cache = CacheService.getScriptCache();
  var n = Number(cache.get('admin-fail') || '0');
  if (n >= 8) return { ok: false, error: 'rate' };
  cache.put('admin-fail', String(n + 1), 600);
  return { ok: false, error: 'unauthorized' };
}

function book_() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  var ss = SpreadsheetApp.getActive();
  if (ss) return ss;
  throw new Error('NO_SHEET');
}

function ensureOrders_(ss, fresh) {
  var sheet = ss.getSheetByName(SHEET_ORDERS) || ss.insertSheet(SHEET_ORDERS);
  if (fresh || sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, ORDER_HEADERS.length).setValues([ORDER_HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(2, 320);
    sheet.setColumnWidth(8, 360);
  }
  return sheet;
}

function ensureSlots_(ss, fresh) {
  var sheet = ss.getSheetByName(SHEET_SLOTS) || ss.insertSheet(SHEET_SLOTS);
  if (fresh || sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, SLOT_HEADERS.length).setValues([SLOT_HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['занят', 'работаю', 'недоступен'], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange('E2:E500').setDataValidation(rule);
    sheet.getRange('B2:B500').setNumberFormat('@');
  }
  return sheet;
}

function writeSlotRow_(sheet, row, values) {
  var range = sheet.getRange(row, 1, 1, values.length);
  range.setNumberFormat('@');
  range.setValues([values.map(cell_)]);
}

function findIdRow_(sheet, id) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === id) return i + 2;
  return 0;
}

function parse_(e) {
  try {
    if (e && e.parameter && e.parameter.payload) return JSON.parse(e.parameter.payload);
    if (e && e.postData && e.postData.contents) return JSON.parse(e.postData.contents);
  } catch (err) {}
  return {};
}

function respond_(e, obj) {
  var fromForm = e && e.parameter && e.parameter.payload != null;
  if (fromForm) {
    var json = JSON.stringify(obj).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    return HtmlService.createHtmlOutput('<!doctype html><meta charset="utf-8"><script>parent.postMessage(' + json + ',"*");<\/script>');
  }
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function scriptOrJson_(obj, callback) {
  var json = JSON.stringify(obj).replace(/</g, '\\u003c');
  var cb = String(callback || '');
  if (/^[a-zA-Z_][a-zA-Z0-9_]{0,40}$/.test(cb)) {
    return ContentService.createTextOutput(cb + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function notify_(text) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('TELEGRAM_BOT_TOKEN');
  var chat = props.getProperty('TELEGRAM_CHAT_ID');
  if (!token || !chat) return;
  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: chat, text: text, disable_web_page_preview: true }),
    muteHttpExceptions: true,
  });
}

function rateOk_(key, limit, seconds) {
  var cache = CacheService.getScriptCache();
  var n = Number(cache.get(key) || '0') + 1;
  cache.put(key, String(n), seconds);
  return n <= limit;
}

function hash_(s) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8);
  return bytes.map(function (b) {
    var v = (b + 256) % 256;
    return (v < 16 ? '0' : '') + v.toString(16);
  }).join('').slice(0, 20);
}

function clip_(v, n) {
  var s = v == null ? '' : String(v);
  s = s.replace(/^\s+|\s+$/g, '');
  return s.length > n ? s.slice(0, n) : s;
}

function cell_(v) {
  var s = v == null ? '' : String(v);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function rub_(n) {
  var x = Math.round(Number(n) * 10) / 10;
  var s = String(x).replace('.', ',');
  var parts = s.split(',');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join(',') + ' ₽';
}

function percent_(rate) {
  var p = Math.round(Number(rate) * 1000) / 10;
  if (Math.abs(p - Math.round(p)) < 0.001) return String(Math.round(p));
  return String(p).replace('.', ',');
}

function timeOrEmpty_(v) {
  if (v == null || v === '') return '';
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) {
    return ('0' + v.getHours()).slice(-2) + ':' + ('0' + v.getMinutes()).slice(-2);
  }
  var m = /^(\d{1,2}):(\d{2})/.exec(String(v).trim());
  if (!m) return null;
  var h = Number(m[1]), min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return ('0' + h).slice(-2) + ':' + ('0' + min).slice(-2);
}

function normalizeDate_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) {
    return Utilities.formatDate(v, Session.getScriptTimeZone() || 'Europe/Moscow', 'yyyy-MM-dd');
  }
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || '').trim());
  return m ? m[1] + '-' + m[2] + '-' + m[3] : '';
}

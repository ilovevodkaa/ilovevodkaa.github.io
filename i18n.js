/* Тексты сайта. lang в localStorage, по умолчанию русский.
   Если язык ещё не выбирали и браузер не русский — открываем английский. */
(function (root) {
  'use strict';

  const STR = {
    metaDescription: {
      ru: '_ilovevodka — делаю сайты и автоматизации на ИИ. Портфолио и контакты.',
      en: '_ilovevodka — I build websites and AI automations. Portfolio and contacts.',
    },
    ogDescription: {
      ru: 'Сайты и автоматизации на ИИ. Портфолио и контакты.',
      en: 'Websites and AI automations. Portfolio and contacts.',
    },
    navLabel: { ru: 'Разделы', en: 'Sections' },
    langLabel: { ru: 'Язык', en: 'Language' },
    tabBio: { ru: 'био', en: 'bio' },
    tabWork: { ru: 'портфолио', en: 'portfolio' },
    ariaBio: { ru: 'Био', en: 'Bio' },
    ariaWork: { ru: 'Портфолио', en: 'Portfolio' },
    linksLabel: { ru: 'Ссылки', en: 'Links' },
    orderBtn: { ru: 'заказ', en: 'order' },
    tagline: {
      ru: 'пишу код. играю в игры. не сплю по ночам.',
      en: 'I write code. I play games. I don\u2019t sleep at night.',
    },
    about: {
      ru: 'Делаю сайты и автоматизации на ИИ — чтобы рутину делала машина, а не человек. Работы лежат во вкладке «портфолио».',
      en: 'I build websites and AI automations — so the busywork goes to a machine, not a person. The work lives in the Portfolio tab.',
    },
    workEyebrow: { ru: '( портфолио )', en: '( portfolio )' },
    workTitle: { ru: '_портфолио', en: '_portfolio' },
    workLead: {
      ru: 'Делаю сайты и автоматизации, которые снимают с людей рутину. Первая работа — ниже, дальше будет больше.',
      en: 'I build websites and automations that take the busywork off people. The first project is below — more will follow.',
    },
    caseKind: { ru: 'сайт + ИИ-автоматизация', en: 'website + AI automation' },
    caseTitle: { ru: 'Автоматизация при помощи ИИ', en: 'Automation with AI' },
    caseDesc: {
      ru: 'Сайт стоматологии «Улыбка». Заявка с формы попадает к ИИ: он понимает, что беспокоит человека и насколько это срочно. Администратору сразу приходит уведомление в Telegram, а запись на удобное время остаётся в Google Таблицах — без ручной работы.',
      en: 'A website for the Ulybka dental clinic. A form request goes to an AI model: it works out what\u2019s wrong and how urgent it is. The administrator gets a Telegram notification right away, and the appointment stays in Google Sheets — no manual copying.',
    },
    openSite: { ru: 'открыть сайт', en: 'open the site' },
    chipSite: { ru: 'сайт', en: 'website' },
    chipAi: { ru: 'ИИ', en: 'AI' },
    chipBot: { ru: 'Telegram-бот', en: 'Telegram bot' },
    chipSheet: { ru: 'Google Таблицы', en: 'Google Sheets' },
    step1t: { ru: 'Клиент оставляет заявку', en: 'The client leaves a request' },
    step1d: {
      ru: 'Человек заходит на сайт, пишет, что его беспокоит, или выбирает готовый вариант — и жмёт «Записаться». Без звонков и ожидания на линии.',
      en: 'Someone opens the site, writes what\u2019s bothering them or picks a ready-made option, and hits \u201cBook\u201d. No calls, no waiting on the line.',
    },
    step2t: { ru: 'ИИ определяет срочность и проблему', en: 'The AI reads the urgency and the problem' },
    step2d: {
      ru: 'Нейросеть читает заявку и за секунды раскладывает её по полочкам: насколько это срочно, какая услуга нужна и в чём суть — одной фразой.',
      en: 'The model reads the request and, in a few seconds, sorts it out: how urgent it is, which service is needed, and the gist — in one sentence.',
    },
    step3t: { ru: 'Вам приходит уведомление в Telegram', en: 'You get a Telegram notification' },
    step3d: {
      ru: 'Готовая карточка заявки прилетает в Telegram: срочность, имя, телефон, услуга и суть. Сразу видно, кому перезвонить первым.',
      en: 'A finished request card arrives in Telegram: urgency, name, phone, service, and the gist. You can see at once who to call back first.',
    },
    step4t: { ru: 'Запись остаётся в Google Таблицах', en: 'The booking stays in Google Sheets' },
    step4d: {
      ru: 'Запись на удобное время автоматически попадает в таблицу. Ничего не теряется, вся история заявок — в одном месте.',
      en: 'The chosen time lands in a spreadsheet on its own. Nothing gets lost — the whole history sits in one place.',
    },
    shotAria: { ru: 'Открыть сайт стоматологии «Улыбка»', en: 'Open the Ulybka dental clinic site' },
    shotAlt: {
      ru: 'Сайт стоматологии «Улыбка»: заголовок «Лечим зубы без очередей и лишнего стресса» и форма записи на приём',
      en: 'The Ulybka dental site: the headline \u201cWe treat teeth without queues or extra stress\u201d and an appointment form',
    },
    aiAria: {
      ru: 'ИИ разбирает заявку «Консультация по имплантам»: срочность — обычная, услуга — консультация, суть — пациент запросил консультацию по имплантации зубов',
      en: 'The AI reads the request \u201cImplant consultation\u201d: urgency — routine, service — consultation, gist — the patient asked for a dental implant consultation',
    },
    aiHead: { ru: 'ai · разбор заявки', en: 'ai · reading the request' },
    aiIn: { ru: '«Консультация по имплантам»', en: '\u201cImplant consultation\u201d' },
    aiUrg: { ru: 'срочность', en: 'urgency' },
    aiUrgVal: { ru: 'обычная', en: 'routine' },
    aiSvc: { ru: 'услуга', en: 'service' },
    aiSvcVal: { ru: 'консультация', en: 'consultation' },
    aiGist: { ru: 'суть', en: 'gist' },
    aiGistVal: {
      ru: 'Пациент запросил консультацию по имплантации зубов.',
      en: 'The patient asked for a consultation about dental implants.',
    },
    sheetAria: {
      ru: 'Таблица заявок: новая строка — Анна, консультация, срочность обычная',
      en: 'A request spreadsheet: a new row — Anna, consultation, routine urgency',
    },
    sheetTitle: { ru: 'Заявки', en: 'Requests' },
    sheetSub: { ru: 'Google Таблицы', en: 'Google Sheets' },
    thName: { ru: 'Имя', en: 'Name' },
    thPhone: { ru: 'Телефон', en: 'Phone' },
    thSvc: { ru: 'Услуга', en: 'Service' },
    thUrg: { ru: 'Срочность', en: 'Urgency' },
    thBook: { ru: 'Запись', en: 'Booking' },
    cellName: { ru: 'Анна', en: 'Anna' },
    cellSvc: { ru: 'консультация', en: 'consultation' },
    cellUrg: { ru: 'обычная', en: 'routine' },
    cellWhen: { ru: 'ср · 14:30', en: 'Wed · 14:30' },
    tgAlt: {
      ru: 'Сообщение бота в Telegram: «Новая заявка — стоматология „Улыбка“. Обычная. Имя: Анна. Услуга: консультация. Суть: пациент запросил консультацию по имплантации зубов»',
      en: 'A Telegram bot message: \u201cNew request — Ulybka dental clinic. Routine. Name: Anna. Service: consultation. Gist: the patient asked for a consultation about dental implants.\u201d',
    },
    tgTitle: { ru: 'Заявки с сайта', en: 'Site requests' },
    tgBot: { ru: 'бот', en: 'bot' },
    donePill: { ru: 'заявка обработана — без ручной работы', en: 'request handled — no manual work' },
    cta: {
      ru: 'Нужна такая же автоматизация? <a href="{telegram}" target="_blank" rel="noopener">Напиши мне в Telegram ↗</a>',
      en: 'Need the same kind of automation? <a href="{telegram}" target="_blank" rel="noopener">Message me on Telegram ↗</a>',
    },
    since: { ru: 'сайт живёт с 21.09.2026', en: 'live since 21.09.2026' },
    clock: { ru: 'у меня сейчас', en: 'my time' },
    glyphs: { ru: 'символов', en: 'glyphs' },
    titleBio: { ru: '_ilovevodka', en: '_ilovevodka' },
    titleWork: { ru: '_ilovevodka — портфолио', en: '_ilovevodka — portfolio' },
    titleAway: { ru: 'вернись_', en: 'come back_' },
    copyAria: { ru: '{name}: {text} — скопировать ник', en: '{name}: {text} — copy handle' },
    copied: { ru: 'скопировано', en: 'copied' },
    copyManual: { ru: 'скопируй вручную', en: 'copy it by hand' },
    copiedSr: { ru: 'Ник {text} скопирован', en: 'Handle {text} copied' },
    consoleHint: { ru: 'псс… набери на клавиатуре vodka', en: 'psst… type vodka on the keyboard' },
    stCode: { ru: 'пишет код в ', en: 'writing code in ' },
    stPlay: { ru: 'играет в ', en: 'playing ' },
    stStream: { ru: 'стримит ', en: 'streaming ' },
    stListen: { ru: 'слушает ', en: 'listening to ' },
    stWatch: { ru: 'смотрит ', en: 'watching ' },
    stCompete: { ru: 'соревнуется в ', en: 'competing in ' },
    nowCode: { ru: 'сейчас пишу код', en: 'writing code' },
    nowPlay: { ru: 'сейчас играю', en: 'playing' },
    nowStream: { ru: 'сейчас стримлю', en: 'streaming' },
    nowListen: { ru: 'сейчас слушаю', en: 'listening' },
    nowWatch: { ru: 'сейчас смотрю', en: 'watching' },
    min: { ru: 'мин', en: 'min' },
    hr: { ru: 'ч', en: 'h' },
    minAbbr: { ru: 'м', en: 'm' },

    orderEyebrow: { ru: '( заказ )', en: '( order )' },
    orderTitle: { ru: 'Что нужно сделать?', en: 'What do you need?' },
    orderPitch: {
      ru: 'Недорого и в кратчайшие сроки. Цифры ниже — это старт, «от».',
      en: 'Affordable, and turned around fast. The numbers below are starting prices.',
    },
    close: { ru: 'закрыть', en: 'close' },
    svcLegend: { ru: 'Услуги', en: 'Services' },
    svcHint: { ru: 'можно несколько', en: 'pick any that fit' },
    deadlineLegend: { ru: 'Когда нужно', en: 'When do you need it' },
    dlAsap: { ru: 'срочно · как можно скорее', en: 'urgent · as soon as possible' },
    dlWeek: { ru: '1–2 недели', en: '1–2 weeks' },
    dlMonth: { ru: 'месяц', en: 'about a month' },
    dlFlex: { ru: 'не горит', en: 'no rush' },
    dateLabel: { ru: 'Конкретная дата, если есть', en: 'A specific date, if you have one' },
    dateOptional: { ru: 'необязательно', en: 'optional' },
    calLegend: { ru: 'Когда я занят', en: 'When I\u2019m booked' },
    calHint: {
      ru: 'Отмеченные дни уже заняты — по ним видно, насколько реален срок.',
      en: 'Marked days are already taken, so you can tell whether the timing is realistic.',
    },
    calPrev: { ru: 'предыдущий месяц', en: 'previous month' },
    calNext: { ru: 'следующий месяц', en: 'next month' },
    calNone: { ru: 'В этом месяце ничего не отмечено.', en: 'Nothing marked this month.' },
    stBusy: { ru: 'занят', en: 'busy' },
    stWorking: { ru: 'работаю', en: 'working' },
    stOff: { ru: 'недоступен', en: 'unavailable' },
    allDay: { ru: 'весь день', en: 'all day' },
    fromTime: { ru: 'с {time}', en: 'from {time}' },
    untilTime: { ru: 'до {time}', en: 'until {time}' },
    taskLabel: { ru: 'Задача', en: 'The task' },
    taskPh: { ru: 'Что сделать, для кого и что уже есть', en: 'What you need, who it\u2019s for, and what you already have' },
    nameLabel: { ru: 'Имя', en: 'Name' },
    namePh: { ru: 'как к вам обращаться', en: 'what should I call you' },
    contactLabel: { ru: 'Telegram, телефон или почта', en: 'Telegram, phone, or email' },
    contactPh: { ru: '@username, +7… или почта', en: '@username, +7…, or email' },
    submit: { ru: 'отправить заявку', en: 'send the request' },
    sending: { ru: 'отправляю…', en: 'sending…' },
    viaTg: {
      ru: 'Заявка откроется в Telegram — останется нажать «отправить».',
      en: 'This opens Telegram — you\u2019ll just need to hit send.',
    },
    urgentNote: {
      ru: 'Срочно — плюс {n}% к цене «от».',
      en: 'Urgent — {n}% on top of the starting price.',
    },
    quoteEmpty: {
      ru: 'Выбери услуги — посчитаю, от какой суммы старт.',
      en: 'Pick the services and I\u2019ll add up a starting price.',
    },
    quoteUrgentWait: {
      ru: 'Срочно: +{n}%. Выбери услуги — посчитаю старт уже с наценкой.',
      en: 'Urgent: +{n}%. Pick the services and I\u2019ll add the rush on top.',
    },
    withoutRush: { ru: 'без срочности: от {sum}', en: 'without the rush: from {sum}' },
    customNote: {
      ru: 'На «по договорённости» процент тоже действует — точную сумму скажу, когда пойму задачу.',
      en: 'The percentage applies to \u201cby agreement\u201d too — I\u2019ll name the exact figure once I understand the task.',
    },
    errSvc: { ru: 'Выбери хотя бы одну услугу.', en: 'Pick at least one service.' },
    errDeadline: { ru: 'Выбери, когда это нужно.', en: 'Pick when you need it.' },
    errTask: { ru: 'Опиши задачу чуть подробнее.', en: 'Describe the task in a bit more detail.' },
    errName: { ru: 'Как к вам обращаться?', en: 'What should I call you?' },
    errContact: { ru: 'Оставь Telegram, телефон или почту.', en: 'Leave a Telegram, phone, or email.' },
    errSend: {
      ru: 'Не получилось отправить. Можно написать в Telegram — текст уже собран.',
      en: 'Couldn\u2019t send it. You can message me on Telegram — the text is ready.',
    },
    errRate: {
      ru: 'Слишком много заявок подряд. Напиши в Telegram — так точно дойдёт.',
      en: 'Too many requests in a row. Message me on Telegram and it\u2019ll get through.',
    },
    openTg: { ru: 'открыть Telegram', en: 'open Telegram' },
    okTitle: { ru: 'Заявка ушла', en: 'Request sent' },
    okText: {
      ru: 'Посмотрю и отвечу. Если срок жмёт — напиши, подвину как смогу.',
      en: 'I\u2019ll look and reply. If the timing is tight, say so and I\u2019ll move what I can.',
    },
    okTgTitle: { ru: 'Открыл Telegram', en: 'Telegram is open' },
    okTgText: {
      ru: 'Осталось нажать «отправить». Если окно не появилось — вот ссылка.',
      en: 'Just hit send. If the window didn\u2019t open, here\u2019s the link.',
    },
    another: { ru: 'ещё одна заявка', en: 'another request' },

    adminTitle: { ru: 'занятость · _ilovevodka', en: 'availability · _ilovevodka' },
    adminEyebrow: { ru: '( админка )', en: '( admin )' },
    adminTitleH: { ru: 'Занятость', en: 'Availability' },
    adminLead: {
      ru: 'Отмечай дни и часы: занят, работаю или недоступен. Это видно в форме заказа. Заметка тоже видна клиенту — не пиши туда лишнее.',
      en: 'Mark days and hours as busy, working, or unavailable. People see this in the order form. The note is visible to them too — keep it plain.',
    },
    loginLead: { ru: 'Пароль живёт в настройках скрипта, не в сайте.', en: 'The password lives in the script settings, not in the site.' },
    password: { ru: 'Пароль', en: 'Password' },
    enter: { ru: 'войти', en: 'enter' },
    badPassword: { ru: 'Неверный пароль.', en: 'Wrong password.' },
    rateAdmin: { ru: 'Слишком много попыток. Подожди минут десять.', en: 'Too many attempts. Wait about ten minutes.' },
    noBackend: {
      ru: 'Бэкенд ещё не подключён. Вставь URL веб-приложения в config.js — как написано в SETUP.md. Пока календарь на сайте пустой, а заявки открываются в Telegram.',
      en: 'The backend isn\u2019t connected yet. Paste the web app URL into config.js — see SETUP.md. Until then the public calendar stays empty and orders open in Telegram.',
    },
    logout: { ru: 'выйти', en: 'log out' },
    addSlot: { ru: 'новая отметка', en: 'new mark' },
    save: { ru: 'сохранить', en: 'save' },
    del: { ru: 'удалить', en: 'delete' },
    confirmDel: { ru: 'точно удалить', en: 'really delete' },
    cancel: { ru: 'отмена', en: 'cancel' },
    note: { ru: 'Заметка', en: 'Note' },
    notePh: { ru: 'необязательно, её видно в форме заказа', en: 'optional, shown on the order form' },
    timeFrom: { ru: 'С', en: 'From' },
    timeTo: { ru: 'До', en: 'To' },
    allDayHint: { ru: 'Пустое время — весь день.', en: 'Leave the times empty for the whole day.' },
    saved: { ru: 'Сохранено.', en: 'Saved.' },
    deleted: { ru: 'Удалено.', en: 'Deleted.' },
    errSave: { ru: 'Не получилось сохранить.', en: 'Couldn\u2019t save.' },
    errLoad: { ru: 'Не получилось загрузить календарь.', en: 'Couldn\u2019t load the calendar.' },
    dayEmpty: { ru: 'На этот день ничего нет.', en: 'Nothing on this day.' },
    statusLabel: { ru: 'Статус', en: 'Status' },
    edit: { ru: 'править', en: 'edit' },
  };

  function fill(s, vars) {
    if (!vars) return s;
    return s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] == null ? m : String(vars[k])));
  }

  function detect() {
    try {
      const saved = localStorage.getItem('lang');
      if (saved === 'ru' || saved === 'en') return saved;
    } catch (e) {}
    const primary = (root.navigator && root.navigator.languages && root.navigator.languages[0])
      || (root.navigator && root.navigator.language)
      || 'ru';
    return /^ru\b/i.test(primary) ? 'ru' : 'en';
  }

  let lang = detect();
  const hooks = [];

  function t(key, vars) {
    const row = STR[key];
    const s = row ? (row[lang] || row.ru) : key;
    return fill(s, vars);
  }

  function applyStatic(scope) {
    const doc = root.document;
    if (!doc) return;
    const rootEl = scope || doc;
    if (doc.documentElement) doc.documentElement.lang = lang;
    rootEl.querySelectorAll('[data-i18n]').forEach(el => {
      if (el.classList.contains('type') && el._chars) return;
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    rootEl.querySelectorAll('[data-i18n-html]').forEach(el => {
      const tg = (root.SITE_CONFIG && root.SITE_CONFIG.telegram) || 'https://t.me/ilovecodka';
      el.innerHTML = t(el.getAttribute('data-i18n-html'), { telegram: tg });
    });
    rootEl.querySelectorAll('[data-i18n-aria]').forEach(el => {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    rootEl.querySelectorAll('[data-i18n-alt]').forEach(el => {
      el.alt = t(el.getAttribute('data-i18n-alt'));
    });
    rootEl.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    rootEl.querySelectorAll('[data-set-lang]').forEach(btn => {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-set-lang') === lang ? 'true' : 'false');
    });
    const md = doc.querySelector('meta[name="description"]');
    if (md && (!scope || scope === doc)) md.setAttribute('content', t('metaDescription'));
    const og = doc.querySelector('meta[property="og:description"]');
    if (og && (!scope || scope === doc)) og.setAttribute('content', t('ogDescription'));
    const ogl = doc.querySelector('meta[property="og:locale"]');
    if (ogl && (!scope || scope === doc)) ogl.setAttribute('content', lang === 'en' ? 'en_US' : 'ru_RU');
  }

  function set(next) {
    if (next !== 'ru' && next !== 'en' || next === lang) {
      if (next === lang) applyStatic(root.document);
      return;
    }
    lang = next;
    try { localStorage.setItem('lang', lang); } catch (e) {}
    applyStatic(root.document);
    hooks.forEach(fn => { try { fn(lang); } catch (e) { console.error(e); } });
  }

  root.SiteI18n = {
    get lang() { return lang; },
    t, set, detect, applyStatic,
    on(fn) { hooks.push(fn); },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);

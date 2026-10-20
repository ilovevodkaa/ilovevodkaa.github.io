/* Окно «заказ»: услуги из SITE_CONFIG, срок, наценка за срочность, календарь занятости. */
(() => {
  'use strict';
  if (!window.SiteI18n || !window.SiteApi || !window.SiteCal) return;

  const T = (k, v) => SiteI18n.t(k, v);
  const cfg = () => window.SITE_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);

  const selected = new Set();
  let deadline = '';
  let slots = [];
  let month = startMonth();
  let picked = '';
  let lastFocus = null;
  let sending = false;
  let sent = false;

  function startMonth() {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  }

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'order-modal';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="order-title" tabindex="-1">
      <div class="modal__bar">
        <p class="modal__eyebrow" data-i18n="orderEyebrow">( заказ )</p>
        <div class="modal__bar-actions">
          <div class="lang" role="group" data-i18n-aria="langLabel" aria-label="Язык">
            <button type="button" data-set-lang="ru">ru</button>
            <button type="button" data-set-lang="en">en</button>
          </div>
          <button class="modal__x" type="button" data-order-close data-i18n-aria="close" aria-label="закрыть">×</button>
        </div>
      </div>
      <form class="modal__form" id="order-form" novalidate>
        <input class="hp" type="text" name="hp_field" tabindex="-1" autocomplete="off" aria-hidden="true">
        <h2 id="order-title" data-i18n="orderTitle">Что нужно сделать?</h2>
        <p class="modal__pitch" data-i18n="orderPitch">Недорого и в кратчайшие сроки. Цифры ниже — это старт, «от».</p>

        <fieldset id="order-services">
          <legend><span data-i18n="svcLegend">Услуги</span> <small data-i18n="svcHint">можно несколько</small></legend>
          <div class="svc-list" id="order-svc-list"></div>
        </fieldset>

        <div class="quote" id="order-quote" aria-live="polite"></div>

        <fieldset id="order-deadline">
          <legend data-i18n="deadlineLegend">Когда нужно</legend>
          <div class="pills" id="order-pills"></div>
          <p class="urgent-note" id="order-urgent" hidden></p>
        </fieldset>

        <label class="field" id="order-date-field">
          <span><span data-i18n="dateLabel">Конкретная дата, если есть</span> <small data-i18n="dateOptional">необязательно</small></span>
          <input type="date" name="date" id="order-date">
        </label>

        <fieldset id="order-availability">
          <legend data-i18n="calLegend">Когда я занят</legend>
          <p class="modal__hint" data-i18n="calHint">Отмеченные дни уже заняты — по ним видно, насколько реален срок.</p>
          <div class="cal__nav">
            <button type="button" class="cal__navbtn" data-cal="prev" data-i18n-aria="calPrev" aria-label="предыдущий месяц">‹</button>
            <span class="cal__title" id="order-month"></span>
            <button type="button" class="cal__navbtn" data-cal="next" data-i18n-aria="calNext" aria-label="следующий месяц">›</button>
          </div>
          <div id="order-cal"></div>
          <p class="cal__note" id="order-cal-note"></p>
          <ul class="cal__legend">
            <li><i class="is-busy"></i><span data-i18n="stBusy">занят</span></li>
            <li><i class="is-working"></i><span data-i18n="stWorking">работаю</span></li>
            <li><i class="is-unavailable"></i><span data-i18n="stOff">недоступен</span></li>
          </ul>
        </fieldset>

        <label class="field" id="order-task-field">
          <span data-i18n="taskLabel">Задача</span>
          <textarea name="task" id="order-task" required data-i18n-placeholder="taskPh" placeholder="Что сделать, для кого и что уже есть"></textarea>
        </label>
        <label class="field" id="order-name-field">
          <span data-i18n="nameLabel">Имя</span>
          <input name="name" id="order-name" type="text" autocomplete="name" required data-i18n-placeholder="namePh" placeholder="как к вам обращаться">
        </label>
        <label class="field" id="order-contact-field">
          <span data-i18n="contactLabel">Telegram, телефон или почта</span>
          <input name="contact" id="order-contact" type="text" autocomplete="on" inputmode="text" required data-i18n-placeholder="contactPh" placeholder="@username, +7… или почта">
        </label>

        <p class="modal__via" id="order-via" data-i18n="viaTg" hidden>Заявка откроется в Telegram — останется нажать «отправить».</p>
        <p class="modal__err" id="order-err" role="alert" hidden></p>
        <button class="modal__submit" type="submit" id="order-submit" data-i18n="submit">отправить заявку</button>
      </form>
      <div class="modal__ok" id="order-ok" hidden>
        <p class="modal__eyebrow" data-i18n="orderEyebrow">( заказ )</p>
        <h2 id="order-ok-title" tabindex="-1"></h2>
        <p id="order-ok-text"></p>
        <p id="order-ok-link" hidden><a id="order-ok-a" target="_blank" rel="noopener"></a></p>
        <button class="modal__submit" type="button" id="order-another" data-i18n="another">ещё одна заявка</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const panel = $('.modal__panel', modal);
  const form = $('#order-form', modal);
  const okBox = $('#order-ok', modal);

  function currentQuote() {
    const c = cfg();
    return SiteApi.quote(c.services || [], [...selected], deadline === 'asap', c.urgentSurcharge);
  }

  function renderServices() {
    const list = $('#order-svc-list', modal);
    const lang = SiteI18n.lang;
    const c = cfg();
    list.replaceChildren();
    for (const s of c.services || []) {
      const id = 'svc-' + s.id;
      const label = document.createElement('label');
      label.className = 'svc' + (selected.has(s.id) ? ' is-on' : '');
      label.htmlFor = id;
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'service';
      input.id = id;
      input.value = s.id;
      input.checked = selected.has(s.id);
      const name = document.createElement('span');
      name.className = 'svc__name';
      name.textContent = s[lang] || s.ru || s.id;
      const price = document.createElement('span');
      price.className = 'svc__price';
      price.textContent = SiteApi.basePrice(s, lang, c.currency || '₽');
      label.append(input, name, price);
      input.addEventListener('change', () => {
        if (input.checked) selected.add(s.id); else selected.delete(s.id);
        label.classList.toggle('is-on', input.checked);
        $('#order-services', modal).classList.remove('is-bad');
        renderQuote();
      });
      list.appendChild(label);
    }
  }

  function renderPills() {
    const wrap = $('#order-pills', modal);
    const options = [
      ['asap', 'dlAsap'],
      ['week', 'dlWeek'],
      ['month', 'dlMonth'],
      ['flex', 'dlFlex'],
    ];
    wrap.replaceChildren();
    for (const [id, key] of options) {
      const label = document.createElement('label');
      label.className = 'pill' + (deadline === id ? ' is-on' : '');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'deadline';
      input.value = id;
      input.checked = deadline === id;
      const text = document.createElement('span');
      text.textContent = T(key);
      label.append(input, text);
      input.addEventListener('change', () => {
        deadline = id;
        wrap.querySelectorAll('.pill').forEach(p => p.classList.remove('is-on'));
        label.classList.add('is-on');
        $('#order-deadline', modal).classList.remove('is-bad');
        renderQuote();
      });
      wrap.appendChild(label);
    }
  }

  function renderQuote() {
    const box = $('#order-quote', modal);
    const note = $('#order-urgent', modal);
    const q = currentQuote();
    const lang = SiteI18n.lang;
    const currency = cfg().currency || '₽';
    const n = SiteApi.percentText(cfg().urgentSurcharge);
    note.hidden = !q.urgent;
    note.textContent = T('urgentNote', { n });
    box.classList.toggle('is-urgent', !!q.urgent);
    box.replaceChildren();

    if (!q.items.length) {
      const p = document.createElement('p');
      p.className = 'quote__empty';
      p.textContent = q.urgent ? T('quoteUrgentWait', { n }) : T('quoteEmpty');
      box.appendChild(p);
      return;
    }

    const ul = document.createElement('ul');
    ul.className = 'quote__lines';
    for (const s of q.items) {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = s[lang] || s.ru;
      const price = document.createElement('b');
      price.textContent = SiteApi.linePrice(s, q, lang, currency);
      li.append(name, price);
      ul.appendChild(li);
    }
    box.appendChild(ul);

    const sum = document.createElement('p');
    sum.className = 'quote__sum';
    const label = SiteApi.estimateLabel(q, lang, currency);
    sum.textContent = q.urgent && q.priced.length ? label + ' · +' + n + '%' : label;
    box.appendChild(sum);

    if (q.urgent && q.priced.length && q.rate > 0) {
      const was = document.createElement('p');
      was.className = 'quote__was';
      was.textContent = T('withoutRush', { sum: SiteApi.formatMoney(q.base, lang, currency) });
      box.appendChild(was);
    }
    if (q.urgent && q.custom.length) {
      const extra = document.createElement('p');
      extra.className = 'quote__was';
      extra.textContent = T('customNote');
      box.appendChild(extra);
    }
  }

  function monthLimits() {
    const now = new Date();
    const min = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const max = new Date(now.getFullYear(), now.getMonth() + 14, 1);
    return { min, max };
  }

  function shiftMonth(dir) {
    const { min, max } = monthLimits();
    const next = new Date(month.y, month.m + dir, 1);
    if (next < min || next > max) return;
    month = { y: next.getFullYear(), m: next.getMonth() };
    renderCal();
  }

  function statusName(st) {
    if (st === 'busy') return T('stBusy');
    if (st === 'working') return T('stWorking');
    if (st === 'unavailable') return T('stOff');
    return '';
  }

  function rangeLabel(slot) {
    if (!slot.start && !slot.end) return T('allDay');
    if (slot.start && slot.end) return slot.start + '–' + slot.end;
    if (slot.start) return T('fromTime', { time: slot.start });
    return T('untilTime', { time: slot.end });
  }

  function renderCal() {
    const host = $('#order-cal', modal);
    const title = $('#order-month', modal);
    const note = $('#order-cal-note', modal);
    title.textContent = SiteCal.monthTitle(month.y, month.m, SiteI18n.lang);
    const { min, max } = monthLimits();
    const prev = $('.cal__navbtn[data-cal="prev"]', modal);
    const next = $('.cal__navbtn[data-cal="next"]', modal);
    prev.disabled = new Date(month.y, month.m, 1) <= min;
    next.disabled = new Date(month.y, month.m, 1) >= max;
    host.replaceChildren(SiteCal.renderGrid({
      year: month.y, month: month.m, slots, selected: picked, lang: SiteI18n.lang,
      label(day, st) {
        const base = new Intl.DateTimeFormat(SiteI18n.lang === 'en' ? 'en-GB' : 'ru-RU', { day: 'numeric', month: 'long' }).format(SiteCal.parseISO(day));
        return st ? base + ', ' + statusName(st) : base;
      },
      onPick(day) { picked = picked === day ? '' : day; renderCal(); },
    }));
    const inMonth = slots.filter(s => s.date && s.date.startsWith(month.y + '-' + String(month.m + 1).padStart(2, '0')));
    note.replaceChildren();
    if (!inMonth.length) {
      note.textContent = T('calNone');
      return;
    }
    const list = document.createElement('ul');
    const days = [...new Set(inMonth.map(s => s.date))].sort();
    const show = picked && days.includes(picked) ? [picked] : days;
    for (const day of show) {
      for (const slot of SiteCal.slotsOn(slots, day)) {
        const li = document.createElement('li');
        const when = document.createElement('b');
        when.textContent = new Intl.DateTimeFormat(SiteI18n.lang === 'en' ? 'en-GB' : 'ru-RU', { day: 'numeric', month: 'short' }).format(SiteCal.parseISO(day));
        li.append(when, document.createTextNode(' · ' + statusName(slot.status) + ' · ' + rangeLabel(slot)));
        if (slot.note) li.append(document.createTextNode(' — ' + slot.note));
        list.appendChild(li);
      }
    }
    note.appendChild(list);
  }

  function updateVia() {
    const via = $('#order-via', modal);
    via.hidden = !!SiteApi.backendUrl();
  }

  function refresh() {
    renderServices();
    renderPills();
    renderQuote();
    renderCal();
    updateVia();
    const submit = $('#order-submit', modal);
    if (!sending) submit.textContent = T('submit');
  }

  function validContact(v) {
    const s = v.trim();
    if (/^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(s)) return true;
    if (/^(?:https?:\/\/)?t\.me\/[a-zA-Z][a-zA-Z0-9_]{4,31}\/?$/i.test(s)) return true;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) return true;
    const digits = s.replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 15 && /^[+\d\s().-]+$/.test(s)) return true;
    return false;
  }

  function clearErrors() {
    $('#order-err', modal).hidden = true;
    modal.querySelectorAll('.is-bad').forEach(el => el.classList.remove('is-bad'));
  }

  function validate() {
    clearErrors();
    const problems = [];
    if (!selected.size) { problems.push('errSvc'); $('#order-services', modal).classList.add('is-bad'); }
    if (!deadline) { problems.push('errDeadline'); $('#order-deadline', modal).classList.add('is-bad'); }
    const task = $('#order-task', modal).value.trim();
    const name = $('#order-name', modal).value.trim();
    const contact = $('#order-contact', modal).value.trim();
    if (task.length < 10) { problems.push('errTask'); $('#order-task-field', modal).classList.add('is-bad'); }
    if (name.length < 2) { problems.push('errName'); $('#order-name-field', modal).classList.add('is-bad'); }
    if (!validContact(contact)) { problems.push('errContact'); $('#order-contact-field', modal).classList.add('is-bad'); }
    if (!problems.length) return true;
    const err = $('#order-err', modal);
    err.hidden = false;
    err.replaceChildren();
    problems.forEach((key, i) => {
      if (i) err.appendChild(document.createElement('br'));
      err.appendChild(document.createTextNode(T(key)));
    });
    const bad = $('.is-bad', modal);
    if (bad) {
      const focusable = bad.querySelector('input, textarea, button') || bad;
      if (focusable.focus) focusable.focus();
    }
    err.scrollIntoView({ block: 'nearest' });
    return false;
  }

  function payload() {
    const c = cfg();
    const q = currentQuote();
    const lang = SiteI18n.lang;
    const currency = c.currency || '₽';
    const date = $('#order-date', modal).value;
    return {
      action: 'order',
      services: q.items.map(s => ({
        id: s.id,
        title: s[lang] || s.ru,
        titleRu: s.ru,
        price: typeof s.price === 'number' ? s.price : null,
      })),
      urgent: q.urgent,
      surcharge: q.urgent ? q.rate : 0,
      estimateBase: q.base,
      estimateTotal: q.priced.length ? q.total : null,
      estimateLabelRu: SiteApi.estimateLabel(q, 'ru', currency),
      custom: q.custom.length > 0,
      deadline,
      deadlineLabelRu: SiteApi.DEADLINE_RU[deadline] || deadline,
      deadlineDate: date || '',
      description: $('#order-task', modal).value.trim(),
      name: $('#order-name', modal).value.trim(),
      contact: $('#order-contact', modal).value.trim(),
      lang,
      hp_field: $('input[name="hp_field"]', modal).value,
    };
  }

  function showOk(kind, href) {
    sent = true;
    form.hidden = true;
    okBox.hidden = false;
    $('#order-ok-title', modal).textContent = T(kind === 'tg' ? 'okTgTitle' : 'okTitle');
    $('#order-ok-text', modal).textContent = T(kind === 'tg' ? 'okTgText' : 'okText');
    const linkP = $('#order-ok-link', modal);
    const a = $('#order-ok-a', modal);
    if (href) {
      linkP.hidden = false;
      a.href = href;
      a.textContent = T('openTg');
    } else linkP.hidden = true;
    $('#order-ok-title', modal).focus();
  }

  function showForm() {
    sent = false;
    okBox.hidden = true;
    form.hidden = false;
    clearErrors();
  }

  function resetFields() {
    selected.clear();
    deadline = '';
    picked = '';
    form.reset();
    showForm();
    refresh();
  }

  function showSendError(code, href) {
    const err = $('#order-err', modal);
    err.hidden = false;
    err.replaceChildren(document.createTextNode(T(code === 'rate' ? 'errRate' : 'errSend')));
    if (href) {
      err.appendChild(document.createTextNode(' '));
      const a = document.createElement('a');
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = T('openTg');
      err.appendChild(a);
    }
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    if (sending || !validate()) return;
    const data = payload();
    const href = SiteApi.telegramHref(data, cfg().telegram);
    if (!SiteApi.backendUrl()) {
      const w = window.open(href, '_blank', 'noopener');
      showOk('tg', href);
      if (!w) $('#order-ok-a', modal).focus();
      return;
    }
    sending = true;
    const submit = $('#order-submit', modal);
    submit.disabled = true;
    submit.textContent = T('sending');
    try {
      await SiteApi.post(data);
      showOk('sent');
    } catch (err) {
      showSendError(err && err.code, href);
    } finally {
      sending = false;
      submit.disabled = false;
      submit.textContent = T('submit');
    }
  }

  function focusables() {
    return [...panel.querySelectorAll('a[href], button:not(:disabled), input:not([disabled]):not([tabindex="-1"]), textarea:not(:disabled), select:not(:disabled)')]
      .filter(el => !el.closest('[hidden]') && !el.hidden);
  }

  function open(opener) {
    lastFocus = opener || document.activeElement;
    if (sent) resetFields();
    modal.hidden = false;
    document.documentElement.classList.add('is-modal');
    updateVia();
    panel.scrollTop = 0;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) modal.classList.add('is-in');
    else {
      modal.classList.remove('is-in');
      modal.getBoundingClientRect();
      modal.classList.add('is-in');
    }
    panel.focus();
    SiteApi.availability().then(data => { slots = data.slots || []; renderCal(); }).catch(() => {});
  }

  function close() {
    modal.classList.remove('is-in');
    const finish = () => {
      modal.hidden = true;
      document.documentElement.classList.remove('is-modal');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
    else setTimeout(finish, 280);
  }

  document.addEventListener('click', ev => {
    const opener = ev.target.closest && ev.target.closest('[data-order-open]');
    if (opener) { ev.preventDefault(); open(opener); return; }
    if (modal.hidden) return;
    if (ev.target.closest && ev.target.closest('[data-order-close]')) { ev.preventDefault(); close(); return; }
    if (ev.target === modal) close();
    const nav = ev.target.closest && ev.target.closest('[data-cal]');
    if (nav && modal.contains(nav)) shiftMonth(nav.dataset.cal === 'next' ? 1 : -1);
  });

  document.addEventListener('keydown', ev => {
    if (modal.hidden) return;
    if (ev.key === 'Escape') { ev.preventDefault(); close(); return; }
    if (ev.key !== 'Tab') return;
    const list = focusables();
    if (!list.length) return;
    const first = list[0], last = list[list.length - 1];
    if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
  });

  form.addEventListener('submit', onSubmit);
  $('#order-another', modal).addEventListener('click', () => { resetFields(); panel.focus(); });
  SiteI18n.applyStatic(document);
  refresh();
  SiteI18n.on(refresh);
})();

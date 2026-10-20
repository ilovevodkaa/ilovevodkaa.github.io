/* Общая арифметика календаря для окна заказа и админки. Понедельник — первый день. */
(function (root) {
  'use strict';

  function iso(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function parseISO(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return iso(d) === s ? d : null;
  }

  function matrix(year, month) {
    const first = new Date(year, month, 1);
    const pad = (first.getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < pad; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7) cells.push(null);
    return cells;
  }

  function rank(status) {
    if (status === 'unavailable') return 3;
    if (status === 'busy') return 2;
    if (status === 'working') return 1;
    return 0;
  }

  function dayStatus(slots, day) {
    let best = '';
    for (const s of slots || []) {
      if (!s || s.date !== day) continue;
      if (rank(s.status) > rank(best)) best = s.status;
    }
    return best;
  }

  function slotsOn(slots, day) {
    return (slots || []).filter(s => s && s.date === day).slice().sort((a, b) => String(a.start || '').localeCompare(String(b.start || '')));
  }

  function monthTitle(year, month, lang) {
    const raw = new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'ru-RU', { month: 'long', year: 'numeric' }).format(new Date(year, month, 1));
    return raw.replace(/\s*г\.\s*$/, '').replace(/^./, ch => ch.toUpperCase());
  }

  function renderGrid(opts) {
    const lang = opts.lang === 'en' ? 'en' : 'ru';
    const wrap = document.createElement('div');
    wrap.className = 'cal';
    const dows = lang === 'en' ? ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'] : ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
    for (const name of dows) {
      const s = document.createElement('span');
      s.className = 'cal__dow';
      s.textContent = name;
      wrap.appendChild(s);
    }
    const today = iso(new Date());
    for (const date of matrix(opts.year, opts.month)) {
      if (!date) {
        const s = document.createElement('span');
        s.className = 'cal__empty';
        wrap.appendChild(s);
        continue;
      }
      const id = iso(date);
      const st = dayStatus(opts.slots, id);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cal__day'
        + (st ? ' is-' + st : '')
        + (id === today ? ' is-today' : '')
        + (id === opts.selected ? ' is-sel' : '');
      b.textContent = String(date.getDate());
      b.dataset.date = id;
      if (opts.label) b.setAttribute('aria-label', opts.label(id, st));
      if (opts.onPick) b.addEventListener('click', () => opts.onPick(id));
      wrap.appendChild(b);
    }
    return wrap;
  }

  root.SiteCal = { iso, parseISO, matrix, rank, dayStatus, slotsOn, monthTitle, renderGrid };
})(typeof globalThis !== 'undefined' ? globalThis : this);

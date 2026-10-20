/* Заказы и календарь занятости.
   Локальный сервер (localhost) — обычный fetch.
   Google Apps Script — без CORS: GET через JSONP, POST через скрытую форму. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.SiteApi = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function backendUrl() {
    const cfg = (rootConfig_() || '').trim();
    try {
      if (typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
        const q = new URLSearchParams(location.search).get('backend');
        if (q) return q.trim();
      }
    } catch (e) {}
    return cfg;
  }

  function rootConfig_() {
    const c = (typeof globalThis !== 'undefined' && globalThis.SITE_CONFIG) || null;
    return c && c.backendUrl ? c.backendUrl : '';
  }

  function isDirect(url) {
    try {
      const u = new URL(url, typeof location !== 'undefined' ? location.href : 'http://localhost/');
      return u.hostname === 'localhost' || u.hostname === '127.0.0.1';
    } catch (e) { return false; }
  }

  function quote(services, selectedIds, urgent, surcharge) {
    const byId = new Map((services || []).map(s => [s.id, s]));
    const items = [];
    for (const id of selectedIds || []) {
      const s = byId.get(id);
      if (s && !items.includes(s)) items.push(s);
    }
    const priced = items.filter(s => typeof s.price === 'number' && isFinite(s.price));
    const custom = items.filter(s => !(typeof s.price === 'number' && isFinite(s.price)));
    const base = priced.reduce((sum, s) => sum + s.price, 0);
    let rate = Number(surcharge);
    if (!isFinite(rate) || rate < 0) rate = 0;
    if (rate > 1) rate = 1;
    const on = !!urgent;
    const total = base * (1 + (on ? rate : 0));
    return { items, priced, custom, base, total, rate: on ? rate : 0, urgent: on };
  }

  function formatMoney(n, lang, currency) {
    const rounded = Math.round(Number(n) * 10) / 10;
    const int = Math.abs(rounded - Math.round(rounded)) < 0.001;
    const num = new Intl.NumberFormat(lang === 'en' ? 'en-GB' : 'ru-RU', {
      minimumFractionDigits: int ? 0 : 1,
      maximumFractionDigits: 1,
    }).format(int ? Math.round(rounded) : rounded);
    return num + '\u00a0' + (currency || '₽');
  }

  function percentText(rate) {
    const p = Math.round(Number(rate) * 1000) / 10;
    if (Math.abs(p - Math.round(p)) < 0.001) return String(Math.round(p));
    return String(p);
  }

  function estimateLabel(q, lang, currency) {
    const custom = lang === 'en' ? 'by agreement' : 'по договорённости';
    const plus = lang === 'en' ? ' + by agreement' : ' + по договорённости';
    const from = lang === 'en' ? 'from' : 'от';
    if (!q.items.length) return '';
    if (!q.priced.length) return custom;
    return from + ' ' + formatMoney(q.total, lang, currency) + (q.custom.length ? plus : '');
  }

  function linePrice(service, q, lang, currency) {
    const custom = lang === 'en' ? 'by agreement' : 'по договорённости';
    const from = lang === 'en' ? 'from' : 'от';
    if (!(typeof service.price === 'number' && isFinite(service.price))) return custom;
    const n = q.urgent ? service.price * (1 + q.rate) : service.price;
    return from + ' ' + formatMoney(n, lang, currency);
  }

  function basePrice(service, lang, currency) {
    const custom = lang === 'en' ? 'by agreement' : 'по договорённости';
    const from = lang === 'en' ? 'from' : 'от';
    if (!(typeof service.price === 'number' && isFinite(service.price))) return custom;
    return from + ' ' + formatMoney(service.price, lang, currency);
  }

  const DEADLINE_RU = {
    asap: 'срочно · как можно скорее',
    week: '1–2 недели',
    month: 'месяц',
    flex: 'не горит',
  };

  function telegramText(payload) {
    const lines = ['Заявка с сайта', '', 'Услуги:'];
    for (const s of payload.services || []) {
      const price = (typeof s.price === 'number' && isFinite(s.price))
        ? 'от ' + formatMoney(s.price, 'ru', '₽')
        : 'по договорённости';
      lines.push('• ' + (s.titleRu || s.title || s.id) + ' — ' + price);
    }
    lines.push('');
    if (payload.urgent) lines.push('Срочность: срочно (+' + percentText(payload.surcharge) + '%)');
    else lines.push('Срочность: нет');
    lines.push('Оценка: ' + (payload.estimateLabelRu || '—'));
    lines.push('Срок: ' + (payload.deadlineLabelRu || DEADLINE_RU[payload.deadline] || payload.deadline || '—'));
    if (payload.deadlineDate) lines.push('Дата: ' + payload.deadlineDate);
    lines.push('Имя: ' + (payload.name || '—'));
    lines.push('Контакт: ' + (payload.contact || '—'));
    lines.push('Язык сайта: ' + (payload.lang === 'en' ? 'английский' : 'русский'));
    lines.push('', 'Задача:', payload.description || '');
    return lines.join('\n');
  }

  function telegramHref(payload, telegram) {
    const base = telegram || (globalThis.SITE_CONFIG && SITE_CONFIG.telegram) || 'https://t.me/ilovecodka';
    const text = telegramText(payload);
    // Telegram режет предзаполнение примерно на 4000 символов.
    const cut = [...text].length > 3500 ? [...text].slice(0, 3500).join('') + '…' : text;
    return base + (base.includes('?') ? '&' : '?') + 'text=' + encodeURIComponent(cut);
  }

  function availability() {
    const url = backendUrl();
    if (!url) return Promise.resolve({ ok: true, slots: [] });
    if (isDirect(url)) {
      return fetch(url + (url.includes('?') ? '&' : '?') + 'action=availability', { method: 'GET' })
        .then(r => r.json())
        .then(data => ({ ok: true, slots: Array.isArray(data.slots) ? data.slots : [] }))
        .catch(() => ({ ok: true, slots: [] }));
    }
    return new Promise(resolve => {
      const cb = 'siteAvail_' + Math.random().toString(36).slice(2);
      const s = document.createElement('script');
      let done = false;
      const timer = setTimeout(() => finish({ ok: true, slots: [] }), 8000);
      function finish(data) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        try { delete globalThis[cb]; } catch (e) { globalThis[cb] = undefined; }
        s.remove();
        const slots = data && Array.isArray(data.slots) ? data.slots : [];
        resolve({ ok: true, slots });
      }
      globalThis[cb] = data => finish(data);
      s.onerror = () => finish({ ok: true, slots: [] });
      s.src = url + (url.includes('?') ? '&' : '?') + 'action=availability&callback=' + cb;
      document.head.appendChild(s);
    });
  }

  function post(payload) {
    const url = backendUrl();
    if (!url) return Promise.reject(Object.assign(new Error('no-backend'), { code: 'no-backend' }));
    if (isDirect(url)) {
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok || data.ok === false) {
          const err = new Error((data && data.error) || 'http');
          err.code = (data && data.error) || 'http';
          err.data = data;
          throw err;
        }
        return data;
      });
    }
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.name = 'gas_' + Math.random().toString(36).slice(2);
      iframe.setAttribute('aria-hidden', 'true');
      iframe.style.cssText = 'position:absolute;width:0;height:0;border:0;opacity:0';
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = url;
      form.target = iframe.name;
      form.acceptCharset = 'UTF-8';
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'payload';
      input.value = JSON.stringify(payload);
      form.appendChild(input);
      let done = false;
      const timer = setTimeout(() => finish(new Error('timeout')), 20000);
      function onMsg(ev) {
        if (ev.source !== iframe.contentWindow) return;
        let host = '';
        try { host = new URL(ev.origin).hostname; } catch (e) { return; }
        if (!/(^|\.)googleusercontent\.com$/.test(host) && host !== 'localhost' && host !== '127.0.0.1') return;
        finish(null, ev.data);
      }
      function finish(err, data) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        window.removeEventListener('message', onMsg);
        iframe.remove();
        form.remove();
        if (err) {
          err.code = err.message === 'timeout' ? 'timeout' : 'network';
          reject(err);
          return;
        }
        if (!data || data.ok === false) {
          const e = new Error((data && data.error) || 'bad');
          e.code = (data && data.error) || 'bad';
          e.data = data;
          reject(e);
          return;
        }
        resolve(data);
      }
      window.addEventListener('message', onMsg);
      document.body.appendChild(iframe);
      document.body.appendChild(form);
      form.submit();
    });
  }

  return {
    backendUrl, isDirect, quote, formatMoney, percentText, estimateLabel, linePrice, basePrice,
    telegramText, telegramHref, availability, post, DEADLINE_RU,
  };
});

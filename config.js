/* =====================================================================
   ЕДИНСТВЕННОЕ МЕСТО, ГДЕ ПРАВЯТСЯ ЦЕНЫ, НАЦЕНКА И АДРЕС БЭКЕНДА
   Этот файл подключают index.html и admin.html.
   id услуг не меняй — они уходят в таблицу. Названия (ru / en) можно.
   price — число в рублях (на сайте станет «от …») или null («по договорённости»).
   urgentSurcharge: 0.25 значит «срочно / как можно скорее» = +25% к старту.
   backendUrl: пустая строка — сайт не ломается, заявка открывается в Telegram,
   а календарь занятости просто ничем не отмечен.
   ===================================================================== */
window.SITE_CONFIG = {
  // Вставь сюда URL веб-приложения Apps Script, он заканчивается на /exec.
  // Пример: 'https://script.google.com/macros/s/XXXX/exec'
  backendUrl: '',

  telegram: 'https://t.me/ilovecodka',

  currency: '₽',

  // Наценка за срочность. 0.25 = +25%. Поменяется везде само: в окне заказа,
  // в тексте для Telegram и в том, что уходит на сервер.
  urgentSurcharge: 0.25,

  services: [
    {
      id: 'ai',
      price: 750,
      ru: 'Автоматизация на ИИ (разбор заявок, таблицы, уведомления)',
      en: 'AI automation (reading requests, spreadsheets, notifications)',
    },
    {
      id: 'bot',
      price: 750,
      ru: 'Telegram-бот',
      en: 'Telegram bot',
    },
    {
      id: 'site',
      price: 1000,
      ru: 'Сайт под ключ (лендинг или портфолио)',
      en: 'Turnkey website (landing page or portfolio)',
    },
    {
      id: 'shop',
      price: 2000,
      ru: 'Многостраничный сайт или интернет-магазин',
      en: 'Multi-page site or online store',
    },
    {
      id: 'app',
      price: 2500,
      ru: 'Приложение (веб или мобильное)',
      en: 'App (web or mobile)',
    },
    {
      id: 'fix',
      price: 500,
      ru: 'Доработка или правки существующего проекта',
      en: 'Changes to an existing project',
    },
    {
      id: 'other',
      price: null,
      ru: 'Другое',
      en: 'Something else',
    },
  ],
};

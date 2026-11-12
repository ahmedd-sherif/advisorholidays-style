/* advisorholidays.sa: every WhatsApp link opens the chat with the ready message in the page language (owner request, 12 Nov 2026).
   The floating WhatsApp button already carries the message set per language in the theme (whatsapp-chat block, "message" field).
   The other WhatsApp links (top strip button, footer number, contact page number) carry no message, so this adds one when they are
   clicked. Source of truth: the floating button's message on the same page; the texts below are only a fallback.
   Loaded from the CMS custom head (Meta Head), which is nearly full (10,000-character limit), hence a separate file. */
(function () {
  if (window.__advWaMsg) return;
  window.__advWaMsg = 1;
  var FALLBACK = {
    ar: 'السلام عليكم، أرغب في الاستفسار عن عروض الفنادق',
    en: "Hello, I'd like to ask about your hotel offers.",
    fr: "Bonjour, je souhaite me renseigner sur vos offres d'hôtels."
  };
  function lang() {
    var l = (document.documentElement.getAttribute('lang') || 'ar').slice(0, 2).toLowerCase();
    return FALLBACK[l] ? l : 'ar';
  }
  function isWa(u) { return u.hostname === 'wa.me' || /(^|\.)api\.whatsapp\.com$/.test(u.hostname); }
  function textOf(href) { try { return new URL(href, location.href).searchParams.get('text'); } catch (e) { return null; } }
  function message() {
    var l = lang();
    var f = document.querySelector("[data-block-id='whatsapp-chat'] a[href*='wa.me'], [data-block-id='whatsapp-chat'] a[href*='whatsapp.com']");
    var t = f && textOf(f.href);
    // the site-wide default message is Arabic: only reuse the floating button's text when it matches this page's language
    if (t && (l === 'ar' || t !== FALLBACK.ar)) return t;
    return FALLBACK[l];
  }
  function fix(a) {
    try {
      var u = new URL(a.href, location.href);
      if (!isWa(u)) return;
      var t = u.searchParams.get('text');
      if (t && !(t === FALLBACK.ar && lang() !== 'ar')) return; // already has a message in the right language
      var q = [];
      u.searchParams.forEach(function (v, k) { if (k !== 'text') q.push(encodeURIComponent(k) + '=' + encodeURIComponent(v)); });
      q.push('text=' + encodeURIComponent(message()));
      u.search = '?' + q.join('&');
      a.href = u.toString();
    } catch (e) {}
  }
  function onPoint(e) {
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if (a) fix(a);
  }
  document.addEventListener('click', onPoint, true);
  document.addEventListener('auxclick', onPoint, true);
  document.addEventListener('contextmenu', onPoint, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter') onPoint(e); }, true);
})();

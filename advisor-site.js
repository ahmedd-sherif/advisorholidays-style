/* advisorholidays.sa site add-ons, loaded from the CMS custom head (Meta Head) with one line, because the head is nearly full (10,000 characters).
   1. WhatsApp: every WhatsApp link opens the chat with the ready message in the page language (12 Nov 2026).
   2. Hotel picker: an optional "Hotel" field after the destination in the hotel search (13 Nov 2026).
   Each part checks its own preconditions and does nothing if the page changed under it; the site keeps working without this file. */

/* ---------- 1. WhatsApp message in the page language ----------
   The floating WhatsApp button carries the message set per language in the theme (whatsapp-chat block, "message" field).
   The other WhatsApp links (top strip button, footer number, contact page number) carry none, so this adds the floating button's
   message, in the page language, when they are clicked. The texts below are only a fallback. */
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
    if (t && (l === 'ar' || t !== FALLBACK.ar)) return t;
    return FALLBACK[l];
  }
  function fix(a) {
    try {
      var u = new URL(a.href, location.href);
      if (!isWa(u)) return;
      var t = u.searchParams.get('text');
      if (t && !(t === FALLBACK.ar && lang() !== 'ar')) return;
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

/* ---------- 2. Hotel picker in the hotel search ----------
   After the destination (select[name=city]) the hotel search gets an optional "Hotel" field that lists the hotels of the chosen city,
   from the site's own public list (/api/common/hotels_autocomplete, names in the page language), cached for 30 minutes per language.
   Empty = the normal search (results list). A hotel chosen = "Search" opens that hotel's page with the same dates and rooms:
   the theme's own navigation to /hotels/search?city=..&checkIn=..&checkOut=..&rooms=.. is redirected to /hotels/<slug>?checkIn=..&checkOut=..&rooms=..
   only for the few seconds after that form was submitted, so filters and sorting on the results page are never touched.
   The field is styled in advisor-brand.css ([data-adv-hotel]). If the hotel list cannot be loaded, the field hides itself. */
(function () {
  if (window.__advHotelPick) return;
  window.__advHotelPick = 1;
  var T = {
    ar: { label: 'الفندق (اختياري)', all: 'كل الفنادق', loading: 'جارٍ تحميل الفنادق…', none: 'لا توجد فنادق', noneFull: 'لا توجد فنادق في هذه الوجهة' },
    en: { label: 'Hotel (optional)', all: 'All hotels', loading: 'Loading hotels…', none: 'No hotels', noneFull: 'No hotels in this destination' },
    fr: { label: 'Hôtel (facultatif)', all: 'Tous les hôtels', loading: 'Chargement des hôtels…', none: 'Aucun hôtel', noneFull: 'Aucun hôtel pour cette destination' }
  };
  var CACHE_MS = 30 * 60 * 1000, data = {}, cityMap = {}, pending = null, started = false;
  var DEST = '[data-theme-property*=destination]'; // the label key "destination" (lower case, so the airport form's "arrivalDestination" never matches)
  function lang() {
    var l = (document.documentElement.getAttribute('lang') || 'ar').slice(0, 2).toLowerCase();
    return T[l] ? l : 'ar';
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s || '').replace(/[ً-ْـ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase(); }
  function getJson(u) { return fetch(u, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  function load(l) {
    if (data[l]) return data[l];
    var key = 'adv-hotels-v2-' + l;
    try {
      var c = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (c && Date.now() - c.t < CACHE_MS && c.v && c.v.by) { cityMap[l] = c.v.cities; return (data[l] = Promise.resolve(c.v)); }
    } catch (e) {}
    data[l] = Promise.all([
      getJson('/api/common/hotels_autocomplete?limit=500&locale=' + l),
      getJson('/api/common/cities?locale=' + l)
    ]).then(function (res) {
      var cityByName = {}, by = {};
      (res[1] || []).forEach(function (c) { if (c && c.slug) cityByName[norm(c.name)] = c.slug; });
      (res[0] || []).forEach(function (h) {
        var s = h && cityByName[norm(h.city)];
        if (!s || !h.slug || !h.name) return;
        (by[s] = by[s] || []).push({ slug: h.slug, name: String(h.name).trim() });
      });
      Object.keys(by).forEach(function (k) { by[k].sort(function (a, b) { return a.name.localeCompare(b.name, l); }); });
      var v = { by: by, cities: cityByName };
      cityMap[l] = cityByName;
      try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v: v })); } catch (e) {}
      return v;
    });
    data[l].catch(function () { delete data[l]; });
    return data[l];
  }
  // the destination cell = the grid item that holds the destination label (desktop: a select with a hidden native select[name=city];
  // phones: a button that opens a sheet and shows the city name)
  function destCell(form) {
    var lab = form.querySelector(DEST), cell = lab && lab.closest('[data-slot=form-item]');
    if (!cell || !form.contains(cell) || !cell.parentElement || !/\bgrid\b/.test(cell.parentElement.className)) return null;
    return cell; // its parent is the form's field grid
  }
  function cityOf(form) {
    var s = form.querySelector('select[name=city]');
    if (s && s.value) return s.value;
    var cell = destCell(form), map = cityMap[lang()];
    if (!cell || !map) return '';
    var shown = cell.querySelector('button span.truncate, button [data-slot=select-value], button span');
    var name = norm(shown ? shown.textContent : '');
    return map[name] || '';
  }
  function build(cell) {
    var t = T[lang()], id = 'adv-hotel-' + Math.random().toString(36).slice(2, 8);
    var wrap = document.createElement('div');
    wrap.className = 'adv-hotel-field';
    wrap.setAttribute('data-adv-hotel', '');
    var srcLab = cell.querySelector('label');
    var lab = document.createElement('label');
    lab.className = (srcLab ? srcLab.className + ' ' : '') + 'adv-hotel-label';
    lab.htmlFor = id;
    lab.textContent = t.label;
    var box = document.createElement('div');
    box.className = 'adv-hotel-box';
    var sel = document.createElement('select');
    sel.id = id;
    sel.className = 'adv-hotel-select';
    sel.disabled = true;
    sel.innerHTML = '<option value="">' + esc(t.loading) + '</option>';
    box.appendChild(sel);
    wrap.appendChild(lab);
    wrap.appendChild(box);
    return wrap;
  }
  function fill(form, wrap, force) {
    var l = lang(), city = cityOf(form), t = T[l];
    if (!force && wrap.__city === city && wrap.__lang === l) return;
    wrap.__city = city; wrap.__lang = l;
    var sel = wrap.querySelector('select');
    if (wrap.querySelector('label').textContent !== t.label) wrap.querySelector('label').textContent = t.label;
    load(l).then(function (v) {
      if (!city) { city = cityOf(form); wrap.__city = city; } // phones: the city name could only be matched once the city list was in
      if (cityOf(form) !== city || lang() !== l) return; // changed meanwhile: sync() refills
      var list = v.by[city] || [], keep = sel.value;
      sel.innerHTML = '<option value="">' + esc(list.length ? t.all : t.none) + '</option>' +
        list.map(function (h) { return '<option value="' + esc(h.slug) + '">' + esc(h.name) + '</option>'; }).join('');
      sel.disabled = !list.length;
      if (list.length) sel.removeAttribute('title'); else sel.title = t.noneFull; // short text in the box, full sentence on hover
      if (keep && list.some(function (h) { return h.slug === keep; })) sel.value = keep;
      wrap.removeAttribute('hidden');
      wrap.setAttribute('data-adv-state', list.length ? 'ready' : 'empty');
    }, function () {
      wrap.setAttribute('data-adv-state', 'error');
      wrap.setAttribute('hidden', '');
      sel.value = '';
    });
  }
  function forms() {
    return Array.prototype.filter.call(document.querySelectorAll('form'), function (f) {
      return f.querySelector(DEST) && !f.closest("[data-block-id='hotel-detail-content']");
    });
  }
  function mountAll() {
    forms().forEach(function (form) {
      var cell = destCell(form);
      if (!cell) return;
      var wrap = form.querySelector('[data-adv-hotel]');
      if (!wrap) wrap = build(cell);
      if (cell.nextElementSibling !== wrap) cell.parentElement.insertBefore(wrap, cell.nextElementSibling);
      fill(form, wrap, false);
    });
  }
  function sync() {
    document.querySelectorAll('[data-adv-hotel]').forEach(function (wrap) {
      var form = wrap.closest('form');
      if (form) fill(form, wrap, false);
    });
  }
  function remember(form) {
    var sel = form && form.querySelector('[data-adv-hotel] select');
    pending = sel && sel.value ? { slug: sel.value, city: cityOf(form), at: Date.now() } : null;
  }
  document.addEventListener('submit', function (e) { if (e.target && e.target.querySelector) remember(e.target); }, true);
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('button[type=submit]');
    if (b && b.form && b.form.querySelector('[data-adv-hotel]')) remember(b.form);
  }, true);
  function hookRouter(app) {
    var r = app && app.config.globalProperties.$router;
    if (!r || r.__advHotel) return;
    r.__advHotel = 1;
    r.beforeEach(function (to) {
      if (!pending || Date.now() - pending.at > 5000) return true;
      var m = /^(.*)\/hotels\/search\/?$/.exec(to.path);
      if (!m) return true;
      var p = pending;
      pending = null;
      if (to.query && to.query.city && p.city && to.query.city !== p.city) return true;
      var q = {};
      Object.keys(to.query || {}).forEach(function (k) { if (k !== 'city') q[k] = to.query[k]; });
      return { path: m[1] + '/hotels/' + encodeURIComponent(p.slug), query: q };
    });
  }
  function app() { var el = document.querySelector('#__nuxt'); return el ? el.__vue_app__ : null; }
  function go() {
    if (started) return;
    var a = app();
    if (!a) return;
    started = true;
    hookRouter(a);
    mountAll();
    var t = null;
    new MutationObserver(function () { clearTimeout(t); t = setTimeout(mountAll, 120); }).observe(document.body, { childList: true, subtree: true });
    setInterval(sync, 500);
    (window.requestIdleCallback || function (f) { setTimeout(f, 1200); })(function () { if (forms().length) load(lang()); });
  }
  function start() {
    var a = app();
    if (!a) { setTimeout(start, 300); return; }
    var nuxt = a.config.globalProperties.$nuxt;
    if (nuxt && nuxt.isHydrating && nuxt.hooks && nuxt.hooks.hookOnce) {
      nuxt.hooks.hookOnce('app:suspense:resolve', function () { setTimeout(go, 0); });
      setTimeout(go, 6000); // safety net if the hook never fires
    } else {
      go();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

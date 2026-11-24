/* advisorholidays.sa site add-ons, loaded from the CMS custom head (Meta Head) with one line, because the head is nearly full (10,000 characters).
   1. WhatsApp: every WhatsApp link opens the chat with the ready message in the page language (12 Nov 2026).
   2. Hotel picker: an optional "Hotel" field after the destination in the hotel search (13 Nov 2026; the site's own list v1.0.6).
   3. Date pickers: a Done bar (the chosen stay and its nights + «تم / Done / Valider») under every calendar pop-up (13 Nov 2026).
   4. Product tabs: on every page that shows the search band (home, results pages, hotel pages) a tab for another product opens that product's
      page (13 Nov 2026; the home page since 14 Nov 2026).
   5. Contact page: the Subject becomes a drop-down with an "Other" text and an optional hotel (13 Nov 2026).
   6. Header, floating buttons, footer: the phone menu's first outside tap only closes it, a real menu button, floating buttons tucked on the first screen
      while they would cover a control, the Hotels header item marked on hotel pages, empty store badges out of the tab order (14 Nov 2026).
   7. Pop-ups: a Done bar for guests and rooms, calendars kept inside the window, month names on the phone calendar, no keyboard on phone filters (14 Nov 2026).
   8. Page changes: the pager goes to the top of the list; /transport title, breadcrumb, heading and start prompt follow the mode; /packages heading (14 Nov 2026).
   9. Transport place lists: "loading" while their places are fetched, instead of "no options available" (14 Nov 2026).
   10. French (and English) pages: the theme's Arabic leftovers replaced by the page language's text (14 Nov 2026).
   11. Services list: each service card gets the kind of service (meal, parking, visa...) for its icon (20 Nov 2026).
   12. Booking: «أكمل الحجز عبر واتساب» / Complete booking on WhatsApp next to «احجز» and on /hotels/booking-request, with the stay in the
       message and a GA4 event (24 Nov 2026).
   v1.0.11 = v1.0.10 + part 12 (card payment is the only way to book and no web card payment has gone through yet; asked by the ads review).
   v1.0.10 = v1.0.9 + part 11, for Jood's new service cards (about 15 Nov 2026; the new card look is in advisor-brand.css), and part 6
   lifts the floating buttons over the hotel page's booking bar below 1280px (owner: the WhatsApp and assistant buttons never go away).
   v1.0.9 = v1.0.8 + fixes for Jood's theme update of 15 Nov 2026: part 6 also tucks the theme's phone help pill («مساعدة» / Help; never while
   its menu is open or focused) and keeps every floating button off the hotel booking card's «احجز» and the stay summary's «تغيير»; part 10
   translates the new Arabic theme strings on French pages (help menu, results «تعديل البحث», the hotel page's labels, nights and rooms).
   v1.0.9 review fixes (19 Nov): a tapped help pill is tucked again once its menu is closed (only keyboard focus holds it); on French pages
   the stay calendar's Arabic label, the theme's own French counts («1 chambres», «0 enfants», «prix pour 2 nuit») and a no-break space before «:».
   v1.0.8 = v1.0.7 + site-wide QA fixes F01-F40 as shipped (F11 left to Jood, F30 Arabic only): parts 6-10 (window flags __advChrome,
   __advPop7, __advRoutes, __advForms, __advI18n) and small fixes in parts 1, 2, 3 and 5 (WhatsApp message source, wait for
   advisor-brand.css before replacing theme controls, contact hotel list side). Part 4 (v1.0.7 tabs) is unchanged.
   v1.0.8 fix2 (second review, 15 Nov 2026): parts 2, 3, 5, 6, 7, 8 and 10 start only once Nuxt has hydrated the page (its hook, or its
   isHydrating flag polled), never on a fixed 6 s timer that could change the page in the middle of a slow hydration; part 10's French
   assistant label is shorter.
   v1.0.7 (v1.0.6 + home tabs navigate, capitalised sheet labels): part 4 also on the home page (and any other page with the band), and it
   stays busy until a slow navigation resolves (the capitalised labels are in advisor-brand.css). The busy tab shows a spinner and the form
   under it waits (dimmed, inert); a later navigation (Services, a link, Back) ends the busy look at once. Part 2: WebKit viewport-scroll fix.
   v1.0.6 = v1.0.5 + the site's own hotel list in part 2 + parts 3, 4 and 5 (window flags __advPopups, __advTabs, __advPages).
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
    // v1.0.8: the block id sits on the <a> itself (the descendant selector alone never matched, so the fallback texts were used)
    var f = document.querySelector("a[data-block-id='whatsapp-chat'][href*='wa.me'], a[data-block-id='whatsapp-chat'][href*='whatsapp.com'], [data-block-id='whatsapp-chat'] a[href*='wa.me'], [data-block-id='whatsapp-chat'] a[href*='whatsapp.com']");
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
   The field is styled in advisor-brand.css ([data-adv-hotel], .adv-hl-*). If the hotel list cannot be loaded, the field hides itself.
   v1.0.6 (owner request 2026-11-13): the browser's own drop-down (as tall as the screen, Windows blue) is replaced by the site's list:
   a button drawn like the old box opens a panel (div[data-adv-pop].adv-hl-pop) under the field, or above it when there is no room below,
   at most 320px of rows with a visible scrollbar and a search box (Arabic letter forms and Latin accents folded, slugs match English typing).
   The panel is put in <body> (inside the open sheet on the results page), positioned against the field and kept there on scroll and resize.
   The value still lives in a hidden native select (same class), so the search redirect below reads it as before. */
(function () {
  if (window.__advHotelPick) return;
  window.__advHotelPick = 1;
  var T = {
    ar: { label: 'الفندق (اختياري)', all: 'كل الفنادق', loading: 'جارٍ تحميل الفنادق…', none: 'لا توجد فنادق', noneFull: 'لا توجد فنادق في هذه الوجهة', search: 'ابحث عن فندق…', noMatch: 'لا يوجد فندق بهذا الاسم' },
    en: { label: 'Hotel (optional)', all: 'All hotels', loading: 'Loading hotels…', none: 'No hotels', noneFull: 'No hotels in this destination', search: 'Search hotels…', noMatch: 'No hotel matches this name' },
    fr: { label: 'Hôtel (facultatif)', all: 'Tous les hôtels', loading: 'Chargement des hôtels…', none: 'Aucun hôtel', noneFull: 'Aucun hôtel pour cette destination', search: 'Rechercher un hôtel…', noMatch: 'Aucun hôtel ne correspond' }
  };
  var CACHE_MS = 30 * 60 * 1000, data = {}, cityMap = {}, pending = null, started = false;
  var DEST = '[data-theme-property*=destination]'; // the label key "destination" (lower case, so the airport form's "arrivalDestination" never matches)
  var LIST_MAX = 320, MIN_ROWS = 108, GAP = 6, EDGE = 12, cur = null;
  var ICON_SEARCH = '<svg class="adv-hl-ico" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  function lang() {
    var l = (document.documentElement.getAttribute('lang') || 'ar').slice(0, 2).toLowerCase();
    return T[l] ? l : 'ar';
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s || '').replace(/[ً-ْـ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase(); }
  // search key: lower case, Latin accents dropped, Arabic tashkeel/tatweel dropped, أ إ آ ٱ -> ا, ة -> ه, ى -> ي, dashes and punctuation -> spaces
  function key(s) {
    s = String(s || '').toLowerCase();
    try { s = s.normalize('NFD'); } catch (e) {}
    return s.replace(/[̀-ًͯ-ٰٟـ]/g, '').replace(/[آأإٱ]/g, 'ا')
      .replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[\s\-_.,'’()\/&]+/g, ' ').trim();
  }
  function getJson(u) { return fetch(u, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  function load(l) {
    if (data[l]) return data[l];
    var k = 'adv-hotels-v2-' + l;
    try {
      var c = JSON.parse(sessionStorage.getItem(k) || 'null');
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
      Object.keys(by).forEach(function (x) { by[x].sort(function (a, b) { return a.name.localeCompare(b.name, l); }); });
      var v = { by: by, cities: cityByName };
      cityMap[l] = cityByName;
      try { sessionStorage.setItem(k, JSON.stringify({ t: Date.now(), v: v })); } catch (e) {}
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

  /* ----- the field: label, a button drawn like a select (opens the list), the value in a hidden native select ----- */
  function build(cell) {
    var t = T[lang()], id = 'adv-hotel-' + Math.random().toString(36).slice(2, 8);
    var wrap = document.createElement('div');
    wrap.className = 'adv-hotel-field';
    wrap.setAttribute('data-adv-hotel', '');
    var srcLab = cell.querySelector('label');
    var lab = document.createElement('label');
    lab.className = (srcLab ? srcLab.className + ' ' : '') + 'adv-hotel-label';
    lab.id = id + '-l';
    lab.htmlFor = id;
    lab.textContent = t.label;
    var box = document.createElement('div');
    box.className = 'adv-hotel-box';
    var trig = document.createElement('button');
    trig.type = 'button';
    trig.id = id;
    trig.className = 'adv-hl-trigger';
    trig.disabled = true;
    trig.setAttribute('role', 'combobox');
    trig.setAttribute('aria-haspopup', 'listbox');
    trig.setAttribute('aria-expanded', 'false');
    trig.setAttribute('aria-labelledby', id + '-l');
    trig.innerHTML = '<span class="adv-hl-value"></span>';
    var sel = document.createElement('select');
    sel.className = 'adv-hotel-select';
    sel.hidden = true;
    sel.tabIndex = -1;
    sel.setAttribute('aria-hidden', 'true');
    sel.disabled = true;
    sel.innerHTML = '<option value="">' + esc(t.loading) + '</option>';
    box.appendChild(trig);
    box.appendChild(sel);
    wrap.appendChild(lab);
    wrap.appendChild(box);
    wrap.__trig = trig; wrap.__sel = sel; wrap.__items = [];
    show(wrap);
    // like a native select, the label only focuses the field (a button label would also press it)
    lab.addEventListener('click', function (e) { e.preventDefault(); if (!trig.disabled) trig.focus(); });
    trig.addEventListener('click', function () { guard(function () { if (cur && cur.wrap === wrap) close(false); else open(wrap); }); });
    trig.addEventListener('keydown', function (e) { guard(function () { trigKey(wrap, e); }); });
    sel.addEventListener('change', function () { show(wrap); });
    return wrap;
  }
  function guard(f) { try { f(); } catch (e) { try { close(false); } catch (x) {} } }
  // the button shows the chosen option's text (or "All hotels" / "Loading…" / "No hotels")
  function show(wrap) {
    var sel = wrap.__sel, trig = wrap.__trig, o = sel.options[sel.selectedIndex] || sel.options[0];
    var v = trig.firstChild, txt = o ? o.text : '';
    if (v.textContent !== txt) v.textContent = txt;
    trig.disabled = sel.disabled;
  }
  function fill(form, wrap, force) {
    var l = lang(), city = cityOf(form), t = T[l];
    if (!force && wrap.__city === city && wrap.__lang === l) return;
    wrap.__city = city; wrap.__lang = l;
    if (cur && cur.wrap === wrap) close(false);
    var sel = wrap.__sel, trig = wrap.__trig;
    if (wrap.querySelector('label').textContent !== t.label) wrap.querySelector('label').textContent = t.label;
    load(l).then(function (v) {
      if (!city) { city = cityOf(form); wrap.__city = city; } // phones: the city name could only be matched once the city list was in
      if (cityOf(form) !== city || lang() !== l) return; // changed meanwhile: sync() refills
      if (cur && cur.wrap === wrap) close(false);
      var list = v.by[city] || [], keep = sel.value;
      sel.innerHTML = '<option value="">' + esc(list.length ? t.all : t.none) + '</option>' +
        list.map(function (h) { return '<option value="' + esc(h.slug) + '">' + esc(h.name) + '</option>'; }).join('');
      sel.disabled = !list.length;
      wrap.__items = list.map(function (h) { return { v: h.slug, t: h.name, k: ' ' + key(h.name) + ' ' + key(h.slug) + ' ' }; });
      if (list.length) trig.removeAttribute('title'); else trig.title = t.noneFull; // short text in the box, full sentence on hover
      if (keep && list.some(function (h) { return h.slug === keep; })) sel.value = keep;
      show(wrap);
      wrap.removeAttribute('hidden');
      wrap.setAttribute('data-adv-state', list.length ? 'ready' : 'empty');
    }, function () {
      if (cur && cur.wrap === wrap) close(false);
      wrap.setAttribute('data-adv-state', 'error');
      wrap.setAttribute('hidden', '');
      sel.value = '';
    });
  }

  /* ----- the list ----- */
  function touch() { try { return matchMedia('(hover: none), (pointer: coarse)').matches; } catch (e) { return false; } }
  function phone() { return (document.documentElement.clientWidth || innerWidth) < 768; }
  function open(wrap) {
    var trig = wrap.__trig, sel = wrap.__sel;
    if (!trig || trig.disabled || !trig.isConnected) return;
    if (cur) close(false);
    // keyboard on a focused field that the page has scrolled away (the list would close at once): bring the field into view first
    var vv0 = window.visualViewport, r0 = trig.getBoundingClientRect(), vt = vv0 ? vv0.offsetTop : 0, vb = vv0 ? vv0.offsetTop + vv0.height : innerHeight;
    if (r0.width && (r0.bottom <= vt || r0.top >= vb)) { try { trig.scrollIntoView({ block: 'center' }); } catch (e) { trig.scrollIntoView(); } }
    var t = T[lang()], id = trig.id, cs = getComputedStyle(trig);
    // inside a modal sheet (results page on phones) the panel must stay inside it: the sheet keeps focus and pointer events to itself
    var host = trig.closest('[role=dialog]') || document.body;
    var pop = document.createElement('div');
    pop.className = 'adv-hl-pop';
    pop.setAttribute('data-adv-pop', '');
    pop.setAttribute('dir', cs.direction === 'rtl' ? 'rtl' : 'ltr');
    pop.setAttribute('lang', lang());
    pop.style.fontFamily = cs.fontFamily;
    if (phone()) pop.setAttribute('data-adv-phone', '');
    pop.innerHTML = '<div class="adv-hl-search">' + ICON_SEARCH + '<input class="adv-hl-q" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search"' +
      ' role="combobox" aria-expanded="true" aria-autocomplete="list" aria-controls="' + id + '-lb" aria-label="' + esc(t.search.replace(/…$/, '')) + '" placeholder="' + esc(t.search) + '"></div>' +
      '<div class="adv-hl-list" id="' + id + '-lb" role="listbox" aria-labelledby="' + id + '-l" tabindex="-1"></div>';
    host.appendChild(pop);
    var c = cur = { wrap: wrap, trig: trig, sel: sel, pop: pop, host: host, input: pop.querySelector('input'), list: pop.querySelector('.adv-hl-list'), act: -1, raf: 0, opts: [], fixX: 0, fixY: 0 };
    render(c, '');
    trig.setAttribute('aria-expanded', 'true');
    trig.setAttribute('aria-controls', id + '-lb');
    wrap.setAttribute('data-adv-open', '');
    place(c, 'open');
    active(c, Math.max(0, selIndex(c)), true);
    c.input.addEventListener('input', function () { guard(function () { if (cur === c) { render(c, c.input.value); place(c, 'type'); active(c, c.opts.length > 1 && c.input.value.trim() ? 1 : Math.max(0, selIndex(c)), true); } }); });
    pop.addEventListener('keydown', function (e) { guard(function () { listKey(c, e); }); });
    c.list.addEventListener('click', function (e) { guard(function () { var o = e.target.closest && e.target.closest('.adv-hl-opt'); if (o && cur === c) pick(c, o.getAttribute('data-v')); }); });
    c.list.addEventListener('mousemove', function (e) { var o = e.target.closest && e.target.closest('.adv-hl-opt'); if (o && cur === c) { var i = c.opts.indexOf(o); if (i !== c.act) active(c, i, false); } });
    // the wheel over the panel never scrolls the page: the rows scroll themselves (overscroll-behavior: contain stops at their ends);
    // over the search box, the panel's edge or a list too short to scroll, the wheel does nothing (Ctrl+wheel still zooms)
    try {
      pop.addEventListener('wheel', function (e) {
        if (cur !== c || e.ctrlKey) return;
        if (c.list.contains(e.target) && c.list.scrollHeight > c.list.clientHeight + 1) return;
        e.preventDefault();
      }, { passive: false });
    } catch (e) {}
    c.onDown = function (e) { if (cur === c && !pop.contains(e.target) && !trig.contains(e.target)) close(false); };
    c.onFocus = function (e) { if (cur === c && e.target !== document && e.target !== window && !pop.contains(e.target) && !trig.contains(e.target)) close(false); };
    // page or sheet scrolled, window resized: follow the field (once per frame). A visualViewport 'scroll' (the phone keyboard moved the
    // visual viewport) has the VisualViewport as its target, not a node: WebKit throws on pop.contains() of it, so only elements are tested.
    c.onMove = function (e) {
      if (cur !== c || (e && e.type === 'scroll' && (e.target === c.list || (e.target && e.target.nodeType === 1 && pop.contains(e.target))))) return;
      if (e && e.type === 'resize') c.pend = 'resize'; else if (!c.pend) c.pend = 'scroll';
      if (c.raf) return;
      c.raf = (window.requestAnimationFrame || setTimeout)(function () { var m = c.pend; c.raf = 0; c.pend = ''; guard(function () { if (cur === c) place(c, m); }); });
    };
    document.addEventListener('pointerdown', c.onDown, true);
    document.addEventListener('focusin', c.onFocus, true);
    window.addEventListener('scroll', c.onMove, true);
    window.addEventListener('resize', c.onMove);
    if (window.visualViewport) { visualViewport.addEventListener('resize', c.onMove); visualViewport.addEventListener('scroll', c.onMove); }
    // desktop: type straight away; touch screens keep the keyboard closed until the search box is tapped
    if (!touch()) { try { c.input.focus({ preventScroll: true }); } catch (e) { c.input.focus(); } }
  }
  function close(focus) {
    var c = cur;
    if (!c) return;
    cur = null;
    document.removeEventListener('pointerdown', c.onDown, true);
    document.removeEventListener('focusin', c.onFocus, true);
    window.removeEventListener('scroll', c.onMove, true);
    window.removeEventListener('resize', c.onMove);
    if (window.visualViewport) { visualViewport.removeEventListener('resize', c.onMove); visualViewport.removeEventListener('scroll', c.onMove); }
    if (c.pop.parentNode) c.pop.parentNode.removeChild(c.pop);
    c.trig.setAttribute('aria-expanded', 'false');
    c.trig.removeAttribute('aria-controls');
    c.trig.removeAttribute('aria-activedescendant');
    c.wrap.removeAttribute('data-adv-open');
    if (focus && c.trig.isConnected) { try { c.trig.focus({ preventScroll: true }); } catch (e) { c.trig.focus(); } }
  }
  function selIndex(c) {
    var v = c.sel.value;
    for (var i = 0; i < c.opts.length; i++) if (c.opts[i].getAttribute('data-v') === v) return i;
    return -1;
  }
  function row(c, i, v, text, cls) {
    var on = c.sel.value === v;
    return '<div class="adv-hl-opt' + (cls ? ' ' + cls : '') + '" role="option" id="' + c.trig.id + '-o' + i + '" data-v="' + esc(v) + '" aria-selected="' + on + '"><span class="adv-hl-txt">' + esc(text) + '</span></div>';
  }
  // "All hotels" always first, then the hotels whose name (or slug) holds every typed word; names that start with the first word come first
  function render(c, q) {
    var t = T[lang()], words = key(q).split(' ').filter(Boolean), items = c.wrap.__items || [], first = [], rest = [], i, j, it, ok;
    for (i = 0; i < items.length; i++) {
      it = items[i]; ok = true;
      for (j = 0; j < words.length && ok; j++) ok = it.k.indexOf(words[j]) >= 0;
      if (!ok) continue;
      if (words.length && it.k.indexOf(' ' + words[0]) < 0) rest.push(it); else first.push(it);
    }
    var hits = first.concat(rest), html = row(c, 0, '', t.all, 'adv-hl-all');
    for (i = 0; i < hits.length; i++) html += row(c, i + 1, hits[i].v, hits[i].t, '');
    if (!hits.length) html += '<div class="adv-hl-none" role="option" aria-disabled="true" aria-selected="false" id="' + c.trig.id + '-none">' + esc(t.noMatch) + '</div>';
    c.list.innerHTML = html;
    c.list.scrollTop = 0;
    c.opts = Array.prototype.slice.call(c.list.querySelectorAll('.adv-hl-opt'));
    c.act = -1;
  }
  function active(c, i, scroll) {
    if (!c.opts.length) return;
    i = Math.max(0, Math.min(c.opts.length - 1, i));
    if (c.opts[c.act]) c.opts[c.act].removeAttribute('data-active');
    c.act = i;
    var o = c.opts[i];
    o.setAttribute('data-active', '');
    c.trig.setAttribute('aria-activedescendant', o.id);
    c.input.setAttribute('aria-activedescendant', o.id);
    if (scroll) {
      var l = c.list, top = o.offsetTop, bot = top + o.offsetHeight;
      if (top < l.scrollTop + 6) l.scrollTop = Math.max(0, top - 6);
      else if (bot > l.scrollTop + l.clientHeight - 6) l.scrollTop = bot - l.clientHeight + 6;
    }
  }
  function pick(c, v) {
    if (c.sel.value !== v) {
      c.sel.value = v;
      var ev;
      try { ev = new Event('change', { bubbles: true }); } catch (e) { ev = document.createEvent('Event'); ev.initEvent('change', true, false); }
      c.sel.dispatchEvent(ev);
    }
    show(c.wrap);
    close(true);
  }
  // under the field with a 6px gap; above it only when there is not enough room below for a useful list (the search box and 108px of rows,
  // MIN_ROWS: "All hotels" and two hotels) and more room above, as the theme's destination list does: in the middle of the screen
  // the list opens downwards and its rows shrink to the room left (v1.0.6 fix: it used to need the whole 380px panel below, so it opened
  // upwards from mid-screen).
  // Rows at most 320px (phones: also half the screen) and never more than the free space minus 12px.
  // mode: 'open' and 'resize' measure everything; 'type' keeps the side and width it opened with (the panel would jump while the rows
  // are filtered); 'scroll' keeps the width and chooses the side again
  function place(c, mode) {
    var trig = c.trig, pop = c.pop, list = c.list;
    if (!trig.isConnected || !c.wrap.isConnected) { close(false); return; }
    var r = trig.getBoundingClientRect(), vv = window.visualViewport;
    var top = vv ? vv.offsetTop : 0, bottom = vv ? vv.offsetTop + vv.height : innerHeight;
    var left = 0, right = document.documentElement.clientWidth || innerWidth;
    if (c.host !== document.body) { var h = c.host.getBoundingClientRect(); top = Math.max(top, h.top); bottom = Math.min(bottom, h.bottom); left = Math.max(left, h.left); right = Math.min(right, h.right); }
    // the field scrolled out of sight: close; keyboard focus (in the search box) goes back to the field, as with Escape
    if (!r.width || r.bottom <= top || r.top >= bottom) { close(pop.contains(document.activeElement)); return; }
    var ph = phone(), cap = ph ? Math.min(LIST_MAX, Math.round(innerHeight / 2)) : LIST_MAX;
    // width: the field's width at least; on larger screens up to 360px for long names (rows wrap past that)
    if (!c.w || mode === 'open' || mode === 'resize') {
      var minW = Math.round(r.width), maxW = ph ? minW : Math.max(minW, 360);
      maxW = Math.min(maxW, Math.max(minW, right - left - 16));
      pop.style.minWidth = minW + 'px';
      pop.style.maxWidth = maxW + 'px';
      pop.style.width = '';
      list.style.maxHeight = cap + 'px';
      c.w = ph ? minW : Math.ceil(pop.getBoundingClientRect().width);
    }
    pop.style.width = c.w + 'px';
    list.style.maxHeight = cap + 'px';
    var full = pop.offsetHeight, rows = list.offsetHeight, chrome = full - rows;
    var below = bottom - r.bottom - GAP - EDGE, above = r.top - top - GAP - EDGE;
    var need = Math.min(full, chrome + MIN_ROWS); // a short list needs its own height; a long one the search box and 108px of rows
    var side = mode === 'type' && c.side ? c.side : (need <= below || below >= above) ? 'bottom' : 'top';
    c.side = side;
    var room = side === 'bottom' ? below : above;
    var listH = Math.max(Math.min(rows, room - chrome), Math.min(rows, 88)); // never less than about two rows
    list.style.maxHeight = Math.min(cap, listH) + 'px';
    if (list.scrollHeight > list.clientHeight + 1) list.setAttribute('data-scroll', ''); else list.removeAttribute('data-scroll');
    var w = pop.offsetWidth, hgt = pop.offsetHeight;
    var x = pop.getAttribute('dir') === 'rtl' ? r.right - w : r.left;
    x = Math.max(left + 8, Math.min(x, right - 8 - w));
    var y = side === 'bottom' ? r.bottom + GAP : r.top - GAP - hgt;
    pop.setAttribute('data-side', side);
    // position:fixed is relative to the viewport unless an ancestor (a sheet mid-animation) makes its own box: measure and correct once
    pop.style.left = (x + c.fixX) + 'px';
    pop.style.top = (y + c.fixY) + 'px';
    var got = pop.getBoundingClientRect();
    if (Math.abs(got.left - x) > 0.5 || Math.abs(got.top - y) > 0.5) {
      c.fixX += x - got.left; c.fixY += y - got.top;
      pop.style.left = (x + c.fixX) + 'px';
      pop.style.top = (y + c.fixY) + 'px';
    }
  }
  var MOVE = { ArrowDown: 1, Down: 1, ArrowUp: -1, Up: -1, PageDown: 8, PageUp: -8 };
  function listKey(c, e) {
    var k = e.key, inInput = e.target === c.input;
    if (k === 'Escape' || k === 'Esc') { e.preventDefault(); e.stopPropagation(); close(true); return; }
    if (k === 'Tab') { close(false); try { c.trig.focus({ preventScroll: true }); } catch (x) { c.trig.focus(); } return; } // the browser moves on from the field
    if (k === 'Enter') { e.preventDefault(); e.stopPropagation(); if (c.opts[c.act]) pick(c, c.opts[c.act].getAttribute('data-v')); else close(true); return; }
    if ((k === 'ArrowUp' || k === 'Up') && e.altKey) { e.preventDefault(); if (c.opts[c.act]) pick(c, c.opts[c.act].getAttribute('data-v')); else close(true); return; }
    if (MOVE[k]) { e.preventDefault(); active(c, c.act < 0 ? 0 : c.act + MOVE[k], true); return; }
    if ((k === 'Home' || k === 'End') && !(inInput && c.input.value)) { e.preventDefault(); active(c, k === 'Home' ? 0 : c.opts.length - 1, true); return; }
    if (!inInput && k === ' ') { e.preventDefault(); if (c.opts[c.act]) pick(c, c.opts[c.act].getAttribute('data-v')); return; }
    if (!inInput && k && k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { // focus left the box (a row was clicked): typing goes back to the search
      try { c.input.focus({ preventScroll: true }); } catch (x) { c.input.focus(); }
    }
  }
  // keys on the field: open with Down/Up/Alt+Down/F4 (Enter and Space press the button); while open (touch screens keep focus here) the list keys;
  // closed: type a few letters to choose the next hotel that starts with them, as a native select does
  function trigKey(wrap, e) {
    var k = e.key;
    if (cur && cur.wrap === wrap) {
      if (k === ' ' || (k && k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey)) {
        if (k === ' ') { e.preventDefault(); if (cur.opts[cur.act]) pick(cur, cur.opts[cur.act].getAttribute('data-v')); return; }
        e.preventDefault(); ahead(wrap, k, true); return;
      }
      listKey(cur, e);
      return;
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 'ArrowUp' || k === 'Up' || k === 'F4') { e.preventDefault(); open(wrap); return; }
    if (k && k.length === 1 && k !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); ahead(wrap, k, false); }
  }
  // one letter (or the same letter again): the next hotel after the current one that starts with it; several letters: the first from the current one
  function ahead(wrap, ch, inList) {
    var now = Date.now(), sel = wrap.__sel, opts = sel.options, n = opts.length, i, j, x;
    var raw = wrap.__buf = (now - (wrap.__bufT || 0) < 800 ? wrap.__buf || '' : '') + ch;
    wrap.__bufT = now;
    var same = raw.split('').every(function (y) { return y === raw.charAt(0); });
    var buf = key(same ? ch : raw), start = sel.selectedIndex;
    if (!buf) return;
    if (inList && cur && cur.opts[cur.act]) { var av = cur.opts[cur.act].getAttribute('data-v'); for (x = 0; x < n; x++) if (opts[x].value === av) start = x; }
    for (j = 0; j < n; j++) {
      i = ((same ? start + 1 : start) + j) % n;
      if (i > 0 && key(opts[i].text).indexOf(buf) === 0) {
        if (inList && cur) { for (x = 0; x < cur.opts.length; x++) if (cur.opts[x].getAttribute('data-v') === opts[i].value) active(cur, x, true); return; }
        sel.value = opts[i].value;
        var ev;
        try { ev = new Event('change', { bubbles: true }); } catch (e) { ev = document.createEvent('Event'); ev.initEvent('change', true, false); }
        sel.dispatchEvent(ev);
        return;
      }
    }
  }

  function forms() {
    return Array.prototype.filter.call(document.querySelectorAll('form'), function (f) {
      return f.querySelector(DEST) && !f.closest("[data-block-id='hotel-detail-content']");
    });
  }
  function mountAll() {
    if (cur && (!cur.trig.isConnected || !cur.wrap.isConnected)) close(false);
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
    if (cur && (!cur.trig.isConnected || !cur.wrap.isConnected)) close(false);
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
      if (cur) guard(function () { close(false); });
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
  function cssOk() { try { return !!getComputedStyle(document.documentElement).getPropertyValue('--adv-btn'); } catch (e) { return false; } } // v1.0.8: advisor-brand.css applied
  function go() {
    if (started) return;
    var a = app();
    if (!a) return;
    if (!cssOk()) { if ((go.n = (go.n || 0) + 1) < 50) setTimeout(go, 400); return; } // v1.0.8: without our stylesheet the theme's own field stays
    started = true;
    hookRouter(a);
    mountAll();
    var t = null;
    new MutationObserver(function () { clearTimeout(t); t = setTimeout(function () { guard(mountAll); }, 120); }).observe(document.body, { childList: true, subtree: true });
    setInterval(function () { if (document.querySelector('[data-adv-hotel]')) guard(sync); }, 500);
    (window.requestIdleCallback || function (f) { setTimeout(f, 1200); })(function () { if (forms().length) load(lang()); });
  }
  // v1.0.8 (fix2): the part starts once Nuxt has hydrated the page: Nuxt's own hook, or its isHydrating flag (polled) if the hook was
  // missed. The safety net was a fixed 6 s timer: on a slow load it changed the page while Vue was still hydrating it, and Vue then left out
  // what it could not match (the /transport list section, the home band's Hotel field).
  function hydrated(nuxt, f) {
    var done = false, n = 0;
    function run() { if (!done) { done = true; setTimeout(f, 0); } }
    nuxt.hooks.hookOnce('app:suspense:resolve', run);
    (function poll() { if (done) return; if (!nuxt.isHydrating) run(); else setTimeout(poll, ++n < 120 ? 500 : 3000); })();
  }
  function start() {
    var a = app();
    if (!a) { setTimeout(start, 300); return; }
    var nuxt = a.config.globalProperties.$nuxt;
    if (nuxt && nuxt.isHydrating && nuxt.hooks && nuxt.hooks.hookOnce) hydrated(nuxt, go);
    else go();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

/* ---------- 3. Date pickers: a "Done" button (owner request 2026-11-13) ----------
   The theme's date-range calendar (hotel search: home band, results card, city card, hotel page) stays open after the check-out day is chosen;
   visitors had to click an empty spot of the page to close it. Whenever a calendar pop-up is open this adds a footer: the chosen stay and its
   nights ("13 نوفمبر – 14 نوفمبر · ليلة واحدة") and a «تم» / «Done» / «Valider» button that closes the calendar exactly as a click outside
   does (the dates are already in the form: the theme writes them on every day click). While only the check-in day is chosen the button is
   disabled and the row asks for the check-out day. Single-date pickers (transport, airport, services) get the button alone.
   Phones already have the theme's own full-width «تطبيق» button under the calendar: that button is kept as the Done button; the stay summary
   goes above it and it waits for the check-out day the same way. Styled in advisor-brand.css ([data-adv-cal-foot]). */
(function () {
  if (window.__advPopups) return;
  window.__advPopups = 1;
  var T = {
    ar: { done: 'تم', out: 'اختر تاريخ المغادرة', loc: 'ar-u-nu-latn', n: function (k) { return k === 1 ? 'ليلة واحدة' : k === 2 ? 'ليلتان' : k <= 10 ? k + ' ليالٍ' : k + ' ليلة'; } },
    en: { done: 'Done', out: 'Select your check-out date', loc: 'en-US', n: function (k) { return k === 1 ? '1 night' : k + ' nights'; } },
    fr: { done: 'Valider', out: 'Choisissez la date de départ', loc: 'fr-FR', n: function (k) { return k === 1 ? '1 nuit' : k + ' nuits'; } }
  };
  var CAL = "[data-slot='range-calendar'],[data-slot='calendar']";
  var POP = "[data-slot='popover-content'],[data-slot='dialog-content'],[data-slot='sheet-content'],[data-slot='drawer-content']";
  var THEME_DONE = "[data-slot='dialog-close'],[data-slot='sheet-close'],[data-slot='drawer-close']";
  var started = false, timer = null, live = [];
  function lang() {
    var l = (document.documentElement.getAttribute('lang') || 'ar').slice(0, 2).toLowerCase();
    return T[l] ? l : 'ar';
  }
  function utc(v) { var p = String(v).split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function fmt(v, t) {
    try { return new Intl.DateTimeFormat(t.loc, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(utc(v))); } catch (e) { return v; }
  }
  // the chosen range, read from the day cells (reka: data-selection-start / data-selection-end / data-selected on every day of the stay).
  // When the visitor pages to other months a chosen day can be out of view: the last value seen is kept.
  function readRange(cal, st) {
    var s = cal.querySelector('[data-selection-start]'), e = cal.querySelector('[data-selection-end]');
    if (s) st.start = s.getAttribute('data-value');
    if (e) st.end = e.getAttribute('data-value');
    else if (s) {
      var sel = cal.querySelectorAll('[data-selected]'), other = false;
      for (var i = 0; i < sel.length; i++) if (sel[i].getAttribute('data-value') !== st.start) { other = true; break; }
      if (!other) st.end = null; // only the check-in day is chosen
    }
    if (st.start && st.end && utc(st.end) <= utc(st.start)) st.end = null;
    return st;
  }
  // close exactly as a click outside does: the theme's dismissable layer listens for a pointerdown on the document outside it.
  // Then the focus goes back to the date field (mouse or keyboard alike), unless the visitor has already moved it somewhere else.
  function closeLike(pop, trigger) {
    var stillOpen = function () { return pop.isConnected && pop.getAttribute('data-state') === 'open'; };
    try { document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, composed: true, pointerType: 'mouse', button: 0, isPrimary: true })); } catch (e) {}
    setTimeout(function () {
      if (stillOpen()) { try { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true })); } catch (e) {} }
      setTimeout(function () {
        try {
          if (stillOpen() && trigger) trigger.click();
          var a = document.activeElement;
          if (trigger && trigger.focus && trigger.isConnected && (!a || a === document.body || a === document.documentElement || pop.contains(a))) trigger.focus({ preventScroll: true });
        } catch (e) {}
      }, 120);
    }, 120);
  }
  function triggerOf(pop) {
    var id = pop.getAttribute('aria-labelledby');
    var t = id && document.getElementById(id);
    if (t && !pop.contains(t)) return t;
    var c = pop.id && document.querySelector("[aria-controls='" + pop.id + "']");
    return c || null;
  }
  function mount(cal) {
    var pop = cal.closest(POP);
    if (!pop || cal.__advFoot) return;
    var t = T[lang()], range = cal.getAttribute('data-slot') === 'range-calendar';
    var theme = null, cands = pop.querySelectorAll(THEME_DONE);
    for (var i = 0; i < cands.length; i++) if (!cands[i].closest(CAL) && (cands[i].textContent || '').trim()) { theme = cands[i]; break; }
    if (theme && !range) { cal.__advFoot = { theme: theme }; return; } // phones, single date: the theme's own apply button is already there
    var foot = document.createElement('div');
    foot.className = 'adv-cal-foot';
    foot.setAttribute('data-adv-cal-foot', theme ? 'theme' : range ? 'range' : 'single');
    var sum = null, btn = theme;
    if (range) {
      sum = document.createElement('p');
      sum.className = 'adv-cal-sum';
      sum.setAttribute('aria-live', 'polite');
      foot.appendChild(sum);
    }
    if (!theme) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'adv-cal-done';
      btn.textContent = t.done;
      btn.addEventListener('click', function () {
        if (btn.disabled) return;
        closeLike(pop, triggerOf(pop));
      });
      foot.appendChild(btn);
      // desktop: after the calendar, inside the pop-up
      cal.parentNode.insertBefore(foot, cal.nextSibling);
    } else {
      // phones: the summary goes right above the theme's button, in its footer bar
      theme.setAttribute('data-adv-cal-done', '');
      theme.parentNode.insertBefore(foot, theme);
    }
    var st = { start: null, end: null, foot: foot, sum: sum, btn: btn, theme: !!theme, cal: cal, pop: pop };
    cal.__advFoot = st;
    if (range) {
      var mo = new MutationObserver(function () { if (!st.q) { st.q = 1; setTimeout(function () { st.q = 0; paint(st); }, 0); } });
      mo.observe(cal, { attributes: true, attributeFilter: ['data-selected', 'data-selection-start', 'data-selection-end'], subtree: true, childList: true });
      st.mo = mo;
      paint(st);
    }
    live.push(st);
  }
  function paint(st) {
    try {
      var t = T[lang()];
      readRange(st.cal, st);
      var ok = !!(st.start && st.end), text;
      if (ok) {
        var n = Math.round((utc(st.end) - utc(st.start)) / 864e5);
        text = '<span class="adv-cal-dates">' + fmt(st.start, t) + ' – ' + fmt(st.end, t) + '</span><span class="adv-cal-sep" aria-hidden="true"> · </span><span class="adv-cal-n">' + t.n(n) + '</span>';
      } else text = '<span class="adv-cal-wait">' + t.out + '</span>';
      if (st.sum.__t !== text) { st.sum.innerHTML = text; st.sum.__t = text; }
      st.foot.toggleAttribute('data-wait', !ok);
      if (st.theme) {
        if (ok) { st.btn.removeAttribute('aria-disabled'); st.btn.removeAttribute('data-adv-wait'); }
        else { st.btn.setAttribute('aria-disabled', 'true'); st.btn.setAttribute('data-adv-wait', ''); }
      } else st.btn.disabled = !ok;
    } catch (e) {}
  }
  // the theme's phone button waits for the check-out day too (it would close the sheet with a one-night default)
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('[data-adv-wait]');
    if (b) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  // the theme's stay-dates field is a div with role=button that ignores Enter and Space (keyboard visitors could not open the calendar, so its
  // Done was out of their reach, and Space scrolled the page): those keys press it, as they press a real button. Real <button> triggers
  // (guests, transport dates, country code) already open on their own and are not touched.
  document.addEventListener('keydown', function (e) {
    try {
      var k = e.key, t = e.target;
      if ((k !== 'Enter' && k !== ' ' && k !== 'Spacebar') || e.defaultPrevented || e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (!t || !t.matches || !t.matches("[data-slot='popover-trigger'][role='button']:not(button)")) return;
      e.preventDefault();
      t.click();
    } catch (x) {}
  });
  function scan() {
    timer = null;
    try {
      live = live.filter(function (st) {
        if (st.cal.isConnected) return true;
        if (st.mo) st.mo.disconnect();
        return false;
      });
      var cals = document.querySelectorAll(CAL);
      for (var i = 0; i < cals.length; i++) if (!cals[i].__advFoot) mount(cals[i]);
    } catch (e) {}
  }
  function cssOk() { try { return !!getComputedStyle(document.documentElement).getPropertyValue('--adv-btn'); } catch (e) { return false; } } // v1.0.8: advisor-brand.css applied
  function go() {
    if (started) return;
    if (!cssOk()) { if ((go.n = (go.n || 0) + 1) < 50) setTimeout(go, 400); return; } // v1.0.8: no unstyled Done bar without our stylesheet
    started = true;
    scan();
    new MutationObserver(function () { if (!timer) timer = setTimeout(scan, 30); }).observe(document.body, { childList: true, subtree: true });
  }
  function app() { var el = document.querySelector('#__nuxt'); return el ? el.__vue_app__ : null; }
  // v1.0.8 (fix2): start once Nuxt has hydrated the page (hook, or its isHydrating flag polled); no fixed 6 s timer (see part 2)
  function hydrated(nuxt, f) {
    var done = false, n = 0;
    function run() { if (!done) { done = true; setTimeout(f, 0); } }
    nuxt.hooks.hookOnce('app:suspense:resolve', run);
    (function poll() { if (done) return; if (!nuxt.isHydrating) run(); else setTimeout(poll, ++n < 120 ? 500 : 3000); })();
  }
  function start() {
    try {
      var a = app();
      if (!a) { setTimeout(start, 300); return; }
      var nuxt = a.config.globalProperties.$nuxt;
      if (nuxt && nuxt.isHydrating && nuxt.hooks && nuxt.hooks.hookOnce) hydrated(nuxt, go);
      else go();
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

/* ---------- 4. Product tabs open their own page, on every page that shows the search band ----------
   The search band has a row of product tabs (hotels / transportation / airport transfer / services). The theme switches the form in place.
   v1.0.6 (owner report 2026-11-13): on /transport, "Hotels" showed the hotel form above "0 vehicles available" with "Transport" in the
   breadcrumb; on the results pages (/hotels/search, /transport) and on hotel pages (/hotels/<slug>) a tab for another product opened that
   product's page. v1.0.7 (owner request 2026-11-14): the same on every page that shows the band, the home page included (/, /en, /fr).
   In Nov 2026 the band with its tab row is on the home page, /hotels/search, /transport and the hotel pages; /cities/<city> and /hotels have
   a search card without tabs. Any other page that shows the band later (a CMS page) gets the same rule, its own product being Hotels, the
   theme's own default there (the tab the theme shows as chosen is not used: a tap before this script started may have switched the form in
   place; Transportation/Airport still open /transport and Hotels brings the hotel form back in place).
     Hotels                -> /hotels/search with the city, dates and rooms of the hotel search (the URL's, else this tab's last hotel search,
                              else the hotel form's defaults: first city, today -> tomorrow, 1 room 2 adults)
     Transportation/Airport -> /transport?mode=transportation|airport (from any page but /transport: this browser tab's last search of that
                              mode, else none; between the two modes on /transport: the same date, passengers and promo code, the places
                              belong to the mode)
     Services              -> unchanged (the theme's own button already opens /services, from every page)
   The page's own tab does nothing (Hotels on the home page, a hotel page and /hotels/search; the chosen mode on /transport).
   SPA navigation through the Vue router: Back returns to the page the tab was clicked on. One navigation at a time: the clicked tab looks
   chosen at once with a spinner in place of its icon, the row is aria-busy and the form under it dimmed and inert (nothing typed into it is
   lost; advisor-brand.css draws it) until the router has resolved and the old page is gone, or the navigation failed or was cancelled (then
   the old tab look comes back). No timer gives up while the router is still on its way (v1.0.6 put the old tab look back after 12 s even
   when a slow page was still coming). Another navigation started meanwhile (Services, a link, Back) wins: the busy look ends at once, the
   clicked tab keeps its look while that navigation loads, and gets the old look back only if the visitor ends up staying on this page.
   Keyboard: focus goes to the new page's chosen tab, else (phones' /transport has no tab row) its search form, heading or breadcrumb. */
(function () {
  if (window.__advTabs) return;
  window.__advTabs = 1;
  var KEY = 'adv-tabs-v1', BLOCK = "[data-block-id='hotel-search']";
  // optional language prefix (/en, /fr) + the page; nothing else may come before it (e.g. a service called "transport")
  var RESULTS = /^((?:\/[a-z]{2}(?:-[a-z]{2})?)?)\/(hotels\/search|transport)\/?$/i, HOTEL = /^((?:\/[a-z]{2}(?:-[a-z]{2})?)?)\/hotels\/([^\/]+)\/?$/i;
  var HQ = ['city', 'promoCode', 'checkIn', 'checkOut', 'rooms'], TQ = ['from', 'to', 'passengers', 'promoCode', 'dateFrom'];
  var started = false, busy = null, city0 = null, last = ''; // last: the newest navigation the router started (its fullPath)

  function app() { var el = document.querySelector('#__nuxt'); return el ? el.__vue_app__ : null; }
  function router() { var a = app(); return a && a.config.globalProperties.$router; }
  function lang() { return (document.documentElement.getAttribute('lang') || 'ar').slice(0, 2).toLowerCase(); }
  function one(v) { return Object.prototype.toString.call(v) === '[object Array]' ? v[0] : v; }
  function pick(q, keys) {
    var o = {}, n = 0;
    keys.forEach(function (k) { var v = one(q && q[k]); if (v != null && v !== '') { o[k] = String(v); n++; } });
    return n ? o : null;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function day(add) { var d = new Date(); d.setDate(d.getDate() + add); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function isDay(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || ''); }
  function read() { try { return JSON.parse(sessionStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function write(m) { try { sessionStorage.setItem(KEY, JSON.stringify(m)); } catch (e) {} }

  // a results page: {prefix: '' | '/en' | '/fr', product: 'hotels' | 'transportation' | 'airport' | '' (transport page without a mode)}
  function pageOf(route) {
    var m = RESULTS.exec(route && route.path || '');
    if (!m) return null;
    if (m[2] !== 'transport') return { prefix: m[1], product: 'hotels' };
    var mode = one(route.query && route.query.mode);
    return { prefix: m[1], product: mode === 'transportation' || mode === 'airport' ? mode : '' };
  }
  // a hotel's own page: {prefix, product: 'hotels'} (its booking block is the hotel tab), else null
  function hotelPageOf(route) {
    var m = HOTEL.exec(route && route.path || '');
    return m && m[2] !== 'search' ? { prefix: m[1], product: 'hotels' } : null;
  }
  // any other page that shows the band (the home page, a CMS page): {prefix, product: 'hotels'}
  // The prefix is the path's first segment when it is the page language (/en, /fr); the default language (Arabic) has none.
  // The product is the theme's own default for the path (Hotels unless the path has '/transport'), not the tab it shows as chosen: a tap
  // before this script started switches the form in place, and that tab must still open its page (and Hotels bring the hotel form back).
  function otherOf(route, row) {
    var p = route && route.path || '', m = /^\/([a-z]{2}(?:-[a-z]{2})?)(?=\/|$)/i.exec(p);
    return { prefix: m && m[1].slice(0, 2).toLowerCase() === lang() ? '/' + m[1] : '', product: /\/transport/.test(p) && activeOf(row) || 'hotels' };
  }
  // which product a tab button is: its CMS label key, else its icon
  function tabOf(btn) {
    var l = btn.querySelector('[data-theme-property]'), k = l ? l.getAttribute('data-theme-property') || '' : '';
    if (/"hotels"/.test(k)) return 'hotels';
    if (/"transportation"/.test(k)) return 'transportation';
    if (/"airportTransfer"/.test(k)) return 'airport';
    if (/"services"/.test(k)) return 'services';
    var s = btn.querySelector('svg'), c = s ? s.getAttribute('class') || '' : '';
    if (/lucide-hotel\b/.test(c)) return 'hotels';
    if (/lucide-bus\b/.test(c)) return 'transportation';
    if (/lucide-plane/.test(c)) return 'airport';
    return null;
  }
  // the tab row: the buttons' parent, first in the search block's inner div, not inside a form
  function rowOf(btn) {
    var row = btn.parentElement, inner = row && row.parentElement, block = inner && inner.parentElement;
    if (!block || !block.matches || !block.matches(BLOCK) || row.closest('form')) return null;
    return row;
  }
  function kids(row) { return Array.prototype.filter.call(row.children, function (b) { return b.tagName === 'BUTTON'; }); }
  function activeOf(row) {
    var a = kids(row).filter(function (b) { return /\bbg-primary\b/.test(b.className); })[0];
    return a ? tabOf(a) : null;
  }

  // remember the search of each product's page (per browser tab), so its tab can bring the visitor back to it
  function remember(route) {
    try {
      var pg = pageOf(route), q = route.query || {}, m = read(), h, hm;
      if (pg && pg.product === 'hotels') {
        h = pick(q, HQ);
        if (h && h.city) m.hotels = h;
      } else if (pg) {
        m[pg.product || 'airport'] = pick(q, TQ) || {};
      } else if ((hm = HOTEL.exec(route.path || '')) && hm[2] !== 'search') {
        h = pick(q, HQ); // a hotel page reached from a search carries city, dates and rooms (through the Hotel field: no city, see cityOfHotel)
        if (h && h.checkIn && !h.city) { var hs = hm[2]; try { hs = decodeURIComponent(hs); } catch (x) {} h.city = cityOfHotel(hs) || undefined; if (!h.city) delete h.city; }
        if (h && h.city && h.checkIn) m.hotels = h;
      } else return;
      write(m);
    } catch (e) {}
  }

  // the city of a hotel, from part 2's shared hotel list ('adv-hotels-v2-<lang>': {v: {by: {citySlug: [{slug, name}]}}})
  function cityOfHotel(slug) {
    try {
      var c = JSON.parse(sessionStorage.getItem('adv-hotels-v2-' + lang()) || 'null'), by = c && c.v && c.v.by;
      if (by) for (var k in by) if (Object.prototype.hasOwnProperty.call(by, k) && by[k].some(function (h) { return h.slug === slug; })) return k;
    } catch (e) {}
    return null;
  }
  function firstCity(cb) {
    if (city0) { cb(city0); return; }
    fetch('/api/common/cities?locale=' + lang(), { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { city0 = j && j[0] && j[0].slug || null; cb(city0); }, function () { cb(null); });
  }
  function hotelQuery(route, cb) {
    var src = pick(route.query, HQ); // the hotel form on this page holds the URL's hotel search, when there is one
    if (!src || !src.city) src = read().hotels || {};
    var ci = src.checkIn, co = src.checkOut, t = day(0), q = {};
    if (!(isDay(ci) && isDay(co) && ci >= t && co > ci)) { ci = t; co = day(1); }
    function done(city) {
      if (city) q.city = city;
      if (src.promoCode) q.promoCode = src.promoCode;
      q.checkIn = ci; q.checkOut = co; q.rooms = src.rooms || '2-0';
      cb(q);
    }
    if (src.city) done(src.city); else firstCity(done);
  }
  function transportQuery(route, own, to) {
    var src = own !== 'hotels' ? pick(route.query, ['passengers', 'promoCode', 'dateFrom']) || {} : read()[to] || {};
    var q = { mode: to };
    TQ.forEach(function (k) { if (src[k]) q[k] = src[k]; });
    if (q.dateFrom && !(isDay(q.dateFrom) && q.dateFrom >= day(0))) delete q.dateFrom;
    return q;
  }

  // the clicked tab looks chosen at once (the theme's own active/inactive classes swapped) and gets a spinner in place of its icon; the row is
  // busy and the form under it (the row's siblings) dimmed, inert and aria-busy until the page changes (advisor-brand.css draws the look)
  function mark(row, btn) {
    var act = kids(row).filter(function (b) { return /\bbg-primary\b/.test(b.className); })[0], s = { row: row, btn: btn, wait: [] };
    if (act && act !== btn) { s.act = act; s.a = act.className; s.b = btn.className; act.className = s.b; btn.className = s.a; }
    row.setAttribute('aria-busy', 'true');
    btn.setAttribute('data-adv-tab-going', '');
    Array.prototype.forEach.call(row.parentElement.children, function (el) {
      if (el === row || el.hasAttribute('data-adv-tab-wait')) return;
      el.setAttribute('data-adv-tab-wait', '');
      el.setAttribute('aria-busy', 'true');
      el.setAttribute('inert', '');
      s.wait.push(el);
    });
    return s;
  }
  function unmark(s, restore) {
    try {
      s.row.removeAttribute('aria-busy');
      s.btn.removeAttribute('data-adv-tab-going');
      s.wait.forEach(function (el) { el.removeAttribute('data-adv-tab-wait'); el.removeAttribute('aria-busy'); el.removeAttribute('inert'); });
      if (restore && s.act && s.btn.className === s.a) { s.act.className = s.a; s.btn.className = s.b; }
    } catch (e) {}
  }
  // keyboard users keep their place: focus the new page's chosen tab. A page without a visible tab row (phones' /transport) gets its search
  // form's first control, else its visible main heading, else its breadcrumb's current page (focusable with tabindex=-1); never scrolls.
  function shown(x) { var b = x.getBoundingClientRect(); return b.width > 1 && b.height > 1 && getComputedStyle(x).visibility !== 'hidden'; }
  function first(sel, ok) { return Array.prototype.filter.call(document.querySelectorAll(sel), ok)[0]; }
  function refocus() {
    try {
      var b = first(BLOCK + ' button.bg-primary', function (x) { return x.offsetParent && rowOf(x); }) ||
        first([BLOCK + ' form input', BLOCK + ' form button', BLOCK + ' form select', BLOCK + ' form textarea', BLOCK + ' form [tabindex="0"]'].join(','), function (x) { return !x.disabled && x.type !== 'hidden' && shown(x); }) ||
        first("main h1, main [role='heading'][aria-level='1']", shown) ||
        first("main [data-slot='breadcrumb-page'], main [aria-current='page']", shown);
      if (!b) return;
      if (!b.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(b.tagName)) {
        b.setAttribute('tabindex', '-1');
        b.addEventListener('blur', function () { b.removeAttribute('tabindex'); }, { once: true });
      }
      b.focus({ preventScroll: true });
    } catch (e) {}
  }

  function navigate(r, row, btn, to, route, pg, own) {
    var s = mark(row, btn), kbd = false, settled = false, want = pg.prefix + (to === 'hotels' ? '/hotels/search' : '/transport');
    try { kbd = btn.matches(':focus-visible'); } catch (e) {}
    try { want = r.resolve(want).path; } catch (e) {}
    busy = s;
    function end(ok) {
      if (settled) return;
      settled = true;
      busy = null;
      unmark(s, !ok);
    }
    // the router's guard (go()) asks for every navigation it starts while this one is busy: ours (or its redirect), or another one
    s.mine = function (t) { return t.path === want || !!(t.redirectedFrom && t.redirectedFrom.path === want); };
    // a link to the page already shown (the logo, Home on the home page) runs no beforeEach, but the router has already cancelled ours
    // (it reports that only when ours wakes up, after the new page's code loads): the visitor stays here, so the old look returns now
    s.dup = function () { end(false); };
    // another navigation started first (Services, a link, Back/Forward): it wins. The busy look ends now; the clicked tab keeps its look while
    // that navigation loads (no flip back), and the old look returns only if the newest navigation leaves the visitor on this page.
    s.drop = function () {
      if (settled) return;
      settled = true;
      busy = null;
      unmark(s, false);
      var off = r.afterEach(function (t) {
        if (t.fullPath !== last) return; // an older navigation (ours, cancelled) reporting: wait for the newest
        if (off) off();
        if (row.isConnected && r.currentRoute.value.path === route.path) unmark(s, true);
      });
    };
    // the router resolves before the new page is drawn (it waits for its data): stay busy until the old row is gone.
    // Between the two transport modes the page and its row stay; the focused tab is then already the chosen one.
    // If the visitor goes elsewhere first (Back, a link), stop: back on the old page its old tab look returns.
    function arrived() {
      var t0 = Date.now(), dest = r.currentRoute.value.path; // where the router landed (after any redirect)
      if (dest === route.path) { end(true); return; }
      (function look() {
        var now = r.currentRoute.value.path, mine = !settled;
        if (!row.isConnected) { end(true); if (kbd && mine) refocus(); return; }
        if (now !== dest) { end(now !== route.path); return; }
        if (Date.now() - t0 > 60000) { end(true); return; } // drawn without replacing this row: stop looking
        setTimeout(look, 100);
      })();
    }
    // no time limit before the router answers: push() always settles (resolved, failed, or cancelled by a later navigation)
    function push(path, query) {
      if (settled) return; // another navigation won while the hotel query was being prepared
      try {
        r.push({ path: path, query: query }).then(function (fail) { if (fail) end(false); else arrived(); }, function () { end(false); });
      } catch (e) {
        end(false);
      }
    }
    if (to === 'hotels') hotelQuery(route, function (q) { push(pg.prefix + '/hotels/search', q); });
    else push(pg.prefix + '/transport', transportQuery(route, own, to));
  }

  function onClick(e) {
    try {
      if (!started || e.button) return;
      var btn = e.target && e.target.closest && e.target.closest('button');
      var row = btn && rowOf(btn);
      if (!row) return;
      var to = tabOf(btn);
      if (!to || to === 'services') return; // services: the theme opens /services itself
      var r = router(), route = r && r.currentRoute && r.currentRoute.value;
      if (!route) return;
      var pg = pageOf(route) || hotelPageOf(route) || otherOf(route, row);
      var own = pg.product || activeOf(row) || 'airport';
      if (to === own && !busy) return; // the page's own tab: nothing changes
      e.preventDefault();
      e.stopImmediatePropagation(); // the theme must not switch the form in place first
      if (busy || to === own) return; // one navigation at a time
      navigate(r, row, btn, to, route, pg, own);
    } catch (err) {}
  }
  document.addEventListener('click', onClick, true);

  function go() {
    if (started) return;
    var r = router();
    if (!r) return;
    started = true;
    try {
      if (!r.__advTabs) {
        r.__advTabs = 1;
        r.afterEach(function (to, f, fail) { if (!fail) remember(to); else if (fail.type === 16 && busy && busy.dup) busy.dup(); });
        // every navigation the router starts: remember the newest; one that is not ours while ours is busy supersedes it (never blocks)
        r.beforeEach(function (to) { try { last = to.fullPath; if (busy && busy.mine && !busy.mine(to)) busy.drop(); } catch (e) {} });
      }
      remember(r.currentRoute.value);
      var pg = pageOf(r.currentRoute.value);
      if (pg && pg.product !== 'hotels' && !(read().hotels || {}).city)
        (window.requestIdleCallback || function (f) { setTimeout(f, 1500); })(function () { firstCity(function () {}); });
    } catch (e) {}
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

/* ---------- 5. Contact page: the Subject becomes a drop-down, with an optional hotel (owner request 13 Nov 2026) ----------
   On /contact-us (AR, EN, FR) the theme's free-text Subject (input[name=subject], required) is hidden and replaced by:
   - "Subject": a drop-down with five choices (Makkah hotels / Madinah hotels / Makkah and Madinah together / transport, transfers and visas / Other);
     "Other" opens a short "tell us what you need" field;
   - once a subject is chosen, an optional "Hotel of interest" field beside it: suggestions from the site's own hotel list (filtered by the subject,
     grouped by city), searchable, and any typed name is accepted when the hotel is not listed.
   The three are written as one line into the theme's own Subject input (native value setter + input event), so the theme's form validates and sends
   it unchanged, e.g. "حجز فنادق مكة — الفندق: <name>", "Other: Umrah visa — Hotel: <name>". No subject, or "Other" with nothing typed, leaves the
   theme's Subject empty, so the theme shows its own "Subject is required" error and nothing incomplete is sent.
   The hotel list comes from /api/common/hotels_autocomplete + /api/common/cities and shares part 2's sessionStorage cache ('adv-hotels-v2-<lang>').
   Styled in advisor-brand.css (.adv-cf-*). If anything here fails, the theme's plain Subject field stays as it was. */
(function () {
  if (window.__advPages) return;
  window.__advPages = 1;
  try {
    var T = {
      ar: {
        subjects: ['حجز فنادق مكة', 'حجز فنادق المدينة', 'الاهتمام بمكة والمدينة معاً', 'حجز مواصلات وتنقلات وتأشيرات', 'أخرى'],
        choose: 'اختر موضوع رسالتك', otherLabel: 'اكتب اهتمامك', otherPh: 'مثلاً: تأشيرة عمرة',
        hotelLabel: 'الفندق المهتم به', optional: '(اختياري)', hotelPh: 'ابحث أو اكتب اسم الفندق',
        otherSep: ': ', hotelJoin: ' — الفندق: ', loading: 'جارٍ تحميل الفنادق…',
        noMatch: 'ليس في قائمتنا، سنرسل الاسم كما كتبته', clear: 'مسح اسم الفندق', otherMissing: 'من فضلك اكتب اهتمامك'
      },
      en: {
        subjects: ['Makkah hotel booking', 'Madinah hotel booking', 'Makkah and Madinah together', 'Transport, transfers and visas', 'Other'],
        choose: 'Choose a subject', otherLabel: 'Tell us what you need', otherPh: 'e.g. Umrah visa',
        hotelLabel: 'Hotel of interest', optional: '(optional)', hotelPh: 'Search or type a hotel name',
        otherSep: ': ', hotelJoin: ' — Hotel: ', loading: 'Loading hotels…',
        noMatch: 'Not in our list, we will send the name as you typed it', clear: 'Clear the hotel name', otherMissing: 'Please tell us what you need'
      },
      fr: {
        subjects: ["Réservation d'hôtel à La Mecque", "Réservation d'hôtel à Médine", 'La Mecque et Médine ensemble', 'Transport, transferts et visas', 'Autre'],
        choose: 'Choisissez un objet', otherLabel: 'Précisez votre demande', otherPh: 'ex. : visa Omra',
        hotelLabel: 'Hôtel souhaité', optional: '(facultatif)', hotelPh: 'Cherchez ou saisissez un hôtel',
        otherSep: ' : ', hotelJoin: ' — Hôtel : ', loading: 'Chargement des hôtels…',
        noMatch: "Absent de notre liste : nous enverrons le nom tel que saisi", clear: "Effacer le nom de l'hôtel", otherMissing: 'Veuillez préciser votre demande'
      }
    };
    var CITY = ['makkah', 'medina', null, null, null]; // hotel suggestions per subject (null = every city, grouped)
    var OTHER = 4, MAXLEN = 100, CACHE_MS = 30 * 60 * 1000, data = {}, inst = [], uid = 0, started = false;
    var SUBJECT = "[data-block-id='contact-form'] form input[name='subject']";
    var setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;

    function lang() {
      var l = (document.documentElement.getAttribute('lang') || 'ar').slice(0, 2).toLowerCase();
      return T[l] ? l : 'ar';
    }
    function rtl() { return (document.documentElement.getAttribute('dir') || (lang() === 'ar' ? 'rtl' : 'ltr')) === 'rtl'; }
    function safe(f) { return function (a, b) { try { return f.call(this, a, b); } catch (e) {} }; }
    function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    // same key function as part 2 (the cache's city map is keyed with it)
    function norm(s) { return String(s || '').replace(/[ً-ْـ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase(); }
    // search key: also folds Arabic letter variants and Latin accents, so "مكه" finds "مكة" and "medine" finds "Médine"
    function fold(s) {
      s = norm(s).replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[’‘`´]/g, "'");
      return s.normalize ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : s;
    }
    function clean(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
    function getJson(u) { return fetch(u, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
    function namesOf(cities) {
      var n = {};
      (cities || []).forEach(function (c) { if (c && c.slug && c.name) n[c.slug] = String(c.name).trim(); });
      return n;
    }
    // the hotel list: same requests, cache key, lifetime and value shape as part 2 ({by: {citySlug: [{slug, name}]}, cities: {normName: slug}}),
    // plus "names" (city slug -> display name, for the group headings); a cache written by part 2 gets the names added
    function load(l) {
      if (data[l]) return data[l];
      var key = 'adv-hotels-v2-' + l, c = null;
      try { c = JSON.parse(sessionStorage.getItem(key) || 'null'); } catch (e) {}
      if (c && Date.now() - c.t < CACHE_MS && c.v && c.v.by) {
        if (c.v.names) { data[l] = Promise.resolve(c.v); data[l].v = c.v; return data[l]; }
        data[l] = getJson('/api/common/cities?locale=' + l).then(function (cities) {
          c.v.names = namesOf(cities);
          try { sessionStorage.setItem(key, JSON.stringify(c)); } catch (e) {}
          return c.v;
        }, function () { c.v.names = {}; return c.v; });
        data[l].then(function (v) { data[l].v = v; });
        return data[l];
      }
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
        var v = { by: by, cities: cityByName, names: namesOf(res[1]) };
        try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v: v })); } catch (e) {}
        return v;
      });
      var p = data[l];
      p.then(function (v) { p.v = v; }, function () { if (data[l] === p) delete data[l]; });
      return data[l];
    }

    /* ---- the pop-up list: portalled to <body>, under its field (above only when there is no room below), never taller than 320px ---- */
    function Pop(kind, labelledby) {
      var el = document.createElement('div');
      el.id = 'adv-cf-pop-' + (++uid);
      el.className = 'adv-cf-pop';
      el.setAttribute('data-adv-pop', 'contact-' + kind);
      el.setAttribute('role', 'listbox');
      el.setAttribute('aria-labelledby', labelledby);
      el.setAttribute('tabindex', '-1');
      el.hidden = true;
      // a click inside the list must not take the focus away from the field
      el.addEventListener('mousedown', function (e) { e.preventDefault(); });
      // the wheel over a list never scrolls the page: a long list scrolls itself (overscroll-behavior: contain stops at its ends), a short one
      // does nothing (Ctrl+wheel still zooms)
      try { el.addEventListener('wheel', function (e) { if (!e.ctrlKey && el.scrollHeight <= el.clientHeight + 1) e.preventDefault(); }, { passive: false }); } catch (e) {}
      return el;
    }
    function place(pop, anchor) {
      var r = anchor.getBoundingClientRect(), vv = window.visualViewport;
      var top0 = vv ? vv.offsetTop : 0, h0 = vv ? vv.height : window.innerHeight, vw = document.documentElement.clientWidth || window.innerWidth;
      var GAP = 6, M = 12;
      pop.style.position = 'fixed';
      pop.style.minWidth = Math.round(r.width) + 'px';
      // at least the field's width, up to 360px for long names; phones (under 768px): exactly the field's width, lined up with it
      pop.style.maxWidth = Math.round(vw < 768 ? r.width : Math.max(r.width, Math.min(360, vw - 16))) + 'px';
      var natural = Math.min(pop.scrollHeight + 2, 320); // the whole list's height (scrollHeight ignores max-height; the list keeps its scroll position)
      var below = top0 + h0 - r.bottom - GAP - M, above = r.top - top0 - GAP - M;
      var down = below >= Math.min(natural, 200) || below >= above; // v1.0.8: below when a useful list (200px) fits there, as part 2's list
      var maxH = Math.max(72, Math.min(320, down ? below : above));
      pop.style.maxHeight = Math.floor(maxH) + 'px';
      var h = Math.min(natural, maxH), w = pop.offsetWidth;
      pop.style.top = Math.round(down ? r.bottom + GAP : r.top - GAP - h) + 'px';
      var left = rtl() ? r.right - w : r.left;
      left = Math.max(8, Math.min(left, vw - 8 - w));
      pop.style.left = Math.round(left) + 'px';
      pop.setAttribute('data-side', down ? 'bottom' : 'top');
      return !(r.bottom < 0 || r.top > top0 + h0); // false once the field has left the screen
    }
    function scrollIntoList(pop, opt) {
      if (!opt) return;
      var top = opt.offsetTop, bottom = top + opt.offsetHeight;
      if (top < pop.scrollTop + 6) pop.scrollTop = Math.max(0, top - 6);
      else if (bottom > pop.scrollTop + pop.clientHeight - 6) pop.scrollTop = bottom - pop.clientHeight + 6;
    }

    /* ---- one contact form ---- */
    function mount(item, input) {
      var l = lang(), t = T[l], n = ++uid;
      var themeLabel = item.querySelector('label');
      var optSpan = document.querySelector("[data-block-id='contact-form'] form label span.text-muted-foreground");
      var s = { item: item, input: input, lang: l, t: t, idx: -1, last: input.value, open: null, active: -1, opts: [] };
      var labCls = themeLabel ? themeLabel.className : 'text-sm font-medium leading-none';
      var inCls = input.className;
      var subjText = clean(themeLabel ? themeLabel.textContent : '') || ({ ar: 'الموضوع', en: 'Subject', fr: 'Objet' })[l];
      var optText = (optSpan && clean(optSpan.textContent)) || t.optional;
      var optCls = optSpan ? optSpan.className : 'ms-1 text-muted-foreground text-xs';
      var ids = { lab: 'adv-cf-l' + n, trig: 'adv-cf-t' + n, hlab: 'adv-cf-hl' + n, hin: 'adv-cf-h' + n, olab: 'adv-cf-ol' + n, oin: 'adv-cf-o' + n, omsg: 'adv-cf-om' + n };
      var ui = document.createElement('div');
      ui.className = 'adv-cf';
      ui.setAttribute('data-adv-cf', '');
      ui.innerHTML =
        '<div class="adv-cf-grid">' +
          '<div class="adv-cf-cell adv-cf-subject">' +
            '<label class="' + esc(labCls) + '" id="' + ids.lab + '" for="' + ids.trig + '">' + esc(subjText) + '</label>' +
            '<button type="button" class="' + esc(inCls) + ' adv-cf-trigger" id="' + ids.trig + '" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="' + ids.lab + '" data-empty="">' +
              '<span class="adv-cf-val">' + esc(t.choose) + '</span></button>' +
          '</div>' +
          '<div class="adv-cf-cell adv-cf-hotel" hidden>' +
            '<label class="' + esc(labCls) + '" id="' + ids.hlab + '" for="' + ids.hin + '">' + esc(t.hotelLabel) + '<span class="' + esc(optCls) + '">' + esc(optText) + '</span></label>' +
            '<div class="adv-cf-combo">' +
              '<input type="text" data-slot="form-control" class="' + esc(inCls) + '" id="' + ids.hin + '" role="combobox" aria-autocomplete="list" aria-expanded="false" autocomplete="off" autocapitalize="words" spellcheck="false" maxlength="' + MAXLEN + '" placeholder="' + esc(t.hotelPh) + '">' +
              '<button type="button" class="adv-cf-clear" tabindex="-1" aria-label="' + esc(t.clear) + '" hidden></button>' +
            '</div>' +
          '</div>' +
          '<div class="adv-cf-cell adv-cf-other" hidden>' +
            '<label class="' + esc(labCls) + '" id="' + ids.olab + '" for="' + ids.oin + '">' + esc(t.otherLabel) + '</label>' +
            '<input type="text" data-slot="form-control" class="' + esc(inCls) + '" id="' + ids.oin + '" autocomplete="off" maxlength="' + MAXLEN + '" placeholder="' + esc(t.otherPh) + '">' +
            '<p class="text-destructive text-sm adv-cf-msg" id="' + ids.omsg + '" role="alert" hidden></p>' +
          '</div>' +
        '</div>';
      s.ui = ui;
      s.trig = ui.querySelector('.adv-cf-trigger');
      s.val = ui.querySelector('.adv-cf-val');
      s.hotelCell = ui.querySelector('.adv-cf-hotel');
      s.combo = ui.querySelector('.adv-cf-combo');
      s.hotel = ui.querySelector('#' + ids.hin);
      s.clearBtn = ui.querySelector('.adv-cf-clear');
      s.otherCell = ui.querySelector('.adv-cf-other');
      s.other = ui.querySelector('#' + ids.oin);
      s.omsg = ui.querySelector('#' + ids.omsg);
      [s.hotel, s.other].forEach(function (x) { x.setAttribute('aria-invalid', 'false'); });
      s.subjPop = Pop('subject', ids.lab);
      s.hotelPop = Pop('hotel', ids.hlab);
      s.trig.setAttribute('aria-controls', s.subjPop.id);
      s.hotel.setAttribute('aria-controls', s.hotelPop.id);

      item.setAttribute('data-adv-subject', '');
      hideTheme(s);
      item.insertBefore(ui, input);
      document.body.appendChild(s.subjPop);
      document.body.appendChild(s.hotelPop);
      apply(s, parse(s, input.value));
      wire(s);
      mirror(s);
      inst.push(s);
      (window.requestIdleCallback || function (f) { setTimeout(f, 800); })(function () { load(l); });
      return s;
    }
    function hideTheme(s) {
      // the theme's own label and input stay in the form (validation, error message, sending) but are not shown
      var lab = s.item.querySelector('label[data-slot=form-label]');
      if (lab && !s.ui.contains(lab)) lab.style.display = 'none';
      s.input.style.display = 'none';
    }
    // what the visitor sees -> the theme's Subject value
    function compose(s) {
      var t = s.t;
      if (s.idx < 0) return '';
      var v = t.subjects[s.idx];
      if (s.idx === OTHER) {
        var o = clean(s.other.value);
        if (!o) return ''; // "Other" alone says nothing: the theme's "required" error asks for it instead of sending "Other"
        v += t.otherSep + o;
      }
      var h = clean(s.hotel.value);
      if (h) v += t.hotelJoin + h;
      return v;
    }
    function write(s) {
      var v = compose(s);
      s.last = v;
      if (s.input.value === v) return;
      setValue.call(s.input, v);
      s.input.dispatchEvent(new Event('input', { bubbles: true }));
      // the theme re-checks the field on "change": sent only for a real value, so an error the visitor already saw clears as soon as the
      // subject is complete, while an empty value (e.g. "Other" not typed yet) is only reported on sending, as in the other fields
      if (v) s.input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    // the theme's Subject value -> what the visitor sees (first mount, and after the theme empties the form)
    function parse(s, v) {
      var t = s.t, st = { idx: -1, other: '', hotel: '' };
      v = String(v || '');
      if (!v) return st;
      var j = v.lastIndexOf(t.hotelJoin);
      if (j >= 0) { st.hotel = v.slice(j + t.hotelJoin.length); v = v.slice(0, j); }
      var i = t.subjects.indexOf(v);
      if (i >= 0 && i !== OTHER) st.idx = i;
      else {
        st.idx = OTHER;
        st.other = v.indexOf(t.subjects[OTHER] + t.otherSep) === 0 ? v.slice((t.subjects[OTHER] + t.otherSep).length) : v;
      }
      return st;
    }
    function apply(s, st) {
      s.other.value = st.other;
      s.hotel.value = st.hotel;
      choose(s, st.idx, true);
      s.last = s.input.value;
    }
    function choose(s, i, silent) {
      var t = s.t, prevCity = s.idx >= 0 ? CITY[s.idx] : undefined;
      s.idx = i;
      if (i < 0) {
        s.val.textContent = t.choose;
        s.trig.setAttribute('data-empty', '');
        s.trig.removeAttribute('title');
        s.ui.removeAttribute('data-chosen');
      } else {
        s.val.textContent = t.subjects[i];
        s.trig.removeAttribute('data-empty');
        s.trig.title = t.subjects[i];
        s.ui.setAttribute('data-chosen', '');
      }
      s.hotelCell.hidden = i < 0;
      s.otherCell.hidden = i !== OTHER;
      // a hotel picked from another city's list no longer fits the new subject; a typed name is kept
      if (!silent && prevCity !== CITY[i] && CITY[i] && s.picked && s.picked.city !== CITY[i] && clean(s.hotel.value) === s.picked.name) {
        s.hotel.value = '';
        s.picked = null;
      }
      filled(s);
      if (!silent) write(s);
      syncInvalid(s);
    }
    function filled(s) {
      var f = !!s.hotel.value;
      s.clearBtn.hidden = !f;
      if (f) s.combo.setAttribute('data-filled', ''); else s.combo.removeAttribute('data-filled');
    }

    /* ---- error state: the theme marks its (hidden) Subject input; the visible field that needs the answer shows it ----
       "Other" chosen with nothing typed: the theme's own message ("Subject is required") would be wrong under a chosen subject, so it is hidden
       ([data-adv-other-msg] on the item, see advisor-brand.css) and the Other field shows its own message (same classes, role=alert). */
    function syncInvalid(s) {
      var bad = s.input.getAttribute('aria-invalid') === 'true';
      var desc = s.input.getAttribute('aria-describedby');
      var target = s.idx === OTHER ? s.other : s.trig;
      var own = bad && s.idx === OTHER && !clean(s.other.value);
      [s.trig, s.other].forEach(function (x) {
        if (x === target) {
          x.setAttribute('aria-invalid', bad ? 'true' : 'false');
          if (own) x.setAttribute('aria-describedby', s.omsg.id);
          else if (desc) x.setAttribute('aria-describedby', desc);
        } else {
          x.setAttribute('aria-invalid', 'false');
          x.removeAttribute('aria-describedby');
        }
      });
      if (own) {
        var tm = s.item.querySelector("[data-slot='form-message']");
        if (tm && tm.className && s.omsg.className !== tm.className + ' adv-cf-msg') s.omsg.className = tm.className + ' adv-cf-msg';
        if (s.omsg.textContent !== s.t.otherMissing) s.omsg.textContent = s.t.otherMissing;
        s.omsg.hidden = false;
        s.item.setAttribute('data-adv-other-msg', '');
      } else {
        s.omsg.hidden = true;
        s.item.removeAttribute('data-adv-other-msg');
      }
    }
    // after a send the theme refused: when the empty "Other" field is the first field in error, the focus goes there (only if the visitor
    // has not moved it since pressing Send); an earlier field in error keeps the theme's behaviour (the focus stays where it was)
    function focusMissing(s, before) {
      var a = document.activeElement;
      if (s.idx !== OTHER || clean(s.other.value) || s.input.getAttribute('aria-invalid') !== 'true') return;
      if (a !== before && a && a !== document.body) return;
      var form = s.input.form, bad = form ? form.querySelectorAll("[aria-invalid='true']") : [];
      for (var i = 0; i < bad.length; i++) {
        var x = bad[i];
        if (x === s.other || x === s.input) break;
        if (s.ui.contains(x)) continue;
        if (x.getClientRects().length) return;
      }
      s.other.focus();
    }
    function mirror(s) {
      if (s.mo) s.mo.disconnect();
      s.mo = new MutationObserver(safe(function () { syncInvalid(s); }));
      s.mo.observe(s.input, { attributes: true, attributeFilter: ['aria-invalid', 'aria-describedby'] });
      syncInvalid(s);
    }
    function resync(s) {
      if (s.input.value !== s.last) apply(s, parse(s, s.input.value));
    }

    /* ---- open / close ---- */
    function openPop(s, which, typed, kb) {
      var pop = which === 'subject' ? s.subjPop : s.hotelPop, anchor = which === 'subject' ? s.trig : s.hotel;
      if (s.open && s.open !== which) closePop(s);
      s.open = which;
      s.typed = !!typed; // the hotel list is filtered only by what is typed after it opened (reopened, it shows every hotel again)
      pop.setAttribute('dir', rtl() ? 'rtl' : 'ltr');
      pop.setAttribute('lang', s.lang);
      pop.hidden = false;
      anchor.setAttribute('aria-expanded', 'true');
      var sel = which === 'subject' ? renderSubject(s, kb) : renderHotels(s);
      if (s.open !== which) return; // nothing to list
      place(pop, anchor);
      if (sel >= 0) scrollIntoList(pop, s.opts[sel]);
      if (!s.onWin) {
        var raf = 0;
        s.onWin = safe(function (e) {
          var tg = e && e.target;
          if (raf || (tg && tg.nodeType === 1 && (s.subjPop.contains(tg) || s.hotelPop.contains(tg)))) return; // scrolling the list itself
          raf = (window.requestAnimationFrame || setTimeout)(function () {
            raf = 0;
            if (!s.open) return;
            var p = s.open === 'subject' ? s.subjPop : s.hotelPop, a = s.open === 'subject' ? s.trig : s.hotel;
            if (!document.contains(a) || !place(p, a)) closePop(s);
          });
        });
        s.onDown = safe(function (e) {
          var tg = e.target;
          if (!s.open || s.subjPop.contains(tg) || s.hotelPop.contains(tg) || s.trig.contains(tg) || s.combo.contains(tg)) return;
          closePop(s);
        });
      }
      window.addEventListener('scroll', s.onWin, true);
      window.addEventListener('resize', s.onWin);
      if (window.visualViewport) window.visualViewport.addEventListener('resize', s.onWin);
      document.addEventListener('pointerdown', s.onDown, true);
    }
    function closePop(s) {
      if (!s.open) return;
      var pop = s.open === 'subject' ? s.subjPop : s.hotelPop, anchor = s.open === 'subject' ? s.trig : s.hotel;
      s.open = null;
      s.active = -1;
      pop.hidden = true;
      anchor.setAttribute('aria-expanded', 'false');
      anchor.removeAttribute('aria-activedescendant');
      window.removeEventListener('scroll', s.onWin, true);
      window.removeEventListener('resize', s.onWin);
      if (window.visualViewport) window.visualViewport.removeEventListener('resize', s.onWin);
      document.removeEventListener('pointerdown', s.onDown, true);
    }
    function setActive(s, i, scroll) {
      var pop = s.open === 'subject' ? s.subjPop : s.hotelPop, anchor = s.open === 'subject' ? s.trig : s.hotel;
      if (!pop) return;
      var prev = s.opts[s.active];
      if (prev) prev.removeAttribute('data-active');
      s.active = i;
      var o = s.opts[i];
      if (o) {
        o.setAttribute('data-active', '');
        anchor.setAttribute('aria-activedescendant', o.id);
        if (scroll) scrollIntoList(pop, o);
      } else anchor.removeAttribute('aria-activedescendant');
    }
    function optHtml(id, text, selected, data) {
      return '<div class="adv-cf-opt" role="option" id="' + id + '" aria-selected="' + (selected ? 'true' : 'false') + '"' + (data || '') + '>' + esc(text) + '</div>';
    }
    function collect(s, pop) {
      s.opts = Array.prototype.slice.call(pop.querySelectorAll('[role=option]:not([aria-disabled=true])'));
    }
    function renderSubject(s, kb) {
      var pop = s.subjPop, t = s.t;
      pop.innerHTML = t.subjects.map(function (x, i) { return optHtml(pop.id + '-' + i, x, i === s.idx, ' data-i="' + i + '"'); }).join('');
      collect(s, pop);
      // keyboard: the chosen subject (or the first) is highlighted; mouse / touch: only the chosen one shows (its tick), nothing pre-highlighted
      setActive(s, s.idx >= 0 ? s.idx : kb ? 0 : -1, false);
      return s.idx >= 0 ? s.idx : s.active;
    }
    function groupsFor(s, v) {
      var only = CITY[s.idx], order = [];
      if (only) { if (v.by[only]) order.push(only); }
      else {
        order = Object.keys(v.by).sort(function (a, b) {
          var ra = a === 'makkah' ? 0 : a === 'medina' ? 1 : 2, rb = b === 'makkah' ? 0 : b === 'medina' ? 1 : 2;
          return ra - rb || String((v.names || {})[a] || a).localeCompare(String((v.names || {})[b] || b), s.lang);
        });
      }
      return order;
    }
    function renderHotels(s) {
      var pop = s.hotelPop, t = s.t, p = data[s.lang], v = p && p.v, cur = fold(s.hotel.value), q = s.typed ? cur : '', html = '', count = 0;
      if (!p) { p = load(s.lang); }
      if (!v) {
        if (!p.__advWait) {
          p.__advWait = 1;
          p.then(safe(function () { if (s.open === 'hotel') { var sel = renderHotels(s); if (s.open === 'hotel') { place(s.hotelPop, s.hotel); if (sel >= 0) scrollIntoList(s.hotelPop, s.opts[sel]); } } }), safe(function () { if (s.open === 'hotel') closePop(s); }));
        }
        pop.innerHTML = '<div class="adv-cf-opt" role="option" aria-disabled="true" id="' + pop.id + '-wait">' + esc(t.loading) + '</div>';
        collect(s, pop);
        s.active = -1;
        return -1;
      }
      var gs = groupsFor(s, v), multi = gs.length > 1;
      gs.forEach(function (c, gi) {
        var list = (v.by[c] || []).filter(function (h) { return !q || fold(h.name).indexOf(q) >= 0; });
        if (!list.length) return;
        var gid = pop.id + '-g' + gi;
        html += '<div role="group"' + (multi ? ' aria-labelledby="' + gid + '"' : '') + '>' + (multi ? '<div class="adv-cf-grp" id="' + gid + '">' + esc((v.names || {})[c] || c) + '</div>' : '');
        list.forEach(function (h) {
          html += optHtml(pop.id + '-' + (count++), h.name, !!cur && fold(h.name) === cur, ' data-slug="' + esc(h.slug) + '" data-city="' + esc(c) + '"');
        });
        html += '</div>';
      });
      if (!count) {
        if (!q) { pop.innerHTML = ''; collect(s, pop); closePop(s); return -1; }
        html = '<div class="adv-cf-opt adv-cf-note" role="option" aria-disabled="true" id="' + pop.id + '-none">' + esc(t.noMatch) + '</div>';
      }
      pop.innerHTML = html;
      pop.scrollTop = 0;
      collect(s, pop);
      var sel = -1;
      s.opts.forEach(function (o, i) { if (o.getAttribute('aria-selected') === 'true' && sel < 0) sel = i; });
      s.active = -1;
      s.hotel.removeAttribute('aria-activedescendant');
      return sel; // the hotel already in the field: scrolled into view, not highlighted (typing keeps the free text)
    }
    function pickHotel(s, o) {
      s.hotel.value = o.textContent;
      s.picked = { name: clean(o.textContent), city: o.getAttribute('data-city') };
      filled(s);
      closePop(s);
      write(s);
    }

    /* ---- events ---- */
    function wire(s) {
      var lastKey = 0, typed = '', typedAt = 0;
      s.trig.addEventListener('click', safe(function (e) {
        if (e.detail === 0 && Date.now() - lastKey < 400) return; // keyboard: handled on keydown
        if (s.open === 'subject') closePop(s); else openPop(s, 'subject');
      }));
      s.trig.addEventListener('keydown', safe(function (e) {
        var k = e.key, open = s.open === 'subject', n = s.t.subjects.length;
        lastKey = Date.now();
        if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
          e.preventDefault();
          if (!open) openPop(s, 'subject', false, true);
          else if (s.active >= 0) { var i = s.active; closePop(s); choose(s, i); if (i === OTHER) s.other.focus(); }
          else closePop(s);
        } else if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Home' || k === 'End' || k === 'PageDown' || k === 'PageUp') {
          e.preventDefault();
          if (!open) { openPop(s, 'subject', false, true); return; } // opens on the chosen subject (or the first)
          if (e.altKey && k === 'ArrowUp') { closePop(s); return; }
          var a = s.active;
          a = k === 'ArrowDown' && a < 0 ? 0 : k === 'ArrowDown' ? Math.min(n - 1, a + 1) : k === 'ArrowUp' ? Math.max(0, a - 1) : k === 'Home' || k === 'PageUp' ? 0 : n - 1;
          setActive(s, a, true);
        } else if (k === 'Escape' || k === 'Esc') {
          if (open) { e.preventDefault(); e.stopPropagation(); closePop(s); }
        } else if (k === 'Tab') {
          if (open) closePop(s);
        } else if (k && k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          // type-ahead: the first choice that starts with what was typed
          var now = Date.now();
          typed = (now - typedAt > 700 ? '' : typed) + fold(k);
          typedAt = now;
          var subs = s.t.subjects, from = s.active < 0 ? 0 : s.active + (typed.length === 1 ? 1 : 0);
          for (var j = 0; j < n; j++) {
            var c = (from + j) % n;
            if (fold(subs[c]).indexOf(typed) === 0) {
              if (!open) openPop(s, 'subject', false, true);
              setActive(s, c, true);
              break;
            }
          }
        }
      }));
      s.subjPop.addEventListener('click', safe(function (e) {
        var o = e.target.closest && e.target.closest('[role=option]');
        if (!o || o.getAttribute('aria-disabled') === 'true') return;
        var i = +o.getAttribute('data-i');
        closePop(s);
        choose(s, i);
        if (i === OTHER) s.other.focus(); else s.trig.focus();
      }));
      [s.subjPop, s.hotelPop].forEach(function (pop) {
        pop.addEventListener('mousemove', safe(function (e) {
          var o = e.target.closest && e.target.closest('[role=option]');
          var i = o ? s.opts.indexOf(o) : -1;
          if (i >= 0 && i !== s.active) setActive(s, i, false);
        }));
      });
      s.trig.addEventListener('blur', safe(function () { setTimeout(safe(function () { if (s.open === 'subject' && document.activeElement !== s.trig) closePop(s); }), 0); }));

      s.other.addEventListener('input', safe(function () { write(s); }));
      s.hotel.addEventListener('input', safe(function () {
        s.picked = null;
        filled(s);
        write(s);
        if (document.activeElement === s.hotel) { if (s.open !== 'hotel') openPop(s, 'hotel', true); else { s.typed = true; renderHotels(s); if (s.open === 'hotel') place(s.hotelPop, s.hotel); } }
      }));
      s.hotel.addEventListener('click', safe(function () { if (s.open !== 'hotel') openPop(s, 'hotel'); }));
      s.hotel.addEventListener('keydown', safe(function (e) {
        var k = e.key, open = s.open === 'hotel', n = s.opts.length;
        if (k === 'ArrowDown' || k === 'ArrowUp') {
          e.preventDefault();
          if (!open) { openPop(s, 'hotel'); if (k === 'ArrowDown' && s.opts.length && s.active < 0) setActive(s, 0, true); return; }
          if (!n) return;
          if (k === 'ArrowDown') setActive(s, Math.min(n - 1, s.active + 1), true);
          else setActive(s, s.active <= 0 ? -1 : s.active - 1, true);
        } else if (k === 'PageDown' || k === 'PageUp') {
          if (!open || !n) return;
          e.preventDefault();
          setActive(s, k === 'PageDown' ? Math.min(n - 1, Math.max(0, s.active) + 8) : Math.max(0, s.active - 8), true);
        } else if (k === 'Enter') {
          if (!open) return; // closed: Enter sends the form as in every other field
          e.preventDefault();
          if (s.active >= 0 && s.opts[s.active]) pickHotel(s, s.opts[s.active]); else closePop(s);
        } else if (k === 'Escape' || k === 'Esc') {
          if (open) { e.preventDefault(); e.stopPropagation(); closePop(s); }
          else if (s.hotel.value) { e.preventDefault(); s.hotel.value = ''; s.picked = null; filled(s); write(s); }
        } else if (k === 'Tab') {
          if (open) closePop(s);
        }
      }));
      s.hotel.addEventListener('blur', safe(function () { setTimeout(safe(function () { if (s.open === 'hotel' && document.activeElement !== s.hotel) closePop(s); }), 0); }));
      s.hotelPop.addEventListener('click', safe(function (e) {
        var o = e.target.closest && e.target.closest('[role=option]');
        if (!o || o.getAttribute('aria-disabled') === 'true') return;
        pickHotel(s, o);
        s.hotel.focus();
      }));
      s.clearBtn.addEventListener('mousedown', function (e) { e.preventDefault(); });
      s.clearBtn.addEventListener('click', safe(function () {
        s.hotel.value = '';
        s.picked = null;
        filled(s);
        write(s);
        s.hotel.focus();
      }));
      // the theme may empty the form after sending: follow it
      var form = s.input.form;
      s.onSubmit = safe(function () {
        write(s);
        closePop(s);
        var before = document.activeElement;
        [150, 600].forEach(function (ms) { setTimeout(safe(function () { focusMissing(s, before); }), ms); });
        [300, 1200, 3000].forEach(function (ms) { setTimeout(safe(function () { resync(s); }), ms); });
      });
      if (form) {
        form.addEventListener('submit', s.onSubmit, true);
        form.addEventListener('focusin', safe(function () { resync(s); }));
      }
    }
    function destroy(s) {
      closePop(s);
      if (s.mo) s.mo.disconnect();
      if (s.subjPop.parentNode) s.subjPop.parentNode.removeChild(s.subjPop);
      if (s.hotelPop.parentNode) s.hotelPop.parentNode.removeChild(s.hotelPop);
    }
    function mountAll() {
      inst = inst.filter(function (s) {
        if (document.contains(s.ui)) return true;
        destroy(s);
        return false;
      });
      Array.prototype.forEach.call(document.querySelectorAll(SUBJECT), function (input) {
        var item = input.closest('[data-slot=form-item]');
        if (!item || !item.parentElement) return;
        var s = null;
        inst.forEach(function (x) { if (x.item === item) s = x; });
        if (!s) { mount(item, input); return; }
        if (s.input !== input) { // the theme re-created its input: follow the new one
          s.input = input;
          hideTheme(s);
          mirror(s);
          if (input.value !== compose(s)) write(s);
        } else if (input.style.display !== 'none') hideTheme(s);
      });
    }
    function app() { var el = document.querySelector('#__nuxt'); return el ? el.__vue_app__ : null; }
    function cssOk() { try { return !!getComputedStyle(document.documentElement).getPropertyValue('--adv-btn'); } catch (e) { return false; } } // v1.0.8: advisor-brand.css applied
    function go() {
      if (started) return;
      if (!cssOk()) { if ((go.n = (go.n || 0) + 1) < 50) setTimeout(safe(go), 400); return; } // v1.0.8: the theme's Subject stays without our stylesheet
      started = true;
      safe(mountAll)();
      var t = null;
      new MutationObserver(function () { clearTimeout(t); t = setTimeout(safe(mountAll), 150); }).observe(document.body, { childList: true, subtree: true });
    }
    // v1.0.8 (fix2): start once Nuxt has hydrated the page (hook, or its isHydrating flag polled); no fixed 6 s timer (see part 2)
    function hydrated(nuxt, f) {
      var done = false, n = 0;
      function run() { if (!done) { done = true; setTimeout(f, 0); } }
      nuxt.hooks.hookOnce('app:suspense:resolve', run);
      (function poll() { if (done) return; if (!nuxt.isHydrating) run(); else setTimeout(poll, ++n < 120 ? 500 : 3000); })();
    }
    function start() {
      var a = app();
      if (!a) { setTimeout(safe(start), 300); return; }
      var nuxt = a.config.globalProperties.$nuxt;
      if (nuxt && nuxt.isHydrating && nuxt.hooks && nuxt.hooks.hookOnce) hydrated(nuxt, safe(go));
      else go();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', safe(start)); else safe(start)();
  } catch (e) {}
})();
/* ---------- 6. Header, floating buttons and footer (v1.0.8, 2026-11-14) ----------
   - Phone menu: while the header menu is open, a transparent layer lies under it; the first tap outside the menu only closes the menu
     (before, the same tap also opened whatever was under the finger, e.g. the stay calendar). The layer stays until that tap's click is over.
   - Menu button (a bare 18px svg): reachable with Tab, a translated name instead of "open_navigation_menu", Enter/Space open it, aria-expanded
     follows the menu (its 44px area and the X while open are in advisor-brand.css).
   - Floating WhatsApp disc and assistant button: html[data-adv-top] while the page is at its top (and can scroll); a floating button that would
     cover a field, button or link on that first screen is tucked away ([data-adv-tuck], faded in advisor-brand.css) until the visitor scrolls;
     at any scroll position, one that would cover a form's submit button or a booking card's button is tucked away as well.
     v1.0.9: the theme's phone help pill ([data-floating-help-menu], «مساعدة» / Help) is one of them (it is never tucked while its menu is open,
     the focus is in its menu or it has the keyboard focus); the hotel page's booking card / phone booking bar «احجز», the stay summary's
     «تغيير» and the hotel's «اختر غرفة» count as main buttons.
   - Header: the Hotels link is marked ([data-adv-current]) on the hotel search results, a hotel's page and a city page.
   - Footer: the app-store badges with no address yet leave the keyboard order; WhatsApp links without a target open in a new tab. */
(function () {
  if (window.__advChrome) return;
  window.__advChrome = 1;
  var NAME = { ar: 'القائمة', en: 'Menu', fr: 'Menu' };
  var TOP = 80, started = false, shield = null, tuckT = null, scanT = null;
  function lang() {
    var l = (document.documentElement.getAttribute('lang') || 'ar').slice(0, 2).toLowerCase();
    return NAME[l] ? l : 'ar';
  }
  function app() { var el = document.querySelector('#__nuxt'); return el ? el.__vue_app__ : null; }
  function safe(f) { return function (a, b) { try { return f(a, b); } catch (e) {} }; }
  function hit(a, b, m) { return Math.min(a.right, b.right) - Math.max(a.left, b.left) > m && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > m; }

  /* --- phone menu: the first tap outside only closes it --- */
  function trig() { return document.querySelector("[data-block-id='header'] [data-slot='dropdown-menu-trigger']"); }
  function menuOpen() {
    var m = document.querySelectorAll("[data-slot='dropdown-menu-content'][data-state='open']");
    for (var i = 0; i < m.length; i++) if (m[i].querySelector('nav a[href]')) return m[i];
    return null;
  }
  function escape() {
    try { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true })); } catch (e) {}
  }
  function dropShield() {
    if (shield && shield.parentNode) shield.parentNode.removeChild(shield);
    shield = null;
  }
  function eat(e) { if (e.cancelable) e.preventDefault(); e.stopPropagation(); }
  function addShield() {
    if (shield || !menuOpen()) return;
    var s = document.createElement('div');
    s.className = 'adv-menu-shield';
    s.setAttribute('data-adv-shield', '');
    s.setAttribute('aria-hidden', 'true');
    s.style.cssText = 'position:fixed;inset:0;z-index:49;background:transparent;pointer-events:auto;touch-action:none;-webkit-tap-highlight-color:transparent';
    var closing = false, t = null;
    function finish() { clearTimeout(t); if (shield === s) dropShield(); }
    s.addEventListener('pointerdown', safe(function (e) {
      if (e.cancelable) e.preventDefault(); // no focus change, no text selection, no compatibility mouse events
      if (closing) return;
      closing = true;
      // the theme's menu closes on a pointerdown outside it; Escape as well, in case that listener did not see this one
      setTimeout(safe(function () { if (menuOpen()) escape(); }), 30);
      t = setTimeout(finish, 1500);
    }));
    // touch: the cancelled touchstart means no click follows, so the layer goes 80ms after the finger lifts (it stayed 450ms and ate a quick second tap);
    // mouse: the click on the layer follows at once and removes it
    s.addEventListener('pointerup', safe(function (e) { eat(e); clearTimeout(t); t = setTimeout(finish, 80); }));
    ['mousedown', 'mouseup', 'touchstart', 'touchend', 'contextmenu'].forEach(function (k) { s.addEventListener(k, eat, { passive: false }); });
    s.addEventListener('click', safe(function (e) { eat(e); setTimeout(finish, 0); }));
    shield = s;
    document.body.appendChild(s);
  }
  function syncMenu() {
    var tg = trig();
    if (tg) {
      // the theme's trigger is an svg: make it a keyboard-reachable button with a real name
      if (tg.getAttribute('tabindex') !== '0') tg.setAttribute('tabindex', '0');
      if (tg.getAttribute('role') !== 'button') tg.setAttribute('role', 'button');
      var n = NAME[lang()];
      if (tg.getAttribute('aria-label') !== n) tg.setAttribute('aria-label', n);
      if (!tg.__advKey) {
        tg.__advKey = 1;
        tg.addEventListener('keydown', safe(function (e) {
          if ((e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') && !e.defaultPrevented) {
            e.preventDefault();
            var was = tg.getAttribute('data-state');
            setTimeout(safe(function () { // the theme's own key handler ran first: only press it when nothing happened
              if (tg.getAttribute('data-state') === was) { try { tg.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'mouse', button: 0, isPrimary: true })); } catch (x) {} }
            }), 0);
          }
        }));
      }
      if (!tg.__advMo) {
        tg.__advMo = new MutationObserver(safe(function () { if (tg.getAttribute('data-state') === 'open') setTimeout(addShield, 0); else if (shield && !shield.__busy) setTimeout(function () { if (!menuOpen() && shield && !shield.__busy) dropShield(); }, 600); }));
        tg.__advMo.observe(tg, { attributes: true, attributeFilter: ['data-state'] });
      }
    }
    if (menuOpen()) addShield();
  }

  /* --- floating buttons: tucked away on the first screen while they would cover a control --- */
  function floats() {
    var out = [], w = document.querySelectorAll("a[data-block-id='whatsapp-chat'], button[data-slot='button'].fixed.rounded-full, [data-floating-help-menu]>button.fixed");
    for (var i = 0; i < w.length; i++) out.push(w[i]);
    return out;
  }
  var CTRL = "a[href],button,input:not([type='hidden']),select,textarea,label,[role='button'],[role='combobox'],[data-slot='popover-trigger'],[data-slot='sheet-trigger'],.cursor-pointer"; // .cursor-pointer: clickable photos / tiles (hotel gallery)
  // a form's or a booking card's main button: no floating button stays over it at any scroll position (fix review 14 Nov)
  // (not every primary button: result cards would make the floating buttons blink while the list scrolls)
  var MAINBTN = "button[type='submit'],[data-slot='card-content']>button";
  // v1.0.9: the hotel page's booking card (desktop) and booking bar (phones) button, and the buttons found by their theme label key: the stay
  // summary's «تغيير» (change_stay) and the hotel's «اختر غرفة» (choose_a_room)
  // (browser check 20 Nov: the WebBeds/other hotels' card has no .shadow-center; div.bg-card.text-card-foreground.h-fit>button matches both cards)
  var MAINBTN9 = MAINBTN + ",div.shadow-center.bg-card>button[data-slot='button'].bg-primary,div.bg-card.text-card-foreground.h-fit>button[data-slot='button'].bg-primary,[data-booking-action-bar] button[data-slot='button'].bg-primary,[data-adv-wa-book]"; // v1.0.11: and part 12's WhatsApp booking button
  var MAINKEY = "[data-theme-property*='change_stay'],[data-theme-property*='choose_a_room']";
  // a page that scrolls past the first-screen threshold at all (a short page such as /en/login scrolls 91px; 120px were required before)
  function scrollable() { var d = document.documentElement; return (d.scrollHeight - innerHeight) > TOP + 8; }
  function covers(f, sel, keys) {
    var a = f.getBoundingClientRect();
    if (!a.width || !a.height) return false;
    var own = f.parentElement && f.parentElement.hasAttribute('data-floating-help-menu') ? f.parentElement : f; // the help pill's own menu
    // v1.0.10: while the buttons are lifted over the hotel booking bar (on a short screen they may sit over its top), a page control that
    // scrolls behind the bar is out of sight: it does not count (the bar's own «احجز» still does)
    var bar = liftPx ? document.querySelector('[data-booking-action-bar]') : null, bt = bar ? bar.getBoundingClientRect().top : 0;
    var roots = document.querySelectorAll("main, [data-block-id='footer']");
    for (var r = 0; r < roots.length; r++) {
      var c = [].slice.call(roots[r].querySelectorAll(sel || CTRL));
      if (keys) {
        var k = roots[r].querySelectorAll(keys);
        for (var j = 0; j < k.length; j++) { var kb = k[j].closest ? k[j].closest('button') : null; if (kb) c.push(kb); }
      }
      for (var i = 0; i < c.length; i++) {
        var el = c[i];
        if (own.contains(el) || el.contains(f)) continue;
        var b = el.getBoundingClientRect();
        if (!b.width || !b.height || b.bottom < 0 || b.top > innerHeight || !hit(a, b, 4)) continue;
        if (bar && !bar.contains(el) && Math.max(a.top, b.top) >= bt - 1) continue;
        var cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.opacity === '0') continue;
        return true;
      }
    }
    return false;
  }
  // v1.0.9: the help pill stays while its menu is open, the focus is in its menu, or the pill has the keyboard focus (review fix: a tap leaves
  // the pill focused in Chromium and Firefox, without :focus-visible, and it must tuck again once its menu is closed; an engine without
  // :focus-visible keeps any focus)
  function held(f) {
    var m = f.parentElement;
    if (!m || !m.hasAttribute('data-floating-help-menu')) return false;
    var ae = document.activeElement;
    if (ae && ae !== document.body && m.contains(ae)) { if (ae !== f) return true; try { if (ae.matches(':focus-visible')) return true; } catch (e) { return true; } }
    var p = m.querySelector('[popover]');
    if (!p) return false;
    try { return p.matches(':popover-open'); } catch (e) { return !!(p.offsetWidth || p.offsetHeight); }
  }
  // v1.0.10: the hotel page's booking bar (below 1280px once a room is chosen; fixed at the bottom, z-index 30) hid the WhatsApp disc
  // (z-index 20), the phone help pill sat over its total, and from 768px the theme hides the assistant launcher while it is up. While the
  // bar is shown, html[data-adv-lift] and --adv-float-lift (the bar's height, in a style element of our own, since the theme manages the
  // html attributes) put the buttons 12px above it (advisor-brand.css). On a short (landscape) screen the lift is lowered to leave room
  // above the buttons (phones: 260px for the help pill and its menu; from 768px: 150px for the launcher), so they may sit over the top of
  // the bar (the lifted disc is raised above it in the CSS), but never lower than the top of the bar's «احجز» (part 6 would tuck them
  // there for as long as the bar stays), and the lift stays on (1px at least) while the bar is shown, which keeps the launcher shown.
  var liftPx = 0, liftEl = null;
  function lift() {
    var d = document.documentElement, bar = document.querySelector('[data-booking-action-bar]'), px = 0;
    if (bar) {
      var cs = getComputedStyle(bar), r = bar.getBoundingClientRect();
      if (cs.position === 'fixed' && cs.display !== 'none' && cs.visibility !== 'hidden' && r.height > 0 && r.top < innerHeight) {
        var bk = bar.querySelector("button[data-slot='button'].bg-primary"), kr = bk ? bk.getBoundingClientRect() : null;
        var clear = kr && kr.height ? Math.round(innerHeight - kr.top) + 4 : 0;
        px = Math.max(1, clear, Math.min(Math.round(innerHeight - r.top), innerHeight - (innerWidth < 768 ? 260 : 150)));
      }
    }
    if (px === liftPx) return;
    liftPx = px;
    if (px) {
      if (!liftEl || !liftEl.isConnected) { liftEl = document.createElement('style'); liftEl.id = 'adv-float-lift'; document.head.appendChild(liftEl); }
      liftEl.textContent = ':root{--adv-float-lift:' + px + 'px}';
      d.setAttribute('data-adv-lift', '');
    } else {
      d.removeAttribute('data-adv-lift');
      if (liftEl) liftEl.textContent = '';
    }
    setTimeout(safe(tuck), 450); // the bar slides in: measure again once it has settled
  }
  function tuck() {
    tuckT = null;
    lift();
    var d = document.documentElement, top = (window.pageYOffset || d.scrollTop || 0) < TOP && scrollable();
    if (top) d.setAttribute('data-adv-top', ''); else d.removeAttribute('data-adv-top');
    floats().forEach(function (f) {
      var on = !held(f) && ((top && covers(f)) || covers(f, MAINBTN9, MAINKEY));
      if (on !== f.hasAttribute('data-adv-tuck')) { if (on) f.setAttribute('data-adv-tuck', ''); else f.removeAttribute('data-adv-tuck'); }
    });
  }
  function soon(ms) { if (!tuckT) tuckT = setTimeout(safe(tuck), ms || 120); }

  /* --- header current item, footer badges, WhatsApp targets --- */
  var HOTELISH = /^(?:\/[a-z]{2}(?:-[a-z]{2})?)?\/(?:hotels\/[^\/]+|cities\/[^\/]+)\/?$/i;
  function current() {
    var p = location.pathname, on = HOTELISH.test(p);
    var links = document.querySelectorAll("[data-block-id='header'] nav a[href], [data-slot='dropdown-menu-content'] nav a[href]");
    for (var i = 0; i < links.length; i++) {
      var a = links[i], h = a.getAttribute('href') || '';
      var mine = on && /^(?:\/[a-z]{2}(?:-[a-z]{2})?)?\/hotels\/?$/i.test(h) && a.getAttribute('aria-current') !== 'page';
      if (mine !== a.hasAttribute('data-adv-current')) { if (mine) a.setAttribute('data-adv-current', ''); else a.removeAttribute('data-adv-current'); }
    }
  }
  function footer() {
    var e = document.querySelectorAll("[data-block-id='footer'] a[href='']");
    for (var i = 0; i < e.length; i++) {
      if (e[i].getAttribute('tabindex') !== '-1') { e[i].setAttribute('tabindex', '-1'); e[i].setAttribute('aria-disabled', 'true'); }
    }
    var w = document.querySelectorAll("a[href*='wa.me/']:not([target]), a[href*='api.whatsapp.com']:not([target])");
    for (var j = 0; j < w.length; j++) { w[j].setAttribute('target', '_blank'); w[j].setAttribute('rel', 'noopener'); }
  }
  function scan() {
    scanT = null;
    syncMenu();
    current();
    footer();
    soon(0);
  }
  function later(ms) { if (!scanT) scanT = setTimeout(safe(scan), ms || 150); }
  function go() {
    if (started) return;
    started = true;
    scan();
    new MutationObserver(function () { later(200); soon(300); }).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', function () {
      var now = (window.pageYOffset || 0) < TOP;
      soon(now || now !== document.documentElement.hasAttribute('data-adv-top') ? 60 : 120); // main buttons are checked at every position
    }, { passive: true });
    window.addEventListener('resize', function () { soon(200); });
    // v1.0.9: the help menu opening / closing (popover 'toggle', which does not bubble) and the focus entering / leaving it re-check at once
    var helpEv = function (e) { var t = e.target; if (t && t.closest && t.closest('[data-floating-help-menu]')) setTimeout(safe(tuck), 0); };
    ['toggle', 'focusin', 'focusout'].forEach(function (k) { document.addEventListener(k, helpEv, true); });
    try {
      var r = app().config.globalProperties.$router;
      if (r && !r.__advChrome) { r.__advChrome = 1; r.afterEach(function () { [60, 500, 1500].forEach(function (ms) { setTimeout(safe(scan), ms); }); }); }
    } catch (e) {}
    setTimeout(safe(scan), 1500);
  }
  function cssOk() { try { return !!getComputedStyle(document.documentElement).getPropertyValue('--adv-btn'); } catch (e) { return false; } }
  // v1.0.8 (fix2): start once Nuxt has hydrated the page (hook, or its isHydrating flag polled); no fixed 6 s timer (see part 2)
  function hydrated(nuxt, f) {
    var done = false, n = 0;
    function run() { if (!done) { done = true; setTimeout(f, 0); } }
    nuxt.hooks.hookOnce('app:suspense:resolve', run);
    (function poll() { if (done) return; if (!nuxt.isHydrating) run(); else setTimeout(poll, ++n < 120 ? 500 : 3000); })();
  }
  function start() {
    var a = app();
    if (!a) { setTimeout(start, 300); return; }
    var n = 0, wait = function () { if (cssOk()) go(); else if (++n < 50) setTimeout(wait, 400); }; // our stylesheet missing: change nothing
    var nuxt = a.config.globalProperties.$nuxt;
    if (nuxt && nuxt.isHydrating && nuxt.hooks && nuxt.hooks.hookOnce) hydrated(nuxt, wait);
    else wait();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', safe(start)); else safe(start)();
})();

/* ---------- 7. Pop-ups: a Done bar for guests and rooms, calendars kept inside the window, month names on the phone calendar (v1.0.8) ----------
   - Guests and rooms (desktop pop-over on the home band, results card, hotel page and city card) closed only on a click outside or Esc: it gets
     the calendar's footer bar (part 3 look): the current choice ("1 غرفة، 2 بالغين، 0 أطفال") and «تم / Done / Valider», which closes it like
     Escape and gives the focus back to the field. Phones keep the theme's own screen and its «تطبيق».
   - A calendar pop-up that opens over the sticky header or past the bottom of the window: the page scrolls once so its field sits just under the
     header, where the whole calendar and its Done bar fit (short laptop windows); the pop-up itself is capped to the room left (advisor-brand.css).
   - Phone stay calendar: a month name above each of the two stacked months (one heading "نوفمبر - ديسمبر 2026" sat above both).
   - Phone filter screens: the focus no longer lands in the minimum price box when the screen opens (the keyboard popped up); it goes to the
     screen's title. */
(function () {
  if (window.__advPop7) return;
  window.__advPop7 = 1;
  var T = {
    ar: { done: 'تم', loc: 'ar-u-nu-latn' },
    en: { done: 'Done', loc: 'en-US' },
    fr: { done: 'Valider', loc: 'fr-FR' }
  };
  var started = false, timer = null;
  function lang() {
    var l = (document.documentElement.getAttribute('lang') || 'ar').slice(0, 2).toLowerCase();
    return T[l] ? l : 'ar';
  }
  function app() { var el = document.querySelector('#__nuxt'); return el ? el.__vue_app__ : null; }
  function safe(f) { return function (a, b) { try { return f(a, b); } catch (e) {} }; }
  function triggerOf(pop) {
    var id = pop.getAttribute('aria-labelledby'), t = id && document.getElementById(id);
    if (t && !pop.contains(t)) return t;
    var c = pop.id && document.querySelector("[aria-controls='" + pop.id + "']");
    return c || null;
  }
  function text(el) { return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }

  /* --- guests and rooms --- */
  function guests(pop) {
    if (pop.__advG || pop.closest("[data-slot='sheet-content'],[data-slot='dialog-content']")) return;
    var t = T[lang()], tg = triggerOf(pop);
    var foot = document.createElement('div');
    foot.className = 'adv-cal-foot';
    foot.setAttribute('data-adv-cal-foot', 'guests');
    var sum = document.createElement('p');
    sum.className = 'adv-cal-sum';
    sum.setAttribute('aria-live', 'polite');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'adv-cal-done';
    btn.textContent = t.done;
    foot.appendChild(sum);
    foot.appendChild(btn);
    pop.appendChild(foot);
    pop.__advG = { sum: sum, tg: tg };
    function paint() {
      // "1 غرفة،2 بالغين،0 أطفال" -> "1 غرفة، 2 بالغين" (a part that counts 0 is left out, so the line fits the bar)
      var raw = text(tg), sep = /،/.test(raw) ? '، ' : ', ';
      var parts = raw.split(/\s*[،,]\s*/), keep = [];
      for (var i = 0; i < parts.length; i++) if (parts[i] && !/^0(?!\d)/.test(parts[i])) keep.push(parts[i]);
      var s = (keep.length ? keep : parts).join(sep).trim();
      if (sum.textContent !== s) sum.textContent = s;
    }
    paint();
    var q = 0;
    new MutationObserver(function () { if (!q) { q = 1; setTimeout(function () { q = 0; safe(paint)(); }, 60); } }).observe(pop, { subtree: true, childList: true, attributes: true, characterData: true });
    if (tg) new MutationObserver(function () { safe(paint)(); }).observe(tg, { subtree: true, childList: true, characterData: true });
    btn.addEventListener('click', safe(function () {
      try { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true })); } catch (e) {}
      setTimeout(safe(function () {
        if (pop.isConnected && pop.getAttribute('data-state') === 'open') { try { document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'mouse', button: 0, isPrimary: true })); } catch (e) {} }
        var a = document.activeElement;
        if (tg && tg.isConnected && (!a || a === document.body || pop.contains(a))) { try { tg.focus({ preventScroll: true }); } catch (e) {} }
      }), 120);
    }));
  }

  /* --- calendars kept inside the window, clear of the sticky header --- */
  function header() {
    var h = document.querySelector("[data-block-id='header']");
    if (!h) return 0;
    var cs = getComputedStyle(h), r = h.getBoundingClientRect();
    return (cs.position === 'sticky' || cs.position === 'fixed') && r.bottom > 0 ? r.bottom : 0;
  }
  function fit(pop) {
    if (pop.__advFit) return;
    pop.__advFit = 1;
    setTimeout(safe(function () {
      if (!pop.isConnected || pop.getAttribute('data-state') !== 'open') return;
      var tg = triggerOf(pop), r = pop.getBoundingClientRect(), hb = header();
      if (!tg) return;
      var tr = tg.getBoundingClientRect();
      if (r.top >= hb + 4 && r.bottom <= innerHeight - 4 && pop.scrollHeight <= pop.clientHeight + 2) return; // it fits whole
      // room under the field once it sits 8px under the header: enough for the whole pop-up?
      var dy = tr.top - (hb + 8);
      if (Math.abs(dy) < 8) return;
      var maxY = document.documentElement.scrollHeight - innerHeight, y = window.pageYOffset || 0;
      var ny = Math.max(0, Math.min(maxY, y + dy));
      if (Math.abs(ny - y) < 8) return;
      window.scrollTo(0, ny);
    }), 80);
  }

  /* --- phone stay calendar: a caption above each month --- */
  function captions(cal) {
    var grids = cal.querySelectorAll("[data-slot='range-calendar-grid']");
    // a caption whose month grid Vue removed (month change) is left behind before the next grid: drop every caption not directly before a grid
    var old = cal.querySelectorAll('.adv-cal-cap');
    for (var k = 0; k < old.length; k++) {
      var nx = old[k].nextElementSibling;
      if (!nx || nx.getAttribute('data-slot') !== 'range-calendar-grid' || grids.length < 2) old[k].parentNode.removeChild(old[k]);
    }
    if (grids.length < 2) return;
    var loc = T[lang()].loc;
    for (var i = 0; i < grids.length; i++) {
      var g = grids[i], d = g.querySelector("[data-slot='range-calendar-trigger']:not([data-outside-view])"), v = d && d.getAttribute('data-value');
      var cap = g.previousElementSibling && g.previousElementSibling.classList.contains('adv-cal-cap') ? g.previousElementSibling : null;
      if (!v) continue;
      var p = v.split('-'), s;
      try { s = new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+p[0], +p[1] - 1, 1))); } catch (e) { continue; }
      if (!cap) {
        cap = document.createElement('div');
        cap.className = 'adv-cal-cap';
        cap.setAttribute('aria-hidden', 'true'); // the grid already names its month to screen readers
        g.parentNode.insertBefore(cap, g);
      }
      if (cap.textContent !== s) cap.textContent = s;
    }
  }
  function phoneCal(cal) {
    if (cal.__advCap) return;
    cal.__advCap = 1;
    captions(cal);
    var q = 0;
    new MutationObserver(function () { if (!q) { q = 1; setTimeout(function () { q = 0; safe(captions)(cal); }, 40); } }).observe(cal, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-value'] });
  }

  /* --- phone filter screens: no keyboard on open --- */
  function filterFocus(sheet) {
    if (sheet.__advFf) return;
    sheet.__advFf = 1;
    [60, 350].forEach(function (ms) {
      setTimeout(safe(function () {
        var a = document.activeElement;
        if (!sheet.isConnected || !a || !sheet.contains(a) || a.tagName !== 'INPUT' || a.type !== 'number' || sheet.__advTyped) return;
        var t = sheet.querySelector("[data-slot='sheet-title']") || sheet;
        if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
        try { t.focus({ preventScroll: true }); } catch (e) {}
      }), ms);
    });
    sheet.addEventListener('keydown', function () { sheet.__advTyped = 1; }, true);
    sheet.addEventListener('pointerdown', function () { sheet.__advTyped = 1; }, true);
  }

  function scan() {
    timer = null;
    var i, p = document.querySelectorAll("[data-slot='popover-content'][data-state='open']");
    for (i = 0; i < p.length; i++) {
      // guests too (fix review 14 Nov): on a short window the field moves up under the header so the whole pop-over and its Done bar fit
      if (p[i].querySelector("[data-slot='increment']")) { guests(p[i]); if (!p[i].closest("[data-slot='sheet-content'],[data-slot='dialog-content']")) fit(p[i]); }
      if (p[i].querySelector("[data-slot='range-calendar'],[data-slot='calendar']")) fit(p[i]);
    }
    var c = document.querySelectorAll("[data-slot='dialog-content'] [data-slot='range-calendar'],[data-slot='sheet-content'] [data-slot='range-calendar'],[data-slot='drawer-content'] [data-slot='range-calendar']");
    for (i = 0; i < c.length; i++) phoneCal(c[i]);
    var s = document.querySelectorAll("[data-slot='sheet-content'][data-state='open']");
    for (i = 0; i < s.length; i++) if (s[i].querySelector("input[type='number']") && !s[i].querySelector("input[name='passengers']")) filterFocus(s[i]);
  }
  function go() {
    if (started) return;
    started = true;
    scan();
    new MutationObserver(function () { if (!timer) timer = setTimeout(safe(scan), 30); }).observe(document.body, { childList: true, subtree: true });
  }
  function cssOk() { try { return !!getComputedStyle(document.documentElement).getPropertyValue('--adv-btn'); } catch (e) { return false; } }
  // v1.0.8 (fix2): start once Nuxt has hydrated the page (hook, or its isHydrating flag polled); no fixed 6 s timer (see part 2)
  function hydrated(nuxt, f) {
    var done = false, n = 0;
    function run() { if (!done) { done = true; setTimeout(f, 0); } }
    nuxt.hooks.hookOnce('app:suspense:resolve', run);
    (function poll() { if (done) return; if (!nuxt.isHydrating) run(); else setTimeout(poll, ++n < 120 ? 500 : 3000); })();
  }
  function start() {
    var a = app();
    if (!a) { setTimeout(start, 300); return; }
    var n = 0, wait = function () { if (cssOk()) go(); else if (++n < 50) setTimeout(wait, 400); };
    var nuxt = a.config.globalProperties.$nuxt;
    if (nuxt && nuxt.isHydrating && nuxt.hooks && nuxt.hooks.hookOnce) hydrated(nuxt, wait);
    else wait();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', safe(start)); else safe(start)();
})();

/* ---------- 8. Page changes: pager, transport page title / breadcrumb / heading (v1.0.8) ----------
   - Results and blog pagers (/hotels/search, /blog, any language): after a page change the view goes to the top of the list (just under the
     sticky header); the theme left it at the pager and footer. Only a change of ?page alone; /hotels (infinite list) is not touched.
   - /transport: the page title, the breadcrumb and a page heading (the page had no h1) follow the mode (transportation / airport transfer),
     with the tab's own CMS label; html[data-adv-tr-mode] and the --adv-tr-m-label variable let advisor-brand.css name the mode on the phone
     summary card with the same words; html[data-adv-tr-searched] (set as soon as the script runs, and on every route change) marks an address
     that holds a search (route or date): only then does the empty list say "no vehicles for this route on this date" (otherwise a start prompt).
   - /packages/search: a page heading as well. */
(function () {
  if (window.__advRoutes) return;
  window.__advRoutes = 1;
  var N = {
    ar: { transportation: 'المواصلات', airport: 'النقل من المطار', packages: 'الباقات' },
    en: { transportation: 'Transportation', airport: 'Airport transfer', packages: 'Packages' },
    fr: { transportation: 'Transport', airport: "Transfert depuis l'aéroport", packages: 'Forfaits' }
  };
  var TR = /^((?:\/[a-z]{2}(?:-[a-z]{2})?)?)\/transport\/?$/i, PK = /^((?:\/[a-z]{2}(?:-[a-z]{2})?)?)\/packages\/search\/?$/i;
  var PAGER = /^(?:\/[a-z]{2}(?:-[a-z]{2})?)?\/(hotels\/search|blog)\/?$/i;
  var started = false, titleMo = null, want = null, timer = null;
  function lang() {
    var l = (document.documentElement.getAttribute('lang') || 'ar').slice(0, 2).toLowerCase();
    return N[l] ? l : 'ar';
  }
  function app() { var el = document.querySelector('#__nuxt'); return el ? el.__vue_app__ : null; }
  function safe(f) { return function (a, b) { try { return f(a, b); } catch (e) {} }; }
  function one(v) { return Object.prototype.toString.call(v) === '[object Array]' ? v[0] : v; }
  function q(name) { try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; } }
  // /transport whose address holds a search: advisor-brand.css shows "no vehicles for this route" only then (its default is the start prompt);
  // set as soon as the script runs, before the page is hydrated (fix review 14 Nov: it waited 2-20s for hydration, so "no vehicles" showed first)
  function searched(path, query) {
    var d = document.documentElement, on = TR.test(path) && !!(query.from || query.to || query.dateFrom);
    if (on !== d.hasAttribute('data-adv-tr-searched')) { if (on) d.setAttribute('data-adv-tr-searched', ''); else d.removeAttribute('data-adv-tr-searched'); }
  }
  function here() { return { from: q('from'), to: q('to'), dateFrom: q('dateFrom') }; }
  safe(function () { searched(location.pathname, here()); })();

  /* --- pager --- */
  function sameBut(a, b, skip) {
    var k, x = a || {}, y = b || {};
    for (k in x) if (Object.prototype.hasOwnProperty.call(x, k) && k !== skip && String(one(x[k])) !== String(one(y[k]))) return false;
    for (k in y) if (Object.prototype.hasOwnProperty.call(y, k) && k !== skip && !(k in x)) return false;
    return true;
  }
  function pagerTarget() {
    var pag = document.querySelector("main [data-slot='pagination']"), blk = pag && pag.closest('[data-block-id]');
    if (blk && !/^(header|footer|hotel-search)$/.test(blk.getAttribute('data-block-id'))) return blk;
    return document.querySelector('main h1:not(.sr-only)') || (pag && pag.parentElement) || null;
  }
  function toList() {
    var t = pagerTarget();
    if (!t) return;
    var h = document.querySelector("[data-block-id='header']"), hh = h ? h.getBoundingClientRect().height : 0;
    var y = Math.max(0, Math.round(t.getBoundingClientRect().top + (window.pageYOffset || 0) - hh - 12));
    if ((window.pageYOffset || 0) <= y + 4) return; // already at or above the list
    var smooth = true;
    try { smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    try { window.scrollTo({ top: y, behavior: smooth ? 'smooth' : 'auto' }); } catch (e) { window.scrollTo(0, y); }
  }
  function onPage() {
    // wait for the new page of the list to be drawn (no change in main for 150ms, at most 2.5s), then go to its top
    var main = document.querySelector('main'), t0 = Date.now(), quiet = null, mo = null;
    function done() { if (mo) mo.disconnect(); clearTimeout(quiet); safe(toList)(); }
    if (!main || !window.MutationObserver) { setTimeout(safe(toList), 300); return; }
    mo = new MutationObserver(function () { clearTimeout(quiet); if (Date.now() - t0 > 2500) done(); else quiet = setTimeout(done, 150); });
    mo.observe(main, { childList: true, subtree: true });
    quiet = setTimeout(done, 400);
  }

  /* --- transport and packages pages --- */
  function mode() {
    var m = q('mode');
    return m === 'transportation' || m === 'airport' ? m : 'airport'; // bare /transport opens the airport transfer (theme default)
  }
  function tabLabel(m) {
    var key = m === 'airport' ? 'airportTransfer' : m, el = document.querySelector("[data-block-id='hotel-search'] [data-theme-property*='\"" + key + "\"']");
    var s = el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : '';
    return s || N[lang()][m];
  }
  function setTitle(t) {
    want = t;
    if (!t) return;
    var cur = document.title || '', i = cur.lastIndexOf(' | '), site = i >= 0 ? cur.slice(i + 3) : '';
    var nt = site && cur.slice(0, i) !== t ? t + ' | ' + site : (i >= 0 ? cur : t);
    if (document.title !== nt) document.title = nt;
  }
  function heading(text, where) {
    var h = document.querySelector('main h1[data-adv-h1]');
    if (!text) { if (h && h.parentNode) h.parentNode.removeChild(h); return; }
    var others = document.querySelectorAll('main h1:not([data-adv-h1])');
    for (var i = 0; i < others.length; i++) if (others[i].getClientRects().length) { if (h && h.parentNode) h.parentNode.removeChild(h); return; }
    if (!where) return;
    if (!h) {
      h = document.createElement('h1');
      h.className = 'adv-page-h1';
      h.setAttribute('data-adv-h1', '');
    }
    if (h.textContent !== text) h.textContent = text;
    if (h.parentNode !== where || where.firstElementChild !== h) where.insertBefore(h, where.firstChild);
  }
  function apply() {
    timer = null;
    var d = document.documentElement, p = location.pathname, l = lang();
    searched(p, here());
    if (TR.test(p)) {
      var m = mode(), lab = tabLabel(m);
      d.setAttribute('data-adv-tr-mode', m);
      // the phone summary card names the mode with the same CMS words as the tab, the h1 and the title (advisor-brand.css F10)
      var cssLab = '"' + lab.replace(/[\\"]/g, '\\$&').replace(/[\n\r\f]/g, ' ') + '"';
      if (d.style.getPropertyValue('--adv-tr-m-label') !== cssLab) d.style.setProperty('--adv-tr-m-label', cssLab);
      setTitle(lab);
      var bc = document.querySelector("main [data-slot='breadcrumb-page']");
      if (bc && String(bc.textContent || '').trim() !== lab) bc.textContent = lab;
      heading(lab, document.querySelector('main>div.container.mx-auto'));
    } else if (PK.test(p)) {
      d.removeAttribute('data-adv-tr-mode'); d.style.removeProperty('--adv-tr-m-label');
      want = null;
      heading(N[l].packages, document.querySelector('main>div.container.mx-auto') || document.querySelector('main div.container:not(.mb-6)'));
    } else {
      d.removeAttribute('data-adv-tr-mode'); d.style.removeProperty('--adv-tr-m-label');
      want = null;
      heading(null);
    }
  }
  function later(ms) { if (!timer) timer = setTimeout(safe(apply), ms || 120); }
  function go() {
    if (started) return;
    started = true;
    apply();
    var r = null;
    try { r = app().config.globalProperties.$router; } catch (e) {}
    if (r && !r.__advRoutes) {
      r.__advRoutes = 1;
      r.afterEach(function (to, from, fail) {
        if (fail) return;
        try { searched(to.path, { from: one(to.query.from), to: one(to.query.to), dateFrom: one(to.query.dateFrom) }); } catch (e) {} // before the new page draws
        [30, 400, 1200].forEach(function (ms) { setTimeout(safe(apply), ms); });
        try {
          if (from && from.matched && from.matched.length && to.path === from.path && PAGER.test(to.path) && String(one(to.query.page) || '1') !== String(one(from.query.page) || '1') && sameBut(to.query, from.query, 'page')) onPage();
        } catch (e) {}
      });
    }
    new MutationObserver(function () { if (document.documentElement.hasAttribute('data-adv-tr-mode') || PK.test(location.pathname)) later(200); }).observe(document.body, { childList: true, subtree: true });
    var t = document.querySelector('head > title');
    if (t) { titleMo = new MutationObserver(function () { if (want && document.title.indexOf(want + ' | ') !== 0 && document.title !== want) later(30); }); titleMo.observe(t, { childList: true, characterData: true, subtree: true }); }
  }
  function cssOk() { try { return !!getComputedStyle(document.documentElement).getPropertyValue('--adv-btn'); } catch (e) { return false; } }
  // v1.0.8 (fix2): start once Nuxt has hydrated the page (hook, or its isHydrating flag polled); no fixed 6 s timer (see part 2)
  function hydrated(nuxt, f) {
    var done = false, n = 0;
    function run() { if (!done) { done = true; setTimeout(f, 0); } }
    nuxt.hooks.hookOnce('app:suspense:resolve', run);
    (function poll() { if (done) return; if (!nuxt.isHydrating) run(); else setTimeout(poll, ++n < 120 ? 500 : 3000); })();
  }
  function start() {
    var a = app();
    if (!a) { setTimeout(start, 300); return; }
    var n = 0, wait = function () { if (cssOk()) go(); else if (++n < 50) setTimeout(wait, 400); };
    var nuxt = a.config.globalProperties.$nuxt;
    if (nuxt && nuxt.isHydrating && nuxt.hooks && nuxt.hooks.hookOnce) hydrated(nuxt, wait);
    else wait();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', safe(start)); else safe(start)();
})();

/* ---------- 9. Transport place lists: "loading" while their places are fetched (v1.0.8) ----------
   The departure / arrival lists said «لا توجد خيارات متاحة حالياً» (advisor-brand.css v1.0.6, on an empty list) while their places were still on the
   way (slow phone connections). html[data-adv-tr-loading] is set while a /api/transport/pick… or /api/transport/drop… request runs, so
   advisor-brand.css shows "loading" instead. fetch is wrapped transparently: the original promise is returned untouched.
   (No passengers stepper: the theme's form keeps only values typed by the visitor; a value written by a script fails its validation and blocks
   the search, so the free number box stays the theme's until Jood gives it a stepper or a list.) */
(function () {
  if (window.__advForms) return;
  window.__advForms = 1;
  var pend = 0;
  try {
    var of = window.fetch;
    if (of && !of.__adv) {
      var wrapped = function (input) {
        var u = '';
        try { u = typeof input === 'string' ? input : (input && input.url) || String(input || ''); } catch (e) {}
        if (!/\/api\/transport\/(pick|drop)/i.test(u)) return of.apply(this, arguments);
        var p = of.apply(this, arguments);
        try {
          pend++;
          document.documentElement.setAttribute('data-adv-tr-loading', '');
          var done = function () { pend = Math.max(0, pend - 1); if (!pend) document.documentElement.removeAttribute('data-adv-tr-loading'); };
          p.then(done, done);
        } catch (e) {}
        return p;
      };
      wrapped.__adv = 1;
      window.fetch = wrapped;
    }
  } catch (e) {}
})();

/* ---------- 10. Theme strings left in Arabic on the French (and English) pages (v1.0.8) ----------
   Some theme texts have no French entry in Jood's dictionary and no CMS field (footer "company classification", the assistant button, the
   transport phone screen, the city page headings, the results sort, the hotel-name search, the sign-up consent, blog post dates and the post's
   booking card, the results/blog pager's screen-reader text, the room list hint, the map filter heading and its hide button; and on French pages two English filter
   names sent by the hotel API, 'Distance to haram' and 'All'): on html[lang=fr] (and lang=en for the booking card and the pager) the exact
   Arabic text is replaced by the page language's. Only whole, exact
   texts (or a known Arabic start followed by a name) are replaced, in text nodes and in aria-label / placeholder; nothing else is touched, and
   once Jood translates a text this does nothing. Vue re-renders are followed with a MutationObserver. Wording to be approved by the owner.
   v1.0.9 (theme update of 15 Nov): the phone help pill and its menu, the results phone summary «تعديل البحث», the empty results / no rooms
   panels and the hotel page's labels sent in Arabic on French pages (price start, «اختر غرفة», nights, the stay summary, tabs, read more, the
   rating title, the room +/- names). Hotel names, room names (JoodBooking data such as «فلات») and CMS texts are never touched.
   v1.0.9 review fixes: the stay calendar's label (aria-label and screen-reader heading); the theme's own French counts on French pages (whole
   short texts made only of counts: «1 chambres», «0 enfants», «prix pour 2 nuit»: singular for 0 and 1, plural from 2); a no-break space
   before the French «:». */
(function () {
  if (window.__advI18n) return;
  window.__advI18n = 1;
  var FR = {
    'قيّم رحلتك': 'Évaluez votre voyage',
    'مكان الإنطلاق': 'Lieu de départ',
    'مكان الوصول': "Lieu d'arrivée",
    'تاريخ الاستلام': 'Date de prise en charge',
    'إبدأ البحث عن رحلتك': 'Lancer la recherche',
    'السعر من الأعلى إلى الأقل': 'Prix décroissant',
    'نتائج سريعة مطابقة': 'Résultats rapides',
    'أفضل العروض في انتظاركم': 'Les meilleures offres vous attendent',
    'تصنيف الشركة': "Classification de l'entreprise",
    'وكالة السفر والسياحة': 'Agence de voyages et de tourisme',
    'اسأل المساعد': "Parler à l'assistant", // fix2: fits the theme's 144px label (124px Calibri, 126px Noto); «Demander à l'assistant» was cut
    'رقم واتساب': 'Numéro WhatsApp',
    'بالتسجيل، أنت توافق على': 'En vous inscrivant, vous acceptez nos',
    'تاريخ النشر:': 'Publié le\u00a0:',
    'تاريخ التحديث:': 'Mis à jour le\u00a0:',
    'في هذا المقال': 'Dans cet article',
    'احجز الآن': 'Réserver maintenant',
    'إحجز الآن': 'Réserver maintenant',
    // fix review 14 Nov: pager (screen-reader text and buttons), room list, map filter heading, airport-mode filter
    'الصفحة السابقة': 'Page précédente',
    'الصفحة التالية': 'Page suivante',
    'اختر عدد الغرف': 'Choisissez le nombre de chambres',
    'التصفية حسب': 'Filtrer par',
    'محطة الانطلاق': 'Point de départ',
    'إخفاء الفلاتر': 'Masquer les filtres',
    // v1.0.9: theme update of 15 Nov (help pill and menu, results phone summary, empty / no-room panels, hotel page)
    'مساعدة': 'Aide',
    'واتساب': 'WhatsApp',
    'تعديل البحث': 'Modifier la recherche',
    'اسأل المساعد عن خيارات ثانية': "Demander d'autres options à l'assistant",
    'اسألنا عبر واتساب': 'Écrivez-nous sur WhatsApp',
    'فنادق مشابهة': 'Hôtels similaires',
    'لا توجد غرف متاحة في الأسابيع الأربعة القريبة من تواريخك. تواصل معنا وسنساعدك في إيجاد إقامة.': 'Aucune chambre disponible dans les quatre semaines autour de vos dates. Contactez-nous et nous vous aiderons à trouver un hébergement.',
    'ابتداءً من': 'À partir de',
    'اختر غرفة': 'Choisir une chambre',
    'تغيير': 'Modifier',
    'لليلة واحدة': 'pour 1 nuit',
    'لليلتين': 'pour 2 nuits',
    'نظرة عامة': 'Aperçu',
    'الموقع': 'Emplacement',
    'اقرأ المزيد': 'Lire la suite',
    'قيّم تجربتك مع الحجز': 'Évaluez votre expérience de réservation',
    'إزالة غرفة واحدة': 'Retirer une chambre',
    'إضافة غرفة واحدة': 'Ajouter une chambre'
  };
  var EN = {
    'احجز الآن': 'Book now',
    'إحجز الآن': 'Book now',
    'الصفحة السابقة': 'Previous page',
    'الصفحة التالية': 'Next page',
    'اختر عدد الغرف': 'Choose the number of rooms',
    'التصفية حسب': 'Filter by',
    'محطة الانطلاق': 'Departure point',
    'إخفاء الفلاتر': 'Hide filters'
  };
  // English filter names of the hotel API left on French pages (exact texts only)
  var FR_EN = {
    'Distance to haram': 'Distance du Haram',
    'All': 'Tous',
    // browser check 20 Nov: the theme now writes the blog dates in French itself («Publié le: »): the no-break space before ':' kept
    'Publié le:': 'Publié le\u00a0:',
    'Mis à jour le:': 'Mis à jour le\u00a0:'
  };
  // a known Arabic start + a name, or a number: [regex, fr, en] ($1 = the kept part); en null = leave as is on English pages
  var RX = [
    [/^فنادق مقترحة في\s+(.+)$/, 'Hôtels suggérés à $1', null],
    [/^نصيحة\s*(\d+)$/, 'Conseil $1', null],
    [/^1 نجوم$/, '1 étoile', null],
    [/^(\d+) نجوم$/, '$1 étoiles', null],
    [/^1 راكب$/, '1 passager', '1 passenger'],
    [/^(\d+) (?:ركاب|راكب)$/, '$1 passagers', '$1 passengers'],
    [/^صورة الفندق السابقة$/, "Photo précédente de l'hôtel", 'Previous hotel photo'],
    [/^صورة الفندق التالية$/, "Photo suivante de l'hôtel", 'Next hotel photo'],
    [/^صور\s+(.+)$/, 'Photos\u00a0: $1', 'Photos: $1'],
    [/^بالتسجيل، أنت توافق على\s+(.+)$/, 'En vous inscrivant, vous acceptez nos $1', 'By signing up, you agree to our $1'],
    [/^احجز فندق\s+.+$/, 'Réserver cet hôtel', 'Book this hotel'],
    [/^شاهد الغرف المتاحة لتواريخك.*$/, 'Consultez les chambres disponibles pour vos dates et confirmez votre réservation en ligne, ou contactez-nous sur WhatsApp.', 'See the rooms available for your dates and confirm your booking online, or contact us on WhatsApp.'],
    [/^الصفحة\s+(\d+)\s+من\s+(\d+)$/, 'Page $1 sur $2', 'Page $1 of $2'],
    // v1.0.9: the hotel page's nights (the theme writes «1 ليالي» too), a room's price «لـ 3 ليالٍ» / «لـ 12 ليلة», and the stay summary
    // «1 chambres · عدد النزلاء: 2» (its French start keeps the theme's plural «chambres» for one room: corrected here, the line being rewritten)
    [/^1 (?:ليالي|ليالٍ|ليلة)$/, '1 nuit', null],
    [/^(\d+) (?:ليالي|ليالٍ|ليلة)$/, '$1 nuits', null],
    [/^لـ\s*1\s*(?:ليالي|ليالٍ|ليلة)$/, 'pour 1 nuit', null],
    [/^لـ\s*(\d+)\s*(?:ليالي|ليالٍ|ليلة)$/, 'pour $1 nuits', null],
    [/^1 chambres? · عدد النزلاء: (\d+)$/, '1 chambre · Voyageurs\u00a0: $1', null],
    [/^(\d+) chambres? · عدد النزلاء: (\d+)$/, '$1 chambres · Voyageurs\u00a0: $2', null],
    // v1.0.9 review: the stay calendar's accessible name and its screen-reader heading, the theme's Arabic label + the month(s) shown
    // («تاريخ الوصول والمغادرة, novembre - décembre 2026»); the English theme text is right already
    [/^تاريخ الوصول والمغادرة\s*[,،]\s*(.+)$/, 'Dates du séjour, $1', null]
  ];
  var ARABIC = /[؀-ۿ]/, started = false, pend = [], timer = null, full = false;
  // v1.0.9 review: the theme's own French counts (whole short texts on html[lang=fr] only): «1 chambres», «0 enfants», «prix pour 2 nuit»,
  // «1 chambres, 2 adultes» -> singular for 0 and 1, plural from 2; a text that is not only counts (a room or hotel name) is never matched
  // browser check 20 Nov: the theme now writes the stay summary in French too, «1 chambres · Voyageurs : 2» -> «1 chambre · Voyageurs\u00a0: 2»
  var FRN = /^(?:prix pour )?\d+ (?:chambre|adulte|enfant|nuit)s?(?:, ?\d+ (?:chambre|adulte|enfant)s?)*(?: · Voyageurs? ?: ?\d+)?$/;
  function frn(k) {
    if (!FRN.test(k)) return null;
    var out = k.replace(/(\d+) (chambre|adulte|enfant|nuit)s?(?![a-z])/g, function (m, n, w) { return n + ' ' + w + (+n > 1 ? 's' : ''); })
      .replace(/ · (Voyageurs?) ?: ?(\d+)$/, ' · $1\u00a0: $2');
    return out === k ? null : out;
  }
  function lang() { return (document.documentElement.getAttribute('lang') || 'ar').slice(0, 2).toLowerCase(); }
  function app() { var el = document.querySelector('#__nuxt'); return el ? el.__vue_app__ : null; }
  function safe(f) { return function (a, b) { try { return f(a, b); } catch (e) {} }; }
  function tr(s, l) {
    var k = s.replace(/\s+/g, ' ').trim();
    if (!k) return null;
    if (!ARABIC.test(k)) return l !== 'fr' ? null : (Object.prototype.hasOwnProperty.call(FR_EN, k) ? FR_EN[k] : frn(k));
    var d = l === 'fr' ? FR : EN;
    if (Object.prototype.hasOwnProperty.call(d, k)) return d[k];
    for (var i = 0; i < RX.length; i++) {
      var m = RX[i][0].exec(k), out = l === 'fr' ? RX[i][1] : RX[i][2];
      if (m && out) return out.replace('$1', m[1] || '').replace('$2', m[2] || '');
    }
    return null;
  }
  function skip(el) { return !el || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|CODE|PRE)$/.test(el.tagName) || el.isContentEditable || (el.closest && el.closest('[data-adv-cf],[data-adv-pop],[data-adv-hotel]')); }
  function latin(v, l) { if (l !== 'fr' || v.length >= 40) return false; var k = v.replace(/\s+/g, ' ').trim(); return Object.prototype.hasOwnProperty.call(FR_EN, k) || frn(k) !== null; }
  function doText(n, l) {
    var v = n.nodeValue;
    if (!v || !(ARABIC.test(v) || latin(v, l)) || skip(n.parentElement)) return;
    var out = tr(v, l);
    if (out === null) return;
    var lead = /^\s*/.exec(v)[0], tail = /\s*$/.exec(v)[0];
    // a label followed by a date (blog post) keeps one space before the <time>
    if (/[:：]$/.test(out) && !tail && n.nextSibling) tail = ' ';
    var nv = lead + out + tail;
    if (nv !== v) n.nodeValue = nv;
  }
  function doAttrs(el, l) {
    var a = ['aria-label', 'placeholder', 'title'];
    for (var i = 0; i < a.length; i++) {
      var v = el.getAttribute(a[i]);
      if (v && (ARABIC.test(v) || latin(v, l))) { var out = tr(v, l); if (out !== null && out !== v) el.setAttribute(a[i], out); }
    }
  }
  function walk(root, l) {
    if (!root) return;
    if (root.nodeType === 3) { doText(root, l); return; }
    if (root.nodeType !== 1 || skip(root)) return;
    doAttrs(root, l);
    var w = document.createTreeWalker(root, 1 | 4, null, false), n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) doText(n, l);
      else if (n.hasAttribute && (n.hasAttribute('aria-label') || n.hasAttribute('placeholder') || n.hasAttribute('title'))) doAttrs(n, l);
    }
  }
  function flush() {
    timer = null;
    var l = lang();
    if (l !== 'fr' && l !== 'en') { pend = []; full = false; return; }
    if (full) { full = false; pend = []; walk(document.body, l); return; }
    var list = pend; pend = [];
    for (var i = 0; i < list.length; i++) if (list[i].isConnected !== false) walk(list[i], l);
  }
  function queue(n) { pend.push(n); if (pend.length > 400) { full = true; } if (!timer) timer = setTimeout(safe(flush), 60); }
  function go() {
    if (started) return;
    started = true;
    full = true; flush();
    new MutationObserver(function (recs) {
      var l = lang();
      if (l !== 'fr' && l !== 'en') return;
      for (var i = 0; i < recs.length; i++) {
        var r = recs[i];
        if (r.type === 'characterData') queue(r.target);
        else if (r.type === 'attributes') queue(r.target);
        else for (var j = 0; j < r.addedNodes.length; j++) queue(r.addedNodes[j]);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['aria-label', 'placeholder', 'title'] });
    try {
      var r = app().config.globalProperties.$router;
      if (r && !r.__advI18n) { r.__advI18n = 1; r.afterEach(function () { setTimeout(function () { full = true; if (!timer) timer = setTimeout(safe(flush), 300); }, 0); }); }
    } catch (e) {}
  }
  // v1.0.8 (fix2): start once Nuxt has hydrated the page (hook, or its isHydrating flag polled); no fixed 6 s timer (see part 2)
  function hydrated(nuxt, f) {
    var done = false, n = 0;
    function run() { if (!done) { done = true; setTimeout(f, 0); } }
    nuxt.hooks.hookOnce('app:suspense:resolve', run);
    (function poll() { if (done) return; if (!nuxt.isHydrating) run(); else setTimeout(poll, ++n < 120 ? 500 : 3000); })();
  }
  function start() {
    var a = app();
    if (!a) { setTimeout(start, 300); return; }
    var nuxt = a.config.globalProperties.$nuxt;
    if (nuxt && nuxt.isHydrating && nuxt.hooks && nuxt.hooks.hookOnce) hydrated(nuxt, safe(go));
    else go();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', safe(start)); else safe(start)();
})();

/* ---------- 11. Services list: the kind of each service, for its icon (v1.0.10, 20 Nov 2026) ----------
   Jood's ServiceListCard (since about 15 Nov 2026) shows the same concierge bell for every service, and a service with no price and no
   description is a plain box with no link to read its slug from. On /services each card gets [data-adv-svc-kind] (coffee, meal, moon,
   parking, map, visa, camera, plane, bus) from the service's slug in the page data (payload "services:<locale>", matched by name), the
   card's link, or its name; advisor-brand.css draws the kind's gradient icon. A service of no known kind keeps the bell. */
(function () {
  if (window.__advSvc) return;
  window.__advSvc = 1;
  // first match wins: Ramadan meals before breakfast («افطار رمضان»), breakfast before the other meals; visa and bus before the guide
  // («تأشيرة سياحية», «باص سياحي», "tourist-visa")
  var KINDS = [
    ['moon', /iftar|ftour|souhour|suhoor|sohour|sahur|ramadan|سحور|رمضان/i],
    ['coffee', /breakfast|petit[- ]?d[ée]jeuner|فطور|افطار|إفطار/i],
    ['meal', /lunch|dinner|half[- ]?board|full[- ]?board|meal|d[ée]jeuner|d[îi]ner|repas|غداء|عشاء|وجب/i],
    ['visa', /visa|تأشير|تاشير|فيزا/i],
    ['bus', /\bbus(?:es)?\b|minibus|coach|transport|باص|حافل|نقل/i],
    ['parking', /parking|car[- ]?park|stationnement|موقف|مواقف/i],
    ['map', /guid|tour|visite|مرافق|مرشد|سياح/i],
    ['camera', /photo|تصوير/i],
    ['plane', /flight|airline|avion|طيران/i]
  ];
  var LIST = /^(?:\/[a-z]{2}(?:-[a-z]{2})?)?\/services\/?$/i;
  var started = false, timer = null;
  function app() { var el = document.querySelector('#__nuxt'); return el ? el.__vue_app__ : null; }
  function safe(f) { return function (a, b) { try { return f(a, b); } catch (e) {} }; }
  function norm(t) { return String(t || '').replace(/\s+/g, ' ').trim(); }
  function kind(s) { for (var i = 0; i < KINDS.length; i++) if (KINDS[i][1].test(s)) return KINDS[i][0]; return ''; }
  function services() {
    try {
      var n = app().config.globalProperties.$nuxt, d = n && n.payload && n.payload.data;
      var l = (document.documentElement.getAttribute('lang') || 'ar').slice(0, 2).toLowerCase();
      var v = d && d['services:' + l];
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }
  function mark() {
    timer = null;
    if (!LIST.test(location.pathname)) return;
    var grid = document.querySelector('main div.container.mx-auto>h1+div.grid');
    if (!grid) return;
    var list = services(), slugOf = {};
    for (var i = 0; i < list.length; i++) if (list[i] && list[i].slug) slugOf[norm(list[i].name)] = String(list[i].slug);
    for (var j = 0; j < grid.children.length; j++) {
      var c = grid.children[j], h = c.querySelector('h2'), name = norm(h && h.textContent), slug = slugOf[name] || '';
      if (!slug && c.tagName === 'A') {
        var m = (c.getAttribute('href') || '').match(/\/services\/([^\/?#]+)/);
        if (m) { try { slug = decodeURIComponent(m[1]); } catch (e) { slug = m[1]; } }
      }
      var k = kind(slug + ' ' + name);
      if (k) { if (c.getAttribute('data-adv-svc-kind') !== k) c.setAttribute('data-adv-svc-kind', k); }
      else if (c.hasAttribute('data-adv-svc-kind')) c.removeAttribute('data-adv-svc-kind');
    }
  }
  function later(ms) { if (!timer) timer = setTimeout(safe(mark), ms || 120); }
  function go() {
    if (started) return;
    started = true;
    mark();
    new MutationObserver(function () { if (LIST.test(location.pathname)) later(150); }).observe(document.body, { childList: true, subtree: true });
    try {
      var r = app().config.globalProperties.$router;
      if (r && !r.__advSvc) { r.__advSvc = 1; r.afterEach(function () { [60, 600].forEach(function (ms) { setTimeout(safe(mark), ms); }); }); }
    } catch (e) {}
  }
  // start once Nuxt has hydrated the page (as parts 2-10)
  function hydrated(nuxt, f) {
    var done = false, n = 0;
    function run() { if (!done) { done = true; setTimeout(f, 0); } }
    nuxt.hooks.hookOnce('app:suspense:resolve', run);
    (function poll() { if (done) return; if (!nuxt.isHydrating) run(); else setTimeout(poll, ++n < 120 ? 500 : 3000); })();
  }
  function start() {
    var a = app();
    if (!a) { setTimeout(start, 300); return; }
    var nuxt = a.config.globalProperties.$nuxt;
    if (nuxt && nuxt.isHydrating && nuxt.hooks && nuxt.hooks.hookOnce) hydrated(nuxt, safe(go));
    else go();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', safe(start)); else safe(start)();
})();

/* ---------- 12. "Complete booking on WhatsApp" next to «احجز» and «ادفع بأمان» (v1.0.11, 24 Nov 2026) ----------
   Card payment (Telr) is the only way to book on the site, and no web card payment has gone through yet. So the hotel page's booking bar
   (below 1280px, [data-booking-action-bar]), its booking card (from 1280px) and /hotels/booking-request get a secondary button
   ([data-adv-wa-book]) that opens WhatsApp (wa.me/966569083123) with the stay in the page language: hotel, check-in, check-out, nights,
   rooms (room type and board), guests, the total shown and the hotel page link. A click also sends the GA4 event whatsapp_booking_click
   (placement, hotel_name, value, currency, check_in, check_out, nights, rooms, guests) for the daily ads check. The theme's «احجز» and
   card payment, its non-refundable notices and the floating buttons are not touched; the look is in advisor-brand.css.
   The stay comes from the theme's own stores (Pinia: hotel-booking-store for Jood Booking hotels; webbeds-booking-process-store and
   webbeds-reservation-store for WebBeds hotels), the page address and what the page shows (hotel name, total). The booking request page
   has no stay in its address, so the last hotel page seen is kept for this tab (sessionStorage adv-wa-book-hotel) for its dates, guests
   and link. Fields that cannot be read are left out of the message; the button never blocks or changes the card payment. */
(function () {
  if (window.__advWaBook) return;
  window.__advWaBook = 1;
  var PHONE = '966569083123', KEY = 'adv-wa-book-hotel', EVENT = 'whatsapp_booking_click';
  var T = {
    ar: {
      btn: 'أكمل الحجز عبر واتساب', or: 'أو', note: 'نرسل تفاصيل اختيارك لفريق الحجز على واتساب ليكمل معك الحجز.',
      hello: 'السلام عليكم، أرغب في إكمال هذا الحجز عبر واتساب:', hotel: 'الفندق', cin: 'الوصول', cout: 'المغادرة', nights: 'عدد الليالي',
      rooms: 'الغرف', guests: 'النزلاء', total: 'الإجمالي المعروض', link: 'رابط الفندق', cur: 'ر.س', sep: ': ', and: '، ',
      ad: function (n) { return n + (n === 1 ? ' بالغ' : ' بالغين'); }, ch: function (n) { return n + (n === 1 ? ' طفل' : ' أطفال'); },
      loc: 'ar-SA-u-nu-latn-ca-gregory', long: true
    },
    en: {
      btn: 'Complete booking on WhatsApp', or: 'or', note: 'Your selection goes to our booking team on WhatsApp, who will complete the booking with you.',
      hello: "Hello, I'd like to complete this booking on WhatsApp:", hotel: 'Hotel', cin: 'Check-in', cout: 'Check-out', nights: 'Nights',
      rooms: 'Rooms', guests: 'Guests', total: 'Total shown', link: 'Hotel link', cur: 'SAR', sep: ': ', and: ', ',
      ad: function (n) { return n + (n === 1 ? ' adult' : ' adults'); }, ch: function (n) { return n + (n === 1 ? ' child' : ' children'); },
      loc: 'en-GB', long: false
    },
    fr: {
      btn: 'Finaliser la réservation sur WhatsApp', or: 'ou', note: 'Votre sélection est envoyée à notre équipe de réservation sur WhatsApp, qui finalisera la réservation avec vous.',
      hello: 'Bonjour, je souhaite finaliser cette réservation sur WhatsApp :', hotel: 'Hôtel', cin: 'Arrivée', cout: 'Départ', nights: 'Nuits',
      rooms: 'Chambres', guests: 'Voyageurs', total: 'Total affiché', link: "Lien de l'hôtel", cur: 'SAR', sep: ' : ', and: ', ',
      ad: function (n) { return n + (n > 1 ? ' adultes' : ' adulte'); }, ch: function (n) { return n + (n > 1 ? ' enfants' : ' enfant'); },
      loc: 'fr-FR', long: false
    }
  };
  var ICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>';
  var PRE = '(?:\\/[a-z]{2}(?:-[a-z]{2})?)?';
  var HOTEL = new RegExp('^' + PRE + '\\/hotels\\/(?!search\\/?$|booking-request\\/?$|booking-confirm\\/?$)([^\\/?#]+)\\/?$', 'i');
  var REQUEST = new RegExp('^' + PRE + '\\/hotels\\/booking-request\\/?$', 'i');
  var started = false, timer = null;
  function lang() { var l = (document.documentElement.getAttribute('lang') || 'ar').slice(0, 2).toLowerCase(); return T[l] ? l : 'ar'; }
  function safe(f) { return function (a, b) { try { return f(a, b); } catch (e) {} }; }
  function app() { var el = document.querySelector('#__nuxt'); return el ? el.__vue_app__ : null; }
  function store(id) { try { var p = app().config.globalProperties.$pinia; return (p && p._s && p._s.get(id)) || null; } catch (e) { return null; } }
  function clean(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function txt(el) { return el ? clean(el.textContent) : ''; }
  // a shown amount ("2,309.09", Arabic-Indic digits) -> number
  function num(s) {
    s = String(s == null ? '' : s).replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 1632); }).replace(/[۰-۹]/g, function (c) { return String(c.charCodeAt(0) - 1776); })
      .replace(/٫/g, '.').replace(/[,٬\s  ]/g, '');
    var m = s.match(/\d+(?:\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
  }
  function amount(v) { return v == null ? '' : (Math.round(v * 100) % 100 ? v.toFixed(2) : String(Math.round(v))); }
  function iso(s) { var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[0] : ''; }
  function utc(s) { return Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10), 12); }
  function nightsOf(a, b) { if (!a || !b) return 0; var n = Math.round((utc(b) - utc(a)) / 864e5); return n > 0 && n < 400 ? n : 0; }
  function day(s, l) {
    if (!s) return '';
    try {
      return new Intl.DateTimeFormat(T[l].loc, T[l].long ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }
        : { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(utc(s)));
    } catch (e) { return s; }
  }
  // rooms=2-1-5_1-0: rooms joined by "_", each "adults-children[-age...]"
  function guestsOf(q) {
    var a = 0, c = 0, n = 0;
    String(q || '').split('_').forEach(function (r) { var p = r.split('-'); if (!/^\d+$/.test(p[0] || '')) return; n++; a += +p[0]; c += /^\d+$/.test(p[1] || '') ? +p[1] : 0; });
    return n ? { a: a, c: c } : null;
  }
  function params(search) { try { return new URLSearchParams(search || ''); } catch (e) { return { get: function () { return null; } }; } }
  // the hotel page link with only the stay in it (no ad click ids)
  function pageLink(href) {
    try {
      var u = new URL(href, location.href), q = new URLSearchParams();
      ['city', 'checkIn', 'checkOut', 'rooms', 'provider'].forEach(function (k) { var v = u.searchParams.get(k); if (v) q.set(k, v); });
      var s = q.toString();
      return u.origin + u.pathname + (s ? '?' + s : '');
    } catch (e) { return ''; }
  }
  function remembered() { try { var v = JSON.parse(sessionStorage.getItem(KEY) || 'null'); return v && v.name ? v : null; } catch (e) { return null; } }
  function remember() {
    var m = location.pathname.match(HOTEL), h = document.querySelector('main h1');
    if (!m || !h || !txt(h)) return;
    try { sessionStorage.setItem(KEY, JSON.stringify({ name: txt(h), slug: decodeURIComponent(m[1]), href: pageLink(location.href), q: location.search })); } catch (e) {}
  }
  function same(a, b) { a = clean(a).toLowerCase(); b = clean(b).toLowerCase(); return !!a && a === b; }
  // the stay: which store holds this page's selection, its rooms, dates and guests
  function stay(page, hotel) {
    var l = lang(), jb = store('hotel-booking-store'), wb = store('webbeds-booking-process-store'), wr = store('webbeds-reservation-store');
    var slug = page === 'hotel' ? decodeURIComponent((location.pathname.match(HOTEL) || [])[1] || '') : '';
    var jr = jb && jb.selectedRooms && jb.selectedRooms.length ? jb.selectedRooms : null, jh = jb && jb.selectedHotel;
    var useJb = !!(jr && jh && (page === 'hotel' ? jh.slug === slug : same(jh.name, hotel)));
    var wrs = !useJb && wb && wb.selectedRooms && wb.selectedRooms.length ? wb.selectedRooms : null;
    var out = { rooms: [], ci: '', co: '', n: 0, g: null, link: '', value: null };
    var group = {}, order = [];
    function add(key, qty, label) { if (!group[key]) { group[key] = { q: 0, t: label }; order.push(key); } group[key].q += qty; }
    if (useJb) {
      jr.forEach(function (r) {
        var extra = [r.meal, r.viewName].filter(function (x) { return x && x !== 'null'; }).join(T[l].and);
        var label = clean(r.roomTypeName) + (extra ? ' (' + clean(extra) + ')' : '');
        add(label, +r.quantity || 1, label);
      });
      out.ci = iso(jr[0].checkIn); out.co = iso(jr[0].checkOut); out.n = +jr[0].nbrNights || 0;
      if (jb.invoiceInfo && jb.invoiceInfo.priceToPay) out.value = +jb.invoiceInfo.priceToPay;
    } else if (wrs) {
      var g = { a: 0, c: 0 };
      wrs.forEach(function (r) {
        var name = clean((l === 'ar' && r.roomTypeNameAr) || r.roomTypeName), board = clean((l === 'ar' && r.descriptionAr) || r.description);
        var label = name + (board ? ' (' + board + ')' : '');
        add(label, 1, label);
        g.a += +r.adults || 0; g.c += +r.children || 0;
      });
      if (g.a) out.g = g;
      var ri = wr && wr.reservationInfo;
      if (ri) { out.ci = iso(ri.checkin); out.co = iso(ri.checkout); }
      if (wb.invoiceInfo && wb.invoiceInfo.total) out.value = +wb.invoiceInfo.total;
    }
    order.forEach(function (k) { out.rooms.push(group[k].q + ' × ' + group[k].t); });
    var mem = page === 'request' ? remembered() : null, fromMem = !!(mem && same(mem.name, hotel));
    var q = page === 'hotel' ? params(location.search) : fromMem ? params(mem.q) : null;
    if (q) {
      if (!out.ci) out.ci = iso(q.get('checkIn'));
      if (!out.co) out.co = iso(q.get('checkOut'));
      if (!out.g) out.g = guestsOf(q.get('rooms'));
    }
    if (!out.n) out.n = nightsOf(out.ci, out.co);
    if (page === 'hotel') out.link = pageLink(location.href);
    else if (fromMem) out.link = mem.href;
    else if (useJb && jh.slug) out.link = location.origin + (l === 'ar' ? '' : '/' + l) + '/hotels/' + encodeURIComponent(jh.slug);
    return out;
  }
  // what the page shows next to the button: hotel name and total
  function shown(a) {
    var place = a.getAttribute('data-adv-wa-book'), hotel = '', totalEl = null;
    if (place === 'request') {
      var aside = document.querySelector('main aside');
      hotel = txt(aside && aside.querySelector('h2'));
      var tot = aside ? aside.querySelectorAll('p.text-xl.font-bold') : [];
      totalEl = tot.length ? tot[tot.length - 1] : null;
    } else {
      hotel = txt(document.querySelector('main h1'));
      var host = a.parentElement;
      totalEl = host && host.querySelector('p.text-4xl');
    }
    var cur = 'SAR', svg = totalEl && totalEl.parentElement && totalEl.parentElement.querySelector('svg[aria-label]');
    if (svg && /^[A-Z]{3}$/.test(svg.getAttribute('aria-label') || '')) cur = svg.getAttribute('aria-label');
    return { place: place, hotel: hotel, total: totalEl ? num(txt(totalEl)) : null, cur: cur };
  }
  function message(d, l) {
    var t = T[l], L = [t.hello];
    function line(k, v) { if (v) L.push(t[k] + t.sep + v); }
    line('hotel', d.hotel);
    line('cin', day(d.ci, l));
    line('cout', day(d.co, l));
    line('nights', d.n ? String(d.n) : '');
    line('rooms', d.rooms.join(t.and));
    line('guests', d.g && d.g.a ? [t.ad(d.g.a)].concat(d.g.c ? [t.ch(d.g.c)] : []).join(t.and) : '');
    line('total', d.total != null ? amount(d.total) + ' ' + (d.cur === 'SAR' ? t.cur : d.cur) : '');
    line('link', d.link);
    return L.join('\n');
  }
  function collect(a) {
    var s = shown(a), d = stay(s.place === 'request' ? 'request' : 'hotel', s.hotel);
    d.place = s.place; d.hotel = s.hotel; d.cur = s.cur;
    d.total = s.total != null ? s.total : d.value;
    return d;
  }
  function refresh(a) {
    var d = collect(a);
    a.href = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(message(d, lang()));
    return d;
  }
  function track(d) {
    try {
      var p = {
        placement: d.place, hotel_name: d.hotel, value: d.total != null ? Math.round(d.total * 100) / 100 : undefined, currency: d.cur,
        check_in: d.ci || undefined, check_out: d.co || undefined, nights: d.n || undefined, rooms: d.rooms.length ? d.rooms.join(' | ').slice(0, 100) : undefined,
        guests: d.g ? d.g.a + d.g.c : undefined, page_language: lang(), transport_type: 'beacon'
      };
      Object.keys(p).forEach(function (k) { if (p[k] === undefined || p[k] === '') delete p[k]; });
      if (typeof window.gtag === 'function') window.gtag('event', EVENT, p);
      else { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: EVENT, wa_booking: p }); }
    } catch (e) {}
  }
  function onClick(e) {
    var a = e.currentTarget, d = null;
    try { d = refresh(a); } catch (x) {}
    if (d) track(d);
  }
  function make(place) {
    var a = document.createElement('a'), l = lang();
    a.setAttribute('data-adv-wa-book', place);
    a.setAttribute('data-adv-lang', l);
    a.target = '_blank';
    a.rel = 'noopener';
    a.href = 'https://wa.me/' + PHONE;
    a.innerHTML = ICON + '<span></span>';
    a.lastChild.textContent = T[l].btn;
    a.addEventListener('click', onClick);
    a.addEventListener('auxclick', function (e) { if (e.button === 1) onClick(e); });
    a.addEventListener('contextmenu', function (e) { safe(refresh)(e.currentTarget); });
    a.addEventListener('focus', function (e) { safe(refresh)(e.currentTarget); });
    a.addEventListener('pointerenter', function (e) { safe(refresh)(e.currentTarget); });
    return a;
  }
  // the theme button the link goes after: in the booking bar / card it sits next to the shown total (p.text-4xl)
  function bookButtons() {
    var out = [], totals = document.querySelectorAll('main p.text-4xl.font-black');
    for (var i = 0; i < totals.length; i++) {
      var host = totals[i].parentElement && totals[i].parentElement.parentElement && totals[i].parentElement.parentElement.parentElement;
      if (!host) continue;
      var kids = host.children, b = null;
      for (var j = 0; j < kids.length; j++) if (kids[j].matches("button[data-slot='button']")) b = kids[j];
      if (b) out.push({ host: host, btn: b, place: host.closest('[data-booking-action-bar]') ? 'room_bar' : 'room_card' });
    }
    return out;
  }
  function place(host, after, kind, wrapNote) {
    var cur = host.querySelector(':scope>[data-adv-wa-book],:scope>[data-adv-wa-book-wrap]');
    var l = lang();
    if (cur) {
      var link = cur.matches('[data-adv-wa-book]') ? cur : cur.querySelector('[data-adv-wa-book]');
      if (link && link.getAttribute('data-adv-lang') === l && cur.previousElementSibling === after) return;
      cur.remove();
    }
    var a = make(kind), node = a;
    if (wrapNote) {
      node = document.createElement('div');
      node.setAttribute('data-adv-wa-book-wrap', '');
      var or = document.createElement('p'); or.className = 'adv-wa-or'; or.textContent = T[l].or;
      var note = document.createElement('p'); note.className = 'adv-wa-note'; note.textContent = T[l].note;
      node.appendChild(or); node.appendChild(a); node.appendChild(note);
    }
    after.insertAdjacentElement('afterend', node);
    safe(refresh)(a);
  }
  function scan() {
    timer = null;
    var p = location.pathname, have = document.querySelectorAll('[data-adv-wa-book]');
    for (var k = 0; k < have.length; k++) safe(refresh)(have[k]); // keep each link's message current (total, rooms) for long-press and copy
    if (HOTEL.test(p)) {
      remember();
      var bb = bookButtons();
      for (var i = 0; i < bb.length; i++) place(bb[i].host, bb[i].btn, bb[i].place, false);
    } else if (REQUEST.test(p)) {
      var sub = document.querySelector("main form button[type='submit']");
      var hotel = txt(document.querySelector('main aside h2'));
      if (sub && sub.parentElement && hotel) place(sub.parentElement, sub, 'request', true);
    }
  }
  function later(ms) { if (!timer) timer = setTimeout(safe(scan), ms || 200); }
  function go() {
    if (started) return;
    started = true;
    scan();
    new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var t = list[i].target;
        if (t && t.nodeType === 1 && t.closest && t.closest('[data-adv-wa-book],[data-adv-wa-book-wrap]')) continue;
        later(200);
        return;
      }
    }).observe(document.body, { childList: true, subtree: true });
    try {
      var r = app().config.globalProperties.$router;
      if (r && !r.__advWaBook) { r.__advWaBook = 1; r.afterEach(function () { [80, 700].forEach(function (ms) { setTimeout(safe(scan), ms); }); }); }
    } catch (e) {}
  }
  // start once Nuxt has hydrated the page (as parts 2-11)
  function hydrated(nuxt, f) {
    var done = false, n = 0;
    function run() { if (!done) { done = true; setTimeout(f, 0); } }
    nuxt.hooks.hookOnce('app:suspense:resolve', run);
    (function poll() { if (done) return; if (!nuxt.isHydrating) run(); else setTimeout(poll, ++n < 120 ? 500 : 3000); })();
  }
  function start() {
    var a = app();
    if (!a) { setTimeout(start, 300); return; }
    var nuxt = a.config.globalProperties.$nuxt;
    if (nuxt && nuxt.isHydrating && nuxt.hooks && nuxt.hooks.hookOnce) hydrated(nuxt, safe(go));
    else go();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', safe(start)); else safe(start)();
})();

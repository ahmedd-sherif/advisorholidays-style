/* advisorholidays.sa site add-ons, loaded from the CMS custom head (Meta Head) with one line, because the head is nearly full (10,000 characters).
   1. WhatsApp: every WhatsApp link opens the chat with the ready message in the page language (12 Nov 2026).
   2. Hotel picker: an optional "Hotel" field after the destination in the hotel search (13 Nov 2026; the site's own list v1.0.6).
   3. Date pickers: a Done bar (the chosen stay and its nights + «تم / Done / Valider») under every calendar pop-up (13 Nov 2026).
   4. Product tabs: on every page that shows the search band (home, results pages, hotel pages) a tab for another product opens that product's
      page (13 Nov 2026; the home page since 14 Nov 2026).
   5. Contact page: the Subject becomes a drop-down with an "Other" text and an optional hotel (13 Nov 2026).
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
  function go() {
    if (started) return;
    var a = app();
    if (!a) return;
    started = true;
    hookRouter(a);
    mountAll();
    var t = null;
    new MutationObserver(function () { clearTimeout(t); t = setTimeout(function () { guard(mountAll); }, 120); }).observe(document.body, { childList: true, subtree: true });
    setInterval(function () { if (document.querySelector('[data-adv-hotel]')) guard(sync); }, 500);
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
  function go() {
    if (started) return;
    started = true;
    scan();
    new MutationObserver(function () { if (!timer) timer = setTimeout(scan, 30); }).observe(document.body, { childList: true, subtree: true });
  }
  function app() { var el = document.querySelector('#__nuxt'); return el ? el.__vue_app__ : null; }
  function start() {
    try {
      var a = app();
      if (!a) { setTimeout(start, 300); return; }
      var nuxt = a.config.globalProperties.$nuxt;
      if (nuxt && nuxt.isHydrating && nuxt.hooks && nuxt.hooks.hookOnce) {
        nuxt.hooks.hookOnce('app:suspense:resolve', function () { setTimeout(go, 0); });
        setTimeout(go, 6000); // safety net if the hook never fires
      } else go();
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
      var down = below >= natural || below >= above;
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
    function go() {
      if (started) return;
      started = true;
      safe(mountAll)();
      var t = null;
      new MutationObserver(function () { clearTimeout(t); t = setTimeout(safe(mountAll), 150); }).observe(document.body, { childList: true, subtree: true });
    }
    function start() {
      var a = app();
      if (!a) { setTimeout(safe(start), 300); return; }
      var nuxt = a.config.globalProperties.$nuxt;
      if (nuxt && nuxt.isHydrating && nuxt.hooks && nuxt.hooks.hookOnce) {
        nuxt.hooks.hookOnce('app:suspense:resolve', function () { setTimeout(safe(go), 0); });
        setTimeout(safe(go), 6000); // safety net if the hook never fires
      } else {
        go();
      }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', safe(start)); else safe(start)();
  } catch (e) {}
})();

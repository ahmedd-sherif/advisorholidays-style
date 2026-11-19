// v1.0.9 real-browser harness. Run in a tab on https://www.advisorholidays.sa/robots.txt (same origin, no scripts, no analytics).
// H.open(path, {w, h, v}) loads a site page in a fixed iframe at the top-left. v = 'cand' (v1.0.9 test commit) or 'v108' (as live).
// Hooks are installed on the iframe's initial about:blank window before navigation (the same-origin Window is reused), so they are
// in place before any page script: Jood's deferred loader inserts @v1.0.8/advisor-site.js with document.body.appendChild -> for 'cand'
// the src is rewritten to the test commit at insertion (same moment, same attributes). The @v1.0.8 CSS link is switched off
// (media='not all') and the test-commit CSS is inserted right after it (same cascade position). Analytics requests are dropped in
// both variants. Nothing else is touched.
(function () {
  if (window.H && window.H.ver === 4) return 'exists';
  var CAND = 'https://cdn.jsdelivr.net/gh/ahmedd-sherif/advisorholidays-style@eefae49439456b0f83ce3537eb1e2065f6bb5a39/';
  var V108RE = /advisorholidays-style@v1\.0\.8\/advisor-(site\.js|brand\.css)/;
  var BLOCK = /(cloudflareinsights\.com|\/cdn-cgi\/rum|google-analytics\.com|googletagmanager\.com|doubleclick\.net|googleadservices\.com|google\.com\/(?:pagead|ccm|rmkt)|facebook\.(?:com|net)|clarity\.ms|tiktok\.com|snapchat\.com|hotjar\.com|analytics\.google)/i;
  function bad(u) { try { return BLOCK.test(String(u || '')); } catch (e) { return false; } }
  function hook(w, variant) {
    var st = w.__harn = { variant: variant, swapped: [], blocked: [] };
    function fix(n) {
      if (!n || n.nodeType !== 1) return n;
      var tag = n.tagName, s;
      if (tag === 'SCRIPT') {
        s = n.getAttribute('src') || '';
        if (variant === 'cand' && /advisorholidays-style@v1\.0\.8\/advisor-site\.js/.test(s)) { n.setAttribute('src', CAND + 'advisor-site.js'); st.swapped.push('js'); }
        else if (bad(s)) { st.blocked.push(s); n.removeAttribute('src'); n.type = 'text/x-harness-blocked'; }
      } else if ((tag === 'IMG' || tag === 'IFRAME') && bad(n.getAttribute('src'))) { st.blocked.push(n.getAttribute('src')); n.removeAttribute('src'); }
      else if (tag === 'LINK' && bad(n.getAttribute('href'))) { st.blocked.push(n.getAttribute('href')); n.removeAttribute('href'); }
      return n;
    }
    var NP = w.Node.prototype, ap = NP.appendChild, ib = NP.insertBefore;
    NP.appendChild = function (n) { return ap.call(this, fix(n)); };
    NP.insertBefore = function (n, r) { return ib.call(this, fix(n), r); };
    ['append', 'prepend', 'after', 'before'].forEach(function (k) {
      var o = w.Element.prototype[k];
      if (o) w.Element.prototype[k] = function () { for (var i = 0; i < arguments.length; i++) fix(arguments[i]); return o.apply(this, arguments); };
    });
    var of = w.fetch;
    w.fetch = function (u) { var url = u && u.url ? u.url : u; if (bad(url)) { st.blocked.push(String(url)); return w.Promise.resolve(new w.Response(null, { status: 204 })); } return of.apply(this, arguments); };
    var XP = w.XMLHttpRequest.prototype, xo = XP.open, xs = XP.send;
    XP.open = function (m, u) { this.__hb = bad(u) ? String(u) : null; return xo.apply(this, arguments); };
    XP.send = function () { if (this.__hb) { st.blocked.push(this.__hb); return; } return xs.apply(this, arguments); };
    if (w.navigator.sendBeacon) { var sb = w.navigator.sendBeacon.bind(w.navigator); w.navigator.sendBeacon = function (u, d) { if (bad(u)) { st.blocked.push(String(u)); return true; } return sb(u, d); }; }
    [['HTMLImageElement', 'src'], ['HTMLScriptElement', 'src']].forEach(function (p) {
      var d = Object.getOwnPropertyDescriptor(w[p[0]].prototype, p[1]);
      Object.defineProperty(w[p[0]].prototype, p[1], { configurable: true, enumerable: true, get: d.get, set: function (v) {
        if (bad(v)) { st.blocked.push(String(v)); if (this.tagName === 'SCRIPT') this.type = 'text/x-harness-blocked'; return; }
        if (variant === 'cand' && this.tagName === 'SCRIPT' && /advisorholidays-style@v1\.0\.8\/advisor-site\.js/.test(String(v))) { v = CAND + 'advisor-site.js'; st.swapped.push('js-prop'); }
        d.set.call(this, v);
      } });
    });
  }
  function swapCss(doc, st) {
    var l = doc.querySelector('link[href*="advisorholidays-style@v1.0.8/advisor-brand.css"]');
    if (!l) return false;
    if (l.media !== 'not all') l.media = 'not all';
    var n = l.nextElementSibling;
    if (!n || n.getAttribute('data-harness') !== 'cand') {
      n = doc.createElement('link'); n.rel = 'stylesheet'; n.href = CAND + 'advisor-brand.css'; n.setAttribute('data-harness', 'cand');
      l.parentNode.insertBefore(n, l.nextSibling);
      if (st.swapped.indexOf('css') < 0) st.swapped.push('css');
    }
    return true;
  }
  var H = window.H = { ver: 4, CAND: CAND, frame: null, last: null };
  H.win = function () { return H.frame && H.frame.contentWindow; };
  H.doc = function () { return H.frame && H.frame.contentDocument; };
  H.q = function (s) { return H.doc().querySelector(s); };
  H.qa = function (s) { return Array.prototype.slice.call(H.doc().querySelectorAll(s)); };
  H.cs = function (el, p) { var c = H.win().getComputedStyle(el); return p ? c.getPropertyValue(p) : c; };
  H.size = function (w, h) { if (H.frame) { H.frame.style.width = w + 'px'; H.frame.style.height = h + 'px'; } };
  H.open = function (path, o) {
    o = o || {}; var W = o.w || 1440, Hh = o.h || 900, v = o.v || 'cand';
    if (H.frame) H.frame.remove();
    document.documentElement.style.cssText = 'margin:0;padding:0;overflow:hidden;background:#fff';
    document.body.style.cssText = 'margin:0;padding:0;overflow:hidden;background:#fff';
    var f = H.frame = document.createElement('iframe');
    f.style.cssText = 'position:fixed;left:0;top:0;border:0;margin:0;padding:0;background:#fff;z-index:2147483647;width:' + W + 'px;height:' + Hh + 'px';
    document.body.appendChild(f);
    var w0 = f.contentWindow; hook(w0, v);
    var t0 = performance.now(), loaded = false;
    return new Promise(function (res) {
      var mo = null, timer = setInterval(function () {
        var d = f.contentDocument, cw = f.contentWindow;
        if (cw && d && d.URL !== 'about:blank' && !cw.__harn) { hook(cw, v); cw.__harn.late = Math.round(performance.now() - t0); cw.__harn.state = d.readyState; }
        if (v === 'cand' && d && d.URL !== 'about:blank' && d.head) {
          swapCss(d, f.contentWindow.__harn || { swapped: [] });
          if (!mo && d.head) { mo = new f.contentWindow.MutationObserver(function () { swapCss(d, f.contentWindow.__harn); }); mo.observe(d.head, { childList: true, subtree: true, attributes: true, attributeFilter: ['media', 'href'] }); }
        }
      }, 2);
      f.addEventListener('load', function () { loaded = true; });
      f.src = path;
      var tries = 0;
      (function wait() {
        var w = f.contentWindow, ok = loaded && w && w.__advI18n && w.__advPop7;
        if (ok || ++tries > 300) {
          clearInterval(timer); if (v === 'cand') swapCss(f.contentDocument, w.__harn);
          setTimeout(function () {
            var st = w.__harn || null, d = f.contentDocument;
            var scripts = Array.prototype.map.call(d.querySelectorAll('script[src*="advisorholidays-style"]'), function (s) { return s.getAttribute('src'); });
            var css = Array.prototype.map.call(d.querySelectorAll('link[href*="advisorholidays-style"]'), function (l) { return l.getAttribute('href').replace(/^.*@/, '@') + (l.media ? ' [' + l.media + ']' : ''); });
            var entry = Array.prototype.map.call(d.querySelectorAll('link[href*="/_nuxt/entry."]'), function (l) { return l.getAttribute('href').split('/').pop(); });
            H.last = { path: path, v: v, w: W, h: Hh, ok: !!ok, ms: Math.round(performance.now() - t0), hooked: !!(st && w.__harn === st), swapped: st && st.swapped, blocked: st && st.blocked.length, scripts: scripts.map(function (s) { return s.replace(/^.*@/, '@'); }), css: css, entry: entry, title: d.title, lang: d.documentElement.lang, url: w.location.pathname + w.location.search };
            res(H.last);
          }, o.settle || 1500);
        } else setTimeout(wait, 100);
      })();
    });
  };
  return 'H ready';
})();

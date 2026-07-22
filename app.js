/* ============================================================
   donorbook explained — animation controller.
   CSP-clean: no inline handlers; everything wired here.
   All motion is optional — the page is fully legible with JS off
   or with prefers-reduced-motion set.
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- theme toggle (persisted) ---------- */
  var THEME_KEY = 'donorbook-explained.theme';
  var root = document.documentElement;
  var themeBtn = document.getElementById('themeBtn');

  function applyTheme(t) {
    if (t === 'light' || t === 'dark') {
      root.setAttribute('data-theme', t);
    } else {
      root.removeAttribute('data-theme');
    }
    if (themeBtn) {
      var isDark = root.getAttribute('data-theme') === 'dark' ||
        (!root.hasAttribute('data-theme') &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);
      themeBtn.setAttribute('aria-pressed', String(isDark));
    }
  }

  try {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved) applyTheme(saved);
    else applyTheme(null);
  } catch (e) { applyTheme(null); }

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var cur = root.getAttribute('data-theme');
      var sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var next;
      if (!cur) next = sysDark ? 'light' : 'dark';
      else next = cur === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    });
  }

  /* ---------- progress rail ---------- */
  var railFill = document.getElementById('railFill');
  function updateRail() {
    if (!railFill) return;
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    railFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
  }

  /* ---------- reveal-on-scroll ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          revObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { revObs.observe(el); });
  }

  /* ---------- the scene ring: draw ticks + fill on scroll ---------- */
  var R = 82;
  var CIRC = 2 * Math.PI * R; // ~515.22
  var INTERVAL_DAYS = 90;     // NBTC male whole-blood, matches the equation
  var DAYS_LEFT = 29;         // the illustrative "days to go" figure
  var FILL_FRAC = (INTERVAL_DAYS - DAYS_LEFT) / INTERVAL_DAYS; // ~0.678

  // build weekly ticks around the ring (13 weeks ~ 90 days)
  var ticks = document.getElementById('srTicks');
  if (ticks) {
    var weeks = Math.round(INTERVAL_DAYS / 7);
    var frag = document.createDocumentFragment();
    for (var i = 0; i < weeks; i++) {
      var ang = (i / weeks) * 2 * Math.PI - Math.PI / 2;
      var x1 = 100 + Math.cos(ang) * 92;
      var y1 = 100 + Math.sin(ang) * 92;
      var x2 = 100 + Math.cos(ang) * 98;
      var y2 = 100 + Math.sin(ang) * 98;
      var ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      ln.setAttribute('x1', x1.toFixed(2));
      ln.setAttribute('y1', y1.toFixed(2));
      ln.setAttribute('x2', x2.toFixed(2));
      ln.setAttribute('y2', y2.toFixed(2));
      frag.appendChild(ln);
    }
    ticks.appendChild(frag);
  }

  var srFill = document.getElementById('srFill');
  function setRing(frac) {
    if (!srFill) return;
    var off = CIRC * (1 - frac);
    srFill.style.strokeDashoffset = off.toFixed(2);
  }

  if (srFill) {
    if (reduce || !('IntersectionObserver' in window)) {
      setRing(FILL_FRAC); // static filled state
    } else {
      setRing(0);
      var ringObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            setRing(FILL_FRAC);
            ringObs.unobserve(en.target);
          }
        });
      }, { threshold: 0.4 });
      ringObs.observe(srFill);
    }
  }

  /* ---------- rail on scroll (rAF-throttled) ---------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      updateRail();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateRail, { passive: true });
  updateRail();
})();

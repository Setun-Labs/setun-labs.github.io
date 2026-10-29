(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- boot sequence ---------- */
  var boot = document.getElementById('boot');
  var bootLines = document.getElementById('boot-lines');
  var heroReveals = document.querySelectorAll('#hero .reveal');

  function finishBoot() {
    if (!boot || boot.classList.contains('done')) return;
    boot.classList.add('done');
    setTimeout(function () { if (boot.parentNode) boot.parentNode.removeChild(boot); }, 450);
    heroReveals.forEach(function (el, i) {
      setTimeout(function () { el.classList.add('in'); }, 80 * i);
    });
  }

  if (reduced) {
    heroReveals.forEach(function (el) { el.classList.add('in'); });
  } else if (boot) {
    var script = [
      { text: '> SETUN LABS // SYSTEM ONLINE', cls: 'hi' },
      { text: '> THREE STARS .................... [ALIGNED]', cls: '' },
      { text: '> LAN INTERFACE .................... [OK]', cls: '' },
      { text: '> TELEMETRY ........................ [ABSENT]', cls: 'ok' },
      { text: '> RENDERING OPERATOR INTERFACE_', cls: 'hi' }
    ];
    var li = 0, ci = 0, out = [];
    var done = false;
    function type() {
      if (done) return;
      if (li >= script.length) {
        setTimeout(finishBoot, 320);
        return;
      }
      var line = script[li];
      ci++;
      var rendered = out.slice();
      rendered.push('<span class="' + line.cls + '">' + line.text.slice(0, ci) + '</span><span class="caret"></span>');
      bootLines.innerHTML = rendered.join('\n');
      if (ci >= line.text.length) {
        out.push('<span class="' + line.cls + '">' + line.text + '</span>');
        li++; ci = 0;
        setTimeout(type, 130);
      } else {
        setTimeout(type, 14 + Math.random() * 22);
      }
    }
    type();
    var skip = function () { done = true; finishBoot(); };
    window.addEventListener('wheel', skip, { once: true, passive: true });
    window.addEventListener('touchstart', skip, { once: true, passive: true });
    boot.addEventListener('click', skip, { once: true });
    setTimeout(skip, 4000); /* hard cap */
  }

  /* ---------- scroll reveal ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('main .reveal').forEach(function (el) {
    if (el.closest('#hero')) return; /* hero handled by boot */
    io.observe(el);
  });

  /* ---------- mobile nav (hamburger) ---------- */
  var navToggle = document.getElementById('nav-toggle');
  if (navToggle) {
    var headerNav = document.querySelector('header nav');
    navToggle.addEventListener('click', function () {
      var open = headerNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    headerNav.addEventListener('click', function (ev) {
      if (ev.target.tagName === 'A') {
        headerNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- feature counter (apps page) ---------- */
  var fc = document.getElementById('feature-count');
  if (fc) {
    var FC_TARGET = 257;
    var fcDone = false;
    var fcRun = function () {
      if (fcDone) return;
      fcDone = true;
      if (reduced) { fc.textContent = FC_TARGET; return; }
      var start = null;
      var step = function (now) {
        if (!start) start = now;
        var p = Math.min(1, (now - start) / 1100);
        var e = 1 - Math.pow(1 - p, 3); /* ease-out cubic: fast, then lands */
        fc.textContent = Math.round(FC_TARGET * e);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) fcRun(); });
    }, { threshold: 0.4 }).observe(fc);
  }

  /* ---------- signup (apps, models, support pages) ----------
     POSTs to the lab's Google Form; responses land in the linked Google
     Sheet, the signup database. Checkbox values must match the form's
     option text exactly, so the page labels carry the verbatim strings. */
  var SIGNUP_FORM_ID = '1FAIpQLScHhNOioA3nf2Iod9x3w4d_DWgSTW_E5r7tWQjH3Wd4ZRpQeA';
  var SIGNUP_EMAIL_ENTRY = 'entry.294373358';  /* "What is your email?" */
  var SIGNUP_LISTS_ENTRY = 'entry.758765631';  /* "How would you like to support?" */
  var SIGNUP_CONFIGURED = Boolean(SIGNUP_FORM_ID && SIGNUP_EMAIL_ENTRY && SIGNUP_LISTS_ENTRY);

  document.querySelectorAll('form.signup').forEach(function (form) {
    var email = form.querySelector('#signup-email');
    var status = form.parentNode.querySelector('#signup-status');
    if (!email || !status) return;

    function showReceived(addr, lists) {
      status.className = 'received';
      status.innerHTML = '<span class="dot green" style="animation:none;opacity:1"></span>SIGNAL RECEIVED // ' +
        addr.replace(/[<>&"]/g, '') + ' · ' + lists.join(' · ');
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var addr = email.value.trim();
      var lists = Array.prototype.map.call(
        form.querySelectorAll('.signup-list:checked'),
        function (cb) { return cb.value; }
      );
      if (!addr || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) {
        status.className = '';
        status.textContent = '⬢ INVALID SIGNAL // CHECK ADDRESS FORMAT';
        return;
      }
      if (!lists.length) {
        status.className = '';
        status.textContent = '⬢ PICK AT LEAST ONE LIST // NOTIFICATIONS · BETA · EARLY ACCESS';
        return;
      }
      if (!SIGNUP_CONFIGURED) {
        status.className = '';
        status.textContent = '⬢ LISTS NOT LIVE YET // EMAIL SETUNLABS@GMAIL.COM AND NAME YOUR LIST(S)';
        return;
      }
      var body = new FormData();
      body.append(SIGNUP_EMAIL_ENTRY, addr);
      lists.forEach(function (l) { body.append(SIGNUP_LISTS_ENTRY, l); });
      /* no-cors: Google Forms accepts the POST but the response is opaque;
         success is verified in the linked Sheet. */
      fetch('https://docs.google.com/forms/d/e/' + SIGNUP_FORM_ID + '/formResponse', {
        method: 'POST', mode: 'no-cors', body: body
      }).then(function () {
        try { localStorage.setItem('setunlabs_signup', JSON.stringify({ email: addr, lists: lists })); } catch (e) { /* no-op */ }
        showReceived(addr, lists);
        email.value = '';
        email.placeholder = 'ADDRESS LOGGED';
      }).catch(function () {
        status.className = '';
        status.textContent = '⬢ SIGNAL LOST // CHECK CONNECTION AND RETRY';
      });
    });
  });

  /* ---------- article share (news page) ----------
     Native share sheet where the browser offers one, clipboard with a
     confirmation label everywhere else. */
  document.querySelectorAll('[data-share]').forEach(function (btn) {
    var label = btn.querySelector('span');
    var orig = label ? label.textContent : '';
    function copied() {
      if (!label) return;
      label.textContent = 'LINK COPIED';
      setTimeout(function () { label.textContent = orig; }, 1600);
    }
    function copyFallback() {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(btn.getAttribute('data-share-url') || location.href).then(copied, function () {});
      } else {
        var tmp = document.createElement('textarea');
        tmp.value = btn.getAttribute('data-share-url') || location.href;
        document.body.appendChild(tmp);
        tmp.select();
        try { document.execCommand('copy'); copied(); } catch (e) { /* no-op */ }
        document.body.removeChild(tmp);
      }
    }
    btn.addEventListener('click', function () {
      var payload = {
        title: btn.getAttribute('data-share-title') || document.title,
        text: btn.getAttribute('data-share-text') || '',
        url: btn.getAttribute('data-share-url') || location.href
      };
      if (navigator.share) {
        navigator.share(payload).catch(function (err) {
          if (err && err.name === 'AbortError') return;
          copyFallback();
        });
      } else {
        copyFallback();
      }
    });
  });
})();

/* ---------- hero background: Orion + a deep field ----------
   The hunter complete, head, shoulders, belt, hanging sword, legs, the
   raised club (χ Ori) and the lion-pelt shield (π Ori), in true RA/Dec
   geometry, leaning left at the reference photo's attitude. Around him a
   sparse field of drifting stars with faint threads between FIELD stars
   only, Orion is the ONLY constellation on this sky, and nothing is
   anchored on top of him. Pulses travel the figure's edges. Hover any
   figure star for its name. Fully procedural; state is a pure function of
   elapsed time, so a fixed instant renders via ?t=<ms>. */
(function () {
  'use strict';

  var canvas = document.getElementById('hero-bg');
  var hero = document.getElementById('hero');
  var veil = hero ? hero.querySelector('.hero-veil') : null;
  if (!canvas || !hero || !veil) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var TAU = Math.PI * 2;
  var SEPIA = '200,184,154';
  var GOLD = '200,168,96';
  var RED = '200,112,96';
  var BLUE = '170,200,240';
  var CORE = '235,226,201';

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function wrap(v, lo, hi) {
    var r = hi - lo;
    return ((((v - lo) % r) + r) % r) + lo;
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var qs = new URLSearchParams(window.location.search);
  var fixedT = qs.has('t') ? Math.max(0, parseFloat(qs.get('t')) / 1000 || 0) : null;

  var W = 0, H = 0, DPR = 1;
  /* ==== EMBLEM CONTROLS, edit these to move/resize the constellation ====
     Nothing else repositions it: no re-fitting, no per-screen jumping. */
  var BELT_FROM_RIGHT = 560;  /* desktop: px from the viewport's right edge */
  var BELT_FROM_TOP   = 500;  /* desktop: px from the hero's top edge */
  var BELT_GAP        = 96;   /* px between belt stars, size of the mark */
  var FIGURE_SCALE    = 0.29; /* body length relative to the belt */

  var belt = { cx: 0, cy: 0, angle: -0.433, gap: BELT_GAP, size: 22 };
  /* true belt tilt in the upright sky frame: Mintaka sits 36.8° above
     Alnitak; the display attitude leans the whole figure from there while
     keeping every relative position astronomically accurate. */
  var TRUE_BELT = -0.643;
  var FIG_ROT = 0;

  /* Orion in true sky coordinates: x = −RA, y = −Dec (x right, y DOWN),
     relative to Alnilam, in units of belt gap (Alnilam→Mintaka ≈ 1.383°).
     The belt stars live at u = -1, 0, +1 and are drawn separately as the
     lab's mark. s = star size, col = star color. */
  var CONSTELLATION = [
    { u: -3.43, v: -6.22, s: 11, col: RED,   name: 'BETELGEUSE' },
    { u:  2.00, v: -5.46, s: 9,  col: SEPIA, name: 'BELLATRIX' },
    { u:  0.16, v: -8.05, s: 6,  col: SEPIA, name: 'MEISSA' },
    { u:  0.61, v:  1.85, s: 4,  col: SEPIA, name: '42 ORIONIS', dim: true },
    { u:  0.18, v:  3.03, s: 4,  col: SEPIA, name: 'M42 · ORION NEBULA', dim: true },
    { u:  0.14, v:  3.41, s: 4,  col: SEPIA, name: 'IOTA ORIONIS', dim: true },
    { u: -2.09, v:  6.12, s: 9,  col: SEPIA, name: 'SAIPH' },
    { u:  3.94, v:  5.06, s: 11, col: BLUE,  name: 'RIGEL' },
    { u: -5.01, v: -15.42, s: 5, col: SEPIA, name: 'χ2 ORIONIS, THE CLUB' },
    { u: -3.29, v: -15.53, s: 5, col: SEPIA, name: 'χ1 ORIONIS, THE CLUB' },
    { u:  8.14, v: -4.92, s: 5,  col: SEPIA, name: 'π4 ORIONIS, THE SHIELD' },
    { u:  8.38, v: -5.90, s: 5,  col: SEPIA, name: 'π3 ORIONIS, THE SHIELD' },
    { u:  8.24, v: -7.30, s: 5,  col: SEPIA, name: 'π2 ORIONIS, THE SHIELD' }
  ];
  var BELT_NAMES = ['ALNITAK', 'ALNILAM', 'MINTAKA'];
  /* stick-figure edges: numbers index CONSTELLATION, 'a'/'n'/'m' are the
     belt stars (Alnitak / Alnilam / Mintaka) */
  var EDGES = [
    [0, 1], [0, 2], [1, 2],          /* shoulders + head */
    [0, 'a'], [1, 'm'],              /* shoulders to belt */
    ['a', 6], ['m', 7], [6, 7],      /* legs */
    ['n', 3], [3, 4], [4, 5],        /* the hanging sword */
    [0, 8], [8, 9],                  /* the raised club */
    [1, 10], [10, 11], [11, 12]      /* the shield arc */
  ];

  var nodes = [];
  var pulses = [];

  /* star order along the line: 0 = Alnitak, 1 = Alnilam, 2 = Mintaka */
  function starPos(i, t, out) {
    var drift = Math.sin(t * 0.05) * 3;
    var ca = Math.cos(belt.angle), sa = Math.sin(belt.angle);
    var upx = (i - 1) * belt.gap;
    out.x = belt.cx + ca * upx - sa * drift;
    out.y = belt.cy + sa * upx + ca * drift;
    return out;
  }

  /* the figure's exclusion zone: field stars never spawn inside it, so
     nothing sits on top of the hunter. Computed in build() from the
     rotated extents (gaps -> px). */
  var EXCL = { x0: 0, y0: 0, x1: 0, y1: 0 };

  function build() {
    /* canvas is full-bleed (viewport width x hero height), size from the
       element, and pin CSS width to clientWidth (excludes the scrollbar)
       so a 100vw canvas never creates horizontal overflow */
    var vw = document.documentElement.clientWidth;
    canvas.style.width = vw + 'px';
    veil.style.width = vw + 'px';
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    var narrow = W < 720;
    if (narrow) {
      belt.gap = Math.max(44, W * 0.12);
      belt.size = 13;
      belt.cx = W * 0.62; belt.cy = H * 0.40;
      FIGURE_SCALE = 0.28;
    } else {
      /* FIXED SIZE, the emblem never resizes on desktop, it only moves:
         right-anchored horizontally, raised on short windows so the whole
         figure always sits between the header and the fold */
      belt.gap = BELT_GAP;
      belt.size = 22;
      FIGURE_SCALE = 0.29;
      var unit = BELT_GAP * FIGURE_SCALE;
      belt.cx = Math.max(W - BELT_FROM_RIGHT, 20 + 12.05 * unit);
      var viewH = Math.min(H, window.innerHeight);
      belt.cy = Math.max(90 + 11.8 * unit, Math.min(BELT_FROM_TOP, viewH - 40 - 6.35 * unit));
    }
    /* lean: degrees right of upright. Default -30 (clear leftward tilt,
       like the reference photo); override live via ?lean=<deg> */
    var leanQ = parseFloat(qs.get('lean'));
    var leanDeg = isFinite(leanQ) ? leanQ : -30;
    belt.angle = TRUE_BELT + leanDeg * Math.PI / 180;
    FIG_ROT = belt.angle - TRUE_BELT;

    /* exclusion zone around the figure: rotated extents plus margin */
    var crE = Math.cos(FIG_ROT), srE = Math.sin(FIG_ROT);
    var mnU = 99, mxU = -99, mnV = 99, mxV = -99;
    var ei;
    for (ei = 0; ei < CONSTELLATION.length + 3; ei++) {
      var eu = ei < 3 ? ei - 1 : CONSTELLATION[ei - 3].u;
      var ev = ei < 3 ? 0 : CONSTELLATION[ei - 3].v;
      var ru = eu * crE - ev * srE, rv = eu * srE + ev * crE;
      if (ru < mnU) mnU = ru;
      if (ru > mxU) mxU = ru;
      if (rv < mnV) mnV = rv;
      if (rv > mxV) mxV = rv;
    }
    var eu2 = belt.gap * FIGURE_SCALE;
    var margin = 14;
    EXCL.x0 = belt.cx + mnU * eu2 - margin; EXCL.x1 = belt.cx + mxU * eu2 + margin;
    EXCL.y0 = belt.cy + mnV * eu2 - margin; EXCL.y1 = belt.cy + mxV * eu2 + margin;

    var rng = mulberry32(20261026);
    nodes = [];
    var i;

    /* the hunter: constellation stars anchored to the figure, each with a
       small slow drift so the shape floats without dissolving */
    for (i = 0; i < CONSTELLATION.length; i++) {
      nodes.push({
        const: i,
        driftR: 3 + rng() * 3.5,
        driftSpd: 0.08 + rng() * 0.10,
        phase: rng() * TAU
      });
    }
    /* the star field: drifting points, spawned OUTSIDE the figure's zone */
    var field = narrow ? 22 : (W > 2200 ? 64 : 52);
    for (i = 0; i < field; i++) {
      var fx, fy, tries = 0;
      do {
        fx = rng() * W; fy = rng() * H;
        tries++;
      } while (tries < 40 && fx > EXCL.x0 && fx < EXCL.x1 && fy > EXCL.y0 && fy < EXCL.y1);
      nodes.push({
        orbit: false,
        x: fx, y: fy,
        vx: (rng() - 0.5) * 4, vy: (rng() - 0.5) * 4,
        size: 1.1 + rng() * 1.5,
        breathe: rng() < 0.4,
        phase: rng() * TAU
      });
    }

    /* pulse schedule: signals travel the figure's own edges */
    pulses = [];
    var prng = mulberry32(0x1A2B3C);
    var ts = 1.6;
    for (i = 0; i < 400; i++) {
      pulses.push({
        start: ts,
        e: Math.floor(prng() * EDGES.length),
        dur: 1.1,
        red: prng() < 0.15,
        rev: prng() < 0.5
      });
      ts += 2.4 + prng() * 3.2;
    }
  }

  function nodePos(n, t, out) {
    if (n.const !== undefined) {
      var c = CONSTELLATION[n.const];
      /* sky frame, leaned to the display attitude, plus one shared slow
         sway so the constellation drifts like a rising sky */
      var ux = c.u * belt.gap * FIGURE_SCALE;
      var uy = c.v * belt.gap * FIGURE_SCALE;
      var cr = Math.cos(FIG_ROT), sr = Math.sin(FIG_ROT);
      out.x = belt.cx + ux * cr - uy * sr;
      out.y = belt.cy + ux * sr + uy * cr + Math.sin(t * 0.05) * 3;
      out.x += Math.cos(t * n.driftSpd + n.phase) * n.driftR;
      out.y += Math.sin(t * n.driftSpd * 0.8 + n.phase) * n.driftR;
    } else {
      out.x = wrap(n.x + n.vx * t, -24, W + 24);
      out.y = wrap(n.y + n.vy * t, -24, H + 24);
    }
    return out;
  }

  /* 4-point star: long vertical spike, shorter horizontal, the tarot
     sparkle. Breathing is keyed to t so every frame is deterministic. */
  function drawStar(x, y, size, t, phase, bright, glow, rgb) {
    var tw = 0.72 + 0.28 * Math.sin((t * TAU) / 3.4 + phase);
    var s = size * (0.94 + 0.10 * Math.sin((t * TAU) / 2.6 + phase + 1));
    var a = (bright ? 0.95 : 0.72) * tw;

    if (glow) {
      var g = ctx.createRadialGradient(x, y, s * 0.2, x, y, s * 3.4);
      g.addColorStop(0, 'rgba(' + rgb + ',' + (0.14 * tw).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + rgb + ',0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - s * 3.5, y - s * 3.5, s * 7, s * 7);
    }

    /* sparkle body */
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.quadraticCurveTo(x, y, x + s * 0.42, y);
    ctx.quadraticCurveTo(x, y, x, y + s);
    ctx.quadraticCurveTo(x, y, x - s * 0.42, y);
    ctx.quadraticCurveTo(x, y, x, y - s);
    ctx.closePath();
    ctx.fillStyle = 'rgba(' + rgb + ',' + a.toFixed(3) + ')';
    ctx.fill();

    /* bright core */
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1.5, s * 0.10), 0, TAU);
    ctx.fillStyle = 'rgba(' + CORE + ',' + Math.min(1, a + 0.12).toFixed(3) + ')';
    ctx.fill();
  }

  function drawBelt(t, sy) {
    var P = drawBelt._p || (drawBelt._p = [{}, {}, {}]);
    var i;
    for (i = 0; i < 3; i++) starPos(i, t, P[i]);
    var lift = sy * 0.12;

    /* the belt line connects the outer stars exactly, like every other
       wire in the figure, no overshoot past Alnitak or Mintaka */
    ctx.strokeStyle = 'rgba(' + GOLD + ',0.20)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(P[0].x, P[0].y - lift);
    ctx.lineTo(P[2].x, P[2].y - lift);
    ctx.stroke();

    /* halos around Alnilam: two dashed squares rotating slowly in opposite
       directions, kept faint so the stars read first, the cube second */
    for (i = 0; i < 2; i++) {
      var rot = t * (i === 0 ? 0.06 : -0.045) + Math.PI / 4 + i * (Math.PI / 5);
      var rr = belt.size * 2.3 * (1 + i * 0.28);
      ctx.save();
      ctx.translate(P[1].x, P[1].y - lift);
      ctx.rotate(rot);
      ctx.strokeStyle = 'rgba(' + SEPIA + ',' + (i === 0 ? 0.15 : 0.09) + ')';
      ctx.lineWidth = 1;
      ctx.setLineDash(i === 0 ? [2, 7] : [1, 6]);
      ctx.strokeRect(-rr, -rr, rr * 2, rr * 2);
      ctx.restore();
    }

    /* the three stars: Alnilam (middle) burns brightest */
    drawStar(P[0].x, P[0].y - lift, belt.size, t, 0.0, false, true, GOLD);
    drawStar(P[1].x, P[1].y - lift, belt.size * 1.25, t, 2.1, true, true, GOLD);
    drawStar(P[2].x, P[2].y - lift, belt.size, t, 4.2, false, true, GOLD);
  }

  var PA = { x: 0, y: 0 }, PB = { x: 0, y: 0 };

  function edgePoint(e, t, out) {
    if (e === 'a') return starPos(0, t, out);
    if (e === 'n') return starPos(1, t, out);
    if (e === 'm') return starPos(2, t, out);
    out.x = edgePoint._pos[e].x; out.y = edgePoint._pos[e].y;
    return out;
  }

  function render(t) {
    render._t = t;
    ctx.clearRect(0, 0, W, H);
    var sy = window.scrollY || window.pageYOffset || 0;
    var nodeSy = sy * 0.06;

    var i, j;
    var pos = render._pos;
    if (!pos || pos.length !== nodes.length) {
      pos = [];
      for (i = 0; i < nodes.length; i++) pos.push({ x: 0, y: 0 });
      render._pos = pos;
    }
    edgePoint._pos = pos;
    for (i = 0; i < nodes.length; i++) nodePos(nodes[i], t, pos[i]);

    drawBelt(t, sy);

    /* the hunter's figure: the only constellation lines on the sky. The
       sword (edges 8-10) hangs as a faint detail so it never tangles the
       waist */
    ctx.lineWidth = 1;
    for (i = 0; i < EDGES.length; i++) {
      var dimEdge = i >= 8 && i <= 10;
      ctx.strokeStyle = 'rgba(' + SEPIA + ',' + (dimEdge ? 0.16 : 0.34) + ')';
      edgePoint(EDGES[i][0], t, PA);
      edgePoint(EDGES[i][1], t, PB);
      ctx.beginPath();
      ctx.moveTo(PA.x, PA.y - nodeSy);
      ctx.lineTo(PB.x, PB.y - nodeSy);
      ctx.stroke();
    }

    /* background threads: faint wires among FIELD stars only, they never
       touch the figure, and they are suppressed where they would cross
       the figure's exclusion zone */
    var thr = Math.min(W, H) * (W < 720 ? 0.22 : 0.17);
    for (i = 0; i < nodes.length; i++) {
      if (nodes[i].const !== undefined) continue;
      for (j = i + 1; j < nodes.length; j++) {
        if (nodes[j].const !== undefined) continue;
        var dx = pos[i].x - pos[j].x, dy = pos[i].y - pos[j].y;
        var d2 = dx * dx + dy * dy;
        if (d2 > thr * thr) continue;
        var d = Math.sqrt(d2);
        /* skip any thread whose midpoint sits on the figure */
        var mx2 = (pos[i].x + pos[j].x) / 2, my2 = (pos[i].y + pos[j].y) / 2;
        if (mx2 > EXCL.x0 && mx2 < EXCL.x1 && my2 > EXCL.y0 && my2 < EXCL.y1) continue;
        var alpha = 0.05 + 0.08 * (1 - d / thr);
        ctx.strokeStyle = 'rgba(' + SEPIA + ',' + alpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(pos[i].x, pos[i].y - nodeSy);
        ctx.lineTo(pos[j].x, pos[j].y - nodeSy);
        ctx.stroke();
      }
    }

    /* stars: figure sparkles; the field stays tiny dots */
    for (i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var x = pos[i].x, y = pos[i].y - nodeSy;
      if (n.const !== undefined) {
        var c = CONSTELLATION[n.const];
        drawStar(x, y, c.s, t, n.phase, false, !c.dim, c.col);
      } else {
        var alpha2 = 0.34;
        if (n.breathe) alpha2 = 0.34 * (0.55 + 0.45 * Math.sin((t * TAU) / 2.6 + n.phase));
        ctx.beginPath();
        ctx.arc(x, y, n.size, 0, TAU);
        ctx.fillStyle = 'rgba(' + SEPIA + ',' + alpha2.toFixed(3) + ')';
        ctx.fill();
      }
    }

    /* transmission pulses along the figure's edges */
    for (i = 0; i < pulses.length; i++) {
      var p = pulses[i];
      if (t < p.start) { if (p.start - t > 6) break; else continue; }
      var age = t - p.start;
      if (age > p.dur + 0.6) continue;

      var e = EDGES[p.e];
      edgePoint(e[0], t, PA);
      edgePoint(e[1], t, PB);
      if (p.rev) { var tx = PA.x, ty = PA.y; PA.x = PB.x; PA.y = PB.y; PB.x = tx; PB.y = ty; }

      var col = p.red ? RED : GOLD;
      if (age <= p.dur) {
        var k = age / p.dur;
        k = 1 - Math.pow(1 - k, 2); /* ease-out */
        var px2 = PA.x + (PB.x - PA.x) * k;
        var py2 = (PA.y + (PB.y - PA.y) * k) - nodeSy;
        /* faint lit trail behind the pulse head */
        ctx.strokeStyle = 'rgba(' + col + ',0.30)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PA.x, PA.y - nodeSy);
        ctx.lineTo(px2, py2);
        ctx.stroke();
        ctx.beginPath(); ctx.arc(px2, py2, 2.2, 0, TAU);
        ctx.fillStyle = 'rgba(' + col + ',0.85)';
        ctx.fill();
      } else {
        var ft = (age - p.dur) / 0.6;
        var fa = (1 - ft) * 0.75;
        var fr = 3 + ft * 9;
        ctx.beginPath(); ctx.arc(PB.x, PB.y - nodeSy, fr, 0, TAU);
        ctx.strokeStyle = 'rgba(' + col + ',' + fa.toFixed(3) + ')';
        ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.arc(PB.x, PB.y - nodeSy, 2.4, 0, TAU);
        ctx.fillStyle = 'rgba(' + col + ',' + fa.toFixed(3) + ')';
        ctx.fill();
      }
    }
  }

  /* ---------- star hover names ---------- */
  var tip = document.createElement('div');
  tip.className = 'star-tip';
  hero.appendChild(tip);

  hero.addEventListener('mousemove', function (ev) {
    var hr = hero.getBoundingClientRect();
    var cr = canvas.getBoundingClientRect();
    /* canvas is 100vw and centered on the viewport; the hero column is
       narrower, hit-test in CANVAS coordinates, place the tip in hero
       coordinates */
    var mx = ev.clientX - cr.left, my = ev.clientY - cr.top;
    var t = render._t || 0;
    var pos = render._pos;
    if (!pos) return;
    var best = null, bestD = 18;
    var P = {};
    var i, d;
    for (i = 0; i < 3; i++) {
      starPos(i, t, P);
      d = Math.hypot(P.x - mx, P.y - my);
      if (d < bestD) { bestD = d; best = BELT_NAMES[i]; }
    }
    for (i = 0; i < CONSTELLATION.length; i++) {
      d = Math.hypot(pos[i].x - mx, pos[i].y - my);
      if (d < bestD) { bestD = d; best = CONSTELLATION[i].name; }
    }
    if (best) {
      tip.textContent = best;
      tip.style.left = (ev.clientX - hr.left + 16) + 'px';
      tip.style.top = (ev.clientY - hr.top - 10) + 'px';
      tip.style.display = 'block';
    } else {
      tip.style.display = 'none';
    }
  });
  hero.addEventListener('mouseleave', function () { tip.style.display = 'none'; });

  var rafId = null;
  var t0 = performance.now();

  function frame(now) {
    render((now - t0) / 1000);
    rafId = requestAnimationFrame(frame);
  }
  function start() {
    if (rafId === null && fixedT === null && !reduced) {
      t0 = performance.now() - (start._lastT || 0) * 1000;
      rafId = requestAnimationFrame(frame);
    }
  }
  function stop() {
    if (rafId !== null) {
      start._lastT = (performance.now() - t0) / 1000;
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  build();

  if (fixedT !== null || reduced) {
    render(fixedT !== null ? fixedT : 4.2);
  } else {
    start();
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) start(); else stop();
      });
    }, { threshold: 0.02 }).observe(hero);
  }

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      build();
      if (fixedT !== null || reduced) render(fixedT !== null ? fixedT : 4.2);
    }, 150);
  });
})();

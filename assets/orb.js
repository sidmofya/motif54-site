/* MOTIF 54 — the ring orb (homepage hero).
   The M54 logo's ring drawn as a luminous particle field: particles drift
   around the ring, brightest on the arc facing a light at upper right, with
   a copper tint at the 12 o'clock notch. The light sits lower left, the
   side of the ring that stays on screen when the orb is cropped. The orb tilts toward the pointer
   and particles near it brighten and part. Rendering pauses offscreen.
   Without GSAP, or with JS off, the static SVG ring stays in place. With
   reduced motion the canvas draws one still frame. */
(function () {
  'use strict';

  var gsap = window.gsap;
  var orb = document.querySelector('.orb');
  if (!gsap || !orb) return;

  var tilt = orb.querySelector('.orb-tilt');
  var canvas = orb.querySelector('.orb-canvas');
  var ctx = canvas && canvas.getContext && canvas.getContext('2d');
  if (!ctx) return;

  var TAU = Math.PI * 2;
  var LIGHT = Math.PI * 0.78;        /* lower left, canvas angles (y down) */
  var NOTCH = -Math.PI / 2;          /* 12 o'clock, as in the logo */
  var RING = 0.42;                   /* ring radius as a share of the box */
  var SPIN = TAU / 90;               /* one revolution every 90s */
  var REACH = 80;                    /* pointer influence radius, CSS px */

  /* Particles live in ring units (angle + radial offset), so a resize only
     rescales them. A seeded generator keeps the field identical per load. */
  var seed = 54;
  var rand = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  var gauss = function () { return (rand() + rand() + rand() - 1.5) / 1.5; };

  var ring = [];
  for (var i = 0; i < 900; i++) {
    ring.push({
      a: rand() * TAU,
      r: 1 + gauss() * 0.035 * (rand() < 0.15 ? 3 : 1),
      s: rand() < 0.06 ? 2 + rand() * 1.4 : 0.7 + rand() * 1.1,
      b: 0.55 + rand() * 0.45,
      ph: rand() * TAU,
      f: 0.6 + rand() * 1.6,
      push: 0, glow: 0
    });
  }
  var dust = [];
  for (var j = 0; j < 260; j++) {
    dust.push({ a: rand() * TAU, r: Math.sqrt(rand()) * 0.96, s: 0.5 + rand() * 0.7, b: 0.08 + rand() * 0.18, ph: rand() * TAU });
  }

  var size = 0, dpr = 1, cx = 0, cy = 0, R = 0;
  var pointer = { x: -1e4, y: -1e4 };   /* in canvas CSS px */
  var spin = 0, last = 0;

  var resize = function () {
    var box = canvas.getBoundingClientRect();
    if (!box.width) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    size = box.width;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    cx = cy = size / 2;
    R = size * RING;
  };

  var lit = function (angle) {
    var c = Math.cos(angle - LIGHT);
    return 0.16 + 0.84 * Math.pow(Math.max(0, c), 1.3);
  };
  var nearNotch = function (angle) {
    var d = Math.abs(Math.atan2(Math.sin(angle - NOTCH), Math.cos(angle - NOTCH)));
    return Math.max(0, 1 - d / 0.14);
  };

  var draw = function (t) {
    if (!size) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.globalCompositeOperation = 'lighter';

    /* The ring's own line: a wide faint halo and a thin core, both lit. */
    if (ctx.createConicGradient) {
      var g = ctx.createConicGradient(LIGHT - Math.PI, cx, cy);
      g.addColorStop(0, 'rgba(244,240,232,0.06)');
      g.addColorStop(0.5, 'rgba(250,246,240,1)');
      g.addColorStop(1, 'rgba(244,240,232,0.06)');
      ctx.strokeStyle = g;
    } else {
      ctx.strokeStyle = 'rgba(244,240,232,0.2)';
    }
    /* Halo: stacked strokes, each wider and fainter, so the glow falls
       off smoothly instead of reading as a band. */
    for (var h = 6; h >= 1; h--) {
      ctx.globalAlpha = 0.028;
      ctx.lineWidth = h * 5;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 1;

    /* Dust inside the disc. */
    for (var d = 0; d < dust.length; d++) {
      var q = dust[d];
      var qa = q.a + spin * 0.4;
      var qx = cx + Math.cos(qa) * q.r * R;
      var qy = cy + Math.sin(qa) * q.r * R;
      var qb = q.b * (0.6 + 0.4 * lit(qa)) * (0.8 + 0.2 * Math.sin(t * 0.8 + q.ph));
      ctx.fillStyle = 'rgba(244,240,232,' + qb.toFixed(3) + ')';
      ctx.fillRect(qx, qy, q.s, q.s);
    }

    /* Ring particles. */
    for (var k = 0; k < ring.length; k++) {
      var p = ring[k];
      var a = p.a + spin;
      var px = cx + Math.cos(a) * p.r * R;
      var py = cy + Math.sin(a) * p.r * R;

      var dx = px - pointer.x, dy = py - pointer.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var near = dist < REACH ? 1 - dist / REACH : 0;
      p.push += (near * 6 - p.push) * 0.12;
      p.glow += (near - p.glow) * 0.12;
      if (p.push > 0.01 && dist > 0.001) {
        px += (dx / dist) * p.push;
        py += (dy / dist) * p.push;
      }

      var tw = 0.75 + 0.25 * Math.sin(t * p.f + p.ph);
      var alpha = Math.min(1, p.b * lit(a) * tw + p.glow * 0.7);
      var copper = nearNotch(a);
      var red = Math.round(244 - copper * 36);
      var green = Math.round(240 - copper * 102);
      var blue = Math.round(232 - copper * 142);
      ctx.fillStyle = 'rgba(' + red + ',' + green + ',' + blue + ',' + alpha.toFixed(3) + ')';
      var sz = p.s * (1 + p.glow * 0.8);
      ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
    }

    /* The notch, as in the logo: a short copper bar across the ring. */
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(208,138,90,0.85)';
    ctx.fillRect(cx - 3, cy - R - 9, 6, 18);
  };

  /* 30fps is plenty for a slow drift and halves the canvas work. */
  var frame = function (time) {
    if (last && time - last < 1 / 31) return;
    var dt = last ? Math.min(time - last, 0.1) : 0;
    last = time;
    spin += SPIN * dt;
    draw(time);
  };

  if (window.ResizeObserver) {
    new ResizeObserver(function () { resize(); draw(last); }).observe(canvas);
  }
  orb.classList.add('is-live');
  resize();

  var mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: reduce)', function () {
    pointer.x = pointer.y = -1e4;
    draw(0);
  });

  mm.add('(prefers-reduced-motion: no-preference)', function () {
    var running = false;
    var start = function () { if (!running) { running = true; last = 0; gsap.ticker.add(frame); } };
    var stop = function () { if (running) { running = false; gsap.ticker.remove(frame); } };

    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) start(); else stop();
    });
    io.observe(orb);

    /* Tilt toward the pointer, up to 8 degrees. */
    var rotX = gsap.quickTo(tilt, 'rotationX', { duration: 0.8, ease: 'power3' });
    var rotY = gsap.quickTo(tilt, 'rotationY', { duration: 0.8, ease: 'power3' });
    var clamp = gsap.utils.clamp(-1, 1);
    var onMove = function (e) {
      var box = canvas.getBoundingClientRect();
      pointer.x = e.clientX - box.left;
      pointer.y = e.clientY - box.top;
      var nx = clamp((e.clientX - (box.left + box.width / 2)) / 600);
      var ny = clamp((e.clientY - (box.top + box.height / 2)) / 600);
      rotY(nx * 8);
      rotX(-ny * 8);
    };
    var onLeave = function () {
      pointer.x = pointer.y = -1e4;
      rotX(0); rotY(0);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);

    /* Data card: the three sectors decode in turn; the status dot breathes. */
    var sector = orb.querySelector('.orb-card-sector');
    var dot = orb.querySelector('.orb-card-dot');
    var cycle = null;
    if (sector && window.ScrambleTextPlugin) {
      gsap.registerPlugin(window.ScrambleTextPlugin);
      var names = ['AI Infrastructure', 'Energy', 'Critical Minerals'];
      var n = 0;
      cycle = gsap.delayedCall(4, function next() {
        n = (n + 1) % names.length;
        gsap.to(sector, {
          duration: 0.6,
          scrambleText: { text: names[n], chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', revealDelay: 0.1, speed: 0.6 }
        });
        cycle = gsap.delayedCall(4, next);
      });
    }
    if (dot) gsap.to(dot, { opacity: 0.25, duration: 1.2, ease: 'sine.inOut', repeat: -1, yoyo: true });

    return function () {
      stop();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      if (cycle) cycle.kill();
      gsap.set(tilt, { clearProps: 'transform' });
    };
  });
})();

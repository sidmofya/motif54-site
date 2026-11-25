/* MOTIF 54: quiet motion.
   GSAP (+ ScrollTrigger, ScrambleText, DrawSVG) is self-hosted in
   /assets/vendor. Progressive enhancement: the page is complete without
   this file. Every hidden start state is set here, never in CSS, so a
   blocked script or JS-off visitor sees the finished page.
   Everything that moves sits inside a prefers-reduced-motion: no-preference
   query and reverts cleanly if the preference changes. Scrolling is the
   browser's own: no smooth-scroll library intercepts the wheel, and the
   hero text is never hidden waiting for an animation. */
(function () {
  'use strict';

  var gsap = window.gsap;
  if (!gsap) return;

  var plugins = [window.ScrollTrigger, window.ScrambleTextPlugin, window.DrawSVGPlugin];
  for (var i = 0; i < plugins.length; i++) {
    if (!plugins[i]) return;
  }
  gsap.registerPlugin.apply(gsap, plugins);

  var ScrollTrigger = window.ScrollTrigger;
  var root = document.documentElement;
  var mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', function () {
    var cleanups = [];
    root.classList.add('motion');
    cleanups.push(function () { root.classList.remove('motion'); });

    /* Homepage only: the nav mark's copper ring draws once on landing.
       Keying on the homepage keeps the draw to one landing without storing
       anything on the device (see /privacy). The headline itself is never
       hidden, so it paints at first render. */
    var title = document.querySelector('.hero-title--balanced');
    var mark = document.querySelector('.site-nav .brand-mark');
    if (title && mark) {
      gsap.timeline()
        .from(mark.querySelector('circle'), { drawSVG: '0%', duration: 1.2, ease: 'power2.inOut' })
        .from(mark.querySelector('rect'), { y: -4, autoAlpha: 0, duration: 0.4, ease: 'power2.out' }, '-=0.3');
    }

    /* Eyebrows decode into place as they enter. Screen readers get a
       visually hidden copy of the final text; the scrambling copy is
       aria-hidden. The // prefix is a pseudo-element and stays still. */
    var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    gsap.utils.toArray('.site-main .eyebrow').forEach(function (el) {
      var text = el.textContent;
      var html = el.innerHTML;
      el.innerHTML = '<span class="visually-hidden"></span><span aria-hidden="true"></span>';
      el.firstChild.textContent = text;
      el.lastChild.textContent = text;
      gsap.to(el.lastChild, {
        duration: 0.6,
        ease: 'none',
        scrambleText: { text: text, chars: CHARS, revealDelay: 0.15, speed: 0.6 },
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
      cleanups.push(function () { el.innerHTML = html; });
    });

    /* Hairlines draw left to right: section rules, then the rule over
       each row item (drawn by .motion .row-item::before, see style.css). */
    gsap.utils.toArray('.site-main hr').forEach(function (hr) {
      gsap.from(hr, {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 0.8,
        ease: 'power2.inOut',
        scrollTrigger: { trigger: hr, start: 'top 90%', once: true }
      });
    });
    gsap.utils.toArray('.row-grid').forEach(function (grid) {
      gsap.fromTo(grid.querySelectorAll('.row-item'), { '--rule': 0 }, {
        '--rule': 1,
        duration: 0.8,
        ease: 'power2.inOut',
        stagger: 0.1,
        scrollTrigger: { trigger: grid, start: 'top 90%', once: true }
      });
    });

    /* Rack focus: cards and section headings resolve from a slight blur
       as they enter, staggered per batch. The card a URL hash points at is
       left still: the browser scrolls to it after this runs, and an offset
       start would land it off its scroll-margin. */
    var target = null;
    try { target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) {}
    var focusables = gsap.utils.toArray('.site-main .card, .site-main .spec, .site-main h2').filter(function (el) {
      return !(target && el.contains(target));
    });
    if (focusables.length) {
      gsap.set(focusables, { autoAlpha: 0, y: 12, filter: 'blur(6px)' });
      ScrollTrigger.batch(focusables, {
        start: 'top 92%',
        once: true,
        onEnter: function (batch) {
          gsap.to(batch, {
            autoAlpha: 1, y: 0, filter: 'blur(0px)',
            duration: 0.8, ease: 'power2.out', stagger: 0.08, overwrite: true, clearProps: 'filter'
          });
        }
      });
    }

    /* Parallax between planes. Each layer lags the page by its factor, so
       the farther it sits (map, then the blurred mark) the slower it seems
       to move. clamp() starts layers in the first screen
       at scroll 0, so nothing jumps on load. */
    var planes = [
      ['.depth-map', 0.15],
      ['.depth-mark', 0.08]
    ];
    planes.forEach(function (plane) {
      gsap.utils.toArray(plane[0]).forEach(function (el) {
        var setY = gsap.quickSetter(el, 'y', 'px');
        ScrollTrigger.create({
          trigger: el.parentNode,
          start: 'clamp(top bottom)',
          end: 'clamp(bottom top)',
          onUpdate: function (self) { setY((self.scroll() - self.start) * plane[1]); }
        });
        cleanups.push(function () { gsap.set(el, { clearProps: 'transform' }); });
      });
    });

    return function () {
      for (var j = cleanups.length - 1; j >= 0; j--) cleanups[j]();
    };
  });

  /* Copper spotlight — follows the pointer inside a card. Hover feedback
     rather than motion, so it runs whatever the motion preference, but
     only for a mouse or trackpad. The gradient lives in style.css. */
  mm.add('(hover: hover) and (pointer: fine)', function () {
    var onMove = function (e) {
      var card = e.target.closest && e.target.closest('.card');
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    return function () { document.removeEventListener('pointermove', onMove); };
  });
})();

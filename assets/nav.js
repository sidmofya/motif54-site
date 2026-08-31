/* MOTIF 54 — mobile navigation disclosure + dynamic footer year.
   No dependencies. Progressive enhancement: with JS off the menu
   stays in the DOM and the CSS media query is the only thing hiding
   it, so the toggle button is rendered hidden until this runs. */
(function () {
  'use strict';

  var toggle = document.getElementById('nav-toggle');
  var menu = document.getElementById('nav-menu');

  if (toggle && menu) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        menu.setAttribute('data-open', 'true');
      } else {
        menu.removeAttribute('data-open');
      }
    };

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    /* Escape closes the menu and returns focus to the button. */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    /* Reset state when the viewport grows past the mobile breakpoint,
       so the desktop menu is never left in a stale hidden state. */
    if (window.matchMedia) {
      var mq = window.matchMedia('(min-width: 701px)');
      var reset = function (e) { if (e.matches) setOpen(false); };
      if (mq.addEventListener) {
        mq.addEventListener('change', reset);
      } else if (mq.addListener) {
        mq.addListener(reset);
      }
    }
  }

  /* Footer copyright year. The markup carries a sensible default so
     the year is correct even before this runs, or with JS disabled. */
  var year = document.getElementById('foot-year');
  if (year) year.textContent = String(new Date().getFullYear());
})();

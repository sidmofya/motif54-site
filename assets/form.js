/* MOTIF 54 — Work with us enquiry form.
 *
 * Posts to the existing Google Apps Script web app. The field names
 * below are deliberately unchanged from the previous form so the
 * receiving script (apps-script.gs) and its Google Sheet column order
 * keep working without a backend edit:
 *
 *   request_type  -> Engagement type
 *   name          -> Name
 *   organization  -> Organization
 *   email         -> Email
 *   evaluating    -> What are you working on?
 *   linkedin      -> Relevant link
 */
(function () {
  'use strict';

  var ENDPOINT = 'https://script.google.com/macros/s/AKfycby_IiJSn5KSHmlplpe442B_ggVk8oH6ES1Q6eUtr7io7rrXFD8-ob5anYyjcy9C1UB2/exec';

  var form = document.getElementById('bf-form');
  if (!form) return;

  var successEl = document.getElementById('bf-success');
  var typeSelect = form.elements['request_type'];
  var pathButtons = document.querySelectorAll('.path-card');

  /* ?interest= maps a page CTA onto an engagement type. Values here
     must match the option values in the select. */
  var INTEREST_MAP = {
    'project': 'Project',
    'kafwego': 'Project',
    'coppercloud': 'Project',
    'program': 'Partner Room',
    'partner-room': 'Partner Room',
    'capital-readiness': 'Capital Readiness',
    'gate-diagnostic': 'Gate Diagnostic',
    'intelligence': 'Other Intelligence',
    'other': 'Other'
  };

  function syncPathButtons() {
    var current = typeSelect ? typeSelect.value : '';
    for (var i = 0; i < pathButtons.length; i++) {
      var btn = pathButtons[i];
      var owns = (btn.getAttribute('data-sets') || '').split('|');
      btn.setAttribute('aria-pressed', owns.indexOf(current) !== -1 ? 'true' : 'false');
    }
  }

  /* Preselect from the query string. */
  (function preselect() {
    if (!typeSelect) return;
    var interest = new URLSearchParams(window.location.search).get('interest');
    if (!interest) return;
    var value = INTEREST_MAP[interest.toLowerCase()];
    if (value) {
      typeSelect.value = value;
      syncPathButtons();
    }
  })();

  /* The three selectable paths set the engagement type. */
  for (var i = 0; i < pathButtons.length; i++) {
    pathButtons[i].addEventListener('click', function () {
      if (!typeSelect) return;
      typeSelect.value = (this.getAttribute('data-sets') || '').split('|')[0];
      syncPathButtons();
      clearError(typeSelect);
    });
  }
  if (typeSelect) typeSelect.addEventListener('change', syncPathButtons);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    var submitBtn = document.getElementById('bf-submit');
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;

    var fields = ['request_type', 'name', 'organization', 'email', 'evaluating', 'linkedin'];
    var fd = new FormData();
    fields.forEach(function (n) {
      var el = form.elements[n];
      fd.append(n, el ? el.value.trim() : '');
    });

    /* no-cors makes the response opaque, so there is no readable
       result to branch on. The request is fire-and-forget. */
    fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: fd }).catch(function () {});

    form.classList.add('hidden');
    successEl.classList.remove('hidden');
    successEl.focus();
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function clearError(el) {
    if (!el) return;
    el.classList.remove('error');
    el.removeAttribute('aria-invalid');
    var msg = document.getElementById(el.id + '-error');
    if (msg) msg.remove();
  }

  function addError(el, message) {
    el.classList.add('error');
    el.setAttribute('aria-invalid', 'true');
    var p = document.createElement('p');
    p.className = 'bf-error-msg';
    p.id = el.id + '-error';
    p.textContent = message;
    el.parentNode.appendChild(p);
  }

  function validate() {
    form.querySelectorAll('.bf-error-msg').forEach(function (el) { el.remove(); });
    form.querySelectorAll('.error').forEach(function (el) {
      el.classList.remove('error');
      el.removeAttribute('aria-invalid');
    });

    var required = [
      ['name', 'Please enter your name.'],
      ['email', 'Please enter your email address.'],
      ['evaluating', 'Please tell us what you are working on.'],
      ['request_type', 'Please choose an engagement type.']
    ];

    var firstBad = null;

    required.forEach(function (pair) {
      var el = form.elements[pair[0]];
      if (el && !el.value.trim()) {
        addError(el, pair[1]);
        if (!firstBad) firstBad = el;
      }
    });

    var email = form.elements['email'];
    if (email && email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      addError(email, 'Please enter a valid email address.');
      if (!firstBad) firstBad = email;
    }

    if (firstBad) {
      firstBad.focus();
      firstBad.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'center'
      });
      return false;
    }
    return true;
  }
})();

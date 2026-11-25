/* MOTIF 54: Start a conversation (inquiry form).
 *
 * Loaded as an ES module. Validates with the shared schema, then sends JSON
 * to the same-origin adapter at /.netlify/functions/inquiry. The received
 * state appears only when the adapter returns HTTP 200 with ok: true and the
 * request id this page generated. Every failure keeps the visitor's text.
 *
 * Only allowlisted ?interest=, ?research= and ?source= tokens are read from
 * the URL. Nothing is stored on the device.
 */
import {
  FIELDS,
  HONEYPOT,
  PROJECT_CONTEXT,
  RESEARCH_IDS,
  SOURCES,
  messageFor,
  readPrefill,
  validateSubmission
} from './inquiry-schema.mjs';

const ENDPOINT = '/.netlify/functions/inquiry';
const CLIENT_TIMEOUT_MS = 20000;
const EMAIL = 'sid@motif54.com';

const form = document.getElementById('bf-form');
const submitBtn = document.getElementById('bf-submit');
const statusEl = document.getElementById('bf-status');
const summary = document.getElementById('bf-error-summary');
const successEl = document.getElementById('bf-success');
const contextEl = document.getElementById('bf-context');

/* Field name -> the element that receives focus and carries the error. */
const TARGETS = {
  name: 'bf-name',
  organization: 'bf-org',
  email: 'bf-email',
  evaluating: 'bf-evaluating',
  decision: 'bf-decision',
  timeframe: 'bf-timeframe',
  linkedin: 'bf-linkedin',
  referral: 'bf-referral'
};
const FOCUS_TARGETS = Object.assign({}, TARGETS, { decision: 'bf-decision-invest' });

let context = { interest: '', research: '', source: '', project: '' };
let inFlight = false;

if (form && submitBtn) init();

function init() {
  const prefill = readPrefill(window.location.search);
  context = { interest: prefill.interest, research: prefill.research, source: prefill.source, project: prefill.project };

  if (prefill.decision) {
    const radio = document.getElementById('bf-decision-' + prefill.decision);
    if (radio && !form.querySelector('input[name="decision"]:checked')) radio.checked = true;
  }
  const referral = form.elements.referral;
  if (prefill.referral && referral && !referral.value) referral.value = prefill.referral;

  renderContext();

  form.addEventListener('submit', onSubmit);
  form.addEventListener('input', (e) => clearFieldError(fieldOf(e.target)));
  form.addEventListener('change', (e) => clearFieldError(fieldOf(e.target)));
  summary.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-field]');
    if (!link) return;
    e.preventDefault();
    const el = document.getElementById(FOCUS_TARGETS[link.getAttribute('data-field')]);
    if (el) el.focus();
  });

  submitBtn.disabled = false;
}

/* ── Context carried from the page that sent the visitor here ── */
function renderContext() {
  const parts = [];
  if (context.research) {
    const where = context.source ? SOURCES[context.source] : 'our research';
    parts.push('You came from ' + where + ' on <strong></strong>.');
  } else if (context.project) {
    parts.push('You are asking about <strong></strong>.');
  }
  if (!parts.length) {
    contextEl.hidden = true;
    contextEl.textContent = '';
    return;
  }
  contextEl.innerHTML = '';
  const p = document.createElement('span');
  p.innerHTML = parts[0];
  p.querySelector('strong').textContent = context.research
    ? RESEARCH_IDS[context.research].title
    : PROJECT_CONTEXT[context.project];
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'Remove this context';
  btn.addEventListener('click', () => {
    context = { interest: context.research ? context.interest : '', research: '', source: '', project: '' };
    renderContext();
    const name = document.getElementById('bf-name');
    if (name) name.focus();
  });
  contextEl.append(p, btn);
  contextEl.hidden = false;
}

/* ── Collect and validate ── */
function collect() {
  const el = form.elements;
  const checked = form.querySelector('input[name="decision"]:checked');
  return {
    name: el.name.value,
    organization: el.organization.value,
    email: el.email.value,
    evaluating: el.evaluating.value,
    decision: checked ? checked.value : '',
    timeframe: el.timeframe.value,
    linkedin: el.linkedin.value,
    referral: el.referral.value,
    interest: context.interest,
    research: context.research,
    source: context.source,
    [HONEYPOT]: el[HONEYPOT] ? el[HONEYPOT].value : ''
  };
}

function fieldOf(target) {
  if (!target || !target.name) return null;
  return Object.prototype.hasOwnProperty.call(TARGETS, target.name) ? target.name : null;
}

function clearFieldError(field) {
  if (!field) return;
  const el = document.getElementById(TARGETS[field]);
  if (!el) return;
  el.classList.remove('error');
  el.removeAttribute('aria-invalid');
  const msg = document.getElementById(TARGETS[field] + '-error');
  if (msg) {
    msg.remove();
    const ids = (el.getAttribute('aria-describedby') || '').split(' ').filter((id) => id && id !== msg.id);
    if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
    else el.removeAttribute('aria-describedby');
  }
}

function clearAllErrors() {
  Object.keys(TARGETS).forEach(clearFieldError);
  summary.hidden = true;
  summary.querySelector('ul').textContent = '';
}

function showErrors(errors) {
  clearAllErrors();
  const list = summary.querySelector('ul');
  const fields = Object.keys(TARGETS).filter((f) => errors[f]);
  const hidden = Object.keys(errors).filter((f) => !TARGETS[f]);

  fields.forEach((field) => {
    const el = document.getElementById(TARGETS[field]);
    const text = messageFor(field, errors[field]);
    el.classList.add('error');
    el.setAttribute('aria-invalid', 'true');
    const p = document.createElement('p');
    p.className = 'bf-error-msg';
    p.id = TARGETS[field] + '-error';
    p.textContent = text;
    if (el.tagName === 'FIELDSET') el.appendChild(p);
    else el.insertAdjacentElement('afterend', p);
    const ids = (el.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
    ids.push(p.id);
    el.setAttribute('aria-describedby', ids.join(' '));

    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + FOCUS_TARGETS[field];
    a.setAttribute('data-field', field);
    a.textContent = FIELDS[field].label + ': ' + text;
    li.appendChild(a);
    list.appendChild(li);
  });

  if (hidden.length || !fields.length) {
    const li = document.createElement('li');
    li.textContent = hidden.length
      ? messageFor(hidden[0], errors[hidden[0]])
      : 'Something in the form could not be accepted. Check your answers and try again.';
    list.appendChild(li);
  }

  summary.hidden = false;
  summary.focus();
}

/* ── Status messages ── */
function setStatus(tone, nodes) {
  statusEl.textContent = '';
  if (!tone) { statusEl.removeAttribute('data-tone'); return; }
  statusEl.setAttribute('data-tone', tone);
  nodes.forEach((n) => statusEl.appendChild(n));
}

function para(text) {
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

function emailPara(lead) {
  const p = document.createElement('p');
  p.append(lead + ' ');
  const a = document.createElement('a');
  a.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Inquiry from motif54.com');
  a.textContent = EMAIL;
  p.append(a, '. Opening your email app does not send anything until you send it there.');
  return p;
}

const FAILURES = {
  delivery_unconfirmed_timeout: () => [
    para('We could not confirm receipt. Your message is still here. You can contact us by email.'),
    emailPara('Send it again when you are ready, or write to'),
  ],
  delivery_unconfirmed: () => [
    para('We could not confirm that your inquiry reached us. Your message is still here.'),
    emailPara('Try sending it again, or write to'),
  ],
  service_unavailable: () => [
    para('The inquiry form is unavailable right now. Your message is still here.'),
    emailPara('Please write to'),
  ],
  rate_limited: () => [
    para('Too many attempts in a short time. Your message is still here. Wait a minute and try again.'),
    emailPara('Or write to'),
  ],
  payload_too_large: () => [
    para('Your message is too long to send. Shorten it and try again.'),
  ],
  generic: () => [
    para('Something went wrong sending the form. Your message is still here.'),
    emailPara('Try again, or write to'),
  ]
};

/* ── Submit ── */
function newRequestId() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function setPending(pending) {
  inFlight = pending;
  submitBtn.setAttribute('aria-disabled', pending ? 'true' : 'false');
  submitBtn.textContent = pending ? 'Sending inquiry…' : 'Send inquiry';
  if (pending) setStatus('pending', [para('Sending inquiry…')]);
}

async function onSubmit(e) {
  e.preventDefault();
  if (inFlight) return;

  const data = collect();
  const { errors } = validateSubmission(data);
  if (Object.keys(errors).length) {
    setStatus(null);
    showErrors(errors);
    return;
  }
  clearAllErrors();

  const requestId = newRequestId();
  setPending(true);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  let res = null;
  let body = null;
  let timedOut = false;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({}, data, { request_id: requestId })),
      credentials: 'same-origin',
      cache: 'no-store',
      signal: controller.signal
    });
    try { body = await res.json(); } catch (err) { body = null; }
  } catch (err) {
    timedOut = true;
  } finally {
    clearTimeout(timer);
  }

  setPending(false);

  if (res && res.status === 200 && body && body.ok === true && body.request_id === requestId) {
    setStatus(null);
    form.hidden = true;
    contextEl.hidden = true;
    successEl.hidden = false;
    successEl.focus();
    return;
  }

  if (res && res.status === 400 && body && body.code === 'invalid_input') {
    setStatus(null);
    showErrors(body.field_errors && typeof body.field_errors === 'object' ? body.field_errors : {});
    return;
  }

  let key = 'generic';
  if (timedOut || (res && res.status === 504)) key = 'delivery_unconfirmed_timeout';
  else if (res && res.status === 502) key = 'delivery_unconfirmed';
  else if (res && res.status === 503) key = 'service_unavailable';
  else if (res && res.status === 429) key = 'rate_limited';
  else if (res && res.status === 413) key = 'payload_too_large';
  setStatus('error', FAILURES[key]());
}

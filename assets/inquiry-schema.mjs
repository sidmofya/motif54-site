/* MOTIF 54 inquiry schema.
 *
 * One ES module shared by the browser form (assets/form.js) and the
 * submission adapter (netlify/functions/inquiry.mjs), so both apply the
 * same field rules, value lists and request-type mapping.
 *
 * The receiving Google Apps Script appends a sheet row from these keys:
 * request_type, name, email, organization, linkedin, evaluating, timeframe,
 * referral, additional_context. The first six are the long-standing form
 * fields; the last three exist in apps-script.gs but were never sent by the
 * old form, so their presence in the deployed script must be confirmed
 * before anyone relies on them (release dependency D03).
 */

export const SCHEMA_VERSION = 1;
export const MAX_BODY_BYTES = 16 * 1024;
export const HONEYPOT = 'company_website';

/* What kind of decision? Each maps onto the sheet's existing request types. */
export const DECISIONS = Object.freeze({
  invest: { label: 'Invest', hint: 'Test an investment thesis', requestType: 'Assessment' },
  position: { label: 'Position', hint: 'Decide where to compete or partner', requestType: 'Assessment' },
  develop: { label: 'Develop', hint: 'Find what a project needs to proceed', requestType: 'Assessment' },
  screening: { label: 'Screening', hint: 'A retainer on your deal flow', requestType: 'Screening' },
  project: { label: 'Project inquiry', hint: 'CopperCloud, Kafwego or another project', requestType: 'Project' },
  unsure: { label: 'Not sure', hint: 'We can help frame it', requestType: 'Other' }
});

export const TIMEFRAMES = Object.freeze({
  'two-weeks': 'Within two weeks',
  month: 'Within a month',
  quarter: 'This quarter',
  exploring: 'Exploring'
});

export const REFERRALS = Object.freeze({
  model: 'What AI Is Made Of (the model)',
  copper: 'From Copper to Compute (the copper journey)',
  referral: 'A referral',
  speaking: 'Speaking or an event',
  other: 'Other'
});

/* ?interest= values. New values select a decision; legacy values from
   before November 2026 keep landing on the request type they always had.
   Kafwego and CopperCloud also carry their project as context. */
export const INTEREST_MAP = Object.freeze({
  invest: { decision: 'invest' },
  position: { decision: 'position' },
  develop: { decision: 'develop' },
  screening: { decision: 'screening' },
  assessment: { requestType: 'Assessment' },
  project: { decision: 'project' },
  kafwego: { decision: 'project', context: 'kafwego' },
  coppercloud: { decision: 'project', context: 'coppercloud' },
  'gate-diagnostic': { requestType: 'Assessment' },
  'capital-readiness': { requestType: 'Assessment' },
  intelligence: { requestType: 'Assessment' },
  other: { decision: 'unsure' }
});

export const PROJECT_CONTEXT = Object.freeze({
  kafwego: 'Kafwego Resources',
  coppercloud: 'CopperCloud'
});

/* Only these tokens travel through URLs. Nothing else is read from them. */
export const RESEARCH_IDS = Object.freeze({
  'what-ai-is-made-of': { title: 'What AI Is Made Of', referral: 'model' },
  'from-copper-to-compute': { title: 'From Copper to Compute', referral: 'copper' }
});

export const SOURCES = Object.freeze({
  'research-brief': 'our decision brief',
  'research-experience': 'the research site',
  advisory: 'our advisory page'
});

export const FIELDS = Object.freeze({
  name: { label: 'Name', required: true, min: 1, max: 120 },
  organization: { label: 'Organization', max: 200 },
  email: { label: 'Work email', required: true, max: 254, kind: 'email' },
  evaluating: { label: 'What are you trying to understand or achieve?', required: true, min: 20, max: 4000, multiline: true },
  decision: { label: 'What kind of decision?', options: DECISIONS },
  timeframe: { label: 'When do you need to decide?', options: TIMEFRAMES },
  linkedin: { label: 'Relevant public link', max: 2048, kind: 'url' },
  referral: { label: 'How did you find us?', options: REFERRALS },
  interest: { label: 'Interest', options: INTEREST_MAP, hidden: true },
  research: { label: 'Research', options: RESEARCH_IDS, hidden: true },
  source: { label: 'Source', options: SOURCES, hidden: true }
});

export const FIELD_KEYS = Object.freeze(Object.keys(FIELDS));

/* Messages for each error code, shown next to the field and in the summary. */
export const MESSAGES = Object.freeze({
  name: { required: 'Enter your name.', too_long: 'Keep your name under 120 characters.', invalid: 'Remove unusual control characters from your name.' },
  organization: { too_long: 'Keep the organization under 200 characters.', invalid: 'Remove unusual control characters from the organization.' },
  email: { required: 'Enter your email address.', too_long: 'Email addresses can be at most 254 characters.', invalid: 'Enter a valid email address, like name@example.com.' },
  evaluating: { required: 'Tell us what you are trying to understand or achieve.', too_short: 'Add a little more detail: at least 20 characters.', too_long: 'Keep this under 4,000 characters.', invalid: 'Remove unusual control characters from your message.' },
  linkedin: { too_long: 'Links can be at most 2,048 characters.', invalid: 'Enter a full web address starting with https:// or http://.' },
  decision: { invalid: 'Choose one of the listed options.' },
  timeframe: { invalid: 'Choose one of the listed options.' },
  referral: { invalid: 'Choose one of the listed options.' },
  interest: { invalid: 'This page link carried an unknown option. Reload the page and try again.' },
  research: { invalid: 'This page link carried an unknown option. Reload the page and try again.' },
  source: { invalid: 'This page link carried an unknown option. Reload the page and try again.' }
});

export function messageFor(field, code) {
  var byField = MESSAGES[field] || {};
  return byField[code] || 'Check this field.';
}

export function hasOwn(obj, key) {
  return typeof key === 'string' && Object.prototype.hasOwnProperty.call(obj, key);
}

// C0 controls and DEL. Line breaks and tabs are allowed only in the message.
var CONTROL_SINGLE = /[\u0000-\u001F\u007F]/;
var CONTROL_MULTI = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
var EMAIL = /^[^\s@<>()[\]\\,;:"]{1,64}@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:".]{2,}$/u;

function charLength(s) {
  return Array.from(s).length;
}

function isHttpUrl(s) {
  try {
    var u = new URL(s);
    return (u.protocol === 'https:' || u.protocol === 'http:') && u.hostname.length > 0;
  } catch (e) {
    return false;
  }
}

/* Normalise and validate a submission. Unknown keys are ignored.
   Returns { values, errors } where errors maps field -> code. */
export function validateSubmission(input) {
  var values = {};
  var errors = {};
  var src = input && typeof input === 'object' && !Array.isArray(input) ? input : {};

  FIELD_KEYS.forEach(function (key) {
    var rule = FIELDS[key];
    var raw = hasOwn(src, key) ? src[key] : '';
    if (raw === null || raw === undefined) raw = '';
    if (typeof raw !== 'string') { errors[key] = 'invalid'; return; }

    var v = rule.multiline ? raw.replace(/\r\n?/g, '\n').trim() : raw.trim();
    if (rule.options) v = v.toLowerCase();

    if (!v) {
      if (rule.required) errors[key] = 'required';
      values[key] = '';
      return;
    }
    if ((rule.multiline ? CONTROL_MULTI : CONTROL_SINGLE).test(v)) { errors[key] = 'invalid'; return; }
    if (rule.max && charLength(v) > rule.max) { errors[key] = 'too_long'; return; }
    if (rule.min && charLength(v) < rule.min) { errors[key] = 'too_short'; return; }
    if (rule.options && !hasOwn(rule.options, v)) { errors[key] = 'invalid'; return; }
    if (rule.kind === 'email' && !EMAIL.test(v)) { errors[key] = 'invalid'; return; }
    if (rule.kind === 'url' && !isHttpUrl(v)) { errors[key] = 'invalid'; return; }
    values[key] = v;
  });

  return { values: values, errors: errors };
}

/* An explicit decision wins; otherwise the link's interest; otherwise Other. */
export function resolveRequestType(values) {
  if (values.decision && hasOwn(DECISIONS, values.decision)) return DECISIONS[values.decision].requestType;
  if (values.interest && hasOwn(INTEREST_MAP, values.interest)) {
    var m = INTEREST_MAP[values.interest];
    if (m.decision) return DECISIONS[m.decision].requestType;
    if (m.requestType) return m.requestType;
  }
  return 'Other';
}

/* Compact, allowlisted labels for the sheet's Additional Context column. */
export function buildAdditionalContext(values, requestId) {
  var parts = ['schema=' + SCHEMA_VERSION];
  if (values.decision) parts.push('decision=' + values.decision);
  if (values.interest) {
    parts.push('interest=' + values.interest);
    var ctx = INTEREST_MAP[values.interest] && INTEREST_MAP[values.interest].context;
    if (ctx) parts.push('project=' + ctx);
  }
  if (values.research) parts.push('research=' + values.research);
  if (values.source) parts.push('source=' + values.source);
  if (requestId) parts.push('request_id=' + requestId);
  return parts.join('; ');
}

/* A cell that begins with = + - @ or a tab/CR can run as a spreadsheet
   formula. A leading apostrophe makes Sheets store it as text. */
export function neutralizeFormula(s) {
  return typeof s === 'string' && /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

/* The exact form fields sent to Apps Script. Nothing else is forwarded. */
export function buildUpstreamFields(values, requestId) {
  var fields = {
    request_type: resolveRequestType(values),
    name: values.name,
    organization: values.organization || '',
    email: values.email,
    evaluating: values.evaluating,
    linkedin: values.linkedin || '',
    timeframe: values.timeframe ? TIMEFRAMES[values.timeframe] : '',
    referral: values.referral ? REFERRALS[values.referral] : '',
    additional_context: buildAdditionalContext(values, requestId)
  };
  Object.keys(fields).forEach(function (k) { fields[k] = neutralizeFormula(fields[k]); });
  return fields;
}

/* Read the allowlisted URL tokens. Unknown values are dropped silently. */
export function readPrefill(search) {
  var params = new URLSearchParams(search || '');
  var out = { interest: '', decision: '', research: '', source: '', referral: '', project: '' };
  var interest = (params.get('interest') || '').trim().toLowerCase();
  if (hasOwn(INTEREST_MAP, interest)) {
    out.interest = interest;
    out.decision = INTEREST_MAP[interest].decision || '';
    out.project = INTEREST_MAP[interest].context || '';
  }
  var research = (params.get('research') || '').trim().toLowerCase();
  if (hasOwn(RESEARCH_IDS, research)) out.research = research;
  var source = (params.get('source') || '').trim().toLowerCase();
  if (hasOwn(SOURCES, source)) out.source = source;
  if (out.research && out.source === 'research-experience') out.referral = RESEARCH_IDS[out.research].referral;
  return out;
}

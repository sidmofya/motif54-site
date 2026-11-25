import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSubmission, resolveRequestType, buildUpstreamFields, buildAdditionalContext,
  neutralizeFormula, readPrefill, INTEREST_MAP, FIELD_KEYS, MESSAGES
} from '../../assets/inquiry-schema.mjs';

const valid = {
  name: 'Ada Ổkonkwo',
  organization: 'Example Capital',
  email: 'ada@example.com',
  evaluating: 'We are testing a thesis on grid equipment supply for data centres.',
  decision: 'invest',
  timeframe: 'quarter',
  linkedin: 'https://example.com/profile',
  referral: 'model'
};

test('a complete, valid submission has no errors and keeps Unicode names', () => {
  const { values, errors } = validateSubmission(valid);
  assert.deepEqual(errors, {});
  assert.equal(values.name, 'Ada Ổkonkwo');
});

test('required fields report required; optional fields may be empty', () => {
  const { errors } = validateSubmission({});
  assert.deepEqual(errors, { name: 'required', email: 'required', evaluating: 'required' });
});

test('length limits follow the field contract', () => {
  const check = (field, value, code) => {
    const { errors } = validateSubmission({ ...valid, [field]: value });
    assert.equal(errors[field], code, `${field} -> ${code}`);
  };
  check('name', 'x'.repeat(121), 'too_long');
  check('organization', 'x'.repeat(201), 'too_long');
  check('evaluating', 'too short', 'too_short');
  check('evaluating', 'x'.repeat(4001), 'too_long');
  check('linkedin', 'https://e.com/' + 'x'.repeat(2048), 'too_long');
  check('email', 'a'.repeat(250) + '@e.co', 'too_long');
  assert.deepEqual(validateSubmission({ ...valid, name: 'x'.repeat(120), evaluating: 'x'.repeat(4000) }).errors, {});
});

test('email accepts personal domains and rejects malformed addresses', () => {
  for (const ok of ['someone@gmail.com', 'first.last+tag@sub.example.co.zm']) {
    assert.equal(validateSubmission({ ...valid, email: ok }).errors.email, undefined, ok);
  }
  for (const bad of ['plain', 'a@b', 'a b@c.com', 'a@b.c', '<a@b.com>']) {
    assert.equal(validateSubmission({ ...valid, email: bad }).errors.email, 'invalid', bad);
  }
});

test('links must be http or https', () => {
  assert.equal(validateSubmission({ ...valid, linkedin: 'javascript:alert(1)' }).errors.linkedin, 'invalid');
  assert.equal(validateSubmission({ ...valid, linkedin: 'ftp://x.com' }).errors.linkedin, 'invalid');
  assert.equal(validateSubmission({ ...valid, linkedin: 'http://x.com' }).errors.linkedin, undefined);
});

test('control characters are rejected; the message may keep line breaks', () => {
  assert.equal(validateSubmission({ ...valid, name: 'Ada\r\nBcc: x@y.com' }).errors.name, 'invalid');
  assert.equal(validateSubmission({ ...valid, email: 'a@b.com\nX: y' }).errors.email, 'invalid');
  assert.equal(validateSubmission({ ...valid, evaluating: 'Line one is long enough\nLine two\tok' }).errors.evaluating, undefined);
  assert.equal(validateSubmission({ ...valid, evaluating: 'Bell character here \u0007 is not ok' }).errors.evaluating, 'invalid');
});

test('options must come from the allowlists, including prototype keys', () => {
  for (const field of ['decision', 'timeframe', 'referral', 'interest', 'research', 'source']) {
    assert.equal(validateSubmission({ ...valid, [field]: 'nope' }).errors[field], 'invalid', field);
    assert.equal(validateSubmission({ ...valid, [field]: '__proto__' }).errors[field], 'invalid', field);
    assert.equal(validateSubmission({ ...valid, [field]: 'constructor' }).errors[field], 'invalid', field);
  }
});

test('non-string values are invalid, unknown keys are ignored', () => {
  const { values, errors } = validateSubmission({ ...valid, name: ['x'], extra: 'dropped', request_type: 'Hacked' });
  assert.equal(errors.name, 'invalid');
  assert.equal('extra' in values, false);
  assert.equal('request_type' in values, false);
});

test('every error code the schema can produce has a message', () => {
  for (const key of FIELD_KEYS) assert.ok(MESSAGES[key], key);
});

test('request type: explicit decision, then interest, then Other', () => {
  assert.equal(resolveRequestType({ decision: 'invest' }), 'Assessment');
  assert.equal(resolveRequestType({ decision: 'position' }), 'Assessment');
  assert.equal(resolveRequestType({ decision: 'develop' }), 'Assessment');
  assert.equal(resolveRequestType({ decision: 'screening' }), 'Screening');
  assert.equal(resolveRequestType({ decision: 'project' }), 'Project');
  assert.equal(resolveRequestType({ decision: 'unsure' }), 'Other');
  assert.equal(resolveRequestType({}), 'Other');
  assert.equal(resolveRequestType({ decision: 'screening', interest: 'assessment' }), 'Screening');
  assert.equal(resolveRequestType({ interest: 'assessment' }), 'Assessment');
});

test('every legacy and new ?interest= value keeps a live request type', () => {
  const expected = {
    screening: 'Screening', assessment: 'Assessment', project: 'Project', kafwego: 'Project',
    coppercloud: 'Project', 'gate-diagnostic': 'Assessment', 'capital-readiness': 'Assessment',
    intelligence: 'Assessment', other: 'Other', invest: 'Assessment', position: 'Assessment', develop: 'Assessment'
  };
  assert.deepEqual(Object.keys(INTEREST_MAP).sort(), Object.keys(expected).sort());
  for (const [interest, type] of Object.entries(expected)) {
    assert.equal(resolveRequestType({ interest }), type, interest);
  }
});

test('the receiving sheet gets the six original keys plus three context keys, nothing else', () => {
  const { values } = validateSubmission({ ...valid, interest: 'kafwego', research: 'what-ai-is-made-of', source: 'research-brief' });
  const fields = buildUpstreamFields(values, 'abc12345-req');
  assert.deepEqual(Object.keys(fields).sort(), [
    'additional_context', 'email', 'evaluating', 'linkedin', 'name', 'organization', 'referral', 'request_type', 'timeframe'
  ]);
  assert.equal(fields.request_type, 'Assessment');
  assert.equal(fields.timeframe, 'This quarter');
  assert.equal(fields.referral, 'What AI Is Made Of (the model)');
  assert.equal(fields.additional_context,
    'schema=1; decision=invest; interest=kafwego; project=kafwego; research=what-ai-is-made-of; source=research-brief; request_id=abc12345-req');
});

test('Kafwego context survives alongside the Project category', () => {
  const { values } = validateSubmission({ ...valid, decision: '', interest: 'kafwego' });
  const fields = buildUpstreamFields(values, 'r-12345678');
  assert.equal(fields.request_type, 'Project');
  assert.match(fields.additional_context, /project=kafwego/);
});

test('spreadsheet formula prefixes are neutralised', () => {
  for (const s of ['=HYPERLINK("x")', '+1', '-2', '@SUM(A1)', '\tx', '\rx']) {
    assert.equal(neutralizeFormula(s), "'" + s);
  }
  assert.equal(neutralizeFormula('Plain text'), 'Plain text');
  const { values } = validateSubmission({ ...valid, name: '=cmd|calc', organization: '@risk' });
  const fields = buildUpstreamFields(values, 'r-12345678');
  assert.equal(fields.name, "'=cmd|calc");
  assert.equal(fields.organization, "'@risk");
});

test('additional context lists only allowlisted labels', () => {
  assert.equal(buildAdditionalContext({}, null), 'schema=1');
});

test('prefill reads only allowlisted tokens', () => {
  assert.deepEqual(readPrefill('?interest=invest&research=what-ai-is-made-of&source=research-brief'), {
    interest: 'invest', decision: 'invest', research: 'what-ai-is-made-of', source: 'research-brief', referral: '', project: ''
  });
  assert.deepEqual(readPrefill('?interest=position&research=from-copper-to-compute&source=research-experience'), {
    interest: 'position', decision: 'position', research: 'from-copper-to-compute', source: 'research-experience', referral: 'copper', project: ''
  });
  assert.deepEqual(readPrefill('?interest=KAFWEGO'), {
    interest: 'kafwego', decision: 'project', research: '', source: '', referral: '', project: 'kafwego'
  });
  assert.deepEqual(readPrefill('?interest=assessment'), {
    interest: 'assessment', decision: '', research: '', source: '', referral: '', project: ''
  });
  const hostile = readPrefill('?interest=<script>&research=__proto__&source=https://evil.example');
  assert.deepEqual(hostile, { interest: '', decision: '', research: '', source: '', referral: '', project: '' });
});

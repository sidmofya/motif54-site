import test from 'node:test';
import assert from 'node:assert/strict';
import { createInquiryHandler, isAllowedEcho, UPSTREAM_PATTERN } from '../../netlify/functions/inquiry.mjs';

const UPSTREAM = 'https://script.google.com/macros/s/TEST_DEPLOYMENT_0000000000/exec';
const ECHO = 'https://script.googleusercontent.com/macros/echo?user_content_key=abc';

const good = {
  name: 'Ada Example',
  email: 'ada@example.com',
  evaluating: 'We are testing a thesis on grid equipment supply.',
  decision: 'invest',
  request_id: '0b3f6a1e-1111-4222-8333-944455556666'
};

function post(body, headers = {}) {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return new Request('https://motif54.com/.netlify/functions/inquiry', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: text
  });
}

function upstream(...responses) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    const next = responses.shift();
    if (typeof next === 'function') return next(url, init);
    return next;
  };
  return { calls, fetchImpl };
}

function handler(fetchImpl, extra = {}) {
  const logs = [];
  const h = createInquiryHandler({ upstreamUrl: UPSTREAM, fetchImpl, log: (e) => logs.push(e), ...extra });
  h.logs = logs;
  return h;
}

async function call(h, req) {
  const res = await h(req);
  const body = await res.json();
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.match(res.headers.get('content-type'), /^application\/json/);
  return { status: res.status, body, res };
}

test('Apps Script redirect then OK is a confirmed receipt', async () => {
  const u = upstream(
    new Response('', { status: 302, headers: { location: ECHO } }),
    new Response('OK\n', { status: 200 })
  );
  const { status, body } = await call(handler(u.fetchImpl), post(good));
  assert.equal(status, 200);
  assert.deepEqual(body, { ok: true, request_id: good.request_id });
  assert.equal(u.calls.length, 2);
  assert.equal(u.calls[0].url, UPSTREAM);
  assert.equal(u.calls[0].init.redirect, 'manual');
  assert.equal(u.calls[1].url, ECHO);
  assert.equal(u.calls[1].init.method, 'GET');
});

test('a direct OK is a confirmed receipt and sends only allowlisted form fields', async () => {
  const u = upstream(new Response('OK', { status: 200 }));
  const { status } = await call(handler(u.fetchImpl), post({ ...good, destination: 'https://evil.example', request_type: 'X' }));
  assert.equal(status, 200);
  const sent = new URLSearchParams(u.calls[0].init.body);
  assert.deepEqual([...sent.keys()].sort(), [
    'additional_context', 'email', 'evaluating', 'linkedin', 'name', 'organization', 'referral', 'request_type', 'timeframe'
  ]);
  assert.equal(sent.get('request_type'), 'Assessment');
  assert.match(u.calls[0].init.headers['Content-Type'], /application\/x-www-form-urlencoded/);
});

test('an HTML login page is not a receipt', async () => {
  const u = upstream(new Response('<html><title>Sign in</title></html>', { status: 200 }));
  const { status, body } = await call(handler(u.fetchImpl), post(good));
  assert.equal(status, 502);
  assert.deepEqual(body, { ok: false, code: 'delivery_unconfirmed', request_id: good.request_id });
});

test('an unexpected 200 body is not a receipt', async () => {
  const u = upstream(new Response('Error: quota', { status: 200 }));
  assert.equal((await call(handler(u.fetchImpl), post(good))).status, 502);
});

test('an upstream 500 is unconfirmed and its body is not exposed', async () => {
  const u = upstream(new Response('OK', { status: 500 }));
  const { status, body } = await call(handler(u.fetchImpl), post(good));
  assert.equal(status, 502);
  assert.equal(JSON.stringify(body).includes('OK'), false);
});

test('a redirect anywhere but the Apps Script echo is refused without following it', async () => {
  const u = upstream(new Response('', { status: 302, headers: { location: 'https://accounts.google.com/ServiceLogin' } }));
  const { status } = await call(handler(u.fetchImpl), post(good));
  assert.equal(status, 502);
  assert.equal(u.calls.length, 1);
});

test('echo allowlist', () => {
  assert.equal(isAllowedEcho(ECHO, UPSTREAM), true);
  assert.equal(isAllowedEcho('http://script.googleusercontent.com/macros/echo', UPSTREAM), false);
  assert.equal(isAllowedEcho('https://script.googleusercontent.com.evil.example/macros/echo', UPSTREAM), false);
  assert.equal(isAllowedEcho('https://script.googleusercontent.com/other', UPSTREAM), false);
  assert.equal(isAllowedEcho('/macros/echo', UPSTREAM), false);
});

test('a timeout is reported as uncertain receipt (504)', async () => {
  const hang = (url, init) => new Promise((_, reject) => {
    init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
  });
  const u = upstream(hang);
  const { status, body } = await call(handler(u.fetchImpl, { timeoutMs: 50 }), post(good));
  assert.equal(status, 504);
  assert.equal(body.code, 'delivery_unconfirmed');
});

test('a network failure is unconfirmed (502)', async () => {
  const u = upstream(() => { throw new TypeError('fetch failed'); });
  assert.equal((await call(handler(u.fetchImpl), post(good))).status, 502);
});

test('method, type and size are checked before anything is forwarded', async () => {
  const u = upstream();
  const h = handler(u.fetchImpl);
  const get = await call(h, new Request('https://motif54.com/.netlify/functions/inquiry'));
  assert.equal(get.status, 405);
  assert.equal(get.body.code, 'method_not_allowed');
  assert.equal(get.res.headers.get('allow'), 'POST');

  const form = await call(h, post('name=x', { 'content-type': 'application/x-www-form-urlencoded' }));
  assert.equal(form.status, 415);
  assert.equal(form.body.code, 'unsupported_type');

  const big = await call(h, post({ ...good, evaluating: 'x'.repeat(17000) }));
  assert.equal(big.status, 413);
  assert.equal(big.body.code, 'payload_too_large');
  assert.equal(u.calls.length, 0);
});

test('invalid input returns field errors keyed by field, without echoing values', async () => {
  const u = upstream();
  const { status, body } = await call(handler(u.fetchImpl), post({ name: '', email: 'secret-not-an-email', evaluating: 'short' }));
  assert.equal(status, 400);
  assert.equal(body.code, 'invalid_input');
  assert.deepEqual(body.field_errors, { name: 'required', email: 'invalid', evaluating: 'too_short' });
  assert.equal(JSON.stringify(body).includes('secret-not-an-email'), false);
  assert.equal(u.calls.length, 0);
});

test('malformed JSON and non-object bodies are invalid input', async () => {
  const u = upstream();
  const h = handler(u.fetchImpl);
  assert.equal((await call(h, post('{not json'))).status, 400);
  assert.equal((await call(h, post('[]'))).status, 400);
  assert.equal((await call(h, post('"text"'))).status, 400);
});

test('a filled honeypot gets the generic error and nothing is forwarded', async () => {
  const u = upstream();
  const { status, body } = await call(handler(u.fetchImpl), post({ ...good, company_website: 'http://spam.example' }));
  assert.equal(status, 400);
  assert.deepEqual(body, { ok: false, code: 'invalid_input', field_errors: {} });
  assert.equal(u.calls.length, 0);
});

test('missing or unexpected upstream configuration is 503 without detail', async () => {
  for (const upstreamUrl of [undefined, '', 'https://evil.example/exec', 'http://script.google.com/macros/s/AKfycby0000000/exec']) {
    const u = upstream();
    const h = createInquiryHandler({ upstreamUrl, fetchImpl: u.fetchImpl, log: () => {} });
    const { status, body } = await call(h, post(good));
    assert.equal(status, 503);
    assert.deepEqual(body, { ok: false, code: 'service_unavailable' });
    assert.equal(u.calls.length, 0);
  }
  assert.ok(UPSTREAM_PATTERN.test('https://script.google.com/macros/s/AKfycby_IiJSn5KSHmlplpe442B_ggVk8oH6ES1Q6eUtr7io7rrXFD8-ob5anYyjcy9C1UB2/exec'));
});

test('a missing request id is replaced, a valid one is echoed', async () => {
  const u = upstream(new Response('OK'), new Response('OK'));
  const h = handler(u.fetchImpl);
  const a = await call(h, post({ ...good, request_id: undefined }));
  assert.match(a.body.request_id, /^[A-Za-z0-9-]{8,64}$/);
  const b = await call(h, post({ ...good, request_id: '<script>' }));
  assert.notEqual(b.body.request_id, '<script>');
});

test('logs carry no personal data', async () => {
  const u = upstream(new Response('OK'));
  const h = handler(u.fetchImpl);
  await call(h, post(good));
  await call(h, post({ ...good, email: 'bad' }));
  const text = JSON.stringify(h.logs);
  for (const v of [good.name, good.email, good.evaluating, 'bad']) {
    assert.equal(text.includes(v), false, v);
  }
});

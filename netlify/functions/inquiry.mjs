/* MOTIF 54 inquiry adapter: POST /.netlify/functions/inquiry
 *
 * Receives the Work With Us form as same-origin JSON, validates it with the
 * shared schema, forwards only the allowlisted fields to the existing Google
 * Apps Script web app as a form-encoded POST, and reports success only when
 * Apps Script answers with the body "OK". Anything else (an HTML login page,
 * an unexpected body, a redirect to an unexpected host, a timeout) is
 * reported as unconfirmed, never as received.
 *
 * Configuration: INQUIRY_UPSTREAM_URL (Netlify environment variable with the
 * Functions scope) holds the Apps Script deployment URL. The browser never
 * supplies a destination. Without a valid value every request gets 503.
 *
 * Responses are JSON with Cache-Control: no-store. Submitted values are never
 * echoed and never logged; logs carry the request id and a result code only.
 */
import {
  HONEYPOT,
  MAX_BODY_BYTES,
  validateSubmission,
  buildUpstreamFields
} from '../../assets/inquiry-schema.mjs';

export const UPSTREAM_PATTERN = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{10,200}\/exec$/;
export const ECHO_ORIGIN = 'https://script.googleusercontent.com';
export const ECHO_PATH = '/macros/echo';
export const DEFAULT_TIMEOUT_MS = 15000;
const REQUEST_ID = /^[A-Za-z0-9-]{8,64}$/;
const REDIRECTS = new Set([301, 302, 303, 307, 308]);

function json(status, body, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: Object.assign({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }, extraHeaders || {})
  });
}

function defaultLog(entry) {
  console.log(JSON.stringify(Object.assign({ event: 'inquiry' }, entry)));
}

function newRequestId() {
  return globalThis.crypto && globalThis.crypto.randomUUID
    ? globalThis.crypto.randomUUID()
    : 'srv-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/* Only Apps Script's own response hop is followed: an HTTPS redirect to
   script.googleusercontent.com/macros/echo. */
export function isAllowedEcho(location, base) {
  try {
    const u = new URL(location, base);
    return u.origin === ECHO_ORIGIN && u.pathname === ECHO_PATH;
  } catch (e) {
    return false;
  }
}

export function createInquiryHandler(options) {
  const opts = options || {};
  const upstreamUrl = opts.upstreamUrl;
  const fetchImpl = opts.fetchImpl || globalThis.fetch;
  const timeoutMs = opts.timeoutMs || DEFAULT_TIMEOUT_MS;
  const log = opts.log || defaultLog;

  return async function handleInquiry(req) {
    if (req.method !== 'POST') {
      return json(405, { ok: false, code: 'method_not_allowed' }, { Allow: 'POST' });
    }

    const type = (req.headers.get('content-type') || '').toLowerCase();
    if (!/^application\/json(\s*;|$)/.test(type)) {
      return json(415, { ok: false, code: 'unsupported_type' });
    }

    const declared = Number(req.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      return json(413, { ok: false, code: 'payload_too_large' });
    }
    let text;
    try {
      const buf = await req.arrayBuffer();
      if (buf.byteLength > MAX_BODY_BYTES) return json(413, { ok: false, code: 'payload_too_large' });
      text = new TextDecoder('utf-8', { fatal: true }).decode(buf);
    } catch (e) {
      return json(400, { ok: false, code: 'invalid_input', field_errors: {} });
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch (e) {
      return json(400, { ok: false, code: 'invalid_input', field_errors: {} });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return json(400, { ok: false, code: 'invalid_input', field_errors: {} });
    }

    const requestId = typeof body.request_id === 'string' && REQUEST_ID.test(body.request_id)
      ? body.request_id
      : newRequestId();

    // A filled honeypot gets the same generic answer as malformed input.
    if (typeof body[HONEYPOT] === 'string' && body[HONEYPOT].trim() !== '') {
      log({ request_id: requestId, code: 'invalid_input', reason: 'screened' });
      return json(400, { ok: false, code: 'invalid_input', field_errors: {} });
    }

    const { values, errors } = validateSubmission(body);
    if (Object.keys(errors).length) {
      log({ request_id: requestId, code: 'invalid_input', fields: Object.keys(errors) });
      return json(400, { ok: false, code: 'invalid_input', field_errors: errors });
    }

    if (typeof upstreamUrl !== 'string' || !UPSTREAM_PATTERN.test(upstreamUrl)) {
      log({ request_id: requestId, code: 'service_unavailable' });
      return json(503, { ok: false, code: 'service_unavailable' });
    }

    const fields = buildUpstreamFields(values, requestId);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let upstreamStatus = null;
    try {
      let res = await fetchImpl(upstreamUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: new URLSearchParams(fields).toString(),
        redirect: 'manual',
        signal: controller.signal
      });
      upstreamStatus = res.status;

      if (REDIRECTS.has(res.status)) {
        const location = res.headers.get('location');
        if (!location || !isAllowedEcho(location, upstreamUrl)) {
          log({ request_id: requestId, code: 'delivery_unconfirmed', upstream_status: upstreamStatus, reason: 'redirect' });
          return json(502, { ok: false, code: 'delivery_unconfirmed', request_id: requestId });
        }
        res = await fetchImpl(new URL(location, upstreamUrl).toString(), {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal
        });
        upstreamStatus = res.status;
      }

      const reply = res.status >= 200 && res.status < 300 ? (await res.text()).trim() : null;
      if (reply === 'OK') {
        log({ request_id: requestId, code: 'received', upstream_status: upstreamStatus });
        return json(200, { ok: true, request_id: requestId });
      }
      log({ request_id: requestId, code: 'delivery_unconfirmed', upstream_status: upstreamStatus, reason: 'reply' });
      return json(502, { ok: false, code: 'delivery_unconfirmed', request_id: requestId });
    } catch (e) {
      if (controller.signal.aborted) {
        log({ request_id: requestId, code: 'delivery_unconfirmed', upstream_status: upstreamStatus, reason: 'timeout' });
        return json(504, { ok: false, code: 'delivery_unconfirmed', request_id: requestId });
      }
      log({ request_id: requestId, code: 'delivery_unconfirmed', upstream_status: upstreamStatus, reason: 'network' });
      return json(502, { ok: false, code: 'delivery_unconfirmed', request_id: requestId });
    } finally {
      clearTimeout(timer);
    }
  };
}

function readEnv(name) {
  const env = globalThis.Netlify && globalThis.Netlify.env;
  if (env && typeof env.get === 'function') return env.get(name);
  return typeof process !== 'undefined' && process.env ? process.env[name] : undefined;
}

export default async function inquiry(req) {
  const handler = createInquiryHandler({ upstreamUrl: readEnv('INQUIRY_UPSTREAM_URL') });
  return handler(req);
}

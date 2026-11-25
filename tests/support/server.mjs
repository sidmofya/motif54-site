/* Local test server: static files under the netlify.toml rules, plus the
   inquiry adapter mounted at /.netlify/functions/inquiry with an injected
   upstream. It never contacts Google. */
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { ROOT, loadRules, resolve } from './netlify-rules.mjs';
import { createInquiryHandler } from '../../netlify/functions/inquiry.mjs';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

export const FAKE_UPSTREAM = 'https://script.google.com/macros/s/TEST_DEPLOYMENT_0000000000/exec';

/* Fake Apps Script behaviours. Each returns a fetch implementation. */
export const upstreams = {
  ok: () => async (url, init) => {
    if (init.method === 'POST') {
      return new Response('', { status: 302, headers: { location: 'https://script.googleusercontent.com/macros/echo?user_content_key=test' } });
    }
    return new Response('OK', { status: 200 });
  },
  loginPage: () => async () => new Response('<!doctype html><title>Sign in</title>', { status: 200, headers: { 'content-type': 'text/html' } }),
  hang: () => (url, init) => new Promise((_, reject) => {
    init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
  })
};

export function startServer(options = {}) {
  const state = {
    upstreamUrl: 'upstreamUrl' in options ? options.upstreamUrl : FAKE_UPSTREAM,
    fetchImpl: options.fetchImpl || upstreams.ok(),
    timeoutMs: options.timeoutMs || 15000,
    calls: 0,
    upstreamBodies: []
  };
  const rules = loadRules();

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/.netlify/functions/inquiry') {
      state.calls += 1;
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = Buffer.concat(chunks);
      const request = new Request(url.toString(), {
        method: req.method,
        headers: req.headers,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : body
      });
      const recording = async (u, init) => {
        if (init && init.method === 'POST') state.upstreamBodies.push(String(init.body));
        return state.fetchImpl(u, init);
      };
      const handler = createInquiryHandler({
        upstreamUrl: state.upstreamUrl,
        fetchImpl: recording,
        timeoutMs: state.timeoutMs,
        log: () => {}
      });
      const out = await handler(request);
      res.writeHead(out.status, Object.fromEntries(out.headers));
      res.end(Buffer.from(await out.arrayBuffer()));
      return;
    }

    const r = resolve(rules, ROOT, url.pathname, url.search);
    if (r.location) {
      res.writeHead(r.status, { Location: r.location });
      res.end();
      return;
    }
    if (!r.file) {
      res.writeHead(r.status, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    // Compress text like Netlify does, so performance runs see realistic bytes.
    const type = TYPES[extname(r.file)] || 'application/octet-stream';
    let body = readFileSync(r.file);
    const headers = { 'Content-Type': type };
    if (/text|javascript|json|svg|xml/.test(type) && /gzip/.test(req.headers['accept-encoding'] || '')) {
      body = gzipSync(body);
      headers['Content-Encoding'] = 'gzip';
      headers['Vary'] = 'Accept-Encoding';
    }
    res.writeHead(r.status, headers);
    res.end(body);
  });

  return new Promise((resolveStart) => {
    server.listen(options.port || 0, '127.0.0.1', () => {
      const { port } = server.address();
      resolveStart({
        url: `http://127.0.0.1:${port}`,
        state,
        close: () => new Promise((r) => server.close(r))
      });
    });
  });
}

/* Run directly for manual review: node tests/support/server.mjs [port] */
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.argv[2] || 8788);
  startServer({ port }).then((s) => console.log('Serving with netlify.toml rules at ' + s.url));
}

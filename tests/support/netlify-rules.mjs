/* Reads the [[redirects]] blocks of netlify.toml and applies them the way
   Netlify documents: first match wins; a rule without force only applies
   when no file exists at the requested path; 301s keep the query string
   unless the rule's target has its own. This is a test approximation of
   the platform, not a substitute for checking a hosted deploy. */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const ROOT = new URL('../../', import.meta.url).pathname;

/* Drop a trailing # comment, but not a # inside a quoted string. */
function stripComment(line) {
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"' && line[i - 1] !== '\\') quoted = !quoted;
    else if (line[i] === '#' && !quoted) return line.slice(0, i);
  }
  return line;
}

export function parseRedirects(tomlText) {
  const rules = [];
  let current = null;
  for (const raw of tomlText.split('\n')) {
    const line = stripComment(raw).trim();
    if (!line) continue;
    if (line.startsWith('[')) {
      current = null;
      if (line === '[[redirects]]') {
        current = {};
        rules.push(current);
      }
      continue;
    }
    if (!current) continue;
    const m = line.match(/^(\w+)\s*=\s*(.+)$/);
    if (!m) throw new Error('Unrecognised redirect line: ' + raw);
    const [, key, value] = m;
    if (/^".*"$/.test(value)) current[key] = value.slice(1, -1);
    else if (value === 'true' || value === 'false') current[key] = value === 'true';
    else if (/^\d+$/.test(value)) current[key] = Number(value);
    else throw new Error('Unrecognised redirect value: ' + raw);
  }
  return rules;
}

export function loadRules(root = ROOT) {
  return parseRedirects(readFileSync(join(root, 'netlify.toml'), 'utf8'));
}

function fileFor(root, path) {
  const rel = decodeURIComponent(path).replace(/^\/+/, '');
  if (rel.includes('..')) return null;
  const full = join(root, rel);
  if (existsSync(full) && statSync(full).isFile()) return full;
  return null;
}

function matches(rule, path) {
  const from = rule.from;
  const norm = (p) => (p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p);
  if (from.endsWith('/*')) return path === from.slice(0, -2) || path.startsWith(from.slice(0, -1));
  return norm(path) === norm(from);
}

/* Resolve a request path (no query) to { status, location?, file? }. */
export function resolve(rules, root, path, search = '') {
  for (const rule of rules) {
    if (!matches(rule, path)) continue;
    if (!rule.force && fileFor(root, path)) break;
    if (rule.status === 301 || rule.status === 302) {
      const to = rule.to.includes('?') ? rule.to : rule.to.replace(/(#.*)?$/, (h) => search + (h || ''));
      return { status: rule.status, location: to, rule };
    }
    if (rule.status === 200) return { status: 200, file: fileFor(root, rule.to), rule };
    if (rule.status === 404) return { status: 404, file: fileFor(root, rule.to), rule };
  }
  const direct = path.endsWith('/') ? fileFor(root, path + 'index.html') : fileFor(root, path);
  if (direct) return { status: 200, file: direct };
  if (path.endsWith('/') && path !== '/' && fileFor(root, path.slice(0, -1) + '.html')) {
    return { status: 301, location: path.slice(0, -1) + search };
  }
  const pretty = fileFor(root, path + '.html');
  if (pretty) return { status: 200, file: pretty };
  return { status: 404, file: fileFor(root, '/404.html') };
}

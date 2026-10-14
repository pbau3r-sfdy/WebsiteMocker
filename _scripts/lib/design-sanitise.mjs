/**
 * design-sanitise.mjs - allowlist walker that neutralises pulled design HTML (DSYNC-08).
 *
 * sanitiseHtml(html, { allowHosts }) -> { html, report }
 * report entries: { kind, detail } with kind one of
 *   removed-element | removed-attribute | removed-url | removed-comment |
 *   external-link-kept | instruction-like-text
 *
 * Text that looks like instructions is reported, never altered or acted on.
 */

import { fromHtml } from 'hast-util-from-html';
import { toHtml } from 'hast-util-to-html';
import * as csstree from 'css-tree';

export const DEFAULT_ALLOW_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

const REMOVE_ELEMENTS = new Set([
  'script', 'iframe', 'object', 'embed', 'base', 'frame', 'frameset',
  'foreignobject', 'noscript',
]);

const URL_PROPS = ['href', 'src', 'srcSet', 'poster', 'action', 'formAction', 'xLinkHref', 'data', 'background'];
const RESOURCE_PROPS = new Set(['src', 'srcSet', 'poster', 'action', 'formAction', 'data', 'background']);

const INSTRUCTION_PATTERNS = [
  /ignore (all |any )?(previous|prior|above) instructions/i,
  /disregard (the )?(previous|above)/i,
  /you are (now )?(an?|the) /i,
  /system prompt/i,
  /\b(assistant|system|user):/i,
  /run (the )?(command|shell)/i,
  /git push/i,
  /curl .*\|\s*(sh|bash)/i,
];

export function findInstructionLikeText(text) {
  const out = [];
  if (!text) return out;
  for (const re of INSTRUCTION_PATTERNS) {
    const m = re.exec(text);
    if (m) out.push(m[0].slice(0, 80));
  }
  return out;
}

function hostOf(url) {
  try {
    const u = new URL(url.startsWith('//') ? 'https:' + url : url);
    return u.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isAbsoluteHttp(url) {
  return /^(https?:)?\/\//i.test(url);
}

function schemeOf(url) {
  const m = /^([a-z][a-z0-9+.-]*):/i.exec(url.replace(/[\u0000- ]/g, ''));
  return m ? m[1].toLowerCase() : null;
}

function dataUrlOk(url) {
  return /^data:image\/(png|jpeg|gif|webp);/i.test(url.replace(/^[\s\u0000- ]+/, ''));
}

function walk(node, cb, parent = null) {
  if (!node.children) return;
  for (const child of [...node.children]) {
    const keep = cb(child, node);
    if (keep === false) {
      node.children = node.children.filter((c) => c !== child);
      continue;
    }
    walk(child, cb, node);
  }
}

function cssText(node) {
  return (node.children || []).map((c) => c.value || '').join('');
}

export function sanitiseHtml(html, { allowHosts = [] } = {}) {
  const report = [];
  const hosts = new Set([...DEFAULT_ALLOW_HOSTS, ...allowHosts].map((h) => h.toLowerCase()));
  const hostAllowed = (url) => {
    const h = hostOf(url);
    return h !== null && hosts.has(h);
  };
  const add = (kind, detail) => report.push({ kind, detail });

  const tree = fromHtml(html, /<html[\s>]/i.test(html) ? {} : { fragment: true });

  // Returns true when url should be kept.
  function checkUrl(prop, url, tag) {
    const v = url.trim();
    if (!v) return true;
    const scheme = schemeOf(v);
    if (scheme === 'javascript' || scheme === 'vbscript') {
      add('removed-url', `${tag}[${prop}] ${scheme}: URL`);
      return false;
    }
    if (scheme === 'data') {
      if (dataUrlOk(v)) return true;
      add('removed-url', `${tag}[${prop}] disallowed data: URL`);
      return false;
    }
    if (isAbsoluteHttp(v)) {
      if ((tag === 'a' || tag === 'area') && prop === 'href') {
        add('external-link-kept', `${tag}[href] ${v.slice(0, 120)}`);
        return true;
      }
      if (hostAllowed(v)) return true;
      add('removed-url', `${tag}[${prop}] ${v.slice(0, 120)}`);
      return false;
    }
    return true;
  }

  function sanitiseStyleText(text) {
    let ast;
    try {
      ast = csstree.parse(text, { onParseError() {} });
    } catch {
      return text;
    }
    let changed = false;
    csstree.walk(ast, {
      visit: 'Atrule',
      enter(node, item, list) {
        if (node.name.toLowerCase() !== 'import') return;
        const gen = csstree.generate(node);
        const m = /url\(\s*["']?([^"')]+)["']?\s*\)|["']([^"']+)["']/i.exec(gen);
        const url = m ? (m[1] || m[2]) : '';
        if (!hostAllowed(url)) {
          add('removed-url', `style @import ${url.slice(0, 120)}`);
          list.remove(item);
          changed = true;
        }
      },
    });
    csstree.walk(ast, {
      visit: 'Declaration',
      enter(node, item, list) {
        const gen = csstree.generate(node);
        if (/expression\s*\(|javascript:|-moz-binding/i.test(gen)) {
          add('removed-attribute', `style declaration ${node.property}`);
          if (list) list.remove(item);
          changed = true;
        }
      },
    });
    return changed ? csstree.generate(ast) : text;
  }

  walk(tree, (node) => {
    if (node.type === 'comment') {
      add('removed-comment', (node.value || '').trim().slice(0, 80));
      for (const s of findInstructionLikeText(node.value)) add('instruction-like-text', s);
      return false;
    }
    if (node.type === 'text') {
      for (const s of findInstructionLikeText(node.value)) add('instruction-like-text', s);
      return true;
    }
    if (node.type !== 'element') return true;

    const tag = node.tagName.toLowerCase();
    const props = node.properties || (node.properties = {});

    if (REMOVE_ELEMENTS.has(tag)) {
      add('removed-element', tag);
      return false;
    }
    if (tag === 'meta' && String(props.httpEquiv || '').toLowerCase() === 'refresh') {
      add('removed-element', 'meta http-equiv=refresh');
      return false;
    }

    for (const name of Object.keys(props)) {
      if (/^on/i.test(name)) {
        add('removed-attribute', `${tag}[${name}]`);
        delete props[name];
      }
    }

    if (tag === 'link') {
      const href = String(props.href || '');
      if (href && isAbsoluteHttp(href) && !hostAllowed(href)) {
        add('removed-element', `link ${href.slice(0, 120)}`);
        return false;
      }
      if (href && /^(javascript|vbscript|data):/i.test(href.trim())) {
        add('removed-element', 'link with script/data URL');
        return false;
      }
    }

    for (const name of URL_PROPS) {
      if (!(name in props)) continue;
      if (tag === 'link' && name === 'href') continue; // handled above
      const raw = props[name];
      if (name === 'srcSet') {
        const entries = (Array.isArray(raw) ? raw.join(',') : String(raw))
          .split(',').map((s) => s.trim()).filter(Boolean);
        const kept = entries.filter((e) => checkUrl('srcSet', e.split(/\s+/)[0], tag));
        if (kept.length === 0) delete props[name];
        else if (kept.length !== entries.length) props[name] = kept.join(', ');
        continue;
      }
      const url = Array.isArray(raw) ? raw.join(' ') : String(raw);
      // Non-resource props that are not href (none left) fall through.
      if (!RESOURCE_PROPS.has(name) && name !== 'href' && name !== 'xLinkHref') continue;
      if (!checkUrl(name, url, tag)) delete props[name];
    }

    if (typeof props.style === 'string') {
      const s = props.style;
      let drop = /javascript:|expression\s*\(|-moz-binding/i.test(s);
      if (!drop) {
        const re = /url\(\s*["']?([^"')]+)["']?\s*\)/gi;
        let m;
        while ((m = re.exec(s))) {
          const u = m[1].trim();
          if (/^(javascript|vbscript):/i.test(u) || (isAbsoluteHttp(u) && !hostAllowed(u))) drop = true;
        }
      }
      if (drop) {
        add('removed-attribute', `${tag}[style]`);
        delete props.style;
      }
    }

    if (tag === 'style' && node.children) {
      const before = cssText(node);
      const after = sanitiseStyleText(before);
      if (after !== before) node.children = [{ type: 'text', value: after }];
    }
    return true;
  });

  return { html: toHtml(tree), report };
}

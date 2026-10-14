// Pure Plausible snippet library (no fs, no Astro). Used by _scripts/plausible.mjs
// and by the Phase 10 test harness.
//
//   resolveIdentity(wiring, { sandbox })  which Plausible identity may this build report to (ANLY-03)
//   buildSnippet(identity, wiring, opts)  head-inline JS, pa- per-site format or legacy (ANLY-02, ANLY-04)
//   TRANSFORM_FACTORY_SRC                 shared sanitising transformRequest source (ANLY-05)
//   PROPS_FACTORY_SRC                     low-cardinality customProperties source (D-03)

import { SANDBOX_DOMAIN } from './env.mjs';

export const SANDBOX_OPT_IN_WARNING =
  'ANALYTICS DEBUG OPT-IN: this SANDBOX build reports into the PRODUCTION Plausible site (analytics.sandboxUsesProdId=true). Filter by page path /WebsiteMocker in Plausible. Remove sandboxUsesProdId before the Phase 12 cutover.';

const QUEUE_STUB =
  'window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)};';

const ID_RE = /^pa-[A-Za-z0-9_-]+$/;
const HOST_RE = /^https:\/\/[A-Za-z0-9.-]+(:\d+)?\/?$/;
const DOMAIN_RE = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/i;
const BASE_RE = /^\/[A-Za-z0-9._~\/-]*$/;
const SLUG_RE = /^[a-z0-9-]*$/;
const PROP_TYPES = ['news', 'blog', 'announcements', 'press'];

// The one escaping helper for every value embedded in the inline <script> (WR-02):
// JSON plus < (so </script> and <!-- cannot occur) and the JS line separators.
function js(v) {
  return JSON.stringify(v)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/** Validate an analytics.host value and return its origin without trailing slash (shared with fetch-analytics-data.mjs). */
export function hostOrigin(host) {
  if (!(typeof host === 'string' && HOST_RE.test(host))) {
    throw new Error('analytics.host must be an https origin (value not echoed)');
  }
  return host.replace(/\/$/, '').toLowerCase();
}

function siteHostname(site) {
  try {
    return new URL(String(site)).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function fail(msg) {
  return new Error(`[plausible] ANLY-03: ${msg}`);
}

function cleanDomain(a, wiring) {
  return String(a.domain ?? wiring.domain ?? '').replace(/^www\./, '');
}

function isSandboxish(domain) {
  return domain === SANDBOX_DOMAIN || domain.endsWith('.github.io');
}

export function resolveIdentity(wiring, { sandbox, site } = {}) {
  const a = wiring.analytics ?? {};

  for (const key of ['scriptId', 'sandboxScriptId']) {
    if (a[key] !== undefined && !(typeof a[key] === 'string' && ID_RE.test(a[key]))) {
      throw fail(`analytics.${key} must be a pa-… token (value not echoed)`);
    }
  }
  if (a.host !== undefined && !(typeof a.host === 'string' && HOST_RE.test(a.host))) {
    throw fail(`analytics.host must be an https origin (value not echoed)`);
  }
  if (a.exclude !== undefined && !(Array.isArray(a.exclude) && a.exclude.every((x) => typeof x === 'string' && x.startsWith('/')))) {
    throw fail('analytics.exclude must be an array of path strings starting with "/"');
  }
  if (
    a.eventNames !== undefined &&
    !(a.eventNames && typeof a.eventNames === 'object' && !Array.isArray(a.eventNames) &&
      Object.values(a.eventNames).every((x) => typeof x === 'string'))
  ) {
    throw fail('analytics.eventNames must map event name strings to strings');
  }
  if (a.sandbox === false && a.sandboxUsesProdId === true) {
    throw fail('analytics.sandbox is false but sandboxUsesProdId is true (contradictory)');
  }
  if (a.sandboxScriptId && a.sandboxScriptId === a.scriptId) {
    throw fail('analytics.sandboxScriptId equals scriptId; the sandbox must use a separate Plausible site');
  }
  if (!a.scriptId && (a.sanitise === true || (Array.isArray(a.exclude) && a.exclude.length > 0))) {
    throw fail('sanitised mode requires analytics.scriptId (legacy script.js has no transformRequest)');
  }

  const host = a.host ?? 'https://plausible.io';
  const domain = cleanDomain(a, wiring);
  if (domain && !DOMAIN_RE.test(domain)) {
    throw fail('analytics.domain / wiring.domain is not a valid hostname (value not echoed)');
  }

  if (!sandbox) {
    if (!a.scriptId && !domain) return { emit: false, reason: 'no domain' };
    if (isSandboxish(domain)) {
      throw fail(`production build resolves to sandbox identity ${domain}`);
    }
    // WR-05: production must be positively identified, not merely "not the sandbox base".
    if (!site) {
      throw fail('production build needs the Astro config "site" (SITE_URL) to verify the analytics domain');
    }
    const siteHost = siteHostname(site);
    if (siteHost !== domain.toLowerCase()) {
      throw fail(`production build site hostname "${siteHost}" does not match analytics domain "${domain}"`);
    }
    if (a.scriptId) {
      return { emit: true, kind: 'script', scriptId: a.scriptId, domain, host, debugOptIn: false, label: a.scriptId };
    }
    return { emit: true, kind: 'legacy', domain, host, debugOptIn: false, label: domain };
  }

  if (a.sandbox === false) return { emit: false, reason: 'sandbox:false' };

  if (a.scriptId) {
    if (a.sandboxScriptId) {
      return { emit: true, kind: 'script', scriptId: a.sandboxScriptId, domain: SANDBOX_DOMAIN, host, debugOptIn: false, label: a.sandboxScriptId };
    }
    if (a.sandboxUsesProdId === true) {
      return { emit: true, kind: 'script', scriptId: a.scriptId, domain, host, debugOptIn: true, label: a.scriptId };
    }
    return {
      emit: false,
      reason: 'sandbox build of a scriptId site without sandboxScriptId or sandboxUsesProdId (D-02 protective default)',
    };
  }

  // Legacy site: documented exception, sandbox previews keep reporting to SANDBOX_DOMAIN.
  return { emit: true, kind: 'legacy', domain: SANDBOX_DOMAIN, host, debugOptIn: false, label: SANDBOX_DOMAIN };
}

export const TRANSFORM_FACTORY_SRC = String.raw`function(cfg){
var SCHEME=/^[a-z][a-z0-9+.-]*:\/\/[^\/?#]*/i;
var UUID=/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
var HEX=/^[0-9a-fA-F]{32}$/;
var TOK=/^[A-Za-z0-9_]{40,}$/;
var MIX=/^(?=.*[A-Z])(?=.*[0-9])[A-Za-z0-9_-]{24,}$/;
function dec(s){try{return decodeURIComponent(s);}catch(e){return s;}}
function mask(seg){
  var d=dec(seg);
  return(d.indexOf('@')>=0||UUID.test(d)||HEX.test(d)||TOK.test(d)||MIX.test(d))?'_ID_':seg;
}
function clean(s){
  if(typeof s!=='string')return s;
  var i=s.indexOf('#');
  if(i>=0)s=s.slice(0,i);
  if(cfg.sanitise){
    i=s.indexOf('?');
    if(i>=0)s=s.slice(0,i);
    var m=SCHEME.exec(s),pre=m?m[0]:'';
    s=pre+s.slice(pre.length).split('/').map(mask).join('/');
  }
  return s;
}
function norm(s){
  var out=[];
  dec(s).toLowerCase().split('/').forEach(function(x){
    if(x===''||x==='.')return;
    if(x==='..'){out.pop();return;}
    out.push(x);
  });
  return '/'+out.join('/');
}
function excluded(path){
  var p=norm(path),b=cfg.base?norm(cfg.base):'/';
  if(b!=='/'&&(p===b||p.indexOf(b+'/')===0))p=p.slice(b.length)||'/';
  var ex=cfg.exclude||[];
  for(var k=0;k<ex.length;k++){
    var e=norm(ex[k]);
    if(e==='/'||p===e||p.indexOf(e+'/')===0)return true;
  }
  return false;
}
return function(p){
  if(!p)return p;
  var map=cfg.eventNames||{};
  if(Object.prototype.hasOwnProperty.call(map,p.n))p.n=map[p.n];
  if(typeof p.u==='string'){
    var u=p.u,h=u.indexOf('#');
    if(h>=0)u=u.slice(0,h);
    var path=u.replace(SCHEME,''),q=path.indexOf('?');
    if(q>=0)path=path.slice(0,q);
    if(excluded(path))return null;
    p.u=clean(p.u);
  }
  if(typeof p.r==='string'){
    var r=p.r,hr=r.indexOf('#');
    if(hr>=0)r=r.slice(0,hr);
    if(cfg.sanitise){var m=/^[a-z][a-z0-9+.-]*:\/\/[^\/?#]+/i.exec(r);r=m?m[0]:'';}
    p.r=r;
  }
  if(p.p!==undefined&&p.p!==null){
    var props=p.p,isStr=typeof props==='string';
    if(isStr){try{props=JSON.parse(props);}catch(e){props=null;}}
    if(props&&typeof props==='object'){
      for(var key in props){if(Object.prototype.hasOwnProperty.call(props,key))props[key]=clean(props[key]);}
      p.p=isStr?JSON.stringify(props):props;
    }
  }
  return p;
};
}`;

export const PROPS_FACTORY_SRC = String.raw`function(cfg){
return function(){
  var path=location.pathname;
  if(cfg.base&&cfg.base!=='/'&&path.indexOf(cfg.base)===0)path=path.slice(cfg.base.length);
  var seg=path.split('/').filter(function(x){return x;})[0]||'';
  var t=seg===''?'home':seg==='d'?'drop':(cfg.types.indexOf(seg)>=0?seg:'page');
  return {site:cfg.site,content_type:t};
};
}`;

export function buildSnippet(identity, wiring, { base = '/', slug = '' } = {}) {
  const a = wiring.analytics ?? {};
  const events = a.events ?? {};
  if (typeof base !== 'string' || !BASE_RE.test(base)) throw fail('base is not a plain path (value not echoed)');
  if (typeof slug !== 'string' || !SLUG_RE.test(slug)) throw fail('slug is not a plain slug (value not echoed)');
  const host = (identity.host ?? 'https://plausible.io').replace(/\/$/, '');
  const warnings = [];

  if (identity.kind === 'script') {
    const cfg = {
      sanitise: a.sanitise !== false,
      exclude: a.exclude ?? [],
      eventNames: a.eventNames ?? {},
      base,
    };
    const parts = [
      `outboundLinks:${events.outboundLinks !== false}`,
      `fileDownloads:${events.fileDownloads !== false}`,
      `formSubmissions:${events.formSubmissions !== false}`,
      `transformRequest:(${TRANSFORM_FACTORY_SRC})(${js(cfg)})`,
    ];
    if (a.props === true) {
      parts.push(
        `customProperties:(${PROPS_FACTORY_SRC})(${js({ site: slug, base, types: PROP_TYPES })})`,
      );
    }
    const src = `${host}/js/${identity.scriptId}.js`;
    const code = [
      QUEUE_STUB,
      'window.plausible.init=window.plausible.init||function(i){window.plausible.o=i||{}};',
      `window.plausible.init({${parts.join(',')}});`,
      `(function(){var s=document.createElement('script');s.async=true;s.src=${js(src)};document.head.appendChild(s)})();`,
    ].join('');
    return { code, warnings };
  }

  const ext = [];
  if (events.fileDownloads !== false) ext.push('file-downloads');
  if (events.outboundLinks !== false) ext.push('outbound-links');
  if (events.formSubmissions === true) {
    warnings.push('formSubmissions is not available on the legacy script; ignored');
  }
  if (a.props === true) warnings.push('analytics.props is not available on the legacy script; ignored');
  const file = ext.length ? `script.${ext.join('.')}.js` : 'script.js';
  const src = `${host}/js/${file}`;
  const code = [
    QUEUE_STUB,
    `(function(){var s=document.createElement('script');s.defer=true;s.dataset.domain=${js(identity.domain)};s.src=${js(src)};document.head.appendChild(s)})();`,
  ].join('');
  return { code, warnings };
}

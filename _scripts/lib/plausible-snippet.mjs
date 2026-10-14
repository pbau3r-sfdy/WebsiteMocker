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
const PROP_TYPES = ['news', 'blog', 'announcements', 'press'];

function fail(msg) {
  return new Error(`[plausible] ANLY-03: ${msg}`);
}

function cleanDomain(a, wiring) {
  return String(a.domain ?? wiring.domain ?? '').replace(/^www\./, '');
}

function isSandboxish(domain) {
  return domain === SANDBOX_DOMAIN || domain.endsWith('.github.io');
}

export function resolveIdentity(wiring, { sandbox }) {
  const a = wiring.analytics ?? {};

  for (const key of ['scriptId', 'sandboxScriptId']) {
    if (a[key] !== undefined && !(typeof a[key] === 'string' && ID_RE.test(a[key]))) {
      throw fail(`analytics.${key} must be a pa-… token (value not echoed)`);
    }
  }
  if (a.host !== undefined && !(typeof a.host === 'string' && HOST_RE.test(a.host))) {
    throw fail(`analytics.host must be an https origin (value not echoed)`);
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

  if (!sandbox) {
    if (!a.scriptId && !domain) return { emit: false, reason: 'no domain' };
    if (isSandboxish(domain)) {
      throw fail(`production build resolves to sandbox identity ${domain}`);
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
  const identity = { emit: true, kind: 'legacy', domain: SANDBOX_DOMAIN, host, debugOptIn: false, label: SANDBOX_DOMAIN };
  if (identity.domain !== SANDBOX_DOMAIN) throw fail('sandbox legacy identity is not the sandbox domain');
  return identity;
}

export const TRANSFORM_FACTORY_SRC = String.raw`function(cfg){
var HEX=/\/[0-9a-fA-F]{32}(?=\/|$)/g;
var TOK=/\/[A-Za-z0-9_]{40,}(?=\/|$)/g;
var SCHEME=/^[a-z][a-z0-9+.-]*:\/\/[^\/]+/i;
function clean(s){
  if(typeof s!=='string')return s;
  var i=s.indexOf('#');
  if(i>=0)s=s.slice(0,i);
  if(cfg.sanitise){
    i=s.indexOf('?');
    if(i>=0)s=s.slice(0,i);
    s=s.replace(HEX,'/_ID_').replace(TOK,'/_ID_');
  }
  return s;
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
    var ex=cfg.exclude||[];
    for(var k=0;k<ex.length;k++){if(path.indexOf(ex[k])===0)return null;}
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
  const host = (identity.host ?? 'https://plausible.io').replace(/\/$/, '');
  const warnings = [];

  if (identity.kind === 'script') {
    const cfg = {
      sanitise: a.sanitise !== false,
      exclude: a.exclude ?? [],
      eventNames: a.eventNames ?? {},
    };
    const parts = [
      `outboundLinks:${events.outboundLinks !== false}`,
      `fileDownloads:${events.fileDownloads !== false}`,
      `formSubmissions:${events.formSubmissions !== false}`,
      `transformRequest:(${TRANSFORM_FACTORY_SRC})(${JSON.stringify(cfg)})`,
    ];
    if (a.props === true) {
      parts.push(
        `customProperties:(${PROPS_FACTORY_SRC})(${JSON.stringify({ site: slug, base, types: PROP_TYPES })})`,
      );
    }
    const src = `${host}/js/${identity.scriptId}.js`;
    const code = [
      QUEUE_STUB,
      'window.plausible.init=window.plausible.init||function(i){window.plausible.o=i||{}};',
      `window.plausible.init({${parts.join(',')}});`,
      `(function(){var s=document.createElement('script');s.async=true;s.src=${JSON.stringify(src)};document.head.appendChild(s)})();`,
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
    `(function(){var s=document.createElement('script');s.defer=true;s.dataset.domain=${JSON.stringify(identity.domain)};s.src=${JSON.stringify(src)};document.head.appendChild(s)})();`,
  ].join('');
  return { code, warnings };
}

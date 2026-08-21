#!/usr/bin/env node
/**
 * validate-brand.mjs — Nyquist adversarial tests for Phase 3 brand consistency
 *
 * Covers:
 *   BRAND-01 Task 1 — wiring.json brand stubs in all four active sites
 *   BRAND-01 Task 2 — _core/brand-schema.md content requirements
 *   BRAND-02 Task 1 — .claude/skills/wm-wire.md Brand block section
 *   BRAND-03 Tasks 1-3 — _core/.claude/skills/wm-add-{news,announcement,blog,job}.md
 *
 * Usage:  node _scripts/validate-brand.mjs
 * Exit 0: all assertions pass
 * Exit 1: one or more assertions fail
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = '/Users/pbau3r/DevWorks/Websites/WebsiteMocker';

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.log(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

function readJSON(relPath) {
  const fullPath = join(ROOT, relPath);
  try {
    return JSON.parse(readFileSync(fullPath, 'utf8'));
  } catch (err) {
    return null;
  }
}

function readText(relPath) {
  const fullPath = join(ROOT, relPath);
  try {
    return readFileSync(fullPath, 'utf8');
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// BRAND-01 Task 1: wiring.json brand stubs — all four active sites
// Requirement: each site has "brand" key with hashtags (array),
//              vocabulary (array), avoid (array), voice (string)
// ═══════════════════════════════════════════════════════════════════
console.log('\n[BRAND-01 Task 1] wiring.json brand stubs — all four active sites');

const ACTIVE_SITES = ['sfdy-alt-clean', 'mogwai-systems', 'parrot-capital', 'crestworks'];

for (const slug of ACTIVE_SITES) {
  const relPath = `sites/${slug}/wiring.json`;
  const data = readJSON(relPath);

  assert(
    `${slug}: wiring.json parses as valid JSON`,
    data !== null,
    data === null ? `parse error or missing file at ${relPath}` : ''
  );

  if (data === null) {
    // mark remaining assertions failed without a parse result
    for (const lbl of ['has top-level "brand" key', 'brand.hashtags is an array',
      'brand.vocabulary is an array', 'brand.avoid is an array', 'brand.voice is a string',
      'brand block contains all four required keys']) {
      assert(`${slug}: ${lbl}`, false, 'skipped — JSON parse failed');
    }
    continue;
  }

  const brand = data.brand;
  assert(`${slug}: has top-level "brand" key`, brand !== undefined && brand !== null);

  if (!brand) {
    for (const lbl of ['brand.hashtags is an array', 'brand.vocabulary is an array',
      'brand.avoid is an array', 'brand.voice is a string',
      'brand block contains all four required keys']) {
      assert(`${slug}: ${lbl}`, false, 'skipped — no brand key');
    }
    continue;
  }

  assert(
    `${slug}: brand.hashtags is an array`,
    Array.isArray(brand.hashtags),
    `got ${typeof brand.hashtags}`
  );
  assert(
    `${slug}: brand.vocabulary is an array`,
    Array.isArray(brand.vocabulary),
    `got ${typeof brand.vocabulary}`
  );
  assert(
    `${slug}: brand.avoid is an array`,
    Array.isArray(brand.avoid),
    `got ${typeof brand.avoid}`
  );
  assert(
    `${slug}: brand.voice is a string`,
    typeof brand.voice === 'string',
    `got ${typeof brand.voice}`
  );

  const requiredKeys = ['hashtags', 'vocabulary', 'avoid', 'voice'];
  const hasAllFourKeys = requiredKeys.every(k => k in brand);
  assert(
    `${slug}: brand block contains all four required keys (hashtags, vocabulary, avoid, voice)`,
    hasAllFourKeys,
    hasAllFourKeys ? '' : `missing: ${requiredKeys.filter(k => !(k in brand)).join(', ')}`
  );
}

// ═══════════════════════════════════════════════════════════════════
// BRAND-01 Task 2: _core/brand-schema.md
// Requirement: field reference table, minimal stub, populated example,
//              informational note about voice
// ═══════════════════════════════════════════════════════════════════
console.log('\n[BRAND-01 Task 2] _core/brand-schema.md — schema documentation');

const schemaText = readText('_core/brand-schema.md');
assert('brand-schema.md: file exists', schemaText !== null);

if (schemaText !== null) {
  // Field reference table — all four fields present
  assert('brand-schema.md: field table contains "hashtags" row', schemaText.includes('hashtags'));
  assert('brand-schema.md: field table contains "vocabulary" row', schemaText.includes('vocabulary'));
  assert('brand-schema.md: field table contains "avoid" row', schemaText.includes('avoid'));
  assert('brand-schema.md: field table contains "voice" row', schemaText.includes('voice'));

  // Table must have all required column headers
  assert('brand-schema.md: field table has "Type" column', schemaText.includes('Type'));
  assert('brand-schema.md: field table has "Description" column', schemaText.includes('Description'));
  assert('brand-schema.md: field table has "Example" column', schemaText.includes('Example'));

  // voice description explicitly states informational only AND not enforced
  const hasInformationalNote =
    schemaText.includes('informational') &&
    (schemaText.includes('NOT read') || schemaText.includes('not enforced') || schemaText.includes('not read'));
  assert(
    'brand-schema.md: voice field described as "informational only" and explicitly NOT enforced by content skills',
    hasInformationalNote
  );

  // Minimal Stub section
  const hasMinimalStub = schemaText.includes('Minimal Stub') || schemaText.includes('Minimal stub');
  assert('brand-schema.md: has "Minimal stub" section heading', hasMinimalStub);

  // Extract the fenced JSON block after "Minimal Stub"
  const minimalMatch = schemaText.match(/Minimal [Ss]tub[\s\S]*?```json([\s\S]*?)```/);
  if (minimalMatch) {
    const stubJson = minimalMatch[1].trim();
    assert('brand-schema.md: minimal stub JSON contains "hashtags" key', stubJson.includes('"hashtags"'));
    assert('brand-schema.md: minimal stub JSON contains "vocabulary" key', stubJson.includes('"vocabulary"'));
    assert('brand-schema.md: minimal stub JSON contains "avoid" key', stubJson.includes('"avoid"'));
    assert('brand-schema.md: minimal stub JSON contains "voice" key', stubJson.includes('"voice"'));
    assert('brand-schema.md: minimal stub shows empty arrays []', stubJson.includes('[]'));
    assert('brand-schema.md: minimal stub shows empty voice string ""', stubJson.includes('""'));
  } else {
    for (const lbl of ['minimal stub JSON contains "hashtags" key', 'minimal stub JSON contains "vocabulary" key',
      'minimal stub JSON contains "avoid" key', 'minimal stub JSON contains "voice" key',
      'minimal stub shows empty arrays []', 'minimal stub shows empty voice string ""']) {
      assert(`brand-schema.md: ${lbl}`, false, 'fenced JSON block not found after Minimal Stub heading');
    }
  }

  // Populated Example section
  const hasPopulatedExample = schemaText.includes('Populated Example') || schemaText.includes('Populated example');
  assert('brand-schema.md: has "Populated example" section heading', hasPopulatedExample);

  const populatedMatch = schemaText.match(/Populated [Ee]xample[\s\S]*?```json([\s\S]*?)```/);
  if (populatedMatch) {
    const exampleJson = populatedMatch[1].trim();
    // At least one of hashtags or vocabulary must be non-empty in the populated example
    const hashtagsNonEmpty = !exampleJson.match(/"hashtags":\s*\[\]/);
    const vocabularyNonEmpty = !exampleJson.match(/"vocabulary":\s*\[\]/);
    assert(
      'brand-schema.md: populated example has non-empty illustrative values (at least hashtags or vocabulary)',
      hashtagsNonEmpty || vocabularyNonEmpty
    );
  } else {
    assert(
      'brand-schema.md: populated example JSON block is present',
      false,
      'fenced JSON block not found after Populated Example heading'
    );
    assert('brand-schema.md: populated example has non-empty illustrative values', false, 'block not found');
  }

  // Notes: brand block is optional and empty arrays treated identically to absent
  const hasOptionalNote = schemaText.includes('optional') && schemaText.includes('empty arrays');
  assert(
    'brand-schema.md: notes state brand block is optional and empty arrays are treated identically to absent',
    hasOptionalNote
  );
}

// ═══════════════════════════════════════════════════════════════════
// BRAND-02 Task 1: .claude/skills/wm-wire.md — Brand block section
// Requirement: "### Brand block" heading, three-way prompt, Claude.ai
//              instruction, recency check, stage non-gate statement
// ═══════════════════════════════════════════════════════════════════
console.log('\n[BRAND-02 Task 1] .claude/skills/wm-wire.md — Brand block section');

const wireText = readText('.claude/skills/wm-wire.md');
assert('wm-wire.md: file exists', wireText !== null);

if (wireText !== null) {
  // Required heading
  assert(
    'wm-wire.md: contains "### Brand block" heading',
    wireText.includes('### Brand block')
  );

  // Three-way prompt
  assert(
    'wm-wire.md: contains three-way prompt text "Configure now, skip for later"',
    wireText.includes('Configure now, skip for later')
  );

  // Claude.ai instruction (exact phrase from acceptance criteria)
  assert(
    'wm-wire.md: contains "Take this to Claude.ai" instruction line',
    wireText.includes('Take this to Claude.ai')
  );

  // Recency check — "Has anything in your brand voice or hashtags changed"
  assert(
    'wm-wire.md: contains recency check ("Has anything in your brand" or "anything changed")',
    wireText.includes('Has anything in your brand') ||
    wireText.includes('has anything changed') ||
    wireText.includes('anything changed')
  );

  // Stage non-gate statement
  const hasNonGate =
    wireText.includes('does NOT gate stage') ||
    wireText.includes('NOT gate stage') ||
    wireText.includes('does not gate stage') ||
    wireText.includes('never a gate') ||
    wireText.includes('never a prerequisite') ||
    wireText.includes('not required for stage');
  assert(
    'wm-wire.md: explicitly states brand block does NOT gate stage advancement',
    hasNonGate
  );

  // Ordering: Brand block must appear AFTER Domain within step 3
  const domainIdx = wireText.indexOf('### Domain');
  const brandIdx = wireText.indexOf('### Brand block');
  assert(
    'wm-wire.md: "### Brand block" appears after "### Domain" in step 3',
    domainIdx !== -1 && brandIdx !== -1 && brandIdx > domainIdx,
    domainIdx === -1 ? '"### Domain" not found' : brandIdx === -1 ? '"### Brand block" not found' : `Domain at ${domainIdx}, Brand at ${brandIdx}`
  );

  // Notes entry: brand block is optional enrichment
  assert(
    'wm-wire.md: Notes section states brand block is optional enrichment',
    wireText.includes('Brand block is optional enrichment') ||
    wireText.includes('brand block is optional enrichment')
  );
}

// ═══════════════════════════════════════════════════════════════════
// BRAND-03 Task 1-2: Full treatment skills — news, announcement, blog
// Requirement: "Brand signal check" step; hashtag + avoid + vocabulary;
//              step numbers correct; social post priority rule in news
// ═══════════════════════════════════════════════════════════════════

function testFullTreatmentSkill(relPath, skillName, expectedBrandCheckStep) {
  console.log(`\n[BRAND-03] ${skillName} — full brand treatment`);
  const text = readText(relPath);
  assert(`${skillName}: file exists`, text !== null);
  if (!text) return;

  // "Brand signal check" step present
  assert(
    `${skillName}: contains "Brand signal check" step`,
    text.includes('Brand signal check')
  );

  // Step number correct
  assert(
    `${skillName}: brand check is numbered as step ${expectedBrandCheckStep} (**Brand signal check**)`,
    text.includes(`${expectedBrandCheckStep}. **Brand signal check**`)
  );

  // Silent pass-through condition
  assert(
    `${skillName}: silent pass-through stated (skip entirely when brand absent or all arrays empty)`,
    text.includes('skip entirely')
  );

  // Sub-step A: hashtag suggestions
  assert(
    `${skillName}: Sub-step A — hashtag suggestion prompt present ("brand kit includes" or "brand hashtag kit")`,
    text.includes('brand kit includes') || text.includes('brand hashtag kit')
  );

  // Sub-step A: bi-directional enrichment with explicit default N
  assert(
    `${skillName}: Sub-step A — bi-directional enrichment prompt has explicit default N "(y/N)"`,
    text.includes('(y/N)')
  );

  // Sub-step B: avoid scan with warning prefix
  assert(
    `${skillName}: Sub-step B — avoid scan present ("avoid list")`,
    text.includes('avoid list')
  );
  assert(
    `${skillName}: Sub-step B — avoid scan uses "⚠" warning prefix`,
    text.includes('⚠')
  );

  // Sub-step C: vocabulary nudge with "Suggestion:" prefix
  assert(
    `${skillName}: Sub-step C — vocabulary nudge with "Suggestion:" prefix`,
    text.includes('Suggestion:')
  );

  // Voice field explicitly excluded in Phase 3
  assert(
    `${skillName}: voice field explicitly NOT read in Phase 3`,
    text.includes('informational only in Phase 3')
  );

  // Commit step conditionally includes wiring.json when hashtags updated
  assert(
    `${skillName}: commit step conditionally includes wiring.json when brand.hashtags updated`,
    text.includes('If brand.hashtags was updated')
  );
}

testFullTreatmentSkill('_core/.claude/skills/wm-add-news.md', 'wm-add-news.md', 5);

// Additional news-specific: social post priority rule
console.log('\n[BRAND-03 Task 1] wm-add-news.md — social post priority rule');
const newsText = readText('_core/.claude/skills/wm-add-news.md');
if (newsText) {
  assert(
    'wm-add-news.md: social post step has explicit hashtag source priority rule naming brand.hashtags first',
    newsText.includes('Hashtag source priority') && newsText.includes('brand.hashtags')
  );
  assert(
    'wm-add-news.md: social post step names keywords.json as fallback only',
    newsText.includes('fallback') && newsText.includes('keywords.json')
  );
  assert(
    'wm-add-news.md: social post step says do not combine both sources',
    newsText.includes('Do not combine') ||
    newsText.includes('do not combine') ||
    newsText.includes('never combined') ||
    newsText.includes('Never combine')
  );

  // Step numbering: social post = 6, commit = 7, report = 8
  assert('wm-add-news.md: social post is step 6', newsText.includes('6. **Draft a social post**'));
  assert('wm-add-news.md: commit is step 7', newsText.includes('7. **Commit and push**'));
  assert('wm-add-news.md: report is step 8', newsText.includes('8. **Report**'));
}

testFullTreatmentSkill('_core/.claude/skills/wm-add-announcement.md', 'wm-add-announcement.md', 4);
const announcementText = readText('_core/.claude/skills/wm-add-announcement.md');
if (announcementText) {
  assert('wm-add-announcement.md: commit is step 5', announcementText.includes('5. **Commit and push**'));
  assert('wm-add-announcement.md: report is step 6', announcementText.includes('6. **Report**'));
}

testFullTreatmentSkill('_core/.claude/skills/wm-add-blog.md', 'wm-add-blog.md', 5);
const blogText = readText('_core/.claude/skills/wm-add-blog.md');
if (blogText) {
  assert('wm-add-blog.md: commit is step 6', blogText.includes('6. **Commit and push**'));
  assert('wm-add-blog.md: report is step 7', blogText.includes('7. **Report**'));
}

// ═══════════════════════════════════════════════════════════════════
// BRAND-03 Task 3: wm-add-job.md — narrower brand check
// Requirement: avoid + vocabulary only; hashtag enrichment explicitly
//              excluded; wiring.json never written by this skill
// ═══════════════════════════════════════════════════════════════════
console.log('\n[BRAND-03 Task 3] wm-add-job.md — narrower brand check (avoid + vocabulary only)');

const jobText = readText('_core/.claude/skills/wm-add-job.md');
assert('wm-add-job.md: file exists', jobText !== null);

if (jobText) {
  assert(
    'wm-add-job.md: contains "Brand signal check" step',
    jobText.includes('Brand signal check')
  );

  // Step number: brand check = 4
  assert(
    'wm-add-job.md: brand check is numbered as step 4 (**Brand signal check**)',
    jobText.includes('4. **Brand signal check**')
  );

  // Silent pass-through
  assert(
    'wm-add-job.md: silent pass-through stated (skip entirely when brand absent or all arrays empty)',
    jobText.includes('skip entirely')
  );

  // Sub-step A: avoid scan present
  assert(
    'wm-add-job.md: Sub-step A — avoid scan present ("avoid list")',
    jobText.includes('avoid list')
  );
  assert(
    'wm-add-job.md: Sub-step A — avoid scan uses "⚠" warning prefix',
    jobText.includes('⚠')
  );

  // Sub-step B: vocabulary nudge present
  assert(
    'wm-add-job.md: Sub-step B — vocabulary nudge with "Suggestion:" prefix',
    jobText.includes('Suggestion:')
  );

  // Hashtag enrichment EXPLICITLY excluded
  assert(
    'wm-add-job.md: explicitly states hashtag enrichment does NOT apply to job listings',
    jobText.includes('Not applicable') ||
    jobText.includes('not applicable') ||
    (jobText.includes('Hashtag enrichment') &&
      (jobText.includes('not consulted') || jobText.includes('does not apply')))
  );

  // Must NOT offer to add hashtags to brand kit
  assert(
    'wm-add-job.md: does NOT offer to add hashtags to brand hashtag kit',
    !jobText.includes('brand hashtag kit')
  );

  // Commit step does NOT contain conditional wiring.json inclusion
  assert(
    'wm-add-job.md: commit step does NOT have conditional wiring.json include (no enrichment path)',
    !jobText.includes('If brand.hashtags was updated')
  );

  // Voice field explicitly excluded in Phase 3
  assert(
    'wm-add-job.md: voice field explicitly NOT read in Phase 3',
    jobText.includes('informational only in Phase 3')
  );

  // Step numbering: commit = 5, report = 6
  assert('wm-add-job.md: commit is step 5', jobText.includes('5. **Commit and push**'));
  assert('wm-add-job.md: report is step 6', jobText.includes('6. **Report**'));
}

// ═══════════════════════════════════════════════════════════════════
// Final result
// ═══════════════════════════════════════════════════════════════════
console.log('\n' + '─'.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('\nBLOCKER: One or more brand consistency requirements are not met.');
  process.exit(1);
} else {
  console.log('\nAll brand consistency requirements verified.');
  process.exit(0);
}

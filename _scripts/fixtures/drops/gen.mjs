// Fixture generator for the Phase 11 harness. Usage: node gen.mjs <variant> <outDir>
// variant: good | bad-expiryless | bad-horizon
// All dates are computed at run time relative to now; nothing here is ever committed
// with an id. Prints role names and 4-char prefixes only.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { newId, shortId, formatDrop, isoWithOffset, addTombstone } from '../../lib/drops-core.mjs';

const [variant, outDir] = process.argv.slice(2);
if (!['good', 'bad-expiryless', 'bad-horizon'].includes(variant) || !outDir) {
  console.error('Usage: node gen.mjs <good|bad-expiryless|bad-horizon> <outDir>');
  process.exit(2);
}
const DAY = 86400000;
const now = Date.now();
const slugDir = path.join(path.resolve(outDir), 'sfdy');
fs.mkdirSync(slugDir, { recursive: true });
const ids = {};

function iso(deltaDays) {
  return isoWithOffset(new Date(now + deltaDays * DAY));
}
function write(role, fm, body, extra) {
  const id = newId();
  ids[role] = id;
  const dir = path.join(slugDir, id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'drop.md'), formatDrop({ id, ...fm }, body));
  if (extra) extra(dir);
  console.log(`  ${role.padEnd(14)} ${shortId(id)}`);
  return id;
}

const created = iso(-1);
if (variant === 'good') {
  const pdf = path.join(path.resolve(outDir), '..', 'fixture.pdf');
  const hasPdf = fs.existsSync(pdf);
  write('active', {
    title: 'Fixture active', label: 'fixture-active', created, expires: iso(30),
    ...(hasPdf ? { attachments: ['fixture.pdf'] } : {}),
  }, 'FIXTURE-BODY-ACTIVE\n', hasPdf ? (d) => fs.copyFileSync(pdf, path.join(d, 'fixture.pdf')) : undefined);
  write('soon', { title: 'Fixture soon', label: 'fixture-soon', created, expires: iso(3) }, 'FIXTURE-BODY-SOON\n');
  write('expired', { title: 'Fixture expired', label: 'fixture-expired', created: iso(-10), expires: iso(-1) }, 'FIXTURE-BODY-EXPIRED\n');
  write('withdrawnFlag', { title: 'Fixture flag', label: 'fixture-flag', created, expires: iso(30), withdrawn: true }, 'FIXTURE-BODY-WITHDRAWN-FLAG\n');
  const t = write('withdrawnTomb', { title: 'Fixture tomb', label: 'fixture-tomb', created, expires: iso(30) }, 'FIXTURE-BODY-WITHDRAWN-TOMB\n');
  fs.writeFileSync(path.join(slugDir, 'withdrawn.json'), addTombstone(null, t, 'withdrawn', iso(0)));
} else if (variant === 'bad-expiryless') {
  write('expiryless', { title: 'Fixture no expiry', label: 'fixture-bad', created }, 'FIXTURE-BODY-BAD\n');
} else {
  write('horizon', { title: 'Fixture horizon', label: 'fixture-bad', created, expires: iso(120) }, 'FIXTURE-BODY-BAD\n');
}
fs.writeFileSync(path.join(path.resolve(outDir), 'ids.json'), JSON.stringify(ids, null, 2) + '\n');

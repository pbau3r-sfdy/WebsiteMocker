// Generates a one-page PDF carrying every metadata channel DROP-05 must strip.
// Usage: node make-pdf.mjs <out.pdf>. Pure Node plus one qpdf pass for a clean xref.
// Markers: FIXTURE-AUTHOR, FIXTURE-CREATOR, FIXTURE-KEYWORDS, FIXTURE-XMP,
// FIXTURE-ATTACH, FIXTURE-PIECEINFO; visible text FIXTURE-VISIBLE-TEXT.
// Generated at harness time, never committed.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const out = process.argv[2];
if (!out) { console.error('Usage: node make-pdf.mjs <out.pdf>'); process.exit(2); }

const xmp = '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator>FIXTURE-XMP</dc:creator></rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>';
const attach = 'FIXTURE-ATTACH payload';
const content = 'BT /F1 24 Tf 72 700 Td (FIXTURE-VISIBLE-TEXT) Tj ET';
const objs = [
  '<< /Type /Catalog /Pages 2 0 R /Metadata 6 0 R /Outlines 10 0 R /Names << /EmbeddedFiles << /Names [(note.txt) 8 0 R] >> >> /AF [8 0 R] >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> /PieceInfo 11 0 R >>',
  `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  `<< /Type /Metadata /Subtype /XML /Length ${xmp.length} >>\nstream\n${xmp}\nendstream`,
  '<< /Author (FIXTURE-AUTHOR) /Creator (FIXTURE-CREATOR) /Producer (FIXTURE-PRODUCER) /Title (Fixture) /Keywords (FIXTURE-KEYWORDS) >>',
  '<< /Type /Filespec /F (note.txt) /UF (note.txt) /EF << /F 9 0 R >> >>',
  `<< /Type /EmbeddedFile /Length ${attach.length} >>\nstream\n${attach}\nendstream`,
  '<< /Type /Outlines /Count 0 >>',
  '<< /FixtureApp << /Private (FIXTURE-PIECEINFO) /LastModified (D:20200101000000Z) >> >>',
];
let pdf = '%PDF-1.7\n';
const offs = [];
objs.forEach((o, i) => { offs.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
const xref = pdf.length;
pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
for (const o of offs) pdf += String(o).padStart(10, '0') + ' 00000 n \n';
pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info 7 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mkpdf-'));
try {
  const raw = path.join(tmp, 'raw.pdf');
  fs.writeFileSync(raw, pdf, 'latin1');
  const r = spawnSync('qpdf', ['--object-streams=disable', '--compress-streams=n', raw, path.resolve(out)], { encoding: 'utf8' });
  if (r.error || (r.status !== 0 && r.status !== 3)) { console.error('make-pdf: qpdf failed'); process.exit(1); }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

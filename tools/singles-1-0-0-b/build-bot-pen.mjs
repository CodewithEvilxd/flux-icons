/**
 * bot-off and pen-sparkles, 17 Sep 2026: "create bot-slash and pencil-sparkles -
 * sparkles will not fit there, so you replace it with plus like [the other
 * set's pencil-sparkles]. do not copy, do not use it as-is". Named to the house
 * families: a slashed icon is `-off` (pen-off, cctv-off), and the set's pencil
 * is `pen`.
 *   node tools/singles-1-0-0-b/build-bot-pen.mjs [--out=DIR] [name...]
 *
 * bot-off      bot as drawn under the standard slash. The slash runs through
 *              the face, so the face keeps what clears it: the left eye, the
 *              mouth cut back, the right eye gone. The body's near piece stops
 *              on the centre line; the far piece runs from the right ear's root
 *              round the top-right corner to the antenna's root, keeping both,
 *              because cut back to 4 the antenna stood apart from a stub of
 *              body. That root sits 2 root 2 off the centre line, so every
 *              detail near the slash keeps the same 0.83 of daylight: the eye
 *              (a dot on 13, sharp a dash from 13 less that), the mouth's end,
 *              and the far solids, clipped on that line. Two-tone: both solids
 *              grey, near strokes black; duotone: all grey but the slash, the
 *              face cut out of the near solid; fill: both solids, face out.
 * pen-sparkles pen with the sparkles drawn as plus signs in the two corners the
 *              pencil leaves empty: the house 6-unit plus flush in the top-left
 *              ink corner and a 4-unit one on (19,19), nearer the barrel, so the
 *              pair reads large and small as sparkles do. Every style is pen's
 *              own, with the signs black on top.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Path, circlePath } from '../v5/geom.mjs';
import { offsetContour, contourPath, clipContour } from '../v5/offset.mjs';
import { outlineRun, subtractContours } from '../v6/outline.mjs';
import { strokedBBox } from '../../pipeline/lib/geom.mjs';
import { run, closed, S, PL, SO, DOT, doc, windByDepth, slashPieces, pieceD } from './build.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const SETS = {};
const set = (name, box, build) => { build.box = box; SETS[name] = build; };

/* --------------------------------------------------------------- bot-off */

const N = [-Math.SQRT1_2, Math.SQRT1_2];               // toward the near side
const CLIP = -(2 * Math.SQRT2 - 1);                    // the antenna root's ink line
const segEnd = (q) => (q.type === 'L' ? q.p1 : [q.c[0] + q.r * Math.cos((q.a1 * Math.PI) / 180), q.c[1] + q.r * Math.sin((q.a1 * Math.PI) / 180)]);
const segStart = (q) => (q.type === 'L' ? q.p0 : [q.c[0] + q.r * Math.cos((q.a0 * Math.PI) / 180), q.c[1] + q.r * Math.sin((q.a0 * Math.PI) / 180)]);
const shut = (segs) => [...segs, { type: 'L', p0: segEnd(segs[segs.length - 1]), p1: segStart(segs[0]) }];
const rectSegs = (x0, y0, x1, y1) => closed([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], [0, 0, 0, 0], true).segs;
const discSegs = (c, r) => [{ type: 'A', c, r, a0: 0, a1: 360 }];
const loops = (list) => list.map((l) => contourPath(l)).join('');

set('bot-off', [1, 1, 23, 23], (sharp) => {
  const cap = sharp ? 'butt' : 'round';
  const slash = sharp ? 'M1.7071 1.7071L22.2929 22.2929' : 'M2 2L22 22';
  const body = closed([[4, 8], [20, 8], [20, 21], [4, 21]], [3, 3, 3, 3], sharp);
  const near = slashPieces(body.segs, N, (v) => v >= 0, true);
  if (near.length !== 1) throw new Error(`bot-off: ${near.length} near pieces`);
  const nearBody = pieceD(near[0].segs);
  // the far piece, ear root to antenna root; sharp carries the ear out a unit
  const far = run([[sharp ? 23 : 22, 14.5], [20, 14.5], [20, 8], [12, 8], [12, 3.5]], [0, 0, 3, 0, 0], { sharp });
  const leftEar = sharp ? 'M1 14.5L4 14.5' : 'M2 14.5L4 14.5';
  const antenna = run([[12, 8], [12, 3.5]]);
  const rightEar = run([[20, 14.5], [sharp ? 23 : 22, 14.5]]);
  const dot = circlePath([12, 3.5], 1.5);
  // the face: 2 root 2 off the centre line at its nearest
  const eyeTop = 10 + (2 * Math.SQRT2 - 1) * Math.SQRT2;  // sharp: the butt corner (10, y) 1.83 off
  const eye = sharp ? `M9 ${+eyeTop.toFixed(4)}L9 14` : '';
  const eyeDot = sharp ? '' : circlePath([9, 13], 1);
  const mouthEnd = sharp ? 16 - (2 * Math.SQRT2 - 1) * Math.SQRT2 : 13;
  const mouth = run([[sharp ? 8 : 9, 17], [mouthEnd, 17]]);
  const eyeHole = sharp ? rectSegs(8, eyeTop, 10, 14) : discSegs([9, 13], 1);
  const mouthHole = sharp ? rectSegs(9, 16, 13, 18) : outlineRun(run([[9, 17], [13, 17]]).segs, 1, 'round');

  // the solids: the plate clipped on the centre line (near, under the slash's
  // ink) and on the root's ink line (far); regular rounds the far clip's two
  // corners by opening the solid a unit
  const off = offsetContour(body.segs.map((q) => ({ ...q })), 1);
  const nearPl = shut(clipContour(off, [12, 12], N, 0, 1)[0]);
  let farPl = shut(clipContour(off, [12, 12], N, CLIP, -1)[0]);
  if (!sharp) farPl = offsetContour(offsetContour(farPl.map((q) => ({ ...q })), -1), 1);

  // far greys: the antenna, its dot and the right ear, less the far solid and
  // each other, so no two greys stack
  // the antenna as its shaft down to the plate's top edge, and in regular on
  // round the solid's rounded corner to the root's ink: its round foot sat
  // exactly on that corner and a subtraction left a hairline along it
  const antInk = rectSegs(11, 3.5, 13, 7);
  const antGrey = sharp ? contourPath(antInk) : new Path().M([11, 3.5]).L([13, 3.5]).L([13, 7]).L([12, 7]).A([12, 8], 270, 180, -1).Z().d;
  const earInk = outlineRun(rightEar.segs.map((q) => ({ ...q })), 1, cap);
  const farGrey = antGrey + loops([
    ...subtractContours(discSegs([12, 3.5], 1.5), [antInk]),
    ...subtractContours(earInk, [farPl]),
  ]);
  const leftEarInk = outlineRun(run([[sharp ? 1 : 2, 14.5], [4, 14.5]]).segs, 1, cap);
  const nearGrey = loops(subtractContours(leftEarInk, [nearPl]));
  const nearFace = contourPath(nearPl) + contourPath(eyeHole) + contourPath(mouthHole);
  return {
    stroke: [S(nearBody + far.d + leftEar + eye + mouth.d + slash), DOT(dot + eyeDot)],
    'two-tone': [PL(contourPath(nearPl) + contourPath(farPl) + farGrey), S(nearBody + leftEar + eye + mouth.d + slash), DOT(eyeDot)],
    duotone: [PL(windByDepth(nearFace) + nearGrey + contourPath(farPl) + farGrey), S(slash)],
    fill: [SO(nearFace + contourPath(farPl)), S(leftEar + antenna.d + rightEar.d + slash), DOT(dot)],
  };
});

/* ---------------------------------------------------------- pen-sparkles */

const plus = (cx, cy, a, sharp) => {
  const e = a + (sharp ? 1 : 0);
  return `M${cx} ${cy - e}L${cx} ${cy + e}M${cx - e} ${cy}L${cx + e} ${cy}`;
};
set('pen-sparkles', [1, 1, 23, 23], (sharp) => {
  const signs = plus(5, 5, 3, sharp) + plus(19, 19, 2, sharp);
  const layers = {};
  for (const style of ['stroke', 'two-tone', 'duotone', 'fill']) layers[style] = { raw: 'pen', signs };
  return layers;
});

/* -------------------------------------------------------------- the write */

function inkOf(svg, sharp) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const m of svg.matchAll(/<path\b([^>]*?)\/>/g)) {
    const d = m[1].match(/\sd="([^"]+)"/)[1];
    const q = /stroke="black"/.test(m[1]) ? strokedBBox(d, 1, sharp ? 'butt' : 'round') : strokedBBox(d, 0, 'butt');
    b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[2]); b[3] = Math.max(b[3], q[3]);
  }
  return b;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const outArg = args.find((a) => a.startsWith('--out='));
  const OUT = outArg ? resolve(outArg.slice(6)) : ROOT;
  const want = args.filter((a) => !a.startsWith('--'));
  for (const [name, build] of Object.entries(SETS)) {
    if (want.length && !want.includes(name)) continue;
    const dir = join(OUT, 'raw', name);
    mkdirSync(dir, { recursive: true });
    const notes = [];
    for (const corners of ['regular', 'sharp']) {
      const sharp = corners === 'sharp';
      const styles = build(sharp);
      for (const style of ['stroke', 'two-tone', 'duotone', 'fill']) {
        const file = `Container=regular, Style=${style}, Corners=${corners}.svg`;
        const l = styles[style];
        // a compound on its house sibling: the base's own file, the signs on top
        const svg = l.raw
          ? readFileSync(join(ROOT, 'raw', l.raw, file), 'utf8').replace('</svg>', `<path d="${l.signs}" stroke="black" stroke-width="2" stroke-linecap="${sharp ? 'butt' : 'round'}" stroke-linejoin="round"/>\n</svg>`)
          : doc(l, sharp);
        const b = inkOf(svg, sharp);
        const offBy = Math.max(...b.map((v, i) => Math.abs(v - build.box[i])));
        if (offBy > 0.003) notes.push(`${style} ${corners} ink ${b.map((v) => v.toFixed(3)).join(',')}`);
        writeFileSync(join(dir, file), svg);
      }
    }
    console.log(name.padEnd(20), 'box', build.box.join(','), notes.length ? '\n  ' + notes.join('\n  ') : 'ok');
  }
}

export { SETS };

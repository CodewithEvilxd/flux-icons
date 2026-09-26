// 1.0.0 batch, 14 Sep 2026: phone-call/-incoming/-outgoing/-missed/-forwarded, arrow-big-*, heading and heading-1..6.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import * as G from './geo.mjs';
const REPO = resolve(import.meta.dirname, '../..');
const { sharpEndIn } = await import(REPO + '/tools/v5/icons.mjs');
const { strokedBBox } = await import(REPO + '/pipeline/lib/geom.mjs');
const OUT = process.env.OUT || join(import.meta.dirname, 'out');
const git = (p) => execFileSync('git', ['-C', REPO, 'show', `origin/main:raw/${p}`], { encoding: 'utf8' });
const layersOf = (name, style, corners) => [...git(`${name}/Container=regular, Style=${style}, Corners=${corners}.svg`).matchAll(/<path d="([^"]+)"([^>]*)\/>/g)].map((m) => ({ d: m[1], attrs: m[2] }));
const HEAD = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">';
const doc = (ps) => [HEAD, ...ps.map((p) => `<path d="${p.d}"${p.attrs}/>`), '</svg>', ''].join('\n');
const STROKE = (sharp) => ` stroke="black" stroke-width="2" stroke-linecap="${sharp ? 'butt' : 'round'}" stroke-linejoin="round"`;
const PLATE = ' fill="black" fill-opacity="0.4"', SOLID = ' fill="black"';
const f4 = (v) => { const r = Math.round(v * 1e4) / 1e4; return String(Object.is(r, -0) ? 0 : r); };
const pt = (p) => `${f4(p[0])} ${f4(p[1])}`;
const write = (name, variants) => {
  const dir = join(OUT, 'raw', name); mkdirSync(dir, { recursive: true });
  for (const [k, ps] of Object.entries(variants)) {
    const [style, corners] = k.split('.');
    writeFileSync(join(dir, `Container=regular, Style=${style}, Corners=${corners}.svg`), doc(ps));
    const strokes = ps.filter((p) => p.attrs.includes('stroke=')).map((p) => p.d).join('');
    const solids = ps.filter((p) => !p.attrs.includes('stroke=')).map((p) => p.d).join('');
    const b = strokes ? strokedBBox(strokes, 1, corners === 'sharp' ? 'butt' : 'round') : [99, 99, -99, -99];
    if (solids) { const q = strokedBBox(solids, 0, 'butt'); b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[2]); b[3] = Math.max(b[3], q[3]); }
    console.log(name.padEnd(22), k.padEnd(16), b.map((v) => f4(v)).join(','));
  }
};
/** A free end pushed out along its tangent so the butt cap paints where the round one did. */
function sharpRun(d, ends = [true, true]) {
  const subs = G.parse(d);
  // an end that lands on another run is a joint, not a free end, and stays put
  const onOther = (p, self) => subs.some((o) => o !== self && G.distToRun(p, G.refine(o.segs, 0.5)) < 0.01);
  return subs.map((sub) => {
    const { segs, closed } = sub;
    if (closed) return G.emit(segs, true);
    let r = segs;
    ends = [!onOther(G.p0(segs[0]), sub), !onOther(G.p1(segs.at(-1)), sub)];
    if (ends[1]) { const s = r.at(-1), p = G.p1(s), t = G.tan(s, 1), e = sharpEndIn(p, t); if (e > 1e-6) { if (s.t === 'L') r = [...r.slice(0, -1), { t: 'L', p: [s.p[0], G.add(p, G.mul(t, e))] }]; else r = [...r, { t: 'L', p: [p, G.add(p, G.mul(t, e))] }]; } }
    if (ends[0]) { const s = r[0], p = G.p0(s), t = G.mul(G.tan(s, 0), -1), e = sharpEndIn(p, t); if (e > 1e-6) { if (s.t === 'L') r = [{ t: 'L', p: [G.add(p, G.mul(t, e)), s.p[1]] }, ...r.slice(1)]; else r = [{ t: 'L', p: [G.add(p, G.mul(t, e)), p] }, ...r]; } }
    return G.emit(r);
  }).join('');
}

/* ------------------------------------------------------------------ phone-* */
// The handset is the shipped phone, untouched. Every sign sits in the house 6-unit box flush in the empty top-right
// corner (16..22 by 2..8), the smartphone-* signs translated; the call waves are the one mark drawn fresh.
const PHONE = Object.fromEntries(['regular', 'sharp'].flatMap((c) => ['stroke', 'duotone', 'fill'].map((s) => [`${s}.${c}`, layersOf('phone', s, c)])));
const SIGNS = {
  // sharp forms are given explicitly where the shipped family has them, translated by (+3, -14)
  incoming: { regular: 'M16.5 7.5L21 3M16 2V7.5C16 7.7761 16.2239 8 16.5 8H22', sharp: 'M16.1464 7.8536L21.2929 2.7071M16 1L16 8L23 8' },
  outgoing: { regular: 'M21.5 2.5L17 7M22 8V2.5C22 2.2239 21.7761 2 21.5 2H16', sharp: 'M21.8536 2.1464L16.7071 7.2929M22 9L22 2L15 2' },
  forwarded: { regular: 'M16 5H22M19 2L22 5L19 8', sharp: 'M15 5L22 5M18.7071 1.7071L22 5L18.7071 8.2929' },
  missed: { regular: 'M22 2L16 8M16 2L22 8', sharp: 'M22.2929 1.7071L15.7071 8.2929M15.7071 1.7071L22.2929 8.2929' },
};
// call: two waves about (12,12), r=4 and r=8, from -75 to -15 degrees; the gap between them is the house 2
function arcD(c, r, a0, a1) {
  const segs = G.arc(c, r, (a0 * Math.PI) / 180, ((a1 - a0) * Math.PI) / 180);
  return G.emit(segs);
}
const waves = [arcD([12, 12], 8, -75, -15), arcD([12, 12], 4, -75, -15)].join('');
SIGNS.call = { regular: waves, sharp: sharpRun(waves) };
for (const [kind, sign] of Object.entries(SIGNS)) {
  const v = {};
  for (const c of ['regular', 'sharp']) {
    const sharp = c === 'sharp';
    const body = PHONE[`stroke.${c}`][0];
    v[`stroke.${c}`] = [{ d: body.d + sign[c], attrs: STROKE(sharp) }];
    v[`duotone.${c}`] = [PHONE[`duotone.${c}`][0], { d: body.d + sign[c], attrs: STROKE(sharp) }];
    v[`fill.${c}`] = [PHONE[`fill.${c}`][0], { d: sign[c], attrs: STROKE(sharp) }];
  }
  write(`phone-${kind}`, v);
}

/* ---------------------------------------------------------------- arrow-big-* */
// Rebuilt on his note, 14 Sep 2026, after the reference set's construction: a square head (edges at 45 degrees, the
// apex a right angle), a shaft a third of the head's width, and one radius, r=1, on every corner. Solved so the
// painted box is whole: 3..21 across, 1..23 along. With r=1 at both the 45 degree wings and the right-angled apex the
// two paddings differ by exactly 1, which is what fixes them at 3 and 2 before the shaft is counted.
// 17 Sep 2026, on his "fix all" to a size check: they painted 2..22 along, 18 x 20, where a tall drawing is 22 long.
// The head rises a unit and the foot drops one, so only the shaft grows and the head keeps its shape.
const R1 = 1, SQ2 = Math.SQRT2, COT225 = 1 + SQ2;
const WING_X = 3 - SQ2 * R1 + 1;         // painted left = vx + (cot 22.5 - 1) r - 1 = 3
const BASE = 11, HALF = 12 - WING_X;      // the head is square, so its depth is half its width
const APEX_Y = BASE - HALF;               // painted top = vy + (sqrt2 - 1) r - 1 = 1
// shaft 8..16: at 9..15 the outline sat 56% on the reference set's; at 8 wide it is 36%, and still reads
const SHAFT = [8, 16], FOOT = 22;
function fillet(pts) { // closed polygon of {v, r}; each corner rounded by its own r, tangent points solved per corner
  const n = pts.length;
  const tp = pts.map((q, i) => {
    const prev = pts[(i + n - 1) % n].v, next = pts[(i + 1) % n].v;
    const u1 = G.unit(G.sub(prev, q.v)), u2 = G.unit(G.sub(next, q.v));
    const ang = Math.acos(Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1])));
    const t = q.r / Math.tan(ang / 2);
    const bis = G.unit(G.add(u1, u2));
    return { a: G.add(q.v, G.mul(u1, t)), b: G.add(q.v, G.mul(u2, t)), c: G.add(q.v, G.mul(bis, q.r / Math.sin(ang / 2))), r: q.r };
  });
  let d = `M${pt(tp[0].b)}`;
  for (let i = 1; i <= n; i++) {
    const q = tp[i % n];
    d += `L${pt(q.a)}`;
    const a0 = Math.atan2(q.a[1] - q.c[1], q.a[0] - q.c[0]), a1 = Math.atan2(q.b[1] - q.c[1], q.b[0] - q.c[0]);
    let sw = a1 - a0; while (sw > Math.PI) sw -= 2 * Math.PI; while (sw < -Math.PI) sw += 2 * Math.PI;
    const arcs = G.arc(q.c, q.r, a0, sw); arcs[0].p[0] = q.a; arcs.at(-1).p[3] = q.b;
    d += arcs.map((s) => `C${pt(s.p[1])} ${pt(s.p[2])} ${pt(s.p[3])}`).join('');
  }
  return d + 'Z';
}
function arrowUp(sharp, { wingX = WING_X, base = BASE, shaft = SHAFT, foot = FOOT } = {}) {
  const apexY = base - (12 - wingX);
  if (!sharp) {
    return fillet([
      { v: [12, apexY], r: R1 }, { v: [24 - wingX, base], r: R1 }, { v: [shaft[1], base], r: R1 }, { v: [shaft[1], foot], r: R1 },
      { v: [shaft[0], foot], r: R1 }, { v: [shaft[0], base], r: R1 }, { v: [wingX, base], r: R1 },
    ]);
  }
  // sharp: true points at 45 degrees, placed so each round join paints on the rounded drawing's box (apex 2, wings 4),
  // which lifts the head's base to 10
  const apex = [12, apexY + SQ2 - 1], wingL = [wingX + SQ2 * R1, base - 1];
  return `M${pt(apex)}L${pt([24 - wingL[0], wingL[1]])}L${shaft[1]} ${wingL[1]}L${shaft[1]} ${foot}L${shaft[0]} ${foot}L${shaft[0]} ${wingL[1]}L${pt(wingL)}Z`;
}
// arrow-big-*-short, 17 Sep 2026, on his reference (refs/, a short block arrow): the same square head and r=1, with the
// shaft in the reference's proportions, measured off its centre lines: shaft 0.61 of the head's depth and a little
// under half its width. At our stroke that paints 22 x 20: head 1..23 across (wing vertex 0.586), apex painted on 2,
// base 14, shaft 7..17 run 7 long to a foot on 21. On the big arrow's 18-wide head the same shaft reads as a stub at 16px.
const SHORT = { wingX: 1 - SQ2 * R1 + 1, base: 14, shaft: [7, 17], foot: 21 };
const rot = (d, turns) => d.replace(/(-?\d*\.?\d+) (-?\d*\.?\d+)/g, (m, x, y) => {
  let p = [+x, +y];
  for (let i = 0; i < turns; i++) p = [24 - p[1], p[0]]; // 90 degrees clockwise about (12,12)
  return pt(p);
});
for (const [dir, turns] of [['up', 0], ['right', 1], ['down', 2], ['left', 3]]) for (const [suffix, spec] of [['', undefined], ['-short', SHORT]]) {
  const v = {};
  for (const c of ['regular', 'sharp']) {
    const sharp = c === 'sharp';
    const d = rot(arrowUp(sharp, spec), turns);
    // a concave r=1 corner offsets to radius 0; drop the collapsed arc it leaves rather than ship a knot of cubics
    const plate = G.emit(G.offsetClosed(G.parse(d)[0].segs, true).filter((sg) => G.len(G.sub(G.p1(sg), G.p0(sg))) > 0.01), true);
    // four styles since 1.0.0: two-tone is the plate under the outline, and a one-shape duotone is the stroke drawing
    v[`stroke.${c}`] = [{ d, attrs: STROKE(sharp) }];
    v[`two-tone.${c}`] = [{ d: plate, attrs: PLATE }, { d, attrs: STROKE(sharp) }];
    v[`duotone.${c}`] = [{ d, attrs: STROKE(sharp) }];
    v[`fill.${c}`] = [{ d: plate, attrs: SOLID }];
  }
  write(`arrow-big-${dir}${suffix}`, v);
}

/* ------------------------------------------------------------------ heading */
// Letterforms. The bare heading is a full-height H; the numbered six set a condensed H beside a numeral on its baseline.
const H_FULL = 'M6 3V21M18 3V21M6 12H18';
// 17 Sep 2026, on his "fix all" to a size check: the numbered six painted 19 or 20 wide by 16, under the 22 a wide
// drawing is held to, and 2, 3, 5 and 6 were a unit off centre because their ink stopped a unit short of the numeral
// box. The H grows to stems 9 apart on 4..20, the numeral box moves to x 16..22 on the new baseline 20, and every
// numeral reaches the box's right edge: the 2's foot, the 3's and 5's top bars and the 6's neck run on a unit, the
// only free straight ends they have. Every drawing now paints 1..23 by 3..21, 22 x 18.
// The right stem is on 11 and not 12, which would have kept the numeral 2 clear rather than 3: on 12 the H sat 49%
// on the reference set's condensed H, which stands on 4 and 12, and the headings scored 27 to 46%; on 11 they score
// 12 to 15, and 25 for the 4, whose right stem is his and lands on 21 where theirs does.
const H_NUM = 'M2 4V20M11 4V20M2 12H11';
// his heading-1 of 14 Sep 2026 set the numeral box, x 15..21 by y 12..19, and his heading-2..5 (refs/) sat on x 16..20;
// all of them are moved (+1, +1) here. His files split the H at its crossbar and the 4 at its bar; those are rejoined
// into the same ink as single runs.
const DIGITS = {
  1: 'M16.75 15.1L19 13V20M16 20H22',
  2: 'M17 15C17 13.8954 17.8954 13 19 13C20.1046 13 21 13.8954 21 15C21 15.6037 20.7273 16.1751 20.258 16.5548L17 20H22',
  // 17 Sep 2026, his heading-3, -5 and -6 (refs/), verbatim: the 3's and 5's top bars stop on 21 over the bowl's right
  // edge rather than running on to 22, and the 6's neck is his one curve from the bowl's left to (21,13). They paint
  // 1..22, a unit off centre, and sit in lint's SKEW_KNOWN: the H is shared with 1, 2 and 4 and does not move.
  3: 'M17 13H21L18.8564 16C20.0403 16 21 16.8954 21 18C21 19.1046 20.0403 20 18.8564 20C18.0906 20 17.3829 19.6188 17 19',
  4: 'M17 13V17.5H22M21 13V20',
  5: 'M21 13H17V16H19C20.1046 16 21 16.8954 21 18C21 19.1046 20.1046 20 19 20C18.2855 20 17.3573 19.6188 17 19',
  6: 'M17 18C17 16.8954 17.8954 16 19 16C20.1046 16 21 16.8954 21 18C21 19.1046 20.1046 20 19 20C17.8954 20 17 19.1046 17 18ZM17 18C17 15.5811 18.7178 13.4633 21 13',
};
const MUTED = (sharp) => STROKE(sharp).replace(' stroke-width', ' stroke-opacity="0.4" stroke-width');
// four styles since 1.0.0: an open glyph's fill is its stroke drawing; the bare H is one element, so its two-tone and
// duotone are the stroke drawing too, and a numbered heading greys its H and keeps the numeral black
const letter = (name, h, numeral = '') => {
  const v = {};
  for (const c of ['regular', 'sharp']) {
    const sharp = c === 'sharp', H = sharp ? sharpRun(h) : h, N = numeral && (sharp ? sharpRun(numeral) : numeral);
    const whole = [{ d: H + N, attrs: STROKE(sharp) }];
    const split = numeral ? [{ d: H, attrs: MUTED(sharp) }, { d: N, attrs: STROKE(sharp) }] : whole;
    Object.assign(v, { [`stroke.${c}`]: whole, [`two-tone.${c}`]: split, [`duotone.${c}`]: split, [`fill.${c}`]: whole });
  }
  write(name, v);
};
if (!process.env.ONLY || process.env.ONLY.split(',').includes('heading')) letter('heading', H_FULL);
for (const [n, dg] of Object.entries(DIGITS)) letter(`heading-${n}`, H_NUM, dg);

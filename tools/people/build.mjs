// Faces, second round: his boy and girl of 14 Sep 2026 (refs/), fixed, and the babies.
// Fill: only the hair is solid, the face stays open. solid = plate(silhouette) with the
// face's inner ink knocked out; eyes and mouth stay strokes. Duotone: the same solid at 0.4.
import { resolve } from 'node:path';
import * as G from './geo.mjs';
const R = resolve(import.meta.dirname, '../..');
const { writeSet } = await import(R + '/tools/v5/raw.mjs');
const { sharpEndIn } = await import(R + '/tools/v5/icons.mjs');
const { strokedBBox } = await import(R + '/pipeline/lib/geom.mjs');
const ROOT = process.env.OUT || import.meta.dirname;
const S = (d) => ({ kind: 'stroke', d }), F_ = (d) => ({ kind: 'solid', d }), P = (d) => ({ kind: 'plate', d });

function sharpRun(d, [s0, s1]) {
  let r = G.run(d);
  if (s1) { const s = r.at(-1), p = G.p1(s), t = G.tan(s, 1), e = sharpEndIn(p, t); if (e > 1e-6) { if (s.t === 'L') s.p[1] = G.add(p, G.mul(t, e)); else r = [...r, { t: 'L', p: [p, G.add(p, G.mul(t, e))] }]; } }
  if (s0) { const s = r[0], p = G.p0(s), t = G.mul(G.tan(s, 0), -1), e = sharpEndIn(p, t); if (e > 1e-6) { if (s.t === 'L') s.p[0] = G.add(p, G.mul(t, e)); else r = [{ t: 'L', p: [G.add(p, G.mul(t, e)), p] }, ...r]; } }
  return r;
}
const segs = (...ds) => ds.flatMap((d) => (typeof d === 'string' ? G.run(d) : d));

/**
 * strokes: [{d, ends}] the drawing as he strokes it (closed runs end in Z, pass closed:true)
 * sil: segs of the silhouette, face: segs of the face (the open part), features: [{d, ends}]
 * extraSolids: closed segs that are solid on their own (a bow), knocked nothing
 */
export function build(name, { strokes, sil, faces = [], features, duoStrokes, extraSils = [] }) {
  const plate = G.offsetClosed(sil, true);
  const holes = faces.map((f) => G.against(plate, G.offsetClosed(f, false)));
  // further solids that touch nothing else in the solid layer (the pacifier's disc)
  const extras = extraSils.map((e) => G.offsetClosed(e, true));
  const solidD = G.emit(plate, true) + holes.map((h) => G.emit(h, true)).join('') + extras.map((e) => G.emit(e, true)).join('');
  const out = {};
  for (const sharp of [false, true]) {
    const k = sharp ? 'sharp' : 'regular', cap = sharp ? 'butt' : 'round';
    const runD = (x) => (x.closed ? x.d : sharp ? G.emit(sharpRun(x.d, x.ends || [false, false])) : x.d);
    const strokeD = strokes.map(runD).join('');
    const featD = features.map(runD).join('');
    out[`stroke.${k}`] = [S(strokeD)];
    out[`duotone.${k}`] = [P(solidD), S((duoStrokes || strokes).map(runD).join(''))];
    out[`fill.${k}`] = [F_(solidD), S(featD)];
    const bb = strokedBBox(strokeD, 1, cap);
    console.log(name, k, 'ink', bb.map((v) => +v.toFixed(3)).join(','), 'solid', strokedBBox(solidD, 0, 'butt').map((v) => +v.toFixed(3)).join(','));
  }
  writeSet(ROOT, name, out);
}

const EYES = (y0, y1) => [{ d: `M9 ${y0}L9 ${y1}`, ends: [true, true] }, { d: `M15 ${y0}L15 ${y1}`, ends: [true, true] }];
const MOUTH = { d: 'M10.5 17.45C11 17.8 11.5 17.95 12 17.95C12.5 17.95 13 17.8 13.5 17.45', ends: [true, true] };

// ---- boy: his 14 Sep drawing. Fixed: the cap's top no longer dips to 1.997, the fringe's
// middle lifted 0.3 and the eyes dropped 0.2, so every gap to the eyes is 2 or more.
export const BOY = {
  cap: 'M4 10.5L4 7.5C4 4 6.8 2 11.5 2C14.4 2 16.5 3.5 19.4 2C20 3.6 20 5.5 20 7.5L20 10.5',
  fringe: 'M4 10.5C6 10.5 6.6 9 7.6 7.6C8.9 8.6 11.2 9.2 13 8.7C15 8.35 16.2 7.4 17.4 6.6C17.9 8 18.5 10 20 10.5',
  // from the right ear round the chin to the left ear
  outline: 'M20 10.5C21.1046 10.5 22 11.6193 22 13C22 14.3807 21.1046 15.5 20 15.5L20 15.738C20 17.3 19 18.9 17.45 20.1C15.9 21.3 13.94 22 12 22C10.06 22 8.1 21.3 6.55 20.1C5 18.9 4 17.3 4 15.738L4 15.5C2.8954 15.5 2 14.3807 2 13C2 11.6193 2.8954 10.5 4 10.5',
};
if (!process.env.NO_BOY) build('boy', {
  strokes: [{ d: BOY.outline + BOY.fringe.replace(/^M4 10.5/, '') + 'Z', closed: true }, { d: BOY.cap }, ...EYES(12.6, 13.6), MOUTH],
  sil: segs(BOY.cap, BOY.outline),
  faces: [segs(BOY.outline, BOY.fringe.replace(/^M4 10.5/, 'M4 10.5'))],
  features: [...EYES(12.6, 13.6), MOUTH],
});

// ---- girl: his 14 Sep drawing. Fixed: the part's left end sits on the dome (4.0957, the
// mirror of 19.9043; it was 0.5 in), eyes dropped 0.2 for a 2.02 gap to the part.
export const GIRL = {
  part: 'M4.0957 9.6C9 9.6 11 5.8 12 3.5C13 5.8 15 9.6 19.9043 9.6',
  // the silhouette from the left cheek round the pigtails and dome to the right cheek
  hair: 'M4.5 15.5C4.1 17.6 4.4 19.2 3.2 20.4C2.4 19.4 2 18 2 16.4C2 14.4 2.6 12.4 4 11C4 6 7.6 2 12 2C16.4 2 20 6 20 11C21.4 12.4 22 14.4 22 16.4C22 18 21.6 19.4 20.8 20.4C19.6 19.2 19.9 17.6 19.5 15.5',
  chin: 'M19.5 15.5C19.5 19.6 15.6 22 12 22C8.4 22 4.5 19.6 4.5 15.5',
  // where the hair meets the face in fill: the chin's side carried up to the part's ends
  // below the dome's end (20,11) the edge carries straight on and eases in to the chin's side
  cheekR: 'M20 11C20 12.8 19.5 13.9 19.5 15.5', cheekL: 'M4.5 15.5C4.5 13.9 4 12.8 4 11',
};
// the dome from the part's end down to (20,11), split off the drawing's own curve so the fill's
// edge IS the dome's inner edge there: no kink where the grey begins
function domeTail(side) {
  const s = G.run(side > 0 ? 'M12 2C16.4 2 20 6 20 11' : 'M4 11C4 6 7.6 2 12 2')[0];
  let lo = 0, hi = 1;
  const f = (t) => G.at(s, t)[1] - 9.6;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if ((f(lo) < 0) === (f(m) < 0)) lo = m; else hi = m; }
  const [a, b] = G.split(s, (lo + hi) / 2);
  return side > 0 ? [b] : [a];
}
if (!process.env.NO_GIRL) build('girl', {
  strokes: [{ d: GIRL.hair + GIRL.chin.replace(/^M19.5 15.5/, '') + 'Z', closed: true }, { d: GIRL.part }, ...EYES(12.6, 13.6), MOUTH],
  sil: segs(GIRL.hair, GIRL.chin),
  faces: [segs(GIRL.part, domeTail(1), GIRL.cheekR, GIRL.chin, GIRL.cheekL, domeTail(-1))],
  features: [...EYES(12.6, 13.6), MOUTH],
});

// ---- babies: the boy's ears and chin, a bald dome, the same eyes and mouth.
const EARS_CHIN = BOY.outline; // right ear, chin, left ear: (20,10.5) to (4,10.5)
const f3 = (v) => +v.toFixed(4), pt = (p) => `${f3(p[0])} ${f3(p[1])}`;
/** A lock hanging from the crown: round the left, under, and up the right to `endDeg`. */
function curlPath(cx = 12.2, cy = 5.5, r = 3.1, endDeg = 40, lead = 1.2) {
  const k = 0.5523 * r;
  let d = `M12 2C${pt([12 - lead, 2.3])} ${pt([cx - r, cy - k * 1.3])} ${pt([cx - r, cy])}`;
  d += `C${pt([cx - r, cy + k])} ${pt([cx - k, cy + r])} ${pt([cx, cy + r])}`;
  const t0 = Math.PI / 2, t1 = (endDeg * Math.PI) / 180, kk = (4 / 3) * Math.tan((t1 - t0) / 4) * r;
  const s0 = [cx + r * Math.cos(t0), cy + r * Math.sin(t0)], s1 = [cx + r * Math.cos(t1), cy + r * Math.sin(t1)];
  d += `C${pt([s0[0] - kk * Math.sin(t0), s0[1] + kk * Math.cos(t0)])} ${pt([s1[0] + kk * Math.sin(t1), s1[1] - kk * Math.cos(t1)])} ${pt(s1)}`;
  return { d, end: s1 };
}
// the second drawings, his of 14 Sep 2026: a pacifier in place of the mouth, a ring of r=2
// about (12,19) sitting on the chin; eyes clear it by 2.18
const PACIFIER = { d: 'M14 19C14 17.8954 13.1046 17 12 17C10.8954 17 10 17.8954 10 19C10 20.1046 10.8954 21 12 21C13.1046 21 14 20.1046 14 19Z', closed: true };
// his call, 14 Sep 2026: the pacifier is grey in duotone and solid in fill, like the hair
const pacifierDisc = () => G.run(PACIFIER.d);
if (!process.env.NO_BABY) for (const [suffix, mouth] of [['', MOUTH], ['-2', PACIFIER]]) {
  const pac = mouth === PACIFIER;
  const DOME = 'M4 10.5C4 5.8 7.6 2 12 2C16.4 2 20 5.8 20 10.5';
  const head = DOME + EARS_CHIN.replace(/^M20 10.5/, '') + 'Z';
  const lock = curlPath();
  // the lock in fill: the curl closed from its end back to the crown, leaving along the curl's
  // own direction so the lock is a teardrop rather than a wedge with a spike at the end
  const T = [Math.sin(40 * Math.PI / 180), -Math.cos(40 * Math.PI / 180)];
  const lockRegion = segs(lock.d, `M${pt(lock.end)}C${pt([lock.end[0] + 0.8 * T[0], lock.end[1] + 0.8 * T[1]])} 13.2 3.4 12 2`);
  // his direction, 14 Sep 2026: duotone and fill close the lock into a teardrop, the crown to the
  // curl's circle along its two tangents and round the bottom; the stroke keeps the open curl
  const O = [12.2, 5.5], R = 3.1, Cr = [12, 2];
  const dOC = G.sub(Cr, O), dist = G.len(dOC), aOC = Math.atan2(dOC[1], dOC[0]), half = Math.acos(R / dist);
  const aL = aOC - half, aR = aOC + half;
  const TL = [O[0] + R * Math.cos(aL), O[1] + R * Math.sin(aL)], TR = [O[0] + R * Math.cos(aR), O[1] + R * Math.sin(aR)];
  const around = G.arc(O, R, aL, aR - 2 * Math.PI - aL);
  around[0].p[0] = TL; around.at(-1).p[3] = TR;
  const tear = [{ t: 'L', p: [Cr, TL] }, ...around, { t: 'L', p: [TR, Cr] }];
  const tearD = G.emit(tear, true);
  build(`baby${suffix}-boy`, {
    strokes: [{ d: head, closed: true }, { d: lock.d, ends: [false, true] }, ...EYES(12.6, 13.6), mouth],
    duoStrokes: [{ d: head, closed: true }, { d: tearD, closed: true }, ...EYES(12.6, 13.6), mouth],
    sil: tear, faces: [], extraSils: pac ? [pacifierDisc()] : [],
    features: [{ d: head, closed: true }, ...EYES(12.6, 13.6), ...(pac ? [] : [mouth])],
  });

  // the bow is the crown: two loops about (12, KY), the dome running into each loop's outer edge
  const KY = 4.2, HL = 3.8, HH = 2.2, lb = 12 - HL, rb = 12 + HL;
  const loopL = `M12 ${KY}L${lb} ${KY - HH}L${lb} ${KY + HH}Z`, loopR = `M12 ${KY}L${rb} ${KY - HH}L${rb} ${KY + HH}Z`;
  const rim = `M${rb} ${KY}C${f3(rb + 2.2)} ${KY} 20 ${f3(10.5 - 3.8)} 20 10.5` + EARS_CHIN.replace(/^M20 10.5/, '') + `C4 ${f3(10.5 - 3.8)} ${f3(lb - 2.2)} ${KY} ${lb} ${KY}`;
  const bowRun = segs(`M12 ${KY}L${lb} ${KY - HH}L${lb} ${KY + HH}L12 ${KY}L${rb} ${KY + HH}L${rb} ${KY - HH}L12 ${KY}`);
  build(`baby${suffix}-girl`, {
    strokes: [{ d: rim }, { d: loopL, closed: true }, { d: loopR, closed: true }, ...EYES(12.6, 13.6), mouth],
    sil: bowRun, faces: [], extraSils: pac ? [pacifierDisc()] : [],
    features: [{ d: rim }, ...EYES(12.6, 13.6), ...(pac ? [] : [mouth])],
  });
}

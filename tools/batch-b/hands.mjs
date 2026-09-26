/**
 * `hand-pointer`, fitted from Zafar's drawing of 13 Sep 2026
 * (refs/hand-pointer.svg), and its turns `-right`, `-left` and `-down`.
 *
 * His hand is the back of a right hand pointing up: the index finger standing
 * out of a fist, three knuckles stepping down to the right, the thumb folded
 * across the palm on the left, a short line at each knuckle notch and one down
 * from where the thumb meets the finger. What changed:
 *
 * - his finger walls stood 3.89 apart on 7.4 and 11.29; they are 8 and 12 here,
 *   capped on r=2 so the tip's ink is on 1, and the thumb is 5 wide from the left
 *   wall on 3, so the fill's cut beside the finger leaves the thumb a rim of 3.
 * - his knuckles were three different bumps on uneven widths (2.9, 3.4, 2.4).
 *   They are one bump three times: an r=2 arc from each notch that comes down
 *   vertical into the next, which on a 3 pitch drops each notch by sqrt 3 and
 *   lands the last one tangent to the right wall on 21, the smooth turn his
 *   pinky makes. The first notch sits on 8, his 8.13.
 * - his palm's corners were free curves; both are r=4 here, the ladder's top for
 *   a corner whose plate must land on it too (r=7 read closer to his heel and
 *   put 7 and 8 off the ladder). Sharp squares both.
 * - his knuckle lines stand on a 3 pitch, a unit apart, and so do these: no
 *   length clears 2 when each notch is only sqrt 3 below the last, so that
 *   SPACING warning is his drawing's and stays.
 * - his thumb came down a slope onto the left wall; here the slope is the
 *   tangent from the finger's foot at (8, 10) to an r=2 turn about (5, 13).
 *   Sharp takes the turn to the point where that tangent meets the wall.
 * - the knuckle lines are 2 long from each notch, the thumb's line 3 long from
 *   the finger's foot, as his are near enough.
 *
 * 20 x 22 on 2..22 by 1..23. Fill: see `thumbCut`.
 *
 * `-right` turns the hand a quarter clockwise (thumb on top), `-left` mirrors
 * that, `-down` mirrors the up hand top to bottom (thumb still on the left).
 */
import { add, sub, mul, unit, len } from '../v5/geom.mjs';
import { offsetContour, contourPath, verify, flatten } from '../v5/offset.mjs';
import { sharpEndIn } from '../v5/icons.mjs';

const rad = (a) => (a * Math.PI) / 180;
const ang = (c, p) => (Math.atan2(p[1] - c[1], p[0] - c[0]) * 180) / Math.PI;
const on = (c, r, a) => [c[0] + r * Math.cos(rad(a)), c[1] + r * Math.sin(rad(a))];
const L = (p0, p1) => ({ type: 'L', p0, p1 });
const A = (c, r, a0, a1) => ({ type: 'A', c, r, a0, a1 });
const rev = (g) => (g.type === 'L' ? L(g.p1, g.p0) : A(g.c, g.r, g.a1, g.a0));
const S3 = Math.sqrt(3);

const STEPS = [7, 9, 11];
export const HAND = { tip: [10, 4], wall: [8, 12], notch: 8, pitch: 3, rk: 2, right: 21, base: 22, rb: 4, heel: { c: [7, 18], r: 4 }, left: 3, thumb: { c: [5, 13], r: 2 }, foot: [8, 10] };

/** The up hand, in its own frame: the silhouette, and the lines as [from, to, fromIsBuried]. */
function upHand(sharp) {
  const H = HAND;
  const sil = [];
  const notches = [];
  let wallTop;
  if (sharp) {
    // sharp squares the fingers, his word (13 Sep 2026): the tip is a flat top on the tip's ink line,
    // and the knuckles are a staircase of flat tops on 7, 9 and 11 whose risers run on down as the
    // knuckle lines
    const top = H.tip[1] - 2;
    sil.push(L([H.wall[0], H.foot[1]], [H.wall[0], top]), L([H.wall[0], top], [H.wall[1], top]));
    let x = H.wall[1], y = top;
    for (let k = 0; k < 3; k++) {
      const step = STEPS[k];
      sil.push(L([x, y], [x, step]), L([x, step], [x + H.pitch, step]));
      notches.push([x, step]);
      x += H.pitch; y = step;
    }
    wallTop = y;
  } else {
    sil.push(L([H.wall[0], H.foot[1]], [H.wall[0], H.tip[1]]));
    sil.push(A(H.tip, 2, 180, 360));
    sil.push(L([H.wall[1], H.tip[1]], [H.wall[1], H.notch]));
    for (let k = 0; k < 3; k++) {
      const from = [H.wall[1] + k * H.pitch, H.notch + k * S3];
      const C = [from[0] + H.pitch - H.rk, H.notch + (k + 1) * S3];
      notches.push(from);
      sil.push(A(C, H.rk, 240, 360));
    }
    wallTop = H.notch + 3 * S3;
  }
  const rb = sharp ? 0 : H.rb, rh = sharp ? 0 : H.heel.r;
  sil.push(L([H.right, wallTop], [H.right, H.base - rb]));
  if (rb) sil.push(A([H.right - rb, H.base - rb], rb, 0, 90));
  sil.push(L([H.right - rb, H.base], [H.left + rh, H.base]));
  if (rh) sil.push(A(H.heel.c, rh, 90, 180));
  // the thumb: the tangent from the finger's foot to the r=2 turn on the left wall
  const Tc = H.thumb.c, d = len(sub(H.foot, Tc));
  const aT = ang(Tc, H.foot) - (Math.acos(H.thumb.r / d) * 180) / Math.PI + 360;   // the upper-left tangent point
  const T = on(Tc, H.thumb.r, aT);
  if (sharp) {
    const u = unit(sub(T, H.foot)), t = (H.left - H.foot[0]) / u[0];
    const corner = add(H.foot, mul(u, t));
    sil.push(L([H.left, H.base - rh], corner), L(corner, H.foot));
  } else {
    sil.push(L([H.left, H.base - rh], [H.left, Tc[1]]), A(Tc, H.thumb.r, 180, aT), L(T, H.foot));
  }
  // each line with the point its fill gap runs out to: out along the bisector of the open wedge
  // at its start, between the wall coming up and the knuckle leaving at 30 degrees (or the thumb)
  const bis = unit(add([0, -1], unit(sub(T, H.foot))));
  const lines = [
    ...notches.map((p, k) => [p, [p[0], p[1] + [2, 1.5, 1.25][k]], null]),
    [H.foot, [H.foot[0], H.foot[1] + 3], add(H.foot, mul(bis, 3))],
  ];
  return { sil: sil.filter((g) => g.type === 'A' || len(sub(g.p1, g.p0)) > 1e-9), lines, T };
}

/** The four poses as maps of the plane; a mirror flips a contour's winding. */
const POSES = {
  up: { P: (p) => p, a: (x) => x, mirror: false, box: [2, 1, 22, 23] },
  right: { P: (p) => [24 - p[1], p[0]], a: (x) => x + 90, mirror: false, box: [1, 2, 23, 22] },
  left: { P: (p) => [p[1], p[0]], a: (x) => 90 - x, mirror: true, box: [1, 2, 23, 22] },
  down: { P: (p) => [p[0], 24 - p[1]], a: (x) => -x, mirror: true, box: [2, 1, 22, 23] },
};
const moveSeg = (g, M) => (g.type === 'L' ? L(M.P(g.p0), M.P(g.p1)) : A(M.P(g.c), g.r, M.a(g.a0), M.a(g.a1)));

const windingOf = (segs) => {
  const q = flatten(segs, 24);
  let s = 0;
  for (let i = 0; i < q.length; i++) { const p = q[i], n = q[(i + 1) % q.length]; s += p[0] * n[1] - n[0] * p[1]; }
  return Math.sign(s);
};

/**
 * The fill, his 13 Sep reference: the silhouette solid, the knuckles read from
 * its edge alone, and ONE cut, between the thumb and the pointing finger. The
 * cut is the stroke's width with the finger's own edge as its far side, so it
 * runs down from the notch where the thumb meets the finger, on the thumb's side
 * of that edge, to where the stroke's thumb line ends (round there, square in
 * sharp), the corner it makes on the thumb's top edge rounded on r=1 (sharp:
 * the point). It is carved straight into the plate's contour: the plate's last
 * run is the thumb's top edge coming up into that notch.
 */
/**
 * A sharp plate's corners as true points. The offset rounds every convex corner on
 * r=1, which is the round join the stroke paints; a solid has no stroke, and his
 * word on the sharp hand (13 Sep 2026) was that rounded corners there read wrong. Each
 * r=1 arc between two runs becomes the point where the runs meet.
 */
function miter(plate) {
  const out = [];
  for (let i = 0; i < plate.length; i++) {
    const g = plate[i];
    const prev = out[out.length - 1], next = plate[(i + 1) % plate.length];
    if (g.type === 'A' && Math.abs(g.r - 1) < 1e-9 && prev && prev.type === 'L' && next.type === 'L') {
      const u = sub(prev.p1, prev.p0), v = sub(next.p1, next.p0), w = sub(next.p0, prev.p0);
      const d = u[0] * v[1] - u[1] * v[0];
      const t = (w[0] * v[1] - w[1] * v[0]) / d;
      const M = add(prev.p0, mul(u, t));
      out[out.length - 1] = L(prev.p0, M);
      plate[(i + 1) % plate.length] = L(M, next.p1);
      continue;
    }
    out.push(g);
  }
  return out;
}

function thumbCut(up, sharp) {
  const H = HAND;
  const round = offsetContour(up.sil, 1);
  verify(up.sil, round, 1);
  const plate = sharp ? miter(round.map((g) => ({ ...g }))) : round;
  const last = plate[plate.length - 1];
  const xr = H.wall[0] - 1, xl = xr - 2, yEnd = H.foot[1] + 3;
  if (last.type !== 'L' || Math.abs(last.p1[0] - xr) > 1e-6) throw new Error('hand plate: the thumb edge is not where it was');
  const t = (xl - last.p0[0]) / (last.p1[0] - last.p0[0]);
  if (!(t > 0 && t < 1)) throw new Error('hand plate: the cut misses the thumb edge');
  const onEdge = add(last.p0, mul(sub(last.p1, last.p0), t));
  // regular rounds the one convex corner the cut makes (r=1). The thumb's top edge is shorter than
  // that fillet's tangent run, so the fillet takes the thumb's own turn instead: a circle of 1 inside
  // the cut's edge and inside the turn's plate arc, and the edge between them goes
  let body = plate.slice(0, -1), cut;
  if (sharp) cut = [L(last.p0, onEdge), L(onEdge, [xl, yEnd])];
  else {
    const turn = body[body.length - 1];
    if (turn.type !== 'A') throw new Error('hand plate: the thumb turn is not where it was');
    const F = [xl - 1, turn.c[1] - Math.sqrt((turn.r - 1) ** 2 - (xl - 1 - turn.c[0]) ** 2)];
    const onTurn = add(turn.c, mul(unit(sub(F, turn.c)), turn.r));
    let aT = ang(turn.c, onTurn); while (aT < turn.a0) aT += 360; while (aT - turn.a0 > 360) aT -= 360;
    if (aT > turn.a1 + 1e-9) throw new Error('hand plate: the fillet misses the thumb turn');
    body = [...body.slice(0, -1), A(turn.c, turn.r, turn.a0, aT)];
    let f0 = ang(F, onTurn), f1 = 0; while (f1 < f0) f1 += 360;
    cut = [A(F, 1, f0, f1), L([xl, F[1]], [xl, yEnd])];
  }
  if (sharp) cut.push(L([xl, yEnd], [xl, yEnd + 1]), L([xl, yEnd + 1], [xr, yEnd + 1]), L([xr, yEnd + 1], [xr, yEnd]));
  else cut.push(A([xl + 1, yEnd], 1, 180, 0));
  cut.push(L([xr, yEnd], last.p1));
  return [...body, ...cut];
}

export function handPointer(pose, sharp) {
  const M = POSES[pose];
  const key = sharp ? 'sharp' : 'regular';
  const up = upHand(sharp);
  let sil = up.sil.map((g) => moveSeg(g, M));
  if (M.mirror) sil = sil.reverse().map(rev);
  const lines = up.lines.map(([a, b, x]) => [M.P(a), M.P(b), x && M.P(x)]);
  const plate = offsetContour(sil, 1);
  verify(sil, plate, 1);
  // strokes: each line leaves the outline (buried) and ends free; sharp stubs the free end
  const fmt = (v) => String(Math.round(v * 1e4) / 1e4);
  const pt = (p) => `${fmt(p[0])} ${fmt(p[1])}`;
  const lineD = lines.map(([a, b]) => {
    const dir = unit(sub(b, a));
    const e = sharp ? add(b, mul(dir, sharpEndIn(b, dir, M.box))) : b;
    return `M${pt(a)}L${pt(e)}`;
  }).join('');
  const strokeD = contourPath(sil) + lineD;
  // fill: built in the up frame and moved with the rest
  let fillSegs = thumbCut(up, sharp).map((g) => moveSeg(g, M));
  if (M.mirror) fillSegs = fillSegs.reverse().map(rev);
  const fillD = contourPath(fillSegs);
  return {
    box: M.box,
    variants: {
      [`stroke.${key}`]: [{ kind: 'stroke', d: strokeD }],
      [`duotone.${key}`]: [{ kind: 'plate', d: contourPath(plate) }, { kind: 'stroke', d: strokeD }],
      [`fill.${key}`]: [{ kind: 'solid', d: fillD }],
    },
  };
}

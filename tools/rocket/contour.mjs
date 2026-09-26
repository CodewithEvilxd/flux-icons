// A closed contour of lines and circular arcs with a fillet at every corner, and
// its offset. Absolute M/L/C only, through tools/v5/geom.mjs.
//
//   edges[i]   {line: [P, Q], inside: X} or {circle: [C, R], inside: X}
//              `inside` is any point on the material side of that edge
//   corners[i] sits between edges[i] and edges[i+1]:
//              {r, hint: V, I}  hint picks the crossing, I is a point on the side
//              the fillet centre goes (the material for a convex corner, the
//              white for a reflex one); {away: X} on a circle edge's corner makes
//              that arc run the long way, away from X
import { Path, add, sub, mul, len, unit, dot, cross } from '../v5/geom.mjs';

const deg = (r) => (r * 180) / Math.PI;
const ang = (c, p) => deg(Math.atan2(p[1] - c[1], p[0] - c[0]));

function lineLine(P1, d1, P2, d2) {
  const den = cross(d1, d2);
  if (Math.abs(den) < 1e-12) return [];
  return [add(P1, mul(d1, cross(sub(P2, P1), d2) / den))];
}
function lineCircle(P, d, C, R) {
  const f = sub(P, C), b = 2 * dot(f, d), c = dot(f, f) - R * R, disc = b * b - 4 * c;
  if (disc < -1e-6) return [];
  const s = Math.sqrt(Math.max(0, disc));
  return [(-b - s) / 2, (-b + s) / 2].map((t) => add(P, mul(d, t)));
}
function circleCircle(C1, R1, C2, R2) {
  const dd = len(sub(C2, C1));
  const x = (dd * dd + R1 * R1 - R2 * R2) / (2 * dd), h2 = R1 * R1 - x * x;
  if (h2 < -1e-9) return [];
  const e = unit(sub(C2, C1)), nr = [-e[1], e[0]], h = Math.sqrt(Math.max(0, h2));
  return [1, -1].map((k) => add(add(C1, mul(e, x)), mul(nr, h * k)));
}
const near = (list, p) => {
  if (!list.length) throw new Error('edges do not meet');
  return list.reduce((a, b) => (len(sub(b, p)) < len(sub(a, p)) ? b : a));
};
const dirOf = (E) => unit(sub(E.line[1], E.line[0]));

function intersect(A, B, hint) {
  if (A.line && B.line) return near(lineLine(A.line[0], dirOf(A), B.line[0], dirOf(B)), hint);
  if (A.line) return near(lineCircle(A.line[0], dirOf(A), ...B.circle), hint);
  if (B.line) return near(lineCircle(B.line[0], dirOf(B), ...A.circle), hint);
  return near(circleCircle(...A.circle, ...B.circle), hint);
}

/* the edge moved by r toward (sign +1) or away from (sign -1) point I */
function shift(E, r, I, sign = 1) {
  if (E.line) {
    const [P, Q] = E.line, d = dirOf(E), nr = [-d[1], d[0]];
    const s = (Math.sign(dot(sub(I, P), nr)) || 1) * sign;
    const o = mul(nr, s * r);
    return { ...E, line: [add(P, o), add(Q, o)] };
  }
  const [C, R] = E.circle, inside = len(sub(I, C)) < R;
  return { ...E, circle: [C, R + (inside === (sign > 0) ? -r : r)] };
}
function foot(E, F) {
  if (E.line) { const [P] = E.line, d = dirOf(E); return add(P, mul(d, dot(sub(F, P), d))); }
  const [C, R] = E.circle;
  return add(C, mul(unit(sub(F, C)), R));
}

export function contour(edges, corners) {
  const nE = edges.length;
  const cs = corners.map((c, i) => {
    const A = edges[i], B = edges[(i + 1) % nE];
    const V = intersect(A, B, c.hint);
    if (!c.r) return { V, Tin: V, Tout: V };
    const F = intersect(shift(A, c.r, c.I), shift(B, c.r, c.I), V);
    return { V, F, Tin: foot(A, F), Tout: foot(B, F) };
  });
  const P = new Path();
  P.M(cs[nE - 1].Tout);
  for (let i = 0; i < nE; i++) {
    const E = edges[i], c = cs[i];
    if (E.line) P.L(c.Tin);
    else {
      const C = E.circle[0], a0 = ang(C, P.cur), a1 = ang(C, c.Tin);
      let dir = 0;
      if (corners[i].away) {
        const mid = (d) => { let e = a1; if (d > 0) while (e <= a0) e += 360; else while (e >= a0) e -= 360; const m = ((a0 + e) / 2) * Math.PI / 180; return [C[0] + E.circle[1] * Math.cos(m), C[1] + E.circle[1] * Math.sin(m)]; };
        dir = len(sub(mid(1), corners[i].away)) > len(sub(mid(-1), corners[i].away)) ? 1 : -1;
      }
      P.A(C, a0, a1, dir);
    }
    if (c.F) P.A(c.F, ang(c.F, c.Tin), ang(c.F, c.Tout));
    P.cur = c.Tout;
  }
  return { d: P.Z().toString(), corners: cs };
}

/* The same contour grown by one unit: every edge moves away from its material,
   a convex corner's radius grows by one (a true corner takes the round join's
   r=1 about its own vertex), a reflex corner's shrinks to no less than zero. */
export function grow(edges, corners, by = 1) {
  const E = edges.map((e) => shift(e, by, e.inside, -1));
  const C = corners.map((c) => ({ ...c, r: c.tangent ? 0 : c.reflex ? Math.max(0, (c.r ?? 0) - by) : (c.r ?? 0) + by }));
  return contour(E, C);
}

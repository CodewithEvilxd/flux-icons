export type CubicBezier = readonly [number, number, number, number];

export const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const satisfies CubicBezier;
export const EASE_OUT_QUART = [0.165, 0.84, 0.44, 1] as const satisfies CubicBezier;
export const EASE_OUT_CUBIC = [0.215, 0.61, 0.355, 1] as const satisfies CubicBezier;
export const EASE_OUT_EXPO_SOFT = [0.16, 1, 0.3, 1] as const satisfies CubicBezier;

export const cubicBezier = (curve: CubicBezier) => `cubic-bezier(${curve.join(", ")})`;

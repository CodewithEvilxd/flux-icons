

export type HexColor = `#${string}`;

export interface RGBColor {
    r: number;
    g: number;
    b: number;
}

export interface HSLColor {
    h: number;
    s: number;
    l: number;
}

export function normalizeHexColor(value: string, defaultColor: HexColor = '#007aff'): HexColor {
    const trimmed = value.trim().toLowerCase();
    const expanded = trimmed.match(/^#?[0-9a-f]{3}$/)
        ? trimmed.replace('#', '').split('').map((char) => char + char).join('')
        : trimmed.replace(/^#/, '');

    if (!/^[0-9a-f]{6}$/.test(expanded)) {
        return defaultColor;
    }

    return `#${expanded}` as HexColor;
}

export function hexToRgb(value: string): RGBColor {
    const normalized = normalizeHexColor(value).slice(1);
    return {
        r: parseInt(normalized.slice(0, 2), 16),
        g: parseInt(normalized.slice(2, 4), 16),
        b: parseInt(normalized.slice(4, 6), 16),
    };
}

export function hslToRgb(h: number, s: number, l: number): RGBColor {
    const sNorm = s / 100;
    const lNorm = l / 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = sNorm * Math.min(lNorm, 1 - lNorm);
    const f = (n: number) => lNorm - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return {
        r: Math.round(255 * f(0)),
        g: Math.round(255 * f(8)),
        b: Math.round(255 * f(4)),
    };
}

export function hslToHex(h: number, s: number, l: number): HexColor {
    const sNorm = s / 100;
    const lNorm = l / 100;
    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lNorm - c / 2;

    let r = 0;
    let g = 0;
    let b = 0;
    if (h >= 0 && h < 60) {
        r = c;
        g = x;
    } else if (h >= 60 && h < 120) {
        r = x;
        g = c;
    } else if (h >= 120 && h < 180) {
        g = c;
        b = x;
    } else if (h >= 180 && h < 240) {
        g = x;
        b = c;
    } else if (h >= 240 && h < 300) {
        r = x;
        b = c;
    } else {
        r = c;
        b = x;
    }

    const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}` as HexColor;
}

export function rgbToHsl({ r, g, b }: RGBColor): HSLColor {
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
            case gNorm: h = (bNorm - rNorm) / d + 2; break;
            case bNorm: h = (rNorm - gNorm) / d + 4; break;
        }
        h /= 6;
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100),
    };
}

export function hexToHsl(hex: string): HSLColor {
    return rgbToHsl(hexToRgb(hex));
}

// Accepts #rgb, #rrggbb (the # is optional), rgb(r, g, b) and hsl(h, s%, l%).
export function parseColor(input) {
  const value = String(input).trim().toLowerCase();

  const hex = value.replace(/^#/, '');
  if (/^[\da-f]{3}$/.test(hex)) {
    return [...hex].map((c) => parseInt(c + c, 16));
  }
  if (/^[\da-f]{6}$/.test(hex)) {
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  }

  const rgb = value.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
  if (rgb) {
    const channels = rgb.slice(1).map(Number);
    if (channels.every((c) => c <= 255)) return channels;
  }

  const hsl = value.match(/^hsl\(\s*(\d{1,3}(?:\.\d+)?)\s*,\s*(\d{1,3}(?:\.\d+)?)%\s*,\s*(\d{1,3}(?:\.\d+)?)%\s*\)$/);
  if (hsl) {
    const [h, sat, light] = hsl.slice(1).map(Number);
    if (h <= 360 && sat <= 100 && light <= 100) return hslToRgb(h, sat / 100, light / 100);
  }

  throw new Error(`Can't read the color "${input}". Use #rgb, #rrggbb, rgb(r, g, b) or hsl(h, s%, l%).`);
}

function hslToRgb(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}

// Relative luminance, as defined by WCAG 2.x.
export function luminance([r, g, b]) {
  const linear = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export function contrastRatio(a, b) {
  const [light, dark] = [luminance(parseColor(a)), luminance(parseColor(b))].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

// WCAG 2.x thresholds. "Large" text is 24px+, or 18.66px+ and bold.
export function rate(ratio) {
  return {
    normal: { AA: ratio >= 4.5, AAA: ratio >= 7 },
    large: { AA: ratio >= 3, AAA: ratio >= 4.5 },
  };
}

const toHex = (rgb) => '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('');

// Finds the closest text color (same hue, scaled towards black or white)
// that reaches the target ratio on the background. Returns null if none does.
export function suggest(text, background, target = 4.5) {
  const fg = parseColor(text);
  const bg = toHex(parseColor(background));
  if (contrastRatio(toHex(fg), bg) >= target) return toHex(fg);

  let best = null;
  for (const toward of [0, 255]) {
    for (let step = 1; step <= 100; step++) {
      const t = step / 100;
      const candidate = toHex(fg.map((c) => Math.round(c + (toward - c) * t)));
      if (contrastRatio(candidate, bg) >= target) {
        if (!best || step < best.step) best = { step, color: candidate };
        break;
      }
    }
  }
  return best ? best.color : null;
}

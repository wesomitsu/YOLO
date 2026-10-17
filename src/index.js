// Accepts #rgb, #rrggbb (the # is optional) and rgb(r, g, b).
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

  throw new Error(`Can't read the color "${input}". Use #rgb, #rrggbb or rgb(r, g, b).`);
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

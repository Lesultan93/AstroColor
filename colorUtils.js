function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

function rgbToHex(r, g, b) {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function hslToRgb(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

function parseColor(input) {
  input = input.trim().toLowerCase();

  const namedColors = {
    red: '#ff0000',
    green: '#008000',
    blue: '#0000ff',
    black: '#000000',
    white: '#ffffff',
    yellow: '#ffff00',
    cyan: '#00ffff',
    magenta: '#ff00ff'
  };

  if (namedColors[input]) {
    return namedColors[input];
  }

  if (input.startsWith('#')) {
    if (/^#[0-9a-f]{3}$/i.test(input)) {
      return (
        '#' +
        input[1] +
        input[1] +
        input[2] +
        input[2] +
        input[3] +
        input[3]
      );
    }
    if (/^#[0-9a-f]{6}$/i.test(input)) {
      return input;
    }
    return null;
  }

  const rgbMatch = input.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (rgbMatch) {
    return rgbToHex(
      parseInt(rgbMatch[1]),
      parseInt(rgbMatch[2]),
      parseInt(rgbMatch[3])
    );
  }

  const hslMatch = input.match(
    /hsl\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/
  );
  if (hslMatch) {
    const rgb = hslToRgb(
      parseInt(hslMatch[1]),
      parseInt(hslMatch[2]),
      parseInt(hslMatch[3])
    );
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  return null;
}

function getContrast(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  const l1 = 0.2126 * rgb1.r + 0.7152 * rgb1.g + 0.0722 * rgb1.b;
  const l2 = 0.2126 * rgb2.r + 0.7152 * rgb2.g + 0.0722 * rgb2.b;

  return l1 > l2 ? 'white' : 'black';
}

function getContrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  const getLuminance = (r, g, b) => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

function getWCAGLevel(ratio) {
  if (ratio >= 7) return { level: 'AAA', normalText: true, largeText: true };
  if (ratio >= 4.5) return { level: 'AA', normalText: true, largeText: true };
  if (ratio >= 3) return { level: 'AA Large', normalText: false, largeText: true };
  return { level: 'Fail', normalText: false, largeText: false };
}

function getColorDescription(hsl) {
  let hue = '';
  let saturation = '';
  let lightness = '';

  if (hsl.h >= 0 && hsl.h < 20) hue = 'Rouge';
  else if (hsl.h >= 20 && hsl.h < 40) hue = 'Orange';
  else if (hsl.h >= 40 && hsl.h < 60) hue = 'Jaune-orange';
  else if (hsl.h >= 60 && hsl.h < 80) hue = 'Jaune';
  else if (hsl.h >= 80 && hsl.h < 140) hue = 'Vert';
  else if (hsl.h >= 140 && hsl.h < 200) hue = 'Cyan';
  else if (hsl.h >= 200 && hsl.h < 260) hue = 'Bleu';
  else if (hsl.h >= 260 && hsl.h < 320) hue = 'Violet';
  else if (hsl.h >= 320 && hsl.h < 360) hue = 'Magenta';

  if (hsl.s < 20) saturation = 'grisâtre';
  else if (hsl.s < 50) saturation = 'désaturé';
  else if (hsl.s < 80) saturation = 'moyennement saturé';
  else saturation = 'très saturé';

  if (hsl.l < 20) lightness = 'très sombre';
  else if (hsl.l < 40) lightness = 'sombre';
  else if (hsl.l < 60) lightness = 'moyen';
  else if (hsl.l < 80) lightness = 'clair';
  else lightness = 'très clair';

  return `${hue} ${saturation}, ${lightness}`;
}

function lightenColor(hex, percent) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l = Math.min(100, hsl.l + percent);
  const lighter = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(lighter.r, lighter.g, lighter.b);
}

function darkenColor(hex, percent) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l = Math.max(0, hsl.l - percent);
  const darker = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(darker.r, darker.g, darker.b);
}

module.exports = {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  parseColor,
  getContrast,
  getContrastRatio,
  getWCAGLevel,
  getColorDescription,
  lightenColor,
  darkenColor
};

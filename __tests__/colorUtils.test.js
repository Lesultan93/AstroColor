const {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  parseColor,
  getContrastRatio,
  getWCAGLevel,
} = require('../colorUtils');

describe('colorUtils', () => {
  test('hexToRgb converts hex to RGB object', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
  });

  test('rgbToHex converts RGB to hex string', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
    expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
    expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
  });

  test('rgbToHsl converts RGB to HSL values', () => {
    expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 });
    expect(rgbToHsl(0, 255, 0)).toEqual({ h: 120, s: 100, l: 50 });
    expect(rgbToHsl(0, 0, 255)).toEqual({ h: 240, s: 100, l: 50 });
  });

  test('hslToRgb converts HSL to RGB values', () => {
    expect(hslToRgb(0, 100, 50)).toEqual({ r: 255, g: 0, b: 0 });
    expect(hslToRgb(120, 100, 50)).toEqual({ r: 0, g: 255, b: 0 });
    expect(hslToRgb(240, 100, 50)).toEqual({ r: 0, g: 0, b: 255 });
  });

  describe('parseColor', () => {
    test('parses hex, rgb and hsl strings', () => {
      expect(parseColor('#abcdef')).toBe('#abcdef');
      expect(parseColor('rgb(255, 0, 0)')).toBe('#ff0000');
      expect(parseColor('hsl(120, 100%, 50%)')).toBe('#00ff00');
    });

    test('returns null for invalid input', () => {
      expect(parseColor('not a color')).toBeNull();
    });
  });

  test('getContrastRatio calculates relative contrast', () => {
    const ratio = getContrastRatio('#ffffff', '#000000');
    expect(ratio).toBeCloseTo(21, 1);
    expect(getContrastRatio('#ff0000', '#ff0000')).toBeCloseTo(1, 5);
  });

  test('getWCAGLevel returns correct WCAG ratings', () => {
    expect(getWCAGLevel(7.1).level).toBe('AAA');
    expect(getWCAGLevel(4.6).level).toBe('AA');
    expect(getWCAGLevel(3.2).level).toBe('AA Large');
    expect(getWCAGLevel(2).level).toBe('Fail');
  });
});

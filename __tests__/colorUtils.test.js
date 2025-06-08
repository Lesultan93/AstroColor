const {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  lightenColor,
  darkenColor
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

  test('lightenColor increases lightness', () => {
    expect(lightenColor('#000000', 50)).toBe('#808080');
    expect(lightenColor('#ff0000', 20)).toBe('#ff6666');
  });

  test('darkenColor decreases lightness', () => {
    expect(darkenColor('#ffffff', 50)).toBe('#808080');
    expect(darkenColor('#ff0000', 20)).toBe('#990000');
  });
});

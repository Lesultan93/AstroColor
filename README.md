# AstroColor

AstroColor provides small utility functions for working with colors in JavaScript.

## Installation

Install dependencies using `npm`:

```bash
npm install
```

## Running tests

Execute the test suite with:

```bash
npm test
```

## colorUtils.js

`colorUtils.js` contains helpers for converting colors between formats.
It exports several functions:

- `hexToRgb(hex)` – converts a hex color string like `#ff0000` to an object of red, green and blue values.
- `rgbToHex(r, g, b)` – converts numeric RGB values to a hex color string.
- `rgbToHsl(r, g, b)` – converts numeric RGB values to an object of hue, saturation and lightness.
- `lightenColor(hex, percent)` – lightens a hex color by the given percentage.
- `darkenColor(hex, percent)` – darkens a hex color by the given percentage.

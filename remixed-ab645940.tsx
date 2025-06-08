import React, { useState, useEffect, useCallback } from 'react';
import { Copy, Sun, Moon, Settings, Eye, FileText, Image, Code } from 'lucide-react';

// Icône Astronaute personnalisée
const AstronautIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2Z" fill="currentColor" opacity="0.3"/>
    <path d="M12 4C9.24 4 7 6.24 7 9C7 10.64 7.79 12.09 9 12.97V16H15V12.97C16.21 12.09 17 10.64 17 9C17 6.24 14.76 4 12 4ZM12 11C10.9 11 10 10.1 10 9C10 7.9 10.9 7 12 7C13.1 7 14 7.9 14 9C14 10.1 13.1 11 12 11Z" fill="currentColor"/>
    <rect x="10" y="18" width="4" height="4" rx="1" fill="currentColor"/>
    <circle cx="12" cy="9" r="2" fill="white"/>
  </svg>
);

// Utilitaires de conversion de couleurs
const colorUtils = {
  hexToRgb: (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  rgbToHex: (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },

  rgbToHsl: (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  },

  hslToRgb: (h, s, l) => {
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
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  },

  parseColor: (input) => {
    // Nettoyer l'input
    input = input.trim().toLowerCase();
    
    // Hex
    if (input.startsWith('#')) {
      return input;
    }
    
    // RGB
    const rgbMatch = input.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (rgbMatch) {
      return colorUtils.rgbToHex(
        parseInt(rgbMatch[1]),
        parseInt(rgbMatch[2]),
        parseInt(rgbMatch[3])
      );
    }
    
    // HSL
    const hslMatch = input.match(/hsl\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/);
    if (hslMatch) {
      const rgb = colorUtils.hslToRgb(
        parseInt(hslMatch[1]),
        parseInt(hslMatch[2]),
        parseInt(hslMatch[3])
      );
      return colorUtils.rgbToHex(rgb.r, rgb.g, rgb.b);
    }
    
    return null;
  },

  getContrast: (hex1, hex2) => {
    const rgb1 = colorUtils.hexToRgb(hex1);
    const rgb2 = colorUtils.hexToRgb(hex2);
    
    const l1 = 0.2126 * rgb1.r + 0.7152 * rgb1.g + 0.0722 * rgb1.b;
    const l2 = 0.2126 * rgb2.r + 0.7152 * rgb2.g + 0.0722 * rgb2.b;
    
    return l1 > l2 ? 'white' : 'black';
  },

  // Calculer le ratio de contraste WCAG
  getContrastRatio: (hex1, hex2) => {
    const rgb1 = colorUtils.hexToRgb(hex1);
    const rgb2 = colorUtils.hexToRgb(hex2);
    
    // Calculer la luminance relative
    const getLuminance = (r, g, b) => {
      const [rs, gs, bs] = [r, g, b].map(c => {
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
  },

  // Évaluer le niveau WCAG
  getWCAGLevel: (ratio) => {
    if (ratio >= 7) return { level: 'AAA', normalText: true, largeText: true };
    if (ratio >= 4.5) return { level: 'AA', normalText: true, largeText: true };
    if (ratio >= 3) return { level: 'AA Large', normalText: false, largeText: true };
    return { level: 'Fail', normalText: false, largeText: false };
  },

  getColorDescription: (hsl) => {
    let hue = '';
    let saturation = '';
    let lightness = '';
    
    // Description de la teinte
    if (hsl.h >= 0 && hsl.h < 20) hue = 'Rouge';
    else if (hsl.h >= 20 && hsl.h < 40) hue = 'Orange';
    else if (hsl.h >= 40 && hsl.h < 60) hue = 'Jaune-orange';
    else if (hsl.h >= 60 && hsl.h < 80) hue = 'Jaune';
    else if (hsl.h >= 80 && hsl.h < 140) hue = 'Vert';
    else if (hsl.h >= 140 && hsl.h < 200) hue = 'Cyan';
    else if (hsl.h >= 200 && hsl.h < 260) hue = 'Bleu';
    else if (hsl.h >= 260 && hsl.h < 320) hue = 'Violet';
    else if (hsl.h >= 320 && hsl.h < 360) hue = 'Magenta';
    
    // Description de la saturation
    if (hsl.s < 20) saturation = 'grisâtre';
    else if (hsl.s < 50) saturation = 'désaturé';
    else if (hsl.s < 80) saturation = 'moyennement saturé';
    else saturation = 'très saturé';
    
    // Description de la luminosité
    if (hsl.l < 20) lightness = 'très sombre';
    else if (hsl.l < 40) lightness = 'sombre';
    else if (hsl.l < 60) lightness = 'moyen';
    else if (hsl.l < 80) lightness = 'clair';
    else lightness = 'très clair';
    
    return `${hue} ${saturation}, ${lightness}`;
  }
};

// Générateurs d'harmonies
const harmonyGenerators = {
  complementary: (hsl) => {
    return [{
      ...hsl,
      h: (hsl.h + 180) % 360
    }];
  },

  analogous: (hsl, angle = 30) => {
    // S'assurer que l'angle est suffisant pour éviter les doublons
    const minAngle = Math.max(15, angle);
    return [
      { ...hsl, h: (hsl.h - minAngle + 360) % 360 },
      { ...hsl, h: (hsl.h + minAngle) % 360 }
    ];
  },

  triadic: (hsl) => {
    return [
      { ...hsl, h: (hsl.h + 120) % 360 },
      { ...hsl, h: (hsl.h + 240) % 360 }
    ];
  },

  tetradic: (hsl, mode = 'rectangle') => {
    if (mode === 'square') {
      return [
        { ...hsl, h: (hsl.h + 90) % 360 },
        { ...hsl, h: (hsl.h + 180) % 360 },
        { ...hsl, h: (hsl.h + 270) % 360 }
      ];
    }
    return [
      { ...hsl, h: (hsl.h + 60) % 360 },
      { ...hsl, h: (hsl.h + 180) % 360 },
      { ...hsl, h: (hsl.h + 240) % 360 }
    ];
  },

  splitComplementary: (hsl, angle = 30) => {
    const complement = (hsl.h + 180) % 360;
    return [
      { ...hsl, h: (complement - angle + 360) % 360 },
      { ...hsl, h: (complement + angle) % 360 }
    ];
  },

  monochromatic: (hsl, count = 4) => {
    const colors = [];
    const baseLightness = hsl.l;
    
    // Calculer une plage de luminosité appropriée
    const minL = Math.max(10, baseLightness - 40);
    const maxL = Math.min(90, baseLightness + 40);
    const range = maxL - minL;
    
    // S'assurer qu'on ne génère pas la couleur de base
    const step = range / (count + 1);
    
    for (let i = 1; i <= count; i++) {
      let lightness = minL + (i * step);
      
      // Éviter de générer une couleur trop proche de la base
      if (Math.abs(lightness - baseLightness) < 5) {
        lightness = baseLightness + (lightness > baseLightness ? 10 : -10);
      }
      
      // S'assurer que la luminosité reste dans les limites
      lightness = Math.max(10, Math.min(90, lightness));
      
      colors.push({
        ...hsl,
        l: Math.round(lightness)
      });
    }
    
    // Trier les couleurs du plus clair au plus foncé
    return colors.sort((a, b) => b.l - a.l);
  }
};

export default function AstroColor() {
  const [colorInput, setColorInput] = useState('#3498db');
  const [baseColor, setBaseColor] = useState('#3498db');
  const [mode, setMode] = useState('complementary');
  const [palette, setPalette] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [angle, setAngle] = useState(30);
  const [monoCount, setMonoCount] = useState(4);
  const [tetradMode, setTetradMode] = useState('rectangle');
  const [copiedColor, setCopiedColor] = useState(null);
  const [history, setHistory] = useState([]);
  const [colorDescription, setColorDescription] = useState('');
  const [showContrastMatrix, setShowContrastMatrix] = useState(false);

  // Générer la palette
  const generatePalette = useCallback(() => {
    const rgb = colorUtils.hexToRgb(baseColor);
    if (!rgb) return;
    
    const hsl = colorUtils.rgbToHsl(rgb.r, rgb.g, rgb.b);
    let colors = [];
    
    // Générer la description
    setColorDescription(colorUtils.getColorDescription(hsl));
    
    switch (mode) {
      case 'complementary':
        colors = harmonyGenerators.complementary(hsl);
        break;
      case 'analogous':
        colors = harmonyGenerators.analogous(hsl, angle);
        break;
      case 'triadic':
        colors = harmonyGenerators.triadic(hsl);
        break;
      case 'tetradic':
        colors = harmonyGenerators.tetradic(hsl, tetradMode);
        break;
      case 'splitComplementary':
        colors = harmonyGenerators.splitComplementary(hsl, angle);
        break;
      case 'monochromatic':
        colors = harmonyGenerators.monochromatic(hsl, monoCount);
        break;
    }
    
    const generatedColors = colors.map(hslColor => {
      const rgb = colorUtils.hslToRgb(hslColor.h, hslColor.s, hslColor.l);
      const hex = colorUtils.rgbToHex(rgb.r, rgb.g, rgb.b);
      return {
        hex,
        rgb,
        hsl: hslColor
      };
    });
    
    // Éliminer les doublons en comparant les codes hex
    const uniqueGeneratedColors = generatedColors.filter((color, index, self) => 
      index === self.findIndex(c => c.hex === color.hex) && color.hex !== baseColor
    );
    
    // Calculer les contrastes pour chaque couleur
    const paletteWithContrast = [
      {
        hex: baseColor,
        rgb: colorUtils.hexToRgb(baseColor),
        hsl: hsl,
        contrastWhite: colorUtils.getContrastRatio(baseColor, '#ffffff'),
        contrastBlack: colorUtils.getContrastRatio(baseColor, '#000000')
      },
      ...uniqueGeneratedColors.map(color => ({
        ...color,
        contrastWhite: colorUtils.getContrastRatio(color.hex, '#ffffff'),
        contrastBlack: colorUtils.getContrastRatio(color.hex, '#000000')
      }))
    ];
    
    setPalette(paletteWithContrast);
    
    // Ajouter à l'historique
    const newHistory = [{
      baseColor,
      mode,
      palette: paletteWithContrast,
      timestamp: new Date().toISOString()
    }, ...history.slice(0, 9)];
    setHistory(newHistory);
  }, [baseColor, mode, angle, monoCount, tetradMode, history]);

  // Gérer le changement de couleur
  const handleColorChange = (e) => {
    const value = e.target.value;
    setColorInput(value);
    
    if (value.startsWith('#') && value.length === 7) {
      setBaseColor(value);
    } else {
      const parsed = colorUtils.parseColor(value);
      if (parsed) {
        setBaseColor(parsed);
        setColorInput(parsed);
      }
    }
  };

  // Copier la couleur
  const copyColor = (color) => {
    const formats = {
      hex: color.hex,
      rgb: `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`,
      hsl: `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`
    };
    
    navigator.clipboard.writeText(formats.hex);
    setCopiedColor(color.hex);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  // Créer SVG de la palette
  const createPaletteSVG = () => {
    const width = 800;
    const height = 200;
    const colorWidth = width / palette.length;
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${width}" height="${height}" fill="${darkMode ? '#1f2937' : '#ffffff'}"/>`;
    
    palette.forEach((color, i) => {
      svg += `<rect x="${i * colorWidth}" y="20" width="${colorWidth - 10}" height="120" fill="${color.hex}" rx="8"/>`;
      svg += `<text x="${i * colorWidth + colorWidth/2}" y="165" text-anchor="middle" fill="${darkMode ? '#ffffff' : '#000000'}" font-family="monospace" font-size="14">${color.hex}</text>`;
    });
    
    svg += `</svg>`;
    return svg;
  };

  // Exporter la palette
  const exportPalette = async (format) => {
    let content = '';
    let filename = '';
    let mimeType = '';
    
    switch (format) {
      case 'css':
        content = `:root {\n`;
        palette.forEach((color, i) => {
          const name = i === 0 ? 'base' : `color-${i}`;
          content += `  --${name}: ${color.hex};\n`;
          content += `  --${name}-rgb: ${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b};\n`;
        });
        content += `}`;
        filename = 'astrocolor-palette.css';
        mimeType = 'text/css';
        break;
        
      case 'json':
        content = JSON.stringify({
          name: 'AstroColor Palette',
          mode: mode,
          baseColor: baseColor,
          colors: palette.map((color, i) => ({
            name: i === 0 ? 'base' : `color-${i}`,
            hex: color.hex,
            rgb: `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`,
            hsl: `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`,
            contrast: {
              white: {
                ratio: color.contrastWhite.toFixed(2),
                level: colorUtils.getWCAGLevel(color.contrastWhite).level
              },
              black: {
                ratio: color.contrastBlack.toFixed(2),
                level: colorUtils.getWCAGLevel(color.contrastBlack).level
              }
            }
          }))
        }, null, 2);
        filename = 'astrocolor-palette.json';
        mimeType = 'application/json';
        break;
        
      case 'scss':
        content = palette.map((color, i) => {
          const name = i === 0 ? 'base' : `color-${i}`;
          return `$${name}: ${color.hex};`;
        }).join('\n');
        filename = 'astrocolor-palette.scss';
        mimeType = 'text/plain';
        break;
        
      case 'svg':
        content = createPaletteSVG();
        filename = 'astrocolor-palette.svg';
        mimeType = 'image/svg+xml';
        break;
        
      case 'png':
        // Créer un canvas pour générer le PNG
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 800;
        canvas.height = 200;
        
        // Fond
        ctx.fillStyle = darkMode ? '#1f2937' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Couleurs
        const colorWidth = canvas.width / palette.length;
        palette.forEach((color, i) => {
          ctx.fillStyle = color.hex;
          ctx.roundRect(i * colorWidth + 5, 20, colorWidth - 10, 120, 8);
          ctx.fill();
          
          ctx.fillStyle = darkMode ? '#ffffff' : '#000000';
          ctx.font = '14px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(color.hex, i * colorWidth + colorWidth/2, 165);
        });
        
        // Convertir en blob
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'astrocolor-palette.png';
          a.click();
          URL.revokeObjectURL(url);
        });
        return;
        
      case 'pdf':
        // Générer un PDF simple avec JavaScript
        const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 1000 >>
stream
BT
/F1 24 Tf
50 700 Td
(AstroColor Palette) Tj
ET
BT
/F1 14 Tf
50 650 Td
(Mode: ${mode}) Tj
ET
BT
/F1 14 Tf
50 620 Td
(Base Color: ${baseColor}) Tj
ET
${palette.map((color, i) => `
BT
/F1 12 Tf
50 ${580 - i * 30} Td
(${i === 0 ? 'Base' : `Color ${i}`}: ${color.hex} | RGB: ${color.rgb.r},${color.rgb.g},${color.rgb.b} | HSL: ${color.hsl.h},${color.hsl.s}%,${color.hsl.l}%) Tj
ET`).join('')}
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000260 00000 n
0000000333 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
1383
%%EOF`;
        
        const encoder = new TextEncoder();
        const pdfBytes = encoder.encode(pdfContent);
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const pdfLink = document.createElement('a');
        pdfLink.href = pdfUrl;
        pdfLink.download = 'astrocolor-palette.pdf';
        pdfLink.click();
        URL.revokeObjectURL(pdfUrl);
        return;
    }
    
    if (format !== 'png' && format !== 'pdf') {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Effets
  useEffect(() => {
    generatePalette();
  }, [baseColor, mode, angle, monoCount, tetradMode]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AstronautIcon className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">AstroColor</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Contrôles principaux */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 mb-8`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Aperçu couleur */}
            <div className="space-y-4">
              <label className="block text-sm font-medium">Couleur de base</label>
              <div className="flex items-center space-x-4">
                <div
                  className="w-24 h-24 rounded-lg shadow-inner"
                  style={{ backgroundColor: baseColor }}
                />
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={colorInput}
                    onChange={handleColorChange}
                    placeholder="#3498db, rgb(52,152,219), hsl(204,70%,54%)"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                        : 'bg-white border-gray-300 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                  />
                  <input
                    type="color"
                    value={baseColor}
                    onChange={(e) => {
                      setBaseColor(e.target.value);
                      setColorInput(e.target.value);
                    }}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                  {colorDescription && (
                    <p className="text-sm text-gray-500 italic">
                      {colorDescription}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Sélection du mode */}
            <div className="space-y-4">
              <label className="block text-sm font-medium">Mode d'harmonie</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                    : 'bg-white border-gray-300 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
              >
                <option value="complementary">Complémentaire</option>
                <option value="analogous">Analogues</option>
                <option value="triadic">Triadique</option>
                <option value="tetradic">Tétradique</option>
                <option value="splitComplementary">Complémentaire divisée</option>
                <option value="monochromatic">Monochromatique</option>
              </select>
              
              {/* Description du mode */}
              <p className="text-sm text-gray-500">
                {mode === 'complementary' && 'Couleur opposée sur le cercle chromatique (180°)'}
                {mode === 'analogous' && 'Couleurs adjacentes sur le cercle chromatique'}
                {mode === 'triadic' && 'Trois couleurs équidistantes (120°)'}
                {mode === 'tetradic' && 'Quatre couleurs formant un rectangle ou carré'}
                {mode === 'splitComplementary' && 'Base + deux couleurs adjacentes au complément'}
                {mode === 'monochromatic' && 'Variations de luminosité de la même teinte'}
              </p>
            </div>
          </div>

          {/* Paramètres avancés */}
          {showSettings && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium mb-4">Paramètres avancés</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(mode === 'analogous' || mode === 'splitComplementary') && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Écart angulaire: {angle}°
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="60"
                      value={angle}
                      onChange={(e) => setAngle(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
                
                {mode === 'monochromatic' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Nombre de nuances: {monoCount}
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="8"
                      value={monoCount}
                      onChange={(e) => setMonoCount(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
                
                {mode === 'tetradic' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Disposition</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="rectangle"
                          checked={tetradMode === 'rectangle'}
                          onChange={(e) => setTetradMode(e.target.value)}
                          className="mr-2"
                        />
                        Rectangle
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="square"
                          checked={tetradMode === 'square'}
                          onChange={(e) => setTetradMode(e.target.value)}
                          className="mr-2"
                        />
                        Carré
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Palette générée */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 mb-8`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Palette générée</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => exportPalette('css')}
                className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-1"
              >
                <Code className="w-3 h-3" />
                <span>CSS</span>
              </button>
              <button
                onClick={() => exportPalette('json')}
                className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-1"
              >
                <Code className="w-3 h-3" />
                <span>JSON</span>
              </button>
              <button
                onClick={() => exportPalette('scss')}
                className="px-3 py-1.5 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-1"
              >
                <Code className="w-3 h-3" />
                <span>SCSS</span>
              </button>
              <button
                onClick={() => exportPalette('svg')}
                className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-1"
              >
                <Image className="w-3 h-3" />
                <span>SVG</span>
              </button>
              <button
                onClick={() => exportPalette('png')}
                className="px-3 py-1.5 bg-pink-500 text-white text-sm rounded-lg hover:bg-pink-600 transition-colors flex items-center space-x-1"
              >
                <Image className="w-3 h-3" />
                <span>PNG</span>
              </button>
              <button
                onClick={() => exportPalette('pdf')}
                className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-1"
              >
                <FileText className="w-3 h-3" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {palette.map((color, index) => {
              const wcagWhite = colorUtils.getWCAGLevel(color.contrastWhite);
              const wcagBlack = colorUtils.getWCAGLevel(color.contrastBlack);
              const bestContrast = color.contrastWhite > color.contrastBlack ? 'white' : 'black';
              const bestRatio = Math.max(color.contrastWhite, color.contrastBlack);
              const bestWCAG = bestContrast === 'white' ? wcagWhite : wcagBlack;
              
              return (
                <div
                  key={index}
                  className="group relative cursor-pointer"
                  onClick={() => copyColor(color)}
                >
                  <div
                    className="aspect-square rounded-lg shadow-md transition-transform group-hover:scale-105"
                    style={{ backgroundColor: color.hex }}
                  >
                    {copiedColor === color.hex && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                        <span className="text-white text-sm font-medium">Copié!</span>
                      </div>
                    )}
                    {/* Badge de contraste */}
                    <div className="absolute bottom-1 left-1 right-1 flex justify-center">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        bestWCAG.level === 'AAA' ? 'bg-green-500 text-white' :
                        bestWCAG.level === 'AA' ? 'bg-yellow-500 text-black' :
                        bestWCAG.level === 'AA Large' ? 'bg-orange-500 text-white' :
                        'bg-red-500 text-white'
                      }`}>
                        {bestWCAG.level}
                      </span>
                    </div>
                  </div>
                  <div className={`mt-1 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <p className="font-mono">{color.hex}</p>
                    <p className="opacity-75">RGB: {color.rgb.r},{color.rgb.g},{color.rgb.b}</p>
                    <p className="opacity-75">HSL: {color.hsl.h}°,{color.hsl.s}%,{color.hsl.l}%</p>
                    <p className="opacity-75 font-medium">
                      Contraste: {bestRatio.toFixed(1)}:1 ({bestContrast === 'white' ? '⚪' : '⚫'})
                    </p>
                  </div>
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Copy className="w-3 h-3 text-white drop-shadow-lg" />
                  </div>
                  {index === 0 && (
                    <span className="absolute -top-1 -left-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded text-[10px]">
                      Base
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Historique */}
        {history.length > 0 && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <h2 className="text-xl font-semibold mb-4">Historique récent</h2>
            <div className="space-y-2">
              {history.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    setBaseColor(item.baseColor);
                    setColorInput(item.baseColor);
                    setMode(item.mode);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex -space-x-2">
                        {item.palette.slice(0, 4).map((color, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
                            style={{ backgroundColor: color.hex }}
                          />
                        ))}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{item.mode.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="text-sm opacity-75">{item.baseColor}</p>
                      </div>
                    </div>
                    <Eye className="w-4 h-4 opacity-50" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`mt-16 py-8 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        <p>AstroColor - Générateur d'harmonies colorimétriques</p>
        <p className="mt-2">Créé avec ❤️ pour les designers et développeurs</p>
      </footer>
    </div>
  );
}
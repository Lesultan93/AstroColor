// Export du teaser en MP4 1080 × 1920 (H.264, 30 i/s) — rendu image par image, déterministe.
// Prérequis : Node 18+, Playwright (Chromium) et ffmpeg dans le PATH (ou FFMPEG=/chemin/ffmpeg).
// Usage :
//   node render.mjs                     → export/afg-csw2026-teaser-9x16.mp4
//   node render.mjs --stills 3,8,12     → export/stills/frame-XXs.png (contrôle qualité)
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const here = dirname(fileURLToPath(import.meta.url));
const FPS = 30;
const out = join(here, 'export');
const args = process.argv.slice(2);
const stillsArg = args.includes('--stills') ? args[args.indexOf('--stills') + 1] : null;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(here, 'teaser.html')).href + '?capture=1');
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => Promise.all([...document.images].map(i => i.decode())));
const duration = await page.evaluate(() => window.TEASER_DURATION);
const stage = page.locator('#stage');

if (stillsArg) {
  mkdirSync(join(out, 'stills'), { recursive: true });
  for (const s of stillsArg.split(',').map(Number)) {
    await page.evaluate(t => window.renderAt(t), s);
    await stage.screenshot({ path: join(out, 'stills', `frame-${s.toFixed(1).padStart(4, '0')}s.png`) });
  }
  await browser.close();
  process.exit(0);
}

mkdirSync(out, { recursive: true });
const target = join(out, 'afg-csw2026-teaser-9x16.mp4');
const ffmpeg = spawn(process.env.FFMPEG || 'ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
  '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
  '-map', '0:v', '-map', '1:a', '-shortest',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
  '-profile:v', 'high', '-level', '4.2', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '128k',
  '-movflags', '+faststart', target,
], { stdio: ['pipe', 'inherit', 'inherit'] });

const total = Math.round(duration * FPS);
for (let f = 0; f < total; f++) {
  await page.evaluate(t => window.renderAt(t), f / FPS);
  const buf = await stage.screenshot({ type: 'png' });
  if (!ffmpeg.stdin.write(buf)) await new Promise(r => ffmpeg.stdin.once('drain', r));
  if (f % 150 === 0) console.log(`image ${f}/${total}`);
}
ffmpeg.stdin.end();
await new Promise((res, rej) => ffmpeg.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg ' + c))));
await browser.close();
console.log('OK →', target);

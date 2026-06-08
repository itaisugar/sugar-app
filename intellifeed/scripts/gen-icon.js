// One-off icon generator for Sapience's web "Add to Home Screen" marks.
// Renders an elegant champagne-gold 4-point sparkle on a near-black gradient,
// with a small crimson dot echoing the wordmark's period ("Sapience.").
// Pure pngjs + supersampled anti-aliasing — no native rasteriser needed.
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Brand palette
const BG_TOP = [23, 19, 28];     // #17131C — warm near-black, top
const BG_BOT = [10, 9, 11];      // #0A090B — appBg, bottom
const GOLD_TOP = [240, 224, 180];
const GOLD_MID = [205, 168, 106]; // #CDA86A — champagne gold
const GOLD_BOT = [176, 138, 78];
const CRIMSON = [229, 72, 77];    // #E5484D — primary

const STAR_E = 0.55; // shape exponent (<1 → concave 4-point sparkle)

function gradY(top, bot, t) {
  return [lerp(top[0], bot[0], t), lerp(top[1], bot[1], t), lerp(top[2], bot[2], t)];
}

function drawIcon(size) {
  const png = new PNG({ width: size, height: size });
  const cx = size / 2;
  const cy = size / 2;
  const half = size / 2;
  const starR = 0.60 * half;
  // A small champagne "twinkle" off the main sparkle — subtle, on-palette.
  const dotR = 0.058 * half;
  const dotCx = cx + 0.40 * half;
  const dotCy = cy - 0.34 * half;
  const SS = 4; // supersamples per axis
  const starTop = cy - starR;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Background vertical gradient
      let [r, g, b] = gradY(BG_TOP, BG_BOT, y / (size - 1));

      // Soft radial gold glow behind the sparkle
      const dxg = (x + 0.5 - cx) / half;
      const dyg = (y + 0.5 - cy) / half;
      const dist = Math.sqrt(dxg * dxg + dyg * dyg);
      const glow = Math.exp(-Math.pow(dist / 0.62, 2)) * 0.20;
      r = lerp(r, GOLD_MID[0], glow);
      g = lerp(g, GOLD_MID[1], glow);
      b = lerp(b, GOLD_MID[2], glow);

      // Sparkle coverage (supersampled astroid-like star)
      let starCov = 0;
      let dotCov = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;
          const nx = Math.abs(px - cx) / starR;
          const ny = Math.abs(py - cy) / starR;
          if (Math.pow(nx, STAR_E) + Math.pow(ny, STAR_E) <= 1) starCov++;
          const tnx = Math.abs(px - dotCx) / dotR;
          const tny = Math.abs(py - dotCy) / dotR;
          if (Math.pow(tnx, STAR_E) + Math.pow(tny, STAR_E) <= 1) dotCov++;
        }
      }
      starCov /= SS * SS;
      dotCov /= SS * SS;

      if (starCov > 0) {
        const ts = clamp01((y - starTop) / (2 * starR));
        const sc = ts < 0.5
          ? gradY(GOLD_TOP, GOLD_MID, ts / 0.5)
          : gradY(GOLD_MID, GOLD_BOT, (ts - 0.5) / 0.5);
        r = lerp(r, sc[0], starCov);
        g = lerp(g, sc[1], starCov);
        b = lerp(b, sc[2], starCov);
      }

      if (dotCov > 0) {
        r = lerp(r, GOLD_TOP[0], dotCov);
        g = lerp(g, GOLD_TOP[1], dotCov);
        b = lerp(b, GOLD_TOP[2], dotCov);
      }

      const idx = (size * y + x) << 2;
      png.data[idx] = Math.round(r);
      png.data[idx + 1] = Math.round(g);
      png.data[idx + 2] = Math.round(b);
      png.data[idx + 3] = 255; // opaque — iOS masks corners itself
    }
  }
  return png;
}

function write(size, file) {
  const png = drawIcon(size);
  const out = path.resolve(__dirname, '..', file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  png.pack().pipe(fs.createWriteStream(out)).on('finish', () => console.log('wrote', file));
}

write(180, 'public/icons/apple-touch-icon.png');
write(192, 'public/icons/icon-192.png');
write(512, 'public/icons/icon-512.png');
write(64, 'assets/images/favicon.png');

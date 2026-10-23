// Renders the native splash images (research R17, contracts/splash.md §1): the mascot's first
// animation frame — level 0.6, `excited`, waves at phase 0 — so the in-app AnimatedSplash can take
// over without a visible seam. Keep in sync with src/ui/components/Mascot.tsx (paths) and
// src/ui/theme/tokens.ts (colors). Run with `npm run render:splash` when the mascot art changes.
import { writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const WIDTH_PX = 540; // 3× the 180 pt splash image width
const LEVEL = 0.6;

const BOTTLE =
  'M70 38 h60 v18 q0 10 10 18 q30 22 30 60 v100 q0 36 -36 36 h-68 q-36 0 -36 -36 v-100 q0 -38 30 -60 q10 -8 10 -18 z';
const WAVE_BACK = 'M-100 0 q25 -9 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 V320 H-100 Z';
const WAVE_FRONT = 'M-100 7 q25 -8 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 V320 H-100 Z';

// mascotColors (fixed character colors, identical in both themes).
const m = {
  outline: '#2B4656',
  cap: '#FFC9B6',
  capStripes: '#E9A08A',
  cheeks: '#F6A9BF',
  tongue: '#F4A0B4',
  white: '#FFFFFF',
};

// Theme colors of the bottle (lightColors / darkColors).
const THEMES = {
  'splash-mascot.png': { glass: '#FFFFFF', water: '#9FD8EA', waveBack: '#C4EAF4' },
  'splash-mascot-dark.png': { glass: '#D3E6EC', water: '#7FBFD4', waveBack: '#A6D3E0' },
};

/** Water surface y for a 0..1 level (same formula as Mascot.waterY). */
const waterY = (level) => 278 - Math.min(Math.max(level, 0), 1) * 214;

function mascotSvg({ glass, water, waveBack }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-30 -30 260 320">
  <defs><clipPath id="bottle"><path d="${BOTTLE}"/></clipPath></defs>
  <g fill="none" stroke="${m.outline}" stroke-width="5" stroke-linecap="round">
    <path d="M33 182 q-22 -2 -32 -20"/>
    <path d="M167 182 q22 -2 32 -20"/>
  </g>
  <ellipse cx="74" cy="271" rx="17" ry="8" fill="${m.outline}"/>
  <ellipse cx="126" cy="271" rx="17" ry="8" fill="${m.outline}"/>
  <path d="${BOTTLE}" fill="${glass}"/>
  <g clip-path="url(#bottle)">
    <g transform="translate(0 ${waterY(LEVEL)})">
      <path d="${WAVE_BACK}" fill="${waveBack}"/>
      <g transform="translate(-100 0)"><path d="${WAVE_FRONT}" fill="${water}"/></g>
    </g>
  </g>
  <path d="${BOTTLE}" fill="none" stroke="${m.outline}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M47 132 q2 -24 20 -40" fill="none" stroke="${m.white}" stroke-width="7" stroke-linecap="round" opacity="0.9"/>
  <circle cx="45" cy="150" r="3.5" fill="${m.white}" opacity="0.9"/>
  <rect x="64" y="8" width="72" height="34" rx="13" fill="${m.cap}" stroke="${m.outline}" stroke-width="5"/>
  <g stroke="${m.capStripes}" stroke-width="3" stroke-linecap="round">
    <path d="M84 18 v14"/><path d="M100 18 v14"/><path d="M116 18 v14"/>
  </g>
  <ellipse cx="60" cy="190" rx="10" ry="6" fill="${m.cheeks}" opacity="0.85"/>
  <ellipse cx="140" cy="190" rx="10" ry="6" fill="${m.cheeks}" opacity="0.85"/>
  <circle cx="78" cy="168" r="9.5" fill="${m.outline}"/>
  <circle cx="122" cy="168" r="9.5" fill="${m.outline}"/>
  <circle cx="81.5" cy="164" r="3.4" fill="${m.white}"/>
  <circle cx="125.5" cy="164" r="3.4" fill="${m.white}"/>
  <path d="M86 188 q14 18 28 0 z" fill="${m.outline}" stroke="${m.outline}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M93 195 q7 6 14 0 q-7 -4 -14 0 z" fill="${m.tongue}"/>
</svg>`;
}

for (const [file, colors] of Object.entries(THEMES)) {
  const png = new Resvg(mascotSvg(colors), { fitTo: { mode: 'width', value: WIDTH_PX } })
    .render()
    .asPng();
  writeFileSync(new URL(`../assets/images/${file}`, import.meta.url), png);
  console.log(`assets/images/${file}: ${png.length} bytes`);
}

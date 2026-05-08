/**
 * mapIconUrls.ts
 * SVG data URLs for all map marker icons.
 * Use directly in ArcGIS PictureMarkerSymbol `url` field.
 *
 * Colors:
 *  - Routine   : #34A853 (Google green)
 *  - Warning   : #F9A825 (amber/gold)
 *  - Fine      : #E53935 (red)
 *  - Towing    : #1565C0 (dark navy blue)
 *  - Obstacle  : #F57C00 (deep orange)
 *
 * Icon circle is centered at cy=19 (slightly higher) so the icon sits
 * visually in the "bulge" of the teardrop, with the tip clearly below.
 */

const svgToDataUrl = (svg: string): string => {
  const encoded = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${encoded}`;
};

// ─── 1. Routine — Green teardrop + checkmark ────────────────────────────────
const ROUTINE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="60" viewBox="0 0 48 60">
  <ellipse cx="24" cy="57" rx="6" ry="2.5" fill="rgba(0,0,0,0.18)"/>
  <path d="M24 2C13.507 2 5 10.507 5 21c0 14.25 19 37 19 37S43 35.25 43 21C43 10.507 34.493 2 24 2z"
        fill="#34A853" stroke="#27843f" stroke-width="1.2"/>
  <path d="M17 7 Q24 3 31 9 Q26 5 17 7z" fill="rgba(255,255,255,0.25)"/>
  <circle cx="24" cy="19" r="11" fill="white" opacity="0.97"/>
  <polyline points="17,19 22,25 32,13"
            fill="none" stroke="#34A853" stroke-width="3"
            stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// ─── 2. Warning — Gold teardrop + warning triangle ──────────────────────────
const WARNING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="60" viewBox="0 0 48 60">
  <ellipse cx="24" cy="57" rx="6" ry="2.5" fill="rgba(0,0,0,0.18)"/>
  <path d="M24 2C13.507 2 5 10.507 5 21c0 14.25 19 37 19 37S43 35.25 43 21C43 10.507 34.493 2 24 2z"
        fill="#F9A825" stroke="#c97d00" stroke-width="1.2"/>
  <path d="M17 7 Q24 3 31 9 Q26 5 17 7z" fill="rgba(255,255,255,0.25)"/>
  <circle cx="24" cy="19" r="11" fill="white" opacity="0.97"/>
  <polygon points="24,10 33,27 15,27"
           fill="none" stroke="#F9A825" stroke-width="2.4" stroke-linejoin="round"/>
  <line x1="24" y1="15" x2="24" y2="22"
        stroke="#F9A825" stroke-width="2.4" stroke-linecap="round"/>
  <circle cx="24" cy="25" r="1.3" fill="#F9A825"/>
</svg>`;

// ─── 3. Fine — Red teardrop + document icon ─────────────────────────────────
const FINE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="60" viewBox="0 0 48 60">
  <ellipse cx="24" cy="57" rx="6" ry="2.5" fill="rgba(0,0,0,0.18)"/>
  <path d="M24 2C13.507 2 5 10.507 5 21c0 14.25 19 37 19 37S43 35.25 43 21C43 10.507 34.493 2 24 2z"
        fill="#E53935" stroke="#b71c1c" stroke-width="1.2"/>
  <path d="M17 7 Q24 3 31 9 Q26 5 17 7z" fill="rgba(255,255,255,0.25)"/>
  <circle cx="24" cy="19" r="11" fill="white" opacity="0.97"/>
  <rect x="18.5" y="11" width="11" height="14" rx="1.6"
        fill="none" stroke="#E53935" stroke-width="2"/>
  <path d="M26,11 L29.5,14.5 L26,14.5 Z" fill="#E53935" opacity="0.35"/>
  <line x1="20.5" y1="17" x2="27.5" y2="17" stroke="#E53935" stroke-width="1.6" stroke-linecap="round"/>
  <line x1="20.5" y1="20" x2="27.5" y2="20" stroke="#E53935" stroke-width="1.6" stroke-linecap="round"/>
  <line x1="20.5" y1="23" x2="25"   y2="23" stroke="#E53935" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;

// ─── 4. Towing — Dark navy teardrop + tow truck ─────────────────────────────
const TOWING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="60" viewBox="0 0 48 60">
  <ellipse cx="24" cy="57" rx="6" ry="2.5" fill="rgba(0,0,0,0.18)"/>
  <path d="M24 2C13.507 2 5 10.507 5 21c0 14.25 19 37 19 37S43 35.25 43 21C43 10.507 34.493 2 24 2z"
        fill="#7B1FA2" stroke="#4A148C" stroke-width="1.2"/>
  <path d="M17 7 Q24 3 31 9 Q26 5 17 7z" fill="rgba(255,255,255,0.25)"/>
  <circle cx="24" cy="19" r="11" fill="white" opacity="0.97"/>
  <rect x="27" y="15.5" width="6" height="5" rx="1.1" fill="#7B1FA2"/>
  <rect x="28.1" y="16.4" width="2.6" height="2.6" rx="0.5" fill="white" opacity="0.9"/>
  <rect x="15.5" y="17.5" width="11.5" height="3.2" rx="0.8" fill="#7B1FA2"/>
  <line x1="18.5" y1="17.5" x2="18.5" y2="13"  stroke="#7B1FA2" stroke-width="2" stroke-linecap="round"/>
  <line x1="18.5" y1="13"   x2="23.5" y2="13"  stroke="#7B1FA2" stroke-width="2" stroke-linecap="round"/>
  <path d="M23.5,13 Q25.5,13 25.5,15.5" fill="none" stroke="#7B1FA2" stroke-width="2" stroke-linecap="round"/>
  <circle cx="18.5" cy="22" r="2" fill="#7B1FA2" stroke="white" stroke-width="1"/>
  <circle cx="29"   cy="22" r="2" fill="#7B1FA2" stroke="white" stroke-width="1"/>
</svg>`;

// ─── 5. Obstacle — Orange teardrop + traffic cone ───────────────────────────
const OBSTACLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="60" viewBox="0 0 48 60">
  <ellipse cx="24" cy="57" rx="6" ry="2.5" fill="rgba(0,0,0,0.18)"/>
  <path d="M24 2C13.507 2 5 10.507 5 21c0 14.25 19 37 19 37S43 35.25 43 21C43 10.507 34.493 2 24 2z"
        fill="#F57C00" stroke="#bf360c" stroke-width="1.2"/>
  <path d="M17 7 Q24 3 31 9 Q26 5 17 7z" fill="rgba(255,255,255,0.25)"/>
  <circle cx="24" cy="19" r="11" fill="white" opacity="0.97"/>
  <polygon points="24,10 29.5,27 18.5,27" fill="#F57C00"/>
  <polygon points="22.5,15.5 25.5,15.5 26.7,18.8 21.3,18.8" fill="white" opacity="0.9"/>
  <polygon points="21,21.5 27,21.5 27.8,24.5 20.2,24.5" fill="white" opacity="0.9"/>
  <rect x="17.5" y="27" width="13" height="2.3" rx="1.1" fill="#F57C00"/>
</svg>`;

// ─── 6. Inspector Avatar ─────────────────────────────────────────────────────
const INSPECTOR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
  <circle cx="22" cy="22" r="21" fill="#0070FF" stroke="white" stroke-width="2.5"/>
  <circle cx="22" cy="16" r="6" fill="white"/>
  <path d="M10 38 Q10 28 22 28 Q34 28 34 38" fill="white"/>
</svg>`;

// ─── 7. Start point marker ───────────────────────────────────────────────────
const START_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <circle cx="20" cy="20" r="18" fill="#00C853" stroke="white" stroke-width="2.5"/>
  <polygon points="16,13 30,20 16,27" fill="white"/>
</svg>`;

// ─── 8. End point marker (kept for towing route if needed elsewhere) ─────────
const END_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <circle cx="20" cy="20" r="18" fill="#D50000" stroke="white" stroke-width="2.5"/>
  <rect x="13" y="13" width="14" height="14" rx="2" fill="white"/>
</svg>`;

export const MAP_ICONS = {
  routine: svgToDataUrl(ROUTINE_SVG),
  warning: svgToDataUrl(WARNING_SVG),
  fine: svgToDataUrl(FINE_SVG),
  towing: svgToDataUrl(TOWING_SVG),
  obstacle: svgToDataUrl(OBSTACLE_SVG),
  inspector: svgToDataUrl(INSPECTOR_SVG),
  start: svgToDataUrl(START_SVG),
  end: svgToDataUrl(END_SVG),
} as const;

export type MapIconKey = keyof typeof MAP_ICONS;

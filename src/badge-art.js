// B-184: Albtraum-Abzeichen (Medaille mit Oger-Kopf) als Inline-SVG für Kartenauswahl und Siegbildschirm.
// Nur Zeichnen, keine Spiel-Logik. Bauvorlage docs/design/elemente/Albtraum-Abzeichen.md (Bezugsbox 100 x 100).
// tier: 0 offen (nicht erreicht), 1 Bronze, 2 Silber, 3 Gold. Schatten und Gold-Schein setzt style.css (.badge-shadow, .badge-glow).
import { BADGE_STYLE as B } from './config.js';

const RIBBON = 'M28 55 L18 98 L32 90 L42 100 L48 60 Z M72 55 L82 98 L68 90 L58 100 L52 60 Z';
const HORN_L = 'M33 36 C22 32 15 22 17 9 C24 17 32 21 42 27 Z';
const HORN_R = 'M67 36 C78 32 85 22 83 9 C76 17 68 21 58 27 Z';
const FACE = 'M50 24 C64 24 72 32 72 44 L72 58 C72 72 62 82 50 82 C38 82 28 72 28 58 L28 44 C28 32 36 24 50 24 Z';
const EYE_L = 'M34 47 L47 52 L45 58 L36 56 Z';
const EYE_R = 'M66 47 L53 52 L55 58 L64 56 Z';
const NOSE = 'M46 63 L47 66 M54 63 L53 66';
export const OGRE_MOUTH = 'M37 70 Q50 77 63 70';
const TUSK_L = 'M41 72 L42 63 L46 73 Z';
const TUSK_R = 'M59 72 L58 63 L54 73 Z';
const HEAD = 'translate(12,4) scale(0.76)'; // Kopf im Raster der Scheibe

let uid = 0; // eindeutige Verlaufs-IDs (gleiche IDs in versteckten SVGs würden den Verlauf verlieren)

// Abzeichen als SVG-Text. size = Zielgröße in px; label (optional) = zugänglicher Name, sonst aria-hidden.
export function badgeSvg(size, tier, label = '') {
  const t = Math.max(0, Math.min(B.tiers.length, Math.floor(tier) || 0));
  const px = (v) => +(v * 100 / size).toFixed(2); // Ziel-px in Box-Einheiten
  const small = size <= B.small;
  const cls = ['badge', t ? `t${t}` : 'open'];
  if (size >= B.small) cls.push('badge-shadow');
  if (t === B.tiers.length && size >= B.big) cls.push('badge-glow');
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  let body;
  if (t === 0) {
    const dash = `stroke-dasharray="${px(6)} ${px(5)}"`;
    body = `<circle cx="50" cy="42" r="38" fill="${B.cream}" fill-opacity="0.05" stroke="${B.muted}" stroke-width="${px(3)}" ${dash}/>`;
    if (size >= B.openFace) {
      const line = `fill="none" stroke="${B.muted}" stroke-width="4" stroke-dasharray="6 5" stroke-linejoin="round"`;
      body += `<g transform="${HEAD}" opacity="0.28"><path d="${HORN_L}" ${line}/><path d="${HORN_R}" ${line}/><path d="${FACE}" ${line}/></g>`;
    }
  } else {
    const id = `bdg${++uid}`;
    const [ca, cb] = B.tiers[t - 1];
    const disc = size >= B.big ? 4 : size >= B.small ? 3 : 2;
    const line = small ? 6 : 3.5;
    const eye = small ? 4.2 : 2.45;
    const ink = `stroke="${B.ink}" stroke-linejoin="round"`;
    body = `<defs><radialGradient id="${id}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="${ca}"/><stop offset="1" stop-color="${cb}"/></radialGradient></defs>`
      + `<path d="${RIBBON}" fill="${B.ribbon}" ${ink} stroke-width="${size >= B.big ? 3 : 6}"/>`
      + `<circle cx="50" cy="42" r="38" fill="url(#${id})" ${ink} stroke-width="${px(disc)}"/>`
      + `<path d="M24 30 A30 30 0 0 1 50 12" fill="none" stroke="#fff" stroke-opacity="0.45" stroke-width="${px(3)}" stroke-linecap="round"/>`
      + `<g transform="${HEAD}">`
      + `<path d="${HORN_L}" fill="${B.cream}" ${ink} stroke-width="${line}"/><path d="${HORN_R}" fill="${B.cream}" ${ink} stroke-width="${line}"/>`
      + `<path d="${FACE}" fill="${B.cream}" ${ink} stroke-width="${line}"/>`
      + (small ? '' : `<circle cx="41" cy="53" r="9" fill="${B.eyeGlow}" fill-opacity="0.4"/><circle cx="59" cy="53" r="9" fill="${B.eyeGlow}" fill-opacity="0.4"/>`)
      + `<path d="${EYE_L}" fill="${B.eye}" ${ink} stroke-width="${eye}"/><path d="${EYE_R}" fill="${B.eye}" ${ink} stroke-width="${eye}"/>`
      + (small ? '' : `<path d="${NOSE}" fill="none" stroke="${B.ink}" stroke-width="2.5" stroke-linecap="round"/>`
        + `<path d="${OGRE_MOUTH}" fill="none" stroke="${B.ink}" stroke-width="3" stroke-linecap="round"/>`
        + `<path d="${TUSK_L}" fill="${B.cream}" ${ink} stroke-width="2"/><path d="${TUSK_R}" fill="${B.cream}" ${ink} stroke-width="2"/>`)
      + '</g>';
  }
  return `<svg class="${cls.join(' ')}" width="${size}" height="${size}" viewBox="0 0 100 100" ${a11y}>${body}</svg>`;
}

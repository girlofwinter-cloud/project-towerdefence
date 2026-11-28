// B-194: Albtraum-Look je Karte (Palette, Rand-Deko, Bewegung), eine Datei je Karte. Nur Optik, keine Spielwerte.
// Schnittstelle einer Kartendatei (export default, alle Teile optional):
//   painted:  flache Überschreibung der Kartenpalette (gleiche Schlüssel wie PAINTED_PALETTE in config.js)
//   shapes:   eigene Formen { name: { w, h, svg: (c) => '…', eyes?: [[x, y], …] } } in Entwurfs-px, Fuß unten Mitte;
//             eyes = Augenpaare (Mitte) in Form-Koordinaten, die Bewegungsschicht lässt sie blinzeln
//   frame:    Rand-Deko { big: [...], mid: [...], small: [...], edge: [...] } (Formnamen aus shapes oder pine/round/bare);
//             big: Rahmenwald und Seitenzonen, mid: Seitenzonen (zweite Reihe), small: Reihe 1 (innen, niedrig).
//             Leere Listen = Bäume der normalen Karte in Albtraum-Palette.
//   noCliffs: true = keine Klippen-Plateaus im Rand
//   obstacle: { rock: name, tree: name } Form der Hindernisse (Fels 'rock', Baum 'tree')
//   defs:     zusätzliche <defs>-Inhalte (Verläufe mit Präfix nm-)
//   svgUnder: (scene, palette) => SVG über dem Boden, unter Fluss und Weg (Entwurfs-px, Feld ab 0,0)
//   svgOver:  (scene, palette) => SVG über Weg und Tupfen, unter Licht und Figuren
//   motion:   Bewegung, nach Wichtigkeit sortiert (Arten und Grundwerte: NM_MOTION in config.js, Zeichnen: render-nightmare.js)
//             [{ kind: 'fog'|'fall'|'rise'|'blink'|'glint'|'ripple', count: [desktop, handy], color, … }]
//   embers:   true = Glut am Weg (B-184) als Teil der Bewegung
import meadow from './meadow.js';
import ice from './ice.js';
import fork from './fork.js';
import twin from './twin.js';
import volcano from './volcano.js';

export const NM_MAPS = { meadow, ice, fork, twin, volcano };
const EMPTY = {};
export const nightmareOf = (mapId) => NM_MAPS[mapId] ?? EMPTY;

// Gegner im Flat-Pop-Stil (B-065): Goblin, Flitzer, Panzer-Troll; B-066: Schamane, Schildträger; B-067: Oger-König. Nur Darstellung.
// Gezeichnet wird in Design-Pixeln bei Radius `ref` (ENEMY_STYLE); der Aufrufer arbeitet in Radius-Einheiten,
// daher skaliert beginFigure mit 1/ref. Blick nach +x, Boden bei y ~ +0.8 Radien.
import { ENEMY_STYLE as ES, ENEMY_TYPES } from './config.js';
import { poly, rr, ell, line, lit, shd } from './draw-utils.js';

const W = ES.outlineWidth;

function beginFigure(ctx, ref, phase, bobFactor = 1) {
  ctx.save();
  ctx.scale(1 / ref, 1 / ref);
  ctx.translate(0, -Math.abs(Math.sin(phase)) * ES.bob * bobFactor);
}

// Beinstummel: Fuß schwingt mit der Phase, hebt sich im Vorschwung (x = Mitte, y = Hüfte)
function stub(ctx, x, y, w, h, phase, color) {
  const sw = Math.sin(phase) * ES.legSwing;
  const lift = Math.max(0, Math.cos(phase)) * ES.legLift;
  rr(ctx, x - w / 2 + sw, y, w, h - lift, w * 0.4, color, W);
}

// Großes Auge mit Rand und Glanzpunkt (Mitte x, y; Halbachsen rx, ry)
function eye(ctx, x, y, rx, ry) {
  ell(ctx, x, y, rx, ry, ES.eyeRim, W * 0.7);
  ctx.fillStyle = ES.eyeDark;
  ctx.beginPath();
  ctx.arc(x + rx * 0.3, y + ry * 0.1, rx * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ES.eyeRim;
  ctx.beginPath();
  ctx.arc(x + rx * 0.5, y - ry * 0.25, rx * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

// Goblin: grüner Kopf mit Spitzohren, braune Tunika, Beinstummel
export function drawGruntFlat(ctx, phase) {
  const c = ES.grunt;
  beginFigure(ctx, c.ref, phase);
  stub(ctx, -3, 4, 3.4, 5, phase + Math.PI, shd(c.skin, 0.25));
  stub(ctx, 3.2, 4, 3.6, 5, phase, c.skin);
  ell(ctx, -1, 2, 5.6, 4.6, c.tunic, W);
  line(ctx, [[-4.5, 3.5], [2.5, 3.5]], c.belt, 1);
  poly(ctx, [[-4, -5], [-7.5, -7], [-4.5, -7.5]], shd(c.skin, 0.1), W); // Ohr hinten
  ell(ctx, 1.5, -3.6, 7.2, 5.8, c.skin, W);                             // Kopf
  poly(ctx, [[-1, -8], [-3.5, -11.4], [1.5, -9.2]], lit(c.skin, 0.05), W);  // Ohr oben
  ell(ctx, 8.4, -2, 1.9, 1.6, shd(c.skin, 0.1), W * 0.7);                 // Nase
  eye(ctx, 4.8, -4.6, 2.5, 2.9);
  line(ctx, [[2.4, -8], [7.2, -6.6]], ES.browColor, 1.2);                 // Braue (böse)
  line(ctx, [[3.2, -0.3], [7, -0.6]], ES.browColor, 0.9);                 // Mund
  ctx.restore();
}

// Flitzer: schlanke Gestalt in Streckhaltung, dunkler Anzug, Mütze, Windstreifen
export function drawRunnerFlat(ctx, phase) {
  const c = ES.runner;
  beginFigure(ctx, c.ref, phase);
  line(ctx, [[-7.5, -2.5], [-5.5, -2.5]], c.streak, 1.2);
  line(ctx, [[-9, 0.5], [-5, 0.5]], c.streak, 1.2);
  line(ctx, [[-8, 3.5], [-5.5, 3.5]], c.streak, 1.2);
  stub(ctx, -2.5, 3, 2.8, 4.5, phase + Math.PI, shd(c.skin, 0.25));
  stub(ctx, 2.2, 3, 3, 4.5, phase, c.skin);
  ctx.save();
  ctx.rotate(-0.3);
  ell(ctx, -0.5, 0.5, 6.2, 3.4, c.suit, W);                              // Oberkörper nach vorn gelehnt
  ctx.restore();
  ell(ctx, 4.6, -4.6, 4.7, 4.3, c.skin, W);                              // Kopf
  poly(ctx, [[0.8, -6.2], [-1.5, -9], [3.8, -8.4], [7, -6.6]], c.cap, W); // Mütze mit Zipfel
  eye(ctx, 6.4, -4.4, 1.9, 2.2);
  line(ctx, [[4.4, -6.7], [8, -6]], ES.browColor, 1);
  ctx.restore();
}

// Panzer-Troll: breiter roter Körper, Rückenpanzer, Helm, Hauer, Schild
export function drawTankFlat(ctx, phase) {
  const c = ES.tank;
  beginFigure(ctx, c.ref, phase, 0.6);
  stub(ctx, -5.5, 7, 5.4, 4.5, phase, c.plateDark);
  stub(ctx, 5.5, 7, 5.4, 4.5, phase + Math.PI, c.plateDark);
  ell(ctx, -4, 0.5, 8, 7.4, c.plateDark, W);                             // Panzerkuppel auf dem Rücken
  rr(ctx, -11, -2, 22, 11, 4, c.skin, W);                                // Körper
  rr(ctx, -8, -1, 7, 9, 2, c.plate, W);                                  // Brustplatte
  ell(ctx, 3, -7.4, 6.6, 5.6, c.skin, W);                                // Kopf
  rr(ctx, -3, -14, 13, 5.2, 2.2, c.plateDark, W);                        // Helm
  eye(ctx, 6.4, -6.6, 2.3, 2.6);
  line(ctx, [[3.8, -9.4], [8.8, -8]], ES.browColor, 1.2);
  poly(ctx, [[6.6, -2.4], [9.6, -0.6], [5.2, -1.4]], c.tusk, W * 0.7);   // Hauer
  rr(ctx, 7.5, -2.5, 5, 14, 2, c.plate, W);                              // Schild vorn
  ctx.fillStyle = c.tusk;
  ctx.beginPath();
  ctx.arc(10, 4.5, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Schamane: Robe mit Kapuze, Stab mit pulsierender Heilkugel (Kreuz-Symbol)
export function drawHealerFlat(ctx, phase, time = 0) {
  const c = ES.healer;
  beginFigure(ctx, c.ref, phase, 0.8);
  line(ctx, [[6.5, 8], [6.5, -5]], c.staff, 1.4);                              // Stab hinter der Robe
  stub(ctx, -2.5, 6.5, 3.4, 3, phase + Math.PI, c.robeDark);
  stub(ctx, 2.5, 6.5, 3.4, 3, phase, c.robeDark);
  poly(ctx, [[-6.5, 8], [6, 8], [3, -2], [-3.5, -2]], c.robe, W);          // Robe (unten breiter)
  poly(ctx, [[-2, 8], [2, 8], [1.2, 0], [-1.2, 0]], c.robeDark, 0);        // Falte
  ell(ctx, 0, -4.6, 4.8, 4.8, c.skin, W);                                    // Kapuze
  ell(ctx, 2.2, -4.6, 3.2, 3.4, c.face, W * 0.7);                          // Gesicht
  eye(ctx, 3.2, -4.8, 1.5, 1.8);
  const r = c.orbRadius + Math.sin(time * c.orbSpeed) * c.orbPulse;
  ell(ctx, 6.5, -7.5, r, r, c.orb, W);                                       // Leuchtkugel
  line(ctx, [[6.5, -7.5 - r * 0.6], [6.5, -7.5 + r * 0.6]], c.cross, 0.9);     // Heilkreuz
  line(ctx, [[6.5 - r * 0.6, -7.5], [6.5 + r * 0.6, -7.5]], c.cross, 0.9);
  ctx.restore();
}

// Schildträger: kleine Gestalt mit Helm hinter einem großen Schild (Wappenkreuz) vorn
export function drawShieldedFlat(ctx, phase) {
  const c = ES.shielded;
  beginFigure(ctx, c.ref, phase, 0.6);
  stub(ctx, -4.5, 7, 4.2, 4.5, phase, c.body);
  stub(ctx, 1.5, 7, 4.2, 4.5, phase + Math.PI, c.body);
  ell(ctx, -3, 1.5, 6.4, 6.4, c.body, W);                                  // Körper
  ell(ctx, -2, -6, 4.8, 4.8, c.skin, W);                                   // Kopf
  rr(ctx, -7, -11.2, 10, 4.4, 2, c.helm, W);                               // Helm
  eye(ctx, 1.4, -5.6, 1.8, 2.1);
  poly(ctx, [[2, -8], [11.5, -8], [11.5, 1], [6.8, 10.5], [2, 1]], c.rim, W); // Schild: Rand
  poly(ctx, [[3.6, -6.4], [9.9, -6.4], [9.9, 0.4], [6.8, 7.6], [3.6, 0.4]], c.shield, W * 0.5);
  line(ctx, [[6.8, -5], [6.8, 4.5]], c.emblem, 1.3);                       // Wappenkreuz
  line(ctx, [[4.6, -1.5], [9, -1.5]], c.emblem, 1.3);
  ctx.restore();
}

// Boss: Design-Pixel sind sizeFactor-mal so groß wie beim Goblin (Weltpixel je Design-Pixel = radius / ref)
export const BOSS_REF = ENEMY_TYPES.boss.radius / (ES.boss.sizeFactor * ENEMY_TYPES.grunt.radius / ES.grunt.ref);

// Oger-König: violetter Riese mit goldener Krone, Keule und pulsierender Aura
export function drawBossFlat(ctx, phase, time = 0) {
  const c = ES.boss;
  beginFigure(ctx, BOSS_REF, phase, 0.6);
  const ar = c.auraRadius + Math.sin(time * c.auraSpeed) * c.auraPulse;
  ctx.fillStyle = c.aura;                                                   // Aura hinter der Figur
  ctx.beginPath();
  ctx.arc(0, 0, ar, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = c.auraRing;
  ctx.lineWidth = c.auraWidth;
  ctx.stroke();
  stub(ctx, -3.8, 5.5, 4.4, 4.5, phase + Math.PI, shd(c.skin, 0.25));
  stub(ctx, 3.6, 5.5, 4.6, 4.5, phase, c.skin);
  ell(ctx, -7.2, 0.5, 2.6, 3.6, shd(c.skin, 0.2), W);                       // Arm hinten
  ell(ctx, -0.3, 1, 8.4, 7, c.skin, W);                                     // Körper
  ell(ctx, 1.2, 2.6, 4.8, 3.8, c.belly, W * 0.6);                           // Bauch
  poly(ctx, [[-7.4, 4.2], [6.8, 4.2], [5.4, 8], [-6, 8]], c.fur, W);        // Fellschurz
  line(ctx, [[7.8, 2.4], [10.4, -3.6]], shd(c.club, 0.3), 2.2);                // Keulengriff
  poly(ctx, [[9.2, -2.6], [12.8, -4.6], [12.6, -8.2], [10, -9.4], [8.2, -6]], c.club, W); // Keulenkopf
  ell(ctx, 11, -6.6, 0.9, 0.9, c.stud, W * 0.5);                           // Nieten
  ell(ctx, 9.8, -4.4, 0.8, 0.8, c.stud, W * 0.5);
  ell(ctx, 7.6, 2.2, 2.8, 2.6, c.skin, W);                                  // Faust vorn
  ell(ctx, 2.6, -5, 5.6, 4.4, lit(c.skin, 0.18), W);                        // Kopf (tief zwischen den Schultern)
  poly(ctx, [[4.2, -2.2], [5, -4.8], [5.9, -2.2]], c.tusk, W * 0.6);        // Hauer
  poly(ctx, [[6.6, -2.4], [7.5, -4.6], [8.1, -2.2]], c.tusk, W * 0.6);
  eye(ctx, 5.4, -5.6, 1.8, 2);
  line(ctx, [[3, -8.2], [7.8, -7]], ES.browColor, 1.5);                     // Braue (grimmig)
  poly(ctx, [[-1.6, -8.4], [-1.8, -12], [0.4, -10.4], [2.4, -12.8], [4.2, -10.4], [6.2, -12], [6.4, -8.6]], c.gold, W); // Krone
  ell(ctx, 2.4, -9.6, 0.9, 0.9, c.jewel, W * 0.5);                          // Edelstein
  ctx.restore();
}

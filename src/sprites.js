// Stil 1: Zwischenspeicher für gezeichnete Figuren (Türme, Gegner). Jede Figur wird je Schlüssel
// (Typ, Stufe, Pixeldichte) genau einmal auf ein eigenes Canvas gezeichnet; danach nur noch drawImage.
// Ohne Canvas (Node, Tests ohne Fabrik) liefert sprite() null, dann zeichnet der Aufrufer direkt.

const cache = new Map();
export const spriteStats = { builds: 0 };

const hasCanvas = () => (typeof document !== 'undefined' && !!document.createElement) || typeof OffscreenCanvas !== 'undefined';
function defaultFactory(w, h) {
  if (typeof document !== 'undefined' && document.createElement) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  return null;
}
let factory = defaultFactory;

// Für Tests: eigene Canvas-Fabrik setzen (null = keine Sprites); leert den Speicher
export function setSpriteFactory(f) {
  factory = f === undefined ? defaultFactory : f;
  cache.clear();
}

// Pixeldichte des Ziels aus der aktuellen Transformation (Canvas-Maßstab, Vollbild-DPR), in halben Stufen
export function dprOf(ctx) {
  const m = typeof ctx.getTransform === 'function' ? ctx.getTransform() : null;
  const s = m ? Math.hypot(m.a, m.b) : 1;
  return Number.isFinite(s) && s > 0 ? Math.min(4, Math.max(1, Math.ceil(s * 2) / 2)) : 1;
}

// box: [x0, y0, x1, y1] in Figur-Koordinaten; scale: Figur-Einheit -> Pixel (inkl. DPR).
// paint(c) zeichnet in Figur-Koordinaten. Rückgabe: { canvas, box } oder null.
export function sprite(key, box, scale, paint) {
  if (!factory || (factory === defaultFactory && !hasCanvas())) return null; // Node ohne Canvas: direkt zeichnen
  const hit = cache.get(key);
  if (hit) return hit;
  const w = Math.max(1, Math.ceil((box[2] - box[0]) * scale));
  const h = Math.max(1, Math.ceil((box[3] - box[1]) * scale));
  const canvas = factory(w, h);
  if (!canvas) return null;
  const c = canvas.getContext('2d');
  if (!c) return null;
  c.setTransform(scale, 0, 0, scale, -box[0] * scale, -box[1] * scale);
  paint(c);
  const s = { canvas, box, w: w / scale, h: h / scale };
  cache.set(key, s);
  spriteStats.builds++;
  return s;
}

// Sprite in Figur-Koordinaten zeichnen (die Transformation setzt der Aufrufer)
export function drawSprite(ctx, s) {
  ctx.drawImage(s.canvas, s.box[0], s.box[1], s.w, s.h);
}

// Geometrie des Gegner-Pfades (reine Funktionen, ohne DOM -> gut testbar).

export function buildPath(waypoints, tile) {
  const points = waypoints.map(([c, r]) => ({ x: (c + 0.5) * tile, y: (r + 0.5) * tile }));
  const segments = [];
  let length = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segments.push({ a, b, len, start: length });
    length += len;
  }
  return { points, segments, length };
}

// Position auf dem Pfad nach Strecke d (in Pixeln).
export function pointAt(path, d) {
  if (d <= 0) return { ...path.points[0] };
  for (const s of path.segments) {
    if (d <= s.start + s.len) {
      const t = (d - s.start) / s.len;
      return { x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t };
    }
  }
  return { ...path.points[path.points.length - 1] };
}

// Alle Kacheln, über die der Pfad läuft, als Set von "spalte,zeile".
// Erwartet achsenparallele Segmente.
export function pathTiles(waypoints) {
  const tiles = new Set();
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [c1, r1] = waypoints[i];
    const [c2, r2] = waypoints[i + 1];
    const dc = Math.sign(c2 - c1);
    const dr = Math.sign(r2 - r1);
    let c = c1;
    let r = r1;
    tiles.add(`${c},${r}`);
    while (c !== c2 || r !== r2) {
      c += dc;
      r += dr;
      tiles.add(`${c},${r}`);
    }
  }
  return tiles;
}

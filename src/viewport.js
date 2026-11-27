// C6 Handy: Feld seitlich wischen (Hochformat), Zoom-Knopf Nah/Übersicht, Wisch-Hinweis und Schattenkanten.
// Die Lage rechnet style.css (Media-Blöcke am Ende); hier nur Bedienung. Reine Funktionen oben sind in Node testbar,
// mountViewport braucht das DOM und wird nur von main.js aufgerufen.
import { VIEWPORT } from './config.js';

// Gültige Wisch-Position: 0 … (Inhaltsbreite − sichtbare Breite), nie negativ.
export function clampScroll(left, contentW, viewW) {
  const max = Math.max(0, contentW - viewW);
  if (!Number.isFinite(left)) return 0;
  return Math.max(0, Math.min(max, left));
}

// Weiter wischbar nach links/rechts? (1 px Toleranz wegen gebrochener Pixel)
export function scrollEdges(left, contentW, viewW) {
  return { canLeft: left > 1, canRight: left < contentW - viewW - 1 };
}

// Tipp oder Wischen: Bewegung des Fingers (dx, dy) und Verschiebung des Feldes (scrolled) in CSS-px.
// Ab VIEWPORT.tapSlop zählt es als Wischen, dann darf der Klick nicht bauen.
export function gestureKind(dx, dy, scrolled = 0, slop = VIEWPORT.tapSlop) {
  return Math.hypot(dx, dy) >= slop || Math.abs(scrolled) >= slop ? 'swipe' : 'tap';
}

// Mausziehen (schmales Fenster ohne Touch): neue Wisch-Position aus Startposition und Bewegung
export function dragScroll(startLeft, dx, contentW, viewW) {
  return clampScroll(startLeft - dx, contentW, viewW);
}

// ---------- DOM ----------
// board = #app, stage = .stage (Scroll-Behälter), canvas = #game, zoomBtn = #zoom.
export function mountViewport({ board, stage, canvas, zoomBtn, zoomLabel }) {
  // Wisch-Hinweis und Schattenkanten (nur im Hochformat sichtbar, style.css)
  const hint = document.createElement('div');
  hint.className = 'swipe-hint';
  hint.setAttribute('aria-hidden', 'true');
  hint.innerHTML = 'Wischen für mehr Feld <span class="swipe-arrow">⟷</span>';
  const edges = document.createElement('div');
  edges.className = 'vp-edges';
  edges.setAttribute('aria-hidden', 'true');
  board.append(hint, edges);

  const updateEdges = () => {
    const e = scrollEdges(stage.scrollLeft, stage.scrollWidth, stage.clientWidth);
    board.classList.toggle('can-left', e.canLeft);
    board.classList.toggle('can-right', e.canRight);
  };
  stage.addEventListener('scroll', () => {
    if (stage.scrollLeft > 0) board.classList.add('swiped'); // Hinweis verschwindet nach dem ersten Wischen
    updateEdges();
  }, { passive: true });
  if (typeof ResizeObserver === 'function') new ResizeObserver(updateEdges).observe(stage);
  window.addEventListener('resize', updateEdges);
  updateEdges();

  // Tipp oder Wischen: Start merken, Klick danach nur durchlassen, wenn es ein Tipp war (Capture vor main.js)
  let down = null;
  stage.addEventListener('pointerdown', (ev) => {
    if (ev.target !== canvas) return;
    down = { x: ev.clientX, y: ev.clientY, left: stage.scrollLeft, mouse: ev.pointerType === 'mouse', id: ev.pointerId, moved: 0 };
  });
  stage.addEventListener('pointermove', (ev) => {
    if (!down || ev.pointerId !== down.id) return;
    const dx = ev.clientX - down.x;
    down.moved = Math.max(down.moved, Math.hypot(dx, ev.clientY - down.y));
    // Maus: Ziehen verschiebt das Feld (Touch wischt der Browser selbst, touch-action: pan-x)
    if (down.mouse && (ev.buttons & 1) && stage.scrollWidth > stage.clientWidth && gestureKind(dx, 0) === 'swipe') {
      stage.scrollLeft = dragScroll(down.left, dx, stage.scrollWidth, stage.clientWidth);
    }
  });
  stage.addEventListener('click', (ev) => {
    if (!down || ev.target !== canvas) return;
    const kind = gestureKind(down.moved, 0, stage.scrollLeft - down.left);
    down = null;
    if (kind === 'swipe') { ev.stopPropagation(); ev.preventDefault(); }
  }, true);
  stage.addEventListener('pointercancel', () => { down = null; }); // Browser hat das Wischen übernommen

  // Zoom-Knopf: Standard Nah, Knopf schaltet auf Übersicht (ganzes Feld) und zurück
  function setOverview(on) {
    board.classList.toggle('zoomed-out', on);
    zoomBtn.setAttribute('aria-pressed', String(on));
    zoomBtn.setAttribute('aria-label', on ? 'Nah' : 'Übersicht');
    zoomBtn.title = on ? 'Nah' : 'Übersicht';
    if (zoomLabel) zoomLabel.textContent = on ? 'Nah' : 'Übersicht';
    stage.scrollLeft = 0;
    updateEdges();
  }
  zoomBtn.addEventListener('click', () => setOverview(!board.classList.contains('zoomed-out')));
  setOverview(false);
  return { setOverview, updateEdges };
}

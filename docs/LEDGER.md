# Ledger (Entscheidungsbuch)

Das Ledger beantwortet später: **Wer hat was warum entschieden, und mit welchem Ergebnis?**
Neue Einträge unten anhängen, bestehende nie ändern (append-only). Ältere Einträge: `docs/archiv/LEDGER-bis-2026-11-27.md`.
Anhängen ohne die Datei zu lesen: `cat >> docs/LEDGER.md <<'EOF' … EOF`. Überschriften suchen: `grep "^## " docs/LEDGER.md docs/archiv/LEDGER-*.md`.

## Format (drei bis fünf Zeilen)
```
## <JJJJ-MM-TT> · <Backlog-IDs> · <Titel>
- Ergebnis: fertig | blockiert, Branch agent/<name>, PR #<nr>
- Tests: npm test <n> grün (Balancing/E2E falls gelaufen)
- Entscheidungen/Abweichungen: Warum so? Review-Urteil, falls gelaufen
- Offen: Was bleibt für Menschen? (nur wenn etwas offen ist)
```

---

## 2026-11-27 · Ablauf · Schlanker Ablauf (Tokens und Wartezeit sparen)
- Ergebnis: fertig, Branch agent/schlanker-ablauf. Balancing-Simulationen nach `tests/balance/` (4 Dateien + `sim.js`), `npm test` 1,2 s statt 29 s, neu `npm run test:balance` (ca. 9 s). Ledger archiviert, Vorschläge von BACKLOG nach `docs/IDEEN.md`, Pipeline-Skill als ein Ablauf, reviewer ohne PR-Modus, designer standardmäßig 4 bis 6 Screenshots.
- Tests: npm test 520 grün, test:balance 18 grün; Testcode nur verschoben (normalisierter Vergleich identisch).
- Entscheidungen: Freigegeben vom Menschen ("alles in einem Block"). Stop-Hook und CI-Schritt sind geschützt, dafür liegt ein Patch bereit, den der Mensch anwendet. Bis dahin läuft test:balance nicht in der CI, darum erst nach dem Patch mergen.
- Offen: Patch für `.claude/hooks/test-gate.mjs` und `.github/workflows/ci.yml` anwenden, PR mergen (Mensch).

## 2026-11-27 · B-137 · Handy-Layout Querformat Vollbild
- Ergebnis: fertig, Branch agent/handy-quer. Handy nur Querformat: Feld in voller Höhe, Landschaft bis zum Rand, Bedienung schwebt in den Ecken, Safe-Area frei; Hochformat mit Touch zeigt "Bitte Handy drehen", pausiert, `#app` inert. Wischen und Zoom auf dem Handy entfernt.
- Tests: npm test 523 grün, e2e 88 grün (lokal ohne test:balance, Vorgabe Mensch). Handy-e2e neu geschrieben, buttons/panel/panel-polish/ring/smoke auf Querformat bzw. Fenster ohne Touch umgestellt, neu `handy-randfaelle.test.mjs` (tester).
- Entscheidungen: Mensch hat Testumbau und Merge freigegeben. Review APPROVE; tester fand Überlappung mit Safe-Area, behoben (Feld wird bei Notch etwas kleiner). Schmale Desktop-Fenster im Hochformat ohne Touch zeigen jetzt das alte Kompakt-Layout statt Wischen (bewusst). Kacheln quer ca. 28 px statt 44 px, folgt aus der Entscheidung.
- Offen: B-177 in IDEEN (Wisch-Helfer entfernen, Token für Bedienspalte).

## 2026-11-27 · B-177 · Ungenutzte Wisch-Helfer entfernt
- Ergebnis: fertig, Branch agent/wisch-aufraeumen. `src/viewport.js` und `VIEWPORT.tapSlop` entfernt, 4 Unit-Tests dazu gelöscht (vom Menschen freigegeben). Token `size-side-col-mobile` (104 px) im Design-System.
- Tests: npm test 519 grün, Handy-e2e 18 grün. Review APPROVE (ohne Tester, kleiner Diff).
- Entscheidungen: `--col` in style.css bleibt 104px mit Token-Kommentar, weil index.html tokens.css nicht lädt (wie bei den anderen Tokens).

## 2026-11-27 · B-177 · Nummer umbenannt
- Ergebnis: fertig, Branch agent/nummer-b177. Aufräum-Eintrag "Wisch-Helfer entfernen" von B-167 in B-177 umbenannt (Archiv und Ledger), weil B-167 bis B-176 von der Gegner-Reihe belegt sind. Entscheidung Mensch; PR #106 trägt noch den alten Titel.
## 2026-11-27 · B-167, B-168, B-169, B-170, B-171 · Neue Gegner für Turm-Vielfalt
- Ergebnis: fertig, Branch agent/gegner-vielfalt (PR folgt)
- Tests: npm test 557 grün, test:balance 20 grün, e2e 88 grün; Tester PASS, Reviewer APPROVE
- Entscheidungen: Fledermaus/Irrlicht/Panzerkäfer/Glutling; Kanone+Frost gewinnt nirgends mehr ohne Lebensverlust; Kartenfaktoren Eiswelt/Zwei Fronten und Teständerungen vom Menschen freigegeben; zwei developer parallel, designer für Figuren
- Offen: Fledermaus nimmt Lava-Schaden (Frage); Effekte ohne Logik-Ereignis (Dampf bei Frostturm-Treffer, Splitter je Schicht, Irrlicht-Zucken)

## 2026-11-27 · B-178, B-179 · Vollbild auf dem Handy (Knopf und Web-App)
- Ergebnis: fertig, Branch agent/vollbild. Runder Knopf „Vollbild“ (Fullscreen-API mit webkit-Präfix, auf Touch-Geräten Querformat festgehalten), nur sichtbar, wo der Browser es kann; Handy-Querformat in der freien Ecke links neben Ton. Web-App-Manifest (display fullscreen, landscape) plus Apple-Meta und Symbole 180/192/512 aus der Burg des Startbildschirms.
- Tests: npm test grün, test:e2e grün (neu tests/fullscreen.test.js, tests/e2e/vollbild.test.mjs).
- Entscheidungen: iPhone-Safari kann kein Vollbild für Seiten, dort nur „Zum Home-Bildschirm“. Kartenwahl am Desktop rückt um einen Knopf nach links. Kein Balancing berührt.

### 2026-11-27 – Vollbild bei Kartenwahl (Handy)
- Chromes Vollbild-Hinweis blieb ~15 s im laufenden Spiel stehen.
- Handy: Vollbild jetzt schon beim Tippen auf eine Karte (`fullscreen.enter`, schaltet nur ein); Knopf bleibt.
- Test in tests/fullscreen.test.js; e2e 91/91 grün.

### 2026-11-27 – Live-Umgebung auf Cloudflare Pages
- Neue Adresse https://towerdefence.pages.dev/ ohne GitHub-Namen (Mensch hat Cloudflare eingerichtet).
- docs/LERNEN.md angepasst; GitHub Pages/pages.yml abschalten macht der Mensch.

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

### 2026-11-27 – Stufe 3 als Verwandlung, fordernde Gegner, Nekromantin als Endboss (B-173 bis B-176, B-179, B-180)
- Stufe-3-Fähigkeiten (Mehrfachschuss, Gewitter, Brandfläche, Eisboden, Markieren) mit neuen Endstufen-Figuren und Effekten; Elite-Gegner ab Welle 10 (Schild/Heilung), Nekromantin mit Phase 2, Boss-Leiste, Welle 20 mit 2 Ogern + Nekromantin.
- Balancing am Ende: HP-Zuwachs spät 1,12, Fledermäuse bis 9 (20 HP, Vulkan 0,9), kein Extra in Welle 8; vom Menschen freigegebene Test-Änderungen: Nekromantin Welle 15+20, Vulkan-Fenster 1-7, Welle-10-Fledermäuse 4, drei Stufe-3-Optik-Tests, ELITE.from 10.
- Zwei developer + designer parallel, Tester/Reviewer einmal über den Block; unit 633, balance 20, e2e 98 grün.

### 2026-11-27 – Stufe 3 entschärft, Spiel mit Aufrüsten als Maßstab
- Spieltest: Endstufen zu stark (4 Endstufen in Welle 10, 860 Gold übrig); Simulation hat Aufrüsten nie gemessen.
- Stufe 3: Schaden 1,9x statt 2,25x (LEVEL_DAMAGE), Schritt 2->3 kostet 2x Baupreis; HP-Zuwachs ab Welle 11 1,16; perfektes Spiel rüstet auf; neuer Test gegen übermächtige Stufe 3.
- Freigegebene Test-Änderungen: Kanonen-Mix darf ab Welle 15 verlieren (Wiese, Zangenangriff, Vulkan), Zwei Fronten ab 13, Kanone zuerst (fork) ab 14, hpScale-Vergleich mit der Mitte; Vollbild-e2e wartet. unit 633, balance 21, e2e 98 grün.
- Nachtrag: Max (2->3) kostet 3x Baupreis (Wunsch des Menschen), dafür Spätphase 1,14 statt 1,16; perfektes Spiel je Karte eigene Turmzahl vor dem Aufrüsten.

### 2026-11-28 – Handy quer in Safari mit Leisten
- Bug (nur über towerdefence.pages.dev im normalen Safari-Tab): bei ca. 300 px Höhe lag die HUD-Plakette über dem Kanonen-Knopf, Feld oben abgeschnitten.
- style.css: Höhe aus `--vh` (100dvh, Fallback 100vh) statt 100vh; unter 360 px Höhe HUD flacher (96) und Fähigkeiten 44 px mit Abstand 8.
- Neuer e2e-Test 932x300 und 844x280 (scheitert ohne Fix). unit 633, e2e 100 grün.

### 2026-11-28 – Start im Hochformat brach das Laden ab
- Bug (Android Chrome): Seite im Hochformat geöffnet, gedreht -> kein Vollbild-Knopf. Ursache: applyRotateHint rief refreshUI vor `const updateBossBars` (seit B-180), main.js brach ab.
- Fix: erster Drehhinweis-Aufruf ans Ende der Initialisierung verschoben. Neuer e2e-Test (Hochformat -> quer, keine Fehler, Knopf da). unit 633, e2e 101 grün.

### 2026-11-28 – Schalter Auto-Start der nächsten Welle
- Neu: Knopf neben "Welle starten" (Handy quer: über dem runden Wellenknopf), Taste A. Aus = kein Countdown nach Wellenende; Wahl in localStorage (`td-auto-wave`), Standard an.
- Logik `setAutoWave` in game.js (aus beendet Countdown, an startet ihn nur zwischen zwei Wellen), Laden/Speichern in hud.js.
- Tests: 5 unit, neuer e2e `auto-wave` (Desktop 1280/1920, Handy 844x390/667x375). unit 638, e2e 105, balance 21 grün. Reviewer: APPROVE.

### 2026-11-28 – Pflicht-Start im Vollbild auf dem Handy
- Wunsch des Menschen: zuerst "Im Vollbild spielen" tippen, nicht zuerst drehen. Tippen: Vollbild + Querformat festhalten, Spiel dreht sich selbst.
- Hinweis bleibt quer, bis getippt wurde (dann nur der Knopf). Nur wo Vollbild geht (nicht iPhone), nicht bei installierter App. fullscreenGate in input.js.
- PR #121 (versehentlich mit fremden Änderungen) geschlossen, neu im eigenen Worktree. Unit- und e2e-Tests neu, alle grün.

### 2026-11-28 – B-178 Fehlende Effekte der neuen Gegner
- Neu: Dampf bei jedem Frosttreffer auf Glutling (`steam`), Splitter je verlorener Käferschicht (`shellChip`, letzte bleibt `shellBreak`), Irrlicht-Ausweichen mit enemyId/Richtung, 9 px Zucken, ein "Verfehlt" je Irrlicht. Spielwerte unverändert.
- Tester PASS, Reviewer APPROVE (Hinweise: steam ohne Dedupe, steam.life doppelt zu ember.steamLife; unkritisch). unit 644, balance 21, e2e 107 grün.

## 2026-11-28 · B-188 · Lautstärkeregler für Musik und Effekte
- Ergebnis: fertig, Branch agent/lautstaerke, PR folgt
- Tests: npm test 648 grün, E2E 121 grün (neu: lautstaerke + Randfälle des Testers)
- Entscheidungen/Abweichungen: Mensch hat „kein Lautstärkeregler“ umentschieden (Musik und Effekte getrennt, eigener PR). Tester fand Feld offen über Startbildschirm (behoben), Reviewer APPROVE ohne Muss-Punkte; Hinweise (M auf Touch, Tab-Schließen, Hochformat) mit umgesetzt.
- Offen: neues Bauteil (Plakette mit Schiebern) im Design-System nachtragen.

## 2026-11-28 · B-182 bis B-187 · Albtraum-Modus (Paket)
- Ergebnis: fertig, Branch agent/albtraum (Unter-Branches albtraum-gold, albtraum-goldtuerme gemergt), PR folgt
- Tests: npm test 708, test:balance 26 (neu: albtraum.test.js), E2E 129 grün
- Entscheidungen/Abweichungen: Mensch: feste Stufe, Abzeichen + Kosmetik (sofort an), Motiv Oger-Kopf, Musik je Karte (Eiswelt vorerst Kartentitel), Asset-Grenze 15 MB. Balancing grob: Start-Gold nicht gekürzt (sonst Einbruch Welle 2–3). Tester: Silber trotz Reparatur und Medaille bei 667x375 behoben; Reviewer APPROVE.
- Offen: Feinabstimmung durch den Menschen; Albtraum-Titel Eiswelt; Vorschau normal/golden im Menü „Aussehen“; Bauteile (Medaille, Aussehen, Ton-Feld) in die Claude-Design-Bibliothek.

## 2026-11-28 · B-189 · Albtraum deutlich schwerer
- Ergebnis: fertig, Branch agent/albtraum-haerter, PR folgt
- Tests: npm test 717, test:balance 26, E2E 129 grün
- Entscheidungen/Abweichungen: Zwei Spieltests des Menschen: +40 % ab Welle 1 zu schwer → gestuft (8–11 ×1,2, ab 12 ×1,4), Kopfgeld normal, mehr Elite ab Welle 8. Oger-König kostet im Albtraum weiter alle Leben (Mensch: so lassen). Skript-Strategien schaffen den Albtraum nicht mehr (Regel „perfektes Spiel“ gilt hier bewusst nicht). Mit Gold-Anzeige-Fix und Testmodus-Gold aus. Tester PASS, Reviewer APPROVE.
- Offen: Albtraum-Design (Runde 1 Stilrichtung in Claude Design, Auswahl durch den Menschen).

### 2026-11-28 · Bibliothek schlank
- Regel: Bauteil-Bibliothek in Claude Design nicht mehr vollständig pflegen; Fläche nur für große neue Elemente auf Auftrag.
- Bauvorlage bleibt Pflicht. Geändert: `.claude/agents/designer.md`, `.claude/skills/design/SKILL.md`.
- Keine Code-Änderung, keine Tests betroffen.

### 2026-11-28 · Pipeline schneller
- Pipeline-Skill: Auto-Merge statt CI-Warten, genaue Fundstellen im developer-Auftrag, nie Opus.
- Blöcke bis 6 bei UI-Kleinkram, e2e/Balancing nur einmal am Blockende, parallele Spuren in Worktrees.
- Keine Code-Änderung.

### agent/menue-knopf (2026-11-28)
- Knopf „Kartenauswahl“ im Pause-Schild öffnet die Kartenauswahl mitten im Spiel.
- „Zurück zum Spiel“ in der Auswahl kehrt ins pausierte Spiel zurück; neue Karte fragt vorher nach, wenn schon gespielt wurde.
- Test: tests/e2e/menue-knopf.test.mjs; Unit- und e2e-Tests grün.

## 2026-11-28 – Block Albtraum-Design (B-190 bis B-199)
- Rollen: designer (Sonnet + ein Opus-Vergleich), developer (4 parallele Worktrees), tester, reviewer.
- Neu: echter Albtraum-Look statt Filter: je Karte eigener Stil (A/B/C), Bewegung (Wellen, Glut, Nebel), Gegner-Look, Holz-HUD, Kartenauswahl/Sieg/Aussehen; keine Vignette.
- Gold-Bedingung (Mensch): Zangenangriff ohne Kanone, Vulkan ohne Blitzturm statt "höchstens 3 Turmtypen"; Tests dazu angepasst.
- Offen: Plakette bei 1280x800, nm-Tokens nach Claude Design abgleichen.

### 2026-11-28 Elite-Heilpause
- Elite-Selbstheilung (regen) pausiert 2 s nach HP-Schaden (ELITE.regen.pauseAfterHit), Spieltest: im Albtraum zu stark.
- Test in game.test.js, Unit + Balance grün; Albtraum-Sims fast unverändert.
- Albtraum: Bosse und Elite höchstens +30 % Leben (NIGHTMARE.specialHpCap), Spieltest: Welle 15 zu schwer. Frühstart-Risiko rechnet mit.

### 2026-11-28 Elite-Heilung nachjustiert
- regen: 2,5 % maxHp/s, Heilpause 1 s nach Schaden (vorher 3 %, 2 s), Entscheidung des Menschen. Tests grün.

### agent/home-knopf (2026-11-28)
- Kartenauswahl-Knopf im Pause-Schild als Home-Knopf (Haus-Symbol + „Menü“), Desktop und Handy.
- Unit- und e2e-Tests grün, Screenshots 1280x800 und 844x390 geprüft.

### 2026-11-28 – agent/elite-regen-immer
- Fähigkeiten laden zwischen den Wellen nicht weiter (Exploit: Welle stoppen und Abklingzeit gratis abwarten).
- Elite: Normalmodus leichter (Schild 15 %, Heilung 1 %/s nach 2 s), Albtraum eigene Werte (Heilung immer).
- Albtraum-Bosse: Nekromantin mit Fledermäusen und stärkerer Phase 2, Oger-König Phase 2; Bosse ohne Leben-Deckel.
- Tests: unit, balance, e2e grün.
### 2026-11-28 – Scharfschütze: eigener Schuss-Ton
- Scharfschütze: einzelner Gewehrknall (Free Firearm Sound Library, CC0; Tikka, Arisaka, Mosin), alter Ton war ~20x leiser als die Kanone.
- Stufe 3 "Falkenauge": eigener Ton `shot:sniper:master` (Kenney laserLarge), über das vorhandene Geschoss-Feld `master`.
- Blitz bleibt unverändert (Wunsch des Menschen). Neuer Test in `tests/sound.test.js`, Schlüsselliste im B-114-Test ergänzt.

# Backlog-Archiv (erledigt)

Hier liegen alle Einträge mit Status `fertig`, unverändert aus `docs/BACKLOG.md` verschoben.
Agents lesen diese Datei nur bei konkretem Bedarf.

---

### B-001: Wellen-Vorschau
- Status: fertig
- Aufwand: S
- Idee: Vor dem Start einer Welle zeigt das HUD, welche Gegnertypen und wie viele kommen.
- Akzeptanzkriterien:
  - Neue reine Funktion `waveSummary(wave)` in `src/config.js` liefert z. B. `{ grunt: 8, runner: 3 }`.
  - Unit-Test für Welle 1, 5 und 10 (Boss in Welle 5 und 10).
  - HUD zeigt die Vorschau neben dem Start-Button.

### B-002: Pausefunktion
- Status: fertig
- Aufwand: S
- Idee: Taste `P` pausiert das Spiel, Bauen bleibt erlaubt.
- Akzeptanzkriterien:
  - Während der Pause ändert `update` den Zustand nicht.
  - Test: Pause, 10 Sekunden simulieren, Zustand unverändert.

### B-003: Spielgeschwindigkeit x1/x2/x3
- Status: fertig
- Aufwand: S
- Idee: Taste `F` oder ein Button schaltet die Simulationsgeschwindigkeit zwischen x1, x2 und x3 um. Spart Wartezeit bei leichten Wellen.
- Akzeptanzkriterien:
  - `SPEED_STEPS = [1, 2, 3]` steht in `src/config.js`.
  - Neue reine Funktion `stepGame(state, dt, speed)` in `src/game.js` ruft `update` in Teilschritten von höchstens 0,05 s auf (keine großen `dt`-Sprünge).
  - Test: 10 s bei x1 und 5 s bei x2 ergeben den gleichen Zustand (Gold, Kills, Lives).
  - HUD zeigt die aktuelle Geschwindigkeit.

### B-004: Zielmodus pro Turm
- Status: fertig
- Aufwand: S
- Idee: Jeder Turm hat eine Zielregel (Erster, Letzter, Stärkster, Nächster), umschaltbar per Klick oder Taste `T`. So kann der Scharfschütze gezielt Bosse jagen.
- Akzeptanzkriterien:
  - `TARGET_MODES = ['first', 'last', 'strong', 'close']` steht in `src/config.js`.
  - Neue Türme starten mit `targetMode: 'first'`.
  - `setTargetMode(state, id, mode)` lehnt unbekannte Modi ab.
  - Test: Bei 3 Gegnern in Reichweite (verschiedene `dist` und `hp`) wählt jeder Modus den erwarteten Gegner.
  - Verhalten für `first` bleibt unverändert, bestehende Tests laufen weiter.

### B-006: Heiler und Schildträger
- Status: fertig
- Aufwand: M
- Idee: Schamane heilt Gegner in der Nähe periodisch; Schildträger reduziert Pfeil-Schaden stark, wird aber vom Kanonen-Splash normal getroffen. Ab Welle 7 bzw. 9. Risiko: Balancing und O(n²)-Radiusprüfung.
- Akzeptanzkriterien:
  - `ENEMY_TYPES` bekommt `healer` (`healRadius`, `healPerSec`, `healInterval`) und `shielded` (`armor`).
  - Heilung überschreitet nie `maxHp`.
  - Test: Healer heilt verletzten Nachbarn im Radius, keinen außerhalb.
  - Test: Pfeilturm macht gegen `shielded` weniger Schaden, Kanone (Splash) voll.
  - Test: Welle 7 enthält Healer, Welle 9 Schildträger.
  - `render.js` zeigt Heil-Aura und Schild.

### B-008: Schwierigkeit anziehen (Balancing)
- Status: fertig
- Aufwand: S
- Idee: Das Spiel ist zu leicht. Nur Zahlen in `src/config.js` ändern: weniger Startgold, steilere HP-Skalierung, mehr Gegner und härtere Mischung ab der Mitte, Boss-Wellen spürbar gefährlicher. Keine neue Mechanik.
- Akzeptanzkriterien:
  - Alle Änderungen nur in `src/config.js` (`START_GOLD`, `START_LIVES`, `hpScale`, `waveFor`, `waveBonus`, Gegnerwerte).
  - Mit dem Test-Bot bzw. einer Simulation in den Tests: Eine einfache Strategie "nur Pfeiltürme, nie aufrüsten" verliert vor Welle 12.
  - Test: `hpScale` ist streng steigend, `waveFor(w)` enthält mit wachsendem `w` nie weniger Gegner.
  - Bestehende Tests werden nicht abgeschwächt. Hängt ein Test an alten Zahlen, im Bericht begründen und mit dem Menschen klären.
  - Im Ledger die alten und neuen Kernwerte nennen.

### B-009: Grafik: Gelände und Weg
- Status: fertig
- Aufwand: M
- Idee: Das Spielfeld sieht im Stil klassischer Tower-Defense-Spiele aus: Gras mit Variation, ein gepflasterter oder erdiger Weg mit Rand, Dekoration (Bäume, Büsche, Steine) auf nicht bebaubaren Kacheln, sichtbarer Ein- und Ausgang. Alles wird per Canvas-Code selbst gezeichnet, ohne Bilddateien und ohne Vorlagen aus anderen Spielen.
- Akzeptanzkriterien:
  - Nur `src/render.js` (und bei Bedarf `style.css`) ändern, keine Spiel-Logik.
  - Dekoration ist deterministisch (fester Seed oder Kachel-Hash), flackert also nicht und liegt nie auf Weg- oder bebauten Kacheln.
  - Hintergrund wird einmal auf ein Offscreen-Canvas gezeichnet und pro Frame nur kopiert (Performance).
  - Keine neuen Abhängigkeiten, keine externen Assets.
  - `npm test` bleibt grün.

### B-010: Grafik: Türme
- Status: fertig
- Aufwand: M
- Idee: Jeder Turmtyp bekommt eine eigene gezeichnete Silhouette: Pfeilturm aus Holz mit Bogen, Kanone mit Rohr auf Steinsockel, Frostturm mit Kristall, Scharfschütze als hoher Turm. Das Level ist an Aussehen oder Banner erkennbar, es gibt Schuss-Rückstoß und Schatten.
- Akzeptanzkriterien:
  - Nur `src/render.js`; Farben und Maße, die Balancing betreffen, bleiben in `config.js`.
  - Vier erkennbar verschiedene Türme, drei Level-Stufen unterscheidbar.
  - Turm dreht sich weiter zum Ziel.
  - `npm test` bleibt grün.

### B-011: Grafik: Gegner und Animation
- Status: fertig
- Aufwand: M
- Idee: Gegner sind gezeichnete Figuren statt Kreise (Goblin, Flitzer, Panzer-Troll, Oger-König), mit Schatten, Lauf-Animation und Blickrichtung entlang des Wegs. Bosse sind deutlich größer und auffälliger. HP-Balken bleibt.
- Akzeptanzkriterien:
  - Nur `src/render.js`.
  - Figuren schauen in Bewegungsrichtung, Animation läuft über `state.time`, nicht über echte Zeit.
  - Verlangsamte Gegner sind weiter erkennbar (Frost-Effekt).
  - `npm test` bleibt grün.

### B-012: Grafik: Projektile und Effekte
- Status: fertig
- Aufwand: S
- Idee: Pfeile mit Schweif, Kanonenkugeln mit Rauch, Frost-Partikel, Explosionen mit Funken und kurzem Screen-Shake, Treffer-Blitz auf Gegnern, Gold-Münzen beim Kill.
- Akzeptanzkriterien:
  - Rein visuelle Effekte in `src/render.js`. Falls Zustand für Partikel nötig ist, lebt er im Render-Modul und nicht in `game.js`.
  - Keine Auswirkung auf Spiel-Logik und Tests.
  - `npm test` bleibt grün.

### B-013: Spätphase fordernder machen
- Status: fertig
- Aufwand: M
- Idee: Seit B-008 sind die Wellen 14 bis 20 für gute Strategien verlustfrei, die Schwierigkeit konzentriert sich auf Welle 8 bis 10. Mit nur noch 3 Leben (B-019) kann man dort nicht "spürbar Leben verlieren", also soll der Druck messbar werden: Gegner sollen in der Spätphase deutlich weiter am Weg vordringen, bevor sie sterben. Das geschieht über Gegnermix und Spawn-Dichte (mehr Trolle und Flitzer ab Welle 15, Boss-Begleiter, Schildträger und Healer wirklich spürbar) statt über `hpScale`, das nur auf Messers Schneide steht. Aus dem Review von B-006: Der Schildträger (60 Basis-HP, 1 Exemplar pro Welle bis Welle 11) ist fast wirkungslos und der Healer (2 % maxHp pro Sekunde) schwach und läuft den Trollen davon.
- Akzeptanzkriterien:
  - Nur Zahlen in `src/config.js` (`waveFor`, Gegnerwerte der neuen Typen, bei Bedarf Healer-Werte). `hpScale`, `START_LIVES`, `START_GOLD`, Boss-Leak und alle Turmwerte bleiben unverändert. Keine neue Mechanik.
  - Messbarer Druck: Mit den zwei robusten Strategien (arrow,cannon,cannon,frost und cannon,arrow,arrow,frost) erreicht in den Wellen 14 bis 20 in mindestens 3 Wellen ein Gegner mehr als 60 % des Wegs (Wert nach Simulation anpassen, aber deutlich über dem heutigen Stand), per Test belegt (Simulation mit Fortschrittsmessung, `dist` relativ zur Weglänge). Beide Strategien gewinnen Welle 20 weiter bei dt 1/30 und 1/60 mit mindestens 2 Leben.
  - "Nur Pfeiltürme" verliert weiter vor Welle 12; Welle 1 verliert kein Leben; Boss-HP-Test und alle übrigen bestehenden Tests bleiben unverändert grün (Ausnahme: `waveSummary(10)`, falls Welle 10 sich ändert, nur der Erwartungswert und im Ledger genannt).
  - Schildträger zwingt zu gemischten Setups: Eine Strategie mit ausschließlich Pfeil- und Frostürmen (ohne Kanonen) schneidet in den Wellen mit Schildträgern messbar schlechter ab als mit Kanonen (Test mit zwei Läufen).
  - Troll-Belohnung prüfen (450 HP bei 14 Gold) und begründen, ob sie angepasst wird.
  - Doppelte Strategie-Tests in `tests/game.test.js` zu einem gemeinsamen Helfer bündeln, Laufzeit senken, ohne Prüfungen zu verlieren.

### B-019: Nur noch 3 Leben
- Status: fertig
- Aufwand: S
- Idee: Der Mensch will ein deutlich härteres Spiel: `START_LIVES` von 20 auf 3. Damit entscheidet schon ein einziger Durchbruch (Boss: Leak 6) über Sieg oder Niederlage. Das Balancing muss so nachgezogen werden, dass das Spiel hart, aber mit guter Strategie weiter schaffbar bleibt.
- Akzeptanzkriterien:
  - `START_LIVES = 3` in `src/config.js`. Weitere Anpassungen nur an Zahlen in `src/config.js` (Gegnerwerte, Leak, Wellen), keine neue Mechanik.
  - Die HUD-Anzeige zeigt nie weniger als 0 Leben (`game.js` begrenzt bereits auf 0).
  - Gute Strategien (die zwei robusten Reihenfolgen aus den Tests) gewinnen Welle 20 bei dt 1/30 und 1/60 mit mindestens 1 Leben. "Nur Pfeiltürme" verliert weiter vor Welle 12. Welle 1 verliert mit dem Startgold kein Leben.
  - Die drei Tests mit der festen Reserve `lives >= 8` (`tests/game.test.js`) werden durch die neue Reserve ersetzt (mindestens 1 Leben, also gewonnen). Das ist die einzige zulässige Änderung an bestehenden Tests und wird im Ledger ausdrücklich genannt. Alle anderen Tests bleiben unverändert.

### B-027: Map-Auswahl (mehrere Karten)
- Status: fertig
- Aufwand: M
- Idee: Fundament für alle Welten. `WAYPOINTS` wird zu einer Liste von Maps in `src/config.js` (Name, Wegpunkte, Farbschema, gesperrte Kacheln). Auswahlmenü vor dem Spielstart, Spielzustand und Render lesen die gewählte Map. Voraussetzung für B-028 bis B-031.
- Akzeptanzkriterien:
  - `MAPS` in `src/config.js`, bestehende Karte bleibt unverändert als erste Map.
  - `game.js` und `path.js` bekommen die Map als Parameter, kein DOM.
  - Test: Jede Map hat einen gültigen Weg (zusammenhängend, Ein- und Ausgang außerhalb, keine Überschneidung mit gesperrten Kacheln).
  - Bestehende Tests laufen unverändert.

### B-028: Welt Wald (blockierte Bauplätze)
- Status: fertig
- Aufwand: M
- Idee: Zweite Map mit Bäumen und Felsen, die Kacheln blockieren. Wenige, dafür gute Bauplätze zwingen zu Entscheidungen. Hängt von B-027 ab.
- Akzeptanzkriterien:
  - Map `forest` mit `blocked`-Kacheln; `canBuild` lehnt sie ab.
  - Test: Bauen auf blockierter Kachel scheitert, Weg ist trotzdem begehbar.
  - Deko in `src/decor.js` passend zum Thema.

### B-029: Welt Eis (Gegner-/Turm-Modifikatoren pro Map)
- Status: fertig
- Aufwand: M
- Idee: Maps können Modifikatoren tragen: In der Eiswelt sind Gegner von Grund auf etwas langsamer, der Frostturm ist schwächer, Kanone stärker. Hängt von B-027 ab.
- Akzeptanzkriterien:
  - Map-Feld `modifiers` (Gegnertempo, Turmschaden je Typ) in `src/config.js`.
  - Test: Modifikatoren wirken auf Tempo und Schaden, Standard-Map bleibt unverändert.
  - Balancing-Zahlen nur in der Config.

### B-033: Mehrere Eingänge (zwei Spawn-Punkte)
- Status: fertig
- Aufwand: L
- Idee: Neue Karte mit zwei Eingängen, deren Wege später zusammenlaufen. Gegner verteilen sich abwechselnd auf beide Wege. Bestehende Karten bleiben mit einem Weg unverändert. Hängt von B-027 ab, verwandt mit B-032 (Verzweigungen).
- Akzeptanzkriterien:
  - Map-Feld `extraPaths` (Liste weiterer Wegpunkt-Listen); `state.path` bleibt der Hauptweg, `state.paths` enthält alle Wege.
  - Jeder Gegner hat eine `lane` (abwechselnd) und läuft auf seinem Weg; Ziel- und Leak-Logik gelten pro Weg.
  - Zielwahl "Erster/Letzter/Stärkster/Nächster" bleibt sinnvoll bei unterschiedlich langen Wegen (Restweg statt reiner Laufstrecke).
  - Weg-Kacheln aller Wege sind nicht bebaubar; Render zeichnet alle Wege und alle Eingänge.
  - Test: Gegner starten an beiden Eingängen, Gesamtanzahl pro Welle unverändert; beide Wege erreichen das Ziel; alte Karten verhalten sich unverändert.

### B-045: Türme klarer unterscheiden (Spezialfähigkeiten)
- Status: fertig
- Aufwand: L
- Idee: Der Spieler findet, dass sich die Waffen zu ähnlich anfühlen. Jeder der vier Türme bekommt eine eigene Mechanik statt nur anderer Zahlen (alles deterministisch, ohne Zufall):
  - Pfeilturm "Aufwärmen": schießt dasselbe Ziel hintereinander, wird pro Schuss schneller (Schussabstand sinkt je Treffer um einen Anteil bis zu einer Obergrenze); bei Zielwechsel zurück auf 0.
  - Kanone "Rückstoß": Treffer stößt getroffene Gegner entlang ihres Wegs ein Stück zurück (Bosse nur halb).
  - Frostturm "Einfrieren": jeder N-te Treffer (Zähler pro Turm) friert das Ziel kurz komplett ein; Bosse sind immun.
  - Scharfschütze "Rüstungsbrecher": Zusatzschaden gegen zähe Gegner (maxHp ab Schwelle, also Trolle und Bosse) und ignoriert die Rüstung von Schildträgern.
- Akzeptanzkriterien:
  - Pro Turm ein Konfig-Block in `src/config.js` (z. B. `special`), alle Zahlen dort; Logik in `src/game.js`, kein DOM.
  - Test je Fähigkeit (inkl. Grenzfälle: Zielwechsel, Obergrenze, Boss-Immunität/-Rückstoß, Rückstoß nie unter Weganfang, Frost-Zähler, Schildträger-Rüstung); bestehende Tests unverändert.
  - Turm-Info nennt die Fähigkeit in einem Satz (Beschreibung in der Config).
  - Strategie-Balancing-Tests der Wiese und Eiswelt bleiben grün; müssen Konstanten angepasst werden, Anpassung der Zahlen in `config.js` statt Tests, sonst im Ledger nennen.

### B-046: Spiel insgesamt schwerer machen und Turm-Fähigkeiten spürbar machen
- Status: fertig
- Aufwand: L
- Idee: Der Spieler findet das Spiel zu einfach (auch auf Wiese und Wald) und wollte die Waffen klarer unterscheiden. B-045 hat die Fähigkeiten eingebaut, aber bewusst schwach, weil der empfindliche Spätphasen-Test ("in mindestens 3 der Wellen 14-20 dringt ein Gegner über 55 % des Wegs vor") bei stärkeren Werten kippte. Plan: Erst die Gegnerseite verschärfen (Druck), dann die Fähigkeiten spürbarer machen. Hebel: Gold-Überschuss in der Spätphase abbauen (siehe B-020: Gold-Senke oder gedeckelte Belohnungen), weniger Startgold, mehr Gegner oder höheres Tempo in der Spätphase, stärkere Bosse. Danach Fähigkeiten stärker: Aufwärmen (max. 12 % ist kaum spürbar), Rückstoß (0,08 Kacheln sind wenige Pixel), Einfrieren (0,4 s bei jedem 12. Treffer ist selten). Außerdem Scharfschützen-Schwelle `bonusMinHp` auf die Basis-HP des Gegnertyps statt der skalierten `maxHp` (heute trifft sie ab Welle 14 fast alle Gegner). Config-Texte der Fähigkeiten aus den Werten bauen oder per Test absichern. Mit den Strategie-Tests messen, auf Wiese, Eiswelt und `fork` (B-047).
- Akzeptanzkriterien:
  - Gute Strategien gewinnen Welle 20 weiter, aber mit deutlich weniger Reserve (Wiese und Eiswelt, dt 1/30 und 1/60, mindestens 1 Leben).
  - Fähigkeiten sind für den Spieler erkennbar (Rückstoß mindestens etwa eine halbe Kachel, Aufwärmen mindestens 25 %, Einfrieren mindestens etwa jeder 5. Treffer); Zahlen nur in `src/config.js`.
  - Der Test "Spätphase ... 55 %" und andere Balancing-Konstanten dürfen angepasst werden, wenn der Druck bewusst erhöht wird; jede geänderte Konstante wird im Ledger genannt und nichts wird nur zum Grünwerden abgeschwächt.
  - `npm test` grün.

### B-049: Testlaufzeit senken und Balancing-Hinweise
- Status: fertig
- Aufwand: S
- Idee: Hinweise aus dem Review von B-046. Der Testlauf stieg von etwa 10 s auf 48 s (der Test "robuste Strategien ... 4 dt" allein ca. 20 s). (1) Strategie-Cache (`iceCache`, `strategyRun`) in einer gemeinsamen Funktion mit Schlüssel `mapId:kind@dt` zusammenführen, damit derselbe Lauf nicht doppelt läuft. (2) Die 4-dt-Tests auf dt 1/30 und 1/60 reduzieren und 1/20 und 1/120 in einen eigenen Sammeltest auslagern (Prüfschärfe bleibt, nur seltener). (3) Kommentar bei `MAPS.forest.modifiers` ergänzen: 1.19 ist gemessen und ein schmaler stabiler Wert (stabil zwischen 1.17 und 1.20), `fork` ebenso. (4) Die Strategie a>c>c>f (Pfeilturm zuerst) endet auf allen Karten mit 10 Leben; prüfen, ob das gewollt ist oder ob mehr Gold-Senke nötig ist (Logikänderung in `game.js`). (5) `ENEMY_TYPES[target.type]` in der Sniper-Schwelle crasht bei Hand-Gegnern ohne `type`; Fallback nur falls ein Test das braucht.
- Akzeptanzkriterien:
  - Gesamtlaufzeit `npm test` deutlich unter 30 s, keine Prüfung abgeschwächt.
- Hinweis: Punkte (4) und (5) sowie die Umbenennung von `iceRun` liegen jetzt in B-050. Die gemessene Laufzeit lag bei ca. 15 s (die 48 s waren eine Lastspitze durch parallel laufende Agenten).

### B-034: Blitzturm mit Kettenblitz
- Status: fertig
- Aufwand: M
- Idee: Fünfter Turm "Blitzturm" (Taste 5). Sein Treffer springt als Kettenblitz auf bis zu N weitere Gegner in der Nähe (jeder Sprung mit abnehmendem Schaden, nie zweimal derselbe Gegner). Konter gegen Flitzerschwärme, schwach gegen einzelne zähe Gegner. Der Blitz trifft sofort (kein langsames Projektil) oder mit sehr schneller Geschwindigkeit; eine Blitzlinie zwischen den getroffenen Gegnern wird kurz gezeichnet. Preis und Werte so wählen, dass das Spiel nicht leichter wird (der Spieler findet es aktuell "recht schwer, aber gut"): Blitzturm ist ein gleichwertiger Bauplatz-Kompromiss, keine Dominanzstrategie.
- Akzeptanzkriterien:
  - `TOWER_TYPES.lightning` in `src/config.js` mit `chainCount`, `chainRange`, `chainFalloff` (Anteil Schaden pro Sprung), Kosten, Reichweite, Schaden, Rate; `key: '5'`; `special.text` aus den Werten gebaut wie bei den anderen Türmen.
  - Logik in `src/game.js`, kein DOM; Treffer springt auf nahe Gegner (Radius `chainRange` Kacheln, auch über Wegabschnitte/Wege der Karte `fork`), nie zweimal denselben, höchstens `chainCount` Sprünge, Schaden sinkt je Sprung; Schildträger-Rüstung und Boss-Regeln wie bei normalem Direkttreffer; getötete Gegner zählen Gold und Kills korrekt.
  - Render: Turm-Zeichnung für `lightning` (kein stilles Fallen in einen anderen Turm-Zweig, Rückstoß-/Farb-Tabellen ergänzen), Blitzlinie als kurzer Effekt (reine Darstellung, deterministisch). Shop-Button, Tastenkürzel 5 und Hilfetexte ("1–4" -> "1–5") angepasst.
  - Test: Kette trifft nur nahe Gegner, nie doppelt, Schaden sinkt je Sprung, Obergrenze `chainCount`, kein Sprung ohne weiteres Ziel, Tod der Ziele und Gold korrekt, Boss/Schildträger ohne Sonderbehandlung, `fork`-Karte funktioniert; Strategie-Balancing-Tests der Wiese, Eis, Wald, fork bleiben unverändert grün (Strategien nutzen den neuen Turm nicht).
  - Alle Zahlen nur in der Config.

### B-038: Fähigkeiten (Meteor, Einfrieren, Reparatur)
- Status: fertig
- Aufwand: L
- Idee: Drei aktive Fähigkeiten mit Abklingzeit, per Button und Taste, damit der Spieler auch mitten in der Welle etwas zu tun hat. Meteor (Taste Q): nach Klick auf das Spielfeld Flächenschaden an dieser Stelle. Kälteschock (Taste W): alle Gegner werden kurz stark verlangsamt (Boss nicht immun, Verlangsamung wie bei Frost über `slowUntil`/`slowFactor`). Notfall-Reparatur (Taste E): +1 Leben, selten (begrenzte Anzahl pro Spiel plus lange Abklingzeit). Das Spiel soll nicht leichter werden (Spieler: "recht schwer, aber gut"): lange Abklingzeiten, moderate Werte; die Strategie-Balancing-Tests nutzen keine Fähigkeiten und bleiben unverändert grün.
- Akzeptanzkriterien:
  - `ABILITIES` in `src/config.js` (je Fähigkeit: Name, Taste, Abklingzeit, Wirkungswerte, bei Reparatur `maxUses`), Texte deutsch, alle Zahlen nur dort.
  - Logik in `src/game.js`, kein DOM: `useAbility(state, id, x, y)` prüft Spielstatus ('playing'), nicht pausiert, Abklingzeit (über `state.time`), Nutzungen; Rückgabe `{ ok, reason }` wie bei `buildTower`. `state.abilities` mit Zustand je Fähigkeit (`readyAt`, `uses`), Reparatur hebt Leben nie über `START_LIVES`, kein Effekt bei vollen Leben (Meldung statt Verbrauch).
  - Meteor: Schaden im Radius um den Zielpunkt (Rüstung wie Splash), Effekt in `state.effects` (Explosion), getötete Gegner zählen Gold und Kills.
  - UI: drei Buttons mit Restzeit (Abklingzeit-Anzeige, ausgegraut bei Abklingzeit/aufgebraucht) im Steuerbereich, Tastenkürzel Q/W/E (Meteor: Zielmodus, nächster Klick aufs Feld löst aus, Esc bricht ab); Hilfetext/Steuerung ergänzt; Touch: Meteor per Button dann Tippen.
  - Tests: wirkt, geht in Abklingzeit, ist nach Ablauf wieder nutzbar; Reparatur-Obergrenze und `maxUses`; Meteor-Radius, Kills/Gold; Kälteschock verlangsamt alle Gegner und läuft aus; nichts in Pause oder nach Spielende; neues Spiel setzt Fähigkeiten zurück; Render/HUD ohne Fehler. Browser-Test (`npm run test:e2e`) vor dem PR lokal laufen lassen.

### B-053: Blitzturm aufwerten (eigene Rolle)
- Status: fertig
- Aufwand: M
- Idee: Spieler-Rückmeldung nach dem ersten Spieltest: Der Blitzturm ist zu schwach, man weiß nicht, warum man ihn statt der Kanone wählen soll (Kanone ist billiger und fühlt sich besser an). Grobe Rechnung: Blitzturm 110 Gold, ca. 12,7 Schaden/s auf ein Ziel, voller Blitz auf 4 Gegner ca. 32 Schaden/s gesamt; Kanone 90 Gold, 30 Schaden im Radius 1,1 Kacheln alle 1,4 s, trifft Gruppen gleichzeitig voll. Der Blitzturm braucht eine klare eigene Rolle, die Pfeil und Kanone nicht abdecken: Der Blitz trifft sofort und verfehlt nie (Kanonengeschosse sind langsam und verfehlen schnelle Flitzer), springt weit und häufig, und soll das Mittel gegen Schwärme schneller Gegner (Flitzer, Goblin-Gruppen) sein, bei Bosse und Panzer-Trollen aber schwächer als Kanone/Scharfschütze bleiben. Mögliche Hebel (messen, wenigste nötige wählen): Schaden und Schussrate hoch, `chainCount` und `chainRange` hoch, `chainFalloff` höher (0,8), optionaler Schockeffekt (getroffene Gegner kurz leicht verlangsamt, schwächer als Frost), Preis. Kurze, klare Beschreibung der Rolle im Shop ("verfehlt nie, ideal gegen Flitzer und Schwärme"). Das Spiel soll insgesamt nicht leichter werden ("recht schwer, aber gut"): die bestehenden Strategie-Tests ohne Blitzturm bleiben unverändert grün.
- Akzeptanzkriterien:
  - Messung per Simulation (Strategie-Läufe, Karten Wiese und mindestens eine weitere): Ein Mix mit Blitztürmen (z. B. Kanone + Blitz + Frost) gewinnt Welle 20 mit mindestens 1 Leben bei dt 1/30 und 1/60, und liegt in der Reserve ungefähr auf dem Niveau des bisherigen Kanonen-Mixes (nicht deutlich darüber). Gegen Flitzer-lastige Wellen ist der Blitzturm messbar besser als dieselben Gold in Kanonen, gegen Boss/Troll schlechter.
  - Zahlen nur in `src/config.js`; Beschreibung/Text (`description`, `special.text`) passend.
  - Neuer Strategie-Test (Mix mit Blitzturm) und ggf. Test des Schockeffekts; bestehende Tests unverändert (Zählungen nur, falls zwingend, im Ledger nennen).
  - `npm test` und `npm run test:e2e` grün.

### B-062: Stil-Fundament (Design-Overhaul)
- Status: fertig
- Aufwand: M
- Idee: `src/draw-utils.js` bekommt die Helfer `part`, `poly`, `rr`, `ell`, `lit`, `shd`, `shadow` und die Palette-/Kontur-Konstanten aus `docs/STIL.md` (Zahlen in `src/config.js`).
- Akzeptanzkriterien:
  - Helfer mit Tests in `tests/render.test.js` (Farbmischung, Abdunkeln der Kontur).
  - Bestehende Optik unverändert.

### B-063: Pfeilturm im neuen Stil als Referenz (Design-Overhaul)
- Status: fertig
- Aufwand: S
- Idee: Pfeilturm Stufe 1 bis 3 mit eigener Form im Flat-Pop-Stil.
- Akzeptanzkriterien:
  - Bei 1x und 0,75x erkennbar vom Boden getrennt (Screenshot, auch auf Eis).
  - Drehung zum Ziel und Rückstoß unverändert.
  - Zeichenzeit mit 20 Türmen nicht merklich höher (Messung).

### B-071: Wiese 1/7: Weg mit welligem Rand, Saum und heller Mitte (Design-Overhaul, Ziel Variante B)
- Status: fertig
- Aufwand: M
- Idee: Zielbild: `docs/design/wiese-ziel-1x.png` und `-2x.png` (Entwurf Variante B des designers, eigene Zeichnung; Referenz war ein Kingdom-Rush-Screenshot, nicht im Repo). Weg bekommt welligen Rand (Kreiskette), dunkle Kontur, grünen Saum, Rillen, Randsteine und eine helle Wegmitte. Reihenfolge der sieben Wiesen-Einträge: B-071, B-077, B-078, B-079, B-080, B-081, B-082. Alles nur Zeichnen (`render*.js`, `decor.js`), alles Statische einmal in `bgCanvas`. Spiellogik, Wegverlauf und Baufelder bleiben unverändert.
- Akzeptanzkriterien:
  - Wegbreite in Kachelmitte 40 px, Rand höchstens 4 px darüber hinaus.
  - Gegner haben mindestens 25 % Helligkeitsabstand zur Wegmitte (Test mit Farbwerten aus `config.js`).
  - Weg im Hintergrund-Cache; kein Zeichnen des Weges im Frame-Pfad (render-Test).
  - Screenshots Desktop 1280x800 und Handy 390x844.

### B-077: Wiese 2/7: Baumrahmen am Rand (Design-Overhaul)
- Status: fertig
- Aufwand: M
- Idee: Dichter, mehrfarbiger Rahmen aus runden Baumkronen (Laub, Apfel, Blüte, einzelne Tannen) mit dicker dunkler Kontur, nur im Randring. `decor.js` liefert die Positionen deterministisch. Ziel ca. 60 Kronen statt heute ca. 16 Bäume.
- Akzeptanzkriterien:
  - Unit-Test: keine Krone schneidet den Weg; Überhang ins Feld höchstens 36 px (im Durchlauf von 16 px angehoben: Zielbild ist tiefer).
  - Mindestens 40 Bäume im Randring; Positionen deterministisch (gleicher Seed, gleiches Ergebnis).
  - Alles im Hintergrund-Cache; Handy-Screenshot: Gegner und Türme bleiben lesbar.

### B-078: Wiese 3/7: Boden mit Flecken und Plateaus statt Schachbrett (Design-Overhaul)
- Status: fertig
- Aufwand: M
- Idee: Boden aus gestapelten Flecken (je 4 Lagen für weiche Kanten, kein `shadowBlur`), in B zusätzlich Plateaus mit dunkler Kante (Höhenversatz) und Gras-Cluster.
- Akzeptanzkriterien:
  - Screenshot ohne Schachbrettraster.
  - Aufbauzeit von `bgCanvas` unter 60 ms (Test misst, Node mit Mock genügt).
  - Kein Aufruf im Frame-Pfad (render-Test).

### B-079: Wiese 4/7: Felsen, Büsche, Blumen, Pilze und Streu-Deko neu (Design-Overhaul)
- Status: fertig
- Aufwand: M
- Idee: Felsgruppen mit Moos, Büsche, Blumen, Pilze im Flat-Pop-Stil mit Kontur; kleine Streu-Deko (Fass, Baumstämme, Zaunspitzen, Wegweiser) flach im Feld, unter Türmen verdeckt.
- Akzeptanzkriterien:
  - Konturbreite 1,3 bis 2,3 px.
  - Keine Deko auf Weg-Kacheln (bestehende `decor`-Tests grün); neue Streu-Deko bleibt in Bereichen, die sie nicht unspielbar machen (bebaubar bleibt jede freie Kachel).

### B-080: Wiese 5/7: Akzente Burgmauer, Teich, Brunnen (Design-Overhaul)
- Status: fertig
- Aufwand: M
- Idee: Steinmauer mit Tor am oberen Rand, Teich und Brunnen als Akzente, nur im Randring bzw. klein. Teich/Mauer als Hindernis im Feld wäre Logik und gehört nicht hierher. Andere Karten folgen mit B-072 bis B-074 nach der Palette aus `docs/STIL.md`.
- Akzeptanzkriterien:
  - Akzente nur im Randring oder kleiner als eine Kachel im Feld.
  - Screenshot Wiese; Einstieg und Ausgang des Weges bleiben klar erkennbar.

### B-081: Wiese 6/7: Licht, Vignette und Baumschatten (Design-Overhaul)
- Status: fertig
- Aufwand: S
- Idee: Lichtstreifen, sanfter Verlauf, Vignette und Baumschatten, nur im Cache (Gradient-Objekte nur dort, nie pro Frame).
- Akzeptanzkriterien:
  - Mittlere Helligkeit des Feldes mindestens 85 % von heute (Gegner und Türme bleiben lesbar).
  - Kein Gradient und kein `shadowBlur` im Frame-Pfad.

### B-082: Wiese 7/7: Bauplatz-Inseln unter Türmen und Hover-Vorschau (Design-Overhaul)
- Status: fertig
- Aufwand: S
- Idee: Grüne Insel als Sprite unter jedem gebauten Turm und als Vorschau beim Hover. Kein Bauen auf neuen Kacheln, `canBuild` unverändert. Dazu: Reichweitenkreis nur als Ring plus ca. 8 % Füllfläche, damit er über der Deko nicht unruhig wirkt.
- Akzeptanzkriterien:
  - Insel wird mit dem Turm gezeichnet, nicht im Hintergrund-Cache (Türme sind dynamisch).
  - `canBuild`-Verhalten und Tests unverändert.
  - Reichweitenkreis auf dem Handy-Screenshot ruhig und lesbar.

### B-072: Welten Wald und Zangenangriff (Design-Overhaul)
- Status: fertig
- Aufwand: M
- Idee: Wald mit Tannen, Pilzen, Moos; Zangenangriff mit Herbstlaub. Überschneidet sich mit B-043 und B-059, bei Umsetzung zusammenlegen.
- Akzeptanzkriterien:
  - Eigene Palette, auf Screenshot klar von der Wiese unterscheidbar.

### B-073: Welt Eis (Design-Overhaul)
- Status: fertig
- Aufwand: M
- Idee: Schnee, Eiskristalle, Tannen mit Schneekappe, dunklerer Weg. Überschneidet sich mit B-044 und B-059.
- Akzeptanzkriterien:
  - Weg vom Boden unterscheidbar, Gegner mit Kontrastregel aus `docs/STIL.md` lesbar.
  - Tests der Hindernisse grün.

### B-043: Welt Wald: Feinschliff
- Status: fertig
- Teilweise erledigt (agent/aufraeumen-2): Punkte (1), (2) und (3). Offen: (4) Sichtprüfung der Waldkarte im Browser.
- Aufwand: S
- Idee: Hinweise aus dem Review von B-028. (1) Baum-Anteil `0.7` aus `obstacleKind` in `src/decor.js` nach `src/config.js` (`OBSTACLE_TREE_SHARE`). (2) Schattenfarbe `rgba(10,40,15,0.35)` in `drawObstacle` (`src/render.js`) als benannte Konstante. (3) `tests/forest-edge.test.js` in `tests/game.test.js` und `tests/decor.test.js` einsortieren (Regel: Tests nach Modul). (4) Sichtprüfung der Waldkarte im Browser: Lesbarkeit der Hindernisse, Gefühl der knappen Bauplätze.
- Akzeptanzkriterien:
  - `npm test` bleibt grün, kein Test abgeschwächt oder gelöscht.

### B-044: Eiswelt: Feinschliff
- Status: fertig
- Teilweise erledigt (agent/eis-balancing): Punkte (1) und (2). Die Eiswelt war dem Spieler zu einfach und wurde auf "Glatteis" umgestellt (Gegner 1,18-fach, Kanone 0,95-fach), mit Balancing-Tests. Offen: (3) und (4).
- Aufwand: S
- Idee: Hinweise aus dem Review von B-029. (1) Playtest der Eiswelt (erledigt). (2) Kartenspezifische Balancing-Tests für die Eiswelt (erledigt). (3) Sichtprüfung des Farbschemas im Browser. (4) Eiswelt hat keine Hindernisse; eigene Eis-Deko (Schneehaufen, Eisfelsen) wäre ein eigener Eintrag.
- Akzeptanzkriterien:
  - `npm test` bleibt grün, kein Test abgeschwächt.

### B-059: Welten optisch unterscheidbar: Eis und Wald (Sollte, Design-Prüfung)
- Status: fertig
- Aufwand: M
- Idee: Der Weg ist auf Wiese, Wald und Eis fast gleich (braun), Deko auf Eis ist wie auf der Wiese, der Zangenangriff sieht aus wie die Wiese. Eis: bläulicher glatter Weg, Schnee statt Gras, Kristalle, Flocken. Wald: dunkler Moos-Weg. Wegstil über `theme` in `src/config.js`, Deko einmalig in Off-Screen-Canvas. Überschneidet sich mit B-043 und B-044, bei Umsetzung zusammenlegen. Risiko: Gegner auf hellem Grund schlecht lesbar. Screenshots: map-ice.png, map-forest.png, map-fork.png.
- Akzeptanzkriterien:
  - Wegfarbe der Eiskarte ist nicht braun und deutlich verschieden von der Wiese; Deko-Sets unterscheiden sich je Welt.
  - Zahlen nur in `src/config.js`; Frame-Zeit bleibt unter 16 ms.
  - Tests in `tests/decor` und `tests/render` laufen weiter, neue Test für Deko-Set je Welt.

### B-093: Fortschritt speichern: Rekorde, Sterne, Karten freischalten
- Status: fertig
- Aufwand: M
- Freigabe: Mensch am 2026-11-26 (neue Mechanik "Karten freischalten" ausdrücklich gewünscht)
- Idee: Fortschritt bleibt über Neuladen erhalten, ohne Backend (`localStorage`). Pro Karte bester Wellenrekord und Sterne (nach übrigen Leben bei Sieg). Karten werden in der Reihenfolge von `MAPS` freigeschaltet: die erste ist immer offen, jede weitere nach einem Sieg auf der vorherigen.
- Akzeptanzkriterien:
  - Neues reines Modul `src/progress.js` (kein DOM, kein `window`): Speicher wird als Objekt mit `getItem`/`setItem` übergeben, damit es in Node testbar ist. Funktionen etwa `loadProgress(storage)`, `saveProgress(storage, progress)`, `recordResult(progress, { mapId, status, wave, lives })` (liefert auch `newRecord`, `newStars`, `unlockedMap`), `starsFor(status, lives)`, `isUnlocked(progress, mapId)`.
  - Zahlen in `src/config.js`: `PROGRESS_KEY = 'td-progress-v1'`, `STAR_LIVES_SHARE = [0, 0.5, 1]` (1 Stern: gewonnen; 2 Sterne: mindestens die Hälfte von `START_LIVES` übrig; 3 Sterne: keine Leben verloren). Bei Niederlage 0 Sterne.
  - Rekorde und Sterne werden nie schlechter (Maximum bleibt erhalten).
  - Kaputter, fehlender oder fremder Speicherinhalt (ungültiges JSON, falscher Typ, unbekannte Karten-IDs) und ein werfender Speicher (privater Modus) führen nie zum Absturz, sondern zu leerem Fortschritt bzw. stillem Nicht-Speichern.
  - `src/main.js`: Ergebnis wird genau einmal pro Spielende gespeichert (nicht in jedem Frame). Overlay zeigt Rekord und Sterne der Karte, „Neuer Rekord!“ und ggf. „Neue Karte freigeschaltet: <Name>“. Kartenauswahl zeigt Sterne je Karte, gesperrte Karten mit 🔒 und `disabled`.
  - `src/game.js` bleibt unverändert; Browser-Tests laufen unverändert.
  - Tests in neuer Datei `tests/progress.test.js`: Sterne-Grenzen, Rekord-Maximum, Freischalt-Reihenfolge, Laden/Speichern mit Fake-Speicher, Robustheit gegen kaputte Daten und werfenden Speicher.

### B-094: Fortschritt: Meldungen am Spielende verfeinern (Hinweise aus dem Review von B-093)
- Status: fertig
- Aufwand: S
- Idee: (1) „Neuer Rekord!“ erscheint beim ersten Spiel auf einer Karte immer, auch bei früher Niederlage; nur zeigen, wenn vorher ein Rekord > 0 bestand. (2) `newStars` wird berechnet, aber nie angezeigt; „Neue Sterne!“ ergänzen. (3) Neue Overlay-Zeile `#overlay-progress` hat kein eigenes CSS; Designer-Blick. (4) Sterne-Grenztest in `tests/progress.test.js` aus `STAR_LIVES_SHARE[1] * START_LIVES` mit `Math.ceil` ableiten (setzt heute gerades `START_LIVES` voraus). (5) e2e-Fall „Sieg schaltet nächste Karte frei“.
- Akzeptanzkriterien:
  - Erstes Spiel mit Niederlage zeigt keinen „Neuer Rekord!“-Hinweis; Verbesserung der Sterne wird gemeldet.
  - Kein Test wird abgeschwächt; `npm test` bleibt grün.

### B-067: Boss Oger-König (Design-Overhaul)
- Hinweis: In `tests/fx.test.js` ("Boss ist am groessten") entfiel der Zeichenspur-Vergleich Boss > Schamane (mit B-066 auf Wunsch des Menschen entfernt); mit dem neuen Boss einen Vergleich wieder ergänzen.
- Status: fertig
- Aufwand: M
- Idee: 1,6x Größe, Krone, Keule, Aura, Auftritts-Effekt (Bodenschlag, Wackeln unter 3 px).
- Akzeptanzkriterien:
  - Boss auf dem Handy sofort erkennbar.
  - `prefers-reduced-motion` schaltet das Wackeln aus.

### B-068: Projektile und Effekte (Design-Overhaul)
- Status: fertig
- Aufwand: M
- Idee: Pfeile, Kanonenkugel, Frostsplitter, Blitz, Explosion, Treffer-Funken, Münzen-Hopser beim Tod.
- Akzeptanzkriterien:
  - Maximale Partikelzahl wie vorher.
  - Effekte verdecken Gegner nicht (Screenshot einer Welle mit vielen Gegnern).
  - Reduzierte Bewegung wird respektiert.

### B-069: HUD-Icons (Design-Overhaul)
- Status: fertig
- Aufwand: S
- Idee: Gold, Herz, Welle und Fähigkeiten aus dem Icon-Set per Canvas zeichnen und in HUD/Knöpfen statt Emoji einsetzen. Verknüpft mit B-058.
- Akzeptanzkriterien:
  - Bei 16 und 32 px lesbar, Tippziele mindestens 44 px, keine Emoji-Mischung.

### B-058: Fähigkeitsknöpfe: Tippgröße, Symbol und Abklingbalken (Muss, Design-Prüfung)
- Status: fertig
- Aufwand: S
- Idee: 10 Buttons unter 44 px Höhe auf dem Handy (Meteor, Kälteschock, Notfall-Reparatur, Zoom). Label "Notfall-Reparatur (E) bereit (2x)" ist umständlich, "bereit" und "lädt" sind kaum unterscheidbar. Großes Symbol, Kürzel klein, Abklingzeit als Füllbalken, auf dem Handy keine Tastenkürzel.
- Akzeptanzkriterien:
  - `.abilities button` und Zoom-Knopf sind auf Handy und Desktop mindestens 44 px hoch.
  - Zustand "bereit" und "lädt" ist ohne Text unterscheidbar (Balken oder Helligkeit).
  - Tastenkürzel-Hinweise sind auf dem Handy ausgeblendet (auch bei Pause und Tempo).
  - Unit-/Browser-Test prüft die Mindesthöhe.

### B-057: Desktop: Turm-Panel ohne Scrollen erreichbar (Muss, Design-Prüfung)
- Status: fertig
- Aufwand: S
- Idee: Bei 1280x800 und 1366x768 endet Verkaufen bei y=958, die Seite ist 1262 px hoch; das Panel liegt unter Turmliste und Hilfe. Panel oben in der Seitenleiste (vor den Turmkarten) oder neben das Feld, Hilfe einklappen. Risiko: Layout-Sprünge. Screenshot: d1280-4select.png.
- Akzeptanzkriterien:
  - Bei 1280x800 und 1366x768 liegt `#sell` bei gewähltem Turm mit Unterkante < 800 bzw. 768.
  - Alle Turmkarten bleiben ohne Scrollen sichtbar (bestehender Browser-Test aus shop-kompakt bleibt grün).

### B-056: Handy: Turm-Panel als feste Leiste am unteren Rand (Muss, Design-Prüfung)
- Status: fertig
- Aufwand: M
- Idee: Auf dem Handy liegt das Turm-Panel (Verbessern, Verkaufen, Zielregel) unter Spielfeld und Bedienleiste; man muss scrollen und sieht das Feld nicht mehr. Der Turmname fehlt, weil `aside h3 { display:none }` (style.css ca. Zeile 217) auch `#ti-name` versteckt. Lösung: Panel als feste Leiste (Schublade) am unteren Bildschirmrand mit Name, Stufe, Verbessern, Verkaufen, Zielregel; Schließen per Tippen aufs Feld. Risiko: Leiste verdeckt unten das Feld. Screenshots: m390-4select.png, m360-4select.png im Scratchpad der Design-Prüfung 2026-11-21.
- Akzeptanzkriterien:
  - Bei 390x844 und 360x740 liegen nach dem Antippen eines Turms Verbessern und Verkaufen komplett im Bild (Unterkante < innerHeight) und sind mindestens 44 px hoch.
  - Turmname und Stufe sind sichtbar.
  - Das Canvas bleibt mit mindestens 280 px Höhe sichtbar.
  - Browser-Test für beide Größen; kein horizontaler Scroll.

### B-070: Shop-Karten (Design-Overhaul)
- Status: fertig
- Aufwand: S
- Idee: Mini-Turm-Vorschau aus den neuen Sprites, Preis mit Münz-Icon. Verknüpft mit B-056/B-057.
- Akzeptanzkriterien:
  - Kartenhöhe nicht größer als jetzt, alle Karten ohne Scrollen erreichbar.
  - Kontrast Text/Hintergrund mindestens 4,5:1.

### B-098: Karte Wald entfernen
- Status: fertig
- Aufwand: S
- Idee: Rückmeldung des Menschen aus dem Spieltest: Der Wald macht keinen Spaß und kann komplett weg. Freischalt-Reihenfolge danach Wiese, Eiswelt, Zangenangriff, Zwei Fronten.
- Akzeptanzkriterien:
  - `MAPS.forest` entfernt, alte Spielstände mit Wald-Eintrag laden ohne Fehler (Eintrag fällt weg).
  - Hindernis-Mechanik bleibt erhalten und wird per Override getestet.

### B-099: Feste Seiten für Gegner, neue Karte Zwei Fronten
- Status: fertig
- Aufwand: M
- Idee: Rückmeldung des Menschen: Karten wie der Zangenangriff machen Spaß; unterschiedliche Gegner auf beiden Seiten, damit man auf beiden Seiten bauen muss. `MAPS.<id>.lanes` legt Gegnertypen auf einen Weg fest (oben Flitzer, unten Troll/Schildträger/Schamane), Goblins und Bosse wechseln weiter ab. Neue Karte „Zwei Fronten“ mit zwei getrennten Wegen, die erst kurz vor dem Ausgang zusammenlaufen.
- Akzeptanzkriterien:
  - Feste Seiten auf Zangenangriff und Zwei Fronten; nur eine Seite verteidigen verliert (Strategie-Test).
  - Strategie über beide Wege gewinnt Welle 20 auf beiden Karten mit Reserve unter 10 Leben (Pfeil-Mix Zangenangriff, Kanonen-Mix Zwei Fronten).
  - Deko (Baumrahmen, Bodenflecken, Akzente, Streu-Deko) meidet alle Wege, nicht nur den Hauptweg.

### B-095: Boss und Effekte: Feinschliff (Hinweise aus dem Block-Review B-067/B-068)
- Status: fertig
- Aufwand: S
- Idee: (1) Restliche Zeichenzahlen in `src/render-fx.js` (`drawSniperShot` lineWidth 3, Blitz-Faktoren 0.6/0.3, Eis `/1.5`, Chill-Farbe in `drawEffectOver`) nach `FX_STYLE` in `config.js`. (2) Treffer-Blitz 0,14 s gegen 0,08 s aus `docs/STIL.md` abstimmen. (3) Boss-Auftritt wiederholt sich nach Zeitsprung/Reset (Testseite, `syncTime` → `resetFx` leert `seenEnemies`). (4) Staub-Partikel beim Boss-Auftritt, ohne den globalAlpha-Test zu verletzen.
- Akzeptanzkriterien:
  - Keine Magic Numbers in `render-fx.js`, `npm test` grün.

### B-096: HUD und Knöpfe: Feinschliff (Hinweise aus dem Block-Review B-058/B-069)
- Status: fertig
- Aufwand: S
- Idee: (1) Restliche Emoji außerhalb von HUD/Knöpfen: 🔒 in den Kartenoptionen, 🏆/💀 im Overlay-Titel, 🏰 in der Überschrift. (2) Tastenkürzel auch bei „Ziel: … (T)“ und `<kbd>` auf den Turmkarten über `.key` auf dem Handy ausblenden; Pause-Banner zeigt auf dem Handy noch „P drücken“. (3) `#ffffff` in `src/render-icons.js` (Zoom-Glanzpunkt) nach `ICON.colors`. (4) `abilityView` gegen `uses` undefined („NaN×“) und `left` NaN (meldet „bereit“) härten.
- Akzeptanzkriterien:
  - Keine Emoji mehr in sichtbarer Spiel-UI außer wo technisch nötig; Randfälle mit Test; `npm test` grün.

### B-097: Turm-Panel: Feinschliff (Hinweise aus dem Block-Review B-056/B-057/B-070)
- Status: fertig
- Aufwand: S
- Idee: (1) Nach Klick auf × (`#ti-close`) geht der Tastaturfokus verloren; Fokus auf `#game` oder die letzte Turmkarte setzen. (2) aria-label „Schließen“ → „Turm-Panel schließen“. (3) Desktop: Leerzeichen vor der schließenden Klammer in „Verbessern (38 [Münze] )“ (`actionHtml` in `src/main.js`). (4) `main { padding-bottom: 140px }` im Handy-Block aus der echten Leistenhöhe ableiten (safe-area, große Schrift). (5) „Scharfschütze“ bricht am Desktop mit Tasten-Badge um (Karte 78 statt ~58 px). (6) `contrastRatio` versteht nur `#rrggbb`.
- Akzeptanzkriterien:
  - Fokus bleibt nach dem Schließen sinnvoll, keine Lücke vor der Klammer, Leiste verdeckt bei 200 % Schrift nichts; `npm test` grün.

### B-101: Startkarte merken
- Status: fertig
- Aufwand: S
- Idee: Wunsch des Menschen am 2026-11-26: Wer Wiese und Wald geschafft hat, soll nicht jedes Mal Wiese vorgewählt bekommen. Das Spiel startet auf der zuletzt gewählten Karte, sonst auf der neuesten freigeschalteten.
- Akzeptanzkriterien:
  - `startMap(progress)` in `src/progress.js` mit Tests; `lastMap` wird beim Kartenwechsel gespeichert und bei neuer Freischaltung gelöscht; alte Speicherstände laden weiter; Testmodus unverändert.

### B-103: Wenige Hindernisse auf allen Karten
- Status: fertig
- Aufwand: M
- Idee: Hindernisse (`MAPS.<id>.obstacles`) sind seit dem Wald (B-098) auf keiner Karte mehr. Sie sollen auf jeder Karte vorkommen können, aber sparsam: je Karte 2 bis 4 Bäume oder Felsen im Stil der Karte, auf der Wasser-Karte (B-104) höchstens 1 bis 2. Kacheln nach Vorschlag des Designers, keine Top-Turmplätze.
- Akzeptanzkriterien:
  - Jede Karte hat 2 bis 4 Hindernisse (Wasser-Karte 1 bis 2), nie auf Weg, Tor oder Ziel. Wiese und Eiswelt zeichnen sie passend zu ihrem Stil.
  - Schwierigkeit per Strategie-Simulation vorher/nachher gemessen (alle Karten, dt 1/30 und 1/60), Werte im Ledger. Die Strategien bleiben gewinnbar, die Wirkung ist gering.

### B-104: Kleiner See und Fluss (Optik, nicht bebaubar)
- Status: fertig
- Aufwand: M
- Idee: Auf einer Karte (Wahl und Kacheln vom Designer) ein kleiner See und ein schmaler Fluss. Beide sind nicht bebaubar (wie Hindernisse, eigene Meldung "Hier ist Wasser"). Wo der Weg den Fluss kreuzt, wird eine Brücke gezeichnet; die Gegner laufen normal. Der Fluss darf die Schwierigkeit nur wenig beeinflussen.
- Akzeptanzkriterien:
  - `MAPS.<id>.water` (Kachel-Liste) in `config.js`; `canBuild` lehnt Wasser ab; Deko meidet Wasser; Brücke auf Weg-Kacheln im Fluss.
  - Wasser im Flat-Pop-Stil (`docs/STIL.md`), Desktop und Handy per Screenshot geprüft.
  - Schwierigkeit per Simulation vorher/nachher gemessen, Werte im Ledger; die Strategien bleiben gewinnbar.

### B-030: Welt Vulkan (Lava-Felder und Lavafluss)
- Status: fertig
- Aufwand: L
- Idee: Fünfte Karte `volcano`, freigeschaltet nach Zwei Fronten, die schwerste Karte. Lava-Kacheln (Lavafluss quer über die Karte plus einzelne Lava-Felder) sind nicht bebaubar. Gegner auf Weg-Kacheln direkt neben Lava nehmen leichten Schaden pro Sekunde; Türme direkt neben Lava überhitzen und schießen langsamer. Entscheidung des Menschen am 2026-11-26: Schaden + Überhitzung, 5. Karte, etwas schwerer als Zwei Fronten.
- Akzeptanzkriterien:
  - `MAPS.volcano` mit `lava` (Kacheln), Brücke wo der Weg den Lavafluss kreuzt (Technik wie Wasser aus B-104); Werte (Schaden/s, Überhitzungs-Faktor, Nachbarschaft) in `src/config.js`.
  - Tests: Gegner neben Lava nehmen Schaden, weiter weg nicht; Turm neben Lava hat längere Schussrate; Lava ist nicht bebaubar; Freischaltung nach Zwei Fronten.
  - Optik im Flat-Pop-Stil: dunkles Vulkangestein, glühende Lava mit Kontur, Brücke aus Stein oder dunklem Holz; Desktop und Handy per Screenshot.
  - Balancing per Simulation (dt 1/30 und 1/60): mindestens eine robuste Strategie gewinnt Welle 20, mit weniger Reserve als auf Zwei Fronten; eine schwache Strategie verliert.

### B-112: Meteor stärker und mit Spezialfähigkeits-Animation
- Status: fertig
- Aufwand: M
- Idee: Wunsch des Menschen am 2026-11-26: Der Meteor macht zu wenig Schaden, braucht mehr Reichweite und eine bessere Animation, damit er wie eine echte Spezialfähigkeit aussieht. Ursache: fester Schaden 150, während Gegner-HP mit `hpScale` wachsen (Welle 20: Goblin 437, Troll 4917 HP).
- Akzeptanzkriterien:
  - Schaden wächst mit der Welle (`hpScale`), Radius deutlich größer als 1,8; Werte in `config.js`, Beschreibungstext passt sich an.
  - Animation: sichtbarer Einschlag von oben, Explosion, Schockwelle, Krater/Brandfleck, Partikel; Bildschirm-Wackeln nur ohne `prefers-reduced-motion`.
  - Balancing gemessen: Test „perfektes Spiel möglich“ und alle Schwierigkeits-Tests bleiben grün.

### B-113: Sounds für Schüsse und besiegte Gegner
- Status: fertig
- Aufwand: M
- Idee: Wunsch des Menschen am 2026-11-26: Man soll hören, wenn Türme schießen und wenn Gegner sterben; das erhöht den Spielspaß. Töne werden mit der Web-Audio-API erzeugt (keine Sounddateien, keine Abhängigkeit).
- Akzeptanzkriterien:
  - Jeder Turmtyp (Pfeil, Kanone, Frost, Scharfschütze, Blitz) hat einen eigenen, kurzen Schuss-Ton; besiegte Gegner einen „Plopp“, der Boss einen größeren Ton.
  - Erkennung der Ereignisse aus dem Spielzustand in einem reinen Modul ohne DOM (in Node getestet); `game.js` bleibt unverändert.
  - Begrenzung: höchstens wenige Töne pro Zeitfenster und Art, auch bei Tempo ×3 kein Lärm; Lautstärke leise. Alle Zahlen in `config.js` (`SOUND`).
  - Ton an/aus per Knopf und Taste M, Wahl gespeichert; AudioContext erst nach der ersten Nutzeraktion; ohne Web Audio läuft das Spiel normal weiter.

### B-114: Aufgenommene Sounddateien statt Synthese
- Status: fertig
- Aufwand: M
- Idee: Entscheidung des Menschen am 2026-11-26 nach Recherche (Vorbild-Prinzip Kingdom Rush: echte Aufnahmen, Schüsse leise, Ereignisse deutlich): Töne aus kurzen, frei lizenzierten Aufnahmen (CC0, z. B. Kenney.nl) statt Web-Audio-Synthese. Keine fremden Spiel-Assets kopieren.
- Akzeptanzkriterien:
  - Dateien in `assets/sounds/`, Format für alle Browser (AAC/.m4a), zusammen höchstens ca. 400 KB; Herkunft und Lizenz je Datei in `assets/sounds/LIZENZ.md`.
  - Gleiche Ereignisse, Begrenzung und Ton-Schalter wie B-113; Laden erst nach der ersten Nutzeraktion, fehlende Datei = Synthese-Ton als Ersatz oder still, nie ein Fehler im Spiel.
  - Mehrere Varianten je Ton, zufällig gewählt, plus leichte Tonhöhen-Variation; Lautstärken in `SOUND`.

### B-115: Töne für Bauen, Ausbauen, Verkaufen und Wellenstart
- Status: fertig
- Aufwand: S
- Idee: Wunsch des Menschen am 2026-11-26: Ereignis-Töne nach dem Kingdom-Rush-Prinzip. Bauen: Hämmern/Holz; Ausbauen: aufsteigender, „besser werdender“ Klang; Verkaufen: Münzen; Wellenstart: kurzes Horn.
- Akzeptanzkriterien:
  - Erkennung in `src/sound-events.js` (rein, getestet); `game.js` unverändert. Kein Ton bei abgelehntem Bau oder Ausbau.
  - Dateien und Lizenz wie B-114.

### B-116: Hintergrundmusik
- Status: fertig
- Aufwand: M
- Idee: Wunsch des Menschen am 2026-11-26: ruhige Musikschleife (frei lizenziert, CC0) im Hintergrund, leiser als die Effekte.
- Akzeptanzkriterien:
  - Startet erst nach der ersten Nutzeraktion, nahtlose Schleife, mit dem Ton-Knopf aus; kein Lautstärkeregler (Wunsch des Menschen).
  - Datei höchstens ca. 1,5 MB, Lizenz in `assets/sounds/LIZENZ.md`.

### B-117: Bauplatz-Inseln entfernen
- Status: fertig
- Aufwand: S
- Idee: Wunsch des Menschen am 2026-11-26: Die Gras-Inseln unter den Türmen (B-082) gab es nur auf der Wiese; Türme sollen auf allen Karten gleich aussehen. Inseln ganz entfernen statt auf alle Karten ausweiten.
- Akzeptanzkriterien:
  - Keine Insel unter gebauten Türmen und in der Bau-Vorschau, auf keiner Karte; `npm test` grün.

### B-118: Eigene Hintergrundmusik je Welt
- Status: fertig (Mensch hat am 2026-11-26 angefragt: "in jeder Welt eine andere Hintergrundmusik für mehr Abwechslung")
- Aufwand: S
- Idee: Jede Karte (Wiese, Eiswelt, Zangenangriff, Zwei Fronten, Vulkan) bekommt einen eigenen CC0-Titel. Die Titel lädt der Mensch selbst herunter; Lizenz-Nachweis in `assets/sounds/LIZENZ.md`.
- Akzeptanzkriterien:
  - `SOUND`-Config `music` erhält eine Zuordnung Karte -> Datei (`byMap`), `file` bleibt Rückfall für Karten ohne eigenen Titel.
  - Beim Kartenwechsel wird der alte Titel ausgeblendet und der neue geladen und eingeblendet; jeder Titel wird nur einmal geladen (Cache).
  - Scheitert das Laden eines Kartentitels, läuft der Rückfalltitel (still, ohne Fehler).
  - Tests in `tests/sound.test.js` für die Auswahl der URL je Karte und den Rückfall.

### B-005: Vorzeitiger Wellenstart mit Gold-Bonus
- Status: fertig (Mensch hat am 2026-11-26 freigegeben: "früher auf nächste Welle klicken für etwas mehr Gold")
- Aufwand: M
- Idee: Wer die nächste Welle startet, während die aktuelle noch läuft, bekommt einen Bonus (Prozentsatz von `waveBonus`). Erfordert mehrere parallele Spawn-Queues. Risiko: Balancing (Gold-Exploit).
- Akzeptanzkriterien:
  - `EARLY_START_BONUS = 0.5` steht in `src/config.js`.
  - `startWave` ist bei laufender Welle erlaubt, solange `state.wave < MAX_WAVES` und alle Gegner der laufenden Welle gespawnt sind (Entscheidung des Menschen 2026-11-26 gegen Gold-Stapeln).
  - Bonus ist `floor(waveBonus(wave) * EARLY_START_BONUS)` der neu gestarteten Welle, sofort gutgeschrieben (mit Münz-/Text-Effekt); gilt nicht, wenn keine Welle aktiv ist.
  - Der normale Wellenbonus geht nicht verloren: jede Welle zahlt ihren `waveBonus` genau einmal, wenn alle ihre Gegner gespawnt und besiegt/durchgelaufen sind (oder einfacher: die laufende Welle bekommt ihn beim frühen Start sofort). Test dafür.
  - Gegner behalten die HP-Skalierung ihrer eigenen Welle (Spawn-Einträge tragen ihre Wellennummer), auch wenn inzwischen eine spätere Welle gestartet wurde. Test dafür.
  - Test: Zwei Wellen laufen parallel, alle Gegner spawnen zum korrekten Zeitpunkt (relativ zum Start ihrer Welle).
  - Test: `status` wird erst 'won', wenn alle Wellen gespawnt und alle Gegner tot sind.
  - HUD: Der Knopf „Welle starten“ bleibt während einer Welle bedienbar (bis Welle 20) und zeigt dann den Bonus an (z. B. „Nächste Welle +7“); Leertaste wie bisher. Desktop und Handy prüfen.
  - Balancing per Strategie-Simulation messen (Karten Wiese, Eis, Zangenangriff, Zwei Fronten, Vulkan; dt 1/30 und 1/60): bestehende Strategien unverändert (sie rufen nicht früh), plus eine Strategie, die früh ruft. Ergebnis im Bericht; das Spiel soll nicht deutlich leichter werden.

### B-121: Nächste Welle startet automatisch
- Status: fertig (Mensch hat am 2026-11-26 entschieden: 5 Sekunden Countdown, immer an, kein Schalter, Countdown sichtbar und per Klick sofort startbar)
- Aufwand: M
- Idee: Sind alle Gegner einer Welle besiegt oder durchgelaufen, startet die nächste Welle nach einem Countdown automatisch. Vor Welle 1 bleibt es beim manuellen Start.
- Akzeptanzkriterien:
  - `AUTO_WAVE_DELAY = 5` (Sekunden Spielzeit) steht in `src/config.js`.
  - Nach Wellenende (ab Welle 1, solange `status === 'playing'` und `wave < MAX_WAVES`) läuft ein Countdown in `game.js`; bei 0 startet `startWave`. Pause hält den Countdown an; das Spieltempo gilt auch für ihn.
  - Klick/Leertaste während des Countdowns startet sofort (kein Frühstart-Bonus, da keine Welle läuft) und beendet den Countdown. Frühstart während laufender Welle (B-005) bleibt unverändert.
  - Kein Countdown nach Welle 20, nach Sieg oder Niederlage.
  - HUD: Knopf zeigt während des Countdowns z. B. „Welle 5 in 3…“ (ganze Sekunden, aufgerundet); Wellenvorschau bleibt sichtbar. Desktop und Handy prüfen (Screenshot).
  - Tests: Countdown startet die Welle nach 5 s, nicht vor Welle 1, Pause hält an, manueller Start bricht den Countdown ab, kein Countdown nach Welle 20/Sieg/Niederlage.
  - Balancing: Strategie-Simulationen messen (5 Karten, dt 1/30 und 1/60). Ändert sich ein bestehendes Balancing-Testergebnis, Test nicht anpassen, sondern melden (Mensch entscheidet).

### B-119: Musik-Gain nach Kartenwechsel trennen
- Status: fertig (Mensch hat am 2026-11-26 freigegeben)
- Aufwand: S
- Idee: Nach `stopMusic` in `src/audio.js` bleibt der alte Gain-Knoten mit `ctx.destination` verbunden (ein toter Knoten je Kartenwechsel, Reviewer-Hinweis zu B-118). `src.onended = () => gain.disconnect()`.
- Akzeptanzkriterien:
  - Nach einem Kartenwechsel ist der alte Gain getrennt (Fake-Audio-Test in `tests/sound.test.js`).

### B-120: Lava und Meteor nach Gegnerwelle skalieren
- Status: fertig (Mensch hat am 2026-11-26 freigegeben, inkl. Balancing-Wirkung)
- Aufwand: S
- Idee: Lava-Schaden (`game.js` nearLava/hpScale) und Meteor-Schaden skalieren mit `state.wave`, also der höchsten gestarteten Welle. Nach einem Frühstart (B-005) bekommen Gegner der vorigen Welle dadurch etwas mehr Schaden. Mit der Welle des Gegners skalieren (Tester-Hinweis zu B-005). Balancing: Mensch entscheidet.
- Akzeptanzkriterien:
  - Gegner speichern ihre Welle; Lava/Meteor nutzen sie. Test mit zwei parallelen Wellen.

### B-126: Neuer Gegner „Magier“ (Schildzauber)
- Status: fertig
- Aufwand: M
- Idee: Der Magier wirft alle `wardInterval` Sekunden einen magischen Schild auf alle anderen Gegner im Umkreis `wardRadius`. Der Schild schluckt Schaden bis `wardShare` × maxHp des Ziels (jeder Schaden, auch Splash, Kette und Lava), danach geht Schaden wieder auf die HP. Kein Stapeln: ein neuer Zauber füllt den Schild nur bis zum Höchstwert auf. Der Magier schützt sich nicht selbst. Ergänzt den Schamanen (Heilung) und macht Gruppen zäher. Vom Menschen freigegeben am 2026-11-26, Vorgabe: Spiel etwas schwerer, Magier kommen zusätzlich dazu.
- Akzeptanzkriterien:
  - `ENEMY_TYPES.mage` in `config.js` mit allen Zahlen (`hp`, `speed`, `reward`, `wardRadius`, `wardInterval`, `wardShare`); Logik in `game.js` ohne DOM.
  - Wellen: ab etwa Welle 8 zusätzlich 1 + floor((Welle − 8) / 4) Magier, in oder kurz nach der Troll-Gruppe. Auf Karten mit `lanes` eine passende feste Seite (wie Schamane).
  - Tests: Schild schluckt Schaden bis zur Grenze, Restschaden geht auf HP; kein Stapeln; Magier schützt sich nicht selbst; Schild auch gegen Splash.
  - Test „perfektes Spiel möglich“ bleibt auf allen Karten grün; Standard-Strategien gemessen, Messwerte im Ledger.
  - Darstellung: eigene Figur im Flat-Pop-Stil (Robe, Hut, Stab) und gut sichtbare Schild-Blase um geschützte Gegner; Wellenvorschau und Sounds kennen den neuen Typ.

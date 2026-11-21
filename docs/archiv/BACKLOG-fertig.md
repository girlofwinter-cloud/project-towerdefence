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

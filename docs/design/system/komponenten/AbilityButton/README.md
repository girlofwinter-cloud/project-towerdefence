# Fähigkeitsknopf

Der Fähigkeitsknopf löst Meteor, Kälte und Reparatur aus; 64 px, Farbe je Fähigkeit, Abklingen als dunkler Kuchen.

**Wann:** nur für die Fähigkeiten in der Leiste links (`.ability-bar`, senkrecht, Abstand `space-plaque-x`). Handy: `size-ability-mobile` (56 px); quer (B-137) untereinander links unten, Abstand 16, ohne Beschriftung (Name nur im `aria-label`).

**Aufbau:** `.ab[data-ability]` mit SVG-Icon 46 px, `.ab-cd` (Kuchen), `.ab-num` (Sekunden), `.ab-badge` (Ladungen), `.cap` (Name unten, `ink`-Schild), `.key-badge` (Taste oben links).
- Rand `stroke-ui-bold` (4 px) `ink`, Schatten `shadow-ability`.
- Fläche radial 35 % 30 %: Meteor `ab-meteor-a` → `ab-meteor-b`, Kälte `ab-freeze-a` → `ab-freeze-b`, Reparatur `ab-repair-a` → `ab-repair-b`.
- Kuchen: `conic-gradient(cooldown 0 (1 − --fill)·100 %, transparent)`; `--fill` 0..1 aus `abilityView`.

**Zustände:** bereit · lädt (Kuchen + Zahl, Lilita 24) · Ladungen (Badge `gold`, 26 px) · zielt (`.aiming`, `shadow-ability-aiming`) · verbraucht (`data-state="used"`, entsättigt) · `.pop` beim Wechsel lädt → bereit (Skalierung 1.12, 0,5 s).

Bauvorlage: `docs/design/elemente/HUD-Faehigkeiten.md`. Icons: `faehigkeit-*`.

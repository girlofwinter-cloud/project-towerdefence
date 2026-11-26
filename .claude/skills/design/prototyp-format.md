# Prototypen in Claude Design: Formatregeln für den designer

Der designer schreibt Zeichenflächen (Artboards) für eine Claude-Design-Fläche (Artefakt vom Typ "Design"). Er schreibt nur Dateien im Scratchpad, der Orchestrator veröffentlicht. Diese Regeln stammen aus den Anweisungen des Design-Typs (Stand 2026-11-26); bei Abweichungen gelten die Anweisungen, die der Orchestrator beim Anlegen der Fläche erhält.

## Dateien
- `<ordner>/project/canvas.json`: Index. Form: `{"v":3,"createdOnFiles":{"v":1,"at":"<jetzt, RFC 3339>"},"title":"…","launch":{"view":"canvas"},"pages":[],"boards":{"Main.dc.html":{"x":0,"y":0,"w":1280,"h":800,"title":"…","is_interactive":true}},"order":["Main.dc.html"],"notes":{},"designSystems":[]}`. Je Zeichenfläche ein Eintrag in `boards` und `order`; 80 px Abstand in einer Reihe, 120 px zwischen Reihen. `is_interactive` nur, wenn Knöpfe wirklich etwas tun.
- `<ordner>/project/<Name>.dc.html`: je Zeichenfläche eine Datei, die erste heißt `Main.dc.html`. Namen ohne Leerzeichen.
- Bilder werden vorher vom Orchestrator als Assets hochgeladen; im Markup steht die `/_blob/…`-URL wörtlich.
- Nicht rendern oder per Playwright prüfen: Das Format läuft nur in Claude Design.

## Format einer Zeichenfläche (.dc.html) – Regeln, die still fehlschlagen
```html
<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Desktop</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<style>
body{margin:0}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
</style>
</helmet>
<div style="width: 1280px; height: 800px; position: relative; overflow: hidden">
  ... Markup mit {{hole}} ...
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"plaketten":{"editor":"enum","options":["A Holz","B Gold"],"default":"A Holz"},"$preview":{"width":1280,"height":800}}'>
class Component extends DCLogic {
  renderVals() { return { ... }; }
}
</script>
</body>
</html>
```
- Kopfzeile `<script src="./support.js"></script>` EXAKT so. Jedes Element schließen, jedes Attribut quoten.
- `{{ pfad }}` ist nur ein Punkt-Lookup in `renderVals()` (z. B. `{{ ring.style }}`, `{{ item.label }}`), NIE ein Ausdruck (`{{a+b}}`, `{{!x}}` scheitern). Alles in `renderVals()` vorberechnen.
- Attribut `x="{{ p }}"` gibt den Rohwert (Funktion, Zahl), `x="a {{p}} b"` einen String. `style="left: {{ t.x }}px; top: {{ t.y }}px"` ist erlaubt für zustandsabhängige Werte.
- Ereignisse: `onClick="{{ handler }}"`, `onMouseEnter="{{ ... }}"` (JSX-camelCase); Handler kommen aus `renderVals()`. Pro Element einer Liste: in `renderVals()` `items: xs.map(x => ({...x, pick: () => this.setState({...})}))`, dann `onClick="{{ item.pick }}"`.
- Schleifen/Verzweigungen: `<sc-for list="{{ items }}" as="item" hint-placeholder-count="3"> … {{ item.x }} … </sc-for>`, `<sc-if value="{{ cond }}" hint-placeholder-val="{{ true }}"> … </sc-if>`. Für "sonst" eine zweite `sc-if` mit dem Gegenwert aus `renderVals()`.
- Logik: klassisches JS, `class Component extends DCLogic`, `this.state`/`this.setState`, kein `render()`, kein import, kein `innerHTML`/`appendChild`, keine globalen keydown-Handler, kein `window.X`.
- `data-props` in EINFACHEN Anführungszeichen, JSON; `&` als `&amp;`, `'` als `&#39;`. Wenige Tweaks (Hebel, keine Texte). Fallback in `renderVals()`: `this.props.x ?? default`.
- Unterkomponente: `<dc-import name="Main" device="quer" hint-size="844px,390px"></dc-import>` bindet `Main.dc.html` ein; Prop kommt als `this.props.device` an. Deklariere `device` in Main als `{"editor":"enum","options":["desktop","quer","hoch"],"default":"desktop"}`. Die Handy-Dateien sind dann nur Hülle: gleicher Kopf, `<helmet><style>body{margin:0}</style></helmet>`, Root `<div style="width:844px;height:390px">` mit dem dc-import, und ein Script-Block (`class Component extends DCLogic { renderVals(){ return {}; } }`, `$preview` passend).
- Echte `<button>` mit `aria-label` für Icon-Knöpfe (nie onClick auf div/span); Tippziele ≥ 44 px; Text-Kontrast ≥ 4,5:1. Keine Emoji, Icons nur als die Bilder unten oder Inline-SVG mit Strich. Kein Netzwerk außer den Bild-URLs unten. Kein `<iframe>`.
- Bilder: `<img src="/_blob/…" alt="…">` mit der URL WÖRTLICH; als CSS-Hintergrund nur in einer `<helmet><style>`-Regel, nicht inline.
- Sprache: alle Texte Deutsch.

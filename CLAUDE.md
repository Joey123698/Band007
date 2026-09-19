# CLAUDE.md

Arbeitsanweisungen für Claude Code in diesem Repo.
Aufbau des Systems: [ARCHITECTURE.md](ARCHITECTURE.md). Kurzfassung: [README.md](README.md).

## Was das hier ist

BandSync — interne Band-Plattform, React + Firebase, **statisch auf GitHub
Pages**, **kein Build-Schritt**. JSX wird im Browser von Babel-Standalone
übersetzt, Tailwind kommt vom Play-CDN.

**Die Seite ist live und hat echte Nutzerdaten in Firestore.** Jeder Push auf
`main` deployt sofort. Entsprechend vorsichtig arbeiten.

## Harte Regeln

1. **`js/core/firebase-config.js` nicht ändern.** Daran hängen alle
   bestehenden Konten und Firestore-Daten. Auch nicht „aufräumen“.
2. **Kein Build-Schritt einführen** (npm, Vite, Bundler), außer der Nutzer
   fragt ausdrücklich danach. Das Deploy ist `git push`.
3. **Keine `import`/`export`.** Alle JS-Dateien teilen einen globalen Scope.
   Neue Datei → in `index.html` eintragen, **vor** der ersten Verwendung und
   vor `js/app.js`. Wird das vergessen, ist die Komponente `undefined`.
4. **Nicht committen oder pushen, wenn der Nutzer nicht darum bittet.**
5. **Die `border-width:0;border-style:solid`-Zeile in `css/styles.css` bleibt.**
   Ohne sie zeichnet Tailwinds `border` keinen Rahmen (preflight ist aus).

## Styling

Tailwind-Klasse für Statisches, Inline-`style` für Werte aus Props/State.
Farben über die Theme-Tokens (`bg-surf`, `text-ink-2`, `border-line`,
`rounded-theme`), nicht hart kodiert — sonst folgt es dem Theme-Wechsel nicht.
Token-Tabelle steht in [ARCHITECTURE.md](ARCHITECTURE.md#5-theming).

Zwei Fallen:

* `text-xs` / `text-sm` setzen **auch** eine `line-height`. Wenn nur die
  Schriftgröße gemeint ist: `text-[12px]`, `text-[14px]`.
* `border-t` + `border-line` färbt alle vier Kanten. Sichtbar ist nur die mit
  Breite — beim Debuggen nicht irritieren lassen.

## Sprache

Die Oberfläche ist **deutsch**. Neue Strings auf Deutsch, im Ton der
bestehenden ("Probe", "Setliste", "Bühnenreif", "Verantwortlich").
Code-Kommentare ebenfalls deutsch. Der Nutzer schreibt vietnamesisch —
Antworten im Chat auf Vietnamesisch, Code und UI bleiben deutsch.

## Lokal testen

```bash
python -m http.server 8123
```

<http://localhost:8123>. `.claude/launch.json` startet dasselbe über
`preview_start`. **`file://` funktioniert nicht** — Babel lädt die JS-Dateien
per Fetch.

Es gibt keine Tests. Nach Änderungen an `js/components/ui.js` oder
`css/styles.css` die Seiten durchklicken: beide wirken global.

## Visuelle Änderungen prüfen

Für Umbauten, die das Aussehen nicht verändern *sollen* (Refactoring,
Tailwind-Migration, CSS-Umstellung), lohnt ein Computed-Style-Vergleich statt
Draufschauen. Bewährtes Vorgehen:

1. Die alten Dateien nach `js_old/` kopieren (inkl. `css/styles.css`).
2. Zwei Harness-Seiten bauen, die dieselben Komponenten mit Fixture-Daten und
   gemocktem `db`/`auth` rendern — eine gegen `js_old/`, eine gegen `js/`.
3. Alle `getComputedStyle`-Werte einsammeln; die alte Seite legt sie in
   `localStorage`, die neue vergleicht und zählt Differenzen.
4. **Vor dem Messen warten, bis sich das Layout nicht mehr ändert.** Sonst
   misst man den Webfont-Swap (Inter gegen Fallback) statt echter Unterschiede
   — das erzeugt Hunderte falscher Treffer. `document.fonts.ready` hilft hier
   *nicht*, weil das Tailwind-CDN laufend Styles nachschiebt; stattdessen
   `offsetWidth/offsetHeight` aller Knoten pollen, bis zwei Messungen gleich sind.
5. Das Ergebnis-`<pre>` erst anhängen, **nachdem** `#root` entfernt wurde —
   sonst ist die Seite zu groß zum Auslesen.

Danach `js_old/` und die Harness-Dateien wieder löschen.

## Bekannte Eigenheiten

* `CommentsThread` nutzt bewusst nur **ein** `where('docId','==',…)` und
  sortiert clientseitig — so braucht Firestore keinen Composite-Index.
  Nicht in eine `orderBy`-Query umbauen.
* Vorschläge und Songs liegen in **derselben** Collection `songs`,
  unterschieden nur durch `status === 'suggested'`.
* Design-Einstellungen liegen in `localStorage` (`bandsync-design-v3`),
  nicht in Firestore — also pro Gerät.
* `js/core/react-hooks.js` muss die erste geladene JS-Datei bleiben.

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
   Neue Datei → in `index.html` in die Liste `APP_FILES` eintragen, **vor**
   der ersten Verwendung und vor `js/app.js`. Wird das vergessen, ist die
   Komponente `undefined`.
6. **`APP_V` in `index.html` bei jedem Deploy hochzählen.** GitHub Pages
   liefert alles mit `Cache-Control: max-age=600`. Ohne neuen `?v=`-Wert holt
   der Browser die neue `index.html`, aber die **alten** `.js`/`.css` unter
   denselben Namen — das sieht aus, als wäre der Deploy nicht angekommen.
   Ist einmal passiert; nicht wieder drauf reinfallen.
   Seit dem Service Worker hängt daran noch mehr: `APP_V` benennt den
   Cache (`bandsync-<v>`) und steht in der Adresse von `sw.js`. Hochzählen
   installiert den Worker neu und löscht den alten Cache — vergisst man es,
   bleibt die Band auf der alten Fassung sitzen, bis jemand die Seitendaten
   löscht.
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
   misst man den Webfont-Swap (Archivo/Plex gegen Fallback) statt echter Unterschiede
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
* Vorschläge („Ideen“) und Songs liegen in **derselben** Collection `songs`,
  unterschieden nur durch `status === 'suggested'`. Sie haben keinen eigenen
  Reiter mehr, sondern stehen als Abschnitt/Filter im Repertoire.
* Verfügbarkeit hat zwei Ebenen: `slots` (Standardwoche, Wochentag) und
  `dates` (einzelne Kalendertage, `false` = Ausnahme). Immer über
  `availAt()` lesen, nie direkt — sonst geht der Vorrang verloren.
* Das Verfügbarkeitsraster nutzt **Pointer Events**, nicht Maus-Events —
  `mouseenter` feuert auf dem Telefon nie, Ziehen war dort unmöglich.
  Der Malmodus ist ein sichtbarer Schalter, damit `touch-action: none`
  nur dann gilt und das Scrollen der Seite nicht verlorengeht. Während
  eines Zuges wird **lokal** geändert und erst beim Loslassen einmal
  geschrieben; nicht auf Schreiben pro Zelle zurückbauen.
* Beim Testen mit einer Harness-Seite den **Service Worker abmelden**.
  Er liegt von den PWA-Tests auf `localhost` und liefert Dateien ohne
  `?v=` aus dem Cache — sonst testet man alten Code.
* Das Songblatt (`songs.sheet`) ist ChordPro-artiger Text; die Syntax steht
  in [ARCHITECTURE.md](ARCHITECTURE.md#das-blatt) und wird von `parseSheet()`
  in `js/core/chords.js` gelesen. `sheet` ist die **einzige** Ablage — auch
  Markierungen (Atem/Halten) stehen dort, nicht in einem zweiten Feld.
* Beim Einfügen wandelt `normalizeSheet()` das Zwei-Zeilen-Format von
  Akkordseiten um. Die Erkennung ist absichtlich streng (jedes Wort der Zeile
  muss ein Akkord sein *und* darunter muss Text stehen) — beim Lockern fangen
  deutsche Zeilen wie „Am Himmel …“ an, als Akkorde durchzugehen.
* Eine Probe aus einer Rasterzelle setzt **keine** Zusagen. Verfügbarkeit ist
  nicht Teilnahme; das bestätigt jede Person selbst.
* Rollen sind **mehrere** (`users.roles[]`). `users.role` bleibt als erste
  Rolle bestehen, weil Kommentare und Zusagen eine einzelne speichern. Immer
  über `rolesOf()` / `mainRole()` lesen, nie direkt `profile.role`.
* Der Zustand steht im **Hash** (`parseRoute()` / `go()` in `helpers.js`),
  damit die Zurück-Taste funktioniert und Links auf einen Song teilbar sind.
  Navigation also immer über `go('#/…')`, nicht über `setState`.
* Wo etwas fehlt, muss man es **sehen**: fehlende Probenzeiten und offene
  Zusagen werden ausdrücklich angezeigt. Bei drei Leuten ist „wer hat noch
  nicht geantwortet“ die eigentliche Frage — nicht die Zahl der Zusagen.
* Design-Einstellungen liegen in `localStorage` (`bandsync-design-v4`),
  nicht in Firestore — also pro Gerät. Den Schlüssel hochzählen, wenn ein
  Redesign alte Theme- oder Font-Namen entfernt.
* `js/core/react-hooks.js` muss die erste geladene JS-Datei bleiben,
  `js/components/icons.js` muss vor `ui.js` kommen.
* Avatare sind **Initialen** (`Av` in `ui.js`, `initials()` in `helpers.js`).
  Das Firestore-Feld `users.avatar` wird beim Registrieren weiter geschrieben,
  aber nicht mehr angezeigt — nicht „aufräumen“, es ist der Rückweg zu Emoji.

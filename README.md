# BandSync

Interne Band-Plattform (React + Firebase). Läuft als statische Seite auf GitHub Pages —
**kein Build-Schritt**, JSX wird im Browser von Babel-Standalone übersetzt.

> Ausführliche Beschreibung des Aufbaus und wo man was ändert:
> **[ARCHITECTURE.md](ARCHITECTURE.md)** · Arbeitsregeln: **[CLAUDE.md](CLAUDE.md)**

## Projektstruktur

```
index.html                    Gerüst + Lade-Reihenfolge aller Dateien
css/styles.css                Basis-Styles, CSS-Variablen (Theme-Tokens)

js/core/
  react-hooks.js              useState & Co. (muss zuerst geladen werden)
  firebase-config.js          FIREBASE_CONFIG  ← Zugangsdaten zum Projekt band-007
  tailwind-config.js          Tailwind-Theme, verweist auf die CSS-Variablen
  theme.js                    THEMES, FONTS, loadDesign(), applyDesign()
  constants.js                Rollen, Genres, Status, Farben, Avatare
  helpers.js                  uid(), toKey(), getWeekDays(), initials(), availAt(), …
  chords.js                   Transponieren, Griffbilder, Blatt-Parser
  firebase.js                 db, auth, initFB()

js/components/
  icons.js                    Ic() — Strich-Icons (vor ui.js laden)
  ui.js                       Card, Btn, PillBtn, Badge, Inp, Txta, Sel, Fld, Av,
                              SectionLabel, PageHead, Empty
  chordchart.js               ChordDiagram
  sheet.js                    SheetView — Text mit Akkorden, Markieren per Auswahl
  comments.js                 CommentsThread (Sessions + Songs)
  attendance.js               AttendanceSection
  hero.js                     DashboardHero, MiniCalendar
  nav.js                      BottomNav (mobil) + SideNav (ab md)

js/pages/
  auth.js  dashboard.js  schedule.js  songs.js  songdetail.js
  performance.js              Vollbild zum Singen (Autoscroll, Bildschirm bleibt an)
  profile.js

js/app.js                     App() + ReactDOM-Render (muss zuletzt kommen)
```

## Wichtig beim Bearbeiten

* **Alle JS-Dateien teilen sich einen globalen Scope.** Es gibt kein `import`/`export`.
  Eine Funktion aus `helpers.js` ist überall verfügbar — aber nur, wenn die Datei
  **vorher** in `index.html` steht. Neue Datei anlegen → unten in `index.html` eintragen.
* **Lokal testen braucht einen Webserver.** Ein direkter Doppelklick auf `index.html`
  (`file://`) funktioniert nicht, weil Babel die JS-Dateien per Fetch lädt:

```bash
python -m http.server 8123
```

  Dann http://localhost:8123 öffnen. (`.claude/launch.json` startet genau das.)
* **`js/core/firebase-config.js` nicht anfassen** — daran hängen die bestehenden
  Nutzerkonten und Daten in Firestore.

## Tailwind CSS

Eingebunden über das Play-CDN (`cdn.tailwindcss.com`), konfiguriert in
`js/core/tailwind-config.js`. Zwei Dinge sind dort bewusst gesetzt:

* `preflight: false` — der Reset aus `css/styles.css` bleibt maßgeblich.
  Damit Tailwinds `border` / `border-t` trotzdem funktionieren, setzt der
  Universal-Selektor in `css/styles.css` `border-width:0;border-style:solid`
  (genau die eine Preflight-Regel, die Tailwind zwingend braucht).
  Die Border-*Farbe* bleibt bewusst ungesetzt, sonst faerbt sie jedes Element.
* Die Farben zeigen auf die CSS-Variablen, damit der Theme-Wechsel im Profil
  auch für Tailwind-Klassen greift:

| Klasse | Variable |
|---|---|
| `bg-base` | `--bg` |
| `bg-surf` `bg-surf-2` `bg-surf-3` | `--surf` `--surf2` `--surf3` |
| `border-line` `border-line-2` | `--border` `--border2` |
| `text-ink` `text-ink-2` `text-ink-3` | `--text` `--t2` `--t3` |
| `bg-accent` `text-accent` `bg-accent-tint` | `--accent` `--accent-h` `--accent-tint` |
| `text-ok` `-info` `-warn` `-idle` `-danger` | Statusfarben |
| `rounded-theme` `rounded-theme-sm` `rounded-theme-lg` `rounded-pill` | `--r` … |
| `font-app` `font-display` `font-mono` | `--f-body` `--f-display` `--f-mono` |

`accent` ist die einzige Signalfarbe des Designs (Bernstein); die
Statusfarben sind absichtlich gedämpft. Tailwinds eigene Paletten
(`bg-purple-500`, …) funktionieren weiterhin, gehören aber nicht ins Design.

Alle Komponenten und Seiten nutzen Tailwind-Klassen. Werte, die zur Laufzeit
aus Props oder State kommen (`color`, `background`, Gradients, berechnete
Groessen), stehen weiterhin als Inline-`style` daneben — das ist Absicht:
`style={{…}}` ueberschreibt immer die Klassen.

Beim Schreiben neuer Klassen zwei Fallstricke beachten:

* `text-xs` / `text-sm` setzen **auch eine line-height**. Wo nur die
  Schriftgroesse gemeint ist: `text-[12px]`, `text-[14px]`.
* Einseitige Rahmen (`border-t` + `border-line`) faerben alle vier Kanten —
  sichtbar ist nur die Kante mit Breite, aber nicht ueberraschen lassen.

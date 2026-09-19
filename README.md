# BandSync

Interne Band-Plattform (React + Firebase). Läuft als statische Seite auf GitHub Pages —
**kein Build-Schritt**, JSX wird im Browser von Babel-Standalone übersetzt.

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
  helpers.js                  uid(), toKey(), getWeekDays(), …
  firebase.js                 db, auth, initFB()

js/components/
  ui.js                       Card, Btn, PillBtn, Badge, Inp, Txta, Sel, Fld, Av, Empty
  comments.js                 CommentsThread (Sessions + Songs)
  attendance.js               AttendanceSection
  hero.js                     DashboardHero, MiniCalendar
  nav.js                      BottomNav

js/pages/
  auth.js  dashboard.js  schedule.js  songs.js  suggest.js  profile.js

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
  **Folge:** `border` allein zeigt keinen Rahmen, es braucht `border border-solid`.
* Die Farben zeigen auf die CSS-Variablen, damit der Theme-Wechsel im Profil
  auch für Tailwind-Klassen greift:

| Klasse | Variable |
|---|---|
| `bg-base` | `--bg` |
| `bg-surf` `bg-surf-2` `bg-surf-3` | `--surf` `--surf2` `--surf3` |
| `border-line` `border-line-2` | `--border` `--border2` |
| `text-ink` `text-ink-2` `text-ink-3` | `--text` `--t2` `--t3` |
| `bg-brand-purple` `text-brand-gold` … | `--purple` `--gold` … |
| `rounded-theme` `rounded-theme-sm` `rounded-theme-lg` `rounded-pill` | `--r` … |
| `shadow-glow` | `--glow` |

Tailwinds eigene Paletten (`bg-purple-500`, …) funktionieren weiterhin.

`js/components/ui.js` ist bereits auf Tailwind umgestellt; die übrigen Dateien
nutzen noch Inline-Styles. Beides lässt sich mischen — ein `style={{…}}`
überschreibt immer die Klassen.

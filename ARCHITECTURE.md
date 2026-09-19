# Architecture — BandSync

Wie das Projekt aufgebaut ist und **wo man was ändert**.
Für die Kurzfassung siehe [README.md](README.md), für Arbeitsregeln
[CLAUDE.md](CLAUDE.md).

---

## 1. Das Wichtigste in drei Sätzen

BandSync ist eine **statische Single-Page-App** auf GitHub Pages.
Es gibt **keinen Build-Schritt**: React kommt per CDN, JSX wird im Browser von
Babel-Standalone übersetzt, Tailwind kommt über das Play-CDN.
Alle JS-Dateien laufen im **selben globalen Scope** — es gibt kein
`import`/`export`, die Reihenfolge in `index.html` ist die Abhängigkeitskette.

---

## 2. Laufzeit-Kette (was beim Seitenaufruf passiert)

```
index.html
  │
  ├─ css/styles.css                Reset + CSS-Variablen (Theme-Tokens)
  │
  ├─ CDN: React, ReactDOM, Babel, Firebase (compat), Tailwind
  ├─ js/core/tailwind-config.js    normales <script>, direkt nach dem Tailwind-CDN
  │
  ├─ 18 × <script type="text/babel" src="…">   ← Reihenfolge = Abhängigkeiten
  │
  └─ js/app.js
       ├─ applyDesign(loadDesign())     Theme aus localStorage auf :root schreiben
       └─ ReactDOM.createRoot(#root).render(<App/>)
```

`App()` entscheidet dann:

```
App()
 ├─ kein Firebase-Config?  → Hinweis-Screen
 ├─ nicht eingeloggt?      → <AuthScreen/>
 └─ eingeloggt             → <DashboardPage|SchedulePage|SongsPage|SuggestPage|ProfilePage/>
                             + <BottomNav/>
```

---

## 3. Dateien — und wofür man sie öffnet

### `css/styles.css`
Der globale Reset, die CSS-Variablen (`--bg`, `--surf`, `--purple`, `--r`, …),
der Spinner und das Range-Input.

> **Achtung:** Der Universal-Selektor setzt `border-width:0; border-style:solid`.
> Das ist die eine Preflight-Regel, die Tailwind zwingend braucht — ohne sie
> zeichnet `border` / `border-t` **keinen** Rahmen. Nicht entfernen.
> Die Border-*Farbe* bleibt absichtlich ungesetzt.

### `js/core/` — Grundlagen, keine UI

| Datei | Was drin steht | Wann anfassen |
|---|---|---|
| `react-hooks.js` | `const {useState,…} = React` | nie (muss die **erste** JS-Datei bleiben) |
| `firebase-config.js` | `FIREBASE_CONFIG` | **nie** — daran hängen alle Nutzerdaten |
| `tailwind-config.js` | Tailwind-Theme → CSS-Variablen | neue Design-Tokens |
| `theme.js` | `THEMES`, `FONTS`, `loadDesign`, `applyDesign` | neues Farbschema / neue Schriftart |
| `constants.js` | Rollen, Genres, `STATUS_MAP`, `ROLE_COLORS`, `AVATARS` | neue Rolle, neuer Song-Status |
| `helpers.js` | `uid`, `toKey`, `dfmt`, `getWeekDays`, `extractYTId`, … | neue Hilfsfunktion |
| `firebase.js` | `db`, `auth`, `initFB()` | nie |

### `js/components/` — wiederverwendbar

| Datei | Exportiert | Benutzt von |
|---|---|---|
| `ui.js` | `Card` `Btn` `PillBtn` `Badge` `Inp` `Txta` `Sel` `Fld` `Av` `Empty` | überall |
| `comments.js` | `CommentsThread` | Songs + Sessions |
| `attendance.js` | `AttendanceSection` | Dashboard |
| `hero.js` | `DashboardHero`, `MiniCalendar` | Dashboard |
| `nav.js` | `BottomNav` | App |

`ui.js` ist die **Design-System-Schicht**. Eine Änderung dort wirkt auf die
ganze App — genau dafür ist sie da. Einzelne Aufrufstellen können per
`style={{…}}` gezielt überschreiben.

### `js/pages/` — je ein Tab

| Datei | Komponenten | Firestore-Collections |
|---|---|---|
| `auth.js` | `AuthScreen` | `users` (beim Registrieren) |
| `dashboard.js` | `DashboardPage` | liest nur Props |
| `schedule.js` | `SchedulePage`, `SessionCard` | `availability`, `locations`, `sessions` |
| `songs.js` | `SongsPage` | `songs`, `comments` |
| `suggest.js` | `SuggestPage` | `songs` |
| `profile.js` | `ProfilePage` | `users`, `settings` |

### `js/app.js`
Auth-Listener, die zentralen Firestore-Abos (`users`, `sessions`, `songs`,
`settings`), der Tab-State und das finale `render`.

---

## 4. Datenfluss

`js/app.js` ist die **einzige** Stelle, die die Haupt-Collections abonniert.
Die Seiten bekommen alles als Props und rendern nur:

```
Firestore ──onSnapshot──► App-State ──Props──► Pages
   ▲                                             │
   └──────────── db.collection(…).update() ──────┘
```

Schreiben passiert direkt in der jeweiligen Seite; das `onSnapshot`-Abo in
`app.js` liefert die Änderung von selbst zurück. **Kein** manuelles Nachladen
nötig — und kein lokaler State, der die Daten spiegelt.

Zwei Collections werden lokal in `schedule.js` abonniert
(`availability`, `locations`), weil sie nur dort gebraucht werden.

### Firestore-Collections

| Collection | Dokument-ID | Felder (gekürzt) |
|---|---|---|
| `users` | Auth-UID | `displayName`, `role`, `avatar`, `bio`, `skills[]`, `playableSongs[]`, `favoriteSongs[]` |
| `sessions` | auto | `title`, `date`, `time`, `location`, `leadId`, `leadName`, `setlist[]`, `attendance{uid:…}`, `status` |
| `songs` | auto | `title`, `artist`, `genre`, `status`, `votes[]`, `roleAssignments[]`, `structureNotes`, `youtubeLink`, `spotifyLink` |
| `comments` | auto | `docId` (= Song-ID), `userId`, `text`, `createdAt` |
| `sessionComments` | auto | `docId` (= Session-ID), … wie oben |
| `availability` | Auth-UID | `slots{ "<tag>_<stunde>": true }` |
| `locations` | auto | `name` |
| `settings` | `"main"` | `bandName` |

> `CommentsThread` filtert bewusst nur nach **einem** `where('docId','==',…)`
> und sortiert clientseitig. Grund: so braucht Firestore keinen
> Composite-Index. Nicht „optimieren“, sonst bricht es in Produktion.

`songs` trägt beide Welten: `status === 'suggested'` erscheint unter
**Vorschläge**, alles andere unter **Songs**. Der Button „→ Üben“ setzt nur
`status` auf `practicing` — es wird nichts kopiert oder verschoben.

---

## 5. Theming

Eine Kette, drei Glieder:

```
ProfilePage (🎨 Design)
   └─ onDesignUpdate({theme|font|radius})
        └─ applyDesign()  schreibt --bg, --surf, --purple, --r … auf :root
             ├─ css/styles.css      nutzt die Variablen
             ├─ Inline-Styles       nutzen var(--…)
             └─ Tailwind-Klassen    nutzen sie über tailwind-config.js
```

Deshalb folgt **auch jede Tailwind-Klasse** dem gewählten Theme:
`bg-surf` ist `var(--surf)`, nicht eine feste Farbe.

Die Auswahl liegt in `localStorage` unter `bandsync-design-v3` — pro Gerät,
nicht in Firestore.

### Token-Tabelle

| Tailwind | CSS-Variable |
|---|---|
| `bg-base` | `--bg` |
| `bg-surf` `bg-surf-2` `bg-surf-3` | `--surf` `--surf2` `--surf3` |
| `border-line` `border-line-2` | `--border` `--border2` |
| `text-ink` `text-ink-2` `text-ink-3` | `--text` `--t2` `--t3` |
| `*-brand-purple` `-gold` `-green` `-red` `-cyan` `-pink` | `--purple` … |
| `rounded-theme` `-theme-sm` `-theme-lg` `rounded-pill` | `--r` `--r-sm` `--r-lg` `--r-pill` |
| `shadow-glow` | `--glow` |

Tailwinds eigene Paletten (`bg-purple-500`, …) bleiben nutzbar.

---

## 6. Styling-Konvention

**Tailwind-Klasse** für alles Statische, **Inline-`style`** für alles, was aus
Props/State berechnet wird:

```jsx
<div className="flex items-center gap-2.5 px-3 py-2 rounded-theme-sm border"
     style={{background: ok ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)'}}>
```

Zwei Fallen, beide schon einmal zugeschlagen:

1. **`text-xs` / `text-sm` setzen auch eine `line-height`.** Wenn nur die
   Schriftgröße gemeint ist: `text-[12px]`, `text-[14px]`. Sonst werden
   Buttons plötzlich 3px höher.
2. **Einseitige Rahmen färben alle vier Kanten.** `border-t border-line` setzt
   `border-color` rundum; sichtbar ist nur die Kante mit Breite. Harmlos, aber
   beim Debuggen verwirrend.

---

## 7. Eine neue Seite hinzufügen

1. `js/pages/meins.js` anlegen, Funktion `MeinePage({…})` definieren.
2. In `index.html` **vor** `js/app.js` eintragen.
3. In `js/app.js`: Tab-Key im Render-Switch ergänzen.
4. In `js/components/nav.js`: Eintrag im `tabs`-Array ergänzen.

Schritt 2 ist der, den man vergisst — die Seite ist dann schlicht `undefined`.

---

## 8. Warum kein Build-Schritt?

Absicht. Die Seite liegt direkt auf GitHub Pages: `git push` ist das Deploy.
Kein npm, keine CI, keine Artefakte.

Der Preis:

* Babel und Tailwind übersetzen bei **jedem** Seitenaufruf im Browser
  (~1–2s Ladezeit, und zwei „not for production“-Warnungen in der Konsole).
* `index.html` per Doppelklick (`file://`) funktioniert **nicht** — Babel lädt
  die JS-Dateien per Fetch. Lokal braucht es einen Webserver.

Wenn das Projekt größer wird, ist der Umstieg auf Vite der nächste Schritt —
die Dateiaufteilung ist schon darauf vorbereitet: aus den globalen Funktionen
werden `export`s, aus der Script-Liste in `index.html` werden `import`s.

---

## 9. Lokal testen

```bash
python -m http.server 8123
```

Dann <http://localhost:8123> öffnen. `.claude/launch.json` startet genau das.

Es gibt keine automatisierten Tests. Wer an `ui.js` oder `css/styles.css`
arbeitet, sollte die Seiten einmal durchklicken — diese beiden wirken global.

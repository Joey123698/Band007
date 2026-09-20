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
 └─ eingeloggt             → <DashboardPage|SchedulePage|SongsPage|ProfilePage/>
                             + <SideNav/> (ab md) + <BottomNav/> (darunter)
```

### Routing

Der Zustand steht in der Adresszeile, nicht in React. Hash-Routing, weil
GitHub Pages keine Server-Regeln kennt — ein echter Pfad gaebe beim Neuladen
404. Damit tut die Zurueck-Taste das Erwartete (vorher verliess sie auf dem
Telefon die ganze Seite), Links auf einen Song lassen sich verschicken, und
F5 landet wieder an derselben Stelle.

| Hash | Was |
|---|---|
| `#/` | Dashboard |
| `#/probeplan` | Probeplan |
| `#/songs` | Repertoire |
| `#/songs/<id>` | das Blatt |
| `#/songs/<id>/singen` | Singen-Modus, ein Song |
| `#/ideen` | Repertoire mit Filter auf Ideen |
| `#/probe/<id>/singen` | Singen-Modus, Setliste einer Probe |
| `#/profil` | Profil |

`parseRoute()` und `go()` stehen in `helpers.js`. Zwei Dinge bleiben bewusst
**ausserhalb** der URL: welcher Song im Singen-Modus gerade dran ist (sonst
fuellt jedes Weiterblaettern den Verlauf) und der Unterreiter im Profil.

`app.js` merkt sich in einem Ref, ob der Singen-Modus aus der App heraus
betreten wurde. Nur dann ist `history.back()` beim Schliessen richtig; bei
einem geteilten Link fuehrt es sonst von der Seite weg — dann wird stattdessen
eine Ebene hoeher navigiert.

---

## 3. Dateien — und wofür man sie öffnet

### `css/styles.css`
Der globale Reset, die CSS-Variablen (`--bg`, `--surf`, `--accent`, `--r`, …),
die Textrollen-Klassen (`.lab` `.num` `.disp` `.rail-a`), der Spinner und das
Range-Input.

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
| `helpers.js` | `uid`, `toKey`, `dfmt`, `getWeekDays`, `extractYTId`, `initials`, `hexa`, `availAt`, `daysSince`, … | neue Hilfsfunktion |
| `chords.js` | `transposeChord`, `chordShape`, `SHAPES`, `parseSheet`, `serializeUnits`, `normalizeSheet`, `sheetChords`, Blatt- und Tempo-Einstellungen | neuer Griff, neue Blatt-Syntax |
| `firebase.js` | `db`, `auth`, `initFB()` | nie |

### `js/components/` — wiederverwendbar

| Datei | Exportiert | Benutzt von |
|---|---|---|
| `icons.js` | `Ic`, `ICON_PATHS` | überall (muss **vor** `ui.js` geladen werden) |
| `ui.js` | `Card` `Btn` `PillBtn` `Badge` `Inp` `Txta` `Sel` `Fld` `Av` `SectionLabel` `PageHead` `Empty` | überall |
| `chordchart.js` | `ChordDiagram` | Songdetail, Singen-Modus |
| `sheet.js` | `SheetView` — der gerenderte Text mit Akkorden | Songdetail (Blatt + Vorschau), Singen-Modus |
| `comments.js` | `CommentsThread` | Songs + Sessions |
| `attendance.js` | `AttendanceSection` | Dashboard |
| `hero.js` | `DashboardHero`, `MiniCalendar` | Dashboard |
| `nav.js` | `BottomNav` (bis `md`), `SideNav` (ab `md`), `NAV_TABS` | App |

`ui.js` ist die **Design-System-Schicht**. Eine Änderung dort wirkt auf die
ganze App — genau dafür ist sie da. Einzelne Aufrufstellen können per
`style={{…}}` gezielt überschreiben.

### `js/pages/` — je ein Tab

| Datei | Komponenten | Firestore-Collections |
|---|---|---|
| `auth.js` | `AuthScreen` | `users` (beim Registrieren) |
| `dashboard.js` | `DashboardPage` | liest nur Props |
| `schedule.js` | `SchedulePage`, `SessionCard` | `availability`, `locations`, `sessions` |
| `songs.js` | `SongsPage` — Repertoire **und** Ideen | `songs` |
| `songdetail.js` | `SongDetailPage` — das Blatt | `songs`, `comments` |
| `performance.js` | `PerformanceMode` — Vollbild zum Singen | liest nur Props |
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
| `users` | Auth-UID | `displayName`, **`roles[]`**, `role`, `avatar`, `bio`, `skills[]`, `playableSongs[]`, `favoriteSongs[]` |
| `sessions` | auto | `title`, `date`, `time`, `location`, `leadId`, `leadName`, `setlist[]`, `attendance{uid:…}`, `status` |
| `songs` | auto | `title`, `artist`, `genre`, `status`, `votes[]`, `roleAssignments[]`, `structureNotes`, `youtubeLink`, `spotifyLink`, **`key`**, **`capo`**, **`bpm`**, **`sheet`**, **`lyricNotes[]`** |
| `comments` | auto | `docId` (= Song-ID), `userId`, `text`, `createdAt` |
| `sessionComments` | auto | `docId` (= Session-ID), … wie oben |
| `availability` | Auth-UID | `slots{ "<tag>_<stunde>": true }`, **`dates{ "<JJJJ-MM-TT>_<stunde>": true\|false }`**, `updatedAt` |
| `locations` | auto | `name` |
| `settings` | `"main"` | `bandName` |

Alle **fett** gesetzten Felder sind optional und kamen mit dem Blatt, dem
datumsbasierten Probeplan bzw. den Mehrfachrollen dazu. Fehlen sie,
funktioniert der Datensatz unveraendert — deshalb war keine Migration noetig.

### Rollen

Eine Person kann mehrere haben (singen *und* Ukulele). Die Liste steht in
`roles[]`; `role` bleibt als **erste** Rolle erhalten, weil Kommentare
(`userBandRole`) und Zusagen (`attendance.*.role`) eine einzelne speichern und
alte Datensaetze nur dieses Feld kennen. Gelesen wird ausschliesslich ueber
`rolesOf(p)` und `mainRole(p)` aus `helpers.js` — nie direkt `p.role`.
`mainRole` faerbt die Initialen.

### Offline und Installation

Die App ist eine **PWA**: sie lässt sich auf Android/Chrome als eigenständige
App installieren (eigenes Symbol, kein Browserrahmen) und bleibt im Proberaum
ohne Netz benutzbar. Drei Teile greifen ineinander:

| Datei | Rolle |
|---|---|
| `manifest.webmanifest` | Name, Symbole, `display: standalone`, Farben. Alle Pfade **relativ** (`./`), weil GitHub Pages unter `/Band007/` liefert. |
| `sw.js` | Service Worker — legt HTML, CSS, JS und Schriften in einen Cache. |
| `icons/` | 192er, 512er, ein `maskable` mit kleinerer Marke (Android schneidet bis zu 20 % weg) und ein Apple-Touch-Icon. |

`initFB()` schaltet zusätzlich `enablePersistence({synchronizeTabs:true})` ein:
Firestore hält seine Daten selbst offline vor, Schreibvorgänge gehen raus,
sobald wieder Netz da ist. Fehlschläge werden verschluckt
(`failed-precondition` bei mehreren Tabs ohne Tab-Sync, `unimplemented` in
älteren Browsern) — die App läuft dann wie vorher nur online.

**Der Service Worker ist die Stelle, an der ein Deploy hängenbleiben kann.**
Deshalb zwei Regeln, die nicht aufgeweicht werden dürfen:

1. **Seitenaufrufe gehen immer zuerst ans Netz.** Nur wenn das scheitert,
   kommt die gespeicherte Fassung. So sieht die Band einen Push sofort.
2. **Alles andere trägt `?v=APP_V`** und ist damit unveränderlich — dort ist
   Cache-zuerst richtig. Beim Hochzählen von `APP_V` ändert sich auch die
   Adresse von `sw.js`, der Cache heißt neu (`bandsync-<v>`) und der alte wird
   beim Aktivieren gelöscht.

Firestore, Auth und YouTube werden vom Worker **nicht angefasst** — sonst
würden Live-Daten einfrieren. Gecacht wird nur die eigene Herkunft plus eine
Allowlist statischer CDN-Hosts.

Vorgeladen wird nur die Hülle; der Rest landet beim ersten Online-Besuch im
Cache. Praktisch heißt das: einmal zu Hause öffnen, dann trägt es im
Proberaum. Der allererste Aufruf auf einem Gerät braucht Netz.

### Angemeldet bleiben

`auth.setPersistence(LOCAL)` steht ausdrücklich in `initFB()`. Das ist im Web
zwar die Voreinstellung, aber ohne die Zeile liest sich jede spätere
Abmelde-Frage wie ein Zufall. Getragen wird das von IndexedDB/localStorage:
löscht jemand die Browserdaten, ist die Anmeldung weg — das ist nicht zu
umgehen. Eine installierte PWA teilt sich diesen Speicher mit Chrome; eine
bloße Verknüpfung auf dem Startbildschirm tut das je nach System nicht, was
der häufigste Grund für „ich muss mich ständig neu anmelden“ ist.

### Ideen und Songs

`songs` trägt beide Welten: `status === 'suggested'` ist eine **Idee**, alles
andere gehört zum Repertoire. Beide stehen auf derselben Seite (`songs.js`) —
Ideen als eigener Abschnitt bzw. Filter. „→ Üben“ setzt nur `status` auf
`practicing`; es wird nichts kopiert oder verschoben.

### Verfügbarkeit: zwei Ebenen

`slots` ist die **Standardwoche** (Wochentag 0–6 plus Stunde) und gilt für jede
Woche. `dates` übersteuert einzelne Kalendertage — `true` heißt „kann doch“,
`false` heißt „kann diesmal nicht“. Fehlt ein Datumseintrag, zählt die
Standardwoche. `availAt()` in `helpers.js` ist die einzige Stelle, die diese
Regel kennt; alles andere fragt dort nach.

Deckt sich eine Wahl wieder mit der Standardwoche, wird der Eintrag
**gelöscht** statt gespeichert — sonst sammeln sich tote Ausnahmen an.
„Wie letzte Woche“ überträgt die tatsächliche Verfügbarkeit der Vorwoche nach
derselben Regel.

Eine Probe, die aus einer Rasterzelle entsteht, übernimmt **nur Datum und
Uhrzeit**. `attendance` bleibt leer: „ich habe Zeit“ ist nicht dasselbe wie
„ich komme“ — das sagt jede Person selbst auf der Probenkarte.

### Das Blatt

`sheet` ist ein Textfeld im ChordPro-Stil, `parseSheet()` in `chords.js`
macht daraus Abschnitte und Zeilen:

| Schreibweise | Bedeutung |
|---|---|
| `[G]` | Akkord über der folgenden Silbe |
| `: Strophe 1 @ 0:48` | Abschnitt, Zeitangabe optional |
| `> Text` | fester Hinweis im Blatt |
| `~…~` | Atem (Bernstein unterlegt) |
| `=…=` | Halten (grün unterlegt) |

Markierungen dürfen Akkorde umschließen: `~hell und [D]klar;~`.
`lyricNotes[]` hängt an der **Zeilennummer** (`line`) — nur Textzeilen zählen,
Abschnitte und Hinweise nicht.

`serializeUnits()` ist das Gegenstück zu `parseUnits()`. Beide zusammen
erlauben das Markieren per Textauswahl: Zeile parsen → Markierung auf die
betroffenen Einheiten setzen → zurück in Quelltext schreiben. `sheet` bleibt
damit die einzige Wahrheit; es gibt keine zweite Datenstruktur für Markierungen.

**Einfügen von einer Akkordseite.** `normalizeSheet()` erkennt das
Zwei-Zeilen-Format (Akkorde über dem Text) und wandelt es um. Eine Zeile gilt
als Akkordzeile, wenn *jedes* Wort darauf ein Akkord ist **und** darunter eine
echte Textzeile steht — deutsche Zeilen wie „Am Himmel hell und klar“ fallen
damit durch. Zwei Korrekturen fangen den üblichen Versatz kopierter Blätter ab:
ein Akkord auf Leerraum wandert zum nächsten Wort, und bis zu zwei Zeichen
hinter einem Wortanfang rutscht er auf den Wortanfang zurück. Tiefer im Wort
bleibt er stehen — dort ist die Platzierung Absicht (`auf-ge-[G]gangen`).
Der Editor ruft das beim `paste` auf und bietet „Rückgängig“ an; die Vorschau
daneben zeigt sofort, wo die Akkorde gelandet sind.

### Singen-Modus

`PerformanceMode` liegt als Overlay (`z-200`) über allem und hängt in
`js/app.js`, weil er aus zwei Richtungen startet: aus einem Blatt (ein Song)
und aus der Setliste einer Probe (mehrere, mit Vor/Zurück).

Das Scrolltempo ist bewusst ein Regler und **nicht** aus `bpm` gerechnet: wie
schnell das Blatt laufen muss, hängt daran, wie viele Takte auf einer Zeile
stehen. Der Wert wird pro Song in `localStorage` gemerkt
(`bandsync-sheet-v1` → `speeds`). Solange der Modus offen ist, hält die
Wake-Lock-API den Bildschirm an; nach dem Wegschalten wird sie neu angefordert.

---

## 5. Theming

Eine Kette, drei Glieder:

```
ProfilePage (Design)
   └─ onDesignUpdate({theme|font|radius})
        └─ applyDesign()  schreibt --bg, --surf, --accent, --r, --f-body … auf :root
             ├─ css/styles.css      nutzt die Variablen
             ├─ Inline-Styles       nutzen var(--…)
             └─ Tailwind-Klassen    nutzen sie über tailwind-config.js
```

Deshalb folgt **auch jede Tailwind-Klasse** dem gewählten Theme:
`bg-surf` ist `var(--surf)`, nicht eine feste Farbe.

Die Auswahl liegt in `localStorage` unter `bandsync-design-v4` — pro Gerät,
nicht in Firestore.

> Die fünf Varianten in `THEMES` teilen **dieselbe** Grauleiter und dieselben
> Statusfarben (`NEUTRAL` in `theme.js`) und unterscheiden sich nur im Akzent.
> Das ist Absicht: sonst zerfällt das Design in fünf fremde Paletten.
> Eine neue Variante ist eine Zeile in `ACCENTS` — Hover und Tint rechnet
> `mix()` daraus aus.

### Token-Tabelle

| Tailwind | CSS-Variable |
|---|---|
| `bg-base` | `--bg` |
| `bg-surf` `bg-surf-2` `bg-surf-3` | `--surf` `--surf2` `--surf3` |
| `border-line` `border-line-2` | `--border` `--border2` |
| `text-ink` `text-ink-2` `text-ink-3` | `--text` `--t2` `--t3` |
| `*-accent` `-accent-h` `-accent-tint` | `--accent` `--accent-h` `--accent-tint` |
| `*-ok` `-info` `-warn` `-idle` `-danger` | `--ok` `--info` `--warn` `--idle` `--danger` |
| `rounded-theme` `-theme-sm` `-theme-lg` `rounded-pill` | `--r` `--r-sm` `--r-lg` `--r-pill` |
| `font-app` `font-display` `font-mono` | `--f-body` `--f-display` `--f-mono` |
| `max-w-shell` | 1120px (Inhaltsbreite auf grossen Schirmen) |

`accent` ist die **einzige** Signalfarbe. Die Status-Token sind bewusst
gedämpft — wenn etwas wichtig aussehen soll, ist es `accent`, nicht eine
sechste Farbe. Tailwinds eigene Paletten (`bg-purple-500`, …) bleiben
technisch nutzbar, gehören aber nicht ins Design.

### Breakpoints

| Ab | Was sich ändert |
|---|---|
| — | Leiste unten (`BottomNav`), eine Spalte, Raster scrollen in sich |
| `md` (768px) | Schiene links (`SideNav`, 72px, nur Icons), Leiste unten weg, Gutter 32px. Die Schiene braucht `self-start` — als gestrecktes Flex-Kind klebt `sticky` nicht. |
| `lg` (1024px) | Schiene mit Text (212px), Dashboard und Song-Detail zweispaltig |
| `xl` (1280px) | Probenkarten zweispaltig |

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
4. In `js/components/nav.js`: Eintrag im `NAV_TABS`-Array ergänzen
   (ein Icon-Name aus `js/components/icons.js` dazu).

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

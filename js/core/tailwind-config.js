// ════════════════════════════════════════════════════
//  TAILWIND CONFIG
//  Muss direkt nach dem Tailwind-CDN-Script geladen werden
//  (normales <script>, NICHT type="text/babel").
//
//  Die Farben zeigen auf die CSS-Variablen aus css/styles.css,
//  die applyDesign() zur Laufzeit umschreibt — dadurch folgen
//  Tailwind-Klassen automatisch dem gewaehlten Theme.
// ════════════════════════════════════════════════════
tailwind.config = {
  // Preflight aus: der bestehende Reset in css/styles.css bleibt
  // massgeblich, sonst wuerden Buttons/Inputs ihr Styling verlieren.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        // Flaechen
        base:  'var(--bg)',
        surf:  { DEFAULT:'var(--surf)',    2:'var(--surf2)',   3:'var(--surf3)' },
        // Linien
        line:  { DEFAULT:'var(--border)',  2:'var(--border2)' },
        // Text
        ink:   { DEFAULT:'var(--text)',    2:'var(--t2)',      3:'var(--t3)' },
        // EIN Akzent. Tonstudio kennt keine zweite Signalfarbe —
        // alles andere unten ist Status, kein Akzent.
        accent:{ DEFAULT:'var(--accent)',  h:'var(--accent-h)', tint:'var(--accent-tint)' },
        // Status. Gedaempft gehalten, damit eine lange Liste nicht
        // wie eine Ampel aussieht.
        ok:    'var(--ok)',
        info:  'var(--info)',
        warn:  'var(--warn)',
        idle:  'var(--idle)',
        danger:'var(--danger)',
      },
      borderRadius: {
        theme:      'var(--r)',
        'theme-sm': 'var(--r-sm)',
        'theme-lg': 'var(--r-lg)',
        pill:       'var(--r-pill)',
      },
      fontFamily: {
        // `app` folgt der Schriftwahl aus dem Profil,
        // `display` und `mono` sind fest — sie tragen das Design.
        app:     'var(--f-body)',
        display: 'var(--f-display)',
        mono:    'var(--f-mono)',
      },
      maxWidth: {
        // Lesebreite der Inhaltsspalte auf grossen Schirmen
        shell: '1120px',
      },
    },
  },
};

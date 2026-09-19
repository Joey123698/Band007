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
        // Akzente (Tailwinds eigene Paletten bleiben erhalten:
        // bg-purple-500 funktioniert weiterhin)
        brand: {
          purple:'var(--purple)', gold:'var(--gold)',  green:'var(--green)',
          red:   'var(--red)',    cyan:'var(--cyan)',  pink: 'var(--pink)',
        },
      },
      borderRadius: {
        theme:      'var(--r)',
        'theme-sm': 'var(--r-sm)',
        'theme-lg': 'var(--r-lg)',
        pill:       'var(--r-pill)',
      },
      boxShadow: {
        glow: '0 0 24px var(--glow)',
      },
      fontFamily: {
        // folgt der Font-Auswahl aus dem Profil
        app:  'inherit',
        mono: ['"JetBrains Mono"', '"Courier New"', 'monospace'],
      },
    },
  },
};

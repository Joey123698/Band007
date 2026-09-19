// ════════════════════════════════════════════════════
//  THEME SYSTEM — Tonstudio
//
//  Alle Themes teilen dieselbe Grauleiter und dieselben
//  Statusfarben; unterschiedlich ist nur der EINE Akzent.
//  Das ist Absicht: so bleibt jede Variante dasselbe Design
//  und wird nicht zu fuenf fremden Paletten.
// ════════════════════════════════════════════════════

// Warmes Anthrazit — Grundlage aller Varianten.
const NEUTRAL = {
  bg:'#121114', surf:'#1B1A1E', surf2:'#221F27', surf3:'#2C2A31',
  border:'#221F27', border2:'#322F38',
  text:'#EDEAE4', t2:'#8E8A93', t3:'#5D5A64',
  ok:'#6FA96B', info:'#6E90C4', warn:'#C98A3E', idle:'#3E3B45', danger:'#C2606A',
};

// #RRGGBB -> [r,g,b]
const hex2rgb = h => { const n=parseInt(h.slice(1),16); return [n>>16&255,n>>8&255,n&255]; };
const rgb2hex = ([r,g,b]) => '#'+[r,g,b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('').toUpperCase();
// a ueber b mit Anteil t mischen
const mix = (a,b,t) => rgb2hex(hex2rgb(a).map((v,i)=>v*t+hex2rgb(b)[i]*(1-t)));

// Jede Variante liefert nur ihren Akzent; Hover und Tint werden daraus
// berechnet, damit sie garantiert zusammenpassen.
const ACCENTS = {
  'Tonstudio': '#E5A03C',  // Bernstein — der Entwurf
  'Kupfer':    '#C77B52',
  'Salbei':    '#7E9E6C',
  'Stahl':     '#6E90C4',
  'Asche':     '#B0A89C',
};
const THEMES = Object.fromEntries(Object.entries(ACCENTS).map(([name,accent])=>[name,{
  ...NEUTRAL,
  accent,
  'accent-h':    mix(accent,'#FFFFFF',.80),
  'accent-tint': mix(accent,NEUTRAL.bg,.10),
}]));

const FONTS = {
  'Plex Sans': '"IBM Plex Sans",system-ui,sans-serif',
  'Archivo':   '"Archivo",system-ui,sans-serif',
  'Plex Mono': '"IBM Plex Mono",ui-monospace,monospace',
  'System':    '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
};

// v4: der Schluessel wurde mit dem Tonstudio-Redesign hochgezaehlt.
// Aeltere Staende zeigten auf Themes/Schriften, die es nicht mehr gibt —
// so bekommt jedes Geraet einmalig die neuen Voreinstellungen.
const DESIGN_LS = 'bandsync-design-v4';
const DESIGN_DEFAULT = {theme:'Tonstudio', font:'Plex Sans', radius:0};

const loadDesign = () => {
  try { return {...DESIGN_DEFAULT, ...(JSON.parse(localStorage.getItem(DESIGN_LS))||{})}; }
  catch { return {...DESIGN_DEFAULT}; }
};

const applyDesign = ({theme,font,radius}) => {
  const t = THEMES[theme]||THEMES[DESIGN_DEFAULT.theme];
  const r = radius ?? DESIGN_DEFAULT.radius;
  const root = document.documentElement;
  Object.entries(t).forEach(([k,v])=>root.style.setProperty(`--${k}`,v));
  root.style.setProperty('--r',`${r}px`);
  root.style.setProperty('--r-sm',`${Math.max(0,Math.round(r*.6))}px`);
  root.style.setProperty('--r-lg',`${Math.round(r*1.5)}px`);
  const f = FONTS[font]||FONTS[DESIGN_DEFAULT.font];
  root.style.setProperty('--f-body',f);
  document.body.style.fontFamily = f;
};

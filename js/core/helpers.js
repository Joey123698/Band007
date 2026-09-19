// ════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════
const uid     = () => Math.random().toString(36).slice(2,9);
const toKey   = d => { const dt=new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; };
const nowKey  = () => toKey(new Date());
const slotKey = (d,h) => `${d}_${h}`;
const hlbl    = h => `${String(h).padStart(2,'0')}:00`;
const dfmt    = d => new Date(d).toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit'});
const hasConfig = () => FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.startsWith('PASTE_');
const extractYTId = url => { const m=(url||'').match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/); return m?m[1]:null; };

// Verfuegbarkeit kennt zwei Schluesselarten:
//   slots["2_19"]            Standardwoche — Wochentag 0–6 plus Stunde
//   dates["2026-09-16_19"]   diese eine Woche, true = kann, false = kann nicht
// Fehlt ein Datums-Eintrag, gilt die Standardwoche. Damit bleiben
// bestehende Datensaetze (nur `slots`) unveraendert gueltig.
const dateSlotKey = (dateKey,h) => `${dateKey}_${h}`;
const availAt = (a,dateKey,weekdayIx,h) => {
  const dk = dateSlotKey(dateKey,h);
  if(a?.dates && dk in a.dates) return !!a.dates[dk];
  return !!(a?.slots && a.slots[slotKey(weekdayIx,h)]);
};
const dfmtLong = d => new Date(d).toLocaleDateString('de-DE',{weekday:'short',day:'numeric',month:'long'});
// Nimmt einen Firestore-Timestamp oder etwas, das `new Date` versteht.
const daysSince = ts => {
  if(!ts) return null;
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return isNaN(d) ? null : Math.floor((Date.now()-d.getTime())/86400000);
};

// "Anh" -> AN, "Thao Hien" -> TH. Ersetzt die Emoji-Avatare des alten
// Designs; das Feld `users.avatar` bleibt davon unberuehrt.
const initials = name => {
  const p=(name||'').trim().split(/\s+/).filter(Boolean);
  if(!p.length) return '··';
  return (p.length===1 ? p[0].slice(0,2) : p[0][0]+p[1][0]).toUpperCase();
};
// #RRGGBB + Alpha -> rgba(). Fuer getoente Flaechen aus Rollen-/Statusfarben.
const hexa = (hex,a) => {
  const n=parseInt(String(hex||'#888888').slice(1),16);
  return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;
};

const getMondayOf = (offset=0) => {
  const now=new Date(), day=now.getDay()||7, m=new Date(now);
  m.setDate(now.getDate()-day+1+offset*7); m.setHours(0,0,0,0); return m;
};
const getWeekDays = (offset=0) => {
  const m=getMondayOf(offset);
  return Array.from({length:7},(_,i)=>{ const d=new Date(m); d.setDate(m.getDate()+i); return d; });
};

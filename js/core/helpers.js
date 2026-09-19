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

const getMondayOf = (offset=0) => {
  const now=new Date(), day=now.getDay()||7, m=new Date(now);
  m.setDate(now.getDate()-day+1+offset*7); m.setHours(0,0,0,0); return m;
};
const getWeekDays = (offset=0) => {
  const m=getMondayOf(offset);
  return Array.from({length:7},(_,i)=>{ const d=new Date(m); d.setDate(m.getDate()+i); return d; });
};

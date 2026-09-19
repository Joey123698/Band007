// ════════════════════════════════════════════════════
//  AKKORDE — Transponieren, Griffbilder, Blatt-Parser
//  Reine Logik, kein React. Muss vor den Komponenten geladen werden.
// ════════════════════════════════════════════════════

const SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
// Schreibweisen, die auf denselben Ton zeigen
const ENHARM = {Db:'C#',Eb:'D#',Gb:'F#',Ab:'G#',Bb:'A#','E#':'F','B#':'C',Cb:'B',Fb:'E'};

const CHORD_RE = /^([A-G][#b]?)(.*)$/;
const noteIx = n => { const i=SHARP.indexOf(n); return i<0?FLAT.indexOf(n):i; };

// "G", "Am7", "D/F#" um `semis` Halbtoene verschieben.
// `flats` waehlt die Schreibweise (Eb statt D#) — bei Tonarten mit b-Vorzeichen.
const transposeChord = (ch,semis,flats=false) => {
  if(!ch) return ch;
  if(!semis) return ch;
  return String(ch).split('/').map(part=>{
    const m = part.match(CHORD_RE);
    if(!m) return part;
    const i = noteIx(m[1]);
    if(i<0) return part;
    return (flats?FLAT:SHARP)[((i+semis)%12+12)%12] + m[2];
  }).join('/');
};

// ── Griffbilder ─────────────────────────────────────
// Bund pro Saite, tiefste Saite zuerst. `x` = nicht anschlagen, `0` = leer.
const SHAPES = {
  guitar: { label:'Gitarre', strings:6, map:{
    'C':'x32010','Cm':'x35543','C7':'x32310','Cmaj7':'x32000','Cm7':'x35343',
    'C#':'x43121','C#m':'x46654','C#7':'x43424','C#m7':'x46454',
    'D':'xx0232','Dm':'xx0231','D7':'xx0212','Dmaj7':'xx0222','Dm7':'xx0211',
    'D#':'xx1343','D#m':'xx1342','D#7':'xx1323',
    'E':'022100','Em':'022000','E7':'020100','Emaj7':'021100','Em7':'020000',
    'F':'133211','Fm':'133111','F7':'131211','Fmaj7':'xx3210','Fm7':'131111',
    'F#':'244322','F#m':'244222','F#7':'242322','F#m7':'242222',
    'G':'320003','Gm':'355333','G7':'320001','Gmaj7':'320002','Gm7':'353333',
    'G#':'466544','G#m':'466444','G#7':'464544',
    'A':'x02220','Am':'x02210','A7':'x02020','Amaj7':'x02120','Am7':'x02010',
    'A#':'x13331','A#m':'x13321','A#7':'x13131','A#m7':'x13121',
    'B':'x24442','Bm':'x24432','B7':'x21202','Bmaj7':'x24342','Bm7':'x20202',
  }},
  ukulele: { label:'Ukulele', strings:4, map:{
    'C':'0003','Cm':'0333','C7':'0001','Cmaj7':'0002','Cm7':'3333',
    'C#':'1114','C#m':'1104','C#7':'1112',
    'D':'2220','Dm':'2210','D7':'2223','Dmaj7':'2224','Dm7':'2213',
    'D#':'3331','D#m':'3321','D#7':'3334',
    'E':'4442','Em':'0432','E7':'1202','Emaj7':'1302','Em7':'0202',
    'F':'2010','Fm':'1013','F7':'2313','Fmaj7':'2413','Fm7':'1313',
    'F#':'3121','F#m':'2120','F#7':'3424','F#m7':'2424',
    'G':'0232','Gm':'0231','G7':'0212','Gmaj7':'0222','Gm7':'0211',
    'G#':'5343','G#m':'1342','G#7':'1323',
    'A':'2100','Am':'2000','A7':'0100','Amaj7':'1100','Am7':'0000',
    'A#':'3211','A#m':'3111','A#7':'1211','A#m7':'1111',
    'B':'4322','Bm':'4222','B7':'2322','Bm7':'2222',
  }},
};

// Zusatz-Schreibweisen auf die Tabelle abbilden. Was hier nicht ankommt
// (dim, sus, add9, …), bekommt schlicht kein Griffbild — der Name bleibt.
const normSuffix = s => {
  const t = (s||'').replace(/^-/,'m').replace(/^min/,'m').replace(/^maj7|^M7|^Δ7?/,'maj7');
  if(t==='') return '';
  if(t==='m') return 'm';
  if(t==='7') return '7';
  if(t==='maj7') return 'maj7';
  if(t==='m7'||t==='min7') return 'm7';
  return null;
};

// "Am7/G" -> [-1,0,2,0,1,0] o.ae.; null, wenn kein Griff hinterlegt ist.
const chordShape = (name,instrument='guitar') => {
  const inst = SHAPES[instrument]||SHAPES.guitar;
  const m = String(name||'').split('/')[0].match(CHORD_RE);
  if(!m) return null;
  const root = ENHARM[m[1]]||m[1];
  const suf = normSuffix(m[2]);
  if(suf===null) return null;
  const s = inst.map[root+suf];
  return s ? s.split('').map(c=>c==='x'?-1:+c) : null;
};

// Tonarten, die man ueblicherweise mit b schreibt (Db, Eb, Gb, Ab, Bb).
// Danach richtet sich, ob transponierte Akkorde # oder b bekommen.
const FLAT_KEYS = [1,3,6,8,10];
const preferFlats = (key,semis=0) => {
  const i = noteIx((String(key||'C').match(CHORD_RE)||[,'C'])[1]);
  if(i<0) return false;
  return FLAT_KEYS.includes(((i+semis)%12+12)%12);
};

// ── Blatt-Parser ────────────────────────────────────
// Zeilenarten:
//   ": Strophe 1 @ 0:48"   Abschnitt (Zeitangabe optional)
//   "> Hinweis"            fester Hinweis im Blatt
//   Leerzeile              Abstand
//   sonst                  Text mit [Akkorden], ~Atem~, =Halten=
//
// Markierungen duerfen Akkorde umschliessen: "~hell und [D]klar;~".
const parseUnits = s => {
  const units=[]; let chord=null, buf='', mark=null;
  const flush=()=>{ if(buf||chord){ units.push({chord,text:buf,mark}); chord=null; buf=''; } };
  for(let i=0;i<s.length;i++){
    const c=s[i];
    if(c==='['){ const j=s.indexOf(']',i); if(j>i){ flush(); chord=s.slice(i+1,j); i=j; continue; } }
    if(c==='~'||c==='='){ flush(); const m=c==='~'?'atem':'halten'; mark = mark===m?null:m; continue; }
    buf+=c;
  }
  flush();
  return units;
};

// `raw` ist die Zeilennummer im Quelltext — daran haengt das Markieren
// per Auswahl. `index` zaehlt nur Textzeilen und traegt die Notizen.
const parseSheet = text => {
  const rows=[]; let li=0;
  String(text||'').split('\n').forEach((src,raw)=>{
    const line = src.replace(/\s+$/,'');
    if(!line.trim()){ rows.push({type:'gap',raw}); return; }
    let m;
    if((m=line.match(/^:\s*(.*?)(?:\s*@\s*(\S+))?$/))){ rows.push({type:'section',raw,label:m[1],time:m[2]||null}); return; }
    if((m=line.match(/^>\s*(.*)$/)))            { rows.push({type:'hint',raw,text:m[1]}); return; }
    rows.push({type:'line',raw,index:li++,units:parseUnits(line)});
  });
  return rows;
};

// Gegenstueck zu parseUnits — aus Einheiten wieder Quelltext machen.
// Wird gebraucht, wenn eine Markierung per Textauswahl gesetzt wird.
const MARK_CH = {atem:'~', halten:'='};
const serializeUnits = units => {
  let out='', cur=null;
  units.forEach(u=>{
    if(u.mark!==cur){
      if(cur) out += MARK_CH[cur];
      if(u.mark) out += MARK_CH[u.mark];
      cur = u.mark||null;
    }
    if(u.chord) out += `[${u.chord}]`;
    out += u.text;
  });
  if(cur) out += MARK_CH[cur];
  return out;
};

// ── Zwei-Zeilen-Format einlesen ─────────────────────
// So sieht es auf Akkordseiten aus — und so kopiert man es:
//
//     G          D        G
//     Der Mond ist aufgegangen
//
// Daraus wird `[G]Der Mond ist [D]aufge[G]gangen`.
//
// Eine Zeile gilt als Akkordzeile, wenn *jedes* Wort darauf ein Akkord ist.
// Deutsche Textzeilen fallen damit durch („Himmel“, „steiget“ …); heikel
// waere nur eine Zeile, die ausschliesslich aus Wörtern wie „Am“ besteht —
// deshalb muss zusaetzlich eine echte Textzeile darunter stehen.
const CHORD_TOKEN = /^[A-G][#b]?(?:maj|min|dim|aug|sus|add|m|M)?\d*(?:sus\d|add\d+)?(?:\/[A-G][#b]?)?$/;
const isChordLine = line => {
  if(!line || line.includes('[')) return false;
  const toks = line.trim().split(/\s+/).filter(Boolean);
  if(!toks.length || toks.length>14) return false;
  return toks.every(t=>CHORD_TOKEN.test(t));
};

// Akkorde sitzen an Spaltenpositionen; die werden zu Einfuegestellen im Text.
//
// Kopierte Blaetter sind oft ein, zwei Zeichen verrutscht (HTML frisst
// Leerzeichen). Zwei Korrekturen:
//   1. Faellt der Akkord auf Leerraum, gehoert er zum naechsten Wort.
//   2. Faellt er bis zu SNAP Zeichen *hinter* einen Wortanfang, rutscht
//      er auf den Wortanfang zurueck.
// Tiefer im Wort bleibt er stehen — dort ist die Platzierung meist
// Absicht (auf-ge-[G]gangen).
const SNAP = 2;
const snapToWord = (line,col) => {
  if(col<=0) return 0;
  let c = Math.min(col,line.length);
  while(c<line.length && /\s/.test(line[c])) c++;     // 1.
  if(c>=line.length) return line.length;
  if(c>0 && !/\s/.test(line[c-1])){                   // 2.
    let s=c; while(s>0 && !/\s/.test(line[s-1])) s--;
    if((c-s)<=SNAP) return s;
  }
  return c;
};

const mergeChordLine = (chordLine,lyricLine) => {
  const marks=[]; const re=/\S+/g; let m;
  while((m=re.exec(chordLine))) marks.push({col:m.index,ch:m[0]});
  let out='', prev=0;
  marks.forEach(({col,ch})=>{
    const cut=Math.max(prev,snapToWord(lyricLine,col));
    out += lyricLine.slice(prev,cut)+`[${ch}]`;
    prev = cut;
  });
  return out+lyricLine.slice(prev);
};

// Gibt {text, converted} zurueck — `converted` = Anzahl umgewandelter Paare,
// 0 heisst „war schon im richtigen Format, nichts angefasst“.
const normalizeSheet = text => {
  const lines=String(text||'').replace(/\r\n?/g,'\n').split('\n');
  const out=[]; let n=0;
  for(let i=0;i<lines.length;i++){
    const cur=lines[i], next=lines[i+1];
    const lyricBelow = next!=null && next.trim() && !isChordLine(next) && !/^[:>]/.test(next.trim());
    if(isChordLine(cur) && lyricBelow){
      out.push(mergeChordLine(cur,next)); i++; n++;
    } else if(isChordLine(cur)){
      // Zwischenspiel: Akkorde ohne Text darunter (Zeilenende, Leerzeile,
      // naechster Abschnitt oder noch eine Akkordzeile)
      out.push(cur.trim().split(/\s+/).map(c=>`[${c}]`).join(' ')); n++;
    } else {
      out.push(cur.replace(/\s+$/,''));
    }
  }
  return {text:out.join('\n'), converted:n};
};

// Akkorde in Reihenfolge des ersten Auftretens — fuer die Griffleiste.
const sheetChords = rows => {
  const seen=[];
  rows.forEach(r=>r.type==='line'&&r.units.forEach(u=>{
    if(u.chord && !seen.includes(u.chord)) seen.push(u.chord);
  }));
  return seen;
};

// ── Ansichts-Einstellungen (pro Geraet, nicht in Firestore) ──
const SHEET_LS = 'bandsync-sheet-v1';
const SHEET_SIZES = [14.5, 16.5, 19];      // Blatt
const PERF_SIZES  = [19, 24, 30];          // Singen-Modus — Leseabstand ist groesser
const SHEET_DEFAULT = {instrument:'guitar', size:1, chords:true, perfSize:1, speeds:{}};
const loadSheetPrefs = () => {
  try { return {...SHEET_DEFAULT, ...(JSON.parse(localStorage.getItem(SHEET_LS))||{})}; }
  catch { return {...SHEET_DEFAULT}; }
};
const saveSheetPrefs = p => { try{ localStorage.setItem(SHEET_LS,JSON.stringify(p)); }catch{} };
// Scrolltempo merkt sich die App pro Song — jedes Lied laeuft anders.
const PERF_SPEED_DEFAULT = 20;             // Pixel pro Sekunde
const loadPerfSpeed = id => loadSheetPrefs().speeds?.[id] ?? PERF_SPEED_DEFAULT;
const savePerfSpeed = (id,v) => { const p=loadSheetPrefs(); saveSheetPrefs({...p,speeds:{...p.speeds,[id]:v}}); };

const SHEET_EXAMPLE = `: Strophe 1 @ 0:00
[G]Der Mond ist [D]aufge[G]gangen,
[C]Am Himmel ~[G]hell und [D]klar;~
> Hier Luft holen — nicht schleppen.
[C]Der weiße =[D]Nebel wunder[G]bar.=`;

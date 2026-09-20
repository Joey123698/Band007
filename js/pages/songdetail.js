// ════════════════════════════════════════════════════
//  SONGDETAIL — das Blatt
//  Ablesestreifen, Bedienleiste, Text mit Akkorden,
//  Griffleiste. Alles Organisatorische (Status, Rollen,
//  Kommentare, Bearbeiten) liegt hinter dem ⋮-Menü.
// ════════════════════════════════════════════════════
function SongDetailPage({song,user,profile,members,onBack,onPerform}){
  const[pref,setPref]     = useState(loadSheetPrefs);
  const[semis,setSemis]   = useState(0);
  const[panel,setPanel]   = useState(false);
  const[edit,setEdit]     = useState(false);
  const[ef,setEF]         = useState({});
  const[noteLine,setNoteLine] = useState(null);
  const[noteText,setNoteText] = useState('');
  const[pasted,setPasted]     = useState(null);   // {before, n} fuer „Rückgängig“
  const[playing,setPlaying]   = useState(false);
  const[addRole,setAddRole]   = useState('');

  const setP = patch => setPref(p=>{ const n={...p,...patch}; saveSheetPrefs(n); return n; });

  const rows    = useMemo(()=>parseSheet(song.sheet),[song.sheet]);
  const flats   = preferFlats(song.key||'C',semis);
  const tp      = c => transposeChord(c,semis,flats);
  const chords  = useMemo(()=>sheetChords(rows).map(tp),[rows,semis,flats]);
  const hasSheet= rows.some(r=>r.type==='line');
  const sm      = STATUS_MAP[song.status]||STATUS_MAP.practicing;
  const mr      = (song.roleAssignments||[]).find(r=>r.userId===user.uid);
  const ytId    = extractYTId(song.youtubeLink);
  const notes   = song.lyricNotes||[];

  const upd = async patch => db.collection('songs').doc(song.id).update(patch);
  const startEdit = ()=>{ setEF({
    title:song.title||'',artist:song.artist||'',genre:song.genre||'',status:song.status||'practicing',
    key:song.key||'',capo:song.capo??'',bpm:song.bpm??'',sheet:song.sheet||'',
    youtubeLink:song.youtubeLink||'',spotifyLink:song.spotifyLink||'',
  }); setEdit(true); setPanel(true); };
  const saveEdit = async ()=>{
    await upd({...ef, capo:ef.capo===''?null:+ef.capo, bpm:ef.bpm===''?null:+ef.bpm});
    setEdit(false);
  };
  const delSong = async ()=>{ if(window.confirm('Song löschen?')){ await db.collection('songs').doc(song.id).delete(); onBack(); } };
  const addNote = async ()=>{
    if(!noteText.trim()) return;
    await upd({lyricNotes:[...notes,{id:uid(),line:noteLine,userId:user.uid,
      userName:profile.displayName,userBandRole:mainRole(profile),
      text:noteText.trim(),createdAt:new Date().toISOString()}]});
    setNoteText(''); setNoteLine(null);
  };
  const delNote = async id => upd({lyricNotes:notes.filter(n=>n.id!==id)});

  // Markierung aus einer Textauswahl. Die Einheiten der betroffenen
  // Quellzeile bekommen die Markierung, dann wird die Zeile zurueck
  // in Quelltext geschrieben — so bleibt `sheet` die einzige Wahrheit.
  const applyMark = async (rawLine,from,to,mark) => {
    const lines=(song.sheet||'').split('\n');
    if(lines[rawLine]==null) return;
    const units=parseUnits(lines[rawLine]);
    for(let k=from;k<=to;k++) if(units[k]) units[k].mark=mark;
    lines[rawLine]=serializeUnits(units);
    await upd({sheet:lines.join('\n')});
  };
  const addMyRole = async ()=>{
    if(!addRole||mr) return;
    await upd({roleAssignments:[...(song.roleAssignments||[]),
      {userId:user.uid,userName:profile.displayName,userBandRole:mainRole(profile),songRole:addRole}]});
    setAddRole('');
  };
  const removeMyRole = async ()=>upd({roleAssignments:(song.roleAssignments||[]).filter(x=>x.userId!==user.uid)});

  // Einfuegen von einer Akkordseite: Zwei-Zeilen-Format erkennen und
  // an der Einfuegestelle gleich umwandeln. Passt nichts, laeuft der
  // normale Einfuegevorgang weiter.
  const onPasteSheet = e => {
    const raw = e.clipboardData?.getData('text');
    if(!raw) return;
    const {text,converted} = normalizeSheet(raw);
    if(!converted) return;
    e.preventDefault();
    const el=e.target, before=ef.sheet||'';
    const next = before.slice(0,el.selectionStart)+text+before.slice(el.selectionEnd);
    setEF(p=>({...p,sheet:next}));
    setPasted({before,n:converted});
  };
  const convertSheet = () => {
    const before=ef.sheet||'';
    const {text,converted}=normalizeSheet(before);
    if(!converted) return;
    setEF(p=>({...p,sheet:text}));
    setPasted({before,n:converted});
  };

  const previewRows = useMemo(()=>parseSheet(ef.sheet),[ef.sheet]);
  const noteDate = iso => { try{ return new Date(iso).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'}); }catch{ return ''; } };
  const fontPx = SHEET_SIZES[pref.size]??SHEET_SIZES[1];

  return <div>

    {/* ── Kopf ─────────────────────────────────── */}
    <div className="sticky top-0 z-20 bg-base border-b border-line-2">
      <div className="flex items-center gap-2 px-2 md:px-5 py-2.5">
        <button onClick={onBack} title="Zurück"
          className="w-11 h-11 flex items-center justify-center cursor-pointer text-ink shrink-0">
          <Ic name="left" size={21}/>
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-[19px] tracking-[-.02em] leading-tight truncate">{song.title}</div>
          <div className="text-[11.5px] text-ink-2 truncate">{song.artist}{song.genre&&` · ${song.genre}`}</div>
        </div>
        {/* Beschriftung bleibt auch auf dem Telefon stehen — daneben sitzt
            der YouTube-Knopf mit demselben Dreieck. */}
        {hasSheet&&onPerform&&<Btn onClick={onPerform} size="sm" variant="accent" title="Vollbild mit Autoscroll"
          style={{height:38,flexShrink:0}}><Ic name="play" size={13} fill/> Singen</Btn>}
        {ytId&&<button onClick={()=>setPlaying(v=>!v)} title="YouTube"
          className="w-11 h-11 flex items-center justify-center cursor-pointer shrink-0"
          style={{color:playing?'var(--accent)':'var(--t2)'}}><Ic name="play" size={15} fill/></button>}
        <button onClick={()=>setPanel(v=>!v)} title="Mehr"
          className="w-11 h-11 flex items-center justify-center cursor-pointer shrink-0"
          style={{color:panel?'var(--accent)':'var(--t2)'}}>
          <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor">
            <circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="19" r="1.7"/>
          </svg>
        </button>
      </div>

      {/* Ablesestreifen — vier Werte wie auf einem Geraet */}
      <div className="grid grid-cols-4 border-t border-line-2">
        {[
          {l:'Tonart', v:song.key?tp(song.key):'—', c:semis?'var(--accent)':'var(--text)'},
          {l:'Capo',   v:song.capo??'—'},
          {l:'BPM',    v:song.bpm??'—'},
          {l:'Status', v:sm.label, c:sm.color, small:true},
        ].map((f,i)=>
          <div key={f.l} className={`px-3 md:px-5 py-2.5 ${i<3?'border-r border-line-2':''}`}>
            <div className="lab text-ink-3">{f.l}</div>
            <div className={f.small?'text-[12px] font-bold mt-1 truncate':'num text-[16px] mt-0.5'}
              style={{color:f.c||'var(--text)'}}>{f.v}</div>
          </div>)}
      </div>
    </div>

    {ytId&&playing&&<div className="px-4 md:px-8 pt-4 fade">
      <div className="relative bg-black max-w-[640px]">
        <button onClick={()=>setPlaying(false)} title="Schließen"
          className="absolute top-1 right-1 z-10 w-7 h-7 flex items-center justify-center cursor-pointer"
          style={{background:'rgba(0,0,0,.65)'}}><Ic name="x" size={14} sw={2} color="#fff"/></button>
        <iframe width="100%" height="230" src={`https://www.youtube.com/embed/${ytId}?autoplay=1`} title={song.title}
          frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="block"/>
      </div>
    </div>}

    {/* ── Bedienleiste ─────────────────────────── */}
    <div className="flex items-center gap-1.5 px-4 md:px-8 py-3 border-b border-line-2 overflow-x-auto">
      <div className="flex h-10 border border-line-2 shrink-0">
        {Object.entries(SHAPES).map(([k,v])=>
          <button key={k} onClick={()=>setP({instrument:k})}
            className="px-3 text-[12px] font-semibold cursor-pointer transition-colors duration-100"
            style={pref.instrument===k
              ?{background:'var(--accent)',color:'#121114',fontWeight:700}
              :{color:'var(--t2)'}}>{v.label}</button>)}
      </div>

      <div className="flex items-center h-10 border border-line-2 shrink-0">
        <button onClick={()=>setSemis(s=>s-1)} title="Einen Halbton tiefer"
          className="w-8 h-10 flex items-center justify-center cursor-pointer text-ink-2 text-[17px]">−</button>
        <span className="num text-[13px] min-w-[34px] text-center" style={{color:semis?'var(--accent)':'var(--t2)'}}>
          {song.key?tp(song.key):(semis>0?`+${semis}`:semis||'0')}
        </span>
        <button onClick={()=>setSemis(s=>s+1)} title="Einen Halbton höher"
          className="w-8 h-10 flex items-center justify-center cursor-pointer text-ink-2 text-[17px]">+</button>
      </div>
      {semis!==0&&<button onClick={()=>setSemis(0)} className="lab text-accent px-1.5 cursor-pointer shrink-0">Zurück</button>}

      <div className="grow"/>

      <button onClick={()=>setP({size:(pref.size+1)%SHEET_SIZES.length})} title="Schriftgröße"
        className="w-10 h-10 border border-line-2 flex items-center justify-center cursor-pointer shrink-0 text-ink-2">
        <span className="font-display font-bold" style={{fontSize:11+pref.size*3}}>A</span>
      </button>
      <button onClick={()=>setP({chords:!pref.chords})} title={pref.chords?'Akkorde ausblenden':'Akkorde einblenden'}
        className="w-10 h-10 border flex items-center justify-center cursor-pointer shrink-0"
        style={{borderColor:pref.chords?'var(--accent)':'var(--border2)',
                background:pref.chords?'var(--accent-tint)':'transparent'}}>
        <Ic name="list" size={17} color={pref.chords?'var(--accent)':'var(--t2)'}/>
      </button>
    </div>

    {/* ── Blatt ────────────────────────────────── */}
    <div className="px-4 md:px-8 py-5">
      {!hasSheet
        ? <Empty title="Noch kein Blatt" sub="Text und Akkorde liegen für diesen Song noch nicht vor. Über ⋮ → Bearbeiten anlegen — von einer Akkordseite kopierter Text wird beim Einfügen automatisch umgewandelt."/>
        : <>
            <div className="max-w-[680px]">
              <SheetView rows={rows} tp={tp} showChords={pref.chords} fontPx={fontPx}
                onMark={applyMark}
                onLineClick={r=>{setNoteLine(noteLine===r.index?null:r.index);setNoteText('');}}
                activeLine={noteLine}
                afterLine={r=>{
                  const mine=notes.filter(n=>n.line===r.index);
                  const open=noteLine===r.index;
                  if(!mine.length&&!open) return null;
                  return <>
                    {mine.map(n=>
                      <div key={n.id} className="flex gap-2.5 items-start px-3 py-2 mb-3 -mt-1 rail-a">
                        <Av name={n.userName} role={n.userBandRole} size={19}/>
                        <div className="flex-1 min-w-0 text-[11.5px] text-ink-2 leading-[1.45]">
                          {n.text} <span className="text-ink-3">{noteDate(n.createdAt)}</span>
                        </div>
                        {n.userId===user.uid&&<button onClick={()=>delNote(n.id)} title="Notiz löschen"
                          className="cursor-pointer text-ink-3 hover:text-danger shrink-0"><Ic name="x" size={12} sw={2}/></button>}
                      </div>)}
                    {open&&<div className="flex gap-1.5 mb-4 fade">
                      <Inp value={noteText} onChange={e=>setNoteText(e.target.value)}
                        onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addNote())}
                        placeholder="Notiz zu dieser Zeile …"/>
                      <Btn onClick={addNote} disabled={!noteText.trim()} variant="accent" title="Notiz speichern">
                        <Ic name="check" size={15} sw={2.4}/></Btn>
                    </div>}
                  </>;
                }}/>
            </div>
            <div className="lab text-ink-3 mt-6 max-w-[680px] leading-[1.8]">
              Text auswählen, um Atem oder Halten zu markieren · Auf eine Zeile tippen für eine Notiz
            </div>
          </>}
    </div>

    {/* ── Griffleiste ──────────────────────────── */}
    {hasSheet&&chords.length>0&&<div className="px-4 md:px-8 py-4 bg-surf border-t border-line-2">
      <div className="flex items-baseline justify-between mb-3">
        <span className="lab text-ink-2">Griffe · {SHAPES[pref.instrument].label}</span>
        <span className="lab text-ink-3">{chords.length}</span>
      </div>
      <div className="flex gap-5 flex-wrap items-end">
        {chords.map(c=><ChordDiagram key={c} name={c} instrument={pref.instrument}/>)}
        <div className="flex flex-col gap-2 pb-1.5 ml-auto">
          <div className="flex items-center gap-2"><div className="w-3.5 h-2" style={{background:'rgba(229,160,60,.5)'}}/><span className="text-[10.5px] text-ink-3">Atem</span></div>
          <div className="flex items-center gap-2"><div className="w-3.5 h-2" style={{background:'rgba(111,169,107,.5)'}}/><span className="text-[10.5px] text-ink-3">Halten</span></div>
        </div>
      </div>
    </div>}

    {/* ── ⋮ Organisation ───────────────────────── */}
    {panel&&<div className="px-4 md:px-8 py-6 border-t border-line-2 fade">
      {edit
        ? <div className="max-w-[720px]">
            <SectionLabel>Song bearbeiten</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Fld label="Songname"><Inp value={ef.title} onChange={e=>setEF(p=>({...p,title:e.target.value}))}/></Fld>
              <Fld label="Künstler"><Inp value={ef.artist} onChange={e=>setEF(p=>({...p,artist:e.target.value}))}/></Fld>
              <Fld label="Genre"><Sel value={ef.genre} onChange={e=>setEF(p=>({...p,genre:e.target.value}))} options={[{value:'',label:'Genre …'},...GENRES]}/></Fld>
              <Fld label="Status"><Sel value={ef.status} onChange={e=>setEF(p=>({...p,status:e.target.value}))} options={Object.entries(STATUS_MAP).filter(([k])=>k!=='suggested').map(([k,v])=>({value:k,label:v.label}))}/></Fld>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <Fld label="Tonart"><Inp value={ef.key} onChange={e=>setEF(p=>({...p,key:e.target.value}))} placeholder="G"/></Fld>
              <Fld label="Capo"><Inp type="number" value={ef.capo} onChange={e=>setEF(p=>({...p,capo:e.target.value}))} placeholder="0"/></Fld>
              <Fld label="BPM"><Inp type="number" value={ef.bpm} onChange={e=>setEF(p=>({...p,bpm:e.target.value}))} placeholder="92"/></Fld>
            </div>
            {/* Blatt: links Quelltext, rechts sofortige Vorschau */}
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              <div>
                <Fld label="Blatt — Text mit Akkorden">
                  <textarea value={ef.sheet} rows={16} onPaste={onPasteSheet}
                    onChange={e=>{setEF(p=>({...p,sheet:e.target.value})); setPasted(null);}}
                    placeholder={SHEET_EXAMPLE}
                    className={`${FIELD_CLS} resize-y leading-[1.5]`}
                    style={{fontFamily:'var(--f-mono)',fontSize:12.5}}/>
                </Fld>

                {pasted!=null
                  ? <div className="flex items-center gap-2.5 px-3 py-2 mt-2 rail-a fade">
                      <Ic name="check" size={14} sw={2.2} color="var(--accent)"/>
                      <span className="text-[11.5px] text-ink-2 flex-1">
                        {pasted.n} {pasted.n===1?'Akkordzeile':'Akkordzeilen'} umgewandelt
                      </span>
                      <button onClick={()=>{setEF(p=>({...p,sheet:pasted.before}));setPasted(null);}}
                        className="lab text-accent cursor-pointer shrink-0">Rückgängig</button>
                    </div>
                  : <div className="flex items-center gap-3 mt-2">
                      <button onClick={convertSheet} className="lab text-ink-3 hover:text-accent cursor-pointer">
                        Akkordzeilen umwandeln
                      </button>
                      <span className="text-[10.5px] text-ink-3">
                        Beim Einfügen von einer Akkordseite passiert das automatisch.
                      </span>
                    </div>}

                <div className="mt-3 text-[11px] text-ink-3 leading-[1.8]">
                  <span className="num text-ink-2">[G]</span> Akkord ·{' '}
                  <span className="num text-ink-2">: Strophe 1 @ 0:48</span> Abschnitt ·{' '}
                  <span className="num text-ink-2">&gt; Text</span> Hinweis ·{' '}
                  <span className="num text-ink-2">~…~</span> Atem ·{' '}
                  <span className="num text-ink-2">=…=</span> Halten
                </div>
              </div>

              <div className="lg:sticky lg:top-[132px]">
                <div className="lab text-ink-3 mb-2">Vorschau</div>
                <div className="border border-line p-4 max-h-[520px] overflow-y-auto">
                  {previewRows.some(r=>r.type==='line')
                    ? <SheetView rows={previewRows} showChords fontPx={15}/>
                    : <div className="text-[12px] text-ink-3">Noch nichts eingetragen.</div>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <Fld label="YouTube-Link"><Inp value={ef.youtubeLink} onChange={e=>setEF(p=>({...p,youtubeLink:e.target.value}))} placeholder="https://youtube.com/…"/></Fld>
              <Fld label="Spotify-Link"><Inp value={ef.spotifyLink} onChange={e=>setEF(p=>({...p,spotifyLink:e.target.value}))} placeholder="https://open.spotify.com/…"/></Fld>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Btn onClick={()=>setEdit(false)} variant="quiet">Abbrechen</Btn>
              <Btn onClick={saveEdit} variant="accent">Speichern</Btn>
            </div>
          </div>

        : <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 items-start">
            <div>
              <SectionLabel color="var(--t3)">Status</SectionLabel>
              {song.status==='suggested'&&<div className="mb-3">
                <div className="text-[11.5px] text-ink-2 mb-2 leading-[1.45]">
                  Noch eine Idee — {(song.votes||[]).length} {(song.votes||[]).length===1?'Stimme':'Stimmen'}.
                </div>
                <Btn onClick={()=>upd({status:'practicing',movedAt:firebase.firestore.FieldValue.serverTimestamp()})}
                  variant="accent">→ Ins Repertoire übernehmen</Btn>
              </div>}
              <div className="flex gap-1.5 flex-wrap">
                {Object.entries(STATUS_MAP).filter(([k])=>k!=='suggested').map(([k,v])=>
                  <button key={k} onClick={()=>upd({status:k})}
                    className="px-3 py-1.5 border text-[11.5px] font-semibold cursor-pointer rounded-theme-sm transition-colors duration-100"
                    style={{borderColor:song.status===k?v.color:'var(--border2)',
                            background:song.status===k?v.bg:'transparent',
                            color:song.status===k?v.color:'var(--t3)'}}>{v.label}</button>)}
              </div>

              <div className="mt-6"><SectionLabel color="var(--t3)">Rollenverteilung</SectionLabel></div>
              {(song.roleAssignments||[]).map((r,i)=>
                <div key={i} className="flex items-center gap-2.5 py-2 border-b border-line">
                  <Av name={r.userName} role={r.userBandRole} size={24}/>
                  <span className="text-[12px] flex-1 min-w-0 truncate">{r.userName}</span>
                  <span className="text-[11px] text-accent truncate">{r.songRole}</span>
                  {r.userId===user.uid&&<button onClick={removeMyRole} title="Entfernen"
                    className="cursor-pointer text-ink-3 hover:text-danger"><Ic name="x" size={13} sw={2}/></button>}
                </div>)}
              {!mr&&<div className="flex gap-1.5 mt-2.5">
                <Sel value={addRole} onChange={e=>setAddRole(e.target.value)} options={[{value:'',label:'Meine Rolle …'},...SONG_ROLES]}/>
                <Btn onClick={addMyRole} variant="accent" title="Rolle übernehmen"><Ic name="plus" size={15} sw={2.2}/></Btn>
              </div>}

              {(song.youtubeLink||song.spotifyLink)&&<div className="flex gap-4 mt-6">
                {song.youtubeLink&&<a href={song.youtubeLink} target="_blank" rel="noopener noreferrer" className="lab">YouTube ↗</a>}
                {song.spotifyLink&&<a href={song.spotifyLink} target="_blank" rel="noopener noreferrer" className="lab">Spotify ↗</a>}
              </div>}

              <div className="flex gap-2 mt-6 pt-4 border-t border-line">
                <Btn onClick={startEdit} size="sm"><Ic name="pencil" size={13}/> Bearbeiten</Btn>
                <Btn onClick={delSong} size="sm" variant="danger"><Ic name="trash" size={13}/> Entfernen</Btn>
              </div>
            </div>

            <div>
              <SectionLabel color="var(--t3)">Kommentare</SectionLabel>
              <CommentsThread collection="comments" docId={song.id} user={user} profile={profile} members={members}/>
            </div>
          </div>}
    </div>}
  </div>;
}

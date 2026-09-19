// ════════════════════════════════════════════════════
//  SINGEN-MODUS
//  Vollbild, grosse Schrift, Autoscroll, Bildschirm bleibt an.
//  Nimmt eine Liste von Songs — ein einzelnes Blatt oder die
//  ganze Setliste einer Probe.
//
//  Das Tempo ist bewusst ein Regler und nicht aus dem BPM
//  gerechnet: wie schnell das Blatt laufen muss, haengt daran,
//  wie viele Takte auf einer Zeile stehen — das weiss die App
//  nicht. Der Wert wird pro Song gemerkt.
// ════════════════════════════════════════════════════
function PerformanceMode({songs, index, onIndex, onClose}){
  const song = songs[index];
  const[pref,setPref]   = useState(loadSheetPrefs);
  const[playing,setPlaying]=useState(false);
  const[speed,setSpeed] = useState(()=>loadPerfSpeed(song?.id));
  const[semis,setSemis] = useState(0);
  const scroller = useRef(null);

  const setP = patch => setPref(p=>{ const n={...p,...patch}; saveSheetPrefs(n); return n; });

  // Songwechsel: nach oben, anhalten, gemerktes Tempo holen
  useEffect(()=>{
    setPlaying(false); setSemis(0);
    setSpeed(loadPerfSpeed(song?.id));
    if(scroller.current) scroller.current.scrollTop=0;
  },[song?.id]);

  // Bildschirm anlassen. Nach dem Wegschalten muss die Sperre neu
  // angefordert werden — der Browser gibt sie beim Verlassen frei.
  useEffect(()=>{
    let lock=null, alive=true;
    const grab=async()=>{ try{ if(alive&&document.visibilityState==='visible')
      lock=await navigator.wakeLock?.request('screen'); }catch{} };
    grab();
    document.addEventListener('visibilitychange',grab);
    return()=>{ alive=false; document.removeEventListener('visibilitychange',grab);
      try{lock?.release();}catch{} };
  },[]);

  // Autoscroll. Bruchteile werden aufaddiert, sonst steht es bei
  // kleinen Tempi still (scrollTop nimmt nur ganze Pixel an).
  useEffect(()=>{
    if(!playing) return;
    let raf, last=performance.now(), acc=0;
    const step=now=>{
      const el=scroller.current;
      if(!el){ return; }
      acc += speed*(now-last)/1000; last=now;
      const whole=Math.floor(acc);
      if(whole){ el.scrollTop+=whole; acc-=whole; }
      if(el.scrollTop+el.clientHeight >= el.scrollHeight-1){ setPlaying(false); return; }
      raf=requestAnimationFrame(step);
    };
    raf=requestAnimationFrame(step);
    return()=>cancelAnimationFrame(raf);
  },[playing,speed]);

  useEffect(()=>{
    const key=e=>{
      if(e.key==='Escape') onClose();
      if(e.key===' '){ e.preventDefault(); setPlaying(p=>!p); }
    };
    window.addEventListener('keydown',key);
    return()=>window.removeEventListener('keydown',key);
  },[onClose]);

  if(!song) return null;

  const rows   = parseSheet(song.sheet);
  const flats  = preferFlats(song.key||'C',semis);
  const tp     = c => transposeChord(c,semis,flats);
  const hasSheet = rows.some(r=>r.type==='line');
  const fontPx = PERF_SIZES[pref.perfSize] ?? PERF_SIZES[1];
  const many   = songs.length>1;

  const changeSpeed=v=>{ setSpeed(v); savePerfSpeed(song.id,v); };

  return <div className="fixed inset-0 z-[200] bg-base flex flex-col">

    {/* Kopf */}
    <div className="flex items-center gap-2 px-2 md:px-4 py-2 border-b border-line-2 shrink-0">
      <button onClick={onClose} title="Schließen (Esc)"
        className="w-11 h-11 flex items-center justify-center cursor-pointer text-ink shrink-0">
        <Ic name="x" size={20} sw={2}/>
      </button>
      <div className="flex-1 min-w-0">
        <div className="font-display font-bold text-[16px] tracking-[-.02em] truncate">{song.title}</div>
        <div className="text-[11px] text-ink-2 truncate">
          {song.artist}
          {song.key&&<> · <span className="num" style={{color:semis?'var(--accent)':'var(--t2)'}}>{tp(song.key)}</span></>}
          {many&&<> · <span className="num">{index+1}/{songs.length}</span></>}
        </div>
      </div>

      <div className="flex items-center h-10 border border-line-2 shrink-0">
        <button onClick={()=>setSemis(s=>s-1)} title="Tiefer" className="w-8 h-10 cursor-pointer text-ink-2 text-[17px]">−</button>
        <span className="num text-[12px] min-w-[26px] text-center" style={{color:semis?'var(--accent)':'var(--t3)'}}>
          {semis>0?`+${semis}`:semis}</span>
        <button onClick={()=>setSemis(s=>s+1)} title="Höher" className="w-8 h-10 cursor-pointer text-ink-2 text-[17px]">+</button>
      </div>
      <button onClick={()=>setP({perfSize:(pref.perfSize+1)%PERF_SIZES.length})} title="Schriftgröße"
        className="w-10 h-10 border border-line-2 flex items-center justify-center cursor-pointer shrink-0 text-ink-2">
        <span className="font-display font-bold" style={{fontSize:11+pref.perfSize*3}}>A</span>
      </button>
      <button onClick={()=>setP({chords:!pref.chords})} title={pref.chords?'Akkorde ausblenden':'Akkorde einblenden'}
        className="w-10 h-10 border flex items-center justify-center cursor-pointer shrink-0"
        style={{borderColor:pref.chords?'var(--accent)':'var(--border2)',
                background:pref.chords?'var(--accent-tint)':'transparent'}}>
        <Ic name="list" size={17} color={pref.chords?'var(--accent)':'var(--t2)'}/>
      </button>
    </div>

    {/* Blatt */}
    <div ref={scroller} className="flex-1 overflow-y-auto px-5 md:px-10 py-6">
      {hasSheet
        ? <div className="max-w-[780px] mx-auto"><SheetView rows={rows} tp={tp} showChords={pref.chords} fontPx={fontPx}/></div>
        : <div className="max-w-[420px] mx-auto pt-10">
            <Empty title="Kein Blatt hinterlegt" sub="Für diesen Song sind noch kein Text und keine Akkorde eingetragen."/>
          </div>}
      {/* Luft am Ende, damit die letzte Zeile bis in die Mitte laufen kann */}
      <div style={{height:'45vh'}}/>
    </div>

    {/* Steuerung */}
    <div className="flex items-center gap-3 px-3 md:px-6 py-3 border-t border-line-2 shrink-0"
      style={{paddingBottom:'calc(env(safe-area-inset-bottom) + 12px)'}}>
      {many&&<button onClick={()=>onIndex(index-1)} disabled={index===0} title="Vorheriger Song"
        className="w-11 h-11 border border-line-2 flex items-center justify-center cursor-pointer shrink-0"
        style={{opacity:index===0?.35:1}}><Ic name="left" size={18} color="var(--t2)"/></button>}

      <button onClick={()=>setPlaying(p=>!p)} title={playing?'Anhalten (Leertaste)':'Mitlaufen (Leertaste)'}
        className="w-11 h-11 flex items-center justify-center cursor-pointer shrink-0 bg-accent hover:bg-accent-h transition-colors duration-100">
        {playing
          ? <svg viewBox="0 0 24 24" width="16" height="16" fill="#121114"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>
          : <Ic name="play" size={15} fill color="#121114"/>}
      </button>

      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <span className="lab text-ink-3 shrink-0 hidden sm:block">Tempo</span>
        <input type="range" min="4" max="90" value={speed}
          onChange={e=>changeSpeed(+e.target.value)} aria-label="Scrolltempo"/>
        <span className="num text-[11px] text-ink-3 shrink-0 w-7 text-right">{speed}</span>
      </div>

      <button onClick={()=>{ if(scroller.current) scroller.current.scrollTop=0; setPlaying(false); }}
        title="An den Anfang" className="w-11 h-11 border border-line-2 flex items-center justify-center cursor-pointer shrink-0">
        <Ic name="up" size={18} color="var(--t2)"/>
      </button>

      {many&&<button onClick={()=>onIndex(index+1)} disabled={index===songs.length-1} title="Nächster Song"
        className="w-11 h-11 border border-line-2 flex items-center justify-center cursor-pointer shrink-0"
        style={{opacity:index===songs.length-1?.35:1}}><Ic name="right" size={18} color="var(--t2)"/></button>}
    </div>
  </div>;
}

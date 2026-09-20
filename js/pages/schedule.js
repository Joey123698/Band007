// ════════════════════════════════════════════════════
//  SCHEDULE PAGE
//
//  Zwei Betriebsarten im Verfuegbarkeitsraster:
//
//  • Standardwoche — die Zeiten, die normalerweise passen.
//    Wochentag-basiert (`availability.slots`). Das ist die Grundlage,
//    deshalb startet sie gleich im Malmodus.
//
//  • Diese Woche — echte Kalendertage. Zeigt die Standardwoche,
//    laesst sie aber pro Datum uebersteuern (`availability.dates`).
//    Startet im Ansehen-Modus: ein Tippen zeigt, wer kann, und die
//    Probe laesst sich direkt daraus ansetzen.
//
//  Quer dazu liegt der Malmodus (siehe „Zeiten malen“ weiter unten).
//  Er gilt in beiden Betriebsarten und ist ein sichtbarer Schalter,
//  keine Geste — das haelt Tippen und Eintragen auseinander.
// ════════════════════════════════════════════════════
// STALE_DAYS steht in js/core/constants.js — das Dashboard braucht es auch.

function SchedulePage({user,profile,allSessions,allSongs,members,onPerform}){
  const[weekOff,setWeekOff]=useState(0);
  const[mode,setMode]=useState('week');        // 'week' | 'standard'
  const[myAvail,setMyAvail]=useState({slots:{},dates:{}});
  const[myUpdated,setMyUpdated]=useState(null);
  const[allAvail,setAllAvail]=useState({});
  const[sel,setSel]=useState(null);            // {dateKey, wd, h}
  const[locations,setLocations]=useState([]);
  const[view,setView]=useState('avail');
  const[sf,setSF]=useState({title:'',date:'',time:'',location:'',leadId:'',notes:'',setlist:[]});
  const[newLoc,setNewLoc]=useState('');
  const[editId,setEditId]=useState(null);
  const[showCommentsId,setShowCommentsId]=useState(null);
  const[creating,setCreating]=useState(false);

  const weekDays=useMemo(()=>getWeekDays(weekOff),[weekOff]);
  const dayKeys =useMemo(()=>weekDays.map(toKey),[weekDays]);

  useEffect(()=>{
    const u1=db.collection('availability').doc(user.uid).onSnapshot(d=>{
      if(!d.exists) return;
      const v=d.data()||{};
      setMyAvail({slots:v.slots||{},dates:v.dates||{}});
      setMyUpdated(v.updatedAt||null);
    });
    const u2=db.collection('availability').onSnapshot(s=>{
      const a={}; s.docs.forEach(d=>{const v=d.data()||{};a[d.id]={slots:v.slots||{},dates:v.dates||{}};});
      setAllAvail(a);
    });
    const u3=db.collection('locations').onSnapshot(s=>setLocations(s.docs.map(d=>({id:d.id,...d.data()}))));
    return()=>{u1();u2();u3();};
  },[]);

  // ── Zeiten malen ─────────────────────────────────
  //
  //  Frueher lief das ueber onMouseDown/onMouseEnter. Auf dem Telefon
  //  gibt es kein mouseenter: der Finger loest nur auf der ersten Zelle
  //  aus, danach nichts mehr — Ziehen war schlicht unmoeglich. Jetzt
  //  Pointer Events plus elementFromPoint, damit Maus und Finger
  //  denselben Weg gehen.
  //
  //  Zwei weitere Dinge sind dabei geradegezogen:
  //  • Der Malmodus ist ein sichtbarer Schalter statt einer Geste. Nur
  //    solange er an ist, steht `touch-action: none` — sonst liessen
  //    sich Seiten auf dem Telefon nicht mehr scrollen. Und er macht
  //    das Malen auch in „Diese Woche“ moeglich, wo es vorher gar nicht
  //    ging.
  //  • Waehrend des Ziehens wird nur lokal geaendert; erst beim
  //    Loslassen geht EIN Schreibvorgang raus. Vorher war es einer pro
  //    ueberstrichener Zelle.
  const[paintMode,setPaintMode]=useState(mode==='standard');
  useEffect(()=>{ setPaintMode(mode==='standard'); setSel(null); },[mode]);

  const gridRef=useRef(null);
  const live=useRef(myAvail);                 // aktueller Stand waehrend des Ziehens
  useEffect(()=>{ live.current=myAvail; },[myAvail]);
  const painted=useRef(null);                 // schon beruehrte Zellen
  const paintOn=useRef(true);                 // setzen oder loeschen
  const[painting,setPainting]=useState(false);

  const persist=async next=>{
    await db.collection('availability').doc(user.uid)
      .set({...next,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
  };
  const save=next=>{ setMyAvail(next); live.current=next; persist(next); };

  const readCell=(cur,wd,h)=> mode==='standard'
    ? !!cur.slots[slotKey(wd,h)]
    : availAt(cur,dayKeys[wd],wd,h);

  const applyCell=(wd,h,on)=>{
    const cur=live.current;
    let next;
    if(mode==='standard'){
      const slots={...cur.slots};
      if(on) slots[slotKey(wd,h)]=true; else delete slots[slotKey(wd,h)];
      next={...cur,slots};
    }else{
      // Deckt sich die Wahl wieder mit der Standardwoche, faellt der
      // Eintrag raus — sonst sammeln sich tote Ausnahmen an.
      const k=dateSlotKey(dayKeys[wd],h), std=!!cur.slots[slotKey(wd,h)];
      const dates={...cur.dates};
      if(on===std) delete dates[k]; else dates[k]=on;
      next={...cur,dates};
    }
    live.current=next; setMyAvail(next);
  };

  const cellAt=(x,y)=>{
    const el=document.elementFromPoint(x,y);
    const c=el&&el.closest?el.closest('[data-wd]'):null;
    return c?{wd:+c.dataset.wd,h:+c.dataset.h}:null;
  };

  // Waehrend gemalt wird, steht `touch-action: none` — die Seite laesst
  // sich also nicht mit dem Finger scrollen. Auf einem Telefon liegen die
  // spaeten Stunden aber unter dem Bildschirmrand. Deshalb schiebt der
  // Rand die Seite selbst weiter, solange der Finger dort haelt, und malt
  // dabei unter dem stehenden Finger weiter.
  const lastPt=useRef(null);
  const scrollVel=useRef(0);
  const rafId=useRef(0);
  const RAND=80;                              // Breite der Randzone

  const paintAt=(x,y)=>{
    if(!painted.current) return;
    const c=cellAt(x,y); if(!c) return;
    const k=c.wd+'_'+c.h;
    if(painted.current.has(k)) return;
    painted.current.add(k);
    applyCell(c.wd,c.h,paintOn.current);
  };

  const tick=()=>{
    rafId.current=0;
    if(!painted.current) return;              // Ziehen vorbei: Schleife endet
    if(scrollVel.current){
      window.scrollBy(0,scrollVel.current);
      if(lastPt.current) paintAt(lastPt.current.x,lastPt.current.y);
    }
    rafId.current=requestAnimationFrame(tick);
  };
  useEffect(()=>()=>cancelAnimationFrame(rafId.current),[]);

  const onPointerDown=e=>{
    if(!paintMode) return;
    const c=cellAt(e.clientX,e.clientY); if(!c) return;
    e.preventDefault();
    try{ gridRef.current?.setPointerCapture(e.pointerId); }catch{}
    paintOn.current=!readCell(live.current,c.wd,c.h);
    painted.current=new Set([c.wd+'_'+c.h]);
    lastPt.current={x:e.clientX,y:e.clientY};
    scrollVel.current=0;
    setPainting(true);
    applyCell(c.wd,c.h,paintOn.current);
    cancelAnimationFrame(rafId.current);
    rafId.current=requestAnimationFrame(tick);
  };
  const onPointerMove=e=>{
    if(!painted.current) return;
    lastPt.current={x:e.clientX,y:e.clientY};
    paintAt(e.clientX,e.clientY);
    const y=e.clientY, hoehe=window.innerHeight;
    const roh = y<RAND        ? -(RAND-y)
              : y>hoehe-RAND  ?  (y-(hoehe-RAND))
              : 0;
    scrollVel.current = Math.max(-20,Math.min(20,roh*0.32));
  };
  const onPointerUp=e=>{
    if(!painted.current) return;
    painted.current=null; scrollVel.current=0; lastPt.current=null;
    cancelAnimationFrame(rafId.current); rafId.current=0;
    setPainting(false);
    try{ gridRef.current?.releasePointerCapture(e.pointerId); }catch{}
    persist(live.current);                    // genau ein Schreibvorgang
  };

  // Beim Einschalten das Raster nach oben holen — so sind moeglichst
  // viele Stunden erreichbar. Nicht beim ersten Rendern, sonst springt
  // die Seite schon vor dem ersten Antippen.
  const ersterLauf=useRef(true);
  useEffect(()=>{
    if(ersterLauf.current){ ersterLauf.current=false; return; }
    if(paintMode) gridRef.current?.scrollIntoView({behavior:'smooth',block:'start'});
  },[paintMode]);

  // ── Diese Woche: einzelnes Fenster ueber die Auswahl umstellen ──
  const setDate=(dateKey,wd,h,on)=>{
    const k=dateSlotKey(dateKey,h), dates={...myAvail.dates};
    const std=!!myAvail.slots[slotKey(wd,h)];
    if(on===std) delete dates[k]; else dates[k]=on;
    save({...myAvail,dates});
  };

  // ── Zaehlungen fuer das angezeigte Raster ────────
  const counts=useMemo(()=>{
    const c={};
    dayKeys.forEach((dk,wd)=>HOURS.forEach(h=>{
      let n=0;
      Object.values(allAvail).forEach(a=>{
        const ok = mode==='standard' ? !!a.slots[slotKey(wd,h)] : availAt(a,dk,wd,h);
        if(ok) n++;
      });
      c[mode==='standard'?slotKey(wd,h):dateSlotKey(dk,h)]=n;
    }));
    return c;
  },[allAvail,dayKeys,mode]);

  const maxCount=Math.max(...Object.values(counts).filter(Boolean),1);
  const ranked=Object.entries(counts).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]);
  const best=ranked[0]||null, second=ranked[1]||null;

  const keyLabel=k=>{
    const i=k.lastIndexOf('_'), head=k.slice(0,i), h=+k.slice(i+1);
    return mode==='standard' ? `${DAYS_DE[+head]} · ${hlbl(h)}` : `${dfmtLong(head)} · ${hlbl(h)}`;
  };

  // Wer kann im gewaehlten Fenster?
  const selFree=useMemo(()=>{
    if(!sel) return [];
    return members.filter(m=>availAt(allAvail[m.id],sel.dateKey,sel.wd,sel.h));
  },[sel,allAvail,members]);
  const iCan = sel ? availAt(allAvail[user.uid]||myAvail,sel.dateKey,sel.wd,sel.h) : false;

  // Wie viel habe ich in der gezeigten Woche ueberhaupt eingetragen?
  const meineStunden = dayKeys.reduce((n,dk,wd)=>
    n + HOURS.filter(h=>readCell(myAvail,wd,h)).length, 0);

  const staleDays=daysSince(myUpdated);
  const isStale = staleDays!=null && staleDays>=STALE_DAYS;
  const confirmTimes=()=>save(myAvail);   // schreibt nur updatedAt neu

  // Wer hat ueberhaupt nichts eingetragen? Das ist der haeufigste Grund,
  // warum sich kein gemeinsames Fenster findet — und man sieht es sonst nicht.
  const missing = members.filter(m=>{
    const a=allAvail[m.id];
    return !a || (!Object.keys(a.slots||{}).length && !Object.keys(a.dates||{}).length);
  });

  // „Wie letzte Woche“: die tatsaechliche Verfuegbarkeit der Vorwoche in
  // diese Woche uebernehmen. Deckt sie sich mit der Standardwoche, wird
  // kein Eintrag angelegt.
  const copyLastWeek=()=>{
    const prev=getWeekDays(weekOff-1).map(toKey);
    const dates={...myAvail.dates};
    dayKeys.forEach((dk,wd)=>HOURS.forEach(h=>{
      const was=availAt(myAvail,prev[wd],wd,h);
      const std=!!myAvail.slots[slotKey(wd,h)];
      const k=dateSlotKey(dk,h);
      if(was===std) delete dates[k]; else dates[k]=was;
    }));
    save({...myAvail,dates});
  };
  // Ausnahmen dieser Woche verwerfen -> wieder reine Standardwoche
  const weekExceptions = dayKeys.reduce((n,dk)=>
    n+HOURS.filter(h=>dateSlotKey(dk,h) in (myAvail.dates||{})).length,0);
  const clearWeek=()=>{
    const dates={...myAvail.dates};
    dayKeys.forEach(dk=>HOURS.forEach(h=>{delete dates[dateSlotKey(dk,h)];}));
    save({...myAvail,dates});
  };

  // ── Probe direkt aus dem Raster ──────────────────
  // Uebernimmt nur Datum und Uhrzeit. Die Zusage bleibt bewusst leer:
  // „ich habe Zeit“ ist nicht dasselbe wie „ich komme“ — das sagt jede
  // Person selbst auf der Probenkarte.
  const createFromSlot=async()=>{
    if(!sel) return;
    setCreating(true);
    await db.collection('sessions').add({
      title:'Probe', date:sel.dateKey, time:hlbl(sel.h), location:'', leadId:'', leadName:'',
      notes:'', setlist:[], attendance:{}, status:'upcoming',
      createdAt:firebase.firestore.FieldValue.serverTimestamp(),
    });
    setCreating(false); setSel(null); setView('proben');
  };

  const addLoc=async()=>{if(!newLoc.trim())return;await db.collection('locations').add({name:newLoc.trim(),createdAt:firebase.firestore.FieldValue.serverTimestamp()});setNewLoc('');};
  const createSess=async()=>{
    if(!sf.date)return;
    const lead=members.find(m=>m.id===sf.leadId);
    await db.collection('sessions').add({...sf,leadName:lead?.displayName||'',attendance:{},status:'upcoming',createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    setSF({title:'',date:'',time:'',location:'',leadId:'',notes:'',setlist:[]});setView('proben');
  };
  const updateSess=async(id,data)=>{await db.collection('sessions').doc(id).update(data);setEditId(null);};
  const deleteSess=async id=>{if(window.confirm('Probe löschen?'))await db.collection('sessions').doc(id).delete();};
  const toggleSL=s=>{const ex=sf.setlist.find(x=>x.songId===s.id);setSF(f=>({...f,setlist:ex?f.setlist.filter(x=>x.songId!==s.id):[...f.setlist,{songId:s.id,title:s.title,artist:s.artist}]}));};

  const today=nowKey();
  const upcoming5=allSessions.filter(s=>s.date>=today&&s.status!=='cancelled').sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5);
  const past5=allSessions.filter(s=>s.date<today||s.status==='completed').sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  const practiceSongs=allSongs.filter(s=>['practicing','ready'].includes(s.status));
  const sessionDays=new Set(allSessions.filter(s=>s.status!=='cancelled').map(s=>s.date));

  const weekLabel=weekOff===0?'Diese Woche':weekOff===-1?'Letzte Woche':weekOff===1?'Nächste Woche':(weekOff<0?`Vor ${-weekOff} Wochen`:`In ${weekOff} Wochen`);

  return <div>
    <PageHead title="Probeplan"/>

    <div className="flex gap-1 px-4 md:px-8 border-b border-line-2 overflow-x-auto">
      <PillBtn active={view==='avail'}  onClick={()=>setView('avail')}>Verfügbarkeit</PillBtn>
      <PillBtn active={view==='proben'} onClick={()=>setView('proben')}>Proben {upcoming5.length}</PillBtn>
      <PillBtn active={view==='create'} onClick={()=>setView('create')}>+ Neu</PillBtn>
    </div>

    <div className="px-4 md:px-8 py-5">

    {view==='avail'&&<>
      {/* Betriebsart */}
      <div className="flex mb-4">
        {[['week','Diese Woche'],['standard','Standardwoche']].map(([k,l],i)=>
          <button key={k} onClick={()=>{setMode(k);setSel(null);}}
            className="px-3.5 h-10 text-[12px] font-semibold cursor-pointer border transition-colors duration-100"
            style={mode===k
              ?{background:'var(--accent)',color:'#121114',borderColor:'var(--accent)',fontWeight:700}
              :{color:'var(--t2)',borderColor:'var(--border2)',borderLeftWidth:i?0:1}}>{l}</button>)}
      </div>

      {mode==='standard'
        ? <div className="px-3 py-2.5 mb-4 rail-a text-[11.5px] text-ink-2 leading-[1.45] max-w-[520px]">
            Die Zeiten, die normalerweise passen. Sie gelten für jede Woche —
            Ausnahmen trägst du unter <span className="text-ink font-semibold">Diese Woche</span> ein.
            Ziehen mit gedrückter Maus markiert mehrere Felder.
          </div>
        : <>
            {isStale&&<div className="flex items-center gap-2.5 px-3 py-2.5 mb-2 rail-a max-w-[520px]">
              <Ic name="clock" size={15} sw={1.8} color="var(--accent)"/>
              <span className="text-[11.5px] text-ink-2 flex-1">Deine Zeiten sind {staleDays} Tage alt</span>
              <button onClick={confirmTimes} className="lab text-accent cursor-pointer shrink-0">Prüfen</button>
            </div>}
            {/* Ohne diese Zeile sucht man ewig nach einem Fenster, das es
                gar nicht geben kann, weil jemand nichts eingetragen hat. */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 mb-4 border-l-2 max-w-[520px]"
              style={{borderLeftColor:missing.length?'var(--warn)':'var(--ok)',background:'var(--surf)'}}>
              <Ic name={missing.length?'alert':'check'} size={15} sw={1.9}
                color={missing.length?'var(--warn)':'var(--ok)'}/>
              <span className="text-[11.5px] text-ink-2 flex-1">
                {members.length-missing.length}/{members.length} haben Zeiten eingetragen
                {missing.length>0&&<span className="text-ink-3"> — es fehlt {missing.map(m=>m.displayName).join(', ')}</span>}
              </span>
            </div>
          </>}

      {/* Wochenschalter — nur bei echten Daten */}
      {mode==='week'&&<div className="flex items-center justify-between gap-3 mb-5 max-w-[520px]">
        <button onClick={()=>{setWeekOff(w=>w-1);setSel(null);}} title="Woche zurück"
          className="w-10 h-10 border border-line-2 flex items-center justify-center cursor-pointer hover:border-accent transition-colors duration-100">
          <Ic name="left" size={17} sw={1.8} color="var(--t2)"/>
        </button>
        <div className="text-center">
          <div className="font-display font-bold text-[14px] tracking-[-.01em]">
            {weekDays[0].toLocaleDateString('de-DE',{day:'numeric',month:'long'})} – {weekDays[6].toLocaleDateString('de-DE',{day:'numeric',month:'long'})}
          </div>
          <div className="lab text-ink-3 mt-1">{weekLabel}</div>
        </div>
        <button onClick={()=>{setWeekOff(w=>w+1);setSel(null);}} title="Woche vor"
          className="w-10 h-10 border border-line-2 flex items-center justify-center cursor-pointer hover:border-accent transition-colors duration-100">
          <Ic name="right" size={17} sw={1.8} color="var(--t2)"/>
        </button>
      </div>}

      {/* 98 Felder tickt niemand zweimal — deshalb die Abkürzung */}
      {mode==='week'&&<div className="flex items-center gap-4 mb-4">
        <button onClick={copyLastWeek} className="lab text-ink-3 hover:text-accent cursor-pointer">
          Wie letzte Woche
        </button>
        {weekExceptions>0&&<button onClick={clearWeek} className="lab text-ink-3 hover:text-accent cursor-pointer">
          {weekExceptions} {weekExceptions===1?'Ausnahme':'Ausnahmen'} verwerfen
        </button>}
      </div>}

      {/* Raster */}
      {/* Malmodus. Sichtbarer Schalter statt Geste: nur so laesst sich
          `touch-action` gezielt abschalten, ohne das Scrollen der Seite
          zu verlieren — und nur so ist klar, ob ein Tippen eintraegt
          oder nachschaut. */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <button onClick={()=>{setPaintMode(v=>!v); setSel(null);}}
          className="flex items-center gap-2 h-10 px-3.5 border text-[12px] font-semibold cursor-pointer transition-colors duration-100"
          style={paintMode
            ?{background:'var(--accent)',color:'#121114',borderColor:'var(--accent)',fontWeight:700}
            :{color:'var(--t2)',borderColor:'var(--border2)'}}>
          <Ic name="pencil" size={14} color={paintMode?'#121114':'var(--t2)'}/>
          {paintMode?'Fertig':'Zeiten eintragen'}
        </button>
        <span className="text-[11.5px] text-ink-2">
          {paintMode
            ? <>Über die Felder ziehen. Nochmal ziehen hebt auf.</>
            : mode==='week'
              ? <>Auf ein Feld tippen zeigt, wer kann.</>
              : <>Tippe „Zeiten eintragen“, um deine Zeiten zu markieren.</>}
        </span>
      </div>

      {/* Kein min-width mehr: das Raster passte sonst nicht auf ein Telefon
          und lag in einem waagerechten Scroller — der hat jede Ziehgeste
          abgefangen. Jetzt teilen sich sieben Spalten die Breite. */}
      <div ref={gridRef} className="select-none max-w-[560px]"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
        style={{touchAction:paintMode?'none':'auto'}}>
        <div>
          <div className="grid grid-cols-[26px_repeat(7,minmax(0,1fr))] gap-[2px] md:gap-[3px] mb-2">
            <div/>
            {weekDays.map((d,i)=>{
              const isT=mode==='week'&&dayKeys[i]===today;
              const hasProbe=mode==='week'&&sessionDays.has(dayKeys[i]);
              return <div key={i} className="text-center">
                <div className="text-[10px] font-bold" style={{color:isT?'var(--accent)':'var(--t2)'}}>{DAYS_DE[i]}</div>
                {mode==='week'
                  ? <div className="num text-[10px]" style={{color:isT?'var(--accent)':'var(--t3)'}}>{d.getDate()}</div>
                  : <div className="lab text-ink-3">jede</div>}
                {hasProbe&&<div className="w-1 h-1 mx-auto mt-0.5" style={{background:'var(--accent)'}}/>}
              </div>;
            })}
          </div>

          {HOURS.map(h=><div key={h} className="grid grid-cols-[26px_repeat(7,minmax(0,1fr))] gap-[2px] md:gap-[3px] mb-[2px] md:mb-[3px]">
            <div className="num text-[9px] text-ink-3 flex items-center justify-end pr-1" style={{fontWeight:600}}>{h}</div>
            {weekDays.map((_,wd)=>{
              const dk=dayKeys[wd];
              const k=mode==='standard'?slotKey(wd,h):dateSlotKey(dk,h);
              const cnt=counts[k]||0, t=cnt/maxCount;
              const mine=mode==='standard'?!!myAvail.slots[slotKey(wd,h)]:availAt(myAvail,dk,wd,h);
              const isBest=best&&best[0]===k&&!paintMode;
              const isSel=mode==='week'&&sel&&sel.dateKey===dk&&sel.h===h;
              return <div key={wd} data-wd={wd} data-h={h} role="button" tabIndex={-1}
                title={`${mode==='standard'?DAYS_DE[wd]:dfmtLong(dk)} ${hlbl(h)} — ${cnt} verfügbar${mine?' (du auch)':''}`}
                onClick={()=>{ if(!paintMode&&mode==='week') setSel(isSel?null:{dateKey:dk,wd,h}); }}
                className="h-8 md:h-7 border cursor-pointer flex items-center justify-center transition-colors duration-75"
                style={{
                  borderColor: isSel?'var(--text)':mine?'var(--accent)':cnt>0?'transparent':'var(--border)',
                  // Im Malmodus zaehlt die eigene Eintragung, nicht die Hitzekarte —
                  // sonst sieht man beim Ziehen nicht, was man gerade markiert hat.
                  background: isBest?'var(--accent)'
                            : mine&&paintMode?hexa('#E5A03C',.34)
                            : cnt>0?hexa('#E5A03C',.06+t*.26):'transparent',
                }}>
                {cnt>0&&!paintMode&&<span className="num text-[10px]"
                  style={{color:isBest?'#121114':`rgba(229,160,60,${.45+t*.55})`}}>{cnt}</span>}
                {paintMode&&mine&&<Ic name="check" size={11} sw={3} color="var(--accent)"/>}
              </div>;
            })}
          </div>)}
        </div>
      </div>

      {paintMode&&<div className="lab text-ink-3 mt-3">
        Deine Zeiten: {meineStunden} {meineStunden===1?'Stunde':'Stunden'}
      </div>}

      {/* Ausgewaehltes Fenster */}
      {mode==='week'&&sel&&<div className="mt-6 max-w-[560px] fade">
        <div className="p-4 rail-a">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <div className="font-display font-bold text-[18px] tracking-[-.02em]">
              {dfmtLong(sel.dateKey)} · {hlbl(sel.h)}
            </div>
            <div className="num text-[14px] shrink-0"
              style={{color:selFree.length===members.length?'var(--ok)':'var(--t2)'}}>
              {selFree.length}/{members.length}
            </div>
          </div>

          {selFree.length===0
            ? <div className="text-[12px] text-ink-3 mb-3">Niemand hat diese Zeit eingetragen.</div>
            : <div className="flex gap-1.5 flex-wrap mb-3">
                {selFree.map(m=><span key={m.id} className="flex items-center gap-2 pl-1 pr-2.5 py-1 border border-line-2">
                  <Av name={m.displayName} role={mainRole(m)} photo={m.photo} size={21}/>
                  <span className="text-[11.5px] text-ink-2 font-semibold">{m.displayName}</span>
                </span>)}
              </div>}

          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-line">
            <span className="lab text-ink-3 flex-1">Ich an diesem Termin</span>
            <button onClick={()=>setDate(sel.dateKey,sel.wd,sel.h,!iCan)}
              className="px-3 h-9 border text-[12px] font-semibold cursor-pointer transition-colors duration-100"
              style={iCan
                ?{borderColor:hexa('#6FA96B',.45),background:hexa('#6FA96B',.10),color:'var(--ok)'}
                :{borderColor:'var(--border2)',color:'var(--t2)'}}>
              {iCan?'Ich kann':'Ich kann nicht'}
            </button>
          </div>

          <button onClick={createFromSlot} disabled={creating}
            className="w-full h-12 bg-accent hover:bg-accent-h flex items-center justify-center gap-2 cursor-pointer transition-colors duration-100"
            style={{color:'#121114',opacity:creating?.6:1}}>
            <Ic name="plus" size={16} sw={2.4}/>
            <span className="text-[13.5px] font-bold">{creating?'…':'Probe hier ansetzen'}</span>
          </button>
          <div className="text-[10.5px] text-ink-3 text-center mt-2">
            Übernimmt Datum und Uhrzeit. Zusagen gibt jede:r selbst.
          </div>
        </div>
      </div>}

      {/* Beste Fenster — wenn nichts gewaehlt ist */}
      {best&&!(mode==='week'&&sel)&&<div className="mt-6 max-w-[520px]">
        <div className="p-4 rail-a">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <div className="lab text-accent">Beste Probezeit</div>
              <div className="font-display font-bold text-[18px] tracking-[-.02em] mt-1.5">{keyLabel(best[0])}</div>
            </div>
            <div className="num text-[14px] text-ok shrink-0">{best[1]}/{members.length}</div>
          </div>
          {second&&<div className="flex items-baseline justify-between gap-3 mt-4 pt-3 border-t border-line">
            <div>
              <div className="lab text-ink-3">Nächstbeste</div>
              <div className="text-[12.5px] text-ink-2 font-semibold mt-1">{keyLabel(second[0])}</div>
            </div>
            <div className="num text-[12px] text-ink-2 shrink-0">{second[1]}/{members.length}</div>
          </div>}
          {mode==='week'&&<div className="lab text-ink-3 mt-4">Auf ein Feld tippen, um es anzusetzen</div>}
        </div>
      </div>}

      <div className="flex gap-x-5 gap-y-2 flex-wrap mt-5">
        <div className="flex items-center gap-2"><div className="w-3.5 h-3 border border-accent"/><span className="text-[10.5px] text-ink-3">Deine Zeit</span></div>
        <div className="flex items-center gap-2"><div className="w-3.5 h-3" style={{background:hexa('#E5A03C',.14)}}/><span className="text-[10.5px] text-ink-3">Einige können</span></div>
        <div className="flex items-center gap-2"><div className="w-3.5 h-3 bg-accent"/><span className="text-[10.5px] text-ink-3">Bestes Fenster</span></div>
        {mode==='week'&&<div className="flex items-center gap-2"><div className="w-1 h-1 bg-accent"/><span className="text-[10.5px] text-ink-3">Probe angesetzt</span></div>}
      </div>
    </>}

    {view==='proben'&&<>
      <SectionLabel color="var(--t3)" right={String(upcoming5.length)}>Bevorstehend</SectionLabel>
      {!upcoming5.length&&<Empty title="Keine Proben geplant" sub="Unter „Verfügbarkeit“ ein Fenster antippen oder „+ Neu“ verwenden."/>}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        {upcoming5.map(s=><SessionCard key={s.id} session={s} user={user} profile={profile} members={members} practiceSongs={practiceSongs} editId={editId} setEditId={setEditId} showCommentsId={showCommentsId} setShowCommentsId={setShowCommentsId} onUpdate={updateSess} onDelete={deleteSess} onPerform={onPerform}/>)}
      </div>
      {past5.length>0&&<>
        <div className="mt-8"><SectionLabel color="var(--t3)" right={String(past5.length)}>Vergangen</SectionLabel></div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
          {past5.map(s=><SessionCard key={s.id} session={s} user={user} profile={profile} members={members} practiceSongs={practiceSongs} editId={editId} setEditId={setEditId} showCommentsId={showCommentsId} setShowCommentsId={setShowCommentsId} onUpdate={updateSess} onDelete={deleteSess} onPerform={onPerform} past/>)}
        </div>
      </>}
    </>}

    {view==='create'&&<div className="max-w-[720px]">
      <div className="flex flex-col gap-4">
        <Fld label="Probenname"><Inp value={sf.title} onChange={e=>setSF(f=>({...f,title:e.target.value}))} placeholder="z. B. Probe vor dem Auftritt …"/></Fld>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Fld label="Datum"><Inp type="date" value={sf.date} onChange={e=>setSF(f=>({...f,date:e.target.value}))}/></Fld>
          <Fld label="Uhrzeit"><Inp type="time" value={sf.time} onChange={e=>setSF(f=>({...f,time:e.target.value}))}/></Fld>
        </div>
        <Fld label="Ort">
          <Sel value={sf.location} onChange={e=>setSF(f=>({...f,location:e.target.value}))} options={[{value:'',label:'— Ort auswählen —'},...locations.map(l=>({value:l.name,label:l.name})),{value:'Im Freien',label:'Im Freien (Standard)'}]}/>
          <div className="flex gap-1.5 mt-2">
            <Inp value={newLoc} onChange={e=>setNewLoc(e.target.value)} placeholder="Neuen Ort hinzufügen …"/>
            <Btn onClick={addLoc} title="Ort anlegen"><Ic name="plus" size={15} sw={2.2}/></Btn>
          </div>
        </Fld>
        <Fld label="Verantwortlich"><Sel value={sf.leadId} onChange={e=>setSF(f=>({...f,leadId:e.target.value}))} options={[{value:'',label:'— Später festlegen —'},...members.map(m=>({value:m.id,label:`${m.displayName} — ${mainRole(m)}`}))]}/></Fld>
        <Fld label={`Setliste · ${sf.setlist.length}`}>
          {practiceSongs.length===0
            ? <div className="text-[12px] text-ink-3 py-2">Noch keine Songs. Erst im Repertoire anlegen.</div>
            : <div className="border-t border-line">{practiceSongs.map(s=>{
                const selected=sf.setlist.find(x=>x.songId===s.id);
                return <div key={s.id} onClick={()=>toggleSL(s)}
                  className="flex items-center gap-2.5 px-2 py-2.5 border-b border-line cursor-pointer"
                  style={{background:selected?'var(--accent-tint)':'transparent'}}>
                  <div className="w-4 h-4 border shrink-0 flex items-center justify-center"
                    style={{background:selected?'var(--accent)':'transparent',borderColor:selected?'var(--accent)':'var(--border2)'}}>
                    {selected&&<Ic name="check" size={11} sw={3} color="#121114"/>}
                  </div>
                  <span className="text-[12.5px] flex-1 min-w-0 truncate">{s.title} <span className="text-ink-2">— {s.artist}</span></span>
                  <span className="lab shrink-0" style={{color:STATUS_MAP[s.status]?.color}}>{STATUS_MAP[s.status]?.label}</span>
                </div>;})}
              </div>}
        </Fld>
        <Fld label="Notizen"><Txta value={sf.notes} onChange={e=>setSF(f=>({...f,notes:e.target.value}))} placeholder="Vorbereitung, Ausrüstung …" rows={2}/></Fld>
        <div className="flex gap-2 justify-end">
          <Btn onClick={()=>setView('proben')} variant="quiet">Abbrechen</Btn>
          <Btn onClick={createSess} disabled={!sf.date} variant="accent">Probe erstellen</Btn>
        </div>
      </div>
    </div>}

    </div>
  </div>;
}

function SessionCard({session:s,user,profile,members,practiceSongs,editId,setEditId,showCommentsId,setShowCommentsId,onUpdate,onDelete,onPerform,past}){
  const[ef,setEF]=useState({title:s.title||'',date:s.date||'',time:s.time||'',location:s.location||'',leadId:s.leadId||'',notes:s.notes||''});
  const isEdit=editId===s.id, showC=showCommentsId===s.id;
  const att=s.attendance||{}, confirmed=Object.values(att).filter(v=>v.status==='confirmed').length;
  const offen=members.filter(m=>!att[m.id]).length;

  return <Card accent={!past&&!isEdit} className={past?'opacity-60':''}>
    {isEdit?<div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3">
        <Fld label="Name"><Inp value={ef.title} onChange={e=>setEF(f=>({...f,title:e.target.value}))}/></Fld>
        <Fld label="Datum"><Inp type="date" value={ef.date} onChange={e=>setEF(f=>({...f,date:e.target.value}))}/></Fld>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Fld label="Uhrzeit"><Inp type="time" value={ef.time} onChange={e=>setEF(f=>({...f,time:e.target.value}))}/></Fld>
        <Fld label="Ort"><Inp value={ef.location} onChange={e=>setEF(f=>({...f,location:e.target.value}))}/></Fld>
      </div>
      <Fld label="Verantwortlich"><Sel value={ef.leadId} onChange={e=>setEF(f=>({...f,leadId:e.target.value}))} options={[{value:'',label:'— Wählen —'},...members.map(m=>({value:m.id,label:m.displayName}))]}/></Fld>
      <Fld label="Notizen"><Txta value={ef.notes} onChange={e=>setEF(f=>({...f,notes:e.target.value}))} rows={2}/></Fld>
      <div className="flex gap-2 justify-end flex-wrap">
        <Btn onClick={()=>setEditId(null)} size="sm" variant="quiet">Abbrechen</Btn>
        <Btn onClick={()=>onDelete(s.id)} size="sm" variant="danger"><Ic name="trash" size={13}/> Löschen</Btn>
        <Btn onClick={()=>onUpdate(s.id,{...ef,leadName:members.find(m=>m.id===ef.leadId)?.displayName||''})} size="sm" variant="accent">Speichern</Btn>
      </div>
    </div>:<>
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <div className="font-display font-bold text-[16px] tracking-[-.02em] min-w-0 truncate">{s.title||'Probe'}</div>
        {!past&&<div className="flex gap-1 shrink-0">
          <button onClick={()=>setEditId(isEdit?null:s.id)} title="Bearbeiten"
            className="w-8 h-8 flex items-center justify-center cursor-pointer text-ink-3 hover:text-ink"><Ic name="pencil" size={14}/></button>
          <button onClick={()=>setShowCommentsId(showC?null:s.id)} title="Kommentare"
            className="w-8 h-8 flex items-center justify-center cursor-pointer"
            style={{color:showC?'var(--accent)':'var(--t3)'}}><Ic name="chat" size={14}/></button>
        </div>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-3">
        <div><div className="lab text-ink-3">Datum</div><div className="text-[12.5px] mt-1">{dfmt(s.date)}</div></div>
        <div><div className="lab text-ink-3">Zeit</div><div className="num text-[12.5px] mt-1">{s.time||'—'}</div></div>
        <div className="min-w-0"><div className="lab text-ink-3">Ort</div><div className="text-[12.5px] mt-1 truncate">{s.location||'—'}</div></div>
        <div className="min-w-0">
          <div className="lab text-ink-3">Zusagen</div>
          <div className="num text-[12.5px] mt-1">
            <span style={{color:confirmed?'var(--ok)':'var(--t3)'}}>{confirmed}</span>
            {/* Ohne die offenen Antworten sieht „1 Zusage“ bei drei Leuten
                genauso aus, egal ob zwei abgesagt oder nur geschwiegen haben. */}
            {offen>0&&<span className="text-ink-3"> · {offen} offen</span>}
          </div>
        </div>
      </div>

      {s.leadName&&<div className="mt-3 text-[12px]"><span className="text-ink-3">Verantwortlich </span><span className="text-accent font-semibold">{s.leadName}</span></div>}

      {s.setlist?.length>0&&<div className="mt-4 pt-3 border-t border-line">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <span className="lab text-ink-3">Setliste · {s.setlist.length}</span>
          {onPerform&&<button onClick={()=>onPerform(s.id)}
            className="lab text-accent cursor-pointer shrink-0 flex items-center gap-1.5">
            <Ic name="play" size={11} fill/> Probe starten
          </button>}
        </div>
        <div className="flex flex-col gap-1">
          {s.setlist.map((sg,i)=><div key={i} className="flex items-baseline gap-2.5">
            <span className="num text-[10px] text-ink-3 w-4 shrink-0">{String(i+1).padStart(2,'0')}</span>
            <span className="text-[12px] text-ink-2 truncate">{sg.title}</span>
          </div>)}
        </div>
      </div>}

      {showC&&<div className="mt-4 pt-3 border-t border-line fade">
        <CommentsThread collection="sessionComments" docId={s.id} user={user} profile={profile} members={members}/>
      </div>}
    </>}
  </Card>;
}

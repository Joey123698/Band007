// ════════════════════════════════════════════════════
//  SCHEDULE PAGE
// ════════════════════════════════════════════════════
function SchedulePage({user,profile,allSessions,allSongs,members}){
  const[weekOff,setWeekOff]=useState(0);
  const[myAvail,setMyAvail]=useState({});
  const[allAvail,setAllAvail]=useState({});
  const[locations,setLocations]=useState([]);
  const[view,setView]=useState('avail');
  const[sf,setSF]=useState({title:'',date:'',time:'',location:'',leadId:'',notes:'',setlist:[]});
  const[newLoc,setNewLoc]=useState('');
  const[editId,setEditId]=useState(null);
  const[showCommentsId,setShowCommentsId]=useState(null);
  const dragging=useRef(false),dragMode=useRef('set');

  const weekDays=useMemo(()=>getWeekDays(weekOff),[weekOff]);

  useEffect(()=>{
    const u1=db.collection('availability').doc(user.uid).onSnapshot(d=>{if(d.exists)setMyAvail(d.data().slots||{});});
    const u2=db.collection('availability').onSnapshot(s=>{const a={};s.docs.forEach(d=>{a[d.id]=d.data().slots||{};});setAllAvail(a);});
    const u3=db.collection('locations').onSnapshot(s=>setLocations(s.docs.map(d=>({id:d.id,...d.data()}))));
    return()=>{u1();u2();u3();};
  },[]);

  const saveAvail=async slots=>{await db.collection('availability').doc(user.uid).set({slots,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});};
  const toggle=(d,h)=>{const k=slotKey(d,h);const n={...myAvail,[k]:!myAvail[k]};if(!n[k])delete n[k];setMyAvail(n);saveAvail(n);};
  const handleMD=(d,h)=>{dragging.current=true;dragMode.current=myAvail[slotKey(d,h)]?'unset':'set';toggle(d,h);};
  const handleME=(d,h)=>{if(!dragging.current)return;const k=slotKey(d,h);const n={...myAvail,[k]:dragMode.current==='set'};if(dragMode.current!=='set')delete n[k];setMyAvail(n);saveAvail(n);};
  useEffect(()=>{const up=()=>{dragging.current=false;};window.addEventListener('mouseup',up);window.addEventListener('touchend',up);return()=>{window.removeEventListener('mouseup',up);window.removeEventListener('touchend',up);};},[]);

  // Count availability per slot
  const counts={};
  DAYS_DE.forEach((_,d)=>HOURS.forEach(h=>{ const k=slotKey(d,h);counts[k]=0;Object.values(allAvail).forEach(a=>{if(a&&a[k])counts[k]++;});}));
  const maxCount=Math.max(...Object.values(counts).filter(Boolean),1);
  const bestSlots=Object.entries(counts).filter(([,c])=>c>0).sort((a,b)=>b[1]-a[1]);
  const best=bestSlots[0]||null;

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

  // Sessions: show max 5 nearest past + 5 upcoming
  const today=nowKey();
  const upcoming5=allSessions.filter(s=>s.date>=today&&s.status!=='cancelled').sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5);
  const past5=allSessions.filter(s=>s.date<today||s.status==='completed').sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  const practiceSongs=allSongs.filter(s=>['practicing','ready'].includes(s.status));

  const bestLabel=best?(()=>{const[d,h]=best[0].split('_');return `${DAYS_DE[+d]}, ${hlbl(+h)} — ${best[1]}/${members.length} verfügbar`;})():null;

  // Week label
  const weekLabel=weekOff===0?'Diese Woche':weekOff===-1?'Letzte Woche':weekOff===1?'Nächste Woche':(weekOff<0?`Vor ${-weekOff} Wochen`:`In ${weekOff} Wochen`);

  return <div style={{padding:'16px 16px 90px'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
      <div style={{fontSize:17,fontWeight:800}}>📅 Probeplan</div>
      <div style={{display:'flex',gap:5}}>
        <PillBtn active={view==='avail'} onClick={()=>setView('avail')}>Verfügbarkeit</PillBtn>
        <PillBtn active={view==='proben'} onClick={()=>setView('proben')}>Proben</PillBtn>
        <PillBtn active={view==='create'} onClick={()=>setView('create')}>+ Neu</PillBtn>
      </div>
    </div>

    {view==='avail'&&<>
      {bestLabel&&<Card glow style={{marginBottom:12,background:'rgba(124,58,237,.07)'}}>
        <div style={{fontSize:10,fontWeight:700,color:'var(--purple)',letterSpacing:.5,marginBottom:2}}>⚡ OPTIMALE PROBEZEIT</div>
        <div style={{fontSize:14,fontWeight:800}}>{bestLabel}</div>
      </Card>}
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
        <button onClick={()=>setWeekOff(w=>w-1)} style={{padding:'6px 12px',borderRadius:'var(--r-sm)',border:'1px solid var(--border2)',background:'var(--surf)',color:'var(--text)',cursor:'pointer'}}>‹</button>
        <div style={{flex:1,textAlign:'center'}}>
          <div style={{fontSize:12,fontWeight:700}}>{weekLabel}</div>
          <div style={{fontSize:10,color:'var(--t3)'}}>{weekDays[0].toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})} – {weekDays[6].toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'})}</div>
        </div>
        <button onClick={()=>setWeekOff(w=>w+1)} style={{padding:'6px 12px',borderRadius:'var(--r-sm)',border:'1px solid var(--border2)',background:'var(--surf)',color:'var(--text)',cursor:'pointer'}}>›</button>
      </div>
      <div style={{overflowX:'auto',userSelect:'none',marginBottom:16}}>
        <div style={{minWidth:480}}>
          <div style={{display:'grid',gridTemplateColumns:`44px repeat(7,1fr)`,gap:2,marginBottom:3}}>
            <div/>
            {weekDays.map((d,i)=>{
              const isT=toKey(d)===nowKey();
              return <div key={i} style={{textAlign:'center',padding:'2px 0'}}>
                <div style={{fontSize:9,fontWeight:700,color:isT?'var(--purple)':'var(--t2)'}}>{DAYS_DE[i]}</div>
                <div style={{fontSize:10,fontWeight:isT?800:400,color:isT?'var(--purple)':'var(--t3)'}}>{d.getDate()}.{String(d.getMonth()+1).padStart(2,'0')}</div>
              </div>;
            })}
          </div>
          {HOURS.map(h=><div key={h} style={{display:'grid',gridTemplateColumns:`44px repeat(7,1fr)`,gap:2,marginBottom:2}}>
            <div style={{fontSize:8,color:'var(--t3)',display:'flex',alignItems:'center',justifyContent:'flex-end',paddingRight:4}}>{hlbl(h)}</div>
            {weekDays.map((_,d)=>{
              const k=slotKey(d,h),mine=!!myAvail[k],cnt=counts[k]||0,int=cnt/maxCount;
              return <div key={d} onMouseDown={()=>handleMD(d,h)} onMouseEnter={()=>handleME(d,h)} onTouchStart={()=>handleMD(d,h)}
                style={{height:24,borderRadius:'var(--r-sm)',border:`1px solid ${mine?'var(--green)':cnt>0?'rgba(124,58,237,.5)':'var(--border)'}`,background:mine?'rgba(16,185,129,.5)':cnt>0?`rgba(124,58,237,${int*.5})`:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {cnt>0&&<span style={{fontSize:8,fontWeight:700,color:mine?'#fff':'var(--purple)',opacity:.9}}>{cnt}</span>}
              </div>;
            })}
          </div>)}
        </div>
      </div>
    </>}

    {view==='proben'&&<>
      <div style={{fontSize:11,fontWeight:700,color:'var(--t2)',letterSpacing:.5,textTransform:'uppercase',marginBottom:10}}>Bevorstehende Proben</div>
      {!upcoming5.length&&<Empty icon="📅" title="Keine Proben geplant" sub="Unter + Neu erstellen"/>}
      {upcoming5.map(s=><SessionCard key={s.id} session={s} user={user} profile={profile} members={members} practiceSongs={practiceSongs} editId={editId} setEditId={setEditId} showCommentsId={showCommentsId} setShowCommentsId={setShowCommentsId} onUpdate={updateSess} onDelete={deleteSess}/>)}
      {past5.length>0&&<><div style={{fontSize:11,fontWeight:700,color:'var(--t2)',letterSpacing:.5,textTransform:'uppercase',margin:'16px 0 10px'}}>Vergangene Proben</div>
        {past5.map(s=><SessionCard key={s.id} session={s} user={user} profile={profile} members={members} practiceSongs={practiceSongs} editId={editId} setEditId={setEditId} showCommentsId={showCommentsId} setShowCommentsId={setShowCommentsId} onUpdate={updateSess} onDelete={deleteSess} past/>)}</>}
    </>}

    {view==='create'&&<Card>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <Fld label="Probenname"><Inp value={sf.title} onChange={e=>setSF(f=>({...f,title:e.target.value}))} placeholder="z.B. Probe vor dem Auftritt..."/></Fld>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <Fld label="Datum"><Inp type="date" value={sf.date} onChange={e=>setSF(f=>({...f,date:e.target.value}))}/></Fld>
          <Fld label="Uhrzeit"><Inp type="time" value={sf.time} onChange={e=>setSF(f=>({...f,time:e.target.value}))}/></Fld>
        </div>
        <Fld label="Ort">
          <Sel value={sf.location} onChange={e=>setSF(f=>({...f,location:e.target.value}))} options={[{value:'',label:'-- Ort auswählen --'},...locations.map(l=>({value:l.name,label:l.name})),{value:'Im Freien 🌿',label:'Im Freien 🌿 (Standard)'}]}/>
          <div style={{display:'flex',gap:6,marginTop:6}}><Inp value={newLoc} onChange={e=>setNewLoc(e.target.value)} placeholder="Neuen Ort hinzufügen..." style={{fontSize:11}}/><Btn onClick={addLoc} size="sm">+</Btn></div>
        </Fld>
        <Fld label="Verantwortlich"><Sel value={sf.leadId} onChange={e=>setSF(f=>({...f,leadId:e.target.value}))} options={[{value:'',label:'-- Später festlegen --'},...members.map(m=>({value:m.id,label:`${m.displayName} — ${m.role}`}))]}/></Fld>
        <Fld label={`Setliste (${sf.setlist.length} Songs)`}>
          {practiceSongs.length===0?<div style={{fontSize:11,color:'var(--t3)',padding:'6px 0'}}>Noch keine Songs. Songs-Tab öffnen.</div>:practiceSongs.map(s=>{const sel=sf.setlist.find(x=>x.songId===s.id);return <div key={s.id} onClick={()=>toggleSL(s)} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 9px',borderRadius:'var(--r-sm)',border:`1px solid ${sel?'var(--purple)':'var(--border)'}`,background:sel?'rgba(124,58,237,.1)':'transparent',cursor:'pointer',marginBottom:4}}>
            <div style={{width:13,height:13,borderRadius:3,background:sel?'var(--purple)':'transparent',border:`2px solid ${sel?'var(--purple)':'var(--border2)'}`,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,color:'#fff'}}>{sel?'✓':''}</div>
            <span style={{fontSize:12,flex:1}}>{s.title} — <span style={{color:'var(--t2)'}}>{s.artist}</span></span>
            <Badge label={STATUS_MAP[s.status]?.label} color={STATUS_MAP[s.status]?.color} bg={STATUS_MAP[s.status]?.bg}/>
          </div>;})}
        </Fld>
        <Fld label="Notizen"><Txta value={sf.notes} onChange={e=>setSF(f=>({...f,notes:e.target.value}))} placeholder="Vorbereitung, Ausrüstung..." rows={2}/></Fld>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <Btn onClick={()=>setView('proben')} style={{color:'var(--t2)'}}>Abbrechen</Btn>
          <Btn onClick={createSess} disabled={!sf.date} style={{background:'linear-gradient(135deg,var(--purple),#5B21B6)',color:'#fff',border:'none'}}>Probe erstellen ✓</Btn>
        </div>
      </div>
    </Card>}
  </div>;
}

function SessionCard({session:s,user,profile,members,practiceSongs,editId,setEditId,showCommentsId,setShowCommentsId,onUpdate,onDelete,past}){
  const[ef,setEF]=useState({title:s.title||'',date:s.date||'',time:s.time||'',location:s.location||'',leadId:s.leadId||'',notes:s.notes||''});
  const isEdit=editId===s.id, showC=showCommentsId===s.id;
  const att=s.attendance||{}, confirmed=Object.values(att).filter(v=>v.status==='confirmed').length;
  return <div style={{marginBottom:10,opacity:past?.7:1}}>
    <Card style={{borderColor:isEdit?'var(--border2)':undefined}}>
      {isEdit?<div style={{display:'flex',flexDirection:'column',gap:10}}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:8}}>
          <Fld label="Name"><Inp value={ef.title} onChange={e=>setEF(f=>({...f,title:e.target.value}))}/></Fld>
          <Fld label="Datum"><Inp type="date" value={ef.date} onChange={e=>setEF(f=>({...f,date:e.target.value}))}/></Fld>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <Fld label="Uhrzeit"><Inp type="time" value={ef.time} onChange={e=>setEF(f=>({...f,time:e.target.value}))}/></Fld>
          <Fld label="Ort"><Inp value={ef.location} onChange={e=>setEF(f=>({...f,location:e.target.value}))}/></Fld>
        </div>
        <Fld label="Verantwortlich"><Sel value={ef.leadId} onChange={e=>setEF(f=>({...f,leadId:e.target.value}))} options={[{value:'',label:'-- Wählen --'},...members.map(m=>({value:m.id,label:m.displayName}))]}/></Fld>
        <Fld label="Notizen"><Txta value={ef.notes} onChange={e=>setEF(f=>({...f,notes:e.target.value}))} rows={2}/></Fld>
        <div style={{display:'flex',gap:7,justifyContent:'flex-end'}}>
          <Btn onClick={()=>setEditId(null)} size="sm">Abbrechen</Btn>
          <Btn onClick={()=>onUpdate(s.id,{...ef,leadName:members.find(m=>m.id===ef.leadId)?.displayName||''})} size="sm" style={{background:'var(--green)',color:'#fff',border:'none'}}>Speichern</Btn>
          <Btn onClick={()=>onDelete(s.id)} size="sm" style={{background:'rgba(239,68,68,.15)',color:'var(--red)',border:'1px solid rgba(239,68,68,.3)'}}>Löschen</Btn>
        </div>
      </div>:<>
        <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:3}}>{s.title||'Probe'}</div>
            <div style={{fontSize:11,color:'var(--t2)'}}>📅 {dfmt(s.date)}{s.time&&` · ⏰ ${s.time}`}{s.location&&` · 📍 ${s.location}`}</div>
            {s.leadName&&<div style={{fontSize:11,color:'var(--gold)',marginTop:2}}>⭐ {s.leadName}</div>}
            {confirmed>0&&<div style={{fontSize:10,color:'var(--green)',marginTop:2}}>✓ {confirmed} Zusagen</div>}
          </div>
          {!past&&<div style={{display:'flex',gap:5,flexShrink:0}}>
            <button onClick={()=>setEditId(isEdit?null:s.id)} style={{background:'none',border:'none',color:'var(--t2)',cursor:'pointer',fontSize:15,padding:'2px 5px'}} title="Bearbeiten">✏️</button>
            <button onClick={()=>setShowCommentsId(showC?null:s.id)} style={{background:'none',border:'none',color:showC?'var(--purple)':'var(--t2)',cursor:'pointer',fontSize:15,padding:'2px 5px'}} title="Kommentare">💬</button>
          </div>}
        </div>
        {s.setlist?.length>0&&<div style={{marginTop:8,paddingTop:8,borderTop:'1px solid var(--border)'}}>
          <div style={{fontSize:10,color:'var(--t3)',marginBottom:4}}>Setliste ({s.setlist.length})</div>
          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
            {s.setlist.map((sg,i)=><Badge key={i} label={sg.title} color='var(--t2)' bg='var(--surf3)'/>)}
          </div>
        </div>}
        {showC&&<div style={{marginTop:10,paddingTop:10,borderTop:'1px solid var(--border)'}}>
          <CommentsThread collection="sessionComments" docId={s.id} user={user} profile={profile} members={members}/>
        </div>}
      </>}
    </Card>
  </div>;
}

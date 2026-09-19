// ════════════════════════════════════════════════════
//  SONGS PAGE — Repertoire samt Ideen
//
//  Ideen sind keine eigene Seite mehr: sie liegen in
//  derselben Collection (`status === 'suggested'`) und
//  stehen hier als eigener Abschnitt bzw. Filter.
//  Ein Tippen oeffnet das Blatt (js/pages/songdetail.js).
// ════════════════════════════════════════════════════
function SongsPage({user,profile,allSongs,members,onOpen}){
  const[filter,setFilter]=useState('all');
  const[q,setQ]=useState('');
  const[addForm,setAddForm]=useState(false);
  const[nf,setNF]=useState({title:'',artist:'',genre:'',status:'practicing',key:'',youtubeLink:'',spotifyLink:''});
  const[groupByArtist,setGroupByArtist]=useState(false);
  const[moving,setMoving]=useState(null);

  const practiceSongs = allSongs.filter(s=>s.status!=='suggested');
  const ideas = allSongs.filter(s=>s.status==='suggested')
                        .sort((a,b)=>(b.votes?.length||0)-(a.votes?.length||0));

  const needle=q.trim().toLowerCase();
  const match = s => !needle || `${s.title||''} ${s.artist||''} ${s.genre||''}`.toLowerCase().includes(needle);

  // Was die Liste zeigt: 'all' bringt beide Welten, sonst genau einen Status.
  const shownPractice = (filter==='all'?practiceSongs:filter==='suggested'?[]:practiceSongs.filter(s=>s.status===filter)).filter(match);
  const shownIdeas    = (filter==='all'||filter==='suggested'?ideas:[]).filter(match);
  const nothing = !shownPractice.length && !shownIdeas.length;

  const addSong=async()=>{
    if(!nf.title||!nf.artist)return;
    const idea = nf.status==='suggested';
    await db.collection('songs').add({...nf,
      suggestedBy:user.uid, suggestedByName:profile.displayName,
      votes: idea?[user.uid]:[],            // wer vorschlaegt, ist dafuer
      roleAssignments:[], lyricNotes:[], structureNotes:'', sheet:'',
      createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    setNF({title:'',artist:'',genre:'',status:'practicing',key:'',youtubeLink:'',spotifyLink:''});
    setAddForm(false);
    if(idea) setFilter('suggested');
  };
  const vote=async song=>{
    const v=song.votes?.includes(user.uid);
    await db.collection('songs').doc(song.id).update({votes:v
      ?firebase.firestore.FieldValue.arrayRemove(user.uid)
      :firebase.firestore.FieldValue.arrayUnion(user.uid)});
  };
  const promote=async song=>{
    setMoving(song.id);
    await db.collection('songs').doc(song.id).update({status:'practicing',movedAt:firebase.firestore.FieldValue.serverTimestamp()});
    setMoving(null);
  };

  const groupsOf=list=>{const g={};list.forEach(s=>{if(!g[s.artist])g[s.artist]=[];g[s.artist].push(s);});return g;};

  // ── Zeile im Repertoire ─────────────────────────
  const renderSong=song=>{
    const sm=STATUS_MAP[song.status]||STATUS_MAP.practicing;
    const mr=(song.roleAssignments||[]).find(r=>r.userId===user.uid);
    const hasSheet=!!(song.sheet||'').trim();
    return <button key={song.id} onClick={()=>onOpen(song.id)}
      className="w-full text-left flex items-center gap-3 px-4 md:px-8 py-3 border-b border-line cursor-pointer hover:bg-surf transition-colors duration-100">
      <div className="w-[3px] self-stretch min-h-[30px] shrink-0" style={{background:sm.bar}}/>
      <div className="flex-1 min-w-0">
        <div className="font-display font-semibold text-[15px] tracking-[-.01em] truncate">{song.title}</div>
        <div className="text-[11.5px] text-ink-2 mt-0.5 truncate">{song.artist}{song.genre&&` · ${song.genre}`}</div>
        {mr&&<div className="text-[11px] text-accent font-semibold mt-1">Deine Rolle: {mr.songRole}</div>}
      </div>
      <span className="lab hidden sm:block shrink-0" style={{color:sm.color}}>{sm.label}</span>
      {song.key&&<span className="num text-[11px] text-accent shrink-0">{song.key}</span>}
      {hasSheet
        ? <Ic name="list" size={15} color="var(--t3)"/>
        : <span className="lab shrink-0" style={{color:'var(--idle)'}}>Kein Text</span>}
    </button>;
  };

  // ── Zeile einer Idee: Stimmen + Übernehmen ──────
  const renderIdea=song=>{
    const voted=song.votes?.includes(user.uid), vc=song.votes?.length||0;
    const stop=(e,fn)=>{e.stopPropagation();fn();};
    return <div key={song.id} onClick={()=>onOpen(song.id)}
      className="flex items-center gap-3 px-4 md:px-8 py-3 border-b border-line cursor-pointer hover:bg-surf transition-colors duration-100">
      <div className="w-[3px] self-stretch min-h-[30px] shrink-0" style={{background:'var(--idle)'}}/>
      <div className="flex-1 min-w-0">
        <div className="font-display font-semibold text-[15px] tracking-[-.01em] truncate" style={{color:'var(--t2)'}}>{song.title}</div>
        <div className="text-[11.5px] text-ink-2 mt-0.5 truncate">
          {song.artist}{song.genre&&` · ${song.genre}`}
          {song.suggestedByName&&<span className="text-ink-3"> · von {song.suggestedByName}</span>}
        </div>
      </div>
      <button onClick={e=>stop(e,()=>vote(song))} title={voted?'Stimme zurückziehen':'Dafür stimmen'}
        className="flex items-center gap-2 h-9 px-2.5 border cursor-pointer shrink-0 transition-colors duration-100"
        style={{borderColor:voted?'var(--accent)':'var(--border2)',background:voted?'var(--accent-tint)':'transparent'}}>
        <Ic name="star" size={12} fill={voted} sw={1.6} color={voted?'var(--accent)':'var(--t2)'}/>
        <span className="num text-[12px]" style={{color:voted?'var(--accent)':'var(--t2)'}}>{vc}</span>
      </button>
      <Btn onClick={e=>stop(e,()=>promote(song))} disabled={moving===song.id} size="sm" style={{flexShrink:0}}>
        {moving===song.id?'…':'→ Üben'}
      </Btn>
    </div>;
  };

  const cnt=k=>practiceSongs.filter(s=>s.status===k).length;

  return <div>
    <PageHead title="Repertoire" count={practiceSongs.length}>
      <Btn onClick={()=>setGroupByArtist(v=>!v)} size="sm" variant={groupByArtist?'default':'quiet'}>Nach Künstler</Btn>
      <Btn onClick={()=>setAddForm(v=>!v)} size="sm" variant={addForm?'default':'accent'}>
        {addForm?<><Ic name="x" size={13} sw={2}/> Schließen</>:<><Ic name="plus" size={13} sw={2.2}/> Song</>}
      </Btn>
    </PageHead>

    <div className="px-4 md:px-8 pb-4">
      <div className="flex items-center gap-2.5 h-11 px-3 border border-line-2 max-w-[520px] focus-within:border-accent transition-colors duration-100">
        <Ic name="search" size={16} sw={1.8} color="var(--t3)"/>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Titel, Künstler, Genre …"
          className="flex-1 min-w-0 bg-transparent outline-none text-[13px] text-ink placeholder:text-ink-3"/>
        {q&&<button onClick={()=>setQ('')} className="cursor-pointer text-ink-3 hover:text-ink"><Ic name="x" size={14} sw={2}/></button>}
      </div>
    </div>

    {addForm&&<div className="px-4 md:px-8 pb-5 fade">
      <div className="p-4 rail-a max-w-[720px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Fld label="Songname *"><Inp value={nf.title} onChange={e=>setNF(p=>({...p,title:e.target.value}))} placeholder="Songname …"/></Fld>
          <Fld label="Künstler *"><Inp value={nf.artist} onChange={e=>setNF(p=>({...p,artist:e.target.value}))} placeholder="Künstler/Band …"/></Fld>
          <Fld label="Genre"><Sel value={nf.genre} onChange={e=>setNF(p=>({...p,genre:e.target.value}))} options={[{value:'',label:'Genre …'},...GENRES]}/></Fld>
          <Fld label="Status" hint={nf.status==='suggested'?'Landet bei den Ideen — die Band stimmt ab.':null}>
            <Sel value={nf.status} onChange={e=>setNF(p=>({...p,status:e.target.value}))}
              options={Object.entries(STATUS_MAP).map(([k,v])=>({value:k,label:v.label}))}/></Fld>
          <Fld label="Tonart" hint="Text und Akkorde kommen später im Blatt dazu.">
            <Inp value={nf.key} onChange={e=>setNF(p=>({...p,key:e.target.value}))} placeholder="G"/></Fld>
          <Fld label="YouTube-Link"><Inp value={nf.youtubeLink} onChange={e=>setNF(p=>({...p,youtubeLink:e.target.value}))} placeholder="https://youtube.com/…"/></Fld>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <Btn onClick={()=>setAddForm(false)} variant="quiet">Abbrechen</Btn>
          <Btn onClick={addSong} disabled={!nf.title||!nf.artist} variant="accent">Hinzufügen</Btn>
        </div>
      </div>
    </div>}

    <div className="flex gap-1 px-4 md:px-8 border-b border-line-2 overflow-x-auto">
      <PillBtn active={filter==='all'} onClick={()=>setFilter('all')}>Alle {practiceSongs.length+ideas.length}</PillBtn>
      {Object.entries(STATUS_MAP).filter(([k])=>k!=='suggested').map(([k,v])=>
        <PillBtn key={k} active={filter===k} onClick={()=>setFilter(k)} color={v.color}>{v.label} {cnt(k)}</PillBtn>)}
      <PillBtn active={filter==='suggested'} onClick={()=>setFilter('suggested')} color={STATUS_MAP.suggested.color}>
        Ideen {ideas.length}
      </PillBtn>
    </div>

    {nothing&&<div className="px-4 md:px-8 py-8">
      <Empty title={needle?'Kein Treffer':'Noch nichts da'}
        sub={needle?`Nichts passt zu „${q}“.`:'Song anlegen oder eine Idee einreichen — beides über „+ Song“.'}/>
    </div>}

    {groupByArtist
      ? Object.entries(groupsOf(shownPractice)).sort(([a],[b])=>a.localeCompare(b)).map(([artist,songs])=>
          <div key={artist}>
            <div className="px-4 md:px-8 pt-5 pb-2 lab text-ink-3">{artist} · {songs.length}</div>
            {songs.map(renderSong)}
          </div>)
      : shownPractice.map(renderSong)}

    {shownIdeas.length>0&&<>
      <div className="px-4 md:px-8 pt-6 pb-2 flex items-baseline gap-2.5">
        <span className="lab text-ink-3">Ideen · zur Abstimmung</span>
        <div className="grow h-px bg-line-2"/>
        <span className="num text-[11px] text-ink-3">{shownIdeas.length}</span>
      </div>
      {shownIdeas.map(renderIdea)}
    </>}

    <div className="flex gap-x-5 gap-y-2 flex-wrap px-4 md:px-8 py-5">
      {Object.entries(STATUS_MAP).map(([k,v])=>
        <div key={k} className="flex items-center gap-2">
          <div className="w-[3px] h-3" style={{background:v.bar}}/>
          <span className="text-[10.5px] text-ink-3">{v.label}</span>
        </div>)}
    </div>
  </div>;
}

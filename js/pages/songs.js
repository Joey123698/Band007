// ════════════════════════════════════════════════════
//  SONGS PAGE
// ════════════════════════════════════════════════════
function SongsPage({user,profile,allSongs,members}){
  const[filter,setFilter]=useState('all');
  const[exp,setExp]=useState(null);
  const[addForm,setAddForm]=useState(false);
  const[nf,setNF]=useState({title:'',artist:'',genre:'',status:'practicing',youtubeLink:'',spotifyLink:''});
  const[editSongId,setEditSongId]=useState(null);
  const[editSF,setEditSF]=useState({});
  const[playingId,setPlayingId]=useState(null);
  const[editNotes,setEditNotes]=useState({});
  const[addRole,setAddRole]=useState({});
  const[groupByArtist,setGroupByArtist]=useState(false);

  const practiceSongs=allSongs.filter(s=>s.status!=='suggested');
  const filtered=filter==='all'?practiceSongs:practiceSongs.filter(s=>s.status===filter);

  const addSong=async()=>{if(!nf.title||!nf.artist)return;await db.collection('songs').add({...nf,suggestedBy:user.uid,suggestedByName:profile.displayName,votes:[],roleAssignments:[],structureNotes:'',createdAt:firebase.firestore.FieldValue.serverTimestamp()});setNF({title:'',artist:'',genre:'',status:'practicing',youtubeLink:'',spotifyLink:''});setAddForm(false);};
  const updateSong=async id=>{await db.collection('songs').doc(id).update(editSF);setEditSongId(null);};
  const startEdit=song=>{setEditSF({title:song.title||'',artist:song.artist||'',genre:song.genre||'',status:song.status||'practicing',youtubeLink:song.youtubeLink||'',spotifyLink:song.spotifyLink||''});setEditSongId(song.id);};
  const updStatus=async(id,status)=>db.collection('songs').doc(id).update({status});
  const saveNotes=async id=>db.collection('songs').doc(id).update({structureNotes:editNotes[id]||''});
  const addMyRole=async(songId,song)=>{const r=addRole[songId];if(!r?.songRole)return;const ex=song.roleAssignments||[];if(ex.find(x=>x.userId===user.uid))return;await db.collection('songs').doc(songId).update({roleAssignments:[...ex,{userId:user.uid,userName:profile.displayName,userBandRole:profile.role,songRole:r.songRole}]});setAddRole(p=>({...p,[songId]:{}}));};
  const removeMyRole=async(songId,song)=>db.collection('songs').doc(songId).update({roleAssignments:(song.roleAssignments||[]).filter(x=>x.userId!==user.uid)});
  const delSong=async id=>{if(window.confirm('Song löschen?'))await db.collection('songs').doc(id).delete();};

  // Artist groups
  const artistGroups=useMemo(()=>{const g={};filtered.forEach(s=>{if(!g[s.artist])g[s.artist]=[];g[s.artist].push(s);});return g;},[filtered]);

  const renderSong=(song)=>{
    const isOpen=exp===song.id,sm=STATUS_MAP[song.status],mr=(song.roleAssignments||[]).find(r=>r.userId===user.uid),isEdit=editSongId===song.id,ytId=extractYTId(song.youtubeLink);
    return <div key={song.id} className="mb-2">
      <Card style={{borderColor:isOpen?'var(--border2)':undefined}}>
        <div onClick={()=>setExp(isOpen?null:song.id)} className="flex gap-[9px] items-center cursor-pointer">
          <div className="flex-1">
            <div className="flex gap-1.5 items-center flex-wrap mb-[3px]">
              <span className="font-bold text-[13px]">{song.title}</span>
              <Badge label={sm?.label} color={sm?.color} bg={sm?.bg}/>
            </div>
            <div className="text-[11px] text-ink-2">{song.artist}{song.genre&&` · ${song.genre}`}</div>
            {mr&&<div className="text-[10px] text-brand-cyan mt-px">Meine Rolle: {mr.songRole}</div>}
          </div>
          {ytId&&<button onClick={e=>{e.stopPropagation();setPlayingId(playingId===song.id?null:song.id);}}
            className="border rounded-pill text-brand-red px-[9px] py-1 text-[11px] font-bold cursor-pointer shrink-0 flex items-center gap-[3px]"
            style={{background:playingId===song.id?'rgba(239,68,68,.25)':'rgba(239,68,68,.12)',borderColor:'rgba(239,68,68,.4)'}}>▶</button>}
          <span className="text-[10px] text-ink-3 shrink-0">{isOpen?'▲':'▼'}</span>
        </div>
        {ytId&&playingId===song.id&&<div className="mt-2 rounded-theme-sm overflow-hidden bg-black relative">
          <button onClick={()=>setPlayingId(null)} className="absolute top-1.5 right-1.5 z-10 border-none text-white rounded-[50%] w-6 h-6 cursor-pointer text-[13px] flex items-center justify-center leading-none" style={{background:'rgba(0,0,0,.7)'}}>×</button>
          <iframe width="100%" height="210" src={`https://www.youtube.com/embed/${ytId}?autoplay=1`} title={song.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="block"/>
        </div>}
        {isOpen&&<div className="border-t border-line mt-2.5 pt-2.5 flex flex-col gap-3">
          <div>
            <div className="text-[10px] font-bold text-ink-2 tracking-[.5px] mb-1.5">STATUS</div>
            <div className="flex gap-1 flex-wrap">
              {Object.entries(STATUS_MAP).filter(([k])=>k!=='suggested').map(([k,v])=><button key={k} onClick={()=>updStatus(song.id,k)}
                className="px-[9px] py-1 rounded-theme-sm border text-[11px] font-semibold cursor-pointer"
                style={{borderColor:song.status===k?v.color:'var(--border)',background:song.status===k?v.bg:'transparent',color:song.status===k?v.color:'var(--t3)'}}>{v.label}</button>)}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-ink-2 tracking-[.5px] mb-[5px]">STRUKTURNOTIZEN</div>
            <Txta value={editNotes[song.id]??song.structureNotes??''} onChange={e=>setEditNotes(p=>({...p,[song.id]:e.target.value}))} placeholder="Intro, Outro, Tonart, Übergänge..." rows={2}/>
            <Btn onClick={()=>saveNotes(song.id)} size="sm" style={{marginTop:5}}>Speichern</Btn>
          </div>
          <div>
            <div className="text-[10px] font-bold text-ink-2 tracking-[.5px] mb-1.5">ROLLENVERTEILUNG</div>
            {(song.roleAssignments||[]).map((r,i)=><div key={i} className="flex items-center gap-[7px] py-1 border-b border-line">
              <Av emoji={members.find(m=>m.id===r.userId)?.avatar} size={22}/>
              <span className="text-[11px] flex-1">{r.userName}</span>
              <Badge label={r.userBandRole} color={ROLE_COLORS[r.userBandRole]} bg='var(--surf3)'/>
              <Badge label={r.songRole} color='var(--cyan)' bg='rgba(6,182,212,.1)'/>
              {r.userId===user.uid&&<button onClick={()=>removeMyRole(song.id,song)} className="bg-transparent border-none text-ink-3 cursor-pointer text-[13px]">×</button>}
            </div>)}
            {!mr&&<div className="flex gap-[5px] mt-1.5">
              <Sel value={addRole[song.id]?.songRole||''} onChange={e=>setAddRole(p=>({...p,[song.id]:{songRole:e.target.value}}))} options={[{value:'',label:'Meine Rolle...'},...SONG_ROLES]} style={{flex:1,fontSize:11}}/>
              <Btn onClick={()=>addMyRole(song.id,song)} size="sm" style={{background:'var(--purple)',color:'#fff',border:'none'}}>+</Btn>
            </div>}
          </div>
          <div>
            <div className="text-[10px] font-bold text-ink-2 tracking-[.5px] mb-1.5">KOMMENTARE</div>
            <CommentsThread collection="comments" docId={song.id} user={user} profile={profile} members={members}/>
          </div>
          {/* LINKS */}
          {(song.youtubeLink||song.spotifyLink)&&<div className="flex gap-1.5 flex-wrap">
            {song.youtubeLink&&<a href={song.youtubeLink} target="_blank" rel="noopener noreferrer" className="text-[11px] px-2.5 py-1 rounded-pill text-brand-red no-underline" style={{background:'rgba(239,68,68,.15)'}}>▶ YouTube</a>}
            {song.spotifyLink&&<a href={song.spotifyLink} target="_blank" rel="noopener noreferrer" className="text-[11px] px-2.5 py-1 rounded-pill text-brand-green no-underline" style={{background:'rgba(16,185,129,.15)'}}>♫ Spotify</a>}
          </div>}
          {/* EDIT FORM */}
          {isEdit&&<div className="bg-surf-2 rounded-theme-sm p-3 flex flex-col gap-2.5 border border-brand-gold">
            <div className="text-[10px] font-bold text-brand-gold tracking-[.5px]">✏️ SONG BEARBEITEN</div>
            <div className="grid grid-cols-2 gap-2">
              <Fld label="Songname"><Inp value={editSF.title} onChange={e=>setEditSF(p=>({...p,title:e.target.value}))}/></Fld>
              <Fld label="Künstler"><Inp value={editSF.artist} onChange={e=>setEditSF(p=>({...p,artist:e.target.value}))}/></Fld>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Fld label="Genre"><Sel value={editSF.genre} onChange={e=>setEditSF(p=>({...p,genre:e.target.value}))} options={[{value:'',label:'Genre...'},...GENRES]}/></Fld>
              <Fld label="Status"><Sel value={editSF.status} onChange={e=>setEditSF(p=>({...p,status:e.target.value}))} options={Object.entries(STATUS_MAP).filter(([k])=>k!=='suggested').map(([k,v])=>({value:k,label:v.label}))}/></Fld>
            </div>
            <Fld label="YouTube-Link"><Inp value={editSF.youtubeLink} onChange={e=>setEditSF(p=>({...p,youtubeLink:e.target.value}))} placeholder="https://youtube.com/..."/></Fld>
            <Fld label="Spotify-Link"><Inp value={editSF.spotifyLink} onChange={e=>setEditSF(p=>({...p,spotifyLink:e.target.value}))} placeholder="https://open.spotify.com/..."/></Fld>
            <div className="flex gap-[7px] justify-end">
              <Btn onClick={()=>setEditSongId(null)} style={{color:'var(--t2)'}}>Abbrechen</Btn>
              <Btn onClick={()=>updateSong(song.id)} style={{background:'var(--green)',color:'#fff',border:'none'}}>Speichern ✓</Btn>
            </div>
          </div>}
          <div className="flex gap-[7px] pt-1.5 border-t border-line">
            <Btn onClick={()=>{startEdit(song);}} size="sm" style={{background:'rgba(245,158,11,.12)',color:'var(--gold)',border:'1px solid rgba(245,158,11,.3)'}}>✏️ Bearbeiten</Btn>
            <Btn onClick={()=>delSong(song.id)} size="sm" style={{background:'rgba(239,68,68,.1)',color:'var(--red)',border:'1px solid rgba(239,68,68,.3)'}}>🗑 Entfernen</Btn>
          </div>
        </div>}
      </Card>
    </div>;
  };

  return <div className="px-4 pt-4 pb-[90px]">
    <div className="flex justify-between items-center mb-3">
      <div className="text-[17px] font-extrabold">🎵 Songs in Übung</div>
      <div className="flex gap-[5px]">
        <Btn onClick={()=>setGroupByArtist(v=>!v)} size="sm" style={{background:groupByArtist?'var(--surf3)':'transparent',color:'var(--t2)'}}>Nach Künstler</Btn>
        <Btn onClick={()=>setAddForm(v=>!v)} size="sm" style={{background:addForm?'var(--surf3)':'var(--purple)',color:'#fff',border:'none'}}>{addForm?'×':'+ Song'}</Btn>
      </div>
    </div>
    {addForm&&<Card style={{marginBottom:14}}>
      <div className="flex flex-col gap-2.5">
        <div className="grid grid-cols-2 gap-2">
          <Fld label="Songname *"><Inp value={nf.title} onChange={e=>setNF(p=>({...p,title:e.target.value}))} placeholder="Songname..."/></Fld>
          <Fld label="Künstler *"><Inp value={nf.artist} onChange={e=>setNF(p=>({...p,artist:e.target.value}))} placeholder="Künstler/Band..."/></Fld>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Fld label="Genre"><Sel value={nf.genre} onChange={e=>setNF(p=>({...p,genre:e.target.value}))} options={[{value:'',label:'Genre...'},...GENRES]}/></Fld>
          <Fld label="Status"><Sel value={nf.status} onChange={e=>setNF(p=>({...p,status:e.target.value}))} options={Object.entries(STATUS_MAP).filter(([k])=>k!=='suggested').map(([k,v])=>({value:k,label:v.label}))}/></Fld>
        </div>
        <Fld label="YouTube-Link"><Inp value={nf.youtubeLink} onChange={e=>setNF(p=>({...p,youtubeLink:e.target.value}))} placeholder="https://youtube.com/..."/></Fld>
        <Fld label="Spotify-Link"><Inp value={nf.spotifyLink} onChange={e=>setNF(p=>({...p,spotifyLink:e.target.value}))} placeholder="https://open.spotify.com/..."/></Fld>
        <div className="flex gap-2 justify-end">
          <Btn onClick={()=>setAddForm(false)} style={{color:'var(--t2)'}}>Abbrechen</Btn>
          <Btn onClick={addSong} disabled={!nf.title||!nf.artist} style={{background:'var(--green)',color:'#fff',border:'none'}}>Hinzufügen ✓</Btn>
        </div>
      </div>
    </Card>}
    <div className="flex gap-[5px] mb-3 overflow-x-auto pb-0.5">
      <PillBtn active={filter==='all'} onClick={()=>setFilter('all')}>Alle ({practiceSongs.length})</PillBtn>
      {Object.entries(STATUS_MAP).filter(([k])=>k!=='suggested').map(([k,v])=><PillBtn key={k} active={filter===k} onClick={()=>setFilter(k)} color={v.color}>{v.label} ({practiceSongs.filter(s=>s.status===k).length})</PillBtn>)}
    </div>
    {!filtered.length&&<Empty icon="🎵" title="Keine Songs" sub="Song hinzufügen oder aus Vorschlägen übernehmen."/>}
    {groupByArtist
      ?Object.entries(artistGroups).sort(([a],[b])=>a.localeCompare(b)).map(([artist,songs])=><div key={artist}><div className="text-[11px] font-bold text-ink-2 tracking-[.5px] uppercase mt-2.5 mb-1.5">🎤 {artist} ({songs.length})</div>{songs.map(renderSong)}</div>)
      :filtered.map(renderSong)}
  </div>;
}

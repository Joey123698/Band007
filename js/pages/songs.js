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
    return <div key={song.id} style={{marginBottom:8}}>
      <Card style={{borderColor:isOpen?'var(--border2)':undefined}}>
        <div onClick={()=>setExp(isOpen?null:song.id)} style={{display:'flex',gap:9,alignItems:'center',cursor:'pointer'}}>
          <div style={{flex:1}}>
            <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',marginBottom:3}}>
              <span style={{fontWeight:700,fontSize:13}}>{song.title}</span>
              <Badge label={sm?.label} color={sm?.color} bg={sm?.bg}/>
            </div>
            <div style={{fontSize:11,color:'var(--t2)'}}>{song.artist}{song.genre&&` · ${song.genre}`}</div>
            {mr&&<div style={{fontSize:10,color:'var(--cyan)',marginTop:1}}>Meine Rolle: {mr.songRole}</div>}
          </div>
          {ytId&&<button onClick={e=>{e.stopPropagation();setPlayingId(playingId===song.id?null:song.id);}} style={{background:playingId===song.id?'rgba(239,68,68,.25)':'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.4)',borderRadius:'var(--r-pill)',color:'var(--red)',padding:'4px 9px',fontSize:11,fontWeight:700,cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',gap:3}}>▶</button>}
          <span style={{fontSize:10,color:'var(--t3)',flexShrink:0}}>{isOpen?'▲':'▼'}</span>
        </div>
        {ytId&&playingId===song.id&&<div style={{marginTop:8,borderRadius:'var(--r-sm)',overflow:'hidden',background:'#000',position:'relative'}}>
          <button onClick={()=>setPlayingId(null)} style={{position:'absolute',top:6,right:6,zIndex:10,background:'rgba(0,0,0,.7)',border:'none',color:'#fff',borderRadius:'50%',width:24,height:24,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>×</button>
          <iframe width="100%" height="210" src={`https://www.youtube.com/embed/${ytId}?autoplay=1`} title={song.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{display:'block'}}/>
        </div>}
        {isOpen&&<div style={{borderTop:'1px solid var(--border)',marginTop:10,paddingTop:10,display:'flex',flexDirection:'column',gap:12}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'var(--t2)',letterSpacing:.5,marginBottom:6}}>STATUS</div>
            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
              {Object.entries(STATUS_MAP).filter(([k])=>k!=='suggested').map(([k,v])=><button key={k} onClick={()=>updStatus(song.id,k)} style={{padding:'4px 9px',borderRadius:'var(--r-sm)',border:`1px solid ${song.status===k?v.color:'var(--border)'}`,background:song.status===k?v.bg:'transparent',color:song.status===k?v.color:'var(--t3)',fontSize:11,fontWeight:600,cursor:'pointer'}}>{v.label}</button>)}
            </div>
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'var(--t2)',letterSpacing:.5,marginBottom:5}}>STRUKTURNOTIZEN</div>
            <Txta value={editNotes[song.id]??song.structureNotes??''} onChange={e=>setEditNotes(p=>({...p,[song.id]:e.target.value}))} placeholder="Intro, Outro, Tonart, Übergänge..." rows={2}/>
            <Btn onClick={()=>saveNotes(song.id)} size="sm" style={{marginTop:5}}>Speichern</Btn>
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'var(--t2)',letterSpacing:.5,marginBottom:6}}>ROLLENVERTEILUNG</div>
            {(song.roleAssignments||[]).map((r,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:7,padding:'4px 0',borderBottom:'1px solid var(--border)'}}>
              <Av emoji={members.find(m=>m.id===r.userId)?.avatar} size={22}/>
              <span style={{fontSize:11,flex:1}}>{r.userName}</span>
              <Badge label={r.userBandRole} color={ROLE_COLORS[r.userBandRole]} bg='var(--surf3)'/>
              <Badge label={r.songRole} color='var(--cyan)' bg='rgba(6,182,212,.1)'/>
              {r.userId===user.uid&&<button onClick={()=>removeMyRole(song.id,song)} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:13}}>×</button>}
            </div>)}
            {!mr&&<div style={{display:'flex',gap:5,marginTop:6}}>
              <Sel value={addRole[song.id]?.songRole||''} onChange={e=>setAddRole(p=>({...p,[song.id]:{songRole:e.target.value}}))} options={[{value:'',label:'Meine Rolle...'},...SONG_ROLES]} style={{flex:1,fontSize:11}}/>
              <Btn onClick={()=>addMyRole(song.id,song)} size="sm" style={{background:'var(--purple)',color:'#fff',border:'none'}}>+</Btn>
            </div>}
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'var(--t2)',letterSpacing:.5,marginBottom:6}}>KOMMENTARE</div>
            <CommentsThread collection="comments" docId={song.id} user={user} profile={profile} members={members}/>
          </div>
          {/* LINKS */}
          {(song.youtubeLink||song.spotifyLink)&&<div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {song.youtubeLink&&<a href={song.youtubeLink} target="_blank" rel="noopener noreferrer" style={{fontSize:11,padding:'4px 10px',borderRadius:'var(--r-pill)',background:'rgba(239,68,68,.15)',color:'var(--red)',textDecoration:'none'}}>▶ YouTube</a>}
            {song.spotifyLink&&<a href={song.spotifyLink} target="_blank" rel="noopener noreferrer" style={{fontSize:11,padding:'4px 10px',borderRadius:'var(--r-pill)',background:'rgba(16,185,129,.15)',color:'var(--green)',textDecoration:'none'}}>♫ Spotify</a>}
          </div>}
          {/* EDIT FORM */}
          {isEdit&&<div style={{background:'var(--surf2)',borderRadius:'var(--r-sm)',padding:12,display:'flex',flexDirection:'column',gap:10,border:'1px solid var(--gold)'}}>
            <div style={{fontSize:10,fontWeight:700,color:'var(--gold)',letterSpacing:.5}}>✏️ SONG BEARBEITEN</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <Fld label="Songname"><Inp value={editSF.title} onChange={e=>setEditSF(p=>({...p,title:e.target.value}))}/></Fld>
              <Fld label="Künstler"><Inp value={editSF.artist} onChange={e=>setEditSF(p=>({...p,artist:e.target.value}))}/></Fld>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <Fld label="Genre"><Sel value={editSF.genre} onChange={e=>setEditSF(p=>({...p,genre:e.target.value}))} options={[{value:'',label:'Genre...'},...GENRES]}/></Fld>
              <Fld label="Status"><Sel value={editSF.status} onChange={e=>setEditSF(p=>({...p,status:e.target.value}))} options={Object.entries(STATUS_MAP).filter(([k])=>k!=='suggested').map(([k,v])=>({value:k,label:v.label}))}/></Fld>
            </div>
            <Fld label="YouTube-Link"><Inp value={editSF.youtubeLink} onChange={e=>setEditSF(p=>({...p,youtubeLink:e.target.value}))} placeholder="https://youtube.com/..."/></Fld>
            <Fld label="Spotify-Link"><Inp value={editSF.spotifyLink} onChange={e=>setEditSF(p=>({...p,spotifyLink:e.target.value}))} placeholder="https://open.spotify.com/..."/></Fld>
            <div style={{display:'flex',gap:7,justifyContent:'flex-end'}}>
              <Btn onClick={()=>setEditSongId(null)} style={{color:'var(--t2)'}}>Abbrechen</Btn>
              <Btn onClick={()=>updateSong(song.id)} style={{background:'var(--green)',color:'#fff',border:'none'}}>Speichern ✓</Btn>
            </div>
          </div>}
          <div style={{display:'flex',gap:7,paddingTop:6,borderTop:'1px solid var(--border)'}}>
            <Btn onClick={()=>{startEdit(song);}} size="sm" style={{background:'rgba(245,158,11,.12)',color:'var(--gold)',border:'1px solid rgba(245,158,11,.3)'}}>✏️ Bearbeiten</Btn>
            <Btn onClick={()=>delSong(song.id)} size="sm" style={{background:'rgba(239,68,68,.1)',color:'var(--red)',border:'1px solid rgba(239,68,68,.3)'}}>🗑 Entfernen</Btn>
          </div>
        </div>}
      </Card>
    </div>;
  };

  return <div style={{padding:'16px 16px 90px'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
      <div style={{fontSize:17,fontWeight:800}}>🎵 Songs in Übung</div>
      <div style={{display:'flex',gap:5}}>
        <Btn onClick={()=>setGroupByArtist(v=>!v)} size="sm" style={{background:groupByArtist?'var(--surf3)':'transparent',color:'var(--t2)'}}>Nach Künstler</Btn>
        <Btn onClick={()=>setAddForm(v=>!v)} size="sm" style={{background:addForm?'var(--surf3)':'var(--purple)',color:'#fff',border:'none'}}>{addForm?'×':'+ Song'}</Btn>
      </div>
    </div>
    {addForm&&<Card style={{marginBottom:14}}>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <Fld label="Songname *"><Inp value={nf.title} onChange={e=>setNF(p=>({...p,title:e.target.value}))} placeholder="Songname..."/></Fld>
          <Fld label="Künstler *"><Inp value={nf.artist} onChange={e=>setNF(p=>({...p,artist:e.target.value}))} placeholder="Künstler/Band..."/></Fld>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <Fld label="Genre"><Sel value={nf.genre} onChange={e=>setNF(p=>({...p,genre:e.target.value}))} options={[{value:'',label:'Genre...'},...GENRES]}/></Fld>
          <Fld label="Status"><Sel value={nf.status} onChange={e=>setNF(p=>({...p,status:e.target.value}))} options={Object.entries(STATUS_MAP).filter(([k])=>k!=='suggested').map(([k,v])=>({value:k,label:v.label}))}/></Fld>
        </div>
        <Fld label="YouTube-Link"><Inp value={nf.youtubeLink} onChange={e=>setNF(p=>({...p,youtubeLink:e.target.value}))} placeholder="https://youtube.com/..."/></Fld>
        <Fld label="Spotify-Link"><Inp value={nf.spotifyLink} onChange={e=>setNF(p=>({...p,spotifyLink:e.target.value}))} placeholder="https://open.spotify.com/..."/></Fld>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <Btn onClick={()=>setAddForm(false)} style={{color:'var(--t2)'}}>Abbrechen</Btn>
          <Btn onClick={addSong} disabled={!nf.title||!nf.artist} style={{background:'var(--green)',color:'#fff',border:'none'}}>Hinzufügen ✓</Btn>
        </div>
      </div>
    </Card>}
    <div style={{display:'flex',gap:5,marginBottom:12,overflowX:'auto',paddingBottom:2}}>
      <PillBtn active={filter==='all'} onClick={()=>setFilter('all')}>Alle ({practiceSongs.length})</PillBtn>
      {Object.entries(STATUS_MAP).filter(([k])=>k!=='suggested').map(([k,v])=><PillBtn key={k} active={filter===k} onClick={()=>setFilter(k)} color={v.color}>{v.label} ({practiceSongs.filter(s=>s.status===k).length})</PillBtn>)}
    </div>
    {!filtered.length&&<Empty icon="🎵" title="Keine Songs" sub="Song hinzufügen oder aus Vorschlägen übernehmen."/>}
    {groupByArtist
      ?Object.entries(artistGroups).sort(([a],[b])=>a.localeCompare(b)).map(([artist,songs])=><div key={artist}><div style={{fontSize:11,fontWeight:700,color:'var(--t2)',letterSpacing:.5,textTransform:'uppercase',margin:'10px 0 6px'}}>🎤 {artist} ({songs.length})</div>{songs.map(renderSong)}</div>)
      :filtered.map(renderSong)}
  </div>;
}

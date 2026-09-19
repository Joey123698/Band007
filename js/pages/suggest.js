// ════════════════════════════════════════════════════
//  SUGGEST PAGE (fixed)
// ════════════════════════════════════════════════════
function SuggestPage({user,profile,allSongs}){
  const[showForm,setShowForm]=useState(false);
  const[nf,setNF]=useState({title:'',artist:'',genre:'',youtubeLink:'',spotifyLink:''});
  const[saving,setSaving]=useState(false);
  const[moving,setMoving]=useState(null);
  const[groupBy,setGroupBy]=useState(false);
  const[playingId,setPlayingId]=useState(null);

  const suggested=allSongs.filter(s=>s.status==='suggested').sort((a,b)=>(b.votes?.length||0)-(a.votes?.length||0));

  const submit=async()=>{
    if(!nf.title||!nf.artist)return;
    setSaving(true);
    await db.collection('songs').add({...nf,status:'suggested',suggestedBy:user.uid,suggestedByName:profile.displayName,votes:[user.uid],roleAssignments:[],structureNotes:'',createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    setNF({title:'',artist:'',genre:'',youtubeLink:'',spotifyLink:''});setShowForm(false);setSaving(false);
  };
  const vote=async song=>{const v=song.votes?.includes(user.uid);await db.collection('songs').doc(song.id).update({votes:v?firebase.firestore.FieldValue.arrayRemove(user.uid):firebase.firestore.FieldValue.arrayUnion(user.uid)});};
  const move=async song=>{setMoving(song.id);await db.collection('songs').doc(song.id).update({status:'practicing',movedAt:firebase.firestore.FieldValue.serverTimestamp()});setMoving(null);};

  const artistGroups=useMemo(()=>{const g={};suggested.forEach(s=>{if(!g[s.artist])g[s.artist]=[];g[s.artist].push(s);});return g;},[suggested]);

  const renderSong=song=>{const voted=song.votes?.includes(user.uid),vc=song.votes?.length||0,ytId2=extractYTId(song.youtubeLink);
    return <Card key={song.id} style={{marginBottom:9}}>
      <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:13}}>{song.title}</div>
          <div style={{fontSize:11,color:'var(--t2)',marginTop:2}}>{song.artist}{song.genre&&` · ${song.genre}`}</div>
          <div style={{fontSize:10,color:'var(--t3)',marginTop:2}}>Vorgeschlagen von {song.suggestedByName}</div>
          <div style={{display:'flex',gap:5,marginTop:7,flexWrap:'wrap'}}>
            {ytId2&&<button onClick={()=>setPlayingId(playingId===song.id?null:song.id)} style={{fontSize:10,padding:'3px 9px',borderRadius:'var(--r-pill)',background:playingId===song.id?'rgba(239,68,68,.3)':'rgba(239,68,68,.15)',color:'var(--red)',border:'1px solid rgba(239,68,68,.3)',cursor:'pointer',fontWeight:700}}>▶ {playingId===song.id?'Schließen':'YouTube'}</button>}
            {song.spotifyLink&&<a href={song.spotifyLink} target="_blank" rel="noopener noreferrer" style={{fontSize:10,padding:'2px 8px',borderRadius:'var(--r-pill)',background:'rgba(16,185,129,.15)',color:'var(--green)',textDecoration:'none'}}>♫ Spotify</a>}
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:5,alignItems:'flex-end',flexShrink:0}}>
          <button onClick={()=>vote(song)} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 11px',borderRadius:'var(--r-sm)',border:`1px solid ${voted?'var(--gold)':'var(--border2)'}`,background:voted?'rgba(245,158,11,.15)':'transparent',color:voted?'var(--gold)':'var(--t2)',cursor:'pointer',fontWeight:700,fontSize:12}}>🔥 {vc}</button>
          <button onClick={()=>move(song)} disabled={moving===song.id} style={{padding:'6px 9px',borderRadius:'var(--r-sm)',border:'1px solid var(--green)',background:'rgba(16,185,129,.1)',color:'var(--green)',cursor:'pointer',fontWeight:700,fontSize:11,whiteSpace:'nowrap'}}>{moving===song.id?'...':'→ Üben'}</button>
        </div>
      </div>
      {ytId2&&playingId===song.id&&<div style={{marginTop:10,borderRadius:'var(--r-sm)',overflow:'hidden',background:'#000',position:'relative'}}>
        <button onClick={()=>setPlayingId(null)} style={{position:'absolute',top:6,right:6,zIndex:10,background:'rgba(0,0,0,.7)',border:'none',color:'#fff',borderRadius:'50%',width:22,height:22,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
        <iframe width="100%" height="200" src={`https://www.youtube.com/embed/${ytId2}?autoplay=1`} title={song.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{display:'block'}}/>
      </div>}
    </Card>;};

  return <div style={{padding:'16px 16px 90px'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
      <div style={{fontSize:17,fontWeight:800}}>💡 Vorschläge</div>
      <div style={{display:'flex',gap:5}}>
        <Btn onClick={()=>setGroupBy(v=>!v)} size="sm" style={{color:'var(--t2)',background:groupBy?'var(--surf3)':'transparent'}}>Nach Künstler</Btn>
        <Btn onClick={()=>setShowForm(v=>!v)} size="sm" style={{background:showForm?'var(--surf3)':'var(--purple)',color:'#fff',border:'none'}}>{showForm?'×':'+ Vorschlag'}</Btn>
      </div>
    </div>
    {showForm&&<Card style={{marginBottom:14}}>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <Fld label="Songname *"><Inp value={nf.title} onChange={e=>setNF(p=>({...p,title:e.target.value}))} placeholder="Songname..."/></Fld>
          <Fld label="Künstler *"><Inp value={nf.artist} onChange={e=>setNF(p=>({...p,artist:e.target.value}))} placeholder="Künstlername..."/></Fld>
        </div>
        <Fld label="Genre"><Sel value={nf.genre} onChange={e=>setNF(p=>({...p,genre:e.target.value}))} options={[{value:'',label:'Genre...'},...GENRES]}/></Fld>
        <Fld label="YouTube-Link"><Inp value={nf.youtubeLink} onChange={e=>setNF(p=>({...p,youtubeLink:e.target.value}))} placeholder="https://youtube.com/..."/></Fld>
        <Fld label="Spotify-Link"><Inp value={nf.spotifyLink} onChange={e=>setNF(p=>({...p,spotifyLink:e.target.value}))} placeholder="https://open.spotify.com/..."/></Fld>
        <Btn onClick={submit} disabled={saving||!nf.title||!nf.artist} style={{background:'linear-gradient(135deg,var(--purple),#5B21B6)',color:'#fff',border:'none'}}>{saving?'Wird gespeichert...':'Vorschlag einreichen'}</Btn>
      </div>
    </Card>}
    {!suggested.length&&<Empty icon="💡" title="Noch keine Vorschläge" sub="Sei der Erste!"/>}
    {groupBy?Object.entries(artistGroups).sort(([a],[b])=>a.localeCompare(b)).map(([artist,songs])=><div key={artist}><div style={{fontSize:11,fontWeight:700,color:'var(--t2)',letterSpacing:.5,textTransform:'uppercase',margin:'10px 0 6px'}}>🎤 {artist} ({songs.length})</div>{songs.map(renderSong)}</div>):suggested.map(renderSong)}
  </div>;
}

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
      <div className="flex gap-2.5 items-start">
        <div className="flex-1">
          <div className="font-bold text-[13px]">{song.title}</div>
          <div className="text-[11px] text-ink-2 mt-0.5">{song.artist}{song.genre&&` · ${song.genre}`}</div>
          <div className="text-[10px] text-ink-3 mt-0.5">Vorgeschlagen von {song.suggestedByName}</div>
          <div className="flex gap-[5px] mt-[7px] flex-wrap">
            {ytId2&&<button onClick={()=>setPlayingId(playingId===song.id?null:song.id)}
              className="text-[10px] px-[9px] py-[3px] rounded-pill text-brand-red border cursor-pointer font-bold"
              style={{background:playingId===song.id?'rgba(239,68,68,.3)':'rgba(239,68,68,.15)',borderColor:'rgba(239,68,68,.3)'}}>▶ {playingId===song.id?'Schließen':'YouTube'}</button>}
            {song.spotifyLink&&<a href={song.spotifyLink} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-0.5 rounded-pill text-brand-green no-underline" style={{background:'rgba(16,185,129,.15)'}}>♫ Spotify</a>}
          </div>
        </div>
        <div className="flex flex-col gap-[5px] items-end shrink-0">
          <button onClick={()=>vote(song)} className="flex items-center gap-1 px-[11px] py-1.5 rounded-theme-sm border cursor-pointer font-bold text-[12px]"
            style={{borderColor:voted?'var(--gold)':'var(--border2)',background:voted?'rgba(245,158,11,.15)':'transparent',color:voted?'var(--gold)':'var(--t2)'}}>🔥 {vc}</button>
          <button onClick={()=>move(song)} disabled={moving===song.id} className="px-[9px] py-1.5 rounded-theme-sm border border-brand-green text-brand-green cursor-pointer font-bold text-[11px] whitespace-nowrap"
            style={{background:'rgba(16,185,129,.1)'}}>{moving===song.id?'...':'→ Üben'}</button>
        </div>
      </div>
      {ytId2&&playingId===song.id&&<div className="mt-2.5 rounded-theme-sm overflow-hidden bg-black relative">
        <button onClick={()=>setPlayingId(null)} className="absolute top-1.5 right-1.5 z-10 border-none text-white rounded-[50%] w-[22px] h-[22px] cursor-pointer text-[12px] flex items-center justify-center" style={{background:'rgba(0,0,0,.7)'}}>×</button>
        <iframe width="100%" height="200" src={`https://www.youtube.com/embed/${ytId2}?autoplay=1`} title={song.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="block"/>
      </div>}
    </Card>;};

  return <div className="px-4 pt-4 pb-[90px]">
    <div className="flex justify-between items-center mb-3">
      <div className="text-[17px] font-extrabold">💡 Vorschläge</div>
      <div className="flex gap-[5px]">
        <Btn onClick={()=>setGroupBy(v=>!v)} size="sm" style={{color:'var(--t2)',background:groupBy?'var(--surf3)':'transparent'}}>Nach Künstler</Btn>
        <Btn onClick={()=>setShowForm(v=>!v)} size="sm" style={{background:showForm?'var(--surf3)':'var(--purple)',color:'#fff',border:'none'}}>{showForm?'×':'+ Vorschlag'}</Btn>
      </div>
    </div>
    {showForm&&<Card style={{marginBottom:14}}>
      <div className="flex flex-col gap-2.5">
        <div className="grid grid-cols-2 gap-2">
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
    {groupBy?Object.entries(artistGroups).sort(([a],[b])=>a.localeCompare(b)).map(([artist,songs])=><div key={artist}><div className="text-[11px] font-bold text-ink-2 tracking-[.5px] uppercase mt-2.5 mb-1.5">🎤 {artist} ({songs.length})</div>{songs.map(renderSong)}</div>):suggested.map(renderSong)}
  </div>;
}

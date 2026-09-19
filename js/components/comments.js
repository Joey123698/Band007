// ════════════════════════════════════════════════════
//  COMMENTS (reusable for sessions + songs)
// ════════════════════════════════════════════════════
function CommentsThread({collection,docId,user,profile,members}){
  const[comments,setComments]=useState([]);
  const[text,setText]=useState('');
  const[loading,setLoading]=useState(false);
  useEffect(()=>{
    // Single where clause — no composite index needed
    const u=db.collection(collection).where('docId','==',docId).onSnapshot(s=>{
      const c=s.docs.map(d=>({id:d.id,...d.data()}));
      c.sort((a,b)=>(a.createdAt?.seconds||0)-(b.createdAt?.seconds||0));
      setComments(c);
    });
    return u;
  },[docId]);
  const send=async()=>{
    if(!text.trim())return; setLoading(true);
    await db.collection(collection).add({docId,userId:user.uid,userName:profile.displayName,userBandRole:profile.role,avatar:profile.avatar||'🎵',text:text.trim(),createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    setText(''); setLoading(false);
  };
  const del=async id=>db.collection(collection).doc(id).delete();
  return <div>
    {comments.map(c=><div key={c.id} className="flex gap-2 mb-2 items-start">
      <Av emoji={c.avatar} size={26}/>
      <div className="flex-1">
        <div className="flex gap-1.5 items-center mb-[3px] flex-wrap">
          <span className="text-[11px] font-bold">{c.userName}</span>
          <Badge label={c.userBandRole} color={ROLE_COLORS[c.userBandRole]} bg='var(--surf3)'/>
        </div>
        <div className="text-[12px] text-ink-2 leading-[1.5] px-2.5 py-1.5 bg-base rounded-theme-sm border border-line">{c.text}</div>
      </div>
      {c.userId===user.uid&&<button onClick={()=>del(c.id)} className="bg-transparent border-none text-ink-3 cursor-pointer text-[13px] pt-1">×</button>}
    </div>)}
    <div className="flex gap-[7px] mt-1.5">
      <Inp value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),send())} placeholder="Kommentar..." style={{flex:1,fontSize:12}}/>
      <Btn onClick={send} disabled={loading||!text.trim()} style={{background:'var(--purple)',color:'#fff',border:'none',padding:'0 14px',flexShrink:0}}>→</Btn>
    </div>
  </div>;
}

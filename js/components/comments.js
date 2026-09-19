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
    {comments.map(c=><div key={c.id} style={{display:'flex',gap:8,marginBottom:8,alignItems:'flex-start'}}>
      <Av emoji={c.avatar} size={26}/>
      <div style={{flex:1}}>
        <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:3,flexWrap:'wrap'}}>
          <span style={{fontSize:11,fontWeight:700}}>{c.userName}</span>
          <Badge label={c.userBandRole} color={ROLE_COLORS[c.userBandRole]} bg='var(--surf3)'/>
        </div>
        <div style={{fontSize:12,color:'var(--t2)',lineHeight:1.5,padding:'6px 10px',background:'var(--bg)',borderRadius:'var(--r-sm)',border:'1px solid var(--border)'}}>{c.text}</div>
      </div>
      {c.userId===user.uid&&<button onClick={()=>del(c.id)} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:13,paddingTop:4}}>×</button>}
    </div>)}
    <div style={{display:'flex',gap:7,marginTop:6}}>
      <Inp value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),send())} placeholder="Kommentar..." style={{flex:1,fontSize:12}}/>
      <Btn onClick={send} disabled={loading||!text.trim()} style={{background:'var(--purple)',color:'#fff',border:'none',padding:'0 14px',flexShrink:0}}>→</Btn>
    </div>
  </div>;
}

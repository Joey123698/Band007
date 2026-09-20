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
    await db.collection(collection).add({docId,userId:user.uid,userName:profile.displayName,userBandRole:mainRole(profile),avatar:profile.avatar||'🎵',text:text.trim(),createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    setText(''); setLoading(false);
  };
  const del=async id=>db.collection(collection).doc(id).delete();
  return <div>
    {comments.map(c=><div key={c.id} className="flex gap-2.5 mb-3 items-start group">
      <Av name={c.userName} role={c.userBandRole} size={26}/>
      <div className="flex-1 min-w-0">
        <div className="flex gap-2 items-baseline mb-1 flex-wrap">
          <span className="text-[11.5px] font-semibold text-ink">{c.userName}</span>
          <span className="lab text-ink-3">{c.userBandRole}</span>
        </div>
        <div className="text-[12.5px] text-ink-2 leading-[1.5] px-3 py-2 bg-surf-2 rounded-theme-sm border-l border-line-2">{c.text}</div>
      </div>
      {c.userId===user.uid&&<button onClick={()=>del(c.id)} title="Löschen"
        className="cursor-pointer text-ink-3 hover:text-danger pt-1 shrink-0"><Ic name="x" size={13} sw={2}/></button>}
    </div>)}
    <div className="flex gap-1.5 mt-2">
      <Inp value={text} onChange={e=>setText(e.target.value)}
        onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),send())}
        placeholder="Kommentar …" style={{flex:1,fontSize:12.5}}/>
      <Btn onClick={send} disabled={loading||!text.trim()} variant="accent" title="Senden"
        style={{padding:'0 14px',flexShrink:0}}><Ic name="send" size={16} sw={2}/></Btn>
    </div>
  </div>;
}

// ════════════════════════════════════════════════════
//  ATTENDANCE
// ════════════════════════════════════════════════════
function AttendanceSection({session,user,profile}){
  const[reason,setReason]=useState('');
  const[showDecline,setShowDecline]=useState(false);
  const att=session.attendance||{};
  const mine=att[user.uid];
  const confirmed=Object.values(att).filter(v=>v.status==='confirmed');
  const declined=Object.values(att).filter(v=>v.status==='declined');
  const set=async(status)=>{
    await db.collection('sessions').doc(session.id).update({[`attendance.${user.uid}`]:{status,reason:status==='declined'?reason:'',name:profile.displayName,role:profile.role,avatar:profile.avatar||'🎵',updatedAt:new Date().toISOString()}});
    setShowDecline(false); setReason('');
  };
  const clear=async()=>{ const u={...att}; delete u[user.uid]; await db.collection('sessions').doc(session.id).update({attendance:u}); };
  return <div style={{borderTop:'1px solid var(--border)',paddingTop:12,marginTop:12}}>
    <div style={{fontSize:10,fontWeight:700,color:'var(--t2)',letterSpacing:.5,textTransform:'uppercase',marginBottom:10}}>Meine Teilnahme</div>
    {mine ? <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',borderRadius:'var(--r-sm)',background:mine.status==='confirmed'?'rgba(16,185,129,.1)':'rgba(239,68,68,.1)',border:`1px solid ${mine.status==='confirmed'?'rgba(16,185,129,.3)':'rgba(239,68,68,.3)'}`,marginBottom:10}}>
      <span>{mine.status==='confirmed'?'✅':'❌'}</span>
      <span style={{fontSize:12,color:mine.status==='confirmed'?'var(--green)':'var(--red)',fontWeight:600,flex:1}}>{mine.status==='confirmed'?'Ich komme':'Abgesagt'}{mine.reason&&` — ${mine.reason}`}</span>
      <button onClick={clear} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:11}}>Ändern</button>
    </div> : showDecline ? <div style={{marginBottom:10,display:'flex',flexDirection:'column',gap:7}}>
      <Inp value={reason} onChange={e=>setReason(e.target.value)} placeholder="Grund (optional)..." style={{fontSize:12}}/>
      <div style={{display:'flex',gap:6}}>
        <Btn onClick={()=>set('declined')} style={{flex:1,background:'rgba(239,68,68,.15)',color:'var(--red)',border:'1px solid rgba(239,68,68,.3)'}}>Absagen bestätigen</Btn>
        <Btn onClick={()=>setShowDecline(false)} size="sm">Zurück</Btn>
      </div>
    </div> : <div style={{display:'flex',gap:7,marginBottom:10}}>
      <button onClick={()=>set('confirmed')} style={{flex:1,padding:'9px',borderRadius:'var(--r-sm)',border:'1px solid rgba(16,185,129,.4)',background:'rgba(16,185,129,.1)',color:'var(--green)',fontWeight:700,fontSize:13,cursor:'pointer'}}>✓ Ich komme</button>
      <button onClick={()=>setShowDecline(true)} style={{flex:1,padding:'9px',borderRadius:'var(--r-sm)',border:'1px solid rgba(239,68,68,.4)',background:'rgba(239,68,68,.1)',color:'var(--red)',fontWeight:700,fontSize:13,cursor:'pointer'}}>✗ Absagen</button>
    </div>}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
      {[{arr:confirmed,label:'ZUSAGEN',color:'var(--green)',bg:'rgba(16,185,129,.07)',bc:'rgba(16,185,129,.2)'},{arr:declined,label:'ABSAGEN',color:'var(--red)',bg:'rgba(239,68,68,.07)',bc:'rgba(239,68,68,.2)'}].map(({arr,label,color,bg,bc})=>
        <div key={label} style={{padding:'8px 10px',background:bg,borderRadius:'var(--r-sm)',border:`1px solid ${bc}`}}>
          <div style={{fontSize:10,color,fontWeight:700,marginBottom:5}}>{label} ({arr.length})</div>
          {arr.length===0?<div style={{fontSize:10,color:'var(--t3)'}}>Noch niemand</div>:arr.map((m,i)=><div key={i} style={{display:'flex',gap:4,alignItems:'center',marginBottom:2}}>
            <span style={{fontSize:11}}>{m.avatar}</span><span style={{fontSize:11,color:'var(--text)'}}>{m.name}</span>
            {m.reason&&<span style={{fontSize:9,color:'var(--t3)'}}>— {m.reason}</span>}
          </div>)}
        </div>
      )}
    </div>
  </div>;
}

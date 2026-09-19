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
  return <div className="border-t border-line pt-3 mt-3">
    <div className="text-[10px] font-bold text-ink-2 tracking-[.5px] uppercase mb-2.5">Meine Teilnahme</div>
    {mine ? <div className="flex items-center gap-2.5 px-3 py-2 rounded-theme-sm border mb-2.5"
      style={{background:mine.status==='confirmed'?'rgba(16,185,129,.1)':'rgba(239,68,68,.1)',borderColor:mine.status==='confirmed'?'rgba(16,185,129,.3)':'rgba(239,68,68,.3)'}}>
      <span>{mine.status==='confirmed'?'✅':'❌'}</span>
      <span className="text-[12px] font-semibold flex-1" style={{color:mine.status==='confirmed'?'var(--green)':'var(--red)'}}>{mine.status==='confirmed'?'Ich komme':'Abgesagt'}{mine.reason&&` — ${mine.reason}`}</span>
      <button onClick={clear} className="bg-transparent border-none text-ink-3 cursor-pointer text-[11px]">Ändern</button>
    </div> : showDecline ? <div className="mb-2.5 flex flex-col gap-[7px]">
      <Inp value={reason} onChange={e=>setReason(e.target.value)} placeholder="Grund (optional)..." style={{fontSize:12}}/>
      <div className="flex gap-1.5">
        <Btn onClick={()=>set('declined')} style={{flex:1,background:'rgba(239,68,68,.15)',color:'var(--red)',border:'1px solid rgba(239,68,68,.3)'}}>Absagen bestätigen</Btn>
        <Btn onClick={()=>setShowDecline(false)} size="sm">Zurück</Btn>
      </div>
    </div> : <div className="flex gap-[7px] mb-2.5">
      <button onClick={()=>set('confirmed')} className="flex-1 p-[9px] rounded-theme-sm border font-bold text-[13px] cursor-pointer"
        style={{borderColor:'rgba(16,185,129,.4)',background:'rgba(16,185,129,.1)',color:'var(--green)'}}>✓ Ich komme</button>
      <button onClick={()=>setShowDecline(true)} className="flex-1 p-[9px] rounded-theme-sm border font-bold text-[13px] cursor-pointer"
        style={{borderColor:'rgba(239,68,68,.4)',background:'rgba(239,68,68,.1)',color:'var(--red)'}}>✗ Absagen</button>
    </div>}
    <div className="grid grid-cols-2 gap-2">
      {[{arr:confirmed,label:'ZUSAGEN',color:'var(--green)',bg:'rgba(16,185,129,.07)',bc:'rgba(16,185,129,.2)'},{arr:declined,label:'ABSAGEN',color:'var(--red)',bg:'rgba(239,68,68,.07)',bc:'rgba(239,68,68,.2)'}].map(({arr,label,color,bg,bc})=>
        <div key={label} className="px-2.5 py-2 rounded-theme-sm border" style={{background:bg,borderColor:bc}}>
          <div className="text-[10px] font-bold mb-[5px]" style={{color}}>{label} ({arr.length})</div>
          {arr.length===0?<div className="text-[10px] text-ink-3">Noch niemand</div>:arr.map((m,i)=><div key={i} className="flex gap-1 items-center mb-0.5">
            <span className="text-[11px]">{m.avatar}</span><span className="text-[11px] text-ink">{m.name}</span>
            {m.reason&&<span className="text-[9px] text-ink-3">— {m.reason}</span>}
          </div>)}
        </div>
      )}
    </div>
  </div>;
}

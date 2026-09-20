// ════════════════════════════════════════════════════
//  ATTENDANCE
// ════════════════════════════════════════════════════
function AttendanceSection({session,user,profile,members}){
  const[reason,setReason]=useState('');
  const[showDecline,setShowDecline]=useState(false);
  const att=session.attendance||{};
  const mine=att[user.uid];
  // entries statt values: die uid wird zum Nachschlagen des Fotos gebraucht
  const byStatus=st=>Object.entries(att).filter(([,v])=>v.status===st).map(([id,v])=>({...v,id}));
  const confirmed=byStatus('confirmed');
  const declined=byStatus('declined');
  // Wer gar nichts gesagt hat. Ohne diese Gruppe sieht eine Probe mit
  // einer Zusage genauso aus wie eine, bei der zwei Leute abgesagt haben.
  const open=(members||[]).filter(m=>!att[m.id]).map(m=>({id:m.id,name:m.displayName,role:mainRole(m)}));
  const set=async(status)=>{
    await db.collection('sessions').doc(session.id).update({[`attendance.${user.uid}`]:{status,reason:status==='declined'?reason:'',name:profile.displayName,role:mainRole(profile),avatar:profile.avatar||'',updatedAt:new Date().toISOString()}});
    setShowDecline(false); setReason('');
  };
  const clear=async()=>{ const u={...att}; delete u[user.uid]; await db.collection('sessions').doc(session.id).update({attendance:u}); };

  const ok = mine?.status==='confirmed';
  return <div className="border-t border-line pt-4 mt-4">
    <SectionLabel color="var(--t3)">Meine Teilnahme</SectionLabel>

    {mine ? <div className="flex items-center gap-2.5 px-3 py-2.5 mb-3 rounded-theme-sm"
      style={{background:hexa(ok?'#6FA96B':'#C2606A',.10),borderLeft:`2px solid ${ok?'var(--ok)':'var(--danger)'}`}}>
      <Ic name={ok?'check':'x'} size={15} sw={2.2} color={ok?'var(--ok)':'var(--danger)'}/>
      <span className="text-[12.5px] font-semibold flex-1" style={{color:ok?'var(--ok)':'var(--danger)'}}>
        {ok?'Ich komme':'Abgesagt'}{mine.reason&&<span className="text-ink-2 font-normal"> — {mine.reason}</span>}
      </span>
      <button onClick={clear} className="lab text-ink-3 hover:text-ink cursor-pointer">Ändern</button>
    </div>

    : showDecline ? <div className="mb-3 flex flex-col gap-2">
      <Inp value={reason} onChange={e=>setReason(e.target.value)} placeholder="Grund (optional) …"/>
      <div className="flex gap-1.5">
        <Btn onClick={()=>set('declined')} variant="danger" style={{flex:1}}>Absage bestätigen</Btn>
        <Btn onClick={()=>setShowDecline(false)} variant="quiet">Zurück</Btn>
      </div>
    </div>

    : <div className="grid grid-cols-2 gap-1.5 mb-3">
      <button onClick={()=>set('confirmed')}
        className="h-11 rounded-theme-sm border font-semibold text-[13px] cursor-pointer flex items-center justify-center gap-2 transition-colors duration-100"
        style={{borderColor:hexa('#6FA96B',.45),background:hexa('#6FA96B',.10),color:'var(--ok)'}}>
        <Ic name="check" size={15} sw={2.2}/> Ich komme
      </button>
      <button onClick={()=>setShowDecline(true)}
        className="h-11 rounded-theme-sm border font-semibold text-[13px] cursor-pointer flex items-center justify-center gap-2 transition-colors duration-100"
        style={{borderColor:hexa('#C2606A',.45),background:hexa('#C2606A',.08),color:'var(--danger)'}}>
        <Ic name="x" size={14} sw={2.2}/> Absagen
      </button>
    </div>}

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {[{arr:confirmed,label:'Zusagen',c:'#6FA96B'},
        {arr:declined, label:'Absagen',c:'#C2606A'},
        {arr:open,     label:'Offen',  c:'#8E8A93'}].map(({arr,label,c})=>
        <div key={label} className="px-3 py-2.5 rounded-theme-sm border border-line">
          <div className="flex items-baseline justify-between mb-2">
            <span className="lab" style={{color:c}}>{label}</span>
            <span className="num text-[11px]" style={{color:c}}>{arr.length}</span>
          </div>
          {arr.length===0
            ? <div className="text-[11px] text-ink-3">{label==='Offen'?'Alle haben geantwortet':'Noch niemand'}</div>
            : <div className="flex flex-col gap-1.5">{arr.map((m,i)=>
                <div key={i} className="flex gap-2 items-center">
                  <Av name={m.name} role={m.role} photo={photoOf(members,m.id)} size={20}/>
                  <span className="text-[11.5px] text-ink truncate">{m.name}</span>
                  {m.reason&&<span className="text-[10.5px] text-ink-3 truncate">— {m.reason}</span>}
                </div>)}
              </div>}
        </div>
      )}
    </div>
  </div>;
}

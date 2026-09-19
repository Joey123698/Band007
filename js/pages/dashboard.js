// ════════════════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════════════════
function DashboardPage({user,profile,allSessions,allSongs,members,bandName}){
  const[showComments,setShowComments]=useState(false);
  const today=nowKey();
  const upcoming=allSessions.filter(s=>s.status==='upcoming'&&s.date>=today).sort((a,b)=>a.date.localeCompare(b.date))[0];
  const stats=[{l:'Mitglieder',v:members.length,i:'👥'},{l:'In Übung',v:allSongs.filter(s=>['practicing','needs_work'].includes(s.status)).length,i:'🎵'},{l:'Bühnenreif',v:allSongs.filter(s=>s.status==='ready').length,i:'🎤'},{l:'Proben',v:allSessions.filter(s=>s.status==='upcoming').length,i:'📅'}];
  return <div className="pb-[90px]">
    <DashboardHero bandName={bandName} profile={profile}/>
    <MiniCalendar sessions={allSessions.filter(s=>s.status==='upcoming')}/>
    <div className="px-4 pt-[14px]">
      <div className="grid grid-cols-2 gap-2 mb-4">
        {stats.map(s=><Card key={s.l} style={{padding:'12px',display:'flex',alignItems:'center',gap:10}}>
          <span className="text-[22px]">{s.i}</span>
          <div><div className="text-[22px] font-extrabold text-brand-purple leading-none">{s.v}</div><div className="text-[10px] text-ink-2">{s.l}</div></div>
        </Card>)}
      </div>
      <div className="text-[11px] font-bold text-ink-2 tracking-[.5px] uppercase mb-2.5">Nächste Probe</div>
      {!upcoming?<Card><Empty icon="📅" title="Keine bevorstehende Probe" sub="Im Probeplan-Tab erstellen."/></Card>
      :<Card glow style={{position:'relative',overflow:'hidden'}}>
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{background:'linear-gradient(90deg,var(--purple),var(--pink))'}}/>
        <div className="flex gap-3 items-start mb-2.5">
          <div className="text-[28px]">🎸</div>
          <div className="flex-1">
            <div className="font-extrabold text-[15px]">{upcoming.title||'Probe'}</div>
            <div className="text-[11px] text-ink-2 mt-[3px]">📅 {dfmt(upcoming.date)} · ⏰ {upcoming.time||'–'} · 📍 {upcoming.location||'Ort ausstehend'}</div>
            {upcoming.leadName&&<div className="text-[11px] mt-[3px]">⭐ <span className="text-brand-gold font-semibold">{upcoming.leadName}</span> (Verantwortlich)</div>}
          </div>
        </div>
        {upcoming.setlist?.length>0&&<div className="mb-1">
          <div className="text-[10px] text-ink-3 mb-[5px]">Setliste ({upcoming.setlist.length})</div>
          {upcoming.setlist.map((s,i)=><div key={i} className="text-[11px] py-[3px] text-ink-2" style={{borderTop:i>0?'1px solid var(--border)':undefined}}>🎵 {s.title}</div>)}
        </div>}
        <AttendanceSection session={upcoming} user={user} profile={profile}/>
        <div className="mt-2.5 border-t border-line pt-2.5">
          <button onClick={()=>setShowComments(v=>!v)} className="bg-transparent border-none text-ink-2 cursor-pointer text-[12px] font-semibold">💬 Kommentare {showComments?'▲':'▼'}</button>
          {showComments&&<div className="mt-2.5"><CommentsThread collection="sessionComments" docId={upcoming.id} user={user} profile={profile} members={members}/></div>}
        </div>
      </Card>}
      <div className="text-[11px] font-bold text-ink-2 tracking-[.5px] uppercase mt-[18px] mb-2.5">Bandmitglieder</div>
      <div className="flex flex-col gap-[7px]">
        {members.map(m=><Card key={m.id} style={{display:'flex',alignItems:'center',gap:11,padding:'10px 13px'}}>
          <Av emoji={m.avatar} size={36} color={(ROLE_COLORS[m.role]||'#888')+'22'}/>
          <div className="flex-1"><div className="font-bold text-[13px]">{m.displayName}</div><div className="text-[11px] mt-px" style={{color:ROLE_COLORS[m.role]||'var(--t2)'}}>{m.role}</div></div>
          {m.id===user.uid&&<Badge label="Ich" color="var(--purple)" bg="rgba(124,58,237,.15)"/>}
        </Card>)}
      </div>
    </div>
  </div>;
}

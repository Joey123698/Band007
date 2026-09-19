// ════════════════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════════════════
function DashboardPage({user,profile,allSessions,allSongs,members,bandName}){
  const[showComments,setShowComments]=useState(false);
  const today=nowKey();
  const upcoming=allSessions.filter(s=>s.status==='upcoming'&&s.date>=today).sort((a,b)=>a.date.localeCompare(b.date))[0];
  const stats=[{l:'Mitglieder',v:members.length,i:'👥'},{l:'In Übung',v:allSongs.filter(s=>['practicing','needs_work'].includes(s.status)).length,i:'🎵'},{l:'Bühnenreif',v:allSongs.filter(s=>s.status==='ready').length,i:'🎤'},{l:'Proben',v:allSessions.filter(s=>s.status==='upcoming').length,i:'📅'}];
  return <div style={{paddingBottom:90}}>
    <DashboardHero bandName={bandName} profile={profile}/>
    <MiniCalendar sessions={allSessions.filter(s=>s.status==='upcoming')}/>
    <div style={{padding:'14px 16px 0'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:16}}>
        {stats.map(s=><Card key={s.l} style={{padding:'12px',display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:22}}>{s.i}</span>
          <div><div style={{fontSize:22,fontWeight:800,color:'var(--purple)',lineHeight:1}}>{s.v}</div><div style={{fontSize:10,color:'var(--t2)'}}>{s.l}</div></div>
        </Card>)}
      </div>
      <div style={{fontSize:11,fontWeight:700,color:'var(--t2)',letterSpacing:.5,textTransform:'uppercase',marginBottom:10}}>Nächste Probe</div>
      {!upcoming?<Card><Empty icon="📅" title="Keine bevorstehende Probe" sub="Im Probeplan-Tab erstellen."/></Card>
      :<Card glow style={{position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,var(--purple),var(--pink))'}}/>
        <div style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:10}}>
          <div style={{fontSize:28}}>🎸</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,fontSize:15}}>{upcoming.title||'Probe'}</div>
            <div style={{fontSize:11,color:'var(--t2)',marginTop:3}}>📅 {dfmt(upcoming.date)} · ⏰ {upcoming.time||'–'} · 📍 {upcoming.location||'Ort ausstehend'}</div>
            {upcoming.leadName&&<div style={{fontSize:11,marginTop:3}}>⭐ <span style={{color:'var(--gold)',fontWeight:600}}>{upcoming.leadName}</span> (Verantwortlich)</div>}
          </div>
        </div>
        {upcoming.setlist?.length>0&&<div style={{marginBottom:4}}>
          <div style={{fontSize:10,color:'var(--t3)',marginBottom:5}}>Setliste ({upcoming.setlist.length})</div>
          {upcoming.setlist.map((s,i)=><div key={i} style={{fontSize:11,padding:'3px 0',borderTop:i>0?'1px solid var(--border)':undefined,color:'var(--t2)'}}>🎵 {s.title}</div>)}
        </div>}
        <AttendanceSection session={upcoming} user={user} profile={profile}/>
        <div style={{marginTop:10,borderTop:'1px solid var(--border)',paddingTop:10}}>
          <button onClick={()=>setShowComments(v=>!v)} style={{background:'none',border:'none',color:'var(--t2)',cursor:'pointer',fontSize:12,fontWeight:600}}>💬 Kommentare {showComments?'▲':'▼'}</button>
          {showComments&&<div style={{marginTop:10}}><CommentsThread collection="sessionComments" docId={upcoming.id} user={user} profile={profile} members={members}/></div>}
        </div>
      </Card>}
      <div style={{fontSize:11,fontWeight:700,color:'var(--t2)',letterSpacing:.5,textTransform:'uppercase',margin:'18px 0 10px'}}>Bandmitglieder</div>
      <div style={{display:'flex',flexDirection:'column',gap:7}}>
        {members.map(m=><Card key={m.id} style={{display:'flex',alignItems:'center',gap:11,padding:'10px 13px'}}>
          <Av emoji={m.avatar} size={36} color={(ROLE_COLORS[m.role]||'#888')+'22'}/>
          <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{m.displayName}</div><div style={{fontSize:11,color:ROLE_COLORS[m.role]||'var(--t2)',marginTop:1}}>{m.role}</div></div>
          {m.id===user.uid&&<Badge label="Ich" color="var(--purple)" bg="rgba(124,58,237,.15)"/>}
        </Card>)}
      </div>
    </div>
  </div>;
}

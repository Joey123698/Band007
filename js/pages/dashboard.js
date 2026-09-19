// ════════════════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════════════════
function DashboardPage({user,profile,allSessions,allSongs,members,bandName}){
  const[showComments,setShowComments]=useState(false);
  const today=nowKey();
  const upcoming=allSessions.filter(s=>s.status==='upcoming'&&s.date>=today).sort((a,b)=>a.date.localeCompare(b.date))[0];
  const stats=[
    {l:'Mitglieder', v:members.length},
    {l:'In Übung',   v:allSongs.filter(s=>['practicing','needs_work'].includes(s.status)).length},
    {l:'Bühnenreif', v:allSongs.filter(s=>s.status==='ready').length},
    {l:'Proben',     v:allSessions.filter(s=>s.status==='upcoming').length},
  ];
  return <div>
    <DashboardHero bandName={bandName} profile={profile} stats={stats}/>
    <MiniCalendar sessions={allSessions.filter(s=>s.status==='upcoming')}/>

    {/* Ab lg zwei Spalten: Probe links, Besetzung rechts */}
    <div className="px-4 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-x-8 gap-y-8 items-start">

      <section>
        <SectionLabel right={upcoming?dfmt(upcoming.date):null}>Nächste Probe</SectionLabel>
        {!upcoming
          ? <Empty title="Keine bevorstehende Probe" sub="Im Probeplan eine neue Probe ansetzen."/>
          : <Card accent>
            <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
              <div className="font-display font-bold text-[19px] tracking-[-.02em]">{upcoming.title||'Probe'}</div>
              {upcoming.time&&<div className="num text-[15px] text-accent">{upcoming.time}</div>}
            </div>

            {/* Ablesestreifen — Datum, Ort, Verantwortlich */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 pb-4 mb-1 border-b border-line">
              <div><div className="lab text-ink-3">Datum</div><div className="text-[12.5px] mt-1">{dfmt(upcoming.date)}</div></div>
              <div><div className="lab text-ink-3">Ort</div><div className="text-[12.5px] mt-1 truncate">{upcoming.location||'—'}</div></div>
              <div><div className="lab text-ink-3">Verantwortlich</div><div className="text-[12.5px] mt-1 truncate" style={{color:upcoming.leadName?'var(--accent)':'var(--t3)'}}>{upcoming.leadName||'—'}</div></div>
            </div>

            {upcoming.setlist?.length>0&&<div className="pt-3">
              <div className="lab text-ink-3 mb-2">Setliste · {upcoming.setlist.length}</div>
              {upcoming.setlist.map((s,i)=>
                <div key={i} className="flex items-baseline gap-2.5 py-1.5" style={{borderTop:i>0?'1px solid var(--border)':undefined}}>
                  <span className="num text-[10px] text-ink-3 w-4 shrink-0">{String(i+1).padStart(2,'0')}</span>
                  <span className="text-[12.5px] text-ink-2">{s.title}</span>
                </div>)}
            </div>}

            <AttendanceSection session={upcoming} user={user} profile={profile}/>

            <div className="mt-4 border-t border-line pt-3">
              <button onClick={()=>setShowComments(v=>!v)}
                className="lab text-ink-2 hover:text-ink cursor-pointer flex items-center gap-2">
                <Ic name="chat" size={13} sw={1.8}/> Kommentare
                <Ic name={showComments?'up':'down'} size={12} sw={2}/>
              </button>
              {showComments&&<div className="mt-3 fade"><CommentsThread collection="sessionComments" docId={upcoming.id} user={user} profile={profile} members={members}/></div>}
            </div>
          </Card>}
      </section>

      <section>
        <SectionLabel color="var(--t3)" right={String(members.length)}>Besetzung</SectionLabel>
        <div className="border-t border-line">
          {members.map(m=>
            <div key={m.id} className="flex items-center gap-3 py-3 border-b border-line">
              <Av name={m.displayName} role={m.role} size={34}/>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[13px] truncate">{m.displayName}</div>
                <div className="text-[11.5px] mt-px truncate" style={{color:ROLE_COLORS[m.role]||'var(--t2)'}}>{m.role}</div>
              </div>
              {m.id===user.uid&&<span className="lab text-accent">Ich</span>}
            </div>)}
        </div>
      </section>

    </div>
  </div>;
}

// ════════════════════════════════════════════════════
//  HERO + MINI CALENDAR
// ════════════════════════════════════════════════════
function DashboardHero({bandName,profile}){
  const SVG_WAVES = `url("data:image/svg+xml,%3Csvg width='60' height='20' viewBox='0 0 60 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q15 0 30 10 Q45 20 60 10' stroke='rgba(255,255,255,0.04)' fill='none' stroke-width='1.5'/%3E%3C/svg%3E")`;
  return <div style={{position:'relative',overflow:'hidden',background:`linear-gradient(145deg, rgba(50,0,80,0.9) 0%, var(--bg) 60%)`,padding:'28px 18px 22px',marginBottom:0}}>
    <div style={{position:'absolute',inset:0,backgroundImage:SVG_WAVES,backgroundRepeat:'repeat',opacity:.6}}/>
    <div style={{position:'absolute',top:-40,right:-40,width:160,height:160,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,58,237,.35) 0%,transparent 70%)'}}/>
    <div style={{position:'absolute',bottom:-50,left:-30,width:180,height:180,borderRadius:'50%',background:'radial-gradient(circle,rgba(236,72,153,.18) 0%,transparent 70%)'}}/>
    <div style={{position:'relative',zIndex:1}}>
      <div style={{fontSize:10,letterSpacing:4,color:'rgba(255,255,255,.4)',fontWeight:600,marginBottom:6,textTransform:'uppercase'}}>Interne Plattform</div>
      <div style={{fontSize:30,fontWeight:900,letterSpacing:-1,lineHeight:1.1,color:'#fff',textShadow:'0 2px 20px rgba(124,58,237,.5)',marginBottom:2}}>
        {bandName||'BAND NAME'}
      </div>
      <div style={{fontSize:11,color:'rgba(255,255,255,.35)',marginTop:6}}>Willkommen zurück, {profile?.displayName} {profile?.avatar}</div>
    </div>
  </div>;
}

function MiniCalendar({sessions}){
  const today=new Date(), tk=toKey(today);
  const days=getWeekDays(0);
  const probeTagen=new Set((sessions||[]).map(s=>s.date));
  const monthLabel=today.toLocaleDateString('de-DE',{month:'long',year:'numeric'});
  return <div style={{padding:'12px 18px',background:'var(--surf)',borderBottom:'1px solid var(--border)'}}>
    <div style={{fontSize:9,color:'var(--t3)',fontWeight:700,letterSpacing:.5,textTransform:'uppercase',marginBottom:8}}>{monthLabel}</div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
      {days.map((d,i)=>{
        const dk=toKey(d), isToday=dk===tk, hasProbe=probeTagen.has(dk);
        return <div key={i} style={{textAlign:'center'}}>
          <div style={{fontSize:8,color:'var(--t3)',marginBottom:3}}>{DAYS_DE[i]}</div>
          <div style={{width:28,height:28,margin:'0 auto',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:isToday?800:hasProbe?700:400,background:isToday?'var(--purple)':hasProbe?'rgba(124,58,237,.22)':'transparent',color:isToday?'#fff':hasProbe?'var(--purple)':'var(--t2)',border:hasProbe&&!isToday?'1px solid rgba(124,58,237,.4)':'1px solid transparent'}}>
            {d.getDate()}
          </div>
          {hasProbe&&!isToday&&<div style={{width:4,height:4,borderRadius:'50%',background:'var(--purple)',margin:'2px auto 0'}}/>}
        </div>;
      })}
    </div>
  </div>;
}

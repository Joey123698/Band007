// ════════════════════════════════════════════════════
//  HERO + MINI CALENDAR
// ════════════════════════════════════════════════════
function DashboardHero({bandName,profile}){
  const SVG_WAVES = `url("data:image/svg+xml,%3Csvg width='60' height='20' viewBox='0 0 60 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q15 0 30 10 Q45 20 60 10' stroke='rgba(255,255,255,0.04)' fill='none' stroke-width='1.5'/%3E%3C/svg%3E")`;
  return <div className="relative overflow-hidden px-[18px] pt-7 pb-[22px] mb-0" style={{background:`linear-gradient(145deg, rgba(50,0,80,0.9) 0%, var(--bg) 60%)`}}>
    <div className="absolute inset-0 bg-repeat opacity-60" style={{backgroundImage:SVG_WAVES}}/>
    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-[50%]" style={{background:'radial-gradient(circle,rgba(124,58,237,.35) 0%,transparent 70%)'}}/>
    <div className="absolute -bottom-[50px] -left-[30px] w-[180px] h-[180px] rounded-[50%]" style={{background:'radial-gradient(circle,rgba(236,72,153,.18) 0%,transparent 70%)'}}/>
    <div className="relative z-[1]">
      <div className="text-[10px] tracking-[4px] font-semibold mb-1.5 uppercase" style={{color:'rgba(255,255,255,.4)'}}>Interne Plattform</div>
      <div className="text-[30px] font-black tracking-[-1px] leading-[1.1] text-white mb-0.5" style={{textShadow:'0 2px 20px rgba(124,58,237,.5)'}}>
        {bandName||'BAND NAME'}
      </div>
      <div className="text-[11px] mt-1.5" style={{color:'rgba(255,255,255,.35)'}}>Willkommen zurück, {profile?.displayName} {profile?.avatar}</div>
    </div>
  </div>;
}

function MiniCalendar({sessions}){
  const today=new Date(), tk=toKey(today);
  const days=getWeekDays(0);
  const probeTagen=new Set((sessions||[]).map(s=>s.date));
  const monthLabel=today.toLocaleDateString('de-DE',{month:'long',year:'numeric'});
  return <div className="px-[18px] py-3 bg-surf border-b border-line">
    <div className="text-[9px] text-ink-3 font-bold tracking-[.5px] uppercase mb-2">{monthLabel}</div>
    <div className="grid grid-cols-7 gap-1">
      {days.map((d,i)=>{
        const dk=toKey(d), isToday=dk===tk, hasProbe=probeTagen.has(dk);
        return <div key={i} className="text-center">
          <div className="text-[8px] text-ink-3 mb-[3px]">{DAYS_DE[i]}</div>
          <div className="w-7 h-7 mx-auto rounded-[50%] flex items-center justify-center text-[12px] border"
            style={{fontWeight:isToday?800:hasProbe?700:400,background:isToday?'var(--purple)':hasProbe?'rgba(124,58,237,.22)':'transparent',color:isToday?'#fff':hasProbe?'var(--purple)':'var(--t2)',borderColor:hasProbe&&!isToday?'rgba(124,58,237,.4)':'transparent'}}>
            {d.getDate()}
          </div>
          {hasProbe&&!isToday&&<div className="w-1 h-1 rounded-[50%] bg-brand-purple mx-auto mt-0.5"/>}
        </div>;
      })}
    </div>
  </div>;
}

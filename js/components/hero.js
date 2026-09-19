// ════════════════════════════════════════════════════
//  HERO + MINI CALENDAR
//  Der Verlauf mit Glow ist weg — der Kopf ist jetzt eine
//  Messleiste: Bandname, Begruessung, vier Kennzahlen.
// ════════════════════════════════════════════════════
function DashboardHero({bandName,profile,stats}){
  return <div className="border-b border-line-2">
    <div className="px-4 md:px-8 pt-6 md:pt-9 pb-5">
      <div className="lab text-ink-3 mb-2.5">Interne Plattform</div>
      <h1 className="disp text-[32px] md:text-[44px] uppercase text-ink">{bandName||'BAND NAME'}</h1>
      <div className="text-[12px] text-ink-2 mt-2.5">
        Willkommen zurück, <span className="text-ink font-semibold">{profile?.displayName}</span>
      </div>
    </div>
    {/* Kennzahlenstreifen — liest sich wie eine Geraeteanzeige.
        Jede Zelle traegt Linie oben+rechts; das -mt/-mr am Raster schiebt
        die aeussersten heraus, damit bei jeder Spaltenzahl ein sauberes
        Gitter bleibt (2 Spalten mobil, 4 ab sm). */}
    <div className="overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-4 -mt-px -mr-px">
        {(stats||[]).map(s=>
          <div key={s.l} className="px-4 md:px-8 py-3.5 border-t border-r border-line-2">
            <div className="lab text-ink-3">{s.l}</div>
            <div className="num text-[22px] text-ink mt-1 leading-none">{s.v}</div>
          </div>
        )}
      </div>
    </div>
  </div>;
}

function MiniCalendar({sessions}){
  const today=new Date(), tk=toKey(today);
  const days=getWeekDays(0);
  const probeTagen=new Set((sessions||[]).map(s=>s.date));
  const monthLabel=today.toLocaleDateString('de-DE',{month:'long',year:'numeric'});
  return <div className="px-4 md:px-8 py-4 border-b border-line-2">
    <div className="lab text-ink-3 mb-2.5">{monthLabel}</div>
    <div className="grid grid-cols-7 gap-1.5 max-w-[420px]">
      {days.map((d,i)=>{
        const dk=toKey(d), isToday=dk===tk, hasProbe=probeTagen.has(dk);
        return <div key={i} className="text-center">
          <div className="lab text-ink-3 mb-1.5">{DAYS_DE[i]}</div>
          <div className="num h-8 flex items-center justify-center text-[12px] border"
            style={{
              background:isToday?'var(--accent)':hasProbe?'var(--accent-tint)':'transparent',
              color:isToday?'#121114':hasProbe?'var(--accent)':'var(--t2)',
              borderColor:isToday?'var(--accent)':hasProbe?'var(--accent)':'var(--border)',
            }}>
            {d.getDate()}
          </div>
        </div>;
      })}
    </div>
  </div>;
}

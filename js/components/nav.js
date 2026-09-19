// ════════════════════════════════════════════════════
//  NAVIGATION
//  Bis md: feste Leiste unten (der Entwurf).
//  Ab md:  Schiene links — erst nur Icons, ab lg mit Text.
//  Beide rendern dieselbe Liste; sichtbar ist immer genau eine.
// ════════════════════════════════════════════════════
const NAV_TABS = [
  {key:'dashboard', icon:'home',     label:'Home'},
  {key:'schedule',  icon:'calendar', label:'Probeplan'},
  // Ideen haben keinen eigenen Reiter mehr — sie stehen als Abschnitt
  // im Repertoire, weil sie ohnehin in derselben Collection liegen.
  {key:'songs',     icon:'music',    label:'Songs'},
  {key:'profile',   icon:'user',     label:'Profil'},
];

function BottomNav({tab,setTab}){
  return <nav aria-label="Hauptnavigation"
    className="md:hidden fixed bottom-0 left-0 right-0 bg-base border-t border-line-2 flex z-[100]"
    style={{paddingBottom:'env(safe-area-inset-bottom)'}}>
    {NAV_TABS.map(t=>{
      const on=tab===t.key;
      return <button key={t.key} onClick={()=>setTab(t.key)} aria-current={on?'page':undefined}
        className="flex-1 pt-2.5 pb-3.5 px-1 cursor-pointer flex flex-col items-center gap-[5px]">
        <Ic name={t.icon} size={20} sw={on?1.9:1.6} color={on?'var(--accent)':'var(--t3)'}/>
        <span className="text-[9.5px]" style={{color:on?'var(--accent)':'var(--t3)',fontWeight:on?700:500}}>{t.label}</span>
      </button>;
    })}
  </nav>;
}

function SideNav({tab,setTab,bandName}){
  // `self-start` ist noetig: als gestrecktes Flex-Kind waere die Schiene so hoch
  // wie das ganze Dokument, und `sticky` haette nichts, woran es kleben kann.
  return <nav aria-label="Hauptnavigation"
    className="hidden md:flex flex-col shrink-0 self-start w-[72px] lg:w-[212px] border-r border-line-2 sticky top-0 h-screen bg-base">
    <div className="h-[68px] flex items-center justify-center lg:justify-start lg:px-5 border-b border-line-2">
      <span className="disp text-[15px] uppercase text-ink hidden lg:block truncate">{bandName||'BandSync'}</span>
      <span className="disp text-[17px] uppercase text-accent lg:hidden">B</span>
    </div>
    <div className="flex flex-col py-3">
      {NAV_TABS.map(t=>{
        const on=tab===t.key;
        return <button key={t.key} onClick={()=>setTab(t.key)} aria-current={on?'page':undefined} title={t.label}
          className="flex items-center gap-3 h-11 px-0 lg:px-5 justify-center lg:justify-start cursor-pointer border-l-2 transition-colors duration-100"
          style={{borderLeftColor:on?'var(--accent)':'transparent',background:on?'var(--surf)':'transparent'}}>
          <Ic name={t.icon} size={19} sw={on?1.9:1.6} color={on?'var(--accent)':'var(--t2)'}/>
          <span className="text-[13px] hidden lg:block" style={{color:on?'var(--accent)':'var(--t2)',fontWeight:on?700:500}}>{t.label}</span>
        </button>;
      })}
    </div>
  </nav>;
}

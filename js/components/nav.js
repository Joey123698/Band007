// ════════════════════════════════════════════════════
//  BOTTOM NAV
// ════════════════════════════════════════════════════
function BottomNav({tab,setTab}){
  const tabs=[{key:'dashboard',icon:'🏠',label:'Home'},{key:'schedule',icon:'📅',label:'Probeplan'},{key:'songs',icon:'🎵',label:'Songs'},{key:'suggest',icon:'💡',label:'Vorschläge'},{key:'profile',icon:'👤',label:'Profil'}];
  return <div className="fixed bottom-0 left-0 right-0 bg-surf border-t border-line flex z-[100]" style={{paddingBottom:'env(safe-area-inset-bottom)'}}>
    {tabs.map(t=><button key={t.key} onClick={()=>setTab(t.key)} className="flex-1 pt-2.5 px-1 pb-2 border-none bg-transparent cursor-pointer flex flex-col items-center gap-[3px]">
      <span className="text-[19px]" style={{filter:tab===t.key?'none':'grayscale(.8) opacity(.4)'}}>{t.icon}</span>
      <span className="text-[9px] font-semibold" style={{color:tab===t.key?'var(--purple)':'var(--t3)'}}>{t.label}</span>
    </button>)}
  </div>;
}

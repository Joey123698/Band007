// ════════════════════════════════════════════════════
//  BOTTOM NAV
// ════════════════════════════════════════════════════
function BottomNav({tab,setTab}){
  const tabs=[{key:'dashboard',icon:'🏠',label:'Home'},{key:'schedule',icon:'📅',label:'Probeplan'},{key:'songs',icon:'🎵',label:'Songs'},{key:'suggest',icon:'💡',label:'Vorschläge'},{key:'profile',icon:'👤',label:'Profil'}];
  return <div style={{position:'fixed',bottom:0,left:0,right:0,background:'var(--surf)',borderTop:'1px solid var(--border)',display:'flex',zIndex:100,paddingBottom:'env(safe-area-inset-bottom)'}}>
    {tabs.map(t=><button key={t.key} onClick={()=>setTab(t.key)} style={{flex:1,padding:'10px 4px 8px',border:'none',background:'transparent',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
      <span style={{fontSize:19,filter:tab===t.key?'none':'grayscale(.8) opacity(.4)'}}>{t.icon}</span>
      <span style={{fontSize:9,fontWeight:600,color:tab===t.key?'var(--purple)':'var(--t3)'}}>{t.label}</span>
    </button>)}
  </div>;
}

// ════════════════════════════════════════════════════
//  THEME SYSTEM
// ════════════════════════════════════════════════════
const THEMES = {
  'Dark Studio':  {bg:'#06060F',surf:'#0C0C1E',surf2:'#111128',surf3:'#16163A',border:'#1C1C40',border2:'#242455',purple:'#7C3AED',gold:'#F59E0B',green:'#10B981',red:'#EF4444',cyan:'#06B6D4',pink:'#EC4899',text:'#E2E2F5',t2:'#7070A8',t3:'#38386A'},
  'Purple Night': {bg:'#080010',surf:'#0D0020',surf2:'#130030',surf3:'#190040',border:'#220058',border2:'#2E0070',purple:'#9333EA',gold:'#E879F9',green:'#10B981',red:'#EF4444',cyan:'#A855F7',pink:'#EC4899',text:'#F0E8FF',t2:'#9070C0',t3:'#4A3080'},
  'Ocean':        {bg:'#020B14',surf:'#051525',surf2:'#072030',surf3:'#0A2B40',border:'#0D3A55',border2:'#104A6A',purple:'#0891B2',gold:'#22D3EE',green:'#34D399',red:'#F87171',cyan:'#38BDF8',pink:'#67E8F9',text:'#E0F7FF',t2:'#6BAACC',t3:'#2A6080'},
  'Forest':       {bg:'#030C05',surf:'#061A0A',surf2:'#0A2410',surf3:'#0E3016',border:'#123C1C',border2:'#164824',purple:'#059669',gold:'#34D399',green:'#4ADE80',red:'#EF4444',cyan:'#10B981',pink:'#6EE7B7',text:'#E0FFE8',t2:'#60A870',t3:'#2A5A35'},
  'Rot & Gold':   {bg:'#100808',surf:'#1C0F0F',surf2:'#241616',surf3:'#2C1E1E',border:'#3A2424',border2:'#4A2E2E',purple:'#DC2626',gold:'#F59E0B',green:'#10B981',red:'#EF4444',cyan:'#F97316',pink:'#FB7185',text:'#FFF0F0',t2:'#B08080',t3:'#6A4040'},
};
const FONTS = {
  'Inter':      '"Inter",system-ui,sans-serif',
  'Monospace':  '"JetBrains Mono","Courier New",monospace',
  'Playfair':   '"Playfair Display",Georgia,serif',
  'System':     '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
};
const DESIGN_LS = 'bandsync-design-v3';
const loadDesign = () => { try{return JSON.parse(localStorage.getItem(DESIGN_LS))||{theme:'Dark Studio',font:'Inter',radius:10};}catch{return{theme:'Dark Studio',font:'Inter',radius:10};} };
const applyDesign = ({theme,font,radius}) => {
  const t=THEMES[theme]||THEMES['Dark Studio'], r=radius??10, root=document.documentElement;
  Object.entries(t).forEach(([k,v])=>root.style.setProperty(`--${k}`,v));
  root.style.setProperty('--glow',t.purple+'28');
  root.style.setProperty('--r',`${r}px`);
  root.style.setProperty('--r-sm',`${Math.max(2,Math.round(r*.6))}px`);
  root.style.setProperty('--r-lg',`${Math.round(r*1.5)}px`);
  document.body.style.fontFamily=FONTS[font]||FONTS['Inter'];
};

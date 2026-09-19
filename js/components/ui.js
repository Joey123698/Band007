// ════════════════════════════════════════════════════
//  SHARED UI  —  Tailwind-Variante
//  Die Klassen nutzen die Theme-Tokens aus
//  js/core/tailwind-config.js (bg-surf, text-ink-2, …),
//  dynamische Werte (Props wie color/size) bleiben inline.
//  Ein uebergebenes style={{…}} ueberschreibt weiterhin alles.
// ════════════════════════════════════════════════════
function Card({children,style={},glow}){
  return <div className={`bg-surf border border-solid rounded-theme p-4 ${glow?'border-line-2 shadow-glow':'border-line'}`} style={style}>{children}</div>;
}
function Btn({onClick,children,color,style={},disabled,size='md'}){
  const pad={sm:'px-[10px] py-[4px] text-[11px]',md:'px-[14px] py-[7px] text-[13px]',lg:'px-[22px] py-[11px] text-[14px]'}[size];
  return <button onClick={onClick} disabled={disabled}
    className={`${pad} rounded-theme-sm font-semibold border border-solid border-line-2 transition-all duration-[120ms] ${disabled?'text-ink-3 opacity-45 cursor-default':'text-ink opacity-100 cursor-pointer'}`}
    style={{background:color||'var(--surf2)',...style}}>{children}</button>;
}
function PillBtn({active,onClick,children,color}){
  return <button onClick={onClick}
    className={`px-[11px] py-[5px] rounded-pill border-none cursor-pointer text-[11px] font-bold transition-all duration-[120ms] whitespace-nowrap ${active?'text-white':'bg-surf-2 text-ink-2'}`}
    style={active?{background:color||'var(--purple)'}:undefined}>{children}</button>;
}
function Badge({label,color,bg}){
  return <span className="text-[10px] font-bold px-2 py-[2px] rounded-pill tracking-[.3px] whitespace-nowrap"
    style={{background:bg||'var(--surf3)',color:color||'var(--t2)'}}>{label}</span>;
}
function Inp({value,onChange,placeholder,type='text',style={},onKeyDown}){
  return <input type={type} value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder}
    className="w-full px-[11px] py-2 bg-base border border-solid border-line-2 rounded-theme-sm text-ink text-[13px] outline-none box-border" style={style}/>;
}
function Txta({value,onChange,placeholder,rows=3,style={}}){
  return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
    className="w-full px-[11px] py-2 bg-base border border-solid border-line-2 rounded-theme-sm text-ink text-[12px] outline-none resize-y box-border" style={style}/>;
}
function Sel({value,onChange,options,style={}}){
  return <select value={value} onChange={onChange}
    className="w-full px-[11px] py-2 bg-base border border-solid border-line-2 rounded-theme-sm text-ink text-[13px] outline-none box-border" style={style}>
    {options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
  </select>;
}
function Fld({label,children}){
  return <div><div className="text-[10px] text-ink-2 font-bold tracking-[.6px] mb-[5px] uppercase">{label}</div>{children}</div>;
}
function Av({emoji,size=32,color}){
  return <div className="rounded-[50%] flex items-center justify-center shrink-0 border border-solid border-line-2"
    style={{width:size,height:size,fontSize:size*.44,background:color||'var(--surf3)'}}>{emoji||'🎵'}</div>;
}
function Empty({icon,title,sub}){
  return <div className="text-center py-9 px-4 text-ink-3">
    <div className="text-[32px] mb-2 opacity-40">{icon}</div>
    <div className="text-[13px] font-bold text-ink-2 mb-1">{title}</div>
    {sub&&<div className="text-[11px] text-ink-3 max-w-[220px] mx-auto leading-[1.6]">{sub}</div>}
  </div>;
}

// ════════════════════════════════════════════════════
//  SHARED UI  —  Tonstudio
//  Die Klassen nutzen die Theme-Tokens aus
//  js/core/tailwind-config.js (bg-surf, text-ink-2, …),
//  dynamische Werte (Props wie color/size) bleiben inline.
//  Ein uebergebenes style={{…}} ueberschreibt weiterhin alles.
// ════════════════════════════════════════════════════

// Flaeche mit Haarlinie. `accent` setzt statt des alten Glows den
// Akzentstreifen links — die einzige Hervorhebung, die das Design kennt.
function Card({children,style={},glow,accent,className=''}){
  const hi = glow||accent;
  return <div className={`bg-surf border p-4 rounded-theme ${hi?'border-line-2':'border-line'} ${className}`}
    style={hi?{borderLeft:'2px solid var(--accent)',...style}:style}>{children}</div>;
}

// Vier Auspraegungen: default (Umriss), accent (gefuellt), quiet (nur Text),
// danger (getoent). Hoehe 44px bei md/lg — Fingergroesse aus dem Entwurf.
function Btn({onClick,children,color,style={},disabled,size='md',variant='default',type='button',title}){
  const pad={sm:'px-2.5 py-1 text-[11px]',md:'px-3.5 py-2 text-[12.5px]',lg:'px-5 py-3 text-[13.5px]'}[size];
  const look={
    default:'bg-surf-2 border border-line-2 text-ink hover:border-accent',
    accent :'bg-accent border border-accent text-[#121114] hover:bg-accent-h hover:border-accent-h',
    quiet  :'bg-transparent border border-transparent text-ink-2 hover:text-ink',
    danger :'bg-transparent border border-line-2 text-danger hover:border-danger',
  }[variant];
  return <button type={type} title={title} onClick={onClick} disabled={disabled}
    className={`${pad} ${look} rounded-theme-sm font-semibold transition-colors duration-100 inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${disabled?'opacity-40 cursor-default':'cursor-pointer'}`}
    style={color?{background:color,borderColor:color,...style}:style}>{children}</button>;
}

// Filterreiter. Im Entwurf sind das keine Pillen mehr, sondern
// Mono-Labels mit Unterstrich — deshalb `rounded-none` trotz des Namens.
function PillBtn({active,onClick,children,color}){
  return <button onClick={onClick}
    className={`lab whitespace-nowrap shrink-0 px-3 py-2.5 border-b-2 bg-transparent cursor-pointer transition-colors duration-100 ${active?'border-accent':'border-transparent hover:text-ink-2'}`}
    style={{color:active?(color||'var(--accent)'):'var(--t3)',borderBottomColor:active?(color||'var(--accent)'):'transparent'}}>
    {children}
  </button>;
}

// Kleine Plakette. Ohne Fuellung, wenn keine angegeben ist — im Entwurf
// traegt fast alles nur eine Haarlinie.
function Badge({label,color,bg}){
  if(!label) return null;
  return <span className="text-[10px] font-semibold px-[7px] py-[2px] rounded-theme-sm whitespace-nowrap border"
    style={{background:bg||'transparent',color:color||'var(--t2)',borderColor:bg?'transparent':'var(--border2)'}}>{label}</span>;
}

const FIELD_CLS='w-full px-3 py-2.5 bg-base border border-line-2 rounded-theme-sm text-ink text-[13px] outline-none box-border placeholder:text-ink-3 focus:border-accent transition-colors duration-100';

function Inp({value,onChange,placeholder,type='text',style={},onKeyDown,disabled}){
  return <input type={type} value={value} onChange={onChange} onKeyDown={onKeyDown} disabled={disabled}
    placeholder={placeholder} className={FIELD_CLS} style={style}/>;
}
function Txta({value,onChange,placeholder,rows=3,style={}}){
  return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
    className={`${FIELD_CLS} resize-y leading-[1.5]`} style={style}/>;
}
function Sel({value,onChange,options,style={}}){
  return <select value={value} onChange={onChange} className={`${FIELD_CLS} cursor-pointer`} style={style}>
    {options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
  </select>;
}
function Fld({label,children,hint}){
  return <div>
    <div className="lab text-ink-3 mb-[6px]">{label}</div>
    {children}
    {hint&&<div className="text-[10.5px] text-ink-3 mt-1">{hint}</div>}
  </div>;
}

// Initialen statt Emoji. `name` ist die Quelle, `role` faerbt den Kreis.
// (Das Feld users.avatar wird nicht mehr gelesen, aber auch nicht geloescht.)
function Av({name,role,size=32,color,style={}}){
  const c = color||ROLE_COLORS[role]||'#8E8A93';
  return <div className="rounded-pill flex items-center justify-center shrink-0 font-bold uppercase"
    style={{width:size,height:size,fontSize:Math.max(8,Math.round(size*.34)),
      fontFamily:'var(--f-mono)',letterSpacing:'.02em',
      background:hexa(c,.16),color:c,...style}}>{initials(name)}</div>;
}

// Abschnittsueberschrift — das Mono-Label mit durchlaufender Haarlinie
// aus dem Entwurf (STROPHE 1 ────── 0:00).
function SectionLabel({children,right,color}){
  return <div className="flex items-center gap-2.5 mb-3">
    <span className="lab" style={{color:color||'var(--accent)'}}>{children}</span>
    <div className="grow h-px bg-line-2"/>
    {right&&<span className="lab text-ink-3">{right}</span>}
  </div>;
}

function Empty({icon,title,sub}){
  return <div className="text-center py-10 px-4 border border-dashed border-line-2 rounded-theme">
    <div className="text-[13px] font-semibold text-ink-2">{title}</div>
    {sub&&<div className="text-[11.5px] text-ink-3 max-w-[260px] mx-auto leading-[1.6] mt-1.5">{sub}</div>}
  </div>;
}

// Seitenkopf: Archivo-Versalien links, Zaehler/Aktionen rechts.
function PageHead({title,count,children}){
  return <div className="flex items-end justify-between gap-3 px-4 md:px-8 pt-5 md:pt-8 pb-4">
    <h1 className="disp text-[26px] md:text-[32px] uppercase">{title}</h1>
    <div className="flex items-center gap-2 pb-[3px]">
      {children}
      {count!=null&&<span className="num text-[11px] text-ink-3">{count}</span>}
    </div>
  </div>;
}

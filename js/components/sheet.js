// ════════════════════════════════════════════════════
//  SHEET VIEW
//  Der gerenderte Text mit Akkorden. Wird an drei Stellen
//  gebraucht: im Blatt, in der Vorschau beim Bearbeiten und
//  im Singen-Modus — deshalb liegt er hier und nicht in einer
//  der Seiten.
//
//  `onMark` schaltet das Markieren per Textauswahl frei:
//  Text im Blatt auswaehlen -> kleines Menue -> Atem/Halten.
//  `afterLine` haengt beliebiges unter eine Zeile (die Notizen).
// ════════════════════════════════════════════════════
function SheetView({rows, tp, showChords=true, fontPx=16.5, onMark, afterLine, onLineClick, activeLine}){
  const[pop,setPop]=useState(null);
  const box=useRef(null);

  // Auswahl -> betroffene Einheiten einer Zeile bestimmen.
  // Markierungen gelten immer fuer ganze Einheiten; auf halbe Silben
  // laesst sich das Quellformat nicht abbilden.
  const readSelection=()=>{
    if(!onMark) return;
    const s=window.getSelection();
    if(!s||s.isCollapsed||!s.rangeCount){ setPop(null); return; }
    const ua=s.anchorNode?.parentElement?.closest?.('[data-u]');
    const ub=s.focusNode?.parentElement?.closest?.('[data-u]');
    if(!ua||!ub){ setPop(null); return; }
    const la=ua.closest('[data-line]'), lb=ub.closest('[data-line]');
    if(!la||!lb||la!==lb){ setPop(null); return; }   // nur innerhalb einer Zeile
    const i=+ua.dataset.u, j=+ub.dataset.u;
    const r=s.getRangeAt(0).getBoundingClientRect();
    setPop({raw:+la.dataset.line, from:Math.min(i,j), to:Math.max(i,j),
            x:r.left+r.width/2, y:r.top});
  };

  const apply=mark=>{
    if(pop) onMark(pop.raw,pop.from,pop.to,mark);
    window.getSelection()?.removeAllRanges();
    setPop(null);
  };

  useEffect(()=>{
    if(!onMark) return;
    const away=e=>{ if(!e.target.closest?.('[data-markmenu]')&&!box.current?.contains(e.target)) setPop(null); };
    document.addEventListener('mousedown',away);
    return()=>document.removeEventListener('mousedown',away);
  },[onMark]);

  return <div ref={box} onMouseUp={readSelection} onTouchEnd={readSelection}>
    {rows.map((r,i)=>{
      if(r.type==='gap')     return <div key={i} className="h-3"/>;
      if(r.type==='section') return <div key={i} className="mt-5 first:mt-0">
        <SectionLabel right={r.time}>{r.label}</SectionLabel></div>;
      if(r.type==='hint')    return <div key={i} className="px-3 py-2 my-2 rail-a text-[11.5px] text-ink-2 leading-[1.45]">{r.text}</div>;

      return <div key={i}>
        <div data-line={r.raw}
          onClick={()=>onLineClick&&onLineClick(r)}
          className={`flex flex-wrap items-end mb-3 ${onLineClick?'cursor-pointer':''}`}
          style={activeLine===r.index?{background:'var(--surf)',boxShadow:'0 0 0 4px var(--surf)'}:undefined}>
          {r.units.map((u,j)=>
            <span key={j} data-u={j} className="flex flex-col">
              {showChords&&<span className="num h-[15px] whitespace-pre"
                style={{fontSize:Math.max(10,Math.round(fontPx*.66)),color:'var(--accent)'}}>
                {u.chord?(tp?tp(u.chord):u.chord):''}</span>}
              <span className="whitespace-pre" style={{
                fontSize:fontPx, lineHeight:1.25, color:'var(--text)',
                boxShadow:u.mark==='atem'?`inset 0 -${Math.round(fontPx*.5)}px 0 rgba(229,160,60,.28)`
                         :u.mark==='halten'?`inset 0 -${Math.round(fontPx*.5)}px 0 rgba(111,169,107,.30)`:undefined,
              }}>{u.text}</span>
            </span>)}
        </div>
        {afterLine&&afterLine(r)}
      </div>;
    })}

    {pop&&<div data-markmenu
      className="fixed z-[300] flex bg-surf border border-line-2 shadow-lg"
      style={{left:pop.x,top:pop.y-46,transform:'translateX(-50%)'}}>
      {[['atem','Atem','rgba(229,160,60,.5)'],['halten','Halten','rgba(111,169,107,.5)']].map(([k,l,c])=>
        <button key={k} onClick={()=>apply(k)}
          className="flex items-center gap-2 px-3 h-10 cursor-pointer text-[12px] text-ink hover:bg-surf-2 border-r border-line">
          <span className="w-3.5 h-2" style={{background:c}}/>{l}
        </button>)}
      <button onClick={()=>apply(null)} title="Markierung entfernen"
        className="px-3 h-10 cursor-pointer text-ink-3 hover:text-ink"><Ic name="x" size={14} sw={2}/></button>
    </div>}
  </div>;
}

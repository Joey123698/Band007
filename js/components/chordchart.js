// ════════════════════════════════════════════════════
//  GRIFFBILD
//  Sattel oben, in der Regel drei Buende. Braucht ein Griff
//  vier (Uke G#m = 1342), waechst das Raster mit; liegt er
//  hoch, wandert das Fenster und der Bund wird beziffert.
// ════════════════════════════════════════════════════
function ChordDiagram({name, instrument='guitar', muted}){
  const frets = chordShape(name, instrument);
  const n = (SHAPES[instrument]||SHAPES.guitar).strings;
  const W = 6*2+(n-1)*9;
  const X = i => 6+i*9;

  const label = <span className="num text-[11px]"
    style={{color:muted?'var(--t2)':'var(--text)'}}>{name}</span>;

  // Ohne hinterlegten Griff nur den Namen zeigen — besser als ein falsches Bild.
  if(!frets || frets.length!==n) return <div className="flex flex-col items-center gap-1 shrink-0">
    {label}
    <div className="flex items-start justify-center" style={{width:W,height:52}}>
      <span className="lab text-ink-3 mt-3">—</span>
    </div>
  </div>;

  const played = frets.filter(f=>f>0);
  const lo = played.length?Math.min(...played):1;
  const hi = played.length?Math.max(...played):1;
  // Fenster erst verschieben, wenn der Griff nicht mehr in die Grundlage passt
  const base = hi>3 ? lo : 1;
  const rows = Math.max(3, hi-base+1);
  const H = 12+rows*12+4;
  const Y = f => 12+(f-base+1)*12-6;

  const line = 'var(--border2)';
  return <div className="flex flex-col items-center gap-1 shrink-0">
    {label}
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-label={`Griff ${name}`}>
      <g stroke={line} strokeWidth="1" strokeLinecap="square">
        {Array.from({length:n},(_,i)=><line key={'s'+i} x1={X(i)} y1="12" x2={X(i)} y2={12+rows*12}/>)}
        {Array.from({length:rows},(_,k)=>{const y=12+(k+1)*12;
          return <line key={'f'+k} x1={X(0)} y1={y} x2={X(n-1)} y2={y}/>;})}
      </g>

      {/* Sattel nur in der Grundlage; sonst sagt die Zahl, wo wir sind */}
      {base===1
        ? <line x1={X(0)} y1="12" x2={X(n-1)} y2="12" stroke="var(--t2)" strokeWidth="2.6"/>
        : <text x={X(n-1)+4} y="26" fill="var(--t3)" fontSize="7"
            fontFamily="var(--f-mono)" fontWeight="700">{base}</text>}

      {frets.map((f,i)=>{
        if(f===-1) return <g key={i} stroke="var(--t3)" strokeWidth="1.2" strokeLinecap="round">
          <line x1={X(i)-2.2} y1="5" x2={X(i)+2.2} y2="9"/>
          <line x1={X(i)+2.2} y1="5" x2={X(i)-2.2} y2="9"/></g>;
        if(f===0)  return <circle key={i} cx={X(i)} cy="7" r="2.2" fill="none" stroke="var(--t3)" strokeWidth="1.2"/>;
        return <circle key={i} cx={X(i)} cy={Y(f)} r="3.4" fill="var(--accent)"/>;
      })}
    </svg>
  </div>;
}

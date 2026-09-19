// ════════════════════════════════════════════════════
//  ICONS
//  Strichzeichnungen statt Emoji — gleiche Strichstaerke,
//  gleiches 24er-Raster, faerben sich ueber `color`.
//  Muss VOR ui.js geladen werden.
// ════════════════════════════════════════════════════
const ICON_PATHS = {
  home:     <path d="M3 10.5L12 4l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1z"/>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="1.5"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
  music:    <><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></>,
  idea:     <><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 00-3.5 10.9c.5.4.8 1 .8 1.6v.5h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0012 3z"/></>,
  user:     <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></>,
  search:   <><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></>,
  left:     <path d="M15 18l-6-6 6-6"/>,
  right:    <path d="M9 6l6 6-6 6"/>,
  down:     <path d="M6 9l6 6 6-6"/>,
  up:       <path d="M6 15l6-6 6 6"/>,
  plus:     <path d="M12 5v14M5 12h14"/>,
  x:        <path d="M6 6l12 12M18 6L6 18"/>,
  check:    <path d="M4 12.5l5 5L20 6.5"/>,
  clock:    <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  pin:      <><path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></>,
  list:     <path d="M4 7h11M4 12h16M4 17h8"/>,
  star:     <path d="M12 4l2.5 5.2 5.5.8-4 3.9 1 5.6-5-2.7-5 2.7 1-5.6-4-3.9 5.5-.8z"/>,
  trash:    <><path d="M4 7h16M10 7V5h4v2M6 7l1 13h10l1-13"/></>,
  pencil:   <><path d="M4 20h4L20 8l-4-4L4 16z"/><path d="M14 6l4 4"/></>,
  chat:     <path d="M21 12a8 8 0 01-8 8H4l2.2-3A8 8 0 1121 12z"/>,
  play:     <path d="M8 5l11 7-11 7z"/>,
  send:     <path d="M4 12h15M13 6l6 6-6 6"/>,
  alert:    <><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16.2v.1"/></>,
  logout:   <><path d="M15 5H6a1 1 0 00-1 1v12a1 1 0 001 1h9"/><path d="M13 12h8M18 8l4 4-4 4"/></>,
};

function Ic({name, size=18, color='currentColor', sw=1.7, fill=false, style={}}){
  const p = ICON_PATHS[name];
  if(!p) return null;
  return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"
    fill={fill?color:'none'} stroke={fill?'none':color} strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round"
    style={{flexShrink:0,display:'block',...style}}>{p}</svg>;
}

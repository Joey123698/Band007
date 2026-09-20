// ════════════════════════════════════════════════════
//  CONSTANTS
// ════════════════════════════════════════════════════
const DAYS_DE    = ['Mo','Di','Mi','Do','Fr','Sa','So'];
const HOURS      = [8,9,10,11,12,13,14,15,16,17,18,19,20,21];
// Ukulele und Cajón gehoerten von Anfang an hierher — die Band spielt beides.
// Ohne sie landeten die Leute bei „Sonstiges“.
const BAND_ROLES = ['Lead-Gesang','Background-Gesang','Lead-Gitarre','Rhythmusgitarre','Ukulele','Bass','Schlagzeug','Cajón','Percussion','Keyboard','Violine','Sonstiges'];
const SONG_ROLES = ['Lead-Gesang','Hintergrundgesang','Gitarren-Solo','Rhythmusgitarre','Bassline','Schlagzeug','Keyboard','Mix/Technik'];
const GENRES     = ['Pop','Rock','Indie','Jazz','R&B/Soul','Folk','Acoustic','Ballade','Alternative','K-Pop','Sonstiges'];

// Ab wie vielen Tagen gelten eingetragene Probenzeiten als veraltet.
// Wird im Probeplan und auf dem Dashboard gebraucht.
const STALE_DAYS = 10;

// Status. `bar` ist der 3px-Streifen links in den Listen, `color` die
// Textfarbe, `bg` der Hintergrund kleiner Plaketten. Feste Hex-Werte:
// die Statusfarben sind in allen Theme-Varianten dieselben.
const STATUS_MAP = {
  suggested:  {label:'Idee',        color:'#8E8A93', bar:'#3E3B45', bg:'rgba(62,59,69,.45)'},
  practicing: {label:'In Übung',    color:'#6E90C4', bar:'#6E90C4', bg:'rgba(110,144,196,.12)'},
  needs_work: {label:'Überarbeiten',color:'#C98A3E', bar:'#C98A3E', bg:'rgba(201,138,62,.12)'},
  ready:      {label:'Bühnenreif',  color:'#6FA96B', bar:'#6FA96B', bg:'rgba(111,169,107,.12)'},
};

// Rollenfarben. Gedaempft und im selben Helligkeitsband wie der Akzent —
// eine Mitgliederliste soll ruhig bleiben, nicht bunt.
const ROLE_COLORS = {
  'Lead-Gesang':'#D08A6A','Background-Gesang':'#B58A72','Lead-Gitarre':'#C9A45C',
  'Rhythmusgitarre':'#A89060','Ukulele':'#C9A45C','Bass':'#6E90C4',
  'Schlagzeug':'#8B7FA8','Cajón':'#8B7FA8','Percussion':'#9A8AA8',
  'Keyboard':'#6FA96B','Violine':'#C2606A','Sonstiges':'#8E8A93',
};

// Wird beim Registrieren noch in `users.avatar` geschrieben. Die
// Oberflaeche zeigt inzwischen Initialen (siehe `Av` in ui.js); das Feld
// bleibt erhalten, damit bestehende Datensaetze unveraendert gueltig sind.
const AVATARS = ['🎤','🎸','🥁','🎹','🎺','🎻','🎷','🪗','🦁','🐺','🦊','🐉','⚡','🔥','💎','🌙','🎵','🎶'];

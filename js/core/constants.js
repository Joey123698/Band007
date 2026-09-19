// ════════════════════════════════════════════════════
//  CONSTANTS
// ════════════════════════════════════════════════════
const DAYS_DE    = ['Mo','Di','Mi','Do','Fr','Sa','So'];
const HOURS      = [8,9,10,11,12,13,14,15,16,17,18,19,20,21];
const BAND_ROLES = ['Lead-Gesang','Background-Gesang','Lead-Gitarre','Rhythmusgitarre','Bass','Schlagzeug','Keyboard','Violine','Sonstiges'];
const SONG_ROLES = ['Lead-Gesang','Hintergrundgesang','Gitarren-Solo','Rhythmusgitarre','Bassline','Schlagzeug','Keyboard','Mix/Technik'];
const GENRES     = ['Pop','Rock','Indie','Jazz','R&B/Soul','Folk','Acoustic','Ballade','Alternative','K-Pop','Sonstiges'];
const STATUS_MAP = {
  suggested:  {label:'Vorschlag',           color:'#6366F1',bg:'rgba(99,102,241,.15)'},
  practicing: {label:'In Übung',            color:'#3B82F6',bg:'rgba(59,130,246,.15)'},
  needs_work: {label:'Überarbeitung nötig', color:'#F59E0B',bg:'rgba(245,158,11,.15)'},
  ready:      {label:'Bühnenreif',          color:'#10B981',bg:'rgba(16,185,129,.15)'},
};
const ROLE_COLORS = {'Lead-Gesang':'#EC4899','Background-Gesang':'#F472B6','Lead-Gitarre':'#8B5CF6','Rhythmusgitarre':'#A78BFA','Bass':'#06B6D4','Schlagzeug':'#F59E0B','Keyboard':'#10B981','Violine':'#EF4444','Sonstiges':'#9CA3AF'};
const AVATARS = ['🎤','🎸','🥁','🎹','🎺','🎻','🎷','🪗','🦁','🐺','🦊','🐉','⚡','🔥','💎','🌙','🎵','🎶'];

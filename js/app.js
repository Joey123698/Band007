// ════════════════════════════════════════════════════
//  MAIN APP
// ════════════════════════════════════════════════════
function App(){
  const[authState,setAuthState]=useState('checking');
  const[user,setUser]=useState(null);
  const[profile,setProfile]=useState(null);
  const[tab,setTab]=useState('dashboard');
  // Gesetzt = das Blatt dieses Songs liegt ueber der Songliste.
  const[openSongId,setOpenSongId]=useState(null);
  // Singen-Modus liegt ueber allem: {ids:[songId], i:0}. Er wird sowohl
  // aus einem Blatt als auch aus der Setliste einer Probe gestartet,
  // deshalb haengt er hier und nicht in einer der Seiten.
  const[perf,setPerf]=useState(null);
  const startPerf=useCallback(ids=>{
    const list=(Array.isArray(ids)?ids:[ids]).filter(Boolean);
    if(list.length) setPerf({ids:list,i:0});
  },[]);
  const[design,setDesign]=useState(()=>loadDesign());
  const[allSessions,setAllSessions]=useState([]);
  const[allSongs,setAllSongs]=useState([]);
  const[members,setMembers]=useState([]);
  const[bandName,setBandName]=useState('BAND NAME');

  useEffect(()=>{ applyDesign(design); },[design]);
  const handleDesignUpdate=useCallback(patch=>{
    setDesign(prev=>{ const n={...prev,...patch}; localStorage.setItem(DESIGN_LS,JSON.stringify(n)); applyDesign(n); return n; });
  },[]);

  useEffect(()=>{
    if(!hasConfig()){setAuthState('no-config');return;}
    if(!initFB()){setAuthState('no-config');return;}
    const u=auth.onAuthStateChanged(async user=>{
      if(user){
        setUser(user);
        const d=await db.collection('users').doc(user.uid).get();
        if(d.exists)setProfile({id:d.id,...d.data()});
        setAuthState('signed-in');
      }else{setAuthState('signed-out');}
    });
    return u;
  },[]);

  // Load all data globally — NO compound queries, all filter client-side
  // This prevents the need for Firestore composite indexes
  useEffect(()=>{
    if(authState!=='signed-in')return;
    const u1=db.collection('sessions').onSnapshot(s=>setAllSessions(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u2=db.collection('songs').onSnapshot(s=>{const songs=s.docs.map(d=>({id:d.id,...d.data()}));songs.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));setAllSongs(songs);});
    const u3=db.collection('users').onSnapshot(s=>setMembers(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u4=db.collection('settings').doc('main').onSnapshot(d=>{if(d.exists&&d.data().bandName)setBandName(d.data().bandName);});
    const u5=db.collection('users').doc(authState==='signed-in'&&user?.uid||'x').onSnapshot(d=>{if(d.exists)setProfile({id:d.id,...d.data()});});
    return()=>{u1();u2();u3();u4();u5();};
  },[authState,user]);

  if(authState==='checking')return <div className="min-h-screen flex items-center justify-center"><div className="spin"/></div>;
  if(authState==='no-config')return <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-3 text-center">
    <div className="lab text-accent">Einrichtung</div>
    <div className="disp text-[20px]">Firebase-Konfiguration fehlt</div>
    <div className="text-[13px] text-ink-2 max-w-[340px] leading-[1.6]">Trage deine Firebase-Konfiguration in <code className="text-accent">js/core/firebase-config.js</code> ein.</div>
  </div>;
  if(authState==='signed-out')return <AuthScreen/>;
  if(!profile)return <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-ink-2"><div className="spin"/><div className="lab">Profil wird geladen</div></div>;

  // Schiene links ab md, Leiste unten darunter. Gescrollt wird das
  // Dokument selbst — kein innerer Scroller, damit die Seite sich auf
  // jeder Breite normal verhaelt (Adressleiste, Tastatur, Zoom).
  // Tabwechsel schliesst ein offenes Blatt, sonst laege es spaeter
  // unsichtbar unter einem anderen Reiter.
  const goTab = t => { setOpenSongId(null); setTab(t); };
  // Direkt aus allSongs lesen, nicht kopieren — so schreibt das onSnapshot
  // aus app.js auch im Blatt durch.
  const openSong = openSongId ? allSongs.find(s=>s.id===openSongId) : null;
  // Geloeschte Songs aus einer alten Setliste fallen hier raus.
  const perfSongs = perf ? perf.ids.map(id=>allSongs.find(s=>s.id===id)).filter(Boolean) : [];

  return <div className="md:flex min-h-screen">
    <SideNav tab={tab} setTab={goTab} bandName={bandName}/>
    <main className="flex-1 min-w-0">
      <div className="w-full max-w-shell pb-[84px] md:pb-10">
        {tab==='dashboard'&&<DashboardPage user={user} profile={profile} allSessions={allSessions} allSongs={allSongs} members={members} bandName={bandName}/>}
        {tab==='schedule' &&<SchedulePage  user={user} profile={profile} allSessions={allSessions} allSongs={allSongs} members={members} onPerform={startPerf}/>}
        {tab==='songs'    &&(openSong
          ?<SongDetailPage song={openSong} user={user} profile={profile} members={members} onBack={()=>setOpenSongId(null)} onPerform={()=>startPerf(openSong.id)}/>
          :<SongsPage      user={user} profile={profile} allSongs={allSongs} members={members} onOpen={setOpenSongId}/>)}
        {tab==='profile'  &&<ProfilePage   user={user} profile={profile} setProfile={setProfile} design={design} onDesignUpdate={handleDesignUpdate} bandName={bandName} setBandName={setBandName}/>}
      </div>
    </main>
    <BottomNav tab={tab} setTab={goTab}/>

    {perf&&perfSongs.length>0&&<PerformanceMode songs={perfSongs} index={Math.min(perf.i,perfSongs.length-1)}
      onIndex={i=>setPerf(p=>({...p,i:Math.max(0,Math.min(i,perfSongs.length-1))}))}
      onClose={()=>setPerf(null)}/>}
  </div>;
}

applyDesign(loadDesign());
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

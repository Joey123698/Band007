// ════════════════════════════════════════════════════
//  MAIN APP
// ════════════════════════════════════════════════════
function App(){
  const[authState,setAuthState]=useState('checking');
  const[user,setUser]=useState(null);
  const[profile,setProfile]=useState(null);
  // Die Adresszeile ist der Zustand: welcher Reiter, welches Blatt, ob der
  // Singen-Modus offen ist. Dadurch tut die Zurueck-Taste das Erwartete.
  const[route,setRoute]=useState(parseRoute);
  useEffect(()=>{
    const on=()=>setRoute(parseRoute());
    window.addEventListener('hashchange',on);
    return()=>window.removeEventListener('hashchange',on);
  },[]);
  // Welcher Song im Singen-Modus gerade dran ist, bleibt lokal — sonst
  // fuellt jedes Weiterblaettern den Verlauf.
  const[perfIx,setPerfIx]=useState(0);
  // Merkt, ob wir selbst in den Singen-Modus navigiert sind. Nur dann ist
  // history.back() beim Schliessen richtig; bei einem geteilten Link
  // fuehrt es sonst von der Seite weg.
  const cameFromApp=useRef(false);

  const[design,setDesign]=useState(()=>loadDesign());
  const[allSessions,setAllSessions]=useState([]);
  const[allSongs,setAllSongs]=useState([]);
  const[members,setMembers]=useState([]);
  const[myAvail,setMyAvail]=useState(null);
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
    // Nur das eigene Dokument — fuer „Offen fuer dich“ auf dem Dashboard.
    // Das ganze Raster abonniert weiterhin nur schedule.js.
    const u6=db.collection('availability').doc(user?.uid||'x')
      .onSnapshot(d=>setMyAvail(d.exists?(d.data()||{}):{}));
    return()=>{u1();u2();u3();u4();u5();u6();};
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
  const tab = route.tab;
  // Direkt aus allSongs lesen, nicht kopieren — so schreibt das onSnapshot
  // aus app.js auch im Blatt durch.
  const openSong = route.songId ? allSongs.find(s=>s.id===route.songId) : null;

  // Singen-Modus: entweder ein Song oder die Setliste einer Probe.
  // Geloeschte Songs aus einer alten Setliste fallen hier raus.
  let perfIds = [];
  if(route.perf && openSong) perfIds = [openSong.id];
  else if(route.sessionPerf){
    const s = allSessions.find(x=>x.id===route.sessionPerf);
    perfIds = (s?.setlist||[]).map(x=>x.songId);
  }
  const perfSongs = perfIds.map(id=>allSongs.find(s=>s.id===id)).filter(Boolean);

  const enterPerf = path => { cameFromApp.current=true; setPerfIx(0); go(path); };
  const closePerf = () => {
    if(cameFromApp.current){ cameFromApp.current=false; history.back(); }
    else go(route.sessionPerf ? '#/probeplan' : `#/songs/${route.songId||''}`);
  };

  return <div className="md:flex min-h-screen">
    <SideNav tab={tab} setTab={t=>go(ROUTE_OF_TAB[t])} bandName={bandName}/>
    <main className="flex-1 min-w-0">
      <div className="w-full max-w-shell pb-[84px] md:pb-10">
        {tab==='dashboard'&&<DashboardPage user={user} profile={profile} allSessions={allSessions} allSongs={allSongs} members={members} bandName={bandName} myAvail={myAvail}/>}
        {tab==='schedule' &&<SchedulePage  user={user} profile={profile} allSessions={allSessions} allSongs={allSongs} members={members}
                              onPerform={id=>enterPerf(`#/probe/${id}/singen`)}/>}
        {tab==='songs'    &&(openSong
          ?<SongDetailPage song={openSong} user={user} profile={profile} members={members}
             onBack={()=>go('#/songs')} onPerform={()=>enterPerf(`#/songs/${openSong.id}/singen`)}/>
          :<SongsPage      user={user} profile={profile} allSongs={allSongs} members={members}
             initialFilter={route.filter} onOpen={id=>go(`#/songs/${id}`)}/>)}
        {tab==='profile'  &&<ProfilePage   user={user} profile={profile} setProfile={setProfile} design={design} onDesignUpdate={handleDesignUpdate} bandName={bandName} setBandName={setBandName}/>}
      </div>
    </main>
    <BottomNav tab={tab} setTab={t=>go(ROUTE_OF_TAB[t])}/>

    {perfSongs.length>0&&<PerformanceMode songs={perfSongs} index={Math.min(perfIx,perfSongs.length-1)}
      onIndex={i=>setPerfIx(Math.max(0,Math.min(i,perfSongs.length-1)))}
      onClose={closePerf}/>}
  </div>;
}

applyDesign(loadDesign());
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

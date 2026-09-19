// ════════════════════════════════════════════════════
//  MAIN APP
// ════════════════════════════════════════════════════
function App(){
  const[authState,setAuthState]=useState('checking');
  const[user,setUser]=useState(null);
  const[profile,setProfile]=useState(null);
  const[tab,setTab]=useState('dashboard');
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

  if(authState==='checking')return <div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center'}}><div className="spin"/></div>;
  if(authState==='no-config')return <div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',padding:24,flexDirection:'column',gap:14,textAlign:'center'}}><div style={{fontSize:36}}>⚙️</div><div style={{fontSize:16,fontWeight:700}}>Firebase-Konfiguration fehlt</div><div style={{fontSize:13,color:'var(--t2)',maxWidth:300,lineHeight:1.6}}>Öffne die HTML-Datei und füge deine Firebase-Konfiguration in den Bereich <code style={{color:'var(--purple)'}}>FIREBASE_CONFIG</code> ein.</div></div>;
  if(authState==='signed-out')return <AuthScreen/>;
  if(!profile)return <div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:10,color:'var(--t2)'}}><div className="spin"/><div style={{fontSize:12}}>Profil wird geladen...</div></div>;

  return <div style={{height:'100vh',display:'flex',flexDirection:'column'}}>
    <div style={{flex:1,overflowY:'auto'}}>
      {tab==='dashboard'&&<DashboardPage user={user} profile={profile} allSessions={allSessions} allSongs={allSongs} members={members} bandName={bandName}/>}
      {tab==='schedule' &&<SchedulePage  user={user} profile={profile} allSessions={allSessions} allSongs={allSongs} members={members}/>}
      {tab==='songs'    &&<SongsPage     user={user} profile={profile} allSongs={allSongs} members={members}/>}
      {tab==='suggest'  &&<SuggestPage   user={user} profile={profile} allSongs={allSongs}/>}
      {tab==='profile'  &&<ProfilePage   user={user} profile={profile} setProfile={setProfile} design={design} onDesignUpdate={handleDesignUpdate} bandName={bandName} setBandName={setBandName}/>}
    </div>
    <BottomNav tab={tab} setTab={setTab}/>
  </div>;
}

applyDesign(loadDesign());
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

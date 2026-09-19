// ════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════
function AuthScreen(){
  const[mode,setMode]=useState('login');
  const[email,setEmail]=useState('');
  const[pass,setPass]=useState('');
  const[name,setName]=useState('');
  const[role,setRole]=useState(BAND_ROLES[0]);
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState('');
  const submit=async()=>{
    if(!hasConfig()){setErr('Firebase-Konfiguration fehlt.');return;}
    setLoading(true);setErr('');
    try{
      if(mode==='login'){await auth.signInWithEmailAndPassword(email,pass);}
      else{
        if(!name.trim()){setErr('Name eingeben.');setLoading(false);return;}
        if(pass.length<6){setErr('Passwort muss mindestens 6 Zeichen haben.');setLoading(false);return;}
        const c=await auth.createUserWithEmailAndPassword(email,pass);
        await db.collection('users').doc(c.user.uid).set({displayName:name.trim(),email,role,avatar:AVATARS[Math.floor(Math.random()*AVATARS.length)],bio:'',skills:[],favoriteSongs:[],playableSongs:[],createdAt:firebase.firestore.FieldValue.serverTimestamp()});
      }
    }catch(e){setErr(e.code==='auth/wrong-password'?'Falsches Passwort.':e.code==='auth/user-not-found'?'E-Mail nicht gefunden.':e.code==='auth/email-already-in-use'?'E-Mail bereits registriert — bitte anmelden.':e.message||'Fehler.');}
    setLoading(false);
  };
  return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'radial-gradient(ellipse at 30% 20%,rgba(124,58,237,.14) 0%,transparent 60%)'}}>
    <div style={{width:'100%',maxWidth:370}}>
      <div style={{textAlign:'center',marginBottom:26}}>
        <div style={{fontSize:42,marginBottom:6}}>🎸</div>
        <div style={{fontSize:26,fontWeight:900,letterSpacing:-1,background:'linear-gradient(135deg,#8B5CF6,#EC4899)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>BandSync</div>
        <div style={{fontSize:11,color:'var(--t2)',marginTop:3}}>Interne Plattform für deine Band</div>
      </div>
      <Card glow>
        <div style={{display:'flex',gap:3,marginBottom:16,background:'var(--bg)',borderRadius:'var(--r-sm)',padding:3}}>
          {['login','register'].map(m=><button key={m} onClick={()=>{setMode(m);setErr('');}} style={{flex:1,padding:'8px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',fontSize:12,fontWeight:600,background:mode===m?'var(--surf2)':'transparent',color:mode===m?'var(--text)':'var(--t2)'}}>{m==='login'?'Anmelden':'Registrieren'}</button>)}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {mode==='register'&&<Fld label="Name"><Inp value={name} onChange={e=>setName(e.target.value)} placeholder="Dein Name..."/></Fld>}
          {mode==='register'&&<Fld label="Rolle"><Sel value={role} onChange={e=>setRole(e.target.value)} options={BAND_ROLES}/></Fld>}
          <Fld label="E-Mail"><Inp type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@band.de"/></Fld>
          <Fld label="Passwort (min. 6 Zeichen)"><Inp type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&submit()}/></Fld>
        </div>
        {err&&<div style={{marginTop:10,padding:'8px 11px',background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',borderRadius:'var(--r-sm)',fontSize:12,color:'var(--red)'}}>{err}</div>}
        <button onClick={submit} disabled={loading} style={{width:'100%',marginTop:12,padding:'11px',borderRadius:'var(--r)',border:'none',background:'linear-gradient(135deg,var(--purple),#5B21B6)',color:'#fff',fontWeight:700,fontSize:14,cursor:loading?'default':'pointer',opacity:loading?.7:1}}>
          {loading?'...':(mode==='login'?'Anmelden':'Konto erstellen')}
        </button>
      </Card>
    </div>
  </div>;
}

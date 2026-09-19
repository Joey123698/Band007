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
  return <div className="min-h-screen flex items-center justify-center p-5">
    <div className="w-full max-w-[380px]">
      <div className="mb-8">
        <div className="lab text-accent mb-3">Interne Plattform</div>
        <div className="disp text-[40px] uppercase text-ink">BandSync</div>
        <div className="text-[12px] text-ink-2 mt-2">Probeplan, Repertoire und Rollen an einem Ort.</div>
      </div>

      {/* Zwei Reiter als Segmente, nicht als Pillen */}
      <div className="flex border-b border-line-2 mb-6">
        {[['login','Anmelden'],['register','Registrieren']].map(([m,l])=>
          <button key={m} onClick={()=>{setMode(m);setErr('');}}
            className="lab px-4 py-3 border-b-2 cursor-pointer -mb-px transition-colors duration-100"
            style={{color:mode===m?'var(--accent)':'var(--t3)',borderBottomColor:mode===m?'var(--accent)':'transparent'}}>{l}</button>)}
      </div>

      <div className="flex flex-col gap-4">
        {mode==='register'&&<Fld label="Name"><Inp value={name} onChange={e=>setName(e.target.value)} placeholder="Dein Name …"/></Fld>}
        {mode==='register'&&<Fld label="Rolle"><Sel value={role} onChange={e=>setRole(e.target.value)} options={BAND_ROLES}/></Fld>}
        <Fld label="E-Mail"><Inp type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@band.de"/></Fld>
        <Fld label="Passwort" hint={mode==='register'?'Mindestens 6 Zeichen':null}>
          <Inp type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&submit()}/>
        </Fld>
      </div>

      {err&&<div className="mt-4 px-3 py-2.5 text-[12px] text-danger rail-a" style={{borderLeftColor:'var(--danger)'}}>{err}</div>}

      <button onClick={submit} disabled={loading}
        className="w-full mt-6 h-12 rounded-theme-sm font-bold text-[13.5px] bg-accent hover:bg-accent-h transition-colors duration-100"
        style={{color:'#121114',cursor:loading?'default':'pointer',opacity:loading?.6:1}}>
        {loading?'…':(mode==='login'?'Anmelden':'Konto erstellen')}
      </button>
    </div>
  </div>;
}

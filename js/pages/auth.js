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
  return <div className="min-h-screen flex items-center justify-center p-5" style={{background:'radial-gradient(ellipse at 30% 20%,rgba(124,58,237,.14) 0%,transparent 60%)'}}>
    <div className="w-full max-w-[370px]">
      <div className="text-center mb-[26px]">
        <div className="text-[42px] mb-1.5">🎸</div>
        <div className="text-[26px] font-black tracking-[-1px]" style={{background:'linear-gradient(135deg,#8B5CF6,#EC4899)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>BandSync</div>
        <div className="text-[11px] text-ink-2 mt-[3px]">Interne Plattform für deine Band</div>
      </div>
      <Card glow>
        <div className="flex gap-[3px] mb-4 bg-base rounded-theme-sm p-[3px]">
          {['login','register'].map(m=><button key={m} onClick={()=>{setMode(m);setErr('');}}
            className="flex-1 p-2 rounded-theme-sm border-none cursor-pointer text-[12px] font-semibold"
            style={{background:mode===m?'var(--surf2)':'transparent',color:mode===m?'var(--text)':'var(--t2)'}}>{m==='login'?'Anmelden':'Registrieren'}</button>)}
        </div>
        <div className="flex flex-col gap-2.5">
          {mode==='register'&&<Fld label="Name"><Inp value={name} onChange={e=>setName(e.target.value)} placeholder="Dein Name..."/></Fld>}
          {mode==='register'&&<Fld label="Rolle"><Sel value={role} onChange={e=>setRole(e.target.value)} options={BAND_ROLES}/></Fld>}
          <Fld label="E-Mail"><Inp type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@band.de"/></Fld>
          <Fld label="Passwort (min. 6 Zeichen)"><Inp type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&submit()}/></Fld>
        </div>
        {err&&<div className="mt-2.5 px-[11px] py-2 border rounded-theme-sm text-[12px] text-brand-red"
          style={{background:'rgba(239,68,68,.1)',borderColor:'rgba(239,68,68,.3)'}}>{err}</div>}
        <button onClick={submit} disabled={loading} className="w-full mt-3 p-[11px] rounded-theme border-none text-white font-bold text-[14px]"
          style={{background:'linear-gradient(135deg,var(--purple),#5B21B6)',cursor:loading?'default':'pointer',opacity:loading?.7:1}}>
          {loading?'...':(mode==='login'?'Anmelden':'Konto erstellen')}
        </button>
      </Card>
    </div>
  </div>;
}

// ════════════════════════════════════════════════════
//  PROFILE PAGE
// ════════════════════════════════════════════════════
function ProfilePage({user,profile,setProfile,design,onDesignUpdate,bandName,setBandName}){
  const[ptab,setPtab]=useState('info');
  const[edit,setEdit]=useState(false);
  const[form,setForm]=useState(null);
  const[saving,setSaving]=useState(false);
  const[skillIn,setSkillIn]=useState('');
  const[addPS,setAddPS]=useState({title:'',artist:'',roles:[]});
  const[addFav,setAddFav]=useState({title:'',artist:''});

  useEffect(()=>{if(profile)setForm({...profile});},[profile]);
  const save=async()=>{setSaving(true);await db.collection('users').doc(user.uid).update({displayName:form.displayName,role:form.role,bio:form.bio,avatar:form.avatar,skills:form.skills||[]});setProfile(p=>({...p,...form}));setEdit(false);setSaving(false);};
  const addSkill=()=>{if(!skillIn.trim())return;setForm(p=>({...p,skills:[...(p.skills||[]),skillIn.trim()]}));setSkillIn('');};
  const rmSkill=i=>setForm(p=>({...p,skills:p.skills.filter((_,j)=>j!==i)}));
  const addPlayable=async()=>{if(!addPS.title||!addPS.artist)return;const l=[...(profile.playableSongs||[]),{id:uid(),...addPS}];await db.collection('users').doc(user.uid).update({playableSongs:l});setProfile(p=>({...p,playableSongs:l}));setAddPS({title:'',artist:'',roles:[]});};
  const rmPlayable=async id=>{const l=(profile.playableSongs||[]).filter(s=>s.id!==id);await db.collection('users').doc(user.uid).update({playableSongs:l});setProfile(p=>({...p,playableSongs:l}));};
  const addFavorite=async()=>{if(!addFav.title||!addFav.artist)return;const l=[...(profile.favoriteSongs||[]),{id:uid(),...addFav}];await db.collection('users').doc(user.uid).update({favoriteSongs:l});setProfile(p=>({...p,favoriteSongs:l}));setAddFav({title:'',artist:''});};
  const rmFav=async id=>{const l=(profile.favoriteSongs||[]).filter(s=>s.id!==id);await db.collection('users').doc(user.uid).update({favoriteSongs:l});setProfile(p=>({...p,favoriteSongs:l}));};
  const saveBandName=async()=>{await db.collection('settings').doc('main').set({bandName},{merge:true});};

  if(!profile||!form)return <div style={{display:'flex',justifyContent:'center',padding:40}}><div className="spin"/></div>;

  const PTABS=[{k:'info',l:'Profil'},{k:'music',l:'Musik'},{k:'design',l:'🎨 Design'},{k:'band',l:'⚙️ Band'}];
  return <div style={{padding:'16px 16px 90px'}}>
    {/* Profile header */}
    <div style={{position:'relative',borderRadius:'var(--r-lg)',overflow:'hidden',marginBottom:14,background:'linear-gradient(135deg,rgba(50,0,80,.6) 0%,var(--surf) 100%)',padding:'20px 16px'}}>
      <div style={{position:'absolute',top:-20,right:-20,width:100,height:100,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,58,237,.25) 0%,transparent 70%)'}}/>
      <div style={{display:'flex',alignItems:'center',gap:14,position:'relative'}}>
        <div style={{width:58,height:58,borderRadius:'50%',background:(ROLE_COLORS[profile.role]||'#888')+'33',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,border:'2px solid var(--purple)'}}>
          {profile.avatar||'🎵'}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:19,fontWeight:800}}>{profile.displayName}</div>
          <div style={{fontSize:12,color:ROLE_COLORS[profile.role]||'var(--t2)',fontWeight:600,marginTop:2}}>{profile.role}</div>
          {profile.skills?.length>0&&<div style={{display:'flex',gap:3,flexWrap:'wrap',marginTop:6}}>{profile.skills.slice(0,3).map((s,i)=><Badge key={i} label={s} color='var(--purple)' bg='rgba(124,58,237,.12)'/>)}</div>}
        </div>
        <button onClick={()=>{setEdit(true);setPtab('info');}} style={{background:'var(--surf2)',border:'1px solid var(--border2)',borderRadius:'var(--r-sm)',color:'var(--t2)',padding:'6px 10px',cursor:'pointer',fontSize:11,fontWeight:600}}>✏️ Bearbeiten</button>
      </div>
      {profile.bio&&<div style={{marginTop:12,fontSize:12,color:'var(--t2)',lineHeight:1.6,padding:'8px 10px',background:'rgba(0,0,0,.25)',borderRadius:'var(--r-sm)',position:'relative'}}>{profile.bio}</div>}
    </div>
    <div style={{display:'flex',gap:5,marginBottom:14,overflowX:'auto',paddingBottom:2}}>
      {PTABS.map(t=><PillBtn key={t.k} active={ptab===t.k} onClick={()=>setPtab(t.k)}>{t.l}</PillBtn>)}
    </div>

    {ptab==='info'&&(edit?<Card>
      <div style={{fontSize:10,fontWeight:700,color:'var(--purple)',marginBottom:8}}>AVATAR</div>
      <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:12}}>{AVATARS.map(e=><button key={e} onClick={()=>setForm(p=>({...p,avatar:e}))} style={{fontSize:20,padding:4,borderRadius:'var(--r-sm)',border:`2px solid ${form.avatar===e?'var(--purple)':'transparent'}`,background:'transparent',cursor:'pointer'}}>{e}</button>)}</div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <Fld label="Name"><Inp value={form.displayName} onChange={e=>setForm(p=>({...p,displayName:e.target.value}))}/></Fld>
        <Fld label="Rolle"><Sel value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))} options={BAND_ROLES}/></Fld>
        <Fld label="Über mich"><Txta value={form.bio||''} onChange={e=>setForm(p=>({...p,bio:e.target.value}))} placeholder="Stil, Einflüsse, Träume..." rows={3}/></Fld>
        <Fld label={`Fähigkeiten (${form.skills?.length||0})`}>
          <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:6}}>{(form.skills||[]).map((s,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:3,padding:'3px 8px',borderRadius:'var(--r-pill)',background:'rgba(124,58,237,.15)',border:'1px solid rgba(124,58,237,.3)'}}><span style={{fontSize:11,color:'var(--purple)'}}>{s}</span><button onClick={()=>rmSkill(i)} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:12}}>×</button></div>)}</div>
          <div style={{display:'flex',gap:5}}><Inp value={skillIn} onChange={e=>setSkillIn(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addSkill()} placeholder="Fähigkeit..." style={{fontSize:12}}/><Btn onClick={addSkill} size="sm">+</Btn></div>
        </Fld>
      </div>
      <div style={{display:'flex',gap:7,marginTop:12,justifyContent:'flex-end'}}>
        <Btn onClick={()=>{setEdit(false);setForm({...profile});}} style={{color:'var(--t2)'}}>Abbrechen</Btn>
        <Btn onClick={save} disabled={saving} style={{background:'linear-gradient(135deg,var(--purple),#5B21B6)',color:'#fff',border:'none'}}>{saving?'Speichern...':'Änderungen speichern'}</Btn>
      </div>
    </Card>:<div style={{color:'var(--t2)',fontSize:13,textAlign:'center',padding:'10px 0'}}>Profil-Daten oben sichtbar. <span onClick={()=>setEdit(true)} style={{color:'var(--purple)',cursor:'pointer',fontWeight:600}}>Bearbeiten →</span></div>)}

    {ptab==='music'&&<>
      <div style={{fontSize:11,fontWeight:700,color:'var(--t2)',letterSpacing:.5,textTransform:'uppercase',marginBottom:10}}>Spielbare Songs</div>
      {(profile.playableSongs||[]).map(s=><Card key={s.id} style={{marginBottom:7,padding:'10px 13px'}}>
        <div style={{display:'flex',alignItems:'center',gap:9}}>
          <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{s.title}</div><div style={{fontSize:11,color:'var(--t2)'}}>{s.artist}</div>{s.roles?.length>0&&<div style={{display:'flex',gap:3,marginTop:4,flexWrap:'wrap'}}>{s.roles.map((r,i)=><Badge key={i} label={r} color='var(--cyan)' bg='rgba(6,182,212,.1)'/>)}</div>}</div>
          <button onClick={()=>rmPlayable(s.id)} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:17}}>×</button>
        </div>
      </Card>)}
      <Card style={{marginBottom:18}}>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <Inp value={addPS.title} onChange={e=>setAddPS(p=>({...p,title:e.target.value}))} placeholder="Songname..."/>
            <Inp value={addPS.artist} onChange={e=>setAddPS(p=>({...p,artist:e.target.value}))} placeholder="Künstler..."/>
          </div>
          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>{SONG_ROLES.map(r=><button key={r} onClick={()=>setAddPS(p=>({...p,roles:p.roles.includes(r)?p.roles.filter(x=>x!==r):[...p.roles,r]}))} style={{padding:'3px 8px',borderRadius:'var(--r-sm)',border:`1px solid ${addPS.roles.includes(r)?'var(--purple)':'var(--border)'}`,background:addPS.roles.includes(r)?'rgba(124,58,237,.15)':'transparent',color:addPS.roles.includes(r)?'var(--purple)':'var(--t3)',fontSize:11,cursor:'pointer'}}>{r}</button>)}</div>
          <Btn onClick={addPlayable} size="sm" style={{alignSelf:'flex-end'}}>+ Song hinzufügen</Btn>
        </div>
      </Card>
      <div style={{fontSize:11,fontWeight:700,color:'var(--t2)',letterSpacing:.5,textTransform:'uppercase',marginBottom:10}}>Lieblingslieder</div>
      {(profile.favoriteSongs||[]).map(s=><Card key={s.id} style={{marginBottom:6,padding:'9px 13px',display:'flex',alignItems:'center',gap:9}}>
        <span style={{fontSize:15}}>♥️</span>
        <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{s.title}</div><div style={{fontSize:11,color:'var(--t2)'}}>{s.artist}</div></div>
        <button onClick={()=>rmFav(s.id)} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:17}}>×</button>
      </Card>)}
      <Card><div style={{display:'flex',gap:6}}>
        <Inp value={addFav.title} onChange={e=>setAddFav(p=>({...p,title:e.target.value}))} placeholder="Lieblingstitel..."/>
        <Inp value={addFav.artist} onChange={e=>setAddFav(p=>({...p,artist:e.target.value}))} placeholder="Künstler..."/>
        <Btn onClick={addFavorite} size="sm" style={{flexShrink:0}}>+</Btn>
      </div></Card>
    </>}

    {ptab==='design'&&<>
      <div style={{fontSize:11,fontWeight:700,color:'var(--t2)',letterSpacing:.5,textTransform:'uppercase',marginBottom:10}}>Farbschema</div>
      <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:16}}>
        {Object.entries(THEMES).map(([name,t])=><button key={name} onClick={()=>onDesignUpdate({theme:name})} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:'var(--r-sm)',border:`1px solid ${design.theme===name?t.purple:'var(--border)'}`,background:design.theme===name?t.surf:'var(--surf2)',cursor:'pointer',textAlign:'left'}}>
          <div style={{display:'flex',gap:4}}>{[t.purple,t.gold,t.green,t.pink].map((c,i)=><div key={i} style={{width:10,height:10,borderRadius:'50%',background:c}}/>)}</div>
          <span style={{fontSize:13,fontWeight:600,color:design.theme===name?t.text:'var(--t2)'}}>{name}</span>
          {design.theme===name&&<span style={{marginLeft:'auto',fontSize:10,color:t.purple,fontWeight:700}}>✓ Aktiv</span>}
        </button>)}
      </div>
      <div style={{fontSize:11,fontWeight:700,color:'var(--t2)',letterSpacing:.5,textTransform:'uppercase',marginBottom:8}}>Ecken — {design.radius}px</div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
        <span style={{fontSize:10,color:'var(--t3)',flexShrink:0}}>Eckig</span>
        <input type="range" min="0" max="20" value={design.radius} onChange={e=>onDesignUpdate({radius:+e.target.value})}/>
        <span style={{fontSize:10,color:'var(--t3)',flexShrink:0}}>Rund</span>
        <div style={{width:28,height:28,border:'2px solid var(--purple)',borderRadius:`${design.radius}px`,flexShrink:0}}/>
      </div>
      <div style={{fontSize:11,fontWeight:700,color:'var(--t2)',letterSpacing:.5,textTransform:'uppercase',marginBottom:8}}>Schriftart</div>
      <div style={{display:'flex',flexDirection:'column',gap:5}}>
        {Object.entries(FONTS).map(([name,f])=><button key={name} onClick={()=>onDesignUpdate({font:name})} style={{padding:'9px 13px',borderRadius:'var(--r-sm)',border:`1px solid ${design.font===name?'var(--purple)':'var(--border)'}`,background:design.font===name?'rgba(124,58,237,.1)':'var(--surf2)',color:design.font===name?'var(--text)':'var(--t2)',fontFamily:f,fontSize:14,fontWeight:600,cursor:'pointer',textAlign:'left',display:'flex',justifyContent:'space-between'}}>
          <span>{name} — <span style={{fontWeight:400,fontSize:12}}>BandSync Probe</span></span>
          {design.font===name&&<span style={{fontSize:10,color:'var(--purple)',fontWeight:700}}>✓</span>}
        </button>)}
      </div>
    </>}

    {ptab==='band'&&<Card>
      <div style={{fontSize:11,fontWeight:700,color:'var(--t2)',letterSpacing:.5,textTransform:'uppercase',marginBottom:10}}>Band-Name (im Dashboard)</div>
      <div style={{display:'flex',gap:7}}>
        <Inp value={bandName} onChange={e=>setBandName(e.target.value)} placeholder="Name deiner Band..."/>
        <Btn onClick={saveBandName} style={{background:'var(--purple)',color:'#fff',border:'none',flexShrink:0}}>Speichern</Btn>
      </div>
      <div style={{marginTop:20,paddingTop:16,borderTop:'1px solid var(--border)'}}>
        <button onClick={()=>auth.signOut()} style={{width:'100%',padding:'11px',borderRadius:'var(--r)',border:'1px solid var(--border2)',background:'transparent',color:'var(--t2)',fontSize:13,cursor:'pointer'}}>Abmelden</button>
      </div>
    </Card>}
  </div>;
}

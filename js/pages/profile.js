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

  if(!profile||!form)return <div className="flex justify-center p-10"><div className="spin"/></div>;

  const PTABS=[{k:'info',l:'Profil'},{k:'music',l:'Musik'},{k:'design',l:'🎨 Design'},{k:'band',l:'⚙️ Band'}];
  return <div className="px-4 pt-4 pb-[90px]">
    {/* Profile header */}
    <div className="relative rounded-theme-lg overflow-hidden mb-[14px] px-4 py-5" style={{background:'linear-gradient(135deg,rgba(50,0,80,.6) 0%,var(--surf) 100%)'}}>
      <div className="absolute -top-5 -right-5 w-[100px] h-[100px] rounded-[50%]" style={{background:'radial-gradient(circle,rgba(124,58,237,.25) 0%,transparent 70%)'}}/>
      <div className="flex items-center gap-[14px] relative">
        <div className="w-[58px] h-[58px] rounded-[50%] flex items-center justify-center text-[28px] border-2 border-brand-purple"
          style={{background:(ROLE_COLORS[profile.role]||'#888')+'33'}}>
          {profile.avatar||'🎵'}
        </div>
        <div className="flex-1">
          <div className="text-[19px] font-extrabold">{profile.displayName}</div>
          <div className="text-[12px] font-semibold mt-0.5" style={{color:ROLE_COLORS[profile.role]||'var(--t2)'}}>{profile.role}</div>
          {profile.skills?.length>0&&<div className="flex gap-[3px] flex-wrap mt-1.5">{profile.skills.slice(0,3).map((s,i)=><Badge key={i} label={s} color='var(--purple)' bg='rgba(124,58,237,.12)'/>)}</div>}
        </div>
        <button onClick={()=>{setEdit(true);setPtab('info');}} className="bg-surf-2 border border-line-2 rounded-theme-sm text-ink-2 px-2.5 py-1.5 cursor-pointer text-[11px] font-semibold">✏️ Bearbeiten</button>
      </div>
      {profile.bio&&<div className="mt-3 text-[12px] text-ink-2 leading-[1.6] px-2.5 py-2 rounded-theme-sm relative" style={{background:'rgba(0,0,0,.25)'}}>{profile.bio}</div>}
    </div>
    <div className="flex gap-[5px] mb-[14px] overflow-x-auto pb-0.5">
      {PTABS.map(t=><PillBtn key={t.k} active={ptab===t.k} onClick={()=>setPtab(t.k)}>{t.l}</PillBtn>)}
    </div>

    {ptab==='info'&&(edit?<Card>
      <div className="text-[10px] font-bold text-brand-purple mb-2">AVATAR</div>
      <div className="flex gap-1 flex-wrap mb-3">{AVATARS.map(e=><button key={e} onClick={()=>setForm(p=>({...p,avatar:e}))} className="text-[20px] p-1 rounded-theme-sm border-2 bg-transparent cursor-pointer" style={{borderColor:form.avatar===e?'var(--purple)':'transparent'}}>{e}</button>)}</div>
      <div className="flex flex-col gap-2.5">
        <Fld label="Name"><Inp value={form.displayName} onChange={e=>setForm(p=>({...p,displayName:e.target.value}))}/></Fld>
        <Fld label="Rolle"><Sel value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))} options={BAND_ROLES}/></Fld>
        <Fld label="Über mich"><Txta value={form.bio||''} onChange={e=>setForm(p=>({...p,bio:e.target.value}))} placeholder="Stil, Einflüsse, Träume..." rows={3}/></Fld>
        <Fld label={`Fähigkeiten (${form.skills?.length||0})`}>
          <div className="flex gap-1 flex-wrap mb-1.5">{(form.skills||[]).map((s,i)=><div key={i} className="flex items-center gap-[3px] px-2 py-[3px] rounded-pill border" style={{background:'rgba(124,58,237,.15)',borderColor:'rgba(124,58,237,.3)'}}><span className="text-[11px] text-brand-purple">{s}</span><button onClick={()=>rmSkill(i)} className="bg-transparent border-none text-ink-3 cursor-pointer text-[12px]">×</button></div>)}</div>
          <div className="flex gap-[5px]"><Inp value={skillIn} onChange={e=>setSkillIn(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addSkill()} placeholder="Fähigkeit..." style={{fontSize:12}}/><Btn onClick={addSkill} size="sm">+</Btn></div>
        </Fld>
      </div>
      <div className="flex gap-[7px] mt-3 justify-end">
        <Btn onClick={()=>{setEdit(false);setForm({...profile});}} style={{color:'var(--t2)'}}>Abbrechen</Btn>
        <Btn onClick={save} disabled={saving} style={{background:'linear-gradient(135deg,var(--purple),#5B21B6)',color:'#fff',border:'none'}}>{saving?'Speichern...':'Änderungen speichern'}</Btn>
      </div>
    </Card>:<div className="text-ink-2 text-[13px] text-center py-2.5">Profil-Daten oben sichtbar. <span onClick={()=>setEdit(true)} className="text-brand-purple cursor-pointer font-semibold">Bearbeiten →</span></div>)}

    {ptab==='music'&&<>
      <div className="text-[11px] font-bold text-ink-2 tracking-[.5px] uppercase mb-2.5">Spielbare Songs</div>
      {(profile.playableSongs||[]).map(s=><Card key={s.id} style={{marginBottom:7,padding:'10px 13px'}}>
        <div className="flex items-center gap-[9px]">
          <div className="flex-1"><div className="font-bold text-[13px]">{s.title}</div><div className="text-[11px] text-ink-2">{s.artist}</div>{s.roles?.length>0&&<div className="flex gap-[3px] mt-1 flex-wrap">{s.roles.map((r,i)=><Badge key={i} label={r} color='var(--cyan)' bg='rgba(6,182,212,.1)'/>)}</div>}</div>
          <button onClick={()=>rmPlayable(s.id)} className="bg-transparent border-none text-ink-3 cursor-pointer text-[17px]">×</button>
        </div>
      </Card>)}
      <Card style={{marginBottom:18}}>
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Inp value={addPS.title} onChange={e=>setAddPS(p=>({...p,title:e.target.value}))} placeholder="Songname..."/>
            <Inp value={addPS.artist} onChange={e=>setAddPS(p=>({...p,artist:e.target.value}))} placeholder="Künstler..."/>
          </div>
          <div className="flex gap-1 flex-wrap">{SONG_ROLES.map(r=><button key={r} onClick={()=>setAddPS(p=>({...p,roles:p.roles.includes(r)?p.roles.filter(x=>x!==r):[...p.roles,r]}))}
            className="px-2 py-[3px] rounded-theme-sm border text-[11px] cursor-pointer"
            style={{borderColor:addPS.roles.includes(r)?'var(--purple)':'var(--border)',background:addPS.roles.includes(r)?'rgba(124,58,237,.15)':'transparent',color:addPS.roles.includes(r)?'var(--purple)':'var(--t3)'}}>{r}</button>)}</div>
          <Btn onClick={addPlayable} size="sm" style={{alignSelf:'flex-end'}}>+ Song hinzufügen</Btn>
        </div>
      </Card>
      <div className="text-[11px] font-bold text-ink-2 tracking-[.5px] uppercase mb-2.5">Lieblingslieder</div>
      {(profile.favoriteSongs||[]).map(s=><Card key={s.id} style={{marginBottom:6,padding:'9px 13px',display:'flex',alignItems:'center',gap:9}}>
        <span className="text-[15px]">♥️</span>
        <div className="flex-1"><div className="font-semibold text-[13px]">{s.title}</div><div className="text-[11px] text-ink-2">{s.artist}</div></div>
        <button onClick={()=>rmFav(s.id)} className="bg-transparent border-none text-ink-3 cursor-pointer text-[17px]">×</button>
      </Card>)}
      <Card><div className="flex gap-1.5">
        <Inp value={addFav.title} onChange={e=>setAddFav(p=>({...p,title:e.target.value}))} placeholder="Lieblingstitel..."/>
        <Inp value={addFav.artist} onChange={e=>setAddFav(p=>({...p,artist:e.target.value}))} placeholder="Künstler..."/>
        <Btn onClick={addFavorite} size="sm" style={{flexShrink:0}}>+</Btn>
      </div></Card>
    </>}

    {ptab==='design'&&<>
      <div className="text-[11px] font-bold text-ink-2 tracking-[.5px] uppercase mb-2.5">Farbschema</div>
      <div className="flex flex-col gap-1.5 mb-4">
        {Object.entries(THEMES).map(([name,t])=><button key={name} onClick={()=>onDesignUpdate({theme:name})}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-theme-sm border cursor-pointer text-left"
          style={{borderColor:design.theme===name?t.purple:'var(--border)',background:design.theme===name?t.surf:'var(--surf2)'}}>
          <div className="flex gap-1">{[t.purple,t.gold,t.green,t.pink].map((c,i)=><div key={i} className="w-2.5 h-2.5 rounded-[50%]" style={{background:c}}/>)}</div>
          <span className="text-[13px] font-semibold" style={{color:design.theme===name?t.text:'var(--t2)'}}>{name}</span>
          {design.theme===name&&<span className="ml-auto text-[10px] font-bold" style={{color:t.purple}}>✓ Aktiv</span>}
        </button>)}
      </div>
      <div className="text-[11px] font-bold text-ink-2 tracking-[.5px] uppercase mb-2">Ecken — {design.radius}px</div>
      <div className="flex items-center gap-2.5 mb-4">
        <span className="text-[10px] text-ink-3 shrink-0">Eckig</span>
        <input type="range" min="0" max="20" value={design.radius} onChange={e=>onDesignUpdate({radius:+e.target.value})}/>
        <span className="text-[10px] text-ink-3 shrink-0">Rund</span>
        <div className="w-7 h-7 border-2 border-brand-purple shrink-0" style={{borderRadius:`${design.radius}px`}}/>
      </div>
      <div className="text-[11px] font-bold text-ink-2 tracking-[.5px] uppercase mb-2">Schriftart</div>
      <div className="flex flex-col gap-[5px]">
        {Object.entries(FONTS).map(([name,f])=><button key={name} onClick={()=>onDesignUpdate({font:name})}
          className="px-[13px] py-[9px] rounded-theme-sm border text-[14px] font-semibold cursor-pointer text-left flex justify-between"
          style={{borderColor:design.font===name?'var(--purple)':'var(--border)',background:design.font===name?'rgba(124,58,237,.1)':'var(--surf2)',color:design.font===name?'var(--text)':'var(--t2)',fontFamily:f}}>
          <span>{name} — <span className="font-normal text-[12px]">BandSync Probe</span></span>
          {design.font===name&&<span className="text-[10px] text-brand-purple font-bold">✓</span>}
        </button>)}
      </div>
    </>}

    {ptab==='band'&&<Card>
      <div className="text-[11px] font-bold text-ink-2 tracking-[.5px] uppercase mb-2.5">Band-Name (im Dashboard)</div>
      <div className="flex gap-[7px]">
        <Inp value={bandName} onChange={e=>setBandName(e.target.value)} placeholder="Name deiner Band..."/>
        <Btn onClick={saveBandName} style={{background:'var(--purple)',color:'#fff',border:'none',flexShrink:0}}>Speichern</Btn>
      </div>
      <div className="mt-5 pt-4 border-t border-line">
        <button onClick={()=>auth.signOut()} className="w-full p-[11px] rounded-theme border border-line-2 bg-transparent text-ink-2 text-[13px] cursor-pointer">Abmelden</button>
      </div>
    </Card>}
  </div>;
}

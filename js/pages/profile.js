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

  // Chrome legt das Installations-Angebot frueh auf window.__installPrompt
  // (siehe index.html). Hier nur abholen und auf Aenderungen hoeren.
  const[canInstall,setCanInstall]=useState(!!(typeof window!=='undefined'&&window.__installPrompt));
  useEffect(()=>{
    const on=()=>setCanInstall(!!window.__installPrompt);
    window.addEventListener('bandsync:installready',on);
    return()=>window.removeEventListener('bandsync:installready',on);
  },[]);
  const istInstalliert = typeof window!=='undefined'
    && window.matchMedia?.('(display-mode: standalone)').matches;
  const install=async()=>{
    const e=window.__installPrompt; if(!e) return;
    window.__installPrompt=null; setCanInstall(false);
    try{ e.prompt(); await e.userChoice; }catch{}
  };

  useEffect(()=>{if(profile)setForm({...profile,roles:rolesOf(profile)});},[profile]);

  const toggleRole=r=>setForm(p=>{
    const has=(p.roles||[]).includes(r);
    return {...p, roles: has ? p.roles.filter(x=>x!==r) : [...(p.roles||[]),r]};
  });
  const save=async()=>{
    setSaving(true);
    const roles=(form.roles||[]).length?form.roles:['Sonstiges'];
    // `role` wird weiter geschrieben: Kommentare, Zusagen und alte
    // Datensaetze lesen das Einzelfeld. Erste Rolle ist die Hauptrolle.
    const patch={displayName:form.displayName,roles,role:roles[0],bio:form.bio,skills:form.skills||[]};
    await db.collection('users').doc(user.uid).update(patch);
    setProfile(p=>({...p,...patch}));
    setEdit(false);setSaving(false);
  };
  const addSkill=()=>{if(!skillIn.trim())return;setForm(p=>({...p,skills:[...(p.skills||[]),skillIn.trim()]}));setSkillIn('');};
  const rmSkill=i=>setForm(p=>({...p,skills:p.skills.filter((_,j)=>j!==i)}));
  const addPlayable=async()=>{if(!addPS.title||!addPS.artist)return;const l=[...(profile.playableSongs||[]),{id:uid(),...addPS}];await db.collection('users').doc(user.uid).update({playableSongs:l});setProfile(p=>({...p,playableSongs:l}));setAddPS({title:'',artist:'',roles:[]});};
  const rmPlayable=async id=>{const l=(profile.playableSongs||[]).filter(s=>s.id!==id);await db.collection('users').doc(user.uid).update({playableSongs:l});setProfile(p=>({...p,playableSongs:l}));};
  const addFavorite=async()=>{if(!addFav.title||!addFav.artist)return;const l=[...(profile.favoriteSongs||[]),{id:uid(),...addFav}];await db.collection('users').doc(user.uid).update({favoriteSongs:l});setProfile(p=>({...p,favoriteSongs:l}));setAddFav({title:'',artist:''});};
  const rmFav=async id=>{const l=(profile.favoriteSongs||[]).filter(s=>s.id!==id);await db.collection('users').doc(user.uid).update({favoriteSongs:l});setProfile(p=>({...p,favoriteSongs:l}));};
  const saveBandName=async()=>{await db.collection('settings').doc('main').set({bandName},{merge:true});};

  if(!profile||!form)return <div className="flex justify-center p-10"><div className="spin"/></div>;

  const PTABS=[{k:'info',l:'Profil'},{k:'music',l:'Musik'},{k:'design',l:'Design'},{k:'band',l:'Band'}];

  return <div>
    {/* Kopf */}
    <div className="px-4 md:px-8 pt-6 md:pt-8 pb-5 border-b border-line-2">
      <div className="flex items-center gap-4">
        <Av name={profile.displayName} role={mainRole(profile)} size={56}/>
        <div className="flex-1 min-w-0">
          <div className="disp text-[24px] md:text-[28px] truncate">{profile.displayName}</div>
          <div className="flex gap-x-2 gap-y-1 flex-wrap mt-1">
            {rolesOf(profile).map(r=>
              <span key={r} className="text-[12.5px] font-semibold" style={{color:ROLE_COLORS[r]||'var(--t2)'}}>{r}</span>)}
          </div>
        </div>
        {!edit&&<Btn onClick={()=>{setEdit(true);setPtab('info');}} size="sm"><Ic name="pencil" size={13}/> Bearbeiten</Btn>}
      </div>
      {profile.skills?.length>0&&<div className="flex gap-1.5 flex-wrap mt-4">
        {profile.skills.map((s,i)=><Badge key={i} label={s} color="var(--accent)"/>)}
      </div>}
      {profile.bio&&<div className="mt-4 text-[12.5px] text-ink-2 leading-[1.6] max-w-[620px]">{profile.bio}</div>}
    </div>

    <div className="flex gap-1 px-4 md:px-8 border-b border-line-2 overflow-x-auto">
      {PTABS.map(t=><PillBtn key={t.k} active={ptab===t.k} onClick={()=>setPtab(t.k)}>{t.l}</PillBtn>)}
    </div>

    <div className="px-4 md:px-8 py-6">

    {ptab==='info'&&(edit
      ? <div className="max-w-[620px] flex flex-col gap-4">
          <Fld label="Name"><Inp value={form.displayName} onChange={e=>setForm(p=>({...p,displayName:e.target.value}))}/></Fld>
          <Fld label={`Rollen · ${(form.roles||[]).length}`}
            hint="Mehrere möglich — singen und Ukulele zum Beispiel. Die erste färbt deine Initialen.">
            <div className="flex gap-1.5 flex-wrap">
              {BAND_ROLES.map(r=>{const on=(form.roles||[]).includes(r);
                return <button key={r} onClick={()=>toggleRole(r)}
                  className="px-2.5 py-1.5 border text-[11.5px] cursor-pointer transition-colors duration-100"
                  style={on
                    ?{borderColor:ROLE_COLORS[r]||'var(--accent)',background:hexa(ROLE_COLORS[r]||'#E5A03C',.12),color:ROLE_COLORS[r]||'var(--accent)',fontWeight:600}
                    :{borderColor:'var(--border2)',color:'var(--t3)'}}>{r}</button>;})}
            </div>
          </Fld>
          <Fld label="Über mich"><Txta value={form.bio||''} onChange={e=>setForm(p=>({...p,bio:e.target.value}))} placeholder="Stil, Einflüsse, Träume …" rows={3}/></Fld>
          <Fld label={`Fähigkeiten · ${form.skills?.length||0}`}>
            {(form.skills||[]).length>0&&<div className="flex gap-1.5 flex-wrap mb-2.5">
              {(form.skills||[]).map((s,i)=>
                <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 border border-line-2 text-[11.5px] text-accent">
                  {s}<button onClick={()=>rmSkill(i)} className="cursor-pointer text-ink-3 hover:text-danger"><Ic name="x" size={11} sw={2.4}/></button>
                </span>)}
            </div>}
            <div className="flex gap-1.5">
              <Inp value={skillIn} onChange={e=>setSkillIn(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addSkill()} placeholder="Fähigkeit …"/>
              <Btn onClick={addSkill} title="Hinzufügen"><Ic name="plus" size={15} sw={2.2}/></Btn>
            </div>
          </Fld>
          <div className="flex gap-2 justify-end">
            <Btn onClick={()=>{setEdit(false);setForm({...profile});}} variant="quiet">Abbrechen</Btn>
            <Btn onClick={save} disabled={saving} variant="accent">{saving?'Speichern …':'Änderungen speichern'}</Btn>
          </div>
        </div>
      : <div className="text-[12.5px] text-ink-2">
          Deine Angaben stehen oben. <button onClick={()=>setEdit(true)} className="text-accent font-semibold cursor-pointer">Bearbeiten →</button>
        </div>)}

    {ptab==='music'&&<div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-8 items-start">
      <section>
        <SectionLabel color="var(--t3)" right={String((profile.playableSongs||[]).length)}>Spielbare Songs</SectionLabel>
        <div className="border-t border-line mb-4">
          {(profile.playableSongs||[]).map(s=>
            <div key={s.id} className="flex items-start gap-3 py-3 border-b border-line">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[13px] truncate">{s.title}</div>
                <div className="text-[11.5px] text-ink-2 truncate">{s.artist}</div>
                {s.roles?.length>0&&<div className="flex gap-1.5 mt-1.5 flex-wrap">{s.roles.map((r,i)=><Badge key={i} label={r} color="var(--accent)"/>)}</div>}
              </div>
              <button onClick={()=>rmPlayable(s.id)} title="Entfernen" className="cursor-pointer text-ink-3 hover:text-danger pt-0.5"><Ic name="x" size={14} sw={2}/></button>
            </div>)}
          {!(profile.playableSongs||[]).length&&<div className="py-3 text-[12px] text-ink-3">Noch nichts eingetragen.</div>}
        </div>
        <div className="p-4 rail-a flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Inp value={addPS.title} onChange={e=>setAddPS(p=>({...p,title:e.target.value}))} placeholder="Songname …"/>
            <Inp value={addPS.artist} onChange={e=>setAddPS(p=>({...p,artist:e.target.value}))} placeholder="Künstler …"/>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {SONG_ROLES.map(r=>{const on=addPS.roles.includes(r);
              return <button key={r} onClick={()=>setAddPS(p=>({...p,roles:on?p.roles.filter(x=>x!==r):[...p.roles,r]}))}
                className="px-2.5 py-1 border text-[11px] cursor-pointer transition-colors duration-100"
                style={{borderColor:on?'var(--accent)':'var(--border2)',background:on?'var(--accent-tint)':'transparent',color:on?'var(--accent)':'var(--t3)'}}>{r}</button>;})}
          </div>
          <Btn onClick={addPlayable} disabled={!addPS.title||!addPS.artist} size="sm" style={{alignSelf:'flex-end'}}>+ Song hinzufügen</Btn>
        </div>
      </section>

      <section>
        <SectionLabel color="var(--t3)" right={String((profile.favoriteSongs||[]).length)}>Lieblingslieder</SectionLabel>
        <div className="border-t border-line mb-4">
          {(profile.favoriteSongs||[]).map(s=>
            <div key={s.id} className="flex items-center gap-3 py-3 border-b border-line">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[13px] truncate">{s.title}</div>
                <div className="text-[11.5px] text-ink-2 truncate">{s.artist}</div>
              </div>
              <button onClick={()=>rmFav(s.id)} title="Entfernen" className="cursor-pointer text-ink-3 hover:text-danger"><Ic name="x" size={14} sw={2}/></button>
            </div>)}
          {!(profile.favoriteSongs||[]).length&&<div className="py-3 text-[12px] text-ink-3">Noch nichts eingetragen.</div>}
        </div>
        <div className="flex gap-1.5">
          <Inp value={addFav.title} onChange={e=>setAddFav(p=>({...p,title:e.target.value}))} placeholder="Lieblingstitel …"/>
          <Inp value={addFav.artist} onChange={e=>setAddFav(p=>({...p,artist:e.target.value}))} placeholder="Künstler …"/>
          <Btn onClick={addFavorite} title="Hinzufügen"><Ic name="plus" size={15} sw={2.2}/></Btn>
        </div>
      </section>
    </div>}

    {ptab==='design'&&<div className="max-w-[620px]">
      <SectionLabel color="var(--t3)">Akzentfarbe</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
        {Object.entries(THEMES).map(([name,t])=>{
          const on=design.theme===name;
          return <button key={name} onClick={()=>onDesignUpdate({theme:name})}
            className="flex items-center gap-3 px-3.5 h-12 border cursor-pointer text-left transition-colors duration-100"
            style={{borderColor:on?t.accent:'var(--border2)',background:on?'var(--surf)':'transparent'}}>
            <div className="w-4 h-4 shrink-0" style={{background:t.accent}}/>
            <span className="text-[13px] font-semibold flex-1" style={{color:on?'var(--text)':'var(--t2)'}}>{name}</span>
            {on&&<Ic name="check" size={14} sw={2.4} color={t.accent}/>}
          </button>;})}
      </div>

      <SectionLabel color="var(--t3)" right={`${design.radius}px`}>Ecken</SectionLabel>
      <div className="flex items-center gap-4 mb-8">
        <span className="lab text-ink-3 shrink-0">Eckig</span>
        <input type="range" min="0" max="16" value={design.radius} onChange={e=>onDesignUpdate({radius:+e.target.value})}/>
        <span className="lab text-ink-3 shrink-0">Rund</span>
        <div className="w-8 h-8 border border-accent shrink-0" style={{borderRadius:`${design.radius}px`}}/>
      </div>

      <SectionLabel color="var(--t3)">Schriftart</SectionLabel>
      <div className="flex flex-col gap-1.5">
        {Object.entries(FONTS).map(([name,f])=>{
          const on=design.font===name;
          return <button key={name} onClick={()=>onDesignUpdate({font:name})}
            className="px-3.5 h-12 border cursor-pointer text-left flex items-center justify-between gap-3 transition-colors duration-100"
            style={{borderColor:on?'var(--accent)':'var(--border2)',background:on?'var(--surf)':'transparent',fontFamily:f}}>
            <span className="text-[13.5px] font-semibold" style={{color:on?'var(--text)':'var(--t2)'}}>
              {name} <span className="font-normal text-[12px] text-ink-3">— Probe um 19 Uhr</span>
            </span>
            {on&&<Ic name="check" size={14} sw={2.4} color="var(--accent)"/>}
          </button>;})}
      </div>
      <div className="text-[11px] text-ink-3 mt-4 leading-[1.6]">
        Überschriften bleiben in Archivo — sie tragen das Design. Die Auswahl gilt nur auf diesem Gerät.
      </div>
    </div>}

    {ptab==='band'&&<div className="max-w-[620px]">
      <SectionLabel color="var(--t3)">Band-Name</SectionLabel>
      <div className="flex gap-1.5 mb-8">
        <Inp value={bandName} onChange={e=>setBandName(e.target.value)} placeholder="Name deiner Band …"/>
        <Btn onClick={saveBandName} variant="accent" style={{flexShrink:0}}>Speichern</Btn>
      </div>
      <SectionLabel color="var(--t3)">Als App</SectionLabel>
      <div className="mb-8">
        {istInstalliert
          ? <div className="flex items-center gap-2.5 px-3 py-2.5 rail-a">
              <Ic name="check" size={15} sw={2.2} color="var(--ok)"/>
              <span className="text-[12px] text-ink-2">Läuft als installierte App.</span>
            </div>
          : canInstall
            ? <>
                <Btn onClick={install} variant="accent" size="lg" style={{width:'100%'}}>
                  <Ic name="plus" size={15} sw={2.2}/> Auf dem Startbildschirm installieren
                </Btn>
                <div className="text-[11px] text-ink-3 mt-2 leading-[1.6]">
                  Eigenes Symbol, kein Browserrahmen — und die Blätter bleiben
                  ohne Netz lesbar, sobald sie einmal geladen waren.
                </div>
              </>
            : <div className="text-[11.5px] text-ink-2 leading-[1.7]">
                Dein Browser bietet die Installation gerade nicht an.
                <span className="text-ink-3"> Android/Chrome: Menü ⋮ → „App installieren“.
                iPhone/Safari: Teilen → „Zum Home-Bildschirm“.</span>
              </div>}
      </div>

      <div className="pt-6 border-t border-line">
        <Btn onClick={()=>auth.signOut()} variant="danger" size="lg" style={{width:'100%'}}>
          <Ic name="logout" size={15}/> Abmelden
        </Btn>
        <div className="text-[11px] text-ink-3 mt-2 leading-[1.6]">
          Du bleibst sonst angemeldet — auch nach dem Schließen der App.
        </div>
      </div>
    </div>}

    </div>
  </div>;
}

// ════════════════════════════════════════════════════
//  FIREBASE INIT (db + auth)
// ════════════════════════════════════════════════════
let db=null, auth=null;
const initFB = () => {
  try{
    if(!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    db=firebase.firestore(); auth=firebase.auth();

    // Angemeldet bleiben, bis jemand ausdruecklich abmeldet. LOCAL ist im
    // Web zwar die Voreinstellung, steht hier aber ausdruecklich — sonst
    // liest sich jede spaetere Abmelde-Frage wie ein Zufall.
    // Getragen wird das von IndexedDB/localStorage: leert jemand die
    // Browserdaten, ist die Anmeldung weg. Das ist nicht zu umgehen.
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(()=>{});

    // Offline-Zwischenspeicher. Im Proberaum ist das Netz schlecht; damit
    // oeffnen schon geladene Blaetter und Setlisten auch ohne Verbindung,
    // und Aenderungen gehen raus, sobald es wieder geht.
    //
    // Fehlschlaege sind kein Grund abzubrechen — die App laeuft dann
    // einfach wie vorher nur online:
    //   failed-precondition  mehrere Tabs offen, ohne synchronizeTabs
    //   unimplemented        Browser kann es nicht (aeltere iOS-Safari)
    db.enablePersistence({synchronizeTabs:true}).catch(()=>{});

    return true;
  }
  catch{ return false; }
};

// ════════════════════════════════════════════════════
//  FIREBASE INIT (db + auth)
// ════════════════════════════════════════════════════
let db=null, auth=null;
const initFB = () => {
  try{ if(!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG); db=firebase.firestore(); auth=firebase.auth(); return true; }
  catch{ return false; }
};

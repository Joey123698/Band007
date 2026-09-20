// ════════════════════════════════════════════════════
//  SERVICE WORKER
//  Macht die Seite installierbar und im Proberaum offline
//  benutzbar. Firestore bringt seinen eigenen Offline-Speicher
//  mit (siehe js/core/firebase.js) — hier geht es nur um die
//  Huelle: HTML, CSS, JS, Schriften.
//
//  ⚠ Der Cache ist die Stelle, an der ein Deploy haengenbleiben
//  kann. Deshalb zwei Regeln, die nicht aufgeweicht werden:
//
//  1. Seitenaufrufe gehen IMMER zuerst ans Netz. Nur wenn das
//     scheitert, kommt die gespeicherte Fassung. So sieht die
//     Band einen Push sofort, sobald sie online ist.
//  2. Alles andere traegt ?v=APP_V im Namen und ist damit
//     unveraenderlich — dort ist Cache-zuerst richtig. Beim
//     Hochzaehlen von APP_V aendert sich auch die Adresse
//     dieses Skripts, der Cache bekommt einen neuen Namen und
//     der alte wird beim Aktivieren geloescht.
// ════════════════════════════════════════════════════
const V     = new URL(self.location).searchParams.get('v') || '0';
const CACHE = 'bandsync-' + V;
const SHELL = new URL('./', self.location).href;

// Nur diese Fremd-Hosts liefern statische Dateien. Alles andere —
// Firestore, Auth, YouTube — wird nicht angefasst und laeuft direkt
// ans Netz; sonst wuerden wir Live-Daten einfrieren.
const CDN = ['cdnjs.cloudflare.com','cdn.tailwindcss.com','www.gstatic.com',
             'fonts.googleapis.com','fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.add(SHELL)).catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const remember = (req, res) => {
  if (res && (res.ok || res.type === 'opaque')) {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
  }
  return res;
};

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch { return; }
  const eigen = url.origin === self.location.origin;
  if (!eigen && !CDN.includes(url.hostname)) return;   // Regel: nicht anfassen

  // Regel 1 — Seitenaufruf: Netz zuerst.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(r => remember(req, r))
                .catch(() => caches.match(req).then(r => r || caches.match(SHELL)))
    );
    return;
  }

  // Regel 2 — versionierte Datei: Cache zuerst.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => remember(req, r)))
  );
});

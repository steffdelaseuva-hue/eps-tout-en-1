/* =========================================================
   EPS ONE — Synchronisation entre appareils (Firebase)
   · Compte e-mail + mot de passe (fiable dans une app installée)
   · Chaque rubrique de données = 1 document Firestore
     epsone/{uid}/data/{rubrique} → { v: JSON, t: date, dev: appareil }
   · Envoi automatique après chaque modification, réception en direct
   ========================================================= */
const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const META_KEY = 'epsone_sync_meta';
const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return String(h); };
let meta; try { meta = JSON.parse(localStorage.getItem(META_KEY)) || {}; } catch (e) { meta = {}; }
meta.keys = meta.keys || {}; meta.dev = meta.dev || Math.random().toString(36).slice(2, 10);
const saveMeta = () => { try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {} };

const S = { ready: false, user: null, status: 'off', last: meta.last || null, err: '' };
window.EPSONE_SYNC = S;
let fb = null, pushTimer = null, unsub = null, applying = false;

/* ---------- Envoi des rubriques modifiées ---------- */
async function pushChanged() {
  if (!fb || !S.user) return;
  const { doc, setDoc } = fb.fs;
  const jobs = [];
  for (const k of Object.keys(DB)) {
    const j = JSON.stringify(DB[k] ?? null), h = hash(j);
    if (meta.keys[k]?.h === h) continue;
    if (j.length > 900000) { S.err = `Rubrique « ${k} » trop volumineuse pour la synchronisation`; continue; }
    const t = Date.now(); meta.keys[k] = { h, t };
    jobs.push(setDoc(doc(fb.db, 'epsone', S.user.uid, 'data', k), { v: j, t, dev: meta.dev }));
  }
  if (!jobs.length) return;
  S.status = 'sync'; refreshUI();
  try { await Promise.all(jobs); S.status = 'ok'; S.err = ''; S.last = meta.last = Date.now(); }
  catch (e) { S.status = 'error'; S.err = e.message; }
  saveMeta(); refreshUI();
}
const schedulePush = () => { if (applying || !S.user) return; clearTimeout(pushTimer); pushTimer = setTimeout(pushChanged, 1500); };

/* Chaque sauvegarde locale déclenche un envoi */
const _save = window.save;
window.save = function () { _save(); schedulePush(); };

/* ---------- Réception en direct ---------- */
function listen() {
  const { collection, onSnapshot } = fb.fs;
  unsub && unsub();
  unsub = onSnapshot(collection(fb.db, 'epsone', S.user.uid, 'data'), snap => {
    let changed = false;
    snap.docChanges().forEach(ch => {
      if (ch.type === 'removed') return;
      const k = ch.doc.id, r = ch.doc.data(); if (!r || typeof r.v !== 'string') return;
      if (r.dev === meta.dev && meta.keys[k]?.t >= r.t) return;             // notre propre envoi
      const localH = hash(JSON.stringify(DB[k] ?? null)), m = meta.keys[k];
      const localDirty = m && m.h !== localH;
      if (!m || !localDirty || r.t > (m.t || 0)) {
        try { applying = true; DB[k] = JSON.parse(r.v); meta.keys[k] = { h: hash(r.v), t: r.t }; changed = true; } finally { applying = false; }
      }
    });
    if (changed) { _save(); saveMeta(); S.last = meta.last = Date.now(); S.status = 'ok'; refreshUI();
      try { if (!document.getElementById('screen').classList.contains('open')) renderHome(); } catch (e) {}
      toast('🔄 Données synchronisées'); }
  }, e => { S.status = 'error'; S.err = e.message; refreshUI(); });
}

/* Premier branchement d'un appareil sur un compte */
async function firstSync() {
  const { collection, getDocs } = fb.fs;
  const snap = await getDocs(collection(fb.db, 'epsone', S.user.uid, 'data'));
  const remoteHasData = !snap.empty, localHasData = DB.classes?.length || DB.grilles?.length || Object.keys(meta.keys).length;
  if (remoteHasData && localHasData && !meta.linked) {
    const keepRemote = confirm('Votre compte contient déjà des données.\n\nOK = récupérer les données du compte sur cet appareil (conseillé pour un 2e appareil)\nAnnuler = envoyer les données de cet appareil vers le compte');
    if (keepRemote) meta.keys = {};                        // les données du compte l'emportent
    else { meta.keys = {}; meta.linked = true; saveMeta(); await pushChanged(); listen(); return; }
  }
  if (!remoteHasData) { meta.keys = {}; }
  meta.linked = true; saveMeta();
  listen();                                                  // applique les données distantes
  setTimeout(pushChanged, 2500);                             // puis envoie ce qui manque
}

/* ---------- Démarrage ---------- */
async function boot() {
  if (!window.EPSONE_FIREBASE) { S.status = 'unconfigured'; refreshUI(); return; }
  try {
    const [appM, authM, fsM] = await Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js')]);
    const app = appM.initializeApp(window.EPSONE_FIREBASE, 'epsone');
    const auth = authM.getAuth(app);
    let db; try { db = fsM.initializeFirestore(app, { localCache: fsM.persistentLocalCache() }); } catch (e) { db = fsM.getFirestore(app); }
    fb = { auth, authM, db, fs: fsM }; S.ready = true;
    authM.onAuthStateChanged(auth, async u => {
      S.user = u; S.status = u ? 'ok' : 'off'; refreshUI();
      if (u) { try { await firstSync(); } catch (e) { S.status = 'error'; S.err = e.message; refreshUI(); } }
      else { unsub && unsub(); unsub = null; }
    });
  } catch (e) { S.status = 'error'; S.err = 'Connexion à Firebase impossible (hors ligne ?)'; refreshUI(); }
}
window.addEventListener('online', () => S.user && pushChanged());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.user) pushChanged(); });

/* ---------- Interface ---------- */
const statusText = () => ({ unconfigured: 'Non configurée', off: 'Non connecté', sync: 'Synchronisation…', ok: `Connecté · ${S.user?.email || ''}`, error: 'Erreur de synchronisation' })[S.status] || '';
function refreshUI() {
  const sub = document.getElementById('sync-sub'); if (sub) sub.textContent = statusText();
  const box = document.getElementById('sync-panel'); if (box) drawPanel(box);
}
function drawPanel(el) {
  el.id = 'sync-panel';
  if (S.status === 'unconfigured') {
    el.innerHTML = `<div class="card doc"><h3>☁️ Synchronisation iPhone ↔ iPad</h3><p>La synchronisation n'est pas encore configurée.</p>
      <p class="muted">Il faut coller la configuration de votre projet Firebase dans le fichier <code>js/firebase-config.js</code>, puis republier l'app.</p></div>`; return;
  }
  const last = S.last ? new Date(S.last).toLocaleString('fr-FR') : 'jamais';
  el.innerHTML = S.user ? `<div class="card"><h3>☁️ Synchronisation activée</h3>
        <p style="margin:6px 0">Compte : <b>${esc(S.user.email)}</b></p><p class="muted" style="margin:0">État : ${statusText()} · dernière synchro : ${last}</p>
        ${S.err ? `<p style="color:var(--danger);font-size:.85rem">${esc(S.err)}</p>` : ''}
        <div class="row" style="margin-top:12px"><button class="btn btn-grad" id="sy-now">🔄 Synchroniser maintenant</button><button class="btn btn-ghost" id="sy-out">Se déconnecter</button></div></div>
      <p class="muted" style="margin:12px 4px">Connectez-vous avec le même compte sur l'iPhone et l'iPad : classes, résultats, grilles, séances… se mettent à jour automatiquement. Sans réseau, l'app continue de marcher et se synchronise au retour de la connexion.</p>`
    : `<div class="card"><h3>☁️ Synchronisation iPhone ↔ iPad</h3>
        <p class="muted" style="margin:4px 0 0">Créez un compte une fois, puis connectez-vous avec le même compte sur chaque appareil.</p>
        <label>E-mail</label><input id="sy-mail" type="email" autocomplete="username" value="${esc(meta.mail || '')}">
        <label>Mot de passe (6 caractères minimum)</label><input id="sy-pass" type="password" autocomplete="current-password">
        ${S.err ? `<p style="color:var(--danger);font-size:.85rem">${esc(S.err)}</p>` : ''}
        <div class="row" style="margin-top:12px"><button class="btn btn-grad" id="sy-in">Se connecter</button><button class="btn btn-ghost" id="sy-new">Créer un compte</button></div>
        <button class="link" style="margin-top:10px" id="sy-forgot">Mot de passe oublié ?</button></div>
      <p class="muted" style="margin:12px 4px">Les données sont stockées dans votre projet Firebase et ne sont visibles que par votre compte.</p>`;
  const $ = s => el.querySelector(s);
  const run = async fn => { S.err = ''; try { await fn(); } catch (e) { S.err = ({ 'auth/invalid-credential': 'E-mail ou mot de passe incorrect.', 'auth/wrong-password': 'Mot de passe incorrect.', 'auth/user-not-found': 'Aucun compte avec cet e-mail.', 'auth/email-already-in-use': 'Un compte existe déjà avec cet e-mail : connectez-vous.', 'auth/weak-password': 'Mot de passe trop court (6 caractères minimum).', 'auth/invalid-email': 'E-mail invalide.', 'auth/network-request-failed': 'Pas de connexion internet.' })[e.code] || e.message; } refreshUI(); };
  if (S.user) {
    $('#sy-now').onclick = () => run(async () => { Object.keys(meta.keys).forEach(k => { if (meta.keys[k]) meta.keys[k].h = 'x'; }); await pushChanged(); toast('Synchronisé ✔'); });
    $('#sy-out').onclick = () => run(async () => { if (!confirm('Se déconnecter ? Les données restent sur cet appareil.')) return; await fb.authM.signOut(fb.auth); });
  } else {
    const creds = () => { const m = $('#sy-mail').value.trim(), p = $('#sy-pass').value; meta.mail = m; saveMeta(); return [m, p]; };
    $('#sy-in').onclick = () => run(() => { if (!fb) throw new Error('Firebase indisponible (hors ligne ?)'); return fb.authM.signInWithEmailAndPassword(fb.auth, ...creds()); });
    $('#sy-new').onclick = () => run(() => { if (!fb) throw new Error('Firebase indisponible (hors ligne ?)'); return fb.authM.createUserWithEmailAndPassword(fb.auth, ...creds()); });
    $('#sy-forgot').onclick = () => run(async () => { const [m] = creds(); if (!m) throw new Error('Indiquez votre e-mail.'); await fb.authM.sendPasswordResetEmail(fb.auth, m); toast('E-mail de réinitialisation envoyé'); });
  }
}
window.openSync = () => openPanel('Synchronisation', el => { const d = document.createElement('div'); el.appendChild(d); drawPanel(d); });
window.syncStatusText = statusText;

boot();
try { renderPlus(); } catch (e) {}

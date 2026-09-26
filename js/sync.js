/* =========================================================
   EPS ONE — Synchronisation entre appareils (Firebase)
   · Compte e-mail + mot de passe (fiable dans une app installée)
   · Chiffrement de bout en bout : chaque rubrique est chiffrée sur
     l'appareil (AES-256-GCM, clé dérivée du mot de passe, PBKDF2)
     avant l'envoi. Firebase ne stocke que du contenu illisible.
   · epsone/{uid}/data/{rubrique} → { c: chiffré, t: date, dev }
     epsone/{uid}/data/_cle        → témoin permettant de vérifier la clé
   ========================================================= */
const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const META_KEY = 'epsone_sync_meta', KEY_STORE = 'epsone_key', CHECK_ID = '_cle', CHECK_TXT = 'epsone-ok';
const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return String(h); };
let meta; try { meta = JSON.parse(localStorage.getItem(META_KEY)) || {}; } catch (e) { meta = {}; }
meta.keys = meta.keys || {}; meta.dev = meta.dev || Math.random().toString(36).slice(2, 10);
const saveMeta = () => { try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {} };

const S = { linkMode: 'merge', ready: false, user: null, status: 'off', last: meta.last || null, err: '', needKey: false, mismatch: false };
window.EPSONE_SYNC = S;
let fb = null, pushTimer = null, unsub = null, applying = false, CK = null;

/* ---------- Chiffrement (WebCrypto) ---------- */
const TE = new TextEncoder(), TD = new TextDecoder();
const toB64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const fromB64 = b => Uint8Array.from(atob(b), c => c.charCodeAt(0));
async function deriveKey(email, password) {
  const base = await crypto.subtle.importKey('raw', TE.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: TE.encode('epsone-v1|' + email.trim().toLowerCase()), iterations: 210000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}
async function storeKey(email, key) { const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key)); try { localStorage.setItem(KEY_STORE, JSON.stringify({ e: email.trim().toLowerCase(), k: toB64(raw) })); } catch (e) {} }
async function loadKey(email) {
  try { const o = JSON.parse(localStorage.getItem(KEY_STORE)); if (!o || o.e !== email.trim().toLowerCase()) return null;
    return await crypto.subtle.importKey('raw', fromB64(o.k), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']); } catch (e) { return null; }
}
const forgetKey = () => { CK = null; try { localStorage.removeItem(KEY_STORE); } catch (e) {} };
async function encrypt(str, key = CK) { const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, TE.encode(str)));
  const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12); return toB64(out); }
async function decrypt(b64, key = CK) { const u = fromB64(b64); return TD.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.subarray(0, 12) }, key, u.subarray(12))); }
async function keyMatches(key) {
  const { doc, getDoc } = fb.fs; const d = await getDoc(doc(fb.db, 'epsone', S.user.uid, 'data', CHECK_ID));
  if (!d.exists()) return null;                                         // pas encore de témoin
  try { return (await decrypt(d.data().c, key)) === CHECK_TXT; } catch (e) { return false; }
}
async function writeCheck() { const { doc, setDoc } = fb.fs; await setDoc(doc(fb.db, 'epsone', S.user.uid, 'data', CHECK_ID), { c: await encrypt(CHECK_TXT), t: Date.now() }); }

/* ---------- Envoi des rubriques modifiées (chiffrées) ---------- */
async function pushChanged() {
  if (!fb || !S.user || !CK || S.mismatch) return;
  const { doc, setDoc } = fb.fs;
  const jobs = [];
  for (const k of Object.keys(DB)) {
    const j = JSON.stringify(DB[k] ?? null), h = hash(j);
    if (meta.keys[k]?.h === h) continue;
    if (j.length > 700000) { S.err = `Rubrique « ${k} » trop volumineuse pour la synchronisation`; continue; }
    const t = Date.now(); meta.keys[k] = { h, t };
    jobs.push(encrypt(j).then(c => setDoc(doc(fb.db, 'epsone', S.user.uid, 'data', k), { c, t, dev: meta.dev })));
  }
  if (!jobs.length) return;
  S.status = 'sync'; refreshUI();
  try { await Promise.all(jobs); S.status = 'ok'; S.err = ''; S.last = meta.last = Date.now(); }
  catch (e) { S.status = 'error'; S.err = e.message; }
  saveMeta(); refreshUI();
}
const schedulePush = () => { if (applying || !S.user) return; clearTimeout(pushTimer); pushTimer = setTimeout(pushChanged, 1500); };
const forcePushAll = async () => { Object.keys(DB).forEach(k => { meta.keys[k] = { h: 'x', t: 0 }; }); await pushChanged(); };

/* Chaque sauvegarde locale déclenche un envoi */
const _save = window.save;
window.save = function () { _save(); schedulePush(); };

/* ---------- Réception en direct (déchiffrement) ---------- */
function listen() {
  const { collection, onSnapshot } = fb.fs;
  unsub && unsub();
  unsub = onSnapshot(collection(fb.db, 'epsone', S.user.uid, 'data'), async snap => {
    let changed = false;
    for (const ch of snap.docChanges()) {
      if (ch.type === 'removed' || ch.doc.id === CHECK_ID) continue;
      const k = ch.doc.id, r = ch.doc.data(); if (!r) continue;
      if (r.dev === meta.dev && meta.keys[k]?.t >= r.t) continue;          // notre propre envoi
      let v;
      if (typeof r.c === 'string') { try { v = await decrypt(r.c); } catch (e) { S.mismatch = true; S.status = 'error'; refreshUI(); return; } }
      else if (typeof r.v === 'string') v = r.v;                            // ancien format non chiffré
      else continue;
      const localH = hash(JSON.stringify(DB[k] ?? null)), m = meta.keys[k];
      const localDirty = m && m.h !== localH;
      if (!m || !localDirty || r.t > (m.t || 0)) {
        try { applying = true; DB[k] = JSON.parse(v); meta.keys[k] = { h: typeof r.c === 'string' ? hash(v) : 'legacy', t: r.t }; changed = true; } finally { applying = false; }
      }
    }
    if (changed) { _save(); saveMeta(); S.last = meta.last = Date.now(); S.status = 'ok'; refreshUI();
      try { if (!document.getElementById('screen').classList.contains('open')) renderHome(); } catch (e) {}
      toast('🔄 Données synchronisées'); }
  }, e => { S.status = 'error'; S.err = e.message; refreshUI(); });
}

/* Fusion « Combiner » : ajoute les données du compte sans effacer celles de l'appareil.
   Listes : éléments rapprochés par id, sinon par nom (ex. classes), sans doublon.
   Objets : fusion clé par clé ; en cas de conflit sur une valeur simple, l'appareil garde la sienne. */
const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
function mergeData(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    const out = a.slice(), keyOf = x => isObj(x) ? (x.id != null ? 'id:' + x.id : x.name != null ? 'name:' + x.name : 'json:' + JSON.stringify(x)) : 'val:' + JSON.stringify(x);
    const idx = new Map(out.map((x, i) => [keyOf(x), i]));
    for (const x of b) { const k = keyOf(x);
      if (!idx.has(k)) { idx.set(k, out.length); out.push(x); }
      else if (isObj(x)) out[idx.get(k)] = mergeData(out[idx.get(k)], x); }
    return out;
  }
  if (isObj(a) && isObj(b)) { const out = { ...a };
    for (const k of Object.keys(b)) out[k] = (out[k] === undefined || out[k] === null) ? b[k] : mergeData(out[k], b[k]);
    return out; }
  return a;
}

/* Branchement d'un appareil sur le compte (clé disponible) */
async function startSync() {
  S.needKey = false; S.mismatch = false;
  const ok = await keyMatches(CK);
  if (ok === false) { S.mismatch = true; S.status = 'error'; refreshUI(); return; }
  const { collection, getDocs } = fb.fs;
  const snap = await getDocs(collection(fb.db, 'epsone', S.user.uid, 'data'));
  const remoteHasData = snap.docs.some(d => d.id !== CHECK_ID), localHasData = DB.classes?.length || DB.grilles?.length || Object.keys(meta.keys).length;
  if (remoteHasData && localHasData && !meta.linked) {
    if (S.linkMode !== 'replace') {                                       // Combiner : on fusionne, rien n'est effacé
      for (const d of snap.docs) {
        if (d.id === CHECK_ID) continue; const r = d.data(); let v;
        try { v = typeof r.c === 'string' ? await decrypt(r.c) : r.v; } catch (e) { continue; }
        if (typeof v !== 'string') continue;
        try { DB[d.id] = DB[d.id] === undefined ? JSON.parse(v) : mergeData(DB[d.id], JSON.parse(v)); } catch (e) {}
      }
      _save(); meta.keys = {}; meta.linked = true; saveMeta();
      if (ok === null) await writeCheck();
      await forcePushAll(); listen(); refreshUI();
      try { if (!document.getElementById('screen').classList.contains('open')) renderHome(); } catch (e) {}
      toast('🔄 Données combinées'); return;
    }
    meta.keys = {};                                                       // Remplacer : l'appareil reprend la sauvegarde du compte
  }
  if (!remoteHasData) meta.keys = {};
  meta.linked = true; saveMeta();
  listen();                                                             // applique les données du compte
  if (ok === null) { await writeCheck(); setTimeout(forcePushAll, 2500); } // 1er chiffrement : tout renvoyer chiffré
  else setTimeout(pushChanged, 2500);
  refreshUI();
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
      S.user = u; S.status = u ? 'ok' : 'off'; S.needKey = false; S.mismatch = false;
      if (u) { CK = CK || await loadKey(u.email); if (!CK) { S.needKey = true; refreshUI(); return; }
        try { await startSync(); } catch (e) { S.status = 'error'; S.err = e.message; } }
      else { unsub && unsub(); unsub = null; }
      refreshUI();
    });
  } catch (e) { S.status = 'error'; S.err = 'Connexion à Firebase impossible (hors ligne ?)'; refreshUI(); }
}
window.addEventListener('online', () => S.user && pushChanged());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.user) pushChanged(); });

/* ---------- Interface ---------- */
const statusText = () => S.user ? (S.needKey ? 'Mode : synchronisé · mot de passe requis' : S.mismatch ? 'Mode : synchronisé · clé à mettre à jour' : ({ sync: 'Mode : synchronisé · envoi…', error: 'Mode : synchronisé · erreur' })[S.status] || `Mode : synchronisé · ${S.user.email}`) : 'Mode : stockage local (cet appareil uniquement)';
function refreshUI() {
  const sub = document.getElementById('sync-sub'); if (sub) sub.textContent = statusText();
  const box = document.getElementById('sync-panel'); if (box) drawPanel(box);
}
const E2E_TXT = `<div class="card" style="margin-top:12px"><h3>🔒 Chiffrement de bout en bout</h3>
  <p style="margin:6px 0;font-size:.9rem;line-height:1.45">Vos données sont <b>chiffrées sur cet appareil avant l'envoi</b> (AES-256), avec une clé tirée de votre mot de passe. Firebase ne stocke que du contenu illisible : <b>personne d'autre — ni Google, ni l'administrateur du projet — ne peut les lire</b>.</p>
  <p class="muted" style="margin:0;font-size:.82rem">⚠️ Si vous oubliez votre mot de passe, les données en ligne deviennent illisibles. Celles de vos appareils sont conservées et pourront être renvoyées après la réinitialisation.</p></div>`;
function drawPanel(el) {
  el.id = 'sync-panel';
  if (S.status === 'unconfigured') {
    el.innerHTML = `<div class="card doc"><h3>☁️ Synchronisation iPhone ↔ iPad</h3><p>La synchronisation n'est pas encore configurée.</p>
      <p class="muted">Il faut coller la configuration de votre projet Firebase dans le fichier <code>js/firebase-config.js</code>, puis republier l'app.</p></div>`; return;
  }
  const last = S.last ? new Date(S.last).toLocaleString('fr-FR') : 'jamais';
  const errP = S.err ? `<p style="color:var(--danger);font-size:.85rem">${esc(S.err)}</p>` : '';
  if (S.user && S.needKey) {
    el.innerHTML = `<div class="card"><h3>🔒 Activer le chiffrement sur cet appareil</h3>
        <p class="muted" style="margin:4px 0 0">Compte : <b>${esc(S.user.email)}</b>. Saisissez votre mot de passe une fois : il sert à créer la clé de chiffrement de cet appareil. La synchronisation reprend ensuite automatiquement.</p>
        <label>Mot de passe</label><input id="sy-kp" type="password" autocomplete="current-password">${errP}
        <button class="btn btn-grad btn-block" style="margin-top:12px" id="sy-kgo">🔒 Activer le chiffrement</button>
        <button class="link" style="margin-top:10px" id="sy-kout">Se déconnecter</button></div>${E2E_TXT}`;
  } else if (S.user && S.mismatch) {
    el.innerHTML = `<div class="card"><h3>🔑 Clé de chiffrement différente</h3>
        <p style="font-size:.9rem;line-height:1.45;margin:6px 0">Les données en ligne ont été chiffrées avec un autre mot de passe (mot de passe réinitialisé ou changé sur un autre appareil ?).</p>
        <label>Mot de passe utilisé sur l'autre appareil</label><input id="sy-mp" type="password">${errP}
        <button class="btn btn-grad btn-block" style="margin-top:10px" id="sy-mgo">Déverrouiller avec ce mot de passe</button>
        <p class="muted" style="margin:14px 0 6px;font-size:.82rem">Ou bien : remplacer les données en ligne par celles de cet appareil (elles seront chiffrées avec votre mot de passe actuel ; les autres appareils devront saisir ce mot de passe).</p>
        <button class="btn btn-danger btn-block" id="sy-mrep">Remplacer les données en ligne par celles de cet appareil</button></div>`;
  } else if (S.user) {
    el.innerHTML = `<div class="card"><h3>☁️ Synchronisation activée</h3>
        <p style="margin:6px 0">Compte : <b>${esc(S.user.email)}</b></p><p class="muted" style="margin:0">État : ${statusText()} · dernière synchro : ${last}</p>${errP}
        <div class="row" style="margin-top:12px"><button class="btn btn-grad" id="sy-now">🔄 Synchroniser maintenant</button><button class="btn btn-ghost" id="sy-out">Revenir en stockage local</button></div></div>
      ${E2E_TXT}
      <div class="card" style="margin-top:12px"><h3>🗑 Supprimer mes données en ligne</h3>
        <p class="muted" style="margin:4px 0 10px">Efface toutes vos données stockées sur Firebase et arrête la synchronisation. Les données restent sur cet appareil.</p>
        <button class="btn btn-danger btn-block" id="sy-del">Supprimer mes données en ligne</button></div>
      <p class="muted" style="margin:12px 4px">Connectez-vous avec le même compte sur l'iPhone et l'iPad : classes, résultats, grilles, séances… se mettent à jour automatiquement. Sans réseau, l'app continue de marcher et se synchronise au retour de la connexion.</p>`;
  } else {
    el.innerHTML = `<div class="card" style="background:var(--grad-soft)"><b>📱 Mode actuel : stockage local</b><p class="muted" style="margin:4px 0 0">Vos données restent uniquement sur cet appareil. Connectez-vous ci-dessous pour les synchroniser avec vos autres appareils.</p></div>
      <div class="card" style="margin-top:12px"><h3>☁️ Passer en mode « compte e-mail »</h3>
        <p class="muted" style="margin:4px 0 0">Créez un compte une fois, puis connectez-vous avec le même compte sur chaque appareil.</p>
        <p style="margin:12px 0 6px;font-weight:700;font-size:.92rem">Si ce compte contient déjà des données, que faire de celles de cet appareil ?</p>
        <label class="card" style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;margin:0 0 8px;border:1.5px solid var(--line);cursor:pointer;color:var(--text);font-weight:400"><input type="radio" name="sy-lm" value="merge" ${S.linkMode !== 'replace' ? 'checked' : ''} style="width:auto;margin-top:3px"><span><b>Combiner</b><br><span class="muted" style="font-size:.85rem">Ajoute les données du compte sans effacer celles de l'appareil.</span></span></label>
        <label class="card" style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;margin:0;border:1.5px solid var(--line);cursor:pointer;color:var(--text);font-weight:400"><input type="radio" name="sy-lm" value="replace" ${S.linkMode === 'replace' ? 'checked' : ''} style="width:auto;margin-top:3px"><span><b>Remplacer</b><br><span class="muted" style="font-size:.85rem">Efface cet appareil puis récupère les données du compte.</span></span></label>
        <label>E-mail</label><input id="sy-mail" type="email" autocomplete="username" value="${esc(meta.mail || '')}">
        <label>Mot de passe (6 caractères minimum)</label><input id="sy-pass" type="password" autocomplete="current-password">${errP}
        <div class="row" style="margin-top:12px"><button class="btn btn-grad" id="sy-in">Se connecter</button><button class="btn btn-ghost" id="sy-new">Créer un compte</button></div>
        <button class="link" style="margin-top:10px" id="sy-forgot">Mot de passe oublié ?</button></div>
      ${E2E_TXT}`;
  }
  const $ = s => el.querySelector(s);
  const run = async fn => { S.err = ''; try { await fn(); } catch (e) { S.err = ({ 'auth/invalid-credential': 'E-mail ou mot de passe incorrect.', 'auth/wrong-password': 'Mot de passe incorrect.', 'auth/user-not-found': 'Aucun compte avec cet e-mail.', 'auth/email-already-in-use': 'Un compte existe déjà avec cet e-mail : connectez-vous.', 'auth/weak-password': 'Mot de passe trop court (6 caractères minimum).', 'auth/invalid-email': 'E-mail invalide.', 'auth/network-request-failed': 'Pas de connexion internet.', 'auth/too-many-requests': 'Trop d\'essais : réessayez dans quelques minutes.' })[e.code] || e.message; } refreshUI(); };
  const verifyPassword = async p => { const c = fb.authM.EmailAuthProvider.credential(S.user.email, p); await fb.authM.reauthenticateWithCredential(fb.auth.currentUser, c); };
  if (S.user && S.needKey) {
    $('#sy-kgo').onclick = () => run(async () => { const p = $('#sy-kp').value; if (!p) throw new Error('Saisissez votre mot de passe.');
      await verifyPassword(p); CK = await deriveKey(S.user.email, p); await storeKey(S.user.email, CK); await startSync(); toast('Chiffrement activé ✔'); });
    $('#sy-kout').onclick = () => run(async () => { setMode('local'); forgetKey(); await fb.authM.signOut(fb.auth); });
  } else if (S.user && S.mismatch) {
    $('#sy-mgo').onclick = () => run(async () => { const p = $('#sy-mp').value; if (!p) throw new Error('Saisissez le mot de passe.');
      const k = await deriveKey(S.user.email, p); if ((await keyMatches(k)) !== true) throw new Error('Ce mot de passe ne correspond pas aux données en ligne.');
      CK = k; await storeKey(S.user.email, CK); await startSync(); toast('Données déverrouillées ✔'); });
    $('#sy-mrep').onclick = () => run(async () => { if (!confirm('Remplacer toutes les données en ligne par celles de cet appareil ?')) return;
      unsub && unsub(); unsub = null; S.mismatch = false; await writeCheck(); await forcePushAll(); meta.linked = true; saveMeta(); listen(); toast('Données en ligne remplacées ✔'); });
  } else if (S.user) {
    $('#sy-now').onclick = () => run(async () => { await forcePushAll(); toast('Synchronisé ✔'); });
    $('#sy-out').onclick = () => run(async () => { if (!confirm('Revenir en stockage local ?\nLa synchronisation s\'arrête sur cet appareil. Vos données restent ici et en ligne.')) return; setMode('local'); forgetKey(); await fb.authM.signOut(fb.auth); });
    $('#sy-del').onclick = () => run(async () => {
      if (!confirm('Supprimer toutes vos données en ligne ?\nElles resteront seulement sur cet appareil. Vos autres appareils ne seront plus synchronisés.')) return;
      const { collection, getDocs, deleteDoc } = fb.fs; unsub && unsub(); unsub = null;
      const snap = await getDocs(collection(fb.db, 'epsone', S.user.uid, 'data'));
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      let accountMsg = '';
      try { await fb.authM.deleteUser(fb.auth.currentUser); accountMsg = ' et compte supprimé'; } catch (e) { await fb.authM.signOut(fb.auth); }
      meta.keys = {}; meta.linked = false; saveMeta(); forgetKey(); setMode('local');
      toast('Données en ligne supprimées' + accountMsg + ' ✔');
    });
  } else {
    el.querySelectorAll('[name=sy-lm]').forEach(r => r.onchange = () => { S.linkMode = r.value; });
    const creds = () => { const m = $('#sy-mail').value.trim(), p = $('#sy-pass').value; meta.mail = m; saveMeta(); return [m, p]; };
    const login = create => run(async () => { if (!fb) throw new Error('Firebase indisponible (hors ligne ?)');
      const [m, p] = creds(); if (!m || !p) throw new Error('E-mail et mot de passe requis.');
      CK = await deriveKey(m, p); setMode('cloud');
      try { await (create ? fb.authM.createUserWithEmailAndPassword : fb.authM.signInWithEmailAndPassword)(fb.auth, m, p); await storeKey(m, CK); }
      catch (e) { CK = null; throw e; } });
    $('#sy-in').onclick = () => login(false);
    $('#sy-new').onclick = () => login(true);
    $('#sy-forgot').onclick = () => run(async () => { const [m] = creds(); if (!m) throw new Error('Indiquez votre e-mail.'); await fb.authM.sendPasswordResetEmail(fb.auth, m); toast('E-mail de réinitialisation envoyé'); });
  }
}
window.openSync = () => openPanel('Synchronisation', el => { const d = document.createElement('div'); el.appendChild(d); drawPanel(d); });
window.syncStatusText = statusText;

/* ---------- Mode de stockage (par appareil) ---------- */
function getMode() { try { return localStorage.getItem('epsone_mode'); } catch (e) { return null; } }
function setMode(m) { try { localStorage.setItem('epsone_mode', m); } catch (e) {} try { renderPlus(); } catch (e) {} }
function chooser() {
  if (getMode() || meta.linked || !window.EPSONE_FIREBASE) { if (!getMode()) setMode(meta.linked ? 'cloud' : 'local'); return; }
  const o = document.createElement('div');
  o.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(7,18,42,.72);display:grid;place-items:center;padding:16px';
  o.innerHTML = `<div class="card" style="max-width:460px;width:100%">
      <h3 style="font-size:1.2rem">Où enregistrer vos données ?</h3>
      <p class="muted" style="margin:6px 0 12px">Vous pourrez changer d'avis à tout moment dans Plus → Stockage & synchronisation.</p>
      <button class="menu-item card" data-m="local" style="width:100%;text-align:left;margin-bottom:10px;border:1.5px solid var(--line)"><span class="mi-ic blue" style="font-size:1.4rem">📱</span><span><b>Stockage local</b><span class="muted">Les données restent sur cet appareil. Rien n'est envoyé en ligne.</span></span></button>
      <button class="menu-item card" data-m="cloud" style="width:100%;text-align:left;border:1.5px solid var(--line)"><span class="mi-ic gold" style="font-size:1.4rem">☁️</span><span><b>Compte e-mail</b><span class="muted">Synchronisation entre vos appareils (iPhone, iPad, ordinateur). Données chiffrées sur l'appareil, stockées en Europe, lisibles par vous seul.</span></span></button>
    </div>`;
  document.body.appendChild(o);
  o.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { const m = b.dataset.m; o.remove();
    if (m === 'local') { setMode('local'); toast('Mode stockage local ✔'); } else { setMode('cloud'); window.openSync(); } });
}

boot();
try { renderPlus(); } catch (e) {}
setTimeout(chooser, 600);

/* =========================================================
   EPS Tout en 1 — Onglet PLUS : mise à jour, partage,
   à propos, confidentialité/RGPD, nouvelle année scolaire
   ========================================================= */
const APP_VERSION = '1.9';
const APP_URL = 'https://steffdelaseuva-hue.github.io/eps-tout-en-1/';
const CHANGELOG = [
  { v: '1.9', items: ['Gestion de match : Ultimate et Volley-ball', 'Nouvel outil Natation : distance, temps, coups de bras'] },
  { v: '1.8', items: ['Nouvel outil Course d\'orientation : parcours, balises niv. 1/2/3, obligatoires/facultatives, pénalités, séances, RK, bilan cumulé'] },
  { v: '1.7', items: ['Gestion de match : ajout de l\'escrime (piste, touches casque / cou / buste / bras / dos)'] },
  { v: '1.6', items: ['Gestion de match : ajout du Shortennis'] },
  { v: '1.5', items: ['Nouvel outil Gestion de match : 7 sports, terrain, match au temps ou au point, bonus, zones visées, statistiques, historique'] },
  { v: '1.4', items: ['Niveaux de jeu des élèves (1, 2, 3)', 'Équipes hétérogènes ou homogènes : Composition d\'équipes, Championnat (une poule par niveau), Tournoi, Relais'] },
  { v: '1.3', items: ['Bouton « Écouter de la musique » en haut de l\'app (Apple Music, Spotify, Deezer, YouTube Music)'] },
  { v: '1.2', items: ['Import : fichiers Numbers reconnus, avec la marche à suivre pour les exporter en Excel'] },
  { v: '1.1', items: ['Mes classes : import de fichiers CSV / Excel', 'Bouton « ＋ Élève » pour ajouter un élève en cours d\'année'] },
  { v: '1.0', items: ['Nouvel outil Test VMA : Luc Léger, VAMEVAL, 45-15, Astrand'] },
  { v: '0.9', items: ['Correctif : affichage de la nouvelle icône sur iPad'] },
  { v: '0.8', items: ['Nouvelle icône de l\'app'] },
  { v: '0.7', items: ['Couleur or (au lieu de jaune)', 'Menu Plus : Partager l\'app, Confidentialité & RGPD, À propos, Mise à jour, Nouvelle année scolaire'] },
  { v: '0.6', items: ['Nouvelles icônes originales', 'Logo Chronos EPS sur son outil'] },
  { v: '0.4', items: ['Onglet Plus : mise à jour, partage par QR code, à propos, confidentialité & RGPD', 'Nouvelle année scolaire (sauvegarde + remise à zéro choisie)'] },
  { v: '0.3', items: ['Nouveau nom : EPS Tout en 1, by Steff64'] },
  { v: '0.2', items: ['Tous les outils disponibles (vidéo différée, photo-finish, grilles, suivi…)', 'Chronos EPS (12 élèves) intégré'] },
  { v: '0.1', items: ['Première version : accueil, onglet OUTILS, favoris'] },
];

const schoolYear = (d = new Date()) => { const y = d.getFullYear(); return d.getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`; };
DB.annee = DB.annee || schoolYear();

document.head.insertAdjacentHTML('beforeend', `<style>
.qr-box{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}
.qr-box svg{width:min(240px,70vw);height:auto;border-radius:14px;box-shadow:var(--shadow);border:1px solid var(--line)}
.doc h3{margin:18px 0 6px;font-size:1rem}
.doc p,.doc li{font-size:.92rem;line-height:1.5;margin:0 0 8px}
.doc ul{padding-left:20px;margin:0 0 8px}
.chk{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line);font-size:.92rem}
.chk:last-child{border-bottom:none}
.chk input{width:22px;height:22px;flex:0 0 22px;margin-top:1px;accent-color:var(--blue)}
.step{display:flex;gap:10px;align-items:center;margin:18px 2px 8px}
.step .n{width:28px;height:28px;border-radius:50%;background:var(--grad);color:#fff;display:grid;place-items:center;font-weight:900;font-size:.85rem;flex:0 0 28px}
.step h3{font-size:1rem;margin:0}
.ver-badge{display:inline-block;padding:3px 10px;border-radius:99px;background:var(--grad);color:#fff;font-weight:800;font-size:.8rem}
</style>`);

/* ---------- Panneau générique (réutilise l'écran d'outil) ---------- */
function openPanel(title, render) {
  currentTool = null;
  document.getElementById('screen-title').textContent = title;
  document.getElementById('screen-star').style.visibility = 'hidden';
  const body = document.getElementById('screen-body'); body.className = 'body';
  cleanup = render(body) || null;
  document.getElementById('screen').classList.add('open');
  document.getElementById('screen-body').scrollTop = 0;
}
const appLink = () => location.protocol === 'https:' ? location.origin + location.pathname.replace(/[^/]*$/, '') : APP_URL;

/* ---------- 🔄 Mise à jour ---------- */
function openUpdate() {
  openPanel('Mise à jour', el => {
    el.innerHTML = `<div class="card" style="text-align:center">
        <div class="muted">Version installée</div><div style="font-size:2.4rem;font-weight:900;margin:4px 0">v${APP_VERSION}</div>
        <div id="st" class="muted">Recherche d'une nouvelle version…</div>
        <button class="btn btn-grad btn-block" style="margin-top:14px" id="up">🔄 Mettre à jour l'application</button>
        <p class="muted" style="margin:10px 0 0">Recharge la dernière version publiée. Vos données (classes, grilles, suivi…) sont conservées.</p></div>
      <div class="section-title"><h2>Nouveautés</h2></div>
      <div class="card doc">${CHANGELOG.map(c => `<h3><span class="ver-badge">v${c.v}</span></h3><ul>${c.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`).join('')}</div>`;
    const st = el.querySelector('#st');
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.json()).then(v => {
      st.innerHTML = v.version !== APP_VERSION
        ? `<b style="color:var(--ok)">Nouvelle version disponible : v${esc(v.version)}</b>`
        : '✔ Vous avez la dernière version.';
    }).catch(() => st.textContent = navigator.onLine ? 'Vérification impossible pour le moment.' : 'Hors connexion : vérification impossible.');
    el.querySelector('#up').onclick = async () => {
      if (!navigator.onLine) return toast('Connexion internet nécessaire');
      toast('Mise à jour…');
      try {
        const reg = await navigator.serviceWorker?.getRegistration();
        if (reg) { await reg.update(); await reg.unregister(); }
        if (window.caches) for (const k of await caches.keys()) await caches.delete(k);
      } catch (e) {}
      location.replace(location.pathname + '?v=' + Date.now() + '#plus');
    };
  });
}

/* ---------- 🔗 Partager l'app ---------- */
function openShare() {
  const url = appLink();
  openPanel('Partager l\'app', el => {
    el.innerHTML = `<div class="card qr-box"><h3>EPS Tout en 1</h3>${QR.svg(url)}<div class="muted" style="word-break:break-all">${esc(url)}</div>
        <div class="row" style="width:100%;margin-top:6px"><button class="btn btn-grad" id="sh">📤 Partager</button><button class="btn btn-ghost" id="cp">📋 Copier le lien</button></div></div>`;
    const copy = async t => { try { await navigator.clipboard.writeText(t); toast('Copié ✔'); } catch (e) { prompt('Copiez :', t); } };
    el.querySelector('#sh').onclick = async () => { if (navigator.share) { try { await navigator.share({ title: 'EPS Tout en 1', url }); } catch (e) {} } else copy(url); };
    el.querySelector('#cp').onclick = () => copy(url);
  });
}

/* ---------- ℹ️ À propos ---------- */
function openAbout() {
  openPanel('À propos', el => {
    el.innerHTML = `<div class="hero" style="text-align:center"><img class="logo" src="icons/icone-v2-192.png" alt="" style="margin:0 auto 10px;width:72px;height:72px;border-radius:18px">
        <h2>EPS Tout en 1</h2><p style="margin:6px auto 0">by <b>Steff64</b> · version ${APP_VERSION}</p></div>
      <div class="card doc" style="margin-top:14px">
        <h3>🎯 L'objectif</h3>
        <p>Réunir dans une seule application les outils numériques utiles en cours d'EPS : chronométrer, minuter, former des équipes, gérer un tournoi, évaluer et suivre les élèves, sur tablette, téléphone ou ordinateur.</p>
        <h3>🧰 Ce qu'elle contient</h3>
        <p>${TOOLS.length} outils répartis en ${CATS.length} domaines : ${CATS.map(c => c.name).join(' · ')}.</p>
        <h3>📲 Installer l'app</h3>
        <ul><li><b>iPad / iPhone</b> : ouvrir dans Safari → bouton Partager ⬆️ → « Sur l'écran d'accueil ».</li>
          <li><b>Android</b> : ouvrir dans Chrome → menu ⋮ → « Installer l'application ».</li>
          <li><b>Ordinateur</b> : Chrome ou Edge → icône d'installation dans la barre d'adresse.</li></ul>
        <p>Une fois installée, l'application fonctionne aussi hors connexion, au gymnase comme sur le stade.</p>
        <h3>💾 Changer d'appareil</h3>
        <p>Plus → « Exporter mes données » sur l'ancien appareil, puis « Importer une sauvegarde » sur le nouveau.</p>
        <h3>🙏 Remerciements</h3>
        <p>Idée inspirée d'<i>Outils EPS</i> (outilseps.fr). Conception et développement : Steff64, professeur d'EPS.</p>
      </div>`;
  });
}

/* ---------- 🔒 Confidentialité & RGPD ---------- */
function openPrivacy() {
  openPanel('Confidentialité & RGPD', el => {
    const size = (() => { try { return Math.round(((localStorage.getItem('mesOutilsEPS_v1') || '').length + (localStorage.getItem('chronos-eps-v1') || '').length) / 1024); } catch (e) { return 0; } })();
    const nbEleves = DB.classes.reduce((a, c) => a + c.students.length, 0);
    el.innerHTML = `<div class="card doc">
        <h3>🔐 En résumé</h3>
        <ul><li><b>Aucun compte</b>, aucune inscription.</li>
          <li><b>Aucune donnée envoyée sur un serveur</b> : tout reste dans le navigateur de cet appareil.</li>
          <li><b>Aucune publicité</b>, aucun cookie de suivi, aucune statistique de visite.</li></ul>
        <h3>📦 Où sont stockées les données ?</h3>
        <p>Classes, listes d'élèves, évaluations, suivi, dispenses… sont enregistrés dans le stockage local du navigateur (localStorage) de cet appareil uniquement. Elles ne sont ni synchronisées ni partagées. Effacer les données de Safari/Chrome ou désinstaller l'app les supprime.</p>
        <h3>📷 Caméra</h3>
        <p>La vidéo différée et le photo-finish utilisent la caméra uniquement pendant que l'outil est ouvert. Les images restent en mémoire vive, ne sont jamais enregistrées ni envoyées, et sont effacées à la fermeture de l'outil.</p>
        <h3>🌐 Hébergement</h3>
        <p>L'application est hébergée sur GitHub Pages. Comme pour tout site web, l'hébergeur peut enregistrer des données techniques de connexion (adresse IP) lors du chargement de la page. Aucune donnée d'élève ne transite par ce biais.</p>
        <h3>🧑‍🏫 Bonnes pratiques pour l'enseignant</h3>
        <ul><li><b>Minimiser</b> : prénom + initiale du nom suffisent le plus souvent.</li>
          <li><b>Dispenses</b> : ne pas saisir de motif médical ni de diagnostic, seulement les dates et les aménagements.</li>
          <li><b>Exports</b> (CSV, JSON) : les ranger dans un espace sécurisé (ENT, espace professionnel), pas sur une clé USB perdue ou un cloud personnel.</li>
          <li><b>Appareil</b> : verrouiller la tablette par un code, surtout si elle est partagée.</li>
          <li><b>Durée</b> : effacer les données en fin d'année avec « Nouvelle année scolaire ».</li></ul>
        <p>Pour toute question sur l'usage de données d'élèves dans votre établissement, rapprochez-vous de votre chef d'établissement et du délégué à la protection des données (DPD) de votre académie. Ces informations ne constituent pas un avis juridique.</p>
      </div>
      <div class="section-title"><h2>Mes données sur cet appareil</h2></div>
      <div class="card"><div class="result" style="margin-top:0">
          <div class="card"><b>${DB.classes.length}</b><small>classes</small></div><div class="card"><b>${nbEleves}</b><small>élèves</small></div><div class="card"><b>${size} Ko</b><small>stockés</small></div></div>
        <div class="row" style="margin-top:12px"><button class="btn btn-ghost" onclick="exportData()">💾 Exporter</button><button class="btn btn-danger" id="del">🗑 Tout effacer</button></div></div>`;
    el.querySelector('#del').onclick = () => { resetAll(); closeTool(); };
  });
}

/* ---------- 🗓 Nouvelle année scolaire ---------- */
function openNewYear(back) {
  const next = (() => { const m = /^(\d{4})-(\d{4})$/.exec(DB.annee); return m ? `${+m[1] + 1}-${+m[2] + 1}` : schoolYear(); })();
  const counts = {
    classes: DB.classes.length, evals: DB.grilles.reduce((a, g) => a + Object.keys(g.evals || {}).length, 0),
    suivi: Object.keys(DB.suivi).length, dispenses: DB.dispenses.length, oublis: Object.keys(DB.oublis).length, journal: DB.journal.length,
  };
  const OPTS = [
    ['classes', true, `Classes et listes d'élèves (${counts.classes}) + prénoms de Chronos EPS`],
    ['keepNames', false, `↳ … mais garder les noms de classes (listes vidées)`],
    ['evals', true, `Évaluations saisies dans les grilles (${counts.evals} classe·s) — les grilles sont conservées`],
    ['suivi', true, `Tableaux de suivi (${counts.suivi})`],
    ['dispenses', true, `Dispenses (${counts.dispenses})`],
    ['oublis', true, `Oublis de tenue (${counts.oublis} classe·s)`],
    ['journal', true, `Journal de musculation (${counts.journal} entrées)`],
    ['grilles', false, `Mes modèles de grilles d'évaluation (${DB.grilles.length})`],
    ['debrief', false, `Mes questions de débrief (${DB.debrief.length})`],
    ['favs', false, 'Favoris et outils récents'],
  ];
  openPanel('Nouvelle année scolaire', el => {
    let saved = false;
    el.innerHTML = `<div class="card" style="text-align:center"><div class="muted">Année en cours</div><div style="font-size:1.8rem;font-weight:900">${esc(DB.annee)}</div></div>
      <div class="step"><span class="n">1</span><h3>Sauvegarder l'année ${esc(DB.annee)}</h3></div>
      <div class="card"><p class="muted" style="margin:0 0 10px">Fortement conseillé : un fichier de sauvegarde permet de tout retrouver plus tard (Plus → Importer).</p>
        <button class="btn btn-grad btn-block" id="bk">💾 Télécharger la sauvegarde ${esc(DB.annee)}</button><div id="bks" class="muted" style="margin-top:8px;text-align:center"></div></div>
      <div class="step"><span class="n">2</span><h3>Choisir ce qu'on remet à zéro</h3></div>
      <div class="card">${OPTS.map(([k, on, l]) => `<label class="chk"><input type="checkbox" data-k="${k}" ${on ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>
      <div class="step"><span class="n">3</span><h3>Démarrer la nouvelle année</h3></div>
      <div class="card"><label>Nouvelle année</label><input id="ny" value="${esc(next)}">
        <button class="btn btn-grad btn-block" style="margin-top:12px" id="go">🚀 Démarrer l'année</button></div>`;
    const $ = s => el.querySelector(s), opt = k => $(`[data-k="${k}"]`).checked;
    $('#bk').onclick = () => {
      download(`eps-tout-en-1-sauvegarde-${DB.annee}.json`, JSON.stringify({ ...DB, exportDate: new Date().toISOString() }, null, 2), 'application/json');
      saved = true; $('#bks').textContent = '✔ Sauvegarde téléchargée'; };
    $('#go').onclick = () => {
      const ny = $('#ny').value.trim() || next;
      if (!saved && !confirm('Vous n\'avez pas téléchargé de sauvegarde. Continuer quand même ?')) return;
      if (!confirm(`Démarrer l'année ${ny} ?\nLes éléments cochés seront définitivement effacés de cet appareil.`)) return;
      if (opt('classes')) {
        DB.classes = opt('keepNames') ? DB.classes.map(c => ({ name: c.name, students: [] })) : [];
        try { const S = JSON.parse(localStorage.getItem('chronos-eps-v1')); if (Array.isArray(S)) { S.forEach(c => c.name = ''); localStorage.setItem('chronos-eps-v1', JSON.stringify(S)); } } catch (e) {}
      }
      if (opt('grilles')) DB.grilles = []; else if (opt('evals')) DB.grilles.forEach(g => g.evals = {});
      if (opt('suivi')) DB.suivi = {};
      if (opt('dispenses')) DB.dispenses = [];
      if (opt('oublis')) DB.oublis = {};
      if (opt('journal')) DB.journal = [];
      if (opt('debrief')) DB.debrief = [];
      if (opt('favs')) { DB.favs = []; DB.recent = []; }
      DB.annee = ny; save(); renderHome(); renderPlusYear();
      toast(`Bonne année scolaire ${ny} ! 🎉`);
      if (back) { closeTool(); openTool(back); } else closeTool();
    };
  });
}


/* ---------- Styles menu Plus / accueil ---------- */
document.head.insertAdjacentHTML('beforeend', `<style>
.menu-sec{margin:22px 4px 8px;font-size:.78rem;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted)}
.menu-item{display:flex;align-items:center;gap:14px;padding:12px 14px;border-bottom:1px solid var(--line);cursor:pointer;text-decoration:none;color:inherit}
.menu-item:last-child{border-bottom:none}
.menu-item:active{background:var(--grad-soft)}
.mi-ic{position:relative;width:48px;height:48px;flex:0 0 48px;border-radius:14px;display:grid;place-items:center;font-size:1.35rem;border:1px solid var(--line);box-shadow:0 3px 8px rgba(11,42,91,.08)}
.mi-ic .ico{width:26px;height:26px}.mi-ic .ico-img{width:48px;height:48px;border-radius:14px}
.mi-ic.gold{background:linear-gradient(135deg,rgba(212,175,55,.22),rgba(212,175,55,.08))}
.mi-ic.blue{background:linear-gradient(135deg,rgba(30,91,216,.18),rgba(30,91,216,.06))}
.mi-ic.navy{background:linear-gradient(135deg,rgba(11,42,91,.14),rgba(11,42,91,.04))}
.mi-ic.grad{background:var(--grad-soft)}
.menu-item b{display:block;font-size:1rem}
.menu-item .muted{font-size:.84rem}
.menu-item .chev{margin-left:auto;color:var(--muted);font-size:1.2rem}
details.faq{border-bottom:1px solid var(--line);padding:12px 0}
</style>`);

/* ---------- Menu Plus ---------- */
function renderPlus() {
  const box = document.getElementById('plus-menu'); if (!box) return;
  const item = (ic, color, title, sub, action) =>
    `<div onclick="${action}" class="menu-item"><span class="mi-ic ${color}">${ico(ic)}</span><span><b>${title}</b><span class="muted">${sub}</span></span><span class="chev">›</span></div>`;
  box.innerHTML = `
    <div class="menu-sec">Données & partage</div>
    <div class="card" style="padding:0">
      ${item('save', 'blue', 'Exporter mes données', 'Fichier de sauvegarde JSON', 'exportData()')}
      ${item('restore', 'blue', 'Importer une sauvegarde', 'Restaurer depuis un fichier JSON', "document.getElementById('imp').click()")}
      ${item('share', 'grad', 'Partager l\'app', 'QR code et lien', 'openShare()')}
    </div>
    <div class="menu-sec">Aide & infos</div>
    <div class="card" style="padding:0">
      ${item('lock', 'navy', 'Confidentialité & RGPD', 'Données, caméra, suppression', 'openPrivacy()')}
      ${item('info', 'navy', 'À propos', 'Objectif, installation, crédits', 'openAbout()')}
      ${item('update', 'grad', 'Mise à jour', `Version ${APP_VERSION} · nouveautés`, 'openUpdate()')}
    </div>
    <div class="menu-sec">Année scolaire</div>
    <div class="card" style="padding:0">
      ${item('calendar', 'gold', 'Nouvelle année scolaire', `Année en cours : ${esc(DB.annee)} · archiver ou repartir à zéro`, 'openNewYear()')}
      ${item('trash', 'navy', '<span style="color:var(--danger)">Tout effacer</span>', 'Supprime toutes les données de cet appareil', 'resetAll()')}
    </div>
    <p class="muted" style="text-align:center;margin:22px 0 6px">EPS Tout en 1 · v${APP_VERSION} · by <b>Steff64</b></p>`;
}
const renderPlusYear = renderPlus;

const _renderHome = renderHome;
renderHome = function () { _renderHome(); renderPlus(); };
renderHome();

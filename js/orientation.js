/* =========================================================
   EPS Tout en 1 — Outil « Course d'orientation »
   Parcours (balises, niveaux, obligatoires) · Séance (départs,
   arrivées, balises, pénalités, RK) · Bilan cumulé
   ========================================================= */
DB.co = DB.co || { parcours: [], seances: [], current: null };
ICONS.co = '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/><circle cx="12" cy="12" r=".8" fill="url(#icoGrad)"/>';

const CO_TYPES = {
  etoile:  ['Étoile / papillon', 'Retour au départ entre chaque balise.'],
  reseau:  ['Réseau de postes', 'L\'élève choisit ses balises (facultatives) pour marquer un maximum de points.'],
  suivi:   ['Suivi d\'itinéraire', 'Itinéraire imposé, balises dans l\'ordre.'],
  relais:  ['Relais', 'Les membres du groupe partent l\'un après l\'autre.'],
  libre:   ['Parcours libre', 'Balises dans l\'ordre choisi.'],
};
const coId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const hms = s => { if (s == null || isNaN(s)) return '–'; s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
const clock = t => t ? new Date(t).toLocaleTimeString('fr-FR') : '––:––:––';
const mpk = (sec, km) => km > 0 && sec > 0 ? hms(sec / km) + ' /km' : '–';

document.head.insertAdjacentHTML('beforeend', `<style>
.co-tabs{display:flex;gap:6px;margin-bottom:12px}
.co-tabs button{flex:1;padding:11px 6px;border-radius:12px;border:1.5px solid var(--line);background:var(--card);font-weight:800}
.co-tabs button.on{background:var(--grad);color:#fff;border-color:transparent}
.bal-row{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--line)}
.bal-row:last-child{border-bottom:none}
.bal-row input.num{width:64px;text-align:center;padding:7px}
.bal-row .lvl{margin:0;flex:1}
.bal-row .lvl button{padding:7px 2px}
.chk-ob{display:flex;align-items:center;gap:4px;font-size:.75rem;font-weight:800;color:var(--muted);white-space:nowrap}
.chk-ob input{width:18px;height:18px}
.run{border:2px solid var(--line);border-radius:16px;padding:12px;background:var(--card);margin-top:10px}
.run.go{border-color:#2F6BD8}.run.fin{border-color:var(--gold);background:var(--grad-soft)}
.run-h{display:flex;align-items:center;gap:8px}
.run-h b{flex:1}
.run-t{font-size:1.6rem;font-weight:900;font-variant-numeric:tabular-nums}
.bal-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.bal-chips button{min-width:46px;padding:8px 6px;border-radius:10px;border:1.5px solid var(--line);background:var(--card);font-weight:900;font-size:.85rem}
.bal-chips button.on{background:#1B9E5A;color:#fff;border-color:transparent}
.bal-chips button.ob{box-shadow:inset 0 -3px 0 var(--danger)}
.bal-chips button sup{font-size:.6rem;opacity:.8}
.co-times{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.co-times input{padding:8px}
</style>`);

TOOL_IMPL.co = function (el) {
  let tab = DB.co.current ? 'seance' : 'parcours';
  const P = id => DB.co.parcours.find(p => p.id === id);

  function frame() {
    el.innerHTML = `<div class="co-tabs">${[['parcours', '🗺 Parcours'], ['seance', '⏱ Séance'], ['bilan', '📊 Bilan']].map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div><div id="co-body"></div>`;
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; frame(); });
    const body = el.querySelector('#co-body');
    ({ parcours: listParcours, seance: seance, bilan: bilan })[tab](body);
  }

  /* ================= 1. PARCOURS ================= */
  function listParcours(box) {
    box.innerHTML = `<div class="card" style="padding:0">${DB.co.parcours.length ? DB.co.parcours.map((p, i) => `<div class="list-item"><div style="flex:1"><b>${esc(p.nom)}</b>
        <div class="muted">${CO_TYPES[p.type][0]} · ${p.distance ? (p.distance / 1000).toFixed(2).replace('.', ',') + ' km' : 'distance ?'}${p.deniv ? ' · D+ ' + p.deniv + ' m' : ''} · ${p.balises.length} balises${p.alloue ? ' · ' + p.alloue + ' min' : ''}</div></div>
        <button class="btn btn-ghost" data-e="${i}">✏️</button><button class="btn btn-ghost" data-c="${i}" title="Dupliquer">⧉</button></div>`).join('') : '<div class="empty">Aucun parcours. Créez le premier !</div>'}</div>
      <button class="btn btn-grad btn-block" style="margin-top:12px" id="new">＋ Créer un parcours</button>`;
    box.querySelector('#new').onclick = () => editParcours(box, null);
    box.querySelectorAll('[data-e]').forEach(b => b.onclick = () => editParcours(box, +b.dataset.e));
    box.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { const c = JSON.parse(JSON.stringify(DB.co.parcours[+b.dataset.c])); c.id = coId(); c.nom += ' (copie)'; DB.co.parcours.push(c); save(); listParcours(box); });
  }

  function editParcours(box, idx) {
    const p = idx != null ? JSON.parse(JSON.stringify(DB.co.parcours[idx])) : {
      id: coId(), nom: 'Parcours 1', type: 'libre', distance: 1200, denivOn: false, deniv: 0, alloue: 20, ecart: 2,
      balises: Array.from({ length: 8 }, (_, i) => ({ num: 31 + i, niv: 1, ob: true })),
      pts: [1, 2, 3], penWrongP: 1, penWrongS: 30, penMissS: 60, penOverP: 1 };
    const draw = () => {
      box.innerHTML = `<div class="card"><h3>${idx != null ? 'Modifier' : 'Nouveau'} parcours</h3>
        <label>Nom</label><input id="nm" value="${esc(p.nom)}">
        <label>Type de parcours</label><select id="ty">${Object.entries(CO_TYPES).map(([k, v]) => `<option value="${k}" ${p.type === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>
        <p class="muted" style="margin:6px 0 0">${CO_TYPES[p.type][1]}</p>
        <div class="row"><div><label>Distance (m)</label><input id="di" type="number" value="${p.distance}"></div><div><label>Temps attribué (min)</label><input id="al" type="number" value="${p.alloue}"></div><div><label>Écart toléré (± min)</label><input id="ec" type="number" value="${p.ecart}"></div></div>
        <label style="display:flex;gap:8px;align-items:center;margin-top:12px"><input type="checkbox" id="dn" ${p.denivOn ? 'checked' : ''} style="width:auto"> Option dénivelé</label>
        ${p.denivOn ? `<label>Dénivelé positif (m)</label><input id="dv" type="number" value="${p.deniv}">` : ''}
      </div>
      <div class="card" style="margin-top:12px"><h3>Balises (${p.balises.length})</h3>
        <div class="row" style="align-items:end"><div><label>Nombre</label><input id="nb" type="number" min="1" value="${p.balises.length}"></div><div><label>1er numéro</label><input id="n0" type="number" value="${p.balises[0]?.num ?? 31}"></div><button class="btn btn-ghost" style="flex:0 0 auto" id="genb">Générer</button></div>
        <div class="row" style="margin-top:8px"><button class="btn btn-ghost" id="allob">Toutes obligatoires</button><button class="btn btn-ghost" id="allfa">Toutes facultatives</button></div>
        <div style="margin-top:8px">${p.balises.map((b, i) => `<div class="bal-row"><input class="num" type="number" data-num="${i}" value="${b.num}">
          <div class="lvl">${[1, 2, 3].map(l => `<button data-niv="${i}" data-l="${l}" class="${b.niv === l ? 'on' : ''}">Niv ${l}</button>`).join('')}</div>
          <label class="chk-ob"><input type="checkbox" data-ob="${i}" ${b.ob ? 'checked' : ''}>oblig.</label><button class="btn btn-ghost" style="padding:6px 9px" data-rm="${i}">✕</button></div>`).join('')}</div>
        <button class="btn btn-ghost btn-block" style="margin-top:8px" id="addb">＋ Ajouter une balise</button></div>
      <div class="card" style="margin-top:12px"><h3>Points & pénalités</h3>
        <div class="row"><div><label>Points niveau 1</label><input id="p1" type="number" value="${p.pts[0]}"></div><div><label>Niveau 2</label><input id="p2" type="number" value="${p.pts[1]}"></div><div><label>Niveau 3</label><input id="p3" type="number" value="${p.pts[2]}"></div></div>
        <label>Mauvaise balise poinçonnée</label><div class="row"><div><input id="pwp" type="number" value="${p.penWrongP}"><small class="muted">point(s) en moins</small></div><div><input id="pws" type="number" value="${p.penWrongS}"><small class="muted">secondes ajoutées</small></div></div>
        <label>Balise obligatoire manquante</label><input id="pms" type="number" value="${p.penMissS}"><small class="muted">secondes ajoutées par balise</small>
        <label>Dépassement du temps attribué + écart</label><input id="pop" type="number" value="${p.penOverP}"><small class="muted">point(s) en moins par minute de retard</small></div>
      <div class="row" style="margin-top:12px"><button class="btn btn-grad" id="sv">💾 Enregistrer</button><button class="btn btn-ghost" id="bk">Annuler</button>${idx != null ? '<button class="btn btn-danger" id="del">Supprimer</button>' : ''}</div>`;
      const $ = s => box.querySelector(s);
      const read = () => { p.nom = $('#nm').value.trim() || 'Parcours'; p.distance = +$('#di').value || 0; p.alloue = +$('#al').value || 0; p.ecart = +$('#ec').value || 0;
        p.denivOn = $('#dn').checked; if ($('#dv')) p.deniv = +$('#dv').value || 0;
        p.pts = [+$('#p1').value || 0, +$('#p2').value || 0, +$('#p3').value || 0]; p.penWrongP = +$('#pwp').value || 0; p.penWrongS = +$('#pws').value || 0; p.penMissS = +$('#pms').value || 0; p.penOverP = +$('#pop').value || 0;
        box.querySelectorAll('[data-num]').forEach(i => p.balises[+i.dataset.num].num = +i.value || 0); };
      $('#ty').onchange = () => { read(); p.type = $('#ty').value; if (p.type === 'reseau') p.balises.forEach(b => b.ob = false); draw(); };
      $('#dn').onchange = () => { read(); draw(); };
      $('#genb').onclick = () => { read(); const n = Math.max(1, +$('#nb').value || 1), n0 = +$('#n0').value || 31;
        p.balises = Array.from({ length: n }, (_, i) => p.balises[i] ? { ...p.balises[i], num: n0 + i } : { num: n0 + i, niv: 1, ob: p.type !== 'reseau' }); draw(); };
      $('#allob').onclick = () => { read(); p.balises.forEach(b => b.ob = true); draw(); };
      $('#allfa').onclick = () => { read(); p.balises.forEach(b => b.ob = false); draw(); };
      $('#addb').onclick = () => { read(); const last = p.balises[p.balises.length - 1]; p.balises.push({ num: last ? last.num + 1 : 31, niv: 1, ob: p.type !== 'reseau' }); draw(); };
      box.querySelectorAll('[data-niv]').forEach(b => b.onclick = () => { read(); p.balises[+b.dataset.niv].niv = +b.dataset.l; draw(); });
      box.querySelectorAll('[data-ob]').forEach(c => c.onchange = () => { p.balises[+c.dataset.ob].ob = c.checked; });
      box.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { read(); p.balises.splice(+b.dataset.rm, 1); draw(); });
      $('#bk').onclick = () => listParcours(box);
      if ($('#del')) $('#del').onclick = () => { if (confirm('Supprimer ce parcours ?')) { DB.co.parcours.splice(idx, 1); save(); listParcours(box); } };
      $('#sv').onclick = () => { read(); const nums = p.balises.map(b => b.num); if (new Set(nums).size !== nums.length) return toast('Deux balises ont le même numéro');
        if (idx != null) DB.co.parcours[idx] = p; else DB.co.parcours.push(p); save(); toast('Parcours enregistré ✔'); listParcours(box); };
    };
    draw();
  }

  /* ================= 2. SÉANCE ================= */
  function result(r, p) {
    const found = new Set(r.found);
    const pts = p.balises.filter(b => found.has(b.num)).reduce((a, b) => a + (p.pts[b.niv - 1] || 0), 0);
    const miss = p.balises.filter(b => b.ob && !found.has(b.num)).length;
    const temps = r.dep && r.arr ? (r.arr - r.dep) / 1000 : null;
    const limit = (p.alloue + p.ecart) * 60;
    const overMin = temps != null && p.alloue ? Math.max(0, Math.ceil((temps - limit) / 60)) : 0;
    const penS = r.wrong * p.penWrongS + miss * p.penMissS, penP = r.wrong * p.penWrongP + overMin * p.penOverP;
    const km = (p.distance || 0) / 1000, kmE = km + (p.denivOn ? (p.deniv || 0) / 100 : 0);
    let statut = '';
    if (temps != null && p.alloue) { const d = temps / 60 - p.alloue; statut = Math.abs(d) <= p.ecart ? '✔ dans l\'écart' : d > 0 ? `hors délai +${Math.ceil(temps / 60 - p.alloue - p.ecart)} min` : 'plus rapide que prévu'; }
    return { pts, miss, temps, penS, penP, total: temps != null ? temps + penS : null, score: pts - penP, overMin, km, kmE, statut,
      rk: temps ? mpk(temps, km) : '–', rkE: temps && p.denivOn ? mpk(temps, kmE) : null, vit: temps && km ? (km / (temps / 3600)).toFixed(1).replace('.', ',') + ' km/h' : '–' };
  }

  function seance(box) {
    const cur = DB.co.current;
    if (!cur) return prepare(box);
    const p = P(cur.parcours); if (!p) { DB.co.current = null; save(); return prepare(box); }
    let raf;
    const draw = () => {
      const rs = cur.runs.map(r => ({ r, x: result(r, p) }));
      box.innerHTML = `<div class="card"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><div><b>${esc(p.nom)}</b><div class="muted">${esc(cur.classe || '')} · ${CO_TYPES[p.type][0]} · ${p.balises.length} balises${p.alloue ? ` · ${p.alloue} min ± ${p.ecart}` : ''}</div></div><div class="run-t" id="now">${clock(Date.now())}</div></div>
          <div class="row" style="margin-top:10px"><button class="btn btn-grad" id="all">🚩 Départ groupé</button><div style="display:flex;gap:6px;align-items:center;flex:1.3"><input id="gap" type="number" value="${cur.gap || 60}" style="width:70px;padding:8px"><button class="btn btn-ghost" id="stag" style="padding:9px 8px;font-size:.8rem">Départs échelonnés (s)</button></div></div>
          <p class="muted" style="margin:8px 0 0;font-size:.8rem">Balises : touchez un numéro trouvé (souligné rouge = obligatoire).</p></div>
        ${rs.map(({ r, x }, i) => `<div class="run ${r.arr ? 'fin' : r.dep ? 'go' : ''}"><div class="run-h"><b>${esc(r.name)}</b><span class="run-t" data-live="${i}">${r.dep ? hms(((r.arr || Date.now()) - r.dep) / 1000) : '0:00'}</span></div>
            ${r.members.length > 1 || r.name !== r.members[0] ? `<div class="muted" style="font-size:.8rem">${r.members.map(esc).join(', ')}</div>` : ''}
            <div class="co-times"><div><label style="margin:0 0 3px">Départ</label>${r.dep ? `<input type="time" step="1" data-dep="${i}" value="${new Date(r.dep).toTimeString().slice(0, 8)}">` : `<button class="btn btn-grad btn-block" data-go="${i}">▶ Départ${r.plan ? ' ' + clock(r.plan).slice(0, 5) : ''}</button>`}</div>
              <div><label style="margin:0 0 3px">Arrivée</label>${r.arr ? `<input type="time" step="1" data-arr="${i}" value="${new Date(r.arr).toTimeString().slice(0, 8)}">` : `<button class="btn ${r.dep ? 'btn-danger' : 'btn-ghost'} btn-block" data-fin="${i}" ${r.dep ? '' : 'disabled'}>🏁 Arrivée</button>`}</div></div>
            <div class="bal-chips">${p.balises.map(b => `<button data-b="${i}" data-n="${b.num}" class="${r.found.includes(b.num) ? 'on' : ''} ${b.ob ? 'ob' : ''}">${b.num}<sup> N${b.niv}</sup></button>`).join('')}</div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:8px;font-size:.85rem"><span>Mauvaises balises :</span><button class="btn btn-ghost" style="padding:5px 12px" data-wm="${i}">−</button><b>${r.wrong}</b><button class="btn btn-ghost" style="padding:5px 12px" data-wp="${i}">+</button></div>
            <div class="muted" style="margin-top:6px;font-size:.8rem">${r.found.length}/${p.balises.length} balises · <b style="color:var(--text)">${x.score} pts</b>${x.penP ? ` (−${x.penP})` : ''}${x.miss ? ` · ${x.miss} oblig. manquante(s)` : ''}${x.temps != null ? ` · RK ${x.rk}${x.penS ? ` · pénalités +${hms(x.penS)}` : ''}${x.statut ? ' · ' + x.statut : ''}` : ''}</div></div>`).join('')}
        <div class="section-title"><h2>Classement</h2></div>${ranking(rs, p)}
        <div class="row" style="margin-top:12px"><button class="btn btn-grad" id="save">💾 Terminer et enregistrer la séance</button><button class="btn btn-ghost" id="cancel">Abandonner</button></div>`;
      const $ = s => box.querySelector(s), keep = () => save();
      $('#all').onclick = () => { const t = Date.now(); cur.runs.forEach(r => { if (!r.dep) r.dep = t; }); beep(1300, .4); keep(); draw(); };
      $('#stag').onclick = () => { cur.gap = Math.max(5, +$('#gap').value || 60); const t0 = Date.now() + 60000; cur.runs.forEach((r, i) => r.plan = t0 + i * cur.gap * 1000); keep(); toast('Horaires de départ prévus (1er départ dans 1 min)'); draw(); };
      box.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { cur.runs[+b.dataset.go].dep = Date.now(); beep(1300, .3); keep(); draw(); });
      box.querySelectorAll('[data-fin]').forEach(b => b.onclick = () => { cur.runs[+b.dataset.fin].arr = Date.now(); beep(1000, .3); keep(); draw(); });
      const setT = (i, k, v) => { const [h, m, s] = v.split(':').map(Number); const d = new Date(cur.runs[i][k]); d.setHours(h || 0, m || 0, s || 0, 0); cur.runs[i][k] = d.getTime(); keep(); draw(); };
      box.querySelectorAll('[data-dep]').forEach(inp => inp.onchange = () => setT(+inp.dataset.dep, 'dep', inp.value));
      box.querySelectorAll('[data-arr]').forEach(inp => inp.onchange = () => setT(+inp.dataset.arr, 'arr', inp.value));
      box.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { const r = cur.runs[+b.dataset.b], n = +b.dataset.n; r.found = r.found.includes(n) ? r.found.filter(x => x !== n) : [...r.found, n]; keep(); draw(); });
      box.querySelectorAll('[data-wp]').forEach(b => b.onclick = () => { cur.runs[+b.dataset.wp].wrong++; keep(); draw(); });
      box.querySelectorAll('[data-wm]').forEach(b => b.onclick = () => { const r = cur.runs[+b.dataset.wm]; r.wrong = Math.max(0, r.wrong - 1); keep(); draw(); });
      $('#save').onclick = () => { if (cur.runs.some(r => r.dep && !r.arr) && !confirm('Certains élèves ne sont pas arrivés. Enregistrer quand même ?')) return;
        DB.co.seances.push({ ...cur, parcoursSnap: JSON.parse(JSON.stringify(p)) }); DB.co.current = null; save(); toast('Séance enregistrée ✔'); tab = 'bilan'; frame(); };
      $('#cancel').onclick = () => { if (confirm('Abandonner cette séance ? Les temps saisis seront perdus.')) { DB.co.current = null; save(); draw2(); } };
    };
    const draw2 = () => { cancelAnimationFrame(raf); prepare(box); };
    const tick = () => { if (!box.isConnected || !DB.co.current) return; const n = box.querySelector('#now'); if (n) n.textContent = clock(Date.now());
      cur.runs.forEach((r, i) => { const e = box.querySelector(`[data-live="${i}"]`); if (e && r.dep && !r.arr) e.textContent = hms((Date.now() - r.dep) / 1000); });
      raf = requestAnimationFrame(tick); };
    draw(); tick();
  }

  function ranking(rs, p) {
    const done = rs.filter(({ x }) => x.temps != null).sort((a, b) => b.x.score - a.x.score || a.x.total - b.x.total);
    if (!done.length) return '<div class="card empty">Le classement apparaît dès les premières arrivées.</div>';
    return `<div class="card sheet-table"><table><tr><th>#</th><th>Nom</th><th>Pts</th><th>Temps</th><th>+ Pén.</th><th>Total</th><th>RK</th>${p.denivOn ? '<th>RK effort</th>' : ''}<th>Vitesse</th></tr>
      ${done.map(({ r, x }, i) => `<tr><td>${i + 1}</td><td><b>${esc(r.name)}</b></td><td><b>${x.score}</b></td><td>${hms(x.temps)}</td><td>${x.penS ? '+' + hms(x.penS) : '–'}</td><td><b>${hms(x.total)}</b></td><td>${x.rk}</td>${p.denivOn ? `<td>${x.rkE}</td>` : ''}<td>${x.vit}</td></tr>`).join('')}</table>
      <p class="muted" style="font-size:.75rem;margin:6px 0 0">Classement : points (balises − pénalités), puis temps total (temps réalisé + pénalités). RK = rythme au kilomètre${p.denivOn ? ' ; RK effort = avec 100 m de D+ comptés comme 1 km' : ''}.</p></div>`;
  }

  function prepare(box) {
    if (!DB.co.parcours.length) { box.innerHTML = '<div class="card empty">Créez d\'abord un parcours dans l\'onglet 🗺 Parcours.</div>'; return; }
    let mode = 'indiv';
    const draw = () => {
      box.innerHTML = `<div class="card"><h3>Nouvelle séance</h3>
        <label>Parcours</label><select id="pc">${DB.co.parcours.map(p => `<option value="${p.id}">${esc(p.nom)} — ${p.balises.length} balises</option>`).join('')}</select>
        <label>Organisation</label><div class="seg"><button data-md="indiv" class="${mode === 'indiv' ? 'on' : ''}">Parcours individuels</button><button data-md="grp" class="${mode === 'grp' ? 'on' : ''}">Groupes<br><small style="font-weight:600;opacity:.85">homogènes / hétérogènes</small></button></div>
        <div id="who" style="margin-top:10px"></div></div>`;
      box.querySelectorAll('[data-md]').forEach(b => b.onclick = () => { mode = b.dataset.md; draw(); });
      const who = box.querySelector('#who');
      const launch = (runs, classe) => { DB.co.current = { id: coId(), date: Date.now(), parcours: box.querySelector('#pc').value, classe, runs, gap: 60 }; save(); seance(box); };
      if (mode === 'indiv') {
        who.innerHTML = DB.classes.length ? `<label>Classe</label><select id="cl">${DB.classes.map(c => `<option>${esc(c.name)}</option>`).join('')}</select>
          <button class="btn btn-grad btn-block" style="margin-top:12px" id="go">▶ Préparer la séance</button>` : noClassMsg;
        const go = who.querySelector('#go');
        if (go) go.onclick = () => { const c = who.querySelector('#cl').value; launch(studentsOf(c).map(n => ({ name: n, members: [n], dep: null, arr: null, found: [], wrong: 0 })), c); };
      } else {
        mountComposer(who, { id: 'coc', modes: ['random', 'hetero', 'homo'], button: '▶ Former les groupes et préparer la séance',
          onTeams: teams => { const c = who.querySelector('#coc-cls')?.value || ''; launch(teams.map(t => ({ name: t.name.replace('Équipe', 'Groupe'), members: t.members.map(m => m.n), dep: null, arr: null, found: [], wrong: 0 })), c); } });
      }
    };
    draw();
  }

  /* ================= 3. BILAN ================= */
  function bilan(box) {
    const S = DB.co.seances;
    if (!S.length) { box.innerHTML = '<div class="card empty">Aucune séance enregistrée pour l\'instant.</div>'; return; }
    const classes = [...new Set(S.map(s => s.classe || '—'))];
    let cls = classes[0];
    const draw = () => {
      const ss = S.filter(s => (s.classe || '—') === cls);
      const agg = {};
      ss.forEach(s => s.runs.forEach(r => { const x = result(r, s.parcoursSnap);
        r.members.forEach(m => { const a = agg[m] = agg[m] || { n: 0, km: 0, t: 0, pts: 0, bal: 0 };
          if (!r.dep) return; a.n++; a.pts += x.score; a.bal += r.found.length; if (x.temps != null) { a.km += x.km; a.t += x.temps; } }); }));
      const rows = Object.entries(agg).sort((a, b) => a[0].localeCompare(b[0]));
      box.innerHTML = `<div class="card"><label>Classe</label><select id="bc">${classes.map(c => `<option ${c === cls ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
        <div class="section-title"><h2>Cumul des séances (${ss.length})</h2><button class="link" id="exp">Exporter CSV</button></div>
        <div class="card sheet-table"><table><tr><th>Élève</th><th>Séances</th><th>Distance</th><th>Temps</th><th>RK moyen</th><th>Balises</th><th>Points</th></tr>
          ${rows.map(([n, a]) => `<tr><td><b>${esc(n)}</b></td><td>${a.n}</td><td>${a.km.toFixed(2).replace('.', ',')} km</td><td>${hms(a.t)}</td><td>${mpk(a.t, a.km)}</td><td>${a.bal}</td><td><b>${a.pts}</b></td></tr>`).join('')}</table></div>
        <div class="section-title"><h2>Séances</h2></div>
        <div class="card" style="padding:0">${ss.slice().reverse().map(s => { const i = S.indexOf(s), p = s.parcoursSnap, fin = s.runs.filter(r => r.arr).length;
          return `<div class="list-item"><div style="flex:1"><b>${new Date(s.date).toLocaleDateString('fr-FR')} · ${esc(p.nom)}</b><div class="muted">${CO_TYPES[p.type][0]} · ${s.runs.length} ${s.runs[0]?.members.length > 1 ? 'groupes' : 'élèves'} · ${fin} arrivés</div></div><button class="btn btn-ghost" data-v="${i}">👁</button><button class="btn btn-ghost" data-x="${i}">🗑</button></div>`; }).join('')}</div>
        <div id="det"></div>`;
      const $ = s => box.querySelector(s);
      $('#bc').onchange = () => { cls = $('#bc').value; draw(); };
      box.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { if (confirm('Supprimer cette séance ?')) { S.splice(+b.dataset.x, 1); save(); bilan(box); } });
      box.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { const s = S[+b.dataset.v], p = s.parcoursSnap;
        $('#det').innerHTML = `<div class="section-title"><h2>${new Date(s.date).toLocaleDateString('fr-FR')} — ${esc(p.nom)}</h2></div>${ranking(s.runs.map(r => ({ r, x: result(r, p) })), p)}`; $('#det').scrollIntoView({ behavior: 'smooth' }); });
      $('#exp').onclick = () => download(`course-orientation-${cls}.csv`, csv([
        ['Date', 'Parcours', 'Type', 'Participant', 'Membres', 'Départ', 'Arrivée', 'Temps réalisé', 'Balises trouvées', 'Mauvaises balises', 'Oblig. manquantes', 'Points', 'Pénalités temps', 'Temps total', 'Distance (km)', 'RK', 'Vitesse', 'Statut'],
        ...ss.flatMap(s => s.runs.map(r => { const p = s.parcoursSnap, x = result(r, p);
          return [new Date(s.date).toLocaleDateString('fr-FR'), p.nom, CO_TYPES[p.type][0], r.name, r.members.join(', '), r.dep ? clock(r.dep) : '', r.arr ? clock(r.arr) : '', hms(x.temps), r.found.join(' '), r.wrong, x.miss, x.score, hms(x.penS), hms(x.total), x.km.toFixed(2).replace('.', ','), x.rk, x.vit, x.statut]; }))]));
    };
    draw();
  }

  frame();
};

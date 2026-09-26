/* =========================================================
   EPS ONE — Outil « Escalade »
   1/ Création de voies (cotation 3a → 6c + photo de la voie)
   2/ Mode de grimpe : moulinette / tête
   3/ Observables : poses de pieds, temps de grimpe, fluidité, PME
   4/ Outil intégré : vidéo différée
   Photos : une rubrique par voie (DB['escImg_'+id]) pour rester
   légères à synchroniser.
   ========================================================= */
DB.escalade = DB.escalade || { voies: [], passages: [] };
DB.escalade.defis = DB.escalade.defis || [];
DB.escalade.equipes = DB.escalade.equipes || {};
ICONS.escalade = '<path d="M5 21 8 3h11l-2 18z"/><circle cx="11" cy="7" r="1.1"/><circle cx="15" cy="10" r="1.1"/><circle cx="10.5" cy="13" r="1.1"/><circle cx="14" cy="17" r="1.1"/><path d="M12.5 9.5l1.5 3.5-2 2.5M14 13l-3 .5"/>';

const ESC_COT = ['3a', '3b', '3c', '4a', '4b', '4c', '5a', '5a+', '5b', '5b+', '5c', '5c+', '6a', '6a+', '6b', '6b+', '6c'];
const ESC_MODES = { moul: 'Moulinette', tete: 'Tête' };
const ESC_FLU = ['', 'Saccadée', 'Hésitante', 'Fluide', 'Très fluide'];
const escImgKey = id => 'escImg_' + id;
const escCotCol = c => ({ 3: '#3BA55C', 4: '#2F6FE0', 5: '#D9A21B', 6: '#D8433B' })[c[0]] || '#888';
const escBadge = c => `<span style="display:inline-block;min-width:38px;text-align:center;padding:2px 7px;border-radius:8px;background:${escCotCol(c)};color:#fff;font-weight:800;font-size:.85rem">${esc(c)}</span>`;
const escTime = s => s == null || isNaN(s) ? '–' : Math.floor(s / 60) + ':' + (s % 60).toFixed(1).padStart(4, '0').replace('.', ',');

/* Photo : redimensionnée (800 px max) et compressée en JPEG */
function escReadPhoto(file) {
  return new Promise((ok, ko) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => { const r = Math.min(1, 800 / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * r); c.height = Math.round(img.height * r); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg', 0.6)); };
    img.onerror = () => { URL.revokeObjectURL(url); ko(new Error('Image illisible')); };
    img.src = url;
  });
}

TOOL_IMPL.escalade = function (el) {
  const E = DB.escalade = Object.assign({ voies: [], passages: [], defis: [], equipes: {} }, DB.escalade || {});
  let tab = E.voies.length ? 'passage' : 'voies', sub = null;
  // état de la saisie en cours
  const P = { cls: DB.lastClass || (DB.classes[0] || {}).name || '', si: 0, voie: E.lastVoie || '', mode: E.lastMode || 'moul', pieds: 0, pme: 0, flu: 0, t0: null, acc: 0, run: false };
  const sec = () => P.acc + (P.run ? (performance.now() - P.t0) / 1000 : 0);
  let iv = null;
  // chronos du défi en cours (en mémoire)
  const DC = [{ t0: 0, acc: 0, run: false }, { t0: 0, acc: 0, run: false }];
  const dsec = k => DC[k].acc + (DC[k].run ? (performance.now() - DC[k].t0) / 1000 : 0);

  function frame() {
    if (sub) { try { sub(); } catch (e) {} sub = null; }
    el.innerHTML = `<div class="co-tabs" style="flex-wrap:wrap">${[['voies', '🧗 Voies'], ['equipes', '👥 Équipes'], ['passage', '📋 Passage'], ['defis', '⚔️ Défis'], ['video', '🎥 Vidéo'], ['resultats', '📊 Résultats']].map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}" style="flex:1 1 30%">${l}</button>`).join('')}</div><div id="e-body"></div>`;
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; frame(); });
    const box = el.querySelector('#e-body');
    ({ voies, equipes, passage, defis, video, resultats })[tab](box);
  }

  /* ---------- 1/ Voies ---------- */
  function voies(box, edit = null) {
    const v = edit || { id: null, nom: '', cot: '5a' };
    let photo = v.id ? DB[escImgKey(v.id)] || null : null;
    box.innerHTML = `<div class="card"><h3>${v.id ? 'Modifier la voie' : 'Nouvelle voie'}</h3>
        <label>Nom / numéro de la voie</label><input id="vn" value="${esc(v.nom)}" placeholder="Ex. Voie 3 – la jaune">
        <label>Cotation</label><div id="vc" style="display:flex;flex-wrap:wrap;gap:6px">${ESC_COT.map(c => `<button class="btn ${c === v.cot ? 'btn-grad' : 'btn-ghost'}" style="flex:0 0 auto;padding:8px 10px;min-width:48px" data-c="${c}">${c}</button>`).join('')}</div>
        <label>Photo de la voie</label>
        <div id="ph" style="margin-bottom:8px"></div>
        <label class="btn btn-ghost btn-block" style="display:block;text-align:center;cursor:pointer;margin:0">📷 Prendre / choisir une photo<input id="pf" type="file" accept="image/*" capture="environment" style="display:none"></label>
        <div class="row" style="margin-top:12px"><button class="btn btn-grad" id="vs">💾 ${v.id ? 'Enregistrer' : 'Ajouter la voie'}</button>${v.id ? '<button class="btn btn-ghost" id="vx">Annuler</button>' : ''}</div></div>
      <div class="section-title"><h2>Mes voies (${E.voies.length})</h2></div>
      ${E.voies.length ? E.voies.map((w, i) => { const img = DB[escImgKey(w.id)];
        return `<div class="card" style="margin-top:8px;display:flex;gap:12px;align-items:center">
          ${img ? `<img src="${img}" data-zoom="${w.id}" style="width:64px;height:64px;object-fit:cover;border-radius:10px;cursor:zoom-in">` : '<div style="width:64px;height:64px;border-radius:10px;background:var(--line);display:grid;place-items:center;font-size:1.6rem">🧗</div>'}
          <div style="flex:1;min-width:0"><div>${escBadge(w.cot)} <b>${esc(w.nom)}</b></div><div class="muted" style="font-size:.8rem;margin-top:3px">${E.passages.filter(p => p.voie === w.id).length} passage(s)</div></div>
          <button class="btn btn-ghost" style="padding:6px 10px" data-ed="${i}">✏️</button><button class="btn btn-ghost" style="padding:6px 10px" data-dl="${i}">🗑</button></div>`; }).join('')
        : '<div class="card empty">Aucune voie pour l\'instant : créez votre première voie ci-dessus.</div>'}`;
    const $ = s => box.querySelector(s);
    const showPh = () => { $('#ph').innerHTML = photo ? `<div style="position:relative"><img src="${photo}" style="width:100%;max-height:340px;object-fit:contain;border-radius:12px;background:#000"><button class="btn btn-ghost" id="prm" style="position:absolute;top:6px;right:6px;padding:4px 10px;background:#fff;color:#000">✕</button></div>` : '<div class="muted" style="font-size:.85rem">Aucune photo.</div>';
      const r = $('#prm'); if (r) r.onclick = () => { photo = null; showPh(); }; };
    showPh();
    box.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { v.cot = b.dataset.c; box.querySelectorAll('[data-c]').forEach(x => x.className = 'btn ' + (x.dataset.c === v.cot ? 'btn-grad' : 'btn-ghost')); });
    $('#pf').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { photo = await escReadPhoto(f); showPh(); } catch (er) { toast(er.message); } };
    $('#vs').onclick = () => { const nom = $('#vn').value.trim() || `Voie ${E.voies.length + 1}`;
      if (v.id) { const w = E.voies.find(x => x.id === v.id); w.nom = nom; w.cot = v.cot; }
      else { v.id = Date.now().toString(36); E.voies.push({ id: v.id, nom, cot: v.cot }); }
      DB[escImgKey(v.id)] = photo || null;
      try { save(); } catch (er) {} toast('Voie enregistrée ✔'); voies(box); };
    if ($('#vx')) $('#vx').onclick = () => voies(box);
    box.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => { voies(box, { ...E.voies[+b.dataset.ed] }); el.scrollTop = 0; box.scrollIntoView?.(); });
    box.querySelectorAll('[data-dl]').forEach(b => b.onclick = () => { const w = E.voies[+b.dataset.dl];
      if (!confirm(`Supprimer la voie « ${w.nom} » ?\nLes passages déjà enregistrés sont conservés.`)) return;
      E.voies.splice(+b.dataset.dl, 1); DB[escImgKey(w.id)] = null; save(); voies(box); });
    box.querySelectorAll('[data-zoom]').forEach(i => i.onclick = () => zoom(i.dataset.zoom));
  }
  function zoom(id) {
    const img = DB[escImgKey(id)]; if (!img) return;
    const o = document.createElement('div'); o.style.cssText = 'position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.92);display:grid;place-items:center;padding:12px';
    o.innerHTML = `<img src="${img}" style="max-width:100%;max-height:100%;object-fit:contain">`; o.onclick = () => o.remove(); document.body.appendChild(o);
  }

  /* ---------- Équipes (cordées) ---------- */
  const teamsOf = c => (E.equipes[c] = E.equipes[c] || []);
  // membres actuels de l'équipe (les équipes restent modifiables pendant le défi)
  const membD = (D, k) => (teamsOf(D.classe).find(t => t.name === D.eleves[k]) || {}).members || D.membres[k];
  function equipes(box) {
    if (!DB.classes.length) { box.innerHTML = noClassMsg; return; }
    if (!DB.classes.some(c => c.name === P.cls)) P.cls = DB.classes[0].name;
    const T = teamsOf(P.cls);
    box.innerHTML = `<div class="card"><label style="margin-top:0">Classe</label><select id="ec">${DB.classes.map(c => `<option ${c.name === P.cls ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
      <details class="card" style="margin-top:12px" ${T.length ? '' : 'open'}><summary style="font-weight:800;cursor:pointer">🧩 ${T.length ? 'Refaire les équipes' : 'Former les équipes'}</summary><div id="ecmp" style="margin-top:6px"></div></details>
      <div class="section-title"><h2>Équipes de ${esc(P.cls)} (${T.length})</h2>${T.length ? '<button class="link" id="edel">Supprimer les équipes</button>' : ''}</div>
      ${T.length ? `<div class="teams">${T.map(t => `<div class="card team"><h3><span>${esc(t.name)}</span><span class="muted">${t.members.length}</span></h3><ul>${t.members.map(n => `<li>${esc(n)}</li>`).join('')}</ul></div>`).join('')}</div>
        <button class="btn btn-grad btn-block" style="margin-top:12px" id="eedit">✏️ Modifier les équipes (absent, blessé…)</button>
        <p class="muted" style="font-size:.8rem;margin:8px 2px 0">Les équipes servent dans 📋 Passage (liste des élèves filtrée par équipe) et dans ⚔️ Défis (défi entre équipes).</p>`
        : '<div class="card empty">Aucune équipe pour cette classe.</div>'}`;
    const $ = s => box.querySelector(s);
    $('#ec').onchange = e => { P.cls = e.target.value; DB.lastClass = P.cls; P.eq = ''; save(); equipes(box); };
    mountComposer($('#ecmp'), { id: 'esq', modes: ['random', 'hetero', 'homo'], button: '👥 Former les équipes',
      onTeams: teams => { if (T.length && !confirm('Remplacer les équipes existantes ?')) return;
        E.equipes[P.cls] = teams.map(t => ({ name: t.name, members: t.members.map(m => m.n) })); P.eq = ''; save(); toast('Équipes formées ✔'); equipes(box); } });
    const sel = box.querySelector('#esq-cls'); if (sel) { sel.value = P.cls; sel.dispatchEvent(new Event('change')); }
    const k = box.querySelector('#esq-k'), v = box.querySelector('#esq-v'); if (k && v) { k.value = 's'; v.value = 3; }
    if ($('#eedit')) $('#eedit').onclick = () => editGroupsPanel('Équipes d\'escalade', { cls: P.cls, list: () => teamsOf(P.cls), names: t => t.members,
      take: (t, n) => { t.members.splice(t.members.indexOf(n), 1); }, put: (t, n) => t.members.push(n), make: name => ({ name: name.replace('Groupe', 'Équipe'), members: [] }), onChange: save, onClose: () => equipes(box) });
    if ($('#edel')) $('#edel').onclick = () => { if (!confirm('Supprimer les équipes de la classe ?')) return; E.equipes[P.cls] = []; P.eq = ''; save(); equipes(box); };
  }

  /* ---------- 2/ & 3/ Passage : mode + observables ---------- */
  function passage(box) {
    if (!DB.classes.length) { box.innerHTML = noClassMsg; return; }
    if (!E.voies.length) { box.innerHTML = '<div class="card empty">Créez d\'abord une voie dans l\'onglet <b>🧗 Voies</b>.</div>'; return; }
    if (!E.voies.some(w => w.id === P.voie)) P.voie = E.voies[0].id;
    if (!DB.classes.some(c => c.name === P.cls)) P.cls = DB.classes[0].name;
    const TM = teamsOf(P.cls); if (!TM.some(t => t.name === P.eq)) P.eq = '';
    const st = P.eq ? TM.find(t => t.name === P.eq).members : studentsOf(P.cls); if (P.si >= st.length) P.si = 0;
    const V = E.voies.find(w => w.id === P.voie), img = DB[escImgKey(V.id)];
    const counter = (k, label) => `<label>${label}</label><div class="row" style="align-items:center"><button class="btn btn-ghost" style="flex:0 0 60px;font-size:1.3rem" data-m="${k}">−</button><div style="flex:0 0 70px;text-align:center;font-size:1.8rem;font-weight:900" id="n-${k}">${P[k]}</div><button class="btn btn-grad" style="flex:1;font-size:1.05rem;padding:14px" data-p="${k}">＋1</button></div>`;
    box.innerHTML = `<div class="card">
        <div class="row"><div><label>Classe</label><select id="cl">${DB.classes.map(c => `<option ${c.name === P.cls ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
          ${TM.length ? `<div><label>Équipe</label><select id="eqf"><option value="">Toute la classe</option>${TM.map(t => `<option ${t.name === P.eq ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></div>` : ''}
          <div><label>Élève</label><select id="st">${st.map((n, k) => `<option value="${k}" ${k === P.si ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div></div>
        <label>Voie</label><select id="vo">${E.voies.map(w => `<option value="${w.id}" ${w.id === P.voie ? 'selected' : ''}>${esc(w.cot)} — ${esc(w.nom)}</option>`).join('')}</select>
        ${img ? `<img src="${img}" id="vimg" style="width:100%;max-height:220px;object-fit:contain;border-radius:12px;background:#000;margin-top:8px;cursor:zoom-in">` : ''}
        <label>Mode de grimpe</label><div class="seg" id="md">${Object.entries(ESC_MODES).map(([k, l]) => `<button data-md="${k}" class="${P.mode === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <div class="card" style="margin-top:12px"><h3>Observables</h3>
        <label>Temps de grimpe</label>
        <div class="big clock" id="tm" style="font-size:clamp(2.4rem,12vw,4rem);padding:4px 0">${escTime(sec())}</div>
        <div class="row"><button class="btn btn-grad" id="go">${P.run ? '⏹ Arrivée' : P.acc ? '▶ Reprendre' : '▶ Départ'}</button><button class="btn btn-ghost" id="rz">↺</button></div>
        ${counter('pieds', 'Nombre de poses de pieds')}
        ${counter('pme', 'Nombre de PME')}
        <label>Fluidité des déplacements</label><div class="seg" id="fl">${[1, 2, 3, 4].map(k => `<button data-fl="${k}" class="${P.flu === k ? 'on' : ''}">${k} · ${ESC_FLU[k]}</button>`).join('')}</div>
        <button class="btn btn-grad btn-block" style="margin-top:14px" id="sv">💾 Enregistrer pour ${esc(st[P.si] || '—')}</button></div>
      <div class="section-title"><h2>Derniers passages</h2></div><div class="card sheet-table" id="last"></div>`;
    const $ = s => box.querySelector(s), all = s => box.querySelectorAll(s);
    $('#cl').onchange = e => { P.cls = e.target.value; DB.lastClass = P.cls; P.si = 0; P.eq = ''; save(); passage(box); };
    $('#st').onchange = e => { P.si = +e.target.value; passage(box); };
    if ($('#eqf')) $('#eqf').onchange = e => { P.eq = e.target.value; P.si = 0; passage(box); };
    $('#vo').onchange = e => { P.voie = e.target.value; E.lastVoie = P.voie; save(); passage(box); };
    if ($('#vimg')) $('#vimg').onclick = () => zoom(V.id);
    all('[data-md]').forEach(b => b.onclick = () => { P.mode = b.dataset.md; E.lastMode = P.mode; save(); all('[data-md]').forEach(x => x.classList.toggle('on', x === b)); });
    all('[data-fl]').forEach(b => b.onclick = () => { P.flu = +b.dataset.fl; all('[data-fl]').forEach(x => x.classList.toggle('on', x === b)); });
    all('[data-p]').forEach(b => b.onclick = () => { P[b.dataset.p]++; $('#n-' + b.dataset.p).textContent = P[b.dataset.p]; beep(1100, .03, .15); });
    all('[data-m]').forEach(b => b.onclick = () => { P[b.dataset.m] = Math.max(0, P[b.dataset.m] - 1); $('#n-' + b.dataset.m).textContent = P[b.dataset.m]; });
    $('#go').onclick = () => { if (P.run) { P.acc = sec(); P.run = false; beep(900, .2); } else { P.t0 = performance.now(); P.run = true; beep(1300, .3); }
      $('#go').textContent = P.run ? '⏹ Arrivée' : '▶ Reprendre'; };
    $('#rz').onclick = () => { P.run = false; P.acc = 0; $('#tm').textContent = escTime(0); $('#go').textContent = '▶ Départ'; };
    $('#sv').onclick = () => { const n = st[P.si]; if (!n) return toast('Classe vide');
      const t = Math.round(sec() * 10) / 10;
      const r = { id: Date.now().toString(36), date: Date.now(), classe: P.cls, eleve: n, voie: V.id, voieNom: V.nom, cot: V.cot, mode: P.mode, temps: t || null, pieds: P.pieds, pme: P.pme, flu: P.flu || null };
      E.passages.push(r);
      saveResult({ tool: 'escalade', label: 'Escalade', classe: P.cls, eleve: n, valeur: `${V.cot} ${ESC_MODES[P.mode].toLowerCase()}`, detail: detailOf(r) });
      toast(`${n} : ${V.cot} ✔`);
      Object.assign(P, { pieds: 0, pme: 0, flu: 0, run: false, acc: 0 }); if (P.si < st.length - 1) P.si++;
      passage(box); };
    const last = E.passages.filter(p => p.classe === P.cls).slice(-6).reverse();
    $('#last').innerHTML = last.length ? rowsTable(last, false) : '<div class="empty">Aucun passage pour cette classe.</div>';
  }
  const detailOf = r => [r.temps != null ? 'temps ' + escTime(r.temps) : '', `${r.pieds} poses de pieds`, `${r.pme} PME`, r.flu ? 'fluidité ' + r.flu + '/4' : ''].filter(Boolean).join(' · ');
  const rowsTable = (rows, del) => `<table><tr><th>Élève</th><th>Date</th><th>Voie</th><th>Mode</th><th>Temps</th><th>Pieds</th><th>PME</th><th>Fluidité</th>${del ? '<th></th>' : ''}</tr>
    ${rows.map(r => `<tr><td><b>${esc(r.eleve)}</b></td><td>${new Date(r.date).toLocaleDateString('fr-FR')}</td><td>${escBadge(r.cot)} ${esc(r.voieNom)}</td><td>${ESC_MODES[r.mode]}</td><td>${escTime(r.temps)}</td><td>${r.pieds}</td><td>${r.pme}</td><td>${r.flu ? r.flu + ' · ' + ESC_FLU[r.flu] : '–'}</td>${del ? `<td><button class="btn btn-ghost" style="padding:4px 8px" data-x="${r.id}">✕</button></td>` : ''}</tr>`).join('')}</table>`;

  /* ---------- Défis entre élèves ---------- */
  const CRIT = { pieds: 'Poses de pieds', pme: 'PME', temps: 'Temps' };
  const duelTotals = D => { const t = [0, 1].map(k => ({ pieds: 0, pme: 0, temps: 0, pts: 0 }));
    D.manches.forEach(m => { [0, 1].forEach(k => { t[k].pieds += m.r[k].pieds; t[k].pme += m.r[k].pme; t[k].temps += m.r[k].temps || 0; });
      const w = manchePts(D, m); t[0].pts += w[0]; t[1].pts += w[1]; });
    t.forEach(x => x.temps = Math.round(x.temps * 10) / 10);
    const crit = Object.keys(CRIT).filter(c => D.crit[c]).map(c => ({ c, win: t[0][c] === t[1][c] ? -1 : t[0][c] < t[1][c] ? 0 : 1 }));
    const won = [0, 1].map(k => crit.filter(x => x.win === k).length);
    return { t, crit, won, winner: won[0] === won[1] ? -1 : won[0] > won[1] ? 0 : 1 }; };
  // 1 point par critère gagné sur la voie (le plus petit l'emporte)
  const manchePts = (D, m) => { const p = [0, 0]; Object.keys(CRIT).filter(c => D.crit[c]).forEach(c => { const a = m.r[0][c] || 0, b = m.r[1][c] || 0; if (a < b) p[0]++; else if (b < a) p[1]++; }); return p; };
  const duelTable = D => { const T = duelTotals(D), nm = D.eleves, cr = Object.keys(CRIT).filter(c => D.crit[c]);
    const val = (r, c) => c === 'temps' ? escTime(r.temps) : r[c];
    return `<div class="card sheet-table"><table><tr><th>Voie</th>${cr.map(c => `<th colspan="2">${CRIT[c]}</th>`).join('')}<th colspan="2">Points</th></tr>
      <tr><th></th>${cr.map(() => `<th style="color:#B8912A">${esc(nm[0])}</th><th style="color:#1E5BD8">${esc(nm[1])}</th>`).join('')}<th style="color:#B8912A">${esc(nm[0])}</th><th style="color:#1E5BD8">${esc(nm[1])}</th></tr>
      ${D.manches.map(m => { const p = manchePts(D, m); return `<tr><td>${escBadge(m.cot)} ${esc(m.voieNom)}${D.type === 'eq' ? `<div class="muted" style="font-size:.72rem">${esc(m.r[0].who || '?')} / ${esc(m.r[1].who || '?')}</div>` : ''}</td>${cr.map(c => { const a = m.r[0][c] || 0, b = m.r[1][c] || 0; return `<td style="${a < b ? 'font-weight:900' : ''}">${val(m.r[0], c)}</td><td style="${b < a ? 'font-weight:900' : ''}">${val(m.r[1], c)}</td>`; }).join('')}<td><b>${p[0]}</b></td><td><b>${p[1]}</b></td></tr>`; }).join('')}
      <tr style="border-top:2px solid var(--text)"><td><b>Cumul (${D.manches.length} voie${D.manches.length > 1 ? 's' : ''})</b></td>${cr.map(c => `<td><b>${val(T.t[0], c)}</b></td><td><b>${val(T.t[1], c)}</b></td>`).join('')}<td><b>${T.t[0].pts}</b></td><td><b>${T.t[1].pts}</b></td></tr></table>
      <p class="muted" style="font-size:.78rem;margin:6px 0 0">Sur chaque critère, le plus petit total l'emporte. Vainqueur du défi : le plus de critères gagnés sur le cumul.</p></div>`; };
  const duelWinner = D => { const T = duelTotals(D); if (!D.manches.length) return ''; return `<div class="win" style="margin-top:12px">${T.winner < 0 ? 'Égalité' : '🏆 ' + esc(D.eleves[T.winner])} · critères gagnés ${T.won[0]} – ${T.won[1]}</div>`; };
  function defis(box) {
    if (!DB.classes.length) { box.innerHTML = noClassMsg; return; }
    if (!E.voies.length) { box.innerHTML = '<div class="card empty">Créez d\'abord une voie dans l\'onglet <b>🧗 Voies</b>.</div>'; return; }
    const D = E.defi;
    if (!D) {
      const cls = DB.classes.some(c => c.name === P.cls) ? P.cls : DB.classes[0].name, TM = teamsOf(cls), eqm = P.dmode === 'eq' && TM.length > 1, st = eqm ? TM.map(t => t.name) : studentsOf(cls), c = E.lastCrit || { pieds: true, pme: true, temps: true };
      box.innerHTML = `<div class="card"><h3>Nouveau défi</h3>
          <label>Classe</label><select id="dc">${DB.classes.map(x => `<option ${x.name === cls ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
          <label>Défi entre</label><div class="seg"><button data-dm2="el" class="${eqm ? '' : 'on'}">Élèves</button><button data-dm2="eq" class="${eqm ? 'on' : ''}">Équipes</button></div>
          ${P.dmode === 'eq' && TM.length < 2 ? '<p class="muted" style="margin:6px 0 0;font-size:.82rem">Formez au moins 2 équipes dans l\'onglet 👥 Équipes.</p>' : ''}
          <div class="row"><div><label>${eqm ? 'Équipe' : 'Élève'} 1</label><select id="d0">${st.map((n, k) => `<option value="${k}">${esc(n)}</option>`).join('')}</select></div>
            <div><label>${eqm ? 'Équipe' : 'Élève'} 2</label><select id="d1">${st.map((n, k) => `<option value="${k}" ${k === 1 ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div></div>
          ${eqm ? '<p class="muted" style="margin:6px 0 0;font-size:.8rem">À chaque voie, choisissez le grimpeur de chaque équipe ; les résultats se cumulent par équipe.</p>' : ''}
          <label>Critères du défi (le plus petit l'emporte)</label>
          ${Object.entries(CRIT).map(([k, l]) => `<label style="display:flex;gap:8px;align-items:center;margin:6px 0;color:var(--text);font-weight:600"><input type="checkbox" data-cr="${k}" ${c[k] ? 'checked' : ''} style="width:auto"> ${l}${k === 'temps' ? ' mis pour la voie' : ''}</label>`).join('')}
          <button class="btn btn-grad btn-block" style="margin-top:12px" id="dgo">⚔️ Lancer le défi</button></div>
        <div class="section-title"><h2>Défis enregistrés (${E.defis.length})</h2>${E.defis.length ? '<button class="link" id="dexp">Exporter CSV</button>' : ''}</div>
        ${E.defis.slice().reverse().map(x => { const T = duelTotals(x); return `<details class="card" style="margin-top:8px"><summary style="cursor:pointer"><b>${esc(x.eleves[0])} vs ${esc(x.eleves[1])}</b> <span class="muted">· ${new Date(x.date).toLocaleDateString('fr-FR')} · ${x.manches.length} voie(s) · ${T.winner < 0 ? 'égalité' : '🏆 ' + esc(x.eleves[T.winner])}</span></summary>${duelTable(x)}<button class="btn btn-ghost" style="margin-top:8px" data-dx="${x.id}">🗑 Supprimer</button></details>`; }).join('') || '<div class="card empty">Aucun défi enregistré.</div>'}`;
      const $ = s => box.querySelector(s);
      $('#dc').onchange = e => { P.cls = e.target.value; defis(box); };
      box.querySelectorAll('[data-dm2]').forEach(b => b.onclick = () => { P.dmode = b.dataset.dm2; defis(box); });
      $('#dgo').onclick = () => { const a = +$('#d0').value, b = +$('#d1').value; if (a === b) return toast(eqm ? 'Choisissez deux équipes différentes' : 'Choisissez deux élèves différents');
        const crit = {}; box.querySelectorAll('[data-cr]').forEach(x => crit[x.dataset.cr] = x.checked); if (!Object.values(crit).some(Boolean)) return toast('Choisissez au moins un critère');
        E.lastCrit = crit; E.defi = { id: Date.now().toString(36), date: Date.now(), classe: cls, eleves: [st[a], st[b]], crit, manches: [], cur: { voie: E.lastVoie || E.voies[0].id, r: [{ pieds: 0, pme: 0 }, { pieds: 0, pme: 0 }], who: ['', ''] } };
        if (eqm) { E.defi.type = 'eq'; E.defi.membres = [[...TM[a].members], [...TM[b].members]]; E.defi.cur.who = [TM[a].members[0] || '', TM[b].members[0] || '']; }
        DC.forEach(x => Object.assign(x, { t0: 0, acc: 0, run: false })); save(); defis(box); };
      box.querySelectorAll('[data-dx]').forEach(b => b.onclick = () => { if (!confirm('Supprimer ce défi ?')) return; const i = E.defis.findIndex(x => x.id === b.dataset.dx); E.defis.splice(i, 1); save(); defis(box); });
      if ($('#dexp')) $('#dexp').onclick = () => download(`defis-escalade-${new Date().toISOString().slice(0, 10)}.csv`, csv([['Date', 'Classe', 'Élève', 'Adversaire', 'Voie', 'Cotation', 'Poses de pieds', 'PME', 'Temps (s)', 'Points voie'],
        ...E.defis.flatMap(x => x.manches.flatMap(m => { const p = manchePts(x, m); return [0, 1].map(k => [new Date(x.date).toLocaleDateString('fr-FR'), x.classe, x.eleves[k], x.eleves[1 - k], m.voieNom, m.cot, m.r[k].pieds, m.r[k].pme, m.r[k].temps != null ? String(m.r[k].temps).replace('.', ',') : '', p[k]]); })),
        ...E.defis.flatMap(x => { const T = duelTotals(x); return [0, 1].map(k => [new Date(x.date).toLocaleDateString('fr-FR'), x.classe, x.eleves[k], x.eleves[1 - k], 'CUMUL', '', T.t[k].pieds, T.t[k].pme, String(T.t[k].temps).replace('.', ','), T.t[k].pts]); })]));
      return;
    }
    if (!E.voies.some(w => w.id === D.cur.voie)) D.cur.voie = E.voies[0].id;
    const V = E.voies.find(w => w.id === D.cur.voie), img = DB[escImgKey(V.id)], cr = D.crit;
    const col = k => `<div class="card" style="border-top:5px solid ${k ? '#1E5BD8' : '#B8912A'};padding:12px">
        <h3 style="margin:0 0 6px;color:${k ? '#1E5BD8' : '#B8912A'}">${esc(D.eleves[k])}</h3>
        ${D.type === 'eq' ? `<label style="margin-top:0">Grimpeur</label><select data-who="${k}" style="padding:7px">${membD(D, k).map(n => `<option ${n === (D.cur.who || [])[k] ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>` : ''}
        ${cr.temps ? `<div class="big" id="dt${k}" style="font-size:clamp(1.8rem,8vw,2.8rem)">${escTime(dsec(k))}</div>
          <div class="row" style="gap:6px"><button class="btn btn-grad" style="padding:10px 6px" data-dg="${k}">${DC[k].run ? '⏹ Arrivée' : DC[k].acc ? '▶ Reprendre' : '▶ Départ'}</button><button class="btn btn-ghost" style="flex:0 0 44px;padding:10px 0" data-dr="${k}">↺</button></div>` : ''}
        ${['pieds', 'pme'].filter(c => cr[c]).map(c => `<label>${CRIT[c]}</label><div class="row" style="align-items:center;gap:6px"><button class="btn btn-ghost" style="flex:0 0 44px;padding:12px 0" data-dm="${k}|${c}">−</button><b style="flex:0 0 40px;text-align:center;font-size:1.5rem" id="dn${k}${c}">${D.cur.r[k][c]}</b><button class="btn btn-grad" style="padding:12px 4px" data-dp="${k}|${c}">＋1</button></div>`).join('')}</div>`;
    box.innerHTML = `<div class="card"><b>${esc(D.eleves[0])} ⚔️ ${esc(D.eleves[1])}</b><div class="muted">${esc(D.classe)} · ${Object.keys(CRIT).filter(c => cr[c]).map(c => CRIT[c]).join(', ')} · voie n° ${D.manches.length + 1}</div>
        <label>Voie</label><select id="dv">${E.voies.map(w => `<option value="${w.id}" ${w.id === V.id ? 'selected' : ''}>${esc(w.cot)} — ${esc(w.nom)}</option>`).join('')}</select>
        ${img ? `<img src="${img}" id="dimg" style="width:100%;max-height:160px;object-fit:contain;border-radius:12px;background:#000;margin-top:8px;cursor:zoom-in">` : ''}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">${col(0)}${col(1)}</div>
      <button class="btn btn-grad btn-block" style="margin-top:12px" id="dval">✔ Valider cette voie</button>
      ${D.manches.length ? `<div class="section-title"><h2>Cumul de la séance</h2></div>${duelTable(D)}${duelWinner(D)}` : ''}
      <div class="row" style="margin-top:12px"><button class="btn btn-grad" id="dend">💾 Terminer et enregistrer le défi</button><button class="btn btn-ghost" id="dab">Abandonner</button></div>`;
    const $ = s => box.querySelector(s), all = s => box.querySelectorAll(s);
    all('[data-who]').forEach(s2 => s2.onchange = () => { D.cur.who = D.cur.who || ['', '']; D.cur.who[+s2.dataset.who] = s2.value; save(); });
    $('#dv').onchange = e => { D.cur.voie = e.target.value; E.lastVoie = D.cur.voie; save(); defis(box); };
    if ($('#dimg')) $('#dimg').onclick = () => zoom(V.id);
    all('[data-dg]').forEach(b => b.onclick = () => { const k = +b.dataset.dg, c = DC[k]; if (c.run) { c.acc = dsec(k); c.run = false; beep(900, .2); } else { c.t0 = performance.now(); c.run = true; beep(1300, .3); } b.textContent = c.run ? '⏹ Arrivée' : '▶ Reprendre'; });
    all('[data-dr]').forEach(b => b.onclick = () => { const k = +b.dataset.dr; Object.assign(DC[k], { acc: 0, run: false }); defis(box); });
    all('[data-dp]').forEach(b => b.onclick = () => { const [k, c] = b.dataset.dp.split('|'); D.cur.r[k][c]++; $('#dn' + k + c).textContent = D.cur.r[k][c]; beep(1100, .03, .15); save(); });
    all('[data-dm]').forEach(b => b.onclick = () => { const [k, c] = b.dataset.dm.split('|'); D.cur.r[k][c] = Math.max(0, D.cur.r[k][c] - 1); $('#dn' + k + c).textContent = D.cur.r[k][c]; save(); });
    $('#dval').onclick = () => { if (cr.temps && DC.some(c => c.run)) return toast('Arrêtez d\'abord les chronos');
      D.manches.push({ voie: V.id, voieNom: V.nom, cot: V.cot, r: [0, 1].map(k => ({ pieds: cr.pieds ? D.cur.r[k].pieds : 0, pme: cr.pme ? D.cur.r[k].pme : 0, temps: cr.temps ? Math.round(dsec(k) * 10) / 10 : 0, who: D.type === 'eq' ? (D.cur.who || [])[k] || '' : undefined })) });
      D.cur.r = [{ pieds: 0, pme: 0 }, { pieds: 0, pme: 0 }];
      if (D.type === 'eq') D.cur.who = [0, 1].map(k => { const m = membD(D, k), i = m.indexOf(D.cur.who[k]); return m[(i + 1) % m.length] || ''; }); DC.forEach(x => Object.assign(x, { t0: 0, acc: 0, run: false })); save(); toast('Voie validée ✔'); defis(box); };
    $('#dend').onclick = () => { if (!D.manches.length) return toast('Validez au moins une voie'); delete D.cur; E.defis.push(D); E.defi = null;
      const T = duelTotals(D); [0, 1].forEach(k => (D.type === 'eq' ? [...new Set([...membD(D, k), ...D.manches.map(m => m.r[k].who).filter(Boolean)])] : [D.eleves[k]]).forEach(who => saveResult({ tool: 'escalade', label: D.type === 'eq' ? 'Défi escalade (équipe ' + D.eleves[k] + ')' : 'Défi escalade', classe: D.classe, eleve: who, valeur: `${T.winner < 0 ? 'égalité' : T.winner === k ? 'victoire' : 'défaite'} vs ${D.eleves[1 - k]}`,
        detail: `${D.manches.length} voie(s) · ${D.crit.pieds ? T.t[k].pieds + ' poses de pieds · ' : ''}${D.crit.pme ? T.t[k].pme + ' PME · ' : ''}${D.crit.temps ? 'temps ' + escTime(T.t[k].temps) : ''}`.replace(/ · $/, '') })));
      save(); toast('Défi enregistré ✔'); defis(box); };
    $('#dab').onclick = () => { if (confirm('Abandonner ce défi ?')) { E.defi = null; save(); defis(box); } };
  }

  /* ---------- 4/ Vidéo différée intégrée ---------- */
  function video(box) { sub = TOOL_IMPL.video(box) || null; }

  /* ---------- Résultats ---------- */
  function resultats(box) {
    const f = E.filt || (E.filt = { cls: '', el: '', voie: '' });
    const pool = E.passages.filter(p => !f.cls || p.classe === f.cls), names = [...new Set(pool.map(p => p.eleve))].sort();
    const rows = pool.filter(p => (!f.el || p.eleve === f.el) && (!f.voie || p.voie === f.voie)).reverse();
    box.innerHTML = `<div class="card"><div class="row">
        <div><label>Classe</label><select id="fc"><option value="">Toutes</option>${[...new Set(E.passages.map(p => p.classe))].map(c => `<option ${c === f.cls ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
        <div><label>Élève</label><select id="fe"><option value="">Tous</option>${names.map(n => `<option ${n === f.el ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div></div>
        <label>Voie</label><select id="fv"><option value="">Toutes</option>${E.voies.map(w => `<option value="${w.id}" ${w.id === f.voie ? 'selected' : ''}>${esc(w.cot)} — ${esc(w.nom)}</option>`).join('')}</select></div>
      <div class="section-title"><h2>Passages (${rows.length})</h2><button class="link" id="exp">Exporter CSV</button></div>
      <div class="card sheet-table">${rows.length ? rowsTable(rows, true) : '<div class="empty">Aucun passage enregistré.</div>'}</div>`;
    const $ = s => box.querySelector(s);
    $('#fc').onchange = e => { f.cls = e.target.value; f.el = ''; resultats(box); };
    $('#fe').onchange = e => { f.el = e.target.value; resultats(box); };
    $('#fv').onchange = e => { f.voie = e.target.value; resultats(box); };
    box.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { if (!confirm('Supprimer ce passage ?')) return; const i = E.passages.findIndex(p => p.id === b.dataset.x); if (i >= 0) E.passages.splice(i, 1); save(); resultats(box); });
    $('#exp').onclick = () => { if (!rows.length) return toast('Rien à exporter');
      download(`escalade-${new Date().toISOString().slice(0, 10)}.csv`, csv([['Élève', 'Classe', 'Date', 'Voie', 'Cotation', 'Mode', 'Temps de grimpe (s)', 'Poses de pieds', 'PME', 'Fluidité (1-4)'],
        ...rows.map(r => [r.eleve, r.classe, new Date(r.date).toLocaleDateString('fr-FR'), r.voieNom, r.cot, ESC_MODES[r.mode], r.temps != null ? String(r.temps).replace('.', ',') : '', r.pieds, r.pme, r.flu || ''])])); };
  }

  frame();
  iv = setInterval(() => { const t = el.querySelector('#tm'); if (t && P.run && tab === 'passage') t.textContent = escTime(sec());
    if (tab === 'defis') [0, 1].forEach(k => { const e = el.querySelector('#dt' + k); if (e && DC[k].run) e.textContent = escTime(dsec(k)); }); }, 100);
  return () => { clearInterval(iv); if (sub) { try { sub(); } catch (e) {} } };
};

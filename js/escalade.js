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
  const E = DB.escalade;
  let tab = E.voies.length ? 'passage' : 'voies', sub = null;
  // état de la saisie en cours
  const P = { cls: DB.lastClass || (DB.classes[0] || {}).name || '', si: 0, voie: E.lastVoie || '', mode: E.lastMode || 'moul', pieds: 0, pme: 0, flu: 0, t0: null, acc: 0, run: false };
  const sec = () => P.acc + (P.run ? (performance.now() - P.t0) / 1000 : 0);
  let iv = null;

  function frame() {
    if (sub) { try { sub(); } catch (e) {} sub = null; }
    el.innerHTML = `<div class="co-tabs">${[['voies', '🧗 Voies'], ['passage', '📋 Passage'], ['video', '🎥 Vidéo'], ['resultats', '📊 Résultats']].map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div><div id="e-body"></div>`;
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; frame(); });
    const box = el.querySelector('#e-body');
    ({ voies, passage, video, resultats })[tab](box);
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

  /* ---------- 2/ & 3/ Passage : mode + observables ---------- */
  function passage(box) {
    if (!DB.classes.length) { box.innerHTML = noClassMsg; return; }
    if (!E.voies.length) { box.innerHTML = '<div class="card empty">Créez d\'abord une voie dans l\'onglet <b>🧗 Voies</b>.</div>'; return; }
    if (!E.voies.some(w => w.id === P.voie)) P.voie = E.voies[0].id;
    if (!DB.classes.some(c => c.name === P.cls)) P.cls = DB.classes[0].name;
    const st = studentsOf(P.cls); if (P.si >= st.length) P.si = 0;
    const V = E.voies.find(w => w.id === P.voie), img = DB[escImgKey(V.id)];
    const counter = (k, label) => `<label>${label}</label><div class="row" style="align-items:center"><button class="btn btn-ghost" style="flex:0 0 60px;font-size:1.3rem" data-m="${k}">−</button><div style="flex:0 0 70px;text-align:center;font-size:1.8rem;font-weight:900" id="n-${k}">${P[k]}</div><button class="btn btn-grad" style="flex:1;font-size:1.05rem;padding:14px" data-p="${k}">＋1</button></div>`;
    box.innerHTML = `<div class="card">
        <div class="row"><div><label>Classe</label><select id="cl">${DB.classes.map(c => `<option ${c.name === P.cls ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
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
    $('#cl').onchange = e => { P.cls = e.target.value; DB.lastClass = P.cls; P.si = 0; save(); passage(box); };
    $('#st').onchange = e => { P.si = +e.target.value; passage(box); };
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
  iv = setInterval(() => { const t = el.querySelector('#tm'); if (t && P.run && tab === 'passage') t.textContent = escTime(sec()); }, 100);
  return () => { clearInterval(iv); if (sub) { try { sub(); } catch (e) {} } };
};

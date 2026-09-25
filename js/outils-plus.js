/* =========================================================
   MES OUTILS EPS — outils complémentaires (v0.2)
   Chargé après le script principal : complète TOOL_IMPL.
   ========================================================= */

/* ---------- Données supplémentaires ---------- */
DB.dispenses = DB.dispenses || [];
DB.oublis    = DB.oublis    || {};
DB.journal   = DB.journal   || [];
DB.grilles   = DB.grilles   || [];
DB.suivi     = DB.suivi     || {};
DB.debrief   = DB.debrief   || [];

/* ---------- Styles propres à ces outils ---------- */
document.head.insertAdjacentHTML('beforeend', `<style>
.screen .body.flush{padding:0;max-width:none;display:flex;flex-direction:column}
.chronos-bar{display:flex;gap:8px;align-items:center;padding:8px 10px;background:var(--card);border-bottom:1px solid var(--line);flex-wrap:wrap}
.chronos-bar select{flex:1;min-width:140px;padding:8px}
.chronos-bar .btn{padding:9px 12px;font-size:.85rem}
.chronos-frame{flex:1;border:0;width:100%;background:#0E1B2E}
.cam-wrap{position:relative;background:#000;border-radius:16px;overflow:hidden;aspect-ratio:16/9;display:grid;place-items:center}
.cam-wrap canvas{width:100%;height:100%;object-fit:contain;display:block}
.cam-overlay{position:absolute;left:10px;top:10px;background:rgba(0,0,0,.6);color:#fff;padding:6px 10px;border-radius:10px;font-weight:800;font-variant-numeric:tabular-nums}
.cam-msg{position:absolute;inset:0;display:grid;place-items:center;color:#fff;text-align:center;padding:20px;font-weight:700}
input[type=range]{padding:0;border:none;background:none;accent-color:var(--blue)}
.bracket{display:flex;gap:18px;overflow-x:auto;padding:6px 2px 14px}
.round{min-width:170px;display:flex;flex-direction:column;justify-content:space-around;gap:12px}
.round h4{margin:0 0 4px;font-size:.75rem;text-transform:uppercase;letter-spacing:1px;color:var(--muted);text-align:center}
.match{background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden;box-shadow:var(--shadow)}
.match button{display:block;width:100%;text-align:left;padding:9px 10px;font-weight:700;font-size:.88rem;border-bottom:1px solid var(--line)}
.match button:last-child{border-bottom:none}
.match button.win{background:var(--grad);color:#fff}
.match button.lose{opacity:.45;text-decoration:line-through}
.match button:disabled{color:var(--muted);font-weight:500;font-style:italic}
.champion{text-align:center;font-size:1.4rem;font-weight:900;padding:16px;border-radius:16px;background:var(--grad);color:#fff;margin-top:8px}
.pyr{display:flex;flex-direction:column;align-items:center;gap:8px;margin:14px 0}
.pyr-row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.pyr-cell{min-width:92px;padding:9px 10px;border-radius:12px;background:var(--card);border:1.5px solid var(--line);text-align:center;font-weight:700;font-size:.85rem;box-shadow:var(--shadow)}
.pyr-cell small{display:block;color:var(--muted);font-size:.7rem}
.pyr-row:first-child .pyr-cell{background:var(--grad);color:#fff;border-color:transparent}
.pyr-row:first-child .pyr-cell small{color:#fff}
.relay-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;margin-top:12px}
.relay{padding:12px;border-radius:16px;background:var(--card);border:2px solid var(--line);text-align:center}
.relay.done{border-color:var(--gold);background:var(--grad-soft)}
.relay .t{font-size:1.8rem;font-weight:900;font-variant-numeric:tabular-nums}
.relay .legs{font-size:.78rem;color:var(--muted);min-height:1.2em}
.relay .rk{font-size:1.1rem;font-weight:900;color:var(--gold)}
.lvl{display:flex;gap:6px;margin-top:6px}
.lvl button{flex:1;padding:9px 4px;border-radius:10px;border:1.5px solid var(--line);font-size:.75rem;font-weight:800;background:var(--card)}
.lvl button.on{background:var(--grad);color:#fff;border-color:transparent}
.crit{padding:10px 0;border-bottom:1px solid var(--line)}
.crit:last-child{border-bottom:none}
.pill{display:inline-block;padding:3px 9px;border-radius:99px;font-size:.72rem;font-weight:800;background:var(--grad-soft);border:1px solid var(--line)}
.pill.warn{background:rgba(214,69,69,.12);color:var(--danger);border-color:rgba(214,69,69,.3)}
.pill.ok{background:rgba(27,158,90,.12);color:var(--ok);border-color:rgba(27,158,90,.3)}
.count{min-width:38px;height:38px;border-radius:12px;display:grid;place-items:center;font-weight:900;background:var(--grad-soft);border:1px solid var(--line)}
.count.hot{background:var(--grad);color:#fff;border:none}
.sheet-table{overflow:auto;margin-top:10px}
.sheet-table table{min-width:100%}
.sheet-table td input{padding:6px;min-width:64px;text-align:center}
.sheet-table th:first-child,.sheet-table td:first-child{position:sticky;left:0;background:var(--card);z-index:1}
.question{font-size:clamp(1.4rem,6vw,2.3rem);font-weight:900;text-align:center;padding:26px 12px;min-height:150px;display:grid;place-items:center;line-height:1.25}
</style>`);

/* ---------- Petits utilitaires ---------- */
const today = () => new Date().toISOString().slice(0, 10);
const frDate = d => d ? new Date(d + 'T12:00').toLocaleDateString('fr-FR') : '';
function download(name, text, type = 'text/csv;charset=utf-8') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([type.startsWith('text/csv') ? '﻿' + text : text], { type }));
  a.download = name; a.click();
}
const csv = rows => rows.map(r => r.map(v => { v = String(v ?? ''); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(';')).join('\n');
function classNameSelect(id, withAll) {
  return `<select id="${id}">${withAll ? '<option value="">Toutes les classes</option>' : ''}${DB.classes.map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('')}</select>`;
}
const studentsOf = name => (DB.classes.find(c => c.name === name) || { students: [] }).students;
const noClassMsg = '<div class="card empty">Créez d\'abord une classe dans l\'outil <b>🗂 Mes classes</b>.<br><br><button class="btn btn-grad" onclick="closeTool();openTool(\'classes\')">Ouvrir Mes classes</button></div>';

/* Caméra : flux + capture JPEG en mémoire tournante */
async function startCamera(video, facing) {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Caméra non disponible sur ce navigateur (HTTPS requis).');
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
  video.srcObject = stream; video.muted = true; video.playsInline = true; await video.play();
  return stream;
}
const stopStream = s => s && s.getTracks().forEach(t => t.stop());

/* =========================================================
   NOUVEAUX OUTILS
   ========================================================= */
Object.assign(TOOL_IMPL, {

/* ---------- Chronos EPS (12 élèves) — web app de Stéphane ---------- */
chronos12(el) {
  el.classList.add('flush');
  el.innerHTML = `<div class="chronos-bar">
      ${DB.classes.length ? `<select id="cc"><option value="">Charger les prénoms d'une classe…</option>${DB.classes.map((c, i) => `<option value="${i}">${esc(c.name)}</option>`).join('')}</select>` : '<span class="muted" style="flex:1">Astuce : créez une classe pour charger les prénoms.</span>'}
      <button class="btn btn-ghost" id="full">⛶ Plein écran</button>
    </div>
    <iframe class="chronos-frame" id="fr" src="outils/chronos-eps.html" title="Chronos EPS"></iframe>`;
  const fr = el.querySelector('#fr');
  const sel = el.querySelector('#cc');
  if (sel) sel.onchange = () => {
    if (sel.value === '') return;
    const st = DB.classes[sel.value].students;
    let S; try { S = JSON.parse(localStorage.getItem('chronos-eps-v1')); } catch (e) {}
    if (!Array.isArray(S) || S.length !== 13)
      S = Array.from({ length: 13 }, (_, i) => ({ id: i, name: '', running: false, startedAt: 0, accumulated: 0, laps: [], pauses: 0, pauseStartedAt: null, pauseTotal: 0 }));
    for (let i = 1; i <= 12; i++) S[i].name = st[i - 1] ? st[i - 1].slice(0, 20) : '';
    try { localStorage.setItem('chronos-eps-v1', JSON.stringify(S)); } catch (e) {}
    fr.contentWindow.location.reload();
    toast(`${Math.min(12, st.length)} prénoms chargés ✔`);
    sel.value = '';
  };
  el.querySelector('#full').onclick = () => { location.href = 'outils/chronos-eps.html'; };
  return () => el.classList.remove('flush');
},

/* ---------- Vidéo différée ---------- */
video(el) {
  let stream = null, facing = 'environment', frames = [], capIv = null, raf = null, frozen = false, shown = null;
  el.innerHTML = `<div class="cam-wrap"><canvas id="cv" width="640" height="360"></canvas><div class="cam-overlay" id="ov">—</div><div class="cam-msg" id="msg">Touchez « Activer la caméra »</div></div>
    <div class="card" style="margin-top:12px">
      <label>Délai de différé : <b id="dl">8 s</b></label><input type="range" id="d" min="2" max="30" value="8">
      <div class="row" style="margin-top:12px"><button class="btn btn-grad" id="on">📷 Activer la caméra</button><button class="btn btn-ghost" id="sw">🔄 Avant / arrière</button><button class="btn btn-ghost" id="fz">⏸ Figer</button></div>
      <p class="muted" style="margin:10px 0 0">Posez la tablette face à l'atelier : l'élève fait son passage puis vient se voir quelques secondes plus tard, sans toucher l'écran.</p></div>
    <video id="vd" playsinline muted style="display:none"></video>`;
  const $ = s => el.querySelector(s), cv = $('#cv'), ctx = cv.getContext('2d'), vd = $('#vd');
  const off = document.createElement('canvas'), octx = off.getContext('2d');
  const delay = () => +$('#d').value * 1000;
  $('#d').oninput = () => $('#dl').textContent = $('#d').value + ' s';
  const capture = () => {
    if (!vd.videoWidth || frozen) return;
    const w = 640, h = Math.round(w * vd.videoHeight / vd.videoWidth);
    if (off.width !== w || off.height !== h) { off.width = w; off.height = h; cv.width = w; cv.height = h; }
    octx.drawImage(vd, 0, 0, w, h);
    const t = performance.now();
    off.toBlob(b => { if (b) frames.push({ t, b }); }, 'image/jpeg', 0.6);
    const limit = t - delay() - 1500;
    while (frames.length && frames[0].t < limit) frames.shift();
  };
  const render = async () => {
    raf = requestAnimationFrame(render);
    if (frozen || !stream) return;
    const target = performance.now() - delay();
    let f = null; for (let i = frames.length - 1; i >= 0; i--) if (frames[i].t <= target) { f = frames[i]; break; }
    if (!f) { const wait = frames.length ? Math.ceil((frames[0].t - target) / 1000) : Math.ceil(delay() / 1000); $('#ov').textContent = `Différé dans ${wait} s…`; return; }
    if (f === shown) return; shown = f;
    try { const bmp = await createImageBitmap(f.b); ctx.drawImage(bmp, 0, 0, cv.width, cv.height); bmp.close?.(); } catch (e) {}
    $('#ov').textContent = `● Différé ${$('#d').value} s`;
  };
  const start = async () => {
    stopStream(stream); frames = []; shown = null;
    try { stream = await startCamera(vd, facing); $('#msg').style.display = 'none'; }
    catch (e) { $('#msg').textContent = 'Impossible d\'accéder à la caméra : ' + e.message; return; }
    clearInterval(capIv); capIv = setInterval(capture, 1000 / 15);
  };
  $('#on').onclick = start;
  $('#sw').onclick = () => { facing = facing === 'environment' ? 'user' : 'environment'; if (stream) start(); };
  $('#fz').onclick = () => { frozen = !frozen; $('#fz').textContent = frozen ? '▶ Reprendre' : '⏸ Figer'; if (!frozen) frames = []; };
  render();
  return () => { clearInterval(capIv); cancelAnimationFrame(raf); stopStream(stream); frames = []; };
},

/* ---------- Photo-finish ---------- */
photo(el) {
  let stream = null, facing = 'environment', frames = [], capIv = null, t0 = null, mode = 'live', idx = 0, raf = null, marks = [];
  el.innerHTML = `<div class="cam-wrap"><canvas id="cv" width="640" height="360"></canvas><div class="cam-overlay" id="ov">—</div><div class="cam-msg" id="msg">Placez la tablette dans l'axe de la ligne d'arrivée puis activez la caméra</div></div>
    <div class="card" style="margin-top:12px" id="live">
      <div class="row"><button class="btn btn-grad" id="on">📷 Caméra</button><button class="btn btn-ghost" id="sw">🔄</button></div>
      <div class="row" style="margin-top:10px"><button class="btn btn-grad" id="go">🔫 Départ course</button><button class="btn btn-danger" id="fz">🏁 Figer l'arrivée</button></div>
      <p class="muted" style="margin:10px 0 0">La caméra garde en mémoire les 15 dernières secondes. Touchez « Figer » juste après la dernière arrivée, puis rembobinez image par image.</p></div>
    <div class="card" style="margin-top:12px;display:none" id="rev">
      <input type="range" id="sl" min="0" max="0" value="0">
      <div class="row" style="margin-top:10px"><button class="btn btn-ghost" id="p10">⏪</button><button class="btn btn-ghost" id="p1">◀ 1 img</button><button class="btn btn-ghost" id="n1">1 img ▶</button><button class="btn btn-ghost" id="n10">⏩</button></div>
      <div class="row" style="margin-top:10px"><input id="lb" placeholder="Nom / dossard"><button class="btn btn-grad" id="mk">📌 Marquer ce temps</button></div>
      <button class="btn btn-ghost btn-block" style="margin-top:10px" id="back">↺ Revenir au direct</button>
    </div>
    <div class="section-title"><h2>Arrivées</h2><button class="link" id="exp">Exporter</button></div>
    <div class="card" style="padding:0" id="ml"><div class="empty">Aucune arrivée marquée.</div></div>
    <video id="vd" playsinline muted style="display:none"></video>`;
  const $ = s => el.querySelector(s), cv = $('#cv'), ctx = cv.getContext('2d'), vd = $('#vd');
  const off = document.createElement('canvas'), octx = off.getContext('2d');
  const rel = t => t0 ? fmt(t - t0) : 'chrono non lancé';
  const capture = () => {
    if (!vd.videoWidth || mode !== 'live') return;
    const w = 640, h = Math.round(w * vd.videoHeight / vd.videoWidth);
    if (off.width !== w || off.height !== h) { off.width = w; off.height = h; cv.width = w; cv.height = h; }
    octx.drawImage(vd, 0, 0, w, h);
    const t = performance.now();
    off.toBlob(b => { if (b && mode === 'live') frames.push({ t, b }); }, 'image/jpeg', 0.7);
    while (frames.length && frames[0].t < t - 15000) frames.shift();
  };
  const live = () => {
    raf = requestAnimationFrame(live);
    if (mode !== 'live' || !vd.videoWidth) return;
    ctx.drawImage(vd, 0, 0, cv.width, cv.height);
    $('#ov').textContent = t0 ? '⏱ ' + fmt(performance.now() - t0) : '● Direct';
  };
  const show = async i => {
    idx = Math.max(0, Math.min(frames.length - 1, i)); $('#sl').value = idx;
    const f = frames[idx]; if (!f) return;
    try { const bmp = await createImageBitmap(f.b); ctx.drawImage(bmp, 0, 0, cv.width, cv.height); bmp.close?.(); } catch (e) {}
    $('#ov').textContent = '⏱ ' + rel(f.t) + `  ·  img ${idx + 1}/${frames.length}`;
  };
  const drawMarks = () => {
    $('#ml').innerHTML = marks.length ? marks.map((m, i) => `<div class="list-item"><b>${i + 1}.</b><span style="flex:1">${esc(m.label)}</span><b>${m.time}</b><button class="btn btn-ghost" data-x="${i}">✕</button></div>`).join('') : '<div class="empty">Aucune arrivée marquée.</div>';
    $('#ml').querySelectorAll('[data-x]').forEach(b => b.onclick = () => { marks.splice(b.dataset.x, 1); drawMarks(); });
  };
  const start = async () => {
    stopStream(stream);
    try { stream = await startCamera(vd, facing); $('#msg').style.display = 'none'; }
    catch (e) { $('#msg').textContent = 'Impossible d\'accéder à la caméra : ' + e.message; return; }
    clearInterval(capIv); capIv = setInterval(capture, 1000 / 30);
  };
  $('#on').onclick = start;
  $('#sw').onclick = () => { facing = facing === 'environment' ? 'user' : 'environment'; if (stream) start(); };
  $('#go').onclick = () => { t0 = performance.now(); beep(1500, .3); toast('Chrono lancé'); };
  $('#fz').onclick = () => {
    if (!frames.length) return toast('Activez d\'abord la caméra');
    setTimeout(() => {
      mode = 'review'; $('#live').style.display = 'none'; $('#rev').style.display = 'block';
      $('#sl').max = frames.length - 1; show(frames.length - 1);
    }, 400);
  };
  $('#sl').oninput = () => show(+$('#sl').value);
  [['#p10', -10], ['#p1', -1], ['#n1', 1], ['#n10', 10]].forEach(([s, d]) => $(s).onclick = () => show(idx + d));
  $('#mk').onclick = () => { const f = frames[idx]; if (!f) return; marks.push({ label: $('#lb').value.trim() || `Coureur ${marks.length + 1}`, time: rel(f.t), t: f.t }); marks.sort((a, b) => a.t - b.t); $('#lb').value = ''; drawMarks(); beep(1000, .08); };
  $('#back').onclick = () => { mode = 'live'; frames = []; $('#rev').style.display = 'none'; $('#live').style.display = 'block'; };
  $('#exp').onclick = () => { if (!marks.length) return toast('Rien à exporter'); download(`photo-finish-${today()}.csv`, csv([['Rang', 'Nom', 'Temps'], ...marks.map((m, i) => [i + 1, m.label, m.time])])); };
  live();
  return () => { clearInterval(capIv); cancelAnimationFrame(raf); stopStream(stream); frames = []; };
},

/* ---------- Dispenses ---------- */
dispenses(el) {
  const draw = () => {
    const f = el.querySelector('#fc')?.value ?? '';
    const list = DB.dispenses.filter(d => !f || d.classe === f).sort((a, b) => (b.fin || '9').localeCompare(a.fin || '9'));
    const actives = list.filter(d => !d.fin || d.fin >= today()), passees = list.filter(d => d.fin && d.fin < today());
    const item = d => `<div class="list-item"><div style="flex:1"><b>${esc(d.eleve)}</b> <span class="muted">${esc(d.classe || '')}</span><br>
      <span class="pill ${d.type === 'Totale' ? 'warn' : ''}">${d.type}</span> <span class="muted">du ${frDate(d.debut)}${d.fin ? ' au ' + frDate(d.fin) : ' (sans date de fin)'}</span>
      ${d.note ? `<div class="muted">${esc(d.note)}</div>` : ''}</div><button class="btn btn-ghost" data-d="${DB.dispenses.indexOf(d)}">🗑</button></div>`;
    el.querySelector('#lists').innerHTML = `<div class="section-title"><h2>En cours (${actives.length})</h2></div><div class="card" style="padding:0">${actives.map(item).join('') || '<div class="empty">Aucune dispense en cours.</div>'}</div>
      <div class="section-title"><h2>Terminées (${passees.length})</h2></div><div class="card" style="padding:0">${passees.map(item).join('') || '<div class="empty">—</div>'}</div>`;
    el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { if (confirm('Supprimer ?')) { DB.dispenses.splice(b.dataset.d, 1); save(); draw(); } });
  };
  el.innerHTML = `<div class="card"><h3>Nouvelle dispense</h3>
    <div class="row"><div><label>Classe</label>${DB.classes.length ? classNameSelect('cl') : '<input id="cl" placeholder="ex : 6E1">'}</div><div><label>Élève</label><input id="el" list="eleves" placeholder="Nom de l'élève"><datalist id="eleves"></datalist></div></div>
    <div class="row"><div><label>Type</label><select id="ty"><option>Partielle</option><option>Totale</option></select></div><div><label>Du</label><input id="db" type="date" value="${today()}"></div><div><label>Au</label><input id="fn" type="date"></div></div>
    <label>Remarque (activités possibles, aménagements…)</label><input id="nt">
    <button class="btn btn-grad btn-block" style="margin-top:12px" id="add">＋ Enregistrer</button></div>
    <div style="margin-top:14px"><label>Filtrer</label>${classNameSelect('fc', true)}</div><div id="lists"></div>`;
  const $ = s => el.querySelector(s);
  const fillDl = () => $('#eleves').innerHTML = studentsOf($('#cl').value).map(n => `<option value="${esc(n)}">`).join('');
  $('#cl').onchange = fillDl; fillDl();
  $('#fc').onchange = draw;
  $('#add').onclick = () => {
    const eleve = $('#el').value.trim(); if (!eleve) return toast('Nom de l\'élève requis');
    DB.dispenses.push({ classe: $('#cl').value, eleve, type: $('#ty').value, debut: $('#db').value, fin: $('#fn').value, note: $('#nt').value.trim() });
    save(); $('#el').value = ''; $('#nt').value = ''; $('#fn').value = ''; toast('Dispense enregistrée ✔'); draw();
  };
  draw();
},

/* ---------- Oublis de tenue ---------- */
oubli(el) {
  if (!DB.classes.length) { el.innerHTML = noClassMsg; return; }
  el.innerHTML = `<div class="card"><label>Classe</label>${classNameSelect('cl')}
    <div class="row" style="margin-top:10px"><button class="btn btn-ghost" id="exp">📤 Exporter</button><button class="btn btn-ghost" id="rz">↺ Remettre à zéro</button></div></div>
    <div class="card" style="padding:0;margin-top:12px" id="ls"></div>`;
  const $ = s => el.querySelector(s);
  const data = () => (DB.oublis[$('#cl').value] = DB.oublis[$('#cl').value] || {});
  const draw = () => {
    const d = data(), st = studentsOf($('#cl').value);
    $('#ls').innerHTML = st.map((n, i) => { const c = (d[n] || []).length, last = (d[n] || []).slice(-1)[0];
      return `<div class="list-item"><div class="count ${c >= 3 ? 'hot' : ''}">${c}</div><div style="flex:1"><b>${esc(n)}</b>${last ? `<div class="muted">dernier : ${frDate(last)}</div>` : ''}</div>
      <button class="btn btn-ghost" data-m="${i}">−</button><button class="btn btn-grad" data-p="${i}">+1</button></div>`; }).join('') || '<div class="empty">Classe vide.</div>';
    $('#ls').querySelectorAll('[data-p]').forEach(b => b.onclick = () => { const n = st[b.dataset.p]; (d[n] = d[n] || []).push(today()); save(); draw(); if (d[n].length === 3) toast(`⚠️ 3e oubli pour ${n}`); });
    $('#ls').querySelectorAll('[data-m]').forEach(b => b.onclick = () => { const n = st[b.dataset.m]; (d[n] || []).pop(); save(); draw(); });
  };
  $('#cl').onchange = draw;
  $('#rz').onclick = () => { if (confirm('Remettre à zéro les oublis de cette classe ?')) { DB.oublis[$('#cl').value] = {}; save(); draw(); } };
  $('#exp').onclick = () => { const d = data(); download(`oublis-${$('#cl').value}-${today()}.csv`, csv([['Élève', 'Nombre', 'Dates'], ...studentsOf($('#cl').value).map(n => [n, (d[n] || []).length, (d[n] || []).map(frDate).join(', ')])])); };
  draw();
},

/* ---------- Tournoi à élimination directe ---------- */
tournoi(el) {
  let rounds = [];
  el.innerHTML = `<div class="card">${classSelect('ts')}<label>Équipes / joueurs (un par ligne)</label><textarea id="tl" style="min-height:110px">Équipe 1\nÉquipe 2\nÉquipe 3\nÉquipe 4\nÉquipe 5\nÉquipe 6</textarea>
    <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="mx" style="width:auto"> Mélanger au hasard</label>
    <button class="btn btn-grad btn-block" style="margin-top:10px" id="gen">🏅 Générer le tableau</button></div>
    <p class="muted" style="margin:12px 2px 0">Touchez le vainqueur de chaque match pour le qualifier.</p><div class="bracket" id="br"></div><div id="ch"></div>`;
  bindClassToTextarea('ts', 'tl');
  const $ = s => el.querySelector(s);
  const names = ['Finale', 'Demi-finales', 'Quarts', '8es', '16es', '32es'];
  const propagate = () => {
    for (let r = 0; r < rounds.length; r++) rounds[r].forEach((m, i) => {
      if (r > 0) { const p1 = rounds[r - 1][2 * i], p2 = rounds[r - 1][2 * i + 1]; m.a = p1.w ?? null; m.b = p2.w ?? null; }
      if (m.w != null && m.w !== m.a && m.w !== m.b) m.w = null;
      if (r === 0 && m.a != null && m.b == null) m.w = m.a;
    });
  };
  const draw = () => {
    propagate();
    const R = rounds.length;
    $('#br').innerHTML = rounds.map((rd, r) => `<div class="round"><h4>${names[R - 1 - r] || 'Tour ' + (r + 1)}</h4>${rd.map((m, i) => `<div class="match">
      ${['a', 'b'].map(k => `<button data-r="${r}" data-i="${i}" data-k="${k}" class="${m.w != null && m[k] != null ? (m.w === m[k] ? 'win' : 'lose') : ''}" ${m[k] == null || m.a == null || m.b == null ? 'disabled' : ''}>${m[k] != null ? esc(m[k]) : (r === 0 ? 'exempt' : '…')}</button>`).join('')}</div>`).join('')}</div>`).join('');
    $('#br').querySelectorAll('[data-r]').forEach(b => b.onclick = () => { const m = rounds[b.dataset.r][b.dataset.i]; m.w = m.w === m[b.dataset.k] ? null : m[b.dataset.k]; draw(); });
    const fin = rounds[R - 1]?.[0];
    $('#ch').innerHTML = fin?.w != null ? `<div class="champion">🏆 ${esc(fin.w)}</div>` : '';
    if (fin?.w != null) beep(1200, .4);
  };
  $('#gen').onclick = () => {
    let t = namesFrom('tl'); if (t.length < 2) return toast('Au moins 2 participants');
    if ($('#mx').checked) t = shuffle(t);
    const size = 2 ** Math.ceil(Math.log2(t.length)); const slots = [...t, ...Array(size - t.length).fill(null)];
    rounds = [Array.from({ length: size / 2 }, (_, i) => ({ a: slots[i], b: slots[size - 1 - i], w: null }))];
    while (rounds[rounds.length - 1].length > 1) rounds.push(Array.from({ length: rounds[rounds.length - 1].length / 2 }, () => ({ a: null, b: null, w: null })));
    draw();
  };
},

/* ---------- Pyramide des victoires ---------- */
pyramide(el) {
  let ranks = [], log = [];
  el.innerHTML = `<div class="card" id="setup">${classSelect('ps')}<label>Joueurs (ordre = classement de départ)</label><textarea id="pl"></textarea>
    <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="mx" checked style="width:auto"> Placement de départ au hasard</label>
    <button class="btn btn-grad btn-block" style="margin-top:10px" id="gen">🔺 Construire la pyramide</button></div>
    <div id="game" style="display:none">
      <div class="pyr" id="py"></div>
      <div class="card"><h3>Défi</h3><p class="muted" style="margin:4px 0 0">On défie un joueur de la ligne juste au-dessus (ou de sa propre ligne). Si le challenger gagne, il prend sa place.</p>
        <div class="row"><div><label>Challenger</label><select id="c1"></select></div><div><label>Défié</label><select id="c2"></select></div></div>
        <div class="row" style="margin-top:10px"><button class="btn btn-grad" id="w1">Victoire challenger</button><button class="btn btn-ghost" id="w2">Victoire défié</button></div></div>
      <div class="section-title"><h2>Historique</h2><button class="link" id="new">Nouvelle pyramide</button></div><div class="card" id="lg"></div>
    </div>`;
  bindClassToTextarea('ps', 'pl');
  const $ = s => el.querySelector(s);
  const draw = () => {
    let html = '', i = 0, row = 1;
    while (i < ranks.length) { html += `<div class="pyr-row">${ranks.slice(i, i + row).map((n, k) => `<div class="pyr-cell"><small>#${i + k + 1}</small>${esc(n)}</div>`).join('')}</div>`; i += row; row++; }
    $('#py').innerHTML = html;
    const opts = ranks.map((n, k) => `<option value="${k}">#${k + 1} ${esc(n)}</option>`).join('');
    const v1 = $('#c1').value, v2 = $('#c2').value; $('#c1').innerHTML = opts; $('#c2').innerHTML = opts;
    $('#c1').value = v1 || Math.min(1, ranks.length - 1); $('#c2').value = v2 || 0;
    $('#lg').innerHTML = log.length ? log.slice().reverse().map(l => `<div class="muted" style="padding:4px 0">${esc(l)}</div>`).join('') : '<div class="muted">Aucun match joué.</div>';
  };
  $('#gen').onclick = () => { let p = namesFrom('pl'); if (p.length < 3) return toast('Au moins 3 joueurs'); ranks = $('#mx').checked ? shuffle(p) : p; log = []; $('#setup').style.display = 'none'; $('#game').style.display = 'block'; draw(); };
  const play = challengerWins => {
    const a = +$('#c1').value, b = +$('#c2').value; if (a === b) return toast('Choisissez deux joueurs différents');
    const ca = ranks[a], cb = ranks[b];
    if (challengerWins && a > b) { ranks.splice(a, 1); ranks.splice(b, 0, ca); log.push(`${ca} bat ${cb} → monte en #${b + 1}`); beep(1200, .2); }
    else log.push(challengerWins ? `${ca} bat ${cb} (déjà mieux classé)` : `${cb} résiste à ${ca}`);
    $('#c1').value = ''; $('#c2').value = ''; draw();
  };
  $('#w1').onclick = () => play(true); $('#w2').onclick = () => play(false);
  $('#new').onclick = () => { $('#setup').style.display = 'block'; $('#game').style.display = 'none'; };
},

/* ---------- Relais ---------- */
relais(el) {
  let teams = [], t0 = null, raf = null;
  el.innerHTML = `<div class="card" id="setup">
    <label>Équipes (une par ligne)</label><textarea id="tl" style="min-height:100px">Équipe 1\nÉquipe 2\nÉquipe 3\nÉquipe 4</textarea>
    <div class="row"><div><label>Relayeurs / fractions par équipe</label><input id="lg" type="number" value="4" min="1" max="20"></div><div><label>Distance d'une fraction (m, optionnel)</label><input id="ds" type="number" placeholder="ex : 100"></div></div>
    <button class="btn btn-grad btn-block" style="margin-top:12px" id="gen">🔄 Préparer la course</button></div>
    <div id="race" style="display:none">
      <div class="card"><div class="big clock" id="tm">00:00,00</div><div class="row"><button class="btn btn-grad" id="go">🔫 Départ</button><button class="btn btn-ghost" id="exp">📤 Résultats</button><button class="btn btn-ghost" id="new">↺ Nouvelle</button></div></div>
      <div class="relay-grid" id="rg"></div></div>`;
  const $ = s => el.querySelector(s); let legs = 4, dist = 0;
  const finished = () => teams.filter(t => t.splits.length === legs).sort((a, b) => a.total - b.total);
  const draw = () => {
    const fin = finished();
    $('#rg').innerHTML = teams.map((t, i) => { const done = t.splits.length === legs, rk = fin.indexOf(t) + 1;
      return `<div class="relay ${done ? 'done' : ''}"><b>${esc(t.name)}</b> ${done ? `<span class="rk">${rk === 1 ? '🥇' : rk === 2 ? '🥈' : rk === 3 ? '🥉' : rk + 'e'}</span>` : ''}
      <div class="t" data-t="${i}">${done ? fmt(t.total) : '00:00,00'}</div>
      <div class="legs">${t.splits.map((s, k) => `R${k + 1} ${fmt(s)}${dist ? ` (${(dist / (s / 1000) * 3.6).toFixed(1)} km/h)` : ''}`).join(' · ')}</div>
      <button class="btn ${done ? 'btn-ghost' : 'btn-grad'} btn-block" style="margin-top:8px" data-i="${i}" ${done || !t0 ? 'disabled' : ''}>${done ? 'Arrivée ✔' : t.splits.length === legs - 1 ? '🏁 Arrivée' : `➡️ Passage ${t.splits.length + 1}/${legs}`}</button></div>`; }).join('');
    $('#rg').querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
      const t = teams[b.dataset.i], now = performance.now() - t0, prev = t.splits.reduce((a, c) => a + c, 0);
      if (now - prev < 300) return; t.splits.push(now - prev); if (t.splits.length === legs) { t.total = now; beep(1200, .3); } else beep(900, .08); draw();
    });
  };
  const tick = () => { raf = requestAnimationFrame(tick); if (!t0) return; const now = performance.now() - t0; $('#tm').textContent = fmt(now);
    teams.forEach((t, i) => { if (t.splits.length < legs) { const d = $(`[data-t="${i}"]`); if (d) d.textContent = fmt(now); } }); };
  $('#gen').onclick = () => { const n = namesFrom('tl'); if (!n.length) return toast('Ajoutez des équipes'); legs = Math.max(1, +$('#lg').value || 1); dist = +$('#ds').value || 0;
    teams = n.map(name => ({ name, splits: [], total: 0 })); t0 = null; $('#setup').style.display = 'none'; $('#race').style.display = 'block'; $('#tm').textContent = '00:00,00'; draw(); };
  $('#go').onclick = () => { if (t0) return; t0 = performance.now(); beep(1500, .35); draw(); };
  $('#new').onclick = () => { if (!t0 || confirm('Abandonner cette course ?')) { t0 = null; $('#setup').style.display = 'block'; $('#race').style.display = 'none'; } };
  $('#exp').onclick = () => { const fin = finished(); download(`relais-${today()}.csv`, csv([['Rang', 'Équipe', 'Temps', ...Array.from({ length: legs }, (_, k) => 'Relais ' + (k + 1))],
    ...teams.map(t => [fin.indexOf(t) + 1 || '', t.name, t.total ? fmt(t.total) : '', ...t.splits.map(s => fmt(s))])])); };
  tick(); return () => cancelAnimationFrame(raf);
},

/* ---------- Journal de musculation ---------- */
journal(el) {
  const EX = ['Squat', 'Développé couché', 'Soulevé de terre', 'Tirage horizontal', 'Presse à cuisses', 'Fentes', 'Pompes', 'Gainage', 'Tractions', 'Développé militaire', 'Curl biceps', 'Extension triceps'];
  el.innerHTML = `<div class="card"><h3>Nouvelle séance / exercice</h3>
    <div class="row"><div><label>Élève</label><input id="el" list="dle" placeholder="Nom"></div><div><label>Date</label><input id="dt" type="date" value="${today()}"></div></div>
    <label>Exercice</label><input id="ex" list="dlx" placeholder="ex : Squat">
    <div class="row"><div><label>Charge (kg)</label><input id="ch" type="number" step="0.5"></div><div><label>Séries</label><input id="se" type="number" value="3"></div><div><label>Répét.</label><input id="re" type="number" value="10"></div></div>
    <div class="row"><div><label>Ressenti (1 facile → 10 max)</label><input id="rp" type="range" min="1" max="10" value="6"></div><div style="flex:0 0 50px;text-align:center;padding-top:30px;font-weight:900" id="rpv">6</div></div>
    <label>Remarque</label><input id="nt" placeholder="Placement, sensations…">
    <button class="btn btn-grad btn-block" style="margin-top:12px" id="add">＋ Ajouter au journal</button></div>
    <datalist id="dle"></datalist><datalist id="dlx">${EX.map(e => `<option value="${e}">`).join('')}</datalist>
    <div class="section-title"><h2>Journal</h2><button class="link" id="exp">Exporter CSV</button></div>
    <select id="fl"></select><div class="card" style="padding:0;margin-top:10px" id="ls"></div>`;
  const $ = s => el.querySelector(s);
  $('#rp').oninput = () => $('#rpv').textContent = $('#rp').value;
  const draw = () => {
    const names = [...new Set([...DB.journal.map(j => j.eleve), ...DB.classes.flatMap(c => c.students)])].sort();
    $('#dle').innerHTML = names.map(n => `<option value="${esc(n)}">`).join('');
    const cur = $('#fl').value, used = [...new Set(DB.journal.map(j => j.eleve))].sort();
    $('#fl').innerHTML = '<option value="">Tous les élèves</option>' + used.map(n => `<option ${n === cur ? 'selected' : ''}>${esc(n)}</option>`).join('');
    const list = DB.journal.map((j, i) => ({ ...j, i })).filter(j => !$('#fl').value || j.eleve === $('#fl').value).sort((a, b) => b.date.localeCompare(a.date));
    $('#ls').innerHTML = list.map(j => `<div class="list-item"><div style="flex:1"><b>${esc(j.exercice)}</b> — ${j.charge || 0} kg · ${j.series}×${j.reps} <span class="pill">RPE ${j.rpe}</span>
      <div class="muted">${esc(j.eleve)} · ${frDate(j.date)} · volume ${Math.round((j.charge || 0) * j.series * j.reps)} kg${j.note ? ' · ' + esc(j.note) : ''}</div></div><button class="btn btn-ghost" data-d="${j.i}">🗑</button></div>`).join('') || '<div class="empty">Journal vide.</div>';
    $('#ls').querySelectorAll('[data-d]').forEach(b => b.onclick = () => { DB.journal.splice(b.dataset.d, 1); save(); draw(); });
  };
  $('#fl').onchange = draw;
  $('#add').onclick = () => {
    const eleve = $('#el').value.trim(), exercice = $('#ex').value.trim(); if (!eleve || !exercice) return toast('Élève et exercice requis');
    DB.journal.push({ eleve, date: $('#dt').value, exercice, charge: +$('#ch').value || 0, series: +$('#se').value || 0, reps: +$('#re').value || 0, rpe: +$('#rp').value, note: $('#nt').value.trim() });
    save(); $('#nt').value = ''; toast('Ajouté ✔'); draw();
  };
  $('#exp').onclick = () => download(`journal-muscu-${today()}.csv`, csv([['Élève', 'Date', 'Exercice', 'Charge', 'Séries', 'Répétitions', 'Ressenti', 'Volume', 'Remarque'],
    ...DB.journal.map(j => [j.eleve, frDate(j.date), j.exercice, j.charge, j.series, j.reps, j.rpe, (j.charge || 0) * j.series * j.reps, j.note])]));
  draw();
},

/* ---------- Grilles d'évaluation ---------- */
grilles(el) {
  const LV = [{ l: 'Non acquis', k: 0 }, { l: 'Fragile', k: 1 / 3 }, { l: 'Acquis', k: 2 / 3 }, { l: 'Expert', k: 1 }];
  const scoreOf = (g, ev) => { const tot = g.criteria.reduce((a, c) => a + c.pts, 0); let s = 0, n = 0;
    g.criteria.forEach((c, i) => { if (ev?.[i] != null) { s += c.pts * LV[ev[i]].k; n++; } }); return { s, tot, n, sur20: tot ? s / tot * 20 : 0 }; };
  const list = () => {
    el.innerHTML = `<div class="card"><h3>Mes grilles</h3><div id="gl"></div><button class="btn btn-grad btn-block" style="margin-top:12px" id="new">＋ Nouvelle grille</button></div>`;
    el.querySelector('#gl').innerHTML = DB.grilles.map((g, i) => `<div class="list-item"><div style="flex:1"><b>${esc(g.name)}</b><div class="muted">${g.criteria.length} critères · sur ${g.criteria.reduce((a, c) => a + c.pts, 0)} pts</div></div>
      <button class="btn btn-grad" data-v="${i}">Évaluer</button><button class="btn btn-ghost" data-e="${i}">✏️</button></div>`).join('') || '<div class="empty">Aucune grille. Créez-en une !</div>';
    el.querySelector('#new').onclick = () => edit(null);
    el.querySelectorAll('[data-e]').forEach(b => b.onclick = () => edit(+b.dataset.e));
    el.querySelectorAll('[data-v]').forEach(b => b.onclick = () => evaluate(+b.dataset.v));
  };
  const edit = i => {
    const g = i != null ? DB.grilles[i] : { name: 'Demi-fond — 3×500 m', criteria: [{ label: 'Performance / VMA', pts: 8 }, { label: 'Respect du projet de course', pts: 6 }, { label: 'Analyse de sa course', pts: 4 }, { label: 'Rôle d\'observateur', pts: 2 }], evals: {} };
    el.innerHTML = `<div class="card"><h3>${i != null ? 'Modifier' : 'Nouvelle'} grille</h3><label>Nom</label><input id="gn" value="${esc(g.name)}">
      <label>Critères — un par ligne : « Critère ; points »</label><textarea id="gc" style="min-height:150px">${esc(g.criteria.map(c => c.label + ' ; ' + c.pts).join('\n'))}</textarea>
      <p class="muted">Niveaux : Non acquis (0) · Fragile (⅓) · Acquis (⅔) · Expert (100 %) des points du critère.</p>
      <div class="row"><button class="btn btn-grad" id="sv">💾 Enregistrer</button><button class="btn btn-ghost" id="bk">Annuler</button>${i != null ? '<button class="btn btn-danger" id="dl">Supprimer</button>' : ''}</div></div>`;
    el.querySelector('#bk').onclick = list;
    if (i != null) el.querySelector('#dl').onclick = () => { if (confirm('Supprimer la grille et ses évaluations ?')) { DB.grilles.splice(i, 1); save(); list(); } };
    el.querySelector('#sv').onclick = () => {
      const criteria = el.querySelector('#gc').value.split('\n').map(l => l.trim()).filter(Boolean).map(l => { const [a, b] = l.split(';'); return { label: a.trim(), pts: +(b || '').replace(',', '.') || 1 }; });
      if (!criteria.length) return toast('Ajoutez au moins un critère');
      const ng = { ...g, name: el.querySelector('#gn').value.trim() || 'Grille', criteria };
      if (i != null) DB.grilles[i] = ng; else DB.grilles.push(ng); save(); toast('Grille enregistrée ✔'); list();
    };
  };
  const evaluate = gi => {
    const g = DB.grilles[gi]; if (!DB.classes.length) { el.innerHTML = noClassMsg; return; }
    let cls = DB.classes[0].name, si = 0;
    const draw = () => {
      const st = studentsOf(cls); g.evals[cls] = g.evals[cls] || {}; const E = g.evals[cls];
      const name = st[si], ev = E[name] || {}, sc = scoreOf(g, ev);
      el.innerHTML = `<div class="card"><div class="row" style="align-items:end"><div><label>Classe</label>${classNameSelect('cl')}</div><button class="btn btn-ghost" style="flex:0 0 auto" id="bk">← Grilles</button></div>
        <div class="row" style="margin-top:12px;align-items:center"><button class="btn btn-ghost" style="flex:0 0 52px" id="pv">◀</button>
        <select id="se">${st.map((n, k) => `<option value="${k}" ${k === si ? 'selected' : ''}>${E[n] && Object.keys(E[n]).length === g.criteria.length ? '✔ ' : ''}${esc(n)}</option>`).join('')}</select>
        <button class="btn btn-ghost" style="flex:0 0 52px" id="nx">▶</button></div></div>
        <div class="card" style="margin-top:12px"><div style="display:flex;justify-content:space-between;align-items:center"><h3>${esc(name || '—')}</h3><span class="pill ok" style="font-size:.95rem">${sc.sur20.toFixed(1)} / 20</span></div>
        ${g.criteria.map((c, k) => `<div class="crit"><b>${esc(c.label)}</b> <span class="muted">(${c.pts} pts)</span><div class="lvl">${LV.map((l, x) => `<button data-c="${k}" data-l="${x}" class="${ev[k] === x ? 'on' : ''}">${l.l}</button>`).join('')}</div></div>`).join('')}</div>
        <div class="section-title"><h2>Bilan de la classe</h2><button class="link" id="exp">Exporter CSV</button></div>
        <div class="card sheet-table"><table><tr><th>Élève</th><th>/20</th><th>Critères</th></tr>${st.map(n => { const s = scoreOf(g, E[n]); return `<tr><td>${esc(n)}</td><td><b>${s.n ? s.sur20.toFixed(1) : '–'}</b></td><td class="muted">${s.n}/${g.criteria.length}</td></tr>`; }).join('')}</table></div>`;
      const $ = s => el.querySelector(s); $('#cl').value = cls;
      $('#cl').onchange = () => { cls = $('#cl').value; si = 0; draw(); };
      $('#bk').onclick = list; $('#se').onchange = () => { si = +$('#se').value; draw(); };
      $('#pv').onclick = () => { si = Math.max(0, si - 1); draw(); }; $('#nx').onclick = () => { si = Math.min(st.length - 1, si + 1); draw(); };
      el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { if (!name) return; E[name] = E[name] || {}; const k = +b.dataset.c, x = +b.dataset.l; E[name][k] = E[name][k] === x ? undefined : x; save(); draw(); });
      $('#exp').onclick = () => download(`${g.name}-${cls}.csv`, csv([['Élève', ...g.criteria.map(c => `${c.label} (/${c.pts})`), 'Total', 'Note /20'],
        ...st.map(n => { const e = E[n] || {}, s = scoreOf(g, e); return [n, ...g.criteria.map((c, k) => e[k] != null ? (c.pts * LV[e[k]].k).toFixed(2).replace('.', ',') : ''), s.s.toFixed(2).replace('.', ','), s.n ? s.sur20.toFixed(1).replace('.', ',') : '']; })]));
    };
    draw();
  };
  list();
},

/* ---------- Tableau de suivi ---------- */
suivi(el) {
  if (!DB.classes.length) { el.innerHTML = noClassMsg; return; }
  el.innerHTML = `<div class="card"><label>Classe</label>${classNameSelect('cl')}
    <div class="row" style="margin-top:10px"><input id="ct" placeholder="Nouvelle colonne (ex : Test Luc Léger)"><input id="cd" type="date" value="${today()}" style="flex:0 0 150px"></div>
    <div class="row" style="margin-top:10px"><button class="btn btn-grad" id="add">＋ Ajouter la colonne</button><button class="btn btn-ghost" id="exp">📤 Export CSV</button></div>
    <p class="muted" style="margin:8px 0 0">Saisissez des nombres (notes, temps, paliers…) ou du texte (observations). La moyenne se calcule sur les valeurs numériques.</p></div>
    <div class="card sheet-table" id="tb" style="margin-top:12px"></div>`;
  const $ = s => el.querySelector(s);
  const data = () => (DB.suivi[$('#cl').value] = DB.suivi[$('#cl').value] || { cols: [], vals: {} });
  const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; };
  const avg = (d, n) => { const xs = d.cols.map((c, k) => num(d.vals[k + '|' + n])).filter(x => x != null); return xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : '–'; };
  const draw = () => {
    const d = data(), st = studentsOf($('#cl').value);
    if (!d.cols.length) { $('#tb').innerHTML = '<div class="empty">Ajoutez une première colonne pour commencer.</div>'; return; }
    $('#tb').innerHTML = `<table><tr><th>Élève</th>${d.cols.map((c, k) => `<th>${esc(c.title)}<br><span style="font-weight:500">${frDate(c.date)}</span> <button data-x="${k}" title="Supprimer">✕</button></th>`).join('')}<th>Moy.</th></tr>
      ${st.map(n => `<tr><td><b>${esc(n)}</b></td>${d.cols.map((c, k) => `<td><input data-k="${k}" data-n="${esc(n)}" value="${esc(d.vals[k + '|' + n] ?? '')}"></td>`).join('')}<td><b data-avg="${esc(n)}">${avg(d, n)}</b></td></tr>`).join('')}</table>`;
    $('#tb').querySelectorAll('input').forEach(i => i.oninput = () => { d.vals[i.dataset.k + '|' + i.dataset.n] = i.value; save(); const a = $('#tb').querySelector(`[data-avg="${CSS.escape(i.dataset.n)}"]`); if (a) a.textContent = avg(d, i.dataset.n); });
    $('#tb').querySelectorAll('[data-x]').forEach(b => b.onclick = () => {
      if (!confirm('Supprimer cette colonne ?')) return; const k = +b.dataset.x, nv = {};
      Object.entries(d.vals).forEach(([key, v]) => { const [c, ...n] = key.split('|'); const ci = +c; if (ci < k) nv[key] = v; else if (ci > k) nv[(ci - 1) + '|' + n.join('|')] = v; });
      d.cols.splice(k, 1); d.vals = nv; save(); draw(); });
  };
  $('#cl').onchange = draw;
  $('#add').onclick = () => { const t = $('#ct').value.trim(); if (!t) return toast('Titre de colonne requis'); data().cols.push({ title: t, date: $('#cd').value }); $('#ct').value = ''; save(); draw(); };
  $('#exp').onclick = () => { const d = data(), st = studentsOf($('#cl').value);
    download(`suivi-${$('#cl').value}-${today()}.csv`, csv([['Élève', ...d.cols.map(c => `${c.title} (${frDate(c.date)})`), 'Moyenne'], ...st.map(n => [n, ...d.cols.map((c, k) => d.vals[k + '|' + n] ?? ''), avg(d, n).replace('.', ',')])])); };
  draw();
},

/* ---------- Questions de débrief ---------- */
debrief(el) {
  const BANK = {
    'Ressenti': ['Comment te sens-tu après cette séance ?', 'Quel moment as-tu préféré aujourd\'hui ? Pourquoi ?', 'Qu\'est-ce qui a été le plus difficile pour toi ?', 'Sur une échelle de 1 à 10, quel effort as-tu fourni ?'],
    'Technique': ['Quel geste as-tu amélioré aujourd\'hui ?', 'Quel conseil donnerais-tu à un camarade pour réussir cet exercice ?', 'Qu\'est-ce que tu dois encore travailler ?', 'Comment sais-tu que ton geste est réussi ?'],
    'Tactique': ['Quelle stratégie a le mieux fonctionné pour ton équipe ?', 'Qu\'aurais-tu fait différemment dans le dernier match ?', 'Comment avez-vous créé le déséquilibre chez l\'adversaire ?', 'Quand fallait-il accélérer ou temporiser ?'],
    'Coopération': ['Comment as-tu aidé un partenaire aujourd\'hui ?', 'Votre groupe a-t-il bien communiqué ? Donne un exemple.', 'Quel rôle as-tu tenu (arbitre, observateur, coach) ? Qu\'as-tu appris ?', 'Qu\'est-ce qui rend une équipe efficace ?'],
    'Sécurité & santé': ['Pourquoi s\'échauffe-t-on avant l\'effort ?', 'Quelle règle de sécurité était essentielle aujourd\'hui ?', 'Comment as-tu géré ta respiration pendant l\'effort ?', 'Que faire pour bien récupérer ce soir ?'],
    'Progrès': ['Qu\'as-tu appris de nouveau aujourd\'hui ?', 'Quel est ton objectif pour la prochaine séance ?', 'Qu\'est-ce qui t\'a fait progresser ?', 'Qu\'as-tu réussi aujourd\'hui que tu ne savais pas faire avant ?'],
  };
  let cat = '', last = '';
  const all = () => { const b = Object.entries(BANK).flatMap(([c, qs]) => qs.map(q => ({ c, q }))); return [...b, ...DB.debrief.map(q => ({ c: 'Mes questions', q }))]; };
  const draw = () => {
    const cats = ['', ...Object.keys(BANK), ...(DB.debrief.length ? ['Mes questions'] : [])];
    el.innerHTML = `<div class="chips">${cats.map(c => `<button class="chip ${c === cat ? 'active' : ''}" data-c="${esc(c)}">${c || '✨ Toutes'}</button>`).join('')}</div>
      <div class="card" style="margin-top:8px"><div class="question" id="q">${esc(last) || '💬'}</div><button class="btn btn-grad btn-block" id="go">🎲 Question au hasard</button></div>
      <div class="section-title"><h2>Mes questions</h2></div>
      <div class="card"><div class="row"><input id="nq" placeholder="Ajouter ma question…"><button class="btn btn-grad" style="flex:0 0 auto" id="add">＋</button></div>
      ${DB.debrief.map((q, i) => `<div class="list-item" style="padding:10px 0"><span>${esc(q)}</span><button class="btn btn-ghost" data-d="${i}">🗑</button></div>`).join('')}</div>`;
    el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { cat = b.dataset.c; draw(); });
    el.querySelector('#go').onclick = () => { const pool = all().filter(x => !cat || x.c === cat).map(x => x.q).filter(q => q !== last); if (!pool.length) return; last = pool[Math.floor(Math.random() * pool.length)]; el.querySelector('#q').textContent = last; beep(900, .08); };
    el.querySelector('#add').onclick = () => { const q = el.querySelector('#nq').value.trim(); if (!q) return; DB.debrief.push(q); save(); draw(); };
    el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { DB.debrief.splice(b.dataset.d, 1); save(); draw(); });
  };
  draw();
},
});

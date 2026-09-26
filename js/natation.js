/* =========================================================
   EPS ONE — Outil « Natation »
   Distance nagée · temps de nage · nombre de coups de bras
   ========================================================= */
DB.natation = DB.natation || [];
ICONS.natation = '<path d="M2 17c2 0 2-1.5 4-1.5S8 17 10 17s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M2 21c2 0 2-1.5 4-1.5S8 21 10 21s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5"/><circle cx="16" cy="6" r="2"/><path d="M4 12.5 9 8l3 3 3-2"/>';

/* Indice de nage (sur 25 m) = temps en secondes + nombre de coups de bras (plus il est bas, mieux c'est) */
const natIndice = (d, t, c) => d === 25 && t && c ? Math.round((t + c) * 10) / 10 : null;
const natI = v => v == null ? '–' : String(v).replace('.', ',');

function natationVite(el) {
  let t0 = null, acc = 0, run = false, iv = null, coups = 0;
  const secOf = () => acc + (run ? (performance.now() - t0) / 1000 : 0);
  const calc = (d, t, c) => ({
    v: d && t ? d / t : 0,
    t100: d && t ? t / d * 100 : 0,
    amp: d && c ? d / c : 0,            // distance par coup de bras
    freq: t && c ? c / t * 60 : 0,       // coups de bras par minute
  });
  const n2 = x => x ? x.toFixed(2).replace('.', ',') : '–';
  const draw = () => {
    el.innerHTML = `<div class="card">
        <div class="row">${DB.classes.length ? `<div><label>Classe</label><select id="cl"><option value="">—</option>${DB.classes.map(c => `<option>${esc(c.name)}</option>`).join('')}</select></div>` : ''}<div><label>Élève</label><input id="el" list="nat-el" placeholder="Nom"><datalist id="nat-el"></datalist></div></div>
        <label>Distance nagée (m)</label><div class="row"><input id="d" type="number" value="25">${[25, 50, 100, 200].map(v => `<button class="btn btn-ghost" style="flex:0 0 auto;padding:10px" data-d="${v}">${v}</button>`).join('')}</div>
        <label>Temps de nage</label>
        <div class="big clock" id="tm" style="font-size:clamp(2.6rem,13vw,4.5rem);padding:4px 0">00:00,00</div>
        <div class="row"><button class="btn btn-grad" id="go">▶ Départ</button><button class="btn btn-ghost" id="rz">↺</button></div>
        <div class="row" style="margin-top:8px"><div><label>ou saisie : min</label><input id="mm" type="number" min="0" placeholder="0"></div><div><label>s</label><input id="ss" type="number" min="0" step="0.01" placeholder="0"></div></div>
        <label>Nombre de coups de bras</label>
        <div class="row" style="align-items:center"><button class="btn btn-ghost" style="flex:0 0 60px;font-size:1.3rem" id="cm">−</button><input id="c" type="number" min="0" value="0" style="text-align:center;font-size:1.4rem;font-weight:900"><button class="btn btn-grad" style="flex:1.4;font-size:1.1rem;padding:14px" id="cp">＋1 coup de bras</button></div>
        <div class="result" id="res"></div>
        <button class="btn btn-grad btn-block" style="margin-top:12px" id="sv">💾 Enregistrer</button></div>
      <div class="section-title"><h2>Résultats</h2><button class="link" id="exp">Exporter CSV</button></div>
      <select id="fl"></select><div class="card sheet-table" style="margin-top:10px" id="ls"></div>`;
    const $ = s => el.querySelector(s);
    const time = () => run || acc ? secOf() : (+$('#mm').value || 0) * 60 + (+String($('#ss').value).replace(',', '.') || 0);
    const res = () => { const d = +$('#d').value || 0, t = time(), c = +$('#c').value || 0, x = calc(d, t, c);
      $('#res').innerHTML = `<div class="card"><b>${n2(x.v)}</b><small>m/s</small></div><div class="card"><b>${x.t100 ? fmt(x.t100 * 1000) : '–'}</b><small>au 100 m</small></div>
        <div class="card"><b>${n2(x.amp)}</b><small>m par coup de bras</small></div><div class="card"><b>${x.freq ? Math.round(x.freq) : '–'}</b><small>coups de bras / min</small></div>
        <div class="card" style="grid-column:1/-1"><b>${natI(natIndice(d, t, c))}</b><small>indice de nage sur 25 m (temps en s + coups de bras)${d !== 25 ? ' — distance 25 m uniquement' : ''}</small></div>`; };
    const fillNames = () => { const c = $('#cl')?.value; $('#nat-el').innerHTML = (c ? studentsOf(c) : [...new Set(DB.natation.map(r => r.eleve))]).map(n => `<option value="${esc(n)}">`).join(''); };
    if ($('#cl')) $('#cl').onchange = fillNames; fillNames();
    el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { $('#d').value = b.dataset.d; res(); });
    ['#d', '#mm', '#ss', '#c'].forEach(s => $(s).oninput = res);
    $('#go').onclick = () => { if (run) { acc = secOf(); run = false; $('#go').textContent = '▶ Reprendre'; beep(900, .2); }
      else { t0 = performance.now(); run = true; $('#go').textContent = '⏹ Arrivée'; beep(1300, .3); } res(); };
    $('#rz').onclick = () => { run = false; acc = 0; $('#go').textContent = '▶ Départ'; $('#tm').textContent = '00:00,00'; res(); };
    $('#cp').onclick = () => { $('#c').value = (+$('#c').value || 0) + 1; beep(1100, .03, .15); res(); };
    $('#cm').onclick = () => { $('#c').value = Math.max(0, (+$('#c').value || 0) - 1); res(); };
    $('#sv').onclick = () => { const eleve = $('#el').value.trim(), d = +$('#d').value || 0, t = time(), c = +$('#c').value || 0;
      if (!eleve) return toast('Nom de l\'élève requis'); if (!d || !t) return toast('Distance et temps requis');
      DB.natation.push({ date: Date.now(), classe: $('#cl')?.value || '', eleve, d, t: Math.round(t * 100) / 100, c }); save(); toast('Enregistré ✔');
      run = false; acc = 0; $('#el').value = ''; $('#c').value = 0; $('#mm').value = ''; $('#ss').value = ''; $('#go').textContent = '▶ Départ'; $('#tm').textContent = '00:00,00'; res(); list(); };
    const list = () => {
      const cur = $('#fl').value, names = [...new Set(DB.natation.map(r => r.eleve))].sort();
      $('#fl').innerHTML = '<option value="">Tous les élèves</option>' + names.map(n => `<option ${n === cur ? 'selected' : ''}>${esc(n)}</option>`).join('');
      const rows = DB.natation.map((r, i) => ({ ...r, i })).filter(r => !$('#fl').value || r.eleve === $('#fl').value).reverse();
      $('#ls').innerHTML = rows.length ? `<table><tr><th>Élève</th><th>Date</th><th>Dist.</th><th>Temps</th><th>Coups</th><th>m/s</th><th>m/coup</th><th>coups/min</th><th>Indice 25 m</th><th></th></tr>
        ${rows.map(r => { const x = calc(r.d, r.t, r.c); return `<tr><td><b>${esc(r.eleve)}</b></td><td>${new Date(r.date).toLocaleDateString('fr-FR')}</td><td>${r.d} m</td><td>${fmt(r.t * 1000)}</td><td>${r.c || '–'}</td><td>${n2(x.v)}</td><td>${n2(x.amp)}</td><td>${x.freq ? Math.round(x.freq) : '–'}</td><td><b>${natI(natIndice(r.d, r.t, r.c))}</b></td><td><button class="btn btn-ghost" style="padding:4px 8px" data-x="${r.i}">✕</button></td></tr>`; }).join('')}</table>`
        : '<div class="empty">Aucun résultat enregistré.</div>';
      $('#ls').querySelectorAll('[data-x]').forEach(b => b.onclick = () => { if (confirm('Supprimer ?')) { DB.natation.splice(+b.dataset.x, 1); save(); list(); } });
    };
    $('#fl').onchange = list;
    $('#exp').onclick = () => { if (!DB.natation.length) return toast('Rien à exporter');
      download(`natation-${new Date().toISOString().slice(0, 10)}.csv`, csv([['Élève', 'Classe', 'Date', 'Distance (m)', 'Temps', 'Coups de bras', 'Vitesse (m/s)', 'Temps au 100 m', 'Distance par coup de bras (m)', 'Coups de bras / min', 'Indice de nage 25 m'],
        ...DB.natation.map(r => { const x = calc(r.d, r.t, r.c); return [r.eleve, r.classe, new Date(r.date).toLocaleDateString('fr-FR'), r.d, fmt(r.t * 1000), r.c, n2(x.v), fmt(x.t100 * 1000), n2(x.amp), x.freq ? Math.round(x.freq) : '', natI(natIndice(r.d, r.t, r.c)).replace('–', '')]; })])); };
    res(); list();
  };
  draw();
  iv = setInterval(() => { const e = el.querySelector('#tm'); if (e && run) e.textContent = fmt(secOf() * 1000); }, 50);
  return () => clearInterval(iv);
}

/* ---------- Savoir nager (test ASNS) ---------- */
DB.asns = DB.asns || {};
const ASNS = ['Entrer dans l\'eau en chute arrière', 'Nager sur le ventre', 'Passer sous l\'obstacle', 'Nage ventrale', 'Surplace vertical (debout)',
  'Passage du ventre au dos', 'Nage dorsale', 'Flottaison en étoile sur le dos', '2e immersion (repasser sous l\'obstacle)'];
function natationSavoir(el) {
  if (!DB.classes.length) { el.innerHTML = noClassMsg; return; }
  let cls = DB.classes.some(c => c.name === DB.lastClass) ? DB.lastClass : DB.classes[0].name, si = 0;
  const rec = n => { DB.asns[cls] = DB.asns[cls] || {}; return DB.asns[cls][n] = DB.asns[cls][n] || { r: ASNS.map(() => null) }; };
  const ok = r => r.r.every(v => v === 1);
  const draw = () => {
    const st = studentsOf(cls); if (si >= st.length) si = 0; const n = st[si], R = n ? rec(n) : null;
    const nb = st.filter(x => DB.asns[cls]?.[x] && ok(DB.asns[cls][x])).length;
    el.innerHTML = `<div class="card"><div class="row"><div><label>Classe</label><select id="sc">${DB.classes.map(c => `<option ${c.name === cls ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
        <div><label>Élève</label><select id="se">${st.map((x, k) => `<option value="${k}" ${k === si ? 'selected' : ''}>${esc(x)}${DB.asns[cls]?.[x] && ok(DB.asns[cls][x]) ? ' ✔' : ''}</option>`).join('')}</select></div></div></div>
      ${n ? `<div class="card" style="margin-top:12px"><h3>${esc(n)} — test du savoir-nager</h3>
        ${ASNS.map((l, i) => `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--line)"><span style="flex:1;font-weight:700">${i + 1}. ${l}</span>
          <button class="btn ${R.r[i] === 1 ? 'btn-grad' : 'btn-ghost'}" style="flex:0 0 auto;padding:10px 12px" data-ok="${i}">✔</button><button class="btn ${R.r[i] === 0 ? 'btn-danger' : 'btn-ghost'}" style="flex:0 0 auto;padding:10px 12px" data-ko="${i}">✗</button></div>`).join('')}
        <div class="${ok(R) ? 'win' : 'card'}" style="margin-top:12px;text-align:center">${ok(R) ? '🏅 Savoir-nager validé' : `${R.r.filter(v => v === 1).length}/${ASNS.length} épreuves validées`}</div>
        <div class="row" style="margin-top:10px"><button class="btn btn-ghost" id="pv">← Élève précédent</button><button class="btn btn-grad" id="nx">Élève suivant →</button></div></div>` : ''}
      <div class="section-title"><h2>Bilan de la classe · ${nb}/${st.length} validés</h2><button class="link" id="exp">Exporter CSV</button></div>
      <div class="card sheet-table"><table><tr><th>Élève</th>${ASNS.map((l, i) => `<th title="${esc(l)}">${i + 1}</th>`).join('')}<th>Validé</th></tr>
        ${st.map((x, k) => { const r = DB.asns[cls]?.[x]; return `<tr data-row="${k}" style="cursor:pointer"><td><b>${esc(x)}</b></td>${ASNS.map((_, i) => { const v = r ? r.r[i] : null; return `<td>${v === 1 ? '<b style="color:#1B9E5A">✔</b>' : v === 0 ? '<b style="color:var(--danger)">✗</b>' : '<span class="muted">·</span>'}</td>`; }).join('')}<td>${r && ok(r) ? '🏅' : ''}</td></tr>`; }).join('')}</table>
        <p class="muted" style="font-size:.75rem;margin:6px 0 0">${ASNS.map((l, i) => `${i + 1}. ${l}`).join(' · ')}</p></div>`;
    const $ = s => el.querySelector(s);
    $('#sc').onchange = e => { cls = e.target.value; DB.lastClass = cls; si = 0; save(); draw(); };
    $('#se').onchange = e => { si = +e.target.value; draw(); };
    const set = (i, v) => { const was = ok(R); R.r[i] = R.r[i] === v ? null : v; R.d = Date.now();
      if (!was && ok(R)) { saveResult({ tool: 'natation', label: 'Savoir-nager', classe: cls, eleve: n, valeur: 'Savoir-nager validé', detail: 'Toutes les épreuves du test' }); toast(`🏅 ${n} : savoir-nager validé`); } else save(); draw(); };
    el.querySelectorAll('[data-ok]').forEach(b => b.onclick = () => set(+b.dataset.ok, 1));
    el.querySelectorAll('[data-ko]').forEach(b => b.onclick = () => set(+b.dataset.ko, 0));
    if ($('#pv')) $('#pv').onclick = () => { si = Math.max(0, si - 1); draw(); };
    if ($('#nx')) $('#nx').onclick = () => { si = Math.min(st.length - 1, si + 1); draw(); };
    el.querySelectorAll('[data-row]').forEach(r => r.onclick = () => { si = +r.dataset.row; draw(); el.scrollIntoView({ behavior: 'smooth' }); });
    $('#exp').onclick = () => download(`savoir-nager-${cls}.csv`, csv([['Élève', ...ASNS, 'Savoir-nager validé'],
      ...st.map(x => { const r = DB.asns[cls]?.[x]; return [x, ...ASNS.map((_, i) => r ? (r.r[i] === 1 ? 'oui' : r.r[i] === 0 ? 'non' : '') : ''), r && ok(r) ? 'oui' : 'non']; })]));
  };
  draw();
}

TOOL_IMPL.natation = function (el) {
  let mode = DB.natMode || 'vite', stop = null;
  const frame = () => {
    if (stop) { try { stop(); } catch (e) {} stop = null; }
    el.innerHTML = `<div class="co-tabs">${[['vite', '⏱ Nager vite'], ['savoir', '🏅 Savoir nager']].map(([k, l]) => `<button data-nm="${k}" class="${mode === k ? 'on' : ''}">${l}</button>`).join('')}</div><div id="nat-b"></div>`;
    el.querySelectorAll('[data-nm]').forEach(b => b.onclick = () => { mode = DB.natMode = b.dataset.nm; save(); frame(); });
    const box = el.querySelector('#nat-b');
    stop = mode === 'vite' ? natationVite(box) : natationSavoir(box);
  };
  frame();
  return () => { if (stop) stop(); };
};

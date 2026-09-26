/* =========================================================
   EPS ONE — Outil « Test VMA »
   Luc Léger (navette 20 m) · VAMEVAL · 45-15 (Gacon) · Astrand (3 min)
   ========================================================= */
ICONS.testvma = '<path d="M3.5 17a8.5 8.5 0 1 1 17 0"/><path d="M12 17l3.5-6"/><circle cx="12" cy="17" r="1.3"/><path d="M18.5 3.5c1 .8 1.5 1.8 1.5 3M20.5 1.8c1.5 1.2 2.2 2.8 2.2 4.7"/>';

document.head.insertAdjacentHTML('beforeend', `<style>
.tv-big{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
.tv-big .card{text-align:center;padding:12px 8px}
.tv-big b{display:block;font-size:clamp(2rem,10vw,3.4rem);font-weight:900;line-height:1.05;font-variant-numeric:tabular-nums}
.tv-big small{color:var(--muted);font-weight:700}
.tv-info{display:flex;justify-content:space-around;gap:8px;margin-top:10px;text-align:center;font-variant-numeric:tabular-nums}
.tv-info div{flex:1}.tv-info b{display:block;font-size:1.25rem}.tv-info small{color:var(--muted);font-size:.75rem}
.tv-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--line)}
.tv-row:last-child{border-bottom:none}
.tv-row .nm{flex:1;font-weight:700}
.tv-row .res{font-size:.85rem;color:var(--muted);text-align:right}
.tv-row .res b{color:var(--text);font-size:1rem}
.tv-row input{width:96px;padding:8px;text-align:center}
.tv-row.done{background:var(--grad-soft)}
</style>`);

TOOL_IMPL.testvma = function (el) {
  const P = {
    leger:   { name: 'Luc Léger', type: 'palier', v0: 8.5, inc: 0.5, dist: 20,
               desc: 'Navette : allers-retours entre deux lignes espacées de <b>20 m</b>. À chaque bip, l\'élève doit atteindre la ligne opposée. Paliers de 1 min, +0,5 km/h par palier.' },
    vameval: { name: 'VAMEVAL', type: 'palier', v0: 8, inc: 0.5, dist: 20,
               desc: 'Sur piste, un plot tous les <b>20 m</b>. À chaque bip, l\'élève doit être au plot suivant. Paliers de 1 min, +0,5 km/h par palier.' },
    g4515:   { name: '45-15', type: '4515', v0: 8, inc: 0.5,
               desc: '<b>45 s de course / 15 s de récupération</b>. Plot de départ, puis un plot à <b>100 m</b> (8 km/h) et un plot tous les <b>6,25 m</b> au-delà : +0,5 km/h à chaque palier. L\'élève revient au départ pendant les 15 s.' },
    astrand: { name: 'Astrand (3 min)', type: 'duree', dur: 180, coef: 17.143,
               desc: 'Courir la <b>plus grande distance en 3 minutes</b>. VMA (km/h) = distance (m) × coefficient ÷ 1000.' },
  };
  let key = 'vameval', run = false, E = 0, t0 = 0, iv = null, pre = null;
  let nextBip = 0, bips = 0, stageSeen = 0, phase = '', lastMark = -1;
  let students = [];
  const voice = t => { if (!el.querySelector('#vx')?.checked || !window.speechSynthesis) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'fr-FR'; u.rate = 1.05; speechSynthesis.speak(u); } catch (e) {} };
  const kmh = v => v.toFixed(1).replace('.', ',');
  const cfg = () => { const p = P[key]; return { ...p, v0: +(el.querySelector('#v0')?.value || p.v0), inc: +(el.querySelector('#inc')?.value || p.inc), coef: +(el.querySelector('#cf')?.value || p.coef) }; };
  const speedAt = (stage, c) => c.v0 + stage * c.inc;
  const elapsed = () => E + (run ? performance.now() - t0 : 0);

  function layout() {
    const p = P[key], c = p;
    el.innerHTML = `<div class="chips" style="padding-top:0">${Object.entries(P).map(([k, x]) => `<button class="chip ${k === key ? 'active' : ''}" data-k="${k}">${x.name}</button>`).join('')}</div>
      <div class="card" style="margin-top:6px"><p style="margin:0 0 6px;font-size:.92rem;line-height:1.45">${p.desc}</p>
        <div class="row">${p.type === 'duree'
          ? `<div><label>Coefficient</label><input id="cf" type="number" step="0.001" value="${c.coef}"></div>`
          : `<div><label>Vitesse de départ (km/h)</label><input id="v0" type="number" step="0.5" value="${c.v0}"></div><div><label>+ par palier (km/h)</label><input id="inc" type="number" step="0.5" value="${c.inc}"></div>`}</div>
        <label style="display:flex;gap:8px;align-items:center;margin-top:12px"><input type="checkbox" id="vx" checked style="width:auto"> Annonces vocales (palier, vitesse, temps)</label></div>
      <div class="card" style="margin-top:12px">
        <div class="phase ph-prep" id="ph">Prêt</div>
        <div class="tv-big">${p.type === 'duree'
          ? `<div class="card" style="grid-column:1/-1"><small>Temps restant</small><b id="bT">03:00</b></div>`
          : `<div class="card"><small>Palier</small><b id="bP">1</b></div><div class="card"><small>Vitesse</small><b id="bV">${kmh(c.v0)}</b><small>km/h</small></div>`}</div>
        <div class="tv-info" id="info"></div>
        <div class="row" style="margin-top:12px"><button class="btn btn-grad" id="go">▶ Démarrer</button><button class="btn btn-ghost" id="st">⏹ Arrêter</button></div>
      </div>
      <div class="section-title"><h2>Élèves</h2><button class="link" id="exp">Exporter CSV</button></div>
      <div class="card">${DB.classes.length ? `<div class="row"><select id="cls"><option value="">Charger une classe…</option>${DB.classes.map((x, i) => `<option value="${i}">${esc(x.name)}</option>`).join('')}</select></div>` : ''}
        <div class="row" style="margin-top:8px"><input id="nn" placeholder="Ajouter un élève"><button class="btn btn-ghost" style="flex:0 0 auto" id="add">＋</button></div>
        <p class="muted" style="margin:8px 0 0">${p.type === 'duree' ? 'Saisissez la distance parcourue par chaque élève à la fin des 3 minutes.' : 'Touchez « Arrêt » quand un élève abandonne ou prend trop de retard : son palier et sa VMA sont notés.'}</p></div>
      <div class="card" style="padding:0;margin-top:10px" id="ls"></div>`;
    const $ = s => el.querySelector(s);
    el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { if (run || E) { if (!confirm('Changer de test ? Le test en cours sera arrêté.')) return; } stop(true); key = b.dataset.k; students.forEach(s => s.res = null); layout(); });
    $('#go').onclick = toggle; $('#st').onclick = () => { if (!E && !run) return; if (confirm('Arrêter le test ?')) stop(false); };
    if ($('#cls')) $('#cls').onchange = () => { const i = $('#cls').value; if (i === '') return; students = DB.classes[i].students.map(n => ({ name: n, res: null })); drawList(); $('#cls').value = ''; };
    $('#add').onclick = () => { const n = $('#nn').value.trim(); if (!n) return; students.push({ name: n, res: null }); $('#nn').value = ''; drawList(); };
    $('#exp').onclick = exportCsv;
    ['#v0', '#inc'].forEach(s => { if ($(s)) $(s).oninput = () => { if (!E) $('#bV').textContent = kmh(cfg().v0); }; });
    drawList(); paint();
  }

  function drawList() {
    const p = P[key], box = el.querySelector('#ls');
    box.innerHTML = students.length ? students.map((s, i) => {
      if (p.type === 'duree') return `<div class="tv-row ${s.res ? 'done' : ''}"><span class="nm">${esc(s.name)}</span><input type="number" data-d="${i}" placeholder="mètres" value="${s.res ? s.res.dist : ''}"><span class="res" style="min-width:74px">${s.res ? `<b>${kmh(s.res.vma)}</b> km/h` : '—'}</span></div>`;
      return `<div class="tv-row ${s.res ? 'done' : ''}"><span class="nm">${esc(s.name)}</span>${s.res
        ? `<span class="res">Palier ${s.res.palier}${s.res.dist ? ` · ${s.res.dist} m` : ''}<br><b>VMA ${s.res.vma ? kmh(s.res.vma) + ' km/h' : '< départ'}</b></span><button class="btn btn-ghost" data-u="${i}">↺</button>`
        : `<button class="btn btn-grad" data-s="${i}" ${run ? '' : 'disabled'}>⏹ Arrêt</button>`}</div>`;
    }).join('') : '<div class="empty">Aucun élève. Chargez une classe ou ajoutez des noms.</div>';
    box.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { students[b.dataset.s].res = snapshot(); beep(900, .08); drawList(); });
    box.querySelectorAll('[data-u]').forEach(b => b.onclick = () => { students[b.dataset.u].res = null; drawList(); });
    box.querySelectorAll('[data-d]').forEach(inp => inp.oninput = () => { const d = +inp.value, s = students[inp.dataset.d]; s.res = d > 0 ? { dist: d, vma: d * cfg().coef / 1000 } : null;
      const r = inp.nextElementSibling; r.innerHTML = s.res ? `<b>${kmh(s.res.vma)}</b> km/h` : '—'; inp.parentElement.classList.toggle('done', !!s.res); });
  }

  /* Résultat d'un élève au moment de l'arrêt : VMA = vitesse du dernier palier terminé */
  function snapshot() {
    const c = cfg(), stage = Math.floor(elapsed() / 60000);
    const done = stage; // nombre de paliers terminés
    const vma = done >= 1 ? speedAt(done - 1, c) : 0;
    const dist = key === 'vameval' || key === 'leger' ? bips * c.dist : key === 'g4515' ? Math.round(Array.from({ length: done }, (_, k) => 12.5 * speedAt(k, c)).reduce((a, b) => a + b, 0)) : 0;
    return { palier: stage + 1, vma, dist };
  }

  function toggle() {
    if (run) { E = elapsed(); run = false; clearInterval(iv); el.querySelector('#go').textContent = '▶ Reprendre'; speechSynthesis?.cancel(); drawList(); return; }
    if (pre) return;
    if (E > 0) { t0 = performance.now(); run = true; iv = setInterval(tick, 25); el.querySelector('#go').textContent = '⏸ Pause'; drawList(); return; }
    // Compte à rebours 3-2-1
    let n = 3; const ph = el.querySelector('#ph'); ph.className = 'phase ph-prep';
    const step = () => { if (n > 0) { ph.textContent = 'Départ dans ' + n; beep(660, .12); n--; pre = setTimeout(step, 1000); }
      else { pre = null; begin(); } };
    voice('Attention… départ dans 3 secondes'); step();
  }
  function begin() {
    const c = cfg(); E = 0; bips = 0; stageSeen = 0; lastMark = -1; phase = '';
    nextBip = c.type === 'palier' ? c.dist * 3600 / c.v0 : 0;
    t0 = performance.now(); run = true; beep(1300, .45);
    if (c.type === 'palier') voice(`Palier 1, ${kmh(c.v0)} kilomètres heure`);
    else if (c.type === '4515') voice('Partez');
    else voice('Partez, 3 minutes');
    iv = setInterval(tick, 25); el.querySelector('#go').textContent = '⏸ Pause'; drawList();
  }
  function stop(silent) {
    clearTimeout(pre); pre = null; clearInterval(iv); iv = null; run = false; E = 0; bips = 0;
    try { speechSynthesis.cancel(); } catch (e) {}
    if (!silent) { beep(500, .6); const ph = el.querySelector('#ph'); ph.className = 'phase ph-end'; ph.textContent = 'Test terminé'; el.querySelector('#go').textContent = '▶ Démarrer'; drawList(); }
  }

  function tick() {
    const c = cfg(), e = elapsed();
    if (c.type === 'palier') {
      const stage = Math.floor(e / 60000);
      if (stage > stageSeen) { stageSeen = stage; beep(1000, .12); setTimeout(() => beep(1000, .12), 180); setTimeout(() => beep(1300, .25), 360);
        voice(`Palier ${stage + 1}, ${kmh(speedAt(stage, c))} kilomètres heure`); }
      while (e >= nextBip) { bips++; beep(1150, .12); const st = Math.floor(nextBip / 60000); nextBip += c.dist * 3600 / speedAt(st, c); }
    } else if (c.type === '4515') {
      const stage = Math.floor(e / 60000), inCycle = e % 60000;
      const ph = inCycle < 45000 ? 'run' : 'rest';
      const mark = Math.floor(e / 500); // repères sonores
      if (mark !== lastMark) {
        lastMark = mark; const s = inCycle / 1000;
        if (stage > 0 && s < 0.5) { beep(1300, .45); voice(`Palier ${stage + 1}, partez`); }
        if (Math.abs(s - 22.5) < 0.25) beep(900, .08);                       // mi-parcours
        if (Math.abs(s - 45) < 0.25) { beep(700, .15); setTimeout(() => beep(700, .3), 200); voice('Stop, récupération'); }
        if ([57, 58, 59].some(x => Math.abs(s - x) < 0.25)) beep(660, .1);  // 3-2-1 avant départ
      }
      phase = ph;
    } else {
      const left = c.dur * 1000 - e, s = Math.ceil(left / 1000), mark = Math.floor(e / 500);
      if (mark !== lastMark) { lastMark = mark;
        if (s === 120 && left % 1000 > 500) voice('Encore 2 minutes');
        if (s === 60 && left % 1000 > 500) voice('Dernière minute');
        if (s === 30 && left % 1000 > 500) voice('30 secondes');
        if (s <= 5 && s > 0 && left % 1000 > 500) beep(660, .1); }
      if (left <= 0) { stop(true); beep(1300, .8); const ph = el.querySelector('#ph'); ph.className = 'phase ph-end'; ph.textContent = 'Fin — notez les distances'; voice('Stop ! Notez votre distance'); el.querySelector('#go').textContent = '▶ Démarrer'; paint(180000); return; }
    }
    paint();
  }

  function paint(force) {
    const c = cfg(), e = force ?? elapsed(), $ = s => el.querySelector(s); if (!$('#ph')) return;
    if (c.type === 'duree') {
      $('#bT').textContent = fmt(Math.max(0, c.dur * 1000 - e) + (run ? 999 : 0), false);
      if (run) { $('#ph').className = 'phase ph-work'; $('#ph').textContent = 'Course'; }
      $('#info').innerHTML = `<div><b>${fmt(e, false)}</b><small>temps écoulé</small></div>`;
      return;
    }
    const stage = Math.floor(e / 60000), v = speedAt(stage, c), inStage = e % 60000;
    $('#bP').textContent = stage + 1; $('#bV').textContent = kmh(v);
    if (c.type === 'palier') {
      if (run) { $('#ph').className = 'phase ph-work'; $('#ph').textContent = `Palier ${stage + 1}`; }
      const toBip = Math.max(0, nextBip - e) / 1000;
      $('#info').innerHTML = `<div><b>${fmt(e, false)}</b><small>temps total</small></div><div><b>${Math.ceil((60000 - inStage) / 1000)} s</b><small>fin du palier</small></div>
        <div><b>${bips}</b><small>${key === 'leger' ? 'longueurs' : 'plots'} (${bips * c.dist} m)</small></div><div><b>${(c.dist * 3.6 / v).toFixed(1).replace('.', ',')} s</b><small>entre 2 bips</small></div>`;
    } else {
      const d = 12.5 * v, plot = stage; const run45 = inCycle45(e);
      if (run || E) { $('#ph').className = 'phase ' + (run45 ? 'ph-work' : 'ph-rest'); $('#ph').textContent = run45 ? `Course — ${Math.ceil((45000 - inStage) / 1000)} s` : `Récupération — ${Math.ceil((60000 - inStage) / 1000)} s`; }
      $('#info').innerHTML = `<div><b>${d.toFixed(2).replace('.', ',')} m</b><small>distance à atteindre</small></div><div><b>${plot === 0 ? '100 m' : 'plot ' + plot}</b><small>${plot === 0 ? 'premier plot' : 'après le plot 100 m'}</small></div><div><b>${fmt(e, false)}</b><small>temps total</small></div>`;
    }
  }
  const inCycle45 = e => e % 60000 < 45000;

  function exportCsv() {
    const p = P[key]; if (!students.some(s => s.res)) return toast('Aucun résultat à exporter');
    download(`test-vma-${p.name.replace(/[^\w]+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`,
      csv([['Élève', 'Test', 'Palier atteint', 'Distance (m)', 'VMA (km/h)'], ...students.map(s => [s.name, p.name, s.res?.palier ?? '', s.res?.dist ?? '', s.res ? kmh(s.res.vma) : ''])]));
  }

  layout();
  return () => { clearInterval(iv); clearTimeout(pre); try { speechSynthesis.cancel(); } catch (e) {} };
};

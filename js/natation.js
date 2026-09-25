/* =========================================================
   EPS Tout en 1 — Outil « Natation »
   Distance nagée · temps de nage · nombre de coups de bras
   ========================================================= */
DB.natation = DB.natation || [];
ICONS.natation = '<path d="M2 17c2 0 2-1.5 4-1.5S8 17 10 17s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M2 21c2 0 2-1.5 4-1.5S8 21 10 21s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5"/><circle cx="16" cy="6" r="2"/><path d="M4 12.5 9 8l3 3 3-2"/>';

TOOL_IMPL.natation = function (el) {
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
        <div class="card"><b>${n2(x.amp)}</b><small>m par coup de bras</small></div><div class="card"><b>${x.freq ? Math.round(x.freq) : '–'}</b><small>coups de bras / min</small></div>`; };
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
      $('#ls').innerHTML = rows.length ? `<table><tr><th>Élève</th><th>Date</th><th>Dist.</th><th>Temps</th><th>Coups</th><th>m/s</th><th>m/coup</th><th>coups/min</th><th></th></tr>
        ${rows.map(r => { const x = calc(r.d, r.t, r.c); return `<tr><td><b>${esc(r.eleve)}</b></td><td>${new Date(r.date).toLocaleDateString('fr-FR')}</td><td>${r.d} m</td><td>${fmt(r.t * 1000)}</td><td>${r.c || '–'}</td><td>${n2(x.v)}</td><td>${n2(x.amp)}</td><td>${x.freq ? Math.round(x.freq) : '–'}</td><td><button class="btn btn-ghost" style="padding:4px 8px" data-x="${r.i}">✕</button></td></tr>`; }).join('')}</table>`
        : '<div class="empty">Aucun résultat enregistré.</div>';
      $('#ls').querySelectorAll('[data-x]').forEach(b => b.onclick = () => { if (confirm('Supprimer ?')) { DB.natation.splice(+b.dataset.x, 1); save(); list(); } });
    };
    $('#fl').onchange = list;
    $('#exp').onclick = () => { if (!DB.natation.length) return toast('Rien à exporter');
      download(`natation-${new Date().toISOString().slice(0, 10)}.csv`, csv([['Élève', 'Classe', 'Date', 'Distance (m)', 'Temps', 'Coups de bras', 'Vitesse (m/s)', 'Temps au 100 m', 'Distance par coup de bras (m)', 'Coups de bras / min'],
        ...DB.natation.map(r => { const x = calc(r.d, r.t, r.c); return [r.eleve, r.classe, new Date(r.date).toLocaleDateString('fr-FR'), r.d, fmt(r.t * 1000), r.c, n2(x.v), fmt(x.t100 * 1000), n2(x.amp), x.freq ? Math.round(x.freq) : '']; })])); };
    res(); list();
  };
  draw();
  iv = setInterval(() => { const e = el.querySelector('#tm'); if (e && run) e.textContent = fmt(secOf() * 1000); }, 50);
  return () => clearInterval(iv);
};

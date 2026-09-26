/* =========================================================
   EPS ONE — Grilles d'évaluation (v2)
   · Grilles par points (note /20) ou par compétences (niveaux)
   · Niveaux personnalisables, descripteurs par critère
   · Import CSV / Excel (export iDoceo, tableur…) + modèles
   ========================================================= */
const GR_LV_DEF = ['Non acquis', 'Fragile', 'Acquis', 'Expert'];
const GR_COLORS = ['#D64545', '#E0892F', '#2F6BD8', '#1B9E5A', '#7A5CC9', '#0B2A5B'];
const grLevels = g => g.levels && g.levels.length >= 2 ? g.levels : GR_LV_DEF;
const grK = (g, i) => { const n = grLevels(g).length; return n > 1 ? i / (n - 1) : 1; };
const grType = g => g.type || 'points';

TOOL_IMPL.grilles = function (el) {
  const scoreOf = (g, ev) => { const tot = g.criteria.reduce((a, c) => a + (c.pts || 0), 0); let s = 0, n = 0;
    g.criteria.forEach((c, i) => { if (ev?.[i] != null) { s += (c.pts || 0) * grK(g, ev[i]); n++; } }); return { s, tot, n, sur20: tot ? s / tot * 20 : 0 }; };
  const lvBtnStyle = (g, x, on) => { const n = grLevels(g).length, col = GR_COLORS[Math.round(x / Math.max(1, n - 1) * 3)] || '#2F6BD8'; return on ? `background:${col};color:#fff;border-color:transparent` : ''; };

  /* ---------- Liste ---------- */
  const list = () => {
    el.innerHTML = `<div class="card"><h3>Mes grilles</h3><div id="gl"></div>
        <button class="btn btn-grad btn-block" style="margin-top:12px" id="new">＋ Nouvelle grille</button>
        <button class="btn btn-ghost btn-block" style="margin-top:8px" id="imp">📥 Importer une grille (CSV / Excel)</button><input type="file" id="f" accept=".csv,.txt,.xlsx,.xls,.numbers" hidden></div>
      <details class="card" style="margin-top:12px"><summary style="font-weight:800;cursor:pointer">Format des fichiers à importer</summary>
        <p style="font-size:.88rem;line-height:1.5;margin:8px 0">Une ligne par critère, la 1re ligne contient les titres :</p>
        <ul style="font-size:.85rem;line-height:1.5;padding-left:18px;margin:0">
          <li><b>Grille par points</b> : <code>Critère ; Points</code> — ex. « Performance ; 8 ».</li>
          <li><b>Grille par compétences</b> : <code>Critère ; Non atteint ; Partiellement atteint ; Atteint ; Dépassé</code> — les titres deviennent les niveaux, les cases les descripteurs.</li>
          <li>Colonne <code>Domaine</code> facultative. Les deux peuvent se combiner (points + descripteurs).</li>
          <li>Depuis <b>iDoceo</b> ou un tableur : exportez en <b>.xlsx</b> ou <b>.csv</b> puis importez ici.</li></ul>
        <div class="row" style="margin-top:10px"><button class="btn btn-ghost" id="m1">⬇ Modèle « points »</button><button class="btn btn-ghost" id="m2">⬇ Modèle « compétences »</button></div></details>`;
    el.querySelector('#gl').innerHTML = DB.grilles.map((g, i) => `<div class="list-item"><div style="flex:1"><b>${esc(g.name)}</b><div class="muted">${grType(g) === 'points' ? `Par points · ${g.criteria.length} critères · sur ${g.criteria.reduce((a, c) => a + (c.pts || 0), 0)} pts` : `Par compétences · ${g.criteria.length} critères · ${grLevels(g).length} niveaux`}</div></div>
      <button class="btn btn-grad" data-v="${i}">Évaluer</button><button class="btn btn-ghost" data-e="${i}">✏️</button></div>`).join('') || '<div class="empty">Aucune grille. Créez-en une ou importez-la !</div>';
    const $ = s => el.querySelector(s);
    $('#new').onclick = () => edit(null);
    $('#imp').onclick = () => $('#f').click();
    $('#f').onchange = async () => { const inp = $('#f'), file = inp.files[0]; if (!file) return; inp.value = '';
      try { const sheets = await readClassFile(file); if (!sheets.length) throw new Error('Aucune donnée trouvée.'); importScreen(sheets, file.name); } catch (e) { alert(e.message || 'Fichier illisible'); } };
    $('#m1').onclick = () => download('modele-grille-points.csv', csv([['Domaine', 'Critère', 'Points'], ['Performance', 'Temps réalisé sur 3×500 m', 8], ['Méthode', 'Respect du projet de course', 6], ['Analyse', 'Analyse de sa course', 4], ['Rôle social', 'Observateur fiable', 2]]));
    $('#m2').onclick = () => download('modele-grille-competences.csv', csv([['Domaine', 'Critère', 'Non atteint', 'Partiellement atteint', 'Atteint', 'Dépassé'],
      ['D1', 'Réaliser un enchaînement fluide', 'Arrêts fréquents', 'Quelques ruptures', 'Enchaînement continu', 'Continu et varié'],
      ['D2', 'Assurer sa sécurité', 'Prise de risque non maîtrisée', 'Sécurité par moments', 'Réceptions maîtrisées', 'Aide aussi les autres'],
      ['D3', 'Tenir le rôle de juge', 'Jugement absent', 'Jugement approximatif', 'Jugement juste', 'Jugement juste et argumenté']]));
    el.querySelectorAll('[data-e]').forEach(b => b.onclick = () => edit(+b.dataset.e));
    el.querySelectorAll('[data-v]').forEach(b => b.onclick = () => evaluate(+b.dataset.v));
  };

  /* ---------- Import ---------- */
  function importScreen(sheets, fileName) {
    const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    let si = 0, type = null;
    const analyse = rows => {
      const hi = Math.max(0, rows.slice(0, 10).findIndex(r => r.filter(c => String(c).trim()).length >= 2 && !r.slice(1).every(c => !isNaN(parseFloat(String(c).replace(',', '.'))) || !c)));
      const hdr = rows[hi] || [];
      const find = re => hdr.findIndex(h => re.test(norm(h)));
      let cCrit = find(/crit|competence|indicateur|item|element|objectif/), cDom = find(/domaine|famille|attendu|champ/), cPts = find(/point|bareme|pts|note|max/);
      const numericCol = k => rows.slice(hi + 1).filter(r => String(r[k] || '').trim()).every(r => !isNaN(parseFloat(String(r[k]).replace(',', '.'))));
      if (cCrit < 0) cCrit = hdr.findIndex((h, k) => k !== cDom && k !== cPts && String(h).trim());
      if (cPts < 0) { const k = hdr.findIndex((h, k) => k !== cCrit && k !== cDom && String(h).trim() && numericCol(k)); if (k >= 0 && hdr.length <= 3) cPts = k; }
      const lvCols = hdr.map((h, k) => k).filter(k => k !== cCrit && k !== cDom && k !== cPts && String(hdr[k] || '').trim());
      const start = cPts >= 0 && !isNaN(parseFloat(String(hdr[cPts]).replace(',', '.'))) ? hi : hi + 1;
      const crit = rows.slice(start).map(r => ({ label: String(r[cCrit] || '').trim(), domain: cDom >= 0 ? String(r[cDom] || '').trim() : '',
        pts: cPts >= 0 ? parseFloat(String(r[cPts] || '').replace(',', '.')) || 0 : 0, desc: lvCols.map(k => String(r[k] || '').trim()) })).filter(c => c.label);
      return { hdr, cPts, levels: lvCols.map(k => String(hdr[k]).trim()), crit };
    };
    const draw = () => {
      const A = analyse(sheets[si].rows), auto = A.cPts >= 0 ? 'points' : A.levels.length >= 2 ? 'competences' : 'points';
      const t = type || auto, levels = A.levels.length >= 2 ? A.levels : GR_LV_DEF;
      el.innerHTML = `<div class="card"><h3>📥 Importer « ${esc(fileName)} »</h3>
          ${sheets.length > 1 ? `<label>Feuille</label><select id="sh">${sheets.map((s, k) => `<option value="${k}" ${k === si ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>` : ''}
          <label>Nom de la grille</label><input id="nm" value="${esc(sheets.length > 1 ? sheets[si].name : fileName.replace(/\.[^.]+$/, ''))}">
          <label>Type de grille</label><div class="seg"><button data-t="points" class="${t === 'points' ? 'on' : ''}">Par points<br><small style="font-weight:600;opacity:.85">note /20</small></button><button data-t="competences" class="${t === 'competences' ? 'on' : ''}">Par compétences<br><small style="font-weight:600;opacity:.85">niveaux de maîtrise</small></button></div>
          <label>Niveaux</label><div class="muted" style="font-size:.88rem">${levels.map(esc).join(' → ')}${A.levels.length >= 2 ? '' : ' <i>(par défaut)</i>'}</div></div>
        <div class="section-title"><h2>Aperçu (${A.crit.length} critères)</h2></div>
        <div class="card sheet-table">${A.crit.length ? `<table><tr>${A.crit.some(c => c.domain) ? '<th>Domaine</th>' : ''}<th>Critère</th>${t === 'points' ? '<th>Points</th>' : ''}${A.levels.length >= 2 ? A.levels.map(l => `<th>${esc(l)}</th>`).join('') : ''}</tr>
          ${A.crit.map(c => `<tr>${A.crit.some(x => x.domain) ? `<td>${esc(c.domain)}</td>` : ''}<td><b>${esc(c.label)}</b></td>${t === 'points' ? `<td>${c.pts || '<span style="color:var(--danger)">?</span>'}</td>` : ''}${A.levels.length >= 2 ? c.desc.map(d => `<td class="muted" style="font-size:.78rem">${esc(d)}</td>`).join('') : ''}</tr>`).join('')}</table>`
          : '<div class="empty">Aucun critère reconnu. Vérifiez que la 1re ligne contient les titres (Critère, Points ou niveaux).</div>'}</div>
        ${t === 'points' && A.cPts < 0 ? '<p class="muted" style="margin:8px 2px">Pas de colonne « Points » trouvée : chaque critère vaudra 1 point (modifiable ensuite).</p>' : ''}
        <div class="row" style="margin-top:12px"><button class="btn btn-grad" id="ok" ${A.crit.length ? '' : 'disabled'}>✔ Importer la grille</button><button class="btn btn-ghost" id="ko">Annuler</button></div>`;
      const $ = s => el.querySelector(s);
      if ($('#sh')) $('#sh').onchange = () => { si = +$('#sh').value; type = null; draw(); };
      el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { type = b.dataset.t; draw(); });
      $('#ko').onclick = list;
      $('#ok').onclick = () => {
        const g = { name: $('#nm').value.trim() || 'Grille importée', type: t, levels, evals: {},
          criteria: A.crit.map(c => ({ label: c.domain ? `${c.domain} — ${c.label}` : c.label, pts: t === 'points' ? (c.pts || 1) : 0, desc: A.levels.length >= 2 ? c.desc : [] })) };
        DB.grilles.push(g); save(); toast(`Grille « ${g.name} » importée ✔`); list();
      };
    };
    draw();
  }

  /* ---------- Création / modification ---------- */
  const edit = i => {
    const g = i != null ? JSON.parse(JSON.stringify(DB.grilles[i])) : { name: 'Demi-fond — 3×500 m', type: 'points', levels: GR_LV_DEF.slice(), evals: {},
      criteria: [{ label: 'Performance / VMA', pts: 8 }, { label: 'Respect du projet de course', pts: 6 }, { label: 'Analyse de sa course', pts: 4 }, { label: 'Rôle d\'observateur', pts: 2 }] };
    const draw = () => {
      const t = grType(g);
      el.innerHTML = `<div class="card"><h3>${i != null ? 'Modifier' : 'Nouvelle'} grille</h3><label>Nom</label><input id="gn" value="${esc(g.name)}">
        <label>Type</label><div class="seg"><button data-t="points" class="${t === 'points' ? 'on' : ''}">Par points</button><button data-t="competences" class="${t === 'competences' ? 'on' : ''}">Par compétences</button></div>
        <label>Niveaux (un par ligne, du plus faible au plus élevé)</label><textarea id="gl" style="min-height:110px">${esc(grLevels(g).join('\n'))}</textarea>
        <label>Critères — un par ligne${t === 'points' ? ' : « Critère ; points »' : ''}</label><textarea id="gc" style="min-height:150px">${esc(g.criteria.map(c => t === 'points' ? c.label + ' ; ' + (c.pts || 1) : c.label).join('\n'))}</textarea>
        ${t === 'points' ? '<p class="muted">Chaque niveau rapporte une part des points du critère (ex. 4 niveaux : 0, ⅓, ⅔, 100 %).</p>' : '<p class="muted">Pas de note : chaque critère est positionné sur un niveau de maîtrise.</p>'}
        ${g.criteria.some(c => c.desc && c.desc.some(Boolean)) ? '<p class="muted">Les descripteurs importés sont conservés pour les critères dont le nom ne change pas.</p>' : ''}
        <div class="row"><button class="btn btn-grad" id="sv">💾 Enregistrer</button><button class="btn btn-ghost" id="bk">Annuler</button>${i != null ? '<button class="btn btn-danger" id="dl">Supprimer</button>' : ''}</div></div>`;
      const $ = s => el.querySelector(s);
      const read = () => {
        g.name = $('#gn').value.trim() || 'Grille';
        const lv = $('#gl').value.split('\n').map(x => x.trim()).filter(Boolean); g.levels = lv.length >= 2 ? lv : GR_LV_DEF.slice();
        const old = Object.fromEntries(g.criteria.map(c => [c.label, c]));
        g.criteria = $('#gc').value.split('\n').map(l => l.trim()).filter(Boolean).map(l => { const [a, b] = t === 'points' ? l.split(';') : [l];
          const label = a.trim(); return { label, pts: t === 'points' ? (+(b || '').replace(',', '.') || 1) : 0, desc: old[label]?.desc || [] }; });
      };
      el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { read(); g.type = b.dataset.t; draw(); });
      $('#bk').onclick = list;
      if (i != null) $('#dl').onclick = () => { if (confirm('Supprimer la grille et ses évaluations ?')) { DB.grilles.splice(i, 1); save(); list(); } };
      $('#sv').onclick = () => { read(); if (!g.criteria.length) return toast('Ajoutez au moins un critère');
        if (i != null) DB.grilles[i] = g; else DB.grilles.push(g); save(); toast('Grille enregistrée ✔'); list(); };
    };
    draw();
  };

  /* ---------- Évaluation ---------- */
  const evaluate = gi => {
    const g = DB.grilles[gi]; if (!DB.classes.length) { el.innerHTML = noClassMsg; return; }
    const L = grLevels(g), pts = grType(g) === 'points';
    let cls = DB.classes.some(c => c.name === DB.lastClass) ? DB.lastClass : DB.classes[0].name, si = 0;
    const lvTag = x => x == null ? '–' : `<span class="pill" style="${lvBtnStyle(g, x, true)}">${esc(L[x])}</span>`;
    const draw = () => {
      const st = studentsOf(cls); g.evals = g.evals || {}; g.evals[cls] = g.evals[cls] || {}; const E = g.evals[cls];
      const name = st[si], ev = E[name] || {}, sc = scoreOf(g, ev);
      el.innerHTML = `<div class="card"><div class="row" style="align-items:end"><div><label>Classe</label><select id="cl">${DB.classes.map(c => `<option ${c.name === cls ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div><button class="btn btn-ghost" style="flex:0 0 auto" id="bk">← Grilles</button></div>
        <div class="row" style="margin-top:12px;align-items:center"><button class="btn btn-ghost" style="flex:0 0 52px" id="pv">◀</button>
        <select id="se">${st.map((n, k) => `<option value="${k}" ${k === si ? 'selected' : ''}>${E[n] && Object.keys(E[n]).length === g.criteria.length ? '✔ ' : ''}${esc(n)}</option>`).join('')}</select>
        <button class="btn btn-ghost" style="flex:0 0 52px" id="nx">▶</button></div></div>
        <div class="card" style="margin-top:12px"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h3>${esc(name || '—')}</h3>${pts ? `<span class="pill ok" style="font-size:.95rem">${sc.sur20.toFixed(1).replace('.', ',')} / 20</span>` : `<span class="muted" style="font-size:.8rem">${Object.keys(ev).length}/${g.criteria.length} critères</span>`}</div>
        ${g.criteria.map((c, k) => `<div class="crit"><b>${esc(c.label)}</b>${pts ? ` <span class="muted">(${c.pts} pts)</span>` : ''}
          <div class="lvl" style="flex-wrap:wrap">${L.map((l, x) => `<button data-c="${k}" data-l="${x}" style="min-width:${L.length > 4 ? 70 : 0}px;${lvBtnStyle(g, x, ev[k] === x)}">${esc(l)}</button>`).join('')}</div>
          ${c.desc && c.desc.some(Boolean) ? (ev[k] != null && c.desc[ev[k]] ? `<div class="muted" style="font-size:.8rem;margin-top:4px">« ${esc(c.desc[ev[k]])} »</div>` : `<details><summary class="muted" style="font-size:.78rem;cursor:pointer">Descripteurs</summary><ul class="pk-crit">${c.desc.map((d, x) => d ? `<li><b>${esc(L[x] || '')}</b> : ${esc(d)}</li>` : '').join('')}</ul></details>`) : ''}</div>`).join('')}
        <button class="btn btn-grad btn-block" style="margin-top:10px" id="nx2">Élève suivant ▶</button></div>
        <div class="section-title"><h2>Bilan de la classe</h2><button class="link" id="exp">Exporter CSV</button></div>
        <div class="card sheet-table"><table><tr><th>Élève</th>${pts ? '<th>/20</th>' : ''}${g.criteria.map((c, k) => `<th title="${esc(c.label)}">C${k + 1}</th>`).join('')}</tr>
          ${st.map(n => { const e = E[n] || {}, s = scoreOf(g, e); return `<tr><td>${esc(n)}</td>${pts ? `<td><b>${s.n ? s.sur20.toFixed(1).replace('.', ',') : '–'}</b></td>` : ''}${g.criteria.map((c, k) => `<td>${e[k] != null ? `<span class="lv-dot" style="width:auto;padding:0 6px;border-radius:8px;${lvBtnStyle(g, e[k], true)}">${esc(L[e[k]].slice(0, 3))}</span>` : '–'}</td>`).join('')}</tr>`; }).join('')}</table>
          <p class="muted" style="font-size:.75rem;margin:6px 0 0">${g.criteria.map((c, k) => `C${k + 1} = ${esc(c.label)}`).join(' · ')}</p></div>`;
      const $ = s => el.querySelector(s);
      $('#cl').onchange = () => { cls = $('#cl').value; DB.lastClass = cls; si = 0; save(); draw(); };
      $('#bk').onclick = list; $('#se').onchange = () => { si = +$('#se').value; draw(); };
      $('#pv').onclick = () => { si = Math.max(0, si - 1); draw(); };
      $('#nx').onclick = $('#nx2').onclick = () => { si = Math.min(st.length - 1, si + 1); draw(); };
      el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { if (!name) return; E[name] = E[name] || {}; const k = +b.dataset.c, x = +b.dataset.l; if (E[name][k] === x) delete E[name][k]; else E[name][k] = x; save(); draw(); });
      $('#exp').onclick = () => download(`${g.name}-${cls}.csv`.replace(/[^\w.-]+/g, '-'), csv([['Élève', ...g.criteria.map(c => pts ? `${c.label} (/${c.pts})` : c.label), ...(pts ? ['Total', 'Note /20'] : [])],
        ...st.map(n => { const e = E[n] || {}, s = scoreOf(g, e);
          return [n, ...g.criteria.map((c, k) => e[k] == null ? '' : pts ? (c.pts * grK(g, e[k])).toFixed(2).replace('.', ',') + ' (' + L[e[k]] + ')' : L[e[k]]), ...(pts ? [s.s.toFixed(2).replace('.', ','), s.n ? s.sur20.toFixed(1).replace('.', ',') : ''] : [])]; })]));
    };
    draw();
  };
  list();
};

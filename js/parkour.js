/* =========================================================
   EPS Tout en 1 — Outil « Parkour »
   Niveau 1 (6e) : exercice · niveau 1-4 · famille · maîtrise
   Niveau 2 (4e) : idem + critère de fluidité
   ========================================================= */
DB.parkour = DB.parkour || { cycle: 1, evals: [], customEx: [] };
ICONS.parkour = '<circle cx="14.5" cy="4.5" r="2"/><path d="M13 7.5 9.5 11l3.5 2.5-2 5.5M9.5 11 6 12.5M13 13.5l4-1.5 2.5 2"/><path d="M2.5 21h19M4 21v-4h5v4"/>';
const PK_URL = 'https://pkarzacq24.glide.page/';
const PK_FAM = ['Sauter', 'Franchir', 'Tourner', 'Freerun'];
const PK_EX = {
  Sauter: ['Saut de précision', 'Saut en contrebas (réception)', 'Saut de bras', 'Saut de fente', 'Saut en longueur sans élan'],
  Franchir: ['Passement simple', 'Passement paresseux', 'Passement de vitesse', 'Saut de chat', 'Passement de voleur', 'Montée de mur'],
  Tourner: ['Roulade avant', 'Roulade de réception', 'Demi-tour sauté (180°)', 'Tour complet sauté (360°)', 'Passement avec demi-tour'],
  Freerun: ['Enchaînement libre', 'Course au mur (tic-tac)', 'Rotation au mur', 'Rondade', 'Enchaînement imposé'],
};
const PK_M = [['Insuffisant', '#D64545'], ['Fragile', '#E0892F'], ['Satisfaisant', '#2F6BD8'], ['Très satisfaisant', '#1B9E5A']];

document.head.insertAdjacentHTML('beforeend', `<style>
.pk-m{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px}
.pk-m button{padding:11px 6px;border-radius:12px;border:1.5px solid var(--line);background:var(--card);font-weight:800;font-size:.85rem}
.pk-m button.on{color:#fff;border-color:transparent}
.pk-tag{display:inline-block;padding:2px 8px;border-radius:99px;font-size:.72rem;font-weight:800;color:#fff}
</style>`);

TOOL_IMPL.parkour = function (el) {
  const D = DB.parkour;
  let cls = DB.classes[0]?.name || '', si = 0, fam = 'Sauter', ex = '', niv = 1, ratings = {};
  D.list = D.list || [];
  const rt = i => ratings[i] = ratings[i] || { niv: D.list[i].niv, m: null, flu: null };
  const exList = f => [...PK_EX[f], ...D.customEx.filter(c => c.fam === f).map(c => c.nom)];
  const tag = m => m == null ? '–' : `<span class="pk-tag" style="background:${PK_M[m][1]}">${PK_M[m][0]}</span>`;
  const draw = () => {
    const st = cls ? studentsOf(cls) : [], list = exList(fam); if (!list.includes(ex)) ex = list[0] || '';
    const mine = D.evals.map((e, i) => ({ ...e, i })).filter(e => e.classe === cls && e.eleve === st[si]).reverse();
    el.innerHTML = `<a class="btn btn-ghost btn-block" href="${PK_URL}" target="_blank" rel="noopener" style="text-decoration:none;margin-bottom:12px">↗ Ouvrir mon appli Parkour EPS – Arzacq</a>
      <div class="card"><label style="margin-top:0">Cycle</label><div class="seg" id="cy"><button data-c="1" class="${D.cycle === 1 ? 'on' : ''}">Niveau 1<br><small style="font-weight:600;opacity:.85">6e</small></button><button data-c="2" class="${D.cycle === 2 ? 'on' : ''}">Niveau 2<br><small style="font-weight:600;opacity:.85">4e · + fluidité</small></button></div>
        ${DB.classes.length ? `<div class="row"><div><label>Classe</label><select id="cl">${DB.classes.map(c => `<option ${c.name === cls ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div></div>
        <div class="row" style="margin-top:8px;align-items:center"><button class="btn btn-ghost" style="flex:0 0 52px" id="pv">◀</button><select id="se">${st.map((n, k) => `<option value="${k}" ${k === si ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select><button class="btn btn-ghost" style="flex:0 0 52px" id="nx">▶</button></div>` : noClassMsg}</div>
      ${DB.classes.length ? `<div class="card" style="margin-top:12px"><h3>Exercices de la séance (${D.list.length})</h3>
        <p class="muted" style="margin:4px 0 0">Ajoutez autant d'exercices que vous voulez : chaque élève est évalué sur toute la liste.</p>
        <label>Famille</label><div class="tog" id="fa">${PK_FAM.map(f => `<button data-f="${f}" class="${f === fam ? 'on' : ''}">${f}</button>`).join('')}</div>
        <label>Exercice</label><div class="row"><select id="ex">${list.map(x => `<option ${x === ex ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select><button class="btn btn-ghost" style="flex:0 0 auto" id="addx" title="Exercice non répertorié">✎</button></div>
        <label>Niveau de l'exercice</label><div class="seg" id="nv">${[1, 2, 3, 4].map(n => `<button data-n="${n}" class="${n === niv ? 'on' : ''}">Niveau ${n}</button>`).join('')}</div>
        <button class="btn btn-grad btn-block" style="margin-top:12px" id="addl">＋ Ajouter cet exercice à la liste</button></div>
      <div class="card" style="margin-top:12px"><h3>Évaluation de ${esc(st[si] || '')}</h3>
        ${D.list.length ? D.list.map((x, i) => { const r = rt(i); return `<div style="padding:10px 0;border-bottom:1px solid var(--line)">
          <div style="display:flex;align-items:center;gap:8px"><div style="flex:1"><b>${esc(x.ex)}</b> <span class="muted">· ${x.fam}</span></div><button class="btn btn-ghost" style="padding:4px 9px" data-rml="${i}" title="Retirer de la liste">✕</button></div>
          <div class="nv" style="margin-top:6px">${[1, 2, 3, 4].map(n => `<button data-rn="${i}|${n}" class="${r.niv === n ? 'on' : ''}">N${n}</button>`).join('')}</div>
          <div class="muted" style="font-size:.75rem;margin-top:6px">Maîtrise</div><div class="pk-m">${PK_M.map(([l, c], k) => `<button data-rm="${i}|${k}" class="${r.m === k ? 'on' : ''}" style="${r.m === k ? 'background:' + c : ''}">${l}</button>`).join('')}</div>
          ${D.cycle === 2 ? `<div class="muted" style="font-size:.75rem;margin-top:6px">Fluidité</div><div class="pk-m">${PK_M.map(([l, c], k) => `<button data-rf="${i}|${k}" class="${r.flu === k ? 'on' : ''}" style="${r.flu === k ? 'background:' + c : ''}">${l}</button>`).join('')}</div>` : ''}</div>`; }).join('')
          : '<div class="empty">Ajoutez d\'abord un ou plusieurs exercices à la liste.</div>'}
        <button class="btn btn-grad btn-block" style="margin-top:14px" id="sv" ${D.list.length ? '' : 'disabled'}>💾 Enregistrer et passer à l'élève suivant</button></div>
      <div class="section-title"><h2>${esc(st[si] || '')}</h2></div>
      <div class="card" style="padding:0">${mine.length ? mine.map(e => `<div class="list-item"><div style="flex:1"><b>${esc(e.ex)}</b> <span class="muted">· ${e.fam} · niv. ${e.niv}</span><div style="margin-top:4px">${tag(e.m)}${e.cycle === 2 ? ` <span class="muted" style="font-size:.75rem">fluidité</span> ${tag(e.flu)}` : ''} <span class="muted" style="font-size:.75rem">${new Date(e.date).toLocaleDateString('fr-FR')}</span></div></div><button class="btn btn-ghost" data-x="${e.i}">✕</button></div>`).join('') : '<div class="empty">Aucune évaluation pour cet élève.</div>'}</div>
      <div class="section-title"><h2>Bilan de la classe</h2><button class="link" id="exp">Exporter CSV</button></div>
      <div class="card sheet-table"><table><tr><th>Élève</th>${PK_FAM.map(f => `<th>${f}</th>`).join('')}</tr>
        ${st.map(n => `<tr><td><b>${esc(n)}</b></td>${PK_FAM.map(f => { const b = D.evals.filter(e => e.classe === cls && e.eleve === n && e.fam === f && e.m >= 2).sort((a, c) => c.niv - a.niv || c.m - a.m)[0];
          return `<td>${b ? `niv. ${b.niv}<br><span class="muted" style="font-size:.72rem">${esc(b.ex)}</span>` : '–'}</td>`; }).join('')}</tr>`).join('')}</table>
        <p class="muted" style="font-size:.75rem;margin:6px 0 0">Plus haut niveau d'exercice validé (maîtrise satisfaisante ou très satisfaisante) par famille.</p></div>` : ''}`;
    const $ = s => el.querySelector(s), all = s => el.querySelectorAll(s);
    all('[data-c]').forEach(b => b.onclick = () => { D.cycle = +b.dataset.c; save(); draw(); });
    if (!DB.classes.length) return;
    $('#cl').onchange = () => { cls = $('#cl').value; si = 0; draw(); };
    $('#se').onchange = () => { si = +$('#se').value; ratings = {}; draw(); };
    $('#pv').onclick = () => { si = Math.max(0, si - 1); ratings = {}; draw(); };
    $('#nx').onclick = () => { si = Math.min(st.length - 1, si + 1); ratings = {}; draw(); };
    all('[data-f]').forEach(b => b.onclick = () => { fam = b.dataset.f; ex = ''; draw(); });
    $('#ex').onchange = () => { ex = $('#ex').value; };
    $('#addx').onclick = () => { const n = (prompt(`Nouvel exercice (famille ${fam}) :`) || '').trim(); if (!n) return; if (!exList(fam).includes(n)) { D.customEx.push({ fam, nom: n }); save(); } ex = n; draw(); };
    all('[data-n]').forEach(b => b.onclick = () => { niv = +b.dataset.n; draw(); });
    $('#addl').onclick = () => { const x = $('#ex').value; if (!x) return; D.list.push({ fam, ex: x, niv }); save(); toast('Exercice ajouté ✔'); draw(); };
    all('[data-rml]').forEach(b => b.onclick = () => { const i = +b.dataset.rml; D.list.splice(i, 1); const nr = {}; Object.keys(ratings).forEach(k => { k = +k; if (k < i) nr[k] = ratings[k]; else if (k > i) nr[k - 1] = ratings[k]; }); ratings = nr; save(); draw(); });
    all('[data-rn]').forEach(b => b.onclick = () => { const [i, n] = b.dataset.rn.split('|').map(Number); rt(i).niv = n; draw(); });
    all('[data-rm]').forEach(b => b.onclick = () => { const [i, k] = b.dataset.rm.split('|').map(Number); const r = rt(i); r.m = r.m === k ? null : k; draw(); });
    all('[data-rf]').forEach(b => b.onclick = () => { const [i, k] = b.dataset.rf.split('|').map(Number); const r = rt(i); r.flu = r.flu === k ? null : k; draw(); });
    $('#sv').onclick = () => {
      if (!st[si]) return toast('Classe vide');
      const done = D.list.map((x, i) => ({ x, r: rt(i) })).filter(o => o.r.m != null);
      if (!done.length) return toast('Évaluez au moins un exercice');
      if (D.cycle === 2 && done.some(o => o.r.flu == null)) return toast('Indiquez aussi la fluidité');
      done.forEach(({ x, r }) => D.evals.push({ date: Date.now(), classe: cls, eleve: st[si], cycle: D.cycle, fam: x.fam, ex: x.ex, niv: r.niv, m: r.m, flu: D.cycle === 2 ? r.flu : null }));
      save(); toast(`${st[si]} : ${done.length} exercice(s) ✔`); ratings = {}; if (si < st.length - 1) si++; draw();
    };
    all('[data-x]').forEach(b => b.onclick = () => { if (confirm('Supprimer cette évaluation ?')) { D.evals.splice(+b.dataset.x, 1); save(); draw(); } });
    $('#exp').onclick = () => { const rows = D.evals.filter(e => e.classe === cls); if (!rows.length) return toast('Rien à exporter');
      download(`parkour-${cls}.csv`, csv([['Élève', 'Date', 'Cycle', 'Famille', 'Exercice', 'Niveau exercice', 'Maîtrise', 'Fluidité'],
        ...rows.map(e => [e.eleve, new Date(e.date).toLocaleDateString('fr-FR'), e.cycle === 2 ? 'Niveau 2 (4e)' : 'Niveau 1 (6e)', e.fam, e.ex, e.niv, PK_M[e.m][0], e.flu != null ? PK_M[e.flu][0] : ''])])); };
  };
  draw();
};

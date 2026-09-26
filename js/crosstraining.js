/* =========================================================
   EPS ONE — Outil « Crosstraining / HYROX »
   Épreuves (blocs, séries, familles, exercices N1-N4, run) ·
   Séance (groupes duo/trio/quatuor, time cap, temps réalisé, écart) ·
   Résultats
   ========================================================= */
DB.wod = DB.wod || { epreuves: [], seances: [], current: null };
ICONS.wod = '<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/><path d="M12 3.5l1.2 2.4 2.6.4-1.9 1.8.5 2.6L12 9.5l-2.4 1.2.5-2.6-1.9-1.8 2.6-.4z" stroke-width="1.4"/>';

const WOD_FAM = ['Bas du corps — Explosivité', 'Haut du corps — Force', 'Cardio — Global', 'Résistance — Abdominaux / gainage'];
const WOD_EX = ['Air squats', 'Fentes (lunges)', 'Box step', 'Box jump', 'Pompes adaptées', 'Pompes', 'Dips adaptés', 'Dips', 'Jumping jacks',
  'Corde à sauter', 'Squats', 'Squats sautés', 'Burpees', 'Mountain climbers', 'Gainage planche', 'Gainage latéral', 'Levés de jambes axiaux', 'Levés de jambes latéraux'];
const RUN_T = { tours: 'tours', m: 'mètres', ar: 'allers-retours' };
const wid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const mmss = s => { if (s == null || isNaN(s)) return '–'; const neg = s < 0; s = Math.abs(Math.round(s)); return (neg ? '−' : '') + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

document.head.insertAdjacentHTML('beforeend', `<style>
.blk{border:1.5px solid var(--line);border-radius:16px;padding:12px;margin-top:10px;background:var(--card)}
.blk-h{display:flex;align-items:center;gap:8px}
.blk-h b{flex:1}
.ex-row{display:flex;align-items:center;gap:6px;padding:7px 0;border-bottom:1px solid var(--line);flex-wrap:wrap}
.ex-row:last-child{border-bottom:none}
.ex-row .nm{flex:1 1 130px;font-weight:700;font-size:.9rem}
.ex-row input{width:62px;padding:7px;text-align:center}
.nv{display:flex;gap:3px}
.nv button{padding:6px 7px;border-radius:8px;border:1.5px solid var(--line);background:var(--card);font-weight:800;font-size:.72rem}
.nv button.on{background:var(--grad);color:#fff;border-color:transparent}
.splits{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.splits button{padding:8px 10px;border-radius:10px;border:1.5px solid var(--line);background:var(--card);font-weight:800;font-size:.8rem}
.splits button.on{background:#1B9E5A;color:#fff;border-color:transparent}
</style>`);

TOOL_IMPL.wod = function (el) {
  let tab = DB.wod.current ? 'seance' : 'epreuves';
  const E = id => DB.wod.epreuves.find(e => e.id === id);
  function frame() {
    el.innerHTML = `<div class="co-tabs">${[['epreuves', '🏋️ Épreuves'], ['seance', '⏱ Séance'], ['resultats', '📊 Résultats']].map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div><div id="w-body"></div>`;
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; frame(); });
    ({ epreuves: listEp, seance, resultats })[tab](el.querySelector('#w-body'));
  }
  const summaryOf = e => `${e.sport === 'hyrox' ? 'HYROX' : 'Crosstraining'} · ${e.blocs.length} bloc${e.blocs.length > 1 ? 's' : ''} · ${e.prevu} min prévues · cap ${e.cap} min`;

  /* ================= 1. ÉPREUVES ================= */
  function listEp(box) {
    box.innerHTML = `<div class="card" style="padding:0">${DB.wod.epreuves.length ? DB.wod.epreuves.map((e, i) => `<div class="list-item"><div style="flex:1"><b>${esc(e.nom)}</b><div class="muted">${summaryOf(e)}</div></div>
      <button class="btn btn-ghost" data-e="${i}">✏️</button><button class="btn btn-ghost" data-c="${i}" title="Dupliquer">⧉</button></div>`).join('') : '<div class="empty">Aucune épreuve. Créez la première !</div>'}</div>
      <button class="btn btn-grad btn-block" style="margin-top:12px" id="new">＋ Créer une épreuve</button>`;
    box.querySelector('#new').onclick = () => editEp(box, null);
    box.querySelectorAll('[data-e]').forEach(b => b.onclick = () => editEp(box, +b.dataset.e));
    box.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { const c = JSON.parse(JSON.stringify(DB.wod.epreuves[+b.dataset.c])); c.id = wid(); c.nom += ' (copie)'; DB.wod.epreuves.push(c); save(); listEp(box); });
  }
  const newBloc = (sport, i) => ({ famille: i % 4, series: sport === 'hyrox' ? 1 : 3, ex: [{ nom: WOD_EX[[0, 5, 12, 14][i % 4]], reps: 10, niv: 1 }],
    run: sport === 'hyrox', runType: 'm', runVal: sport === 'hyrox' ? 400 : 200 });

  function editEp(box, idx) {
    const e = idx != null ? JSON.parse(JSON.stringify(DB.wod.epreuves[idx])) : { id: wid(), nom: 'WOD 1', sport: 'cross', prevu: 12, cap: 15, blocs: [newBloc('cross', 0)] };
    let custom = JSON.parse(JSON.stringify(DB.wod.customEx || []));
    const draw = () => {
      const allEx = [...WOD_EX, ...custom];
      box.innerHTML = `<div class="card"><h3>${idx != null ? 'Modifier' : 'Nouvelle'} épreuve</h3>
        <label>Nom</label><input id="nm" value="${esc(e.nom)}">
        <label>Sport</label><div class="seg"><button data-sp="cross" class="${e.sport === 'cross' ? 'on' : ''}">Crosstraining</button><button data-sp="hyrox" class="${e.sport === 'hyrox' ? 'on' : ''}">HYROX</button></div>
        <div class="row"><div><label>Temps d'épreuve prévu (min)</label><input id="pv" type="number" min="1" value="${e.prevu}"></div><div><label>Temps limite / time cap (min)</label><input id="cp" type="number" min="1" value="${e.cap}"></div></div></div>
      ${e.blocs.map((b, bi) => `<div class="blk"><div class="blk-h"><b>Bloc ${bi + 1}</b><button class="btn btn-ghost" style="padding:6px 10px" data-up="${bi}" ${bi ? '' : 'disabled'}>↑</button><button class="btn btn-ghost" style="padding:6px 10px" data-rmb="${bi}">✕</button></div>
          <label>Famille</label><select data-fam="${bi}">${WOD_FAM.map((f, k) => `<option value="${k}" ${b.famille === k ? 'selected' : ''}>${f}</option>`).join('')}</select>
          <label>Séries (nombre de tours du bloc)</label><input type="number" min="1" data-ser="${bi}" value="${b.series}">
          <label>Exercices · répétitions · niveau</label>
          <div>${b.ex.map((x, xi) => `<div class="ex-row"><span class="nm">${esc(x.nom)}</span><input type="number" min="0" data-reps="${bi}-${xi}" value="${x.reps}" title="répétitions (ou secondes pour le gainage)">
            <div class="nv">${[1, 2, 3, 4].map(n => `<button data-nv="${bi}-${xi}-${n}" class="${x.niv === n ? 'on' : ''}">N${n}</button>`).join('')}</div><button class="btn btn-ghost" style="padding:5px 9px" data-rmx="${bi}-${xi}">✕</button></div>`).join('') || '<div class="muted">Aucun exercice.</div>'}</div>
          <div class="row" style="margin-top:8px"><select data-add="${bi}"><option value="">＋ Ajouter un exercice…</option>${allEx.map(x => `<option>${esc(x)}</option>`).join('')}<option value="__new">✎ Exercice non répertorié…</option></select></div>
          <label style="display:flex;gap:8px;align-items:center;margin-top:12px"><input type="checkbox" data-run="${bi}" ${b.run ? 'checked' : ''} style="width:auto"> Course / RUN dans ce bloc</label>
          ${b.run ? `<div class="row"><select data-rt="${bi}">${Object.entries(RUN_T).map(([k, v]) => `<option value="${k}" ${b.runType === k ? 'selected' : ''}>${v}</option>`).join('')}</select><input type="number" min="1" data-rv="${bi}" value="${b.runVal}"></div>` : ''}
        </div>`).join('')}
      <button class="btn btn-ghost btn-block" style="margin-top:10px" id="addb">＋ Ajouter un bloc</button>
      <p class="muted" style="margin:10px 2px">Répétitions : pour le gainage, indiquez des secondes.</p>
      <div class="row" style="margin-top:6px"><button class="btn btn-grad" id="sv">💾 Enregistrer</button><button class="btn btn-ghost" id="bk">Annuler</button>${idx != null ? '<button class="btn btn-danger" id="del">Supprimer</button>' : ''}</div>`;
      const $ = s => box.querySelector(s), all = s => box.querySelectorAll(s);
      const read = () => { e.nom = $('#nm').value.trim() || 'Épreuve'; e.prevu = Math.max(1, +$('#pv').value || 1); e.cap = Math.max(1, +$('#cp').value || 1);
        all('[data-fam]').forEach(s => e.blocs[+s.dataset.fam].famille = +s.value);
        all('[data-ser]').forEach(s => e.blocs[+s.dataset.ser].series = Math.max(1, +s.value || 1));
        all('[data-reps]').forEach(s => { const [bi, xi] = s.dataset.reps.split('-').map(Number); e.blocs[bi].ex[xi].reps = +s.value || 0; });
        all('[data-rt]').forEach(s => e.blocs[+s.dataset.rt].runType = s.value);
        all('[data-rv]').forEach(s => e.blocs[+s.dataset.rv].runVal = +s.value || 0); };
      all('[data-sp]').forEach(b => b.onclick = () => { read(); e.sport = b.dataset.sp; if (e.sport === 'hyrox') e.blocs.forEach(x => x.run = true); draw(); });
      all('[data-nv]').forEach(b => b.onclick = () => { read(); const [bi, xi, n] = b.dataset.nv.split('-').map(Number); e.blocs[bi].ex[xi].niv = n; draw(); });
      all('[data-rmx]').forEach(b => b.onclick = () => { read(); const [bi, xi] = b.dataset.rmx.split('-').map(Number); e.blocs[bi].ex.splice(xi, 1); draw(); });
      all('[data-add]').forEach(s => s.onchange = () => { read(); let v = s.value; if (!v) return;
        if (v === '__new') { v = (prompt('Nom du nouvel exercice :') || '').trim(); if (!v) return draw(); if (!allEx.includes(v)) custom.push(v); }
        e.blocs[+s.dataset.add].ex.push({ nom: v, reps: 10, niv: 1 }); draw(); });
      all('[data-run]').forEach(c => c.onchange = () => { read(); e.blocs[+c.dataset.run].run = c.checked; draw(); });
      all('[data-rmb]').forEach(b => b.onclick = () => { read(); if (e.blocs.length > 1) e.blocs.splice(+b.dataset.rmb, 1); draw(); });
      all('[data-up]').forEach(b => b.onclick = () => { read(); const i = +b.dataset.up; [e.blocs[i - 1], e.blocs[i]] = [e.blocs[i], e.blocs[i - 1]]; draw(); });
      $('#addb').onclick = () => { read(); e.blocs.push(newBloc(e.sport, e.blocs.length)); draw(); };
      $('#bk').onclick = () => listEp(box);
      if ($('#del')) $('#del').onclick = () => { if (confirm('Supprimer cette épreuve ?')) { DB.wod.epreuves.splice(idx, 1); save(); listEp(box); } };
      $('#sv').onclick = () => { read(); if (e.cap < e.prevu && !confirm('Le temps limite est plus court que le temps prévu. Enregistrer quand même ?')) return;
        DB.wod.customEx = custom; if (idx != null) DB.wod.epreuves[idx] = e; else DB.wod.epreuves.push(e); save(); toast('Épreuve enregistrée ✔'); listEp(box); };
    };
    draw();
  }

  /* ================= 2. SÉANCE ================= */
  const resOf = (g, e) => { const t = g.dep && g.arr ? (g.arr - g.dep) / 1000 : null;
    return { t, ecart: t != null ? t - e.prevu * 60 : null, cap: g.capped || (t != null && t > e.cap * 60) }; };

  function seance(box) {
    const cur = DB.wod.current;
    if (!cur) return prepare(box);
    const e = cur.snap;
    let iv;
    const draw = () => {
      box.innerHTML = `<div class="card"><b>${esc(e.nom)}</b><div class="muted">${esc(cur.classe || '')} · ${summaryOf(e)}</div>
          <div class="big clock" id="gclk" style="font-size:clamp(2.4rem,12vw,4rem);padding:4px 0">0:00</div>
          <div class="muted" style="text-align:center" id="capinfo"></div>
          <div class="row" style="margin-top:8px"><button class="btn btn-grad" id="all">🚩 Départ groupé</button></div></div>
        <details class="card" style="margin-top:10px"><summary style="font-weight:800;cursor:pointer">📋 Rappel de l'épreuve</summary>${e.blocs.map((b, i) => `<div style="margin-top:8px"><b>Bloc ${i + 1}</b> <span class="muted">· ${WOD_FAM[b.famille]} · ${b.series} série${b.series > 1 ? 's' : ''}</span>
          <div class="muted" style="font-size:.85rem">${b.ex.map(x => `${x.reps} ${esc(x.nom)} (N${x.niv})`).join(' · ')}${b.run ? ` · RUN ${b.runVal} ${RUN_T[b.runType]}` : ''}</div></div>`).join('')}</details>
        ${cur.groups.map((g, i) => { const r = resOf(g, e);
          return `<div class="run ${g.arr || g.capped ? 'fin' : g.dep ? 'go' : ''}"><div class="run-h"><b>${esc(g.name)}</b><span class="run-t" data-live="${i}">${r.t != null ? mmss(r.t) : g.dep ? '…' : '0:00'}</span></div>
            <div class="muted" style="font-size:.8rem">${g.members.map(esc).join(', ')}</div>
            <div class="splits">${e.blocs.map((b, k) => `<button data-sp="${i}-${k}" class="${g.splits[k] ? 'on' : ''}" ${g.dep && !g.arr && !g.capped ? '' : 'disabled'}>Bloc ${k + 1}${g.splits[k] ? ' · ' + mmss((g.splits[k] - g.dep) / 1000) : ''}</button>`).join('')}</div>
            <div class="row" style="margin-top:8px">${g.dep ? '' : `<button class="btn btn-grad" data-go="${i}">▶ Départ</button>`}${g.dep && !g.arr && !g.capped ? `<button class="btn btn-danger" data-fin="${i}">🏁 Arrivée</button>` : ''}${g.arr || g.capped ? `<button class="btn btn-ghost" data-undo="${i}">↺ Annuler l'arrivée</button>` : ''}</div>
            ${r.t != null ? `<div style="margin-top:6px;font-size:.88rem">Temps réalisé <b>${mmss(r.t)}</b> · écart <b style="color:${r.ecart > 0 ? 'var(--danger)' : 'var(--ok)'}">${r.ecart > 0 ? '+' : ''}${mmss(r.ecart)}</b> par rapport aux ${e.prevu} min ${r.cap ? '· <span class="pill warn">time cap</span>' : ''}</div>` : ''}</div>`; }).join('')}
        <div class="row" style="margin-top:12px"><button class="btn btn-grad" id="save">💾 Terminer et enregistrer</button><button class="btn btn-ghost" id="cancel">Abandonner</button></div>`;
      const $ = s => box.querySelector(s), all = s => box.querySelectorAll(s), keep = () => save();
      $('#all').onclick = () => { const t = Date.now(); cur.groups.forEach(g => { if (!g.dep) g.dep = t; }); cur.start = cur.start || t; beep(1300, .45); keep(); draw(); };
      all('[data-go]').forEach(b => b.onclick = () => { cur.groups[+b.dataset.go].dep = Date.now(); cur.start = cur.start || Date.now(); beep(1300, .3); keep(); draw(); });
      all('[data-fin]').forEach(b => b.onclick = () => { const g = cur.groups[+b.dataset.fin]; g.arr = Date.now(); beep(1000, .3); keep(); draw(); });
      all('[data-undo]').forEach(b => b.onclick = () => { const g = cur.groups[+b.dataset.undo]; g.arr = null; g.capped = false; keep(); draw(); });
      all('[data-sp]').forEach(b => b.onclick = () => { const [i, k] = b.dataset.sp.split('-').map(Number), g = cur.groups[i]; g.splits[k] = g.splits[k] ? null : Date.now(); beep(900, .06); keep(); draw(); });
      $('#save').onclick = () => { if (cur.groups.some(g => g.dep && !g.arr && !g.capped) && !confirm('Certains groupes n\'ont pas terminé. Enregistrer quand même ?')) return;
        DB.wod.seances.push(cur); DB.wod.current = null; save(); clearInterval(iv); toast('Séance enregistrée ✔'); tab = 'resultats'; frame(); };
      $('#cancel').onclick = () => { if (confirm('Abandonner la séance ?')) { DB.wod.current = null; save(); clearInterval(iv); prepare(box); } };
    };
    const tick = () => {
      if (!box.isConnected || !DB.wod.current) return clearInterval(iv);
      const now = Date.now(), capMs = e.cap * 60000;
      const gc = box.querySelector('#gclk'); if (gc) gc.textContent = cur.start ? mmss((now - cur.start) / 1000) : '0:00';
      const ci = box.querySelector('#capinfo'); if (ci) ci.textContent = cur.start ? `Time cap dans ${mmss(Math.max(0, (cur.start + capMs - now) / 1000))}` : `Time cap : ${e.cap} min`;
      let changed = false;
      cur.groups.forEach((g, i) => {
        if (g.dep && !g.arr && !g.capped && now - g.dep >= capMs) { g.capped = true; g.arr = g.dep + capMs; changed = true; }
        const l = box.querySelector(`[data-live="${i}"]`); if (l && g.dep && !g.arr) l.textContent = mmss((now - g.dep) / 1000);
      });
      if (changed) { [0, 350, 700].forEach(d => setTimeout(() => beep(700, .5), d)); save(); draw(); }
    };
    draw(); clearInterval(window._wodTick); iv = window._wodTick = setInterval(tick, 500); tick();
  }

  function prepare(box) {
    if (!DB.wod.epreuves.length) { box.innerHTML = '<div class="card empty">Créez d\'abord une épreuve dans l\'onglet 🏋️ Épreuves.</div>'; return; }
    let mode = 'grp';
    const draw = () => {
      box.innerHTML = `<div class="card"><h3>Nouvelle séance</h3>
        <label>Épreuve</label><select id="ep">${DB.wod.epreuves.map(e => `<option value="${e.id}">${esc(e.nom)} — ${e.sport === 'hyrox' ? 'HYROX' : 'Crosstraining'}</option>`).join('')}</select>
        <label>Organisation</label><div class="seg"><button data-md="indiv" class="${mode === 'indiv' ? 'on' : ''}">Individuel</button><button data-md="grp" class="${mode === 'grp' ? 'on' : ''}">Groupes<br><small style="font-weight:600;opacity:.85">duo · trio · quatuor</small></button></div>
        <div id="who" style="margin-top:10px"></div></div>`;
      box.querySelectorAll('[data-md]').forEach(b => b.onclick = () => { mode = b.dataset.md; draw(); });
      const who = box.querySelector('#who');
      const launch = (groups, classe) => { const e = E(box.querySelector('#ep').value);
        DB.wod.current = { id: wid(), date: Date.now(), classe, snap: JSON.parse(JSON.stringify(e)), start: null,
          groups: groups.map(g => ({ ...g, dep: null, arr: null, capped: false, splits: e.blocs.map(() => null) })) }; save(); seance(box); };
      if (mode === 'indiv') {
        who.innerHTML = DB.classes.length ? `<label>Classe</label><select id="cl">${DB.classes.map(c => `<option>${esc(c.name)}</option>`).join('')}</select><button class="btn btn-grad btn-block" style="margin-top:12px" id="go">▶ Préparer la séance</button>` : noClassMsg;
        const go = who.querySelector('#go'); if (go) go.onclick = () => { const c = who.querySelector('#cl').value; launch(studentsOf(c).map(n => ({ name: n, members: [n] })), c); };
      } else {
        who.innerHTML = `<label>Taille des groupes</label><div class="seg" id="sz">${[[2, 'Duos'], [3, 'Trios'], [4, 'Quatuors']].map(([n, l]) => `<button data-n="${n}" class="${n === 2 ? 'on' : ''}">${l}</button>`).join('')}</div><div id="cmp" style="margin-top:6px"></div>`;
        mountComposer(who.querySelector('#cmp'), { id: 'wodc', modes: ['random', 'hetero', 'homo'], button: '▶ Former les groupes et préparer la séance',
          onTeams: teams => launch(teams.map(t => ({ name: t.name.replace('Équipe', 'Groupe'), members: t.members.map(m => m.n) })), who.querySelector('#wodc-cls')?.value || '') });
        const setSize = n => { who.querySelector('#wodc-k').value = 's'; who.querySelector('#wodc-v').value = n; who.querySelectorAll('#sz [data-n]').forEach(b => b.classList.toggle('on', +b.dataset.n === n)); };
        who.querySelectorAll('#sz [data-n]').forEach(b => b.onclick = () => setSize(+b.dataset.n)); setSize(2);
      }
    };
    draw();
  }

  /* ================= 3. RÉSULTATS ================= */
  function resultats(box) {
    const S = DB.wod.seances;
    if (!S.length) { box.innerHTML = '<div class="card empty">Aucune séance enregistrée pour l\'instant.</div>'; return; }
    box.innerHTML = `<div class="section-title" style="margin-top:0"><h2>Séances (${S.length})</h2><button class="link" id="exp">Exporter CSV</button></div>
      ${S.slice().reverse().map(s => { const i = S.indexOf(s), e = s.snap;
        const rows = s.groups.map(g => ({ g, r: resOf(g, e) })).sort((a, b) => (a.r.cap - b.r.cap) || ((a.r.t ?? 1e9) - (b.r.t ?? 1e9)));
        return `<div class="card" style="margin-top:10px"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><b>${new Date(s.date).toLocaleDateString('fr-FR')} · ${esc(e.nom)}</b><div class="muted">${esc(s.classe || '')} · ${summaryOf(e)}</div></div><button class="btn btn-ghost" data-x="${i}">🗑</button></div>
          <div class="sheet-table"><table><tr><th>#</th><th>Groupe / élève</th><th>Temps réalisé</th><th>Écart</th><th>Blocs</th></tr>
          ${rows.map(({ g, r }, k) => `<tr><td>${k + 1}</td><td><b>${esc(g.name)}</b><div class="muted" style="font-size:.75rem">${g.members.map(esc).join(', ')}</div></td><td>${r.t != null ? mmss(r.t) : '–'}${r.cap ? ' <span class="pill warn">cap</span>' : ''}</td><td>${r.ecart != null ? (r.ecart > 0 ? '+' : '') + mmss(r.ecart) : '–'}</td><td>${g.splits.filter(Boolean).length}/${e.blocs.length}</td></tr>`).join('')}</table></div></div>`; }).join('')}`;
    box.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { if (confirm('Supprimer cette séance ?')) { S.splice(+b.dataset.x, 1); save(); resultats(box); } });
    box.querySelector('#exp').onclick = () => download(`crosstraining-hyrox-${new Date().toISOString().slice(0, 10)}.csv`, csv([
      ['Date', 'Classe', 'Épreuve', 'Sport', 'Temps prévu (min)', 'Time cap (min)', 'Groupe', 'Membres', 'Temps réalisé', 'Écart', 'Time cap atteint', ...Array.from({ length: Math.max(...S.map(s => s.snap.blocs.length)) }, (_, k) => 'Bloc ' + (k + 1))],
      ...S.flatMap(s => s.groups.map(g => { const e = s.snap, r = resOf(g, e);
        return [new Date(s.date).toLocaleDateString('fr-FR'), s.classe, e.nom, e.sport === 'hyrox' ? 'HYROX' : 'Crosstraining', e.prevu, e.cap, g.name, g.members.join(', '), mmss(r.t), r.ecart != null ? mmss(r.ecart) : '', r.cap ? 'oui' : 'non', ...g.splits.map(x => x && g.dep ? mmss((x - g.dep) / 1000) : '')]; }))]));
  }

  frame();
  return () => clearInterval(window._wodTick);
};

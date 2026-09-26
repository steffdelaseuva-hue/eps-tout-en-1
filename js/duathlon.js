/* =========================================================
   EPS ONE — Outil « Duathlon athlétique »
   Groupes duo/trio/quatuor · 3 étapes · points de lancers ·
   tours · temps par étape + cumul · pénalités lancers / course
   ========================================================= */
DB.duathlon = DB.duathlon || { seances: [], current: null };
ICONS.duathlon = '<circle cx="7" cy="5" r="2"/><path d="M6 8 4 13l3 1 1 6M6 8l4 3 3-1"/><path d="M14.5 14.5 21 8"/><circle cx="19" cy="17" r="2.5"/>';
const dmss = s => { if (s == null || isNaN(s)) return '–'; s = Math.round(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

TOOL_IMPL.duathlon = function (el) {
  let tab = 'seance', iv;
  const D = DB.duathlon;
  function frame() {
    el.innerHTML = `<div class="co-tabs">${[['seance', '⏱ Épreuve'], ['resultats', '📊 Résultats']].map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div><div id="d-body"></div>`;
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; frame(); });
    const box = el.querySelector('#d-body');
    if (tab === 'seance') D.current ? live(box) : prepare(box); else results(box);
  }

  /* ---- Calculs ---- */
  const mem = (g, e, n) => g.etapes[e].m[n];
  const stepOf = (c, g, e) => {
    const E = g.etapes[e], ms = g.members.map(n => E.m[n]);
    const pts = ms.reduce((a, m) => a + m.pts, 0), tours = ms.reduce((a, m) => a + m.tours, 0);
    const inval = ms.reduce((a, m) => a + m.inval, 0), penC = ms.reduce((a, m) => a + m.penC, 0);
    const temps = E.dep && E.arr ? (E.arr - E.dep) / 1000 : null;
    const penS = c.optC ? penC * c.secC : 0;
    return { pts, tours, inval, boucles: c.optL ? inval * c.boucles : 0, penC, penS, temps, total: temps != null ? temps + penS : null };
  };
  const totalOf = (c, g) => { const st = [0, 1, 2].map(e => stepOf(c, g, e));
    return { st, pts: st.reduce((a, x) => a + x.pts, 0), tours: st.reduce((a, x) => a + x.tours, 0), boucles: st.reduce((a, x) => a + x.boucles, 0),
      penS: st.reduce((a, x) => a + x.penS, 0), temps: st.every(x => x.total != null) ? st.reduce((a, x) => a + x.total, 0) : null,
      partiel: st.reduce((a, x) => a + (x.total || 0), 0), done: st.filter(x => x.total != null).length }; };

  /* ---- Préparation ---- */
  function prepare(box) {
    const c = D.lastCfg || { optL: true, boucles: 1, optC: false, secC: 10 };
    box.innerHTML = `<div class="card"><h3>Nouvelle épreuve de duathlon</h3>
        <label>Nom</label><input id="nm" value="Duathlon ${new Date().toLocaleDateString('fr-FR')}">
        <label style="display:flex;gap:8px;align-items:center;margin-top:12px"><input type="checkbox" id="ol" ${c.optL ? 'checked' : ''} style="width:auto"> Pénalité lancers : petite boucle par lancer non valide</label>
        <div id="olw"><label>Tours de petite boucle par lancer non valide</label><input id="bo" type="number" min="1" value="${c.boucles}"></div>
        <label style="display:flex;gap:8px;align-items:center;margin-top:12px"><input type="checkbox" id="oc" ${c.optC ? 'checked' : ''} style="width:auto"> Pénalité de course (secondes ajoutées)</label>
        <div id="ocw"><label>Secondes par pénalité</label><input id="sc" type="number" min="1" value="${c.secC}"></div></div>
      <div class="card" style="margin-top:12px"><h3>Groupes</h3><label style="margin-top:0">Taille des groupes</label><div class="seg" id="sz">${[[2, 'Duos'], [3, 'Trios'], [4, 'Quatuors']].map(([n, l]) => `<button data-n="${n}">${l}</button>`).join('')}</div><div id="cmp" style="margin-top:6px"></div></div>`;
    const $ = s => box.querySelector(s);
    const vis = () => { $('#olw').style.display = $('#ol').checked ? 'block' : 'none'; $('#ocw').style.display = $('#oc').checked ? 'block' : 'none'; };
    $('#ol').onchange = $('#oc').onchange = vis; vis();
    mountComposer($('#cmp'), { id: 'dua', modes: ['random', 'hetero', 'homo'], button: '▶ Former les groupes et commencer',
      onTeams: teams => {
        const cfg = { optL: $('#ol').checked, boucles: Math.max(1, +$('#bo').value || 1), optC: $('#oc').checked, secC: Math.max(1, +$('#sc').value || 10) };
        D.lastCfg = cfg;
        const blank = () => ({ pts: 0, tours: 0, inval: 0, penC: 0 });
        D.current = { id: Date.now().toString(36), date: Date.now(), nom: $('#nm').value.trim() || 'Duathlon', classe: $('#dua-cls')?.value || '', cfg, etape: 0,
          groups: teams.map(t => { const members = t.members.map(m => m.n);
            return { name: t.name.replace('Équipe', 'Groupe'), members, etapes: [0, 1, 2].map(() => ({ dep: null, arr: null, m: Object.fromEntries(members.map(n => [n, blank()])) })) }; }) };
        save(); live(box);
      } });
    const setSize = n => { $('#dua-k').value = 's'; $('#dua-v').value = n; box.querySelectorAll('#sz [data-n]').forEach(b => b.classList.toggle('on', +b.dataset.n === n)); };
    box.querySelectorAll('#sz [data-n]').forEach(b => b.onclick = () => setSize(+b.dataset.n)); setSize(2);
  }

  /* ---- Épreuve en direct ---- */
  function live(box) {
    const C = D.current, c = C.cfg;
    const draw = () => {
      const e = C.etape;
      box.innerHTML = `<div class="card"><b>${esc(C.nom)}</b><div class="muted">${esc(C.classe)} · ${C.groups.length} groupes${c.optL ? ` · ${c.boucles} boucle(s) par lancer non valide` : ''}${c.optC ? ` · pénalité course ${c.secC} s` : ''}</div>
          <label>Étape</label><div class="seg" id="et">${[0, 1, 2].map(k => `<button data-e="${k}" class="${k === e ? 'on' : ''}">Étape ${k + 1}</button>`).join('')}</div>
          <button class="btn btn-grad btn-block" style="margin-top:10px" id="all">🚩 Départ groupé — étape ${e + 1}</button></div>
        ${C.groups.map((g, gi) => { const E = g.etapes[e], s = stepOf(c, g, e), T = totalOf(c, g);
          return `<div class="run ${E.arr ? 'fin' : E.dep ? 'go' : ''}"><div class="run-h"><b>${esc(g.name)}</b><span class="run-t" data-live="${gi}">${s.temps != null ? dmss(s.temps) : E.dep ? '…' : '0:00'}</span></div>
            <div class="row" style="margin-top:6px">${E.dep ? '' : `<button class="btn btn-grad" data-go="${gi}">▶ Départ</button>`}${E.dep && !E.arr ? `<button class="btn btn-danger" data-fin="${gi}">🏁 Arrivée</button>` : ''}${E.arr ? `<button class="btn btn-ghost" data-undo="${gi}">↺ Annuler l'arrivée</button>` : ''}</div>
            <div class="sheet-table" style="margin-top:8px"><table><tr><th>Élève</th><th>Pts</th><th>Tours</th>${c.optL ? '<th>Lancers ✗</th>' : ''}${c.optC ? '<th>Pén.</th>' : ''}</tr>
              ${g.members.map((n, mi) => { const m = mem(g, e, n), cell = (k, v) => `<td><div style="display:flex;align-items:center;gap:4px;justify-content:center"><button class="btn btn-ghost" style="padding:4px 9px" data-dec="${gi}|${mi}|${k}">−</button><b style="min-width:22px;text-align:center">${v}</b><button class="btn btn-ghost" style="padding:4px 9px" data-inc="${gi}|${mi}|${k}">+</button></div></td>`;
                return `<tr><td><b>${esc(n)}</b></td>${cell('pts', m.pts)}${cell('tours', m.tours)}${c.optL ? cell('inval', m.inval) : ''}${c.optC ? cell('penC', m.penC) : ''}</tr>`; }).join('')}
              <tr><td><b>Groupe</b></td><td><b>${s.pts}</b></td><td><b>${s.tours}</b></td>${c.optL ? `<td><b>${s.inval}</b> → <b>${s.boucles}</b> boucle(s)</td>` : ''}${c.optC ? `<td><b>+${s.penS} s</b></td>` : ''}</tr></table></div>
            <div class="muted" style="font-size:.82rem;margin-top:6px">Étape ${e + 1} : ${s.total != null ? `<b style="color:var(--text)">${dmss(s.total)}</b>${s.penS ? ` (dont ${s.penS} s de pénalité)` : ''}` : '—'} · Cumul ${T.done}/3 étapes : <b style="color:var(--text)">${dmss(T.partiel)}</b> · ${T.pts} pts · ${T.tours} tours</div></div>`; }).join('')}
        <div class="section-title"><h2>Classement provisoire</h2></div>${table(C)}
        <div class="row" style="margin-top:12px"><button class="btn btn-grad" id="save">💾 Terminer et enregistrer</button><button class="btn btn-ghost" id="cancel">Abandonner</button></div>`;
      const $ = s => box.querySelector(s), all = s => box.querySelectorAll(s), keep = () => save();
      all('[data-e]').forEach(b => b.onclick = () => { C.etape = +b.dataset.e; keep(); draw(); });
      $('#all').onclick = () => { const t = Date.now(); C.groups.forEach(g => { if (!g.etapes[e].dep) g.etapes[e].dep = t; }); beep(1300, .45); keep(); draw(); };
      all('[data-go]').forEach(b => b.onclick = () => { C.groups[+b.dataset.go].etapes[e].dep = Date.now(); beep(1300, .3); keep(); draw(); });
      all('[data-fin]').forEach(b => b.onclick = () => { C.groups[+b.dataset.fin].etapes[e].arr = Date.now(); beep(1000, .3); keep(); draw(); });
      all('[data-undo]').forEach(b => b.onclick = () => { C.groups[+b.dataset.undo].etapes[e].arr = null; keep(); draw(); });
      const upd = (key, d) => { const [gi, mi, k] = key.split('|'), g = C.groups[+gi]; const m = g.etapes[e].m[g.members[+mi]]; m[k] = Math.max(0, m[k] + d); keep(); draw(); };
      all('[data-inc]').forEach(b => b.onclick = () => upd(b.dataset.inc, 1));
      all('[data-dec]').forEach(b => b.onclick = () => upd(b.dataset.dec, -1));
      all('[data-pts]').forEach(i => i.onchange = () => { const [gi, mi] = i.dataset.pts.split('|'), g = C.groups[+gi]; g.etapes[e].m[g.members[+mi]].pts = Math.max(0, +i.value || 0); keep(); draw(); });
      $('#save').onclick = () => { D.seances.push(C); D.current = null; save(); clearInterval(iv); toast('Duathlon enregistré ✔'); tab = 'resultats'; frame(); };
      $('#cancel').onclick = () => { if (confirm('Abandonner cette épreuve ?')) { D.current = null; save(); clearInterval(iv); prepare(box); } };
    };
    const tick = () => { if (!box.isConnected || !D.current) return clearInterval(iv);
      C.groups.forEach((g, gi) => { const E = g.etapes[C.etape], l = box.querySelector(`[data-live="${gi}"]`); if (l && E.dep && !E.arr) l.textContent = dmss((Date.now() - E.dep) / 1000); }); };
    draw(); clearInterval(window._duaTick); iv = window._duaTick = setInterval(tick, 500);
  }

  /* ---- Tableau des résultats ---- */
  function table(C) {
    const c = C.cfg, rows = C.groups.map(g => ({ g, T: totalOf(c, g) }))
      .sort((a, b) => (b.T.done - a.T.done) || (a.T.partiel - b.T.partiel) || (b.T.pts - a.T.pts));
    return `<div class="card sheet-table"><table><tr><th>#</th><th>Groupe</th>${[1, 2, 3].map(k => `<th>Étape ${k}</th>`).join('')}<th>Temps cumulé</th><th>Pts lancers</th><th>Tours</th>${c.optL ? '<th>Boucles pén.</th>' : ''}${c.optC ? '<th>Pén. course</th>' : ''}</tr>
      ${rows.map(({ g, T }, i) => `<tr><td>${i + 1}</td><td><b>${esc(g.name)}</b><div class="muted" style="font-size:.72rem">${g.members.map(esc).join(', ')}</div></td>${T.st.map(s => `<td>${s.total != null ? dmss(s.total) : '–'}<div class="muted" style="font-size:.7rem">${s.pts} pts · ${s.tours} t.</div></td>`).join('')}
        <td><b>${T.temps != null ? dmss(T.temps) : dmss(T.partiel) + ` <span class="muted">(${T.done}/3)</span>`}</b></td><td><b>${T.pts}</b></td><td><b>${T.tours}</b></td>${c.optL ? `<td>${T.boucles}</td>` : ''}${c.optC ? `<td>+${T.penS} s</td>` : ''}</tr>`).join('')}</table>
      <p class="muted" style="font-size:.75rem;margin:6px 0 0">Classement au temps cumulé (pénalités de course comprises) ; à égalité, aux points de lancers.</p></div>`;
  }

  /* ---- Résultats enregistrés ---- */
  function results(box) {
    const S = D.seances;
    if (!S.length) { box.innerHTML = '<div class="card empty">Aucun duathlon enregistré pour l\'instant.</div>'; return; }
    box.innerHTML = `<div class="section-title" style="margin-top:0"><h2>Épreuves (${S.length})</h2><button class="link" id="exp">Exporter CSV</button></div>
      ${S.slice().reverse().map(C => { const i = S.indexOf(C);
        return `<div style="margin-top:12px"><div style="display:flex;justify-content:space-between;align-items:center"><div><b>${esc(C.nom)}</b><div class="muted">${new Date(C.date).toLocaleDateString('fr-FR')} · ${esc(C.classe)}</div></div><button class="btn btn-ghost" data-x="${i}">🗑</button></div>${table(C)}</div>`; }).join('')}`;
    box.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { if (confirm('Supprimer cette épreuve ?')) { S.splice(+b.dataset.x, 1); save(); results(box); } });
    box.querySelector('#exp').onclick = () => download(`duathlon-${new Date().toISOString().slice(0, 10)}.csv`, csv([
      ['Épreuve', 'Date', 'Classe', 'Groupe', 'Élève', 'Étape', 'Points lancers', 'Tours', 'Lancers non valides', 'Boucles de pénalité', 'Pénalités course', 'Temps étape (groupe)', 'Temps cumulé (groupe)'],
      ...S.flatMap(C => C.groups.flatMap(g => { const T = totalOf(C.cfg, g);
        return [0, 1, 2].flatMap(e => g.members.map(n => { const m = g.etapes[e].m[n];
          return [C.nom, new Date(C.date).toLocaleDateString('fr-FR'), C.classe, g.name, n, e + 1, m.pts, m.tours, C.cfg.optL ? m.inval : '', C.cfg.optL ? m.inval * C.cfg.boucles : '', C.cfg.optC ? m.penC : '', dmss(T.st[e].total), T.temps != null ? dmss(T.temps) : '']; })); }))]));
  }

  frame();
  return () => clearInterval(window._duaTick);
};

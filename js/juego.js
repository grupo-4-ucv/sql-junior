/* SQL Junior - pantalla de trabajo: solicitudes, charlas, consola MySQL, pistas, entregas, fin de dia y reporte. */
(function () {
  'use strict';
  const SJ = window.SJ, UI = SJ.UI, CFG = SJ.CFG, $ = UI.$, esc = UI.esc;
  const J = SJ.Juego = {};
  let sim = null, E = null, g = null, hist = [], hi = 0, reloj = null, previo = '';

  const nuevoCur = () => ({ st: [], fallos: 0, pistas: [], seg: 0 });
  const dia = () => E.dias[g.d];
  const reto = () => dia().retos[g.i];
  const fechaCorta = iso => iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4);
  const parrafos = t => String(t).split('\n').filter(x => x.trim()).map(x => '<p>' + esc(x) + '</p>').join('');
  const texto = (v, f) => typeof v === 'function' ? v(f) : v;
  const PPD = () => E.pistasDia || CFG.PISTAS_POR_DIA;
  const semilla = () => UI.S.al.id + '|' + g.esc + '|' + g.intento;

  /* ---------- partida ---------- */
  J.nueva = function (escId, intento) {
    UI.S.g = {
      esc: escId, intento: intento, d: 0, i: 0, fase: 'trabajo', log: [], ini: 0, sel: false, charlas: [], cur: nuevoCur(),
      res: SJ.escenarios[escId].dias.map(() => []), pistasDia: 0, seg: SJ.escenarios[escId].dias.map(() => 0),
      integ: { salidas: 0, fuera: 0, pega: 0, copia: 0 }, desc: { usado: false, fin: 0 },
      viol: { mayus: 0, ifexists: 0, inscols: 0, sinpc: 0, safe: 0, err: 0 }, sello: false, fin: null
    };
    UI.guardar(); J.abrir();
  };

  J.abrir = function () {
    g = UI.S.g; E = SJ.escenarios[g.esc];
    if (!E) return UI.ruta();
    document.body.dataset.esc = g.esc;
    hist = []; hi = 0;
    if (g.fase === 'reporte') return J.reporte();
    sim = new SJ.Sim(SJ.SQL, E, semilla());
    sim.restaura(g.log, g.ini, g.d, g.i, g.cur.st, g.sel);
    J.pinta();
    if (g.fase === 'findia') return J.finDia();
    J.charlaSiToca();
  };

  /* ---------- pantalla principal ---------- */
  J.pinta = function () {
    UI.pinta('<div class="juego"><div class="barra px"><h2>' + esc(E.nombre) + '</h2>' +
      '<span class="chip" id="j-dia"></span><span class="chip">Tiempo <b id="j-t">00:00</b> / ' + UI.tiempo(dia().min * 60) + '</span>' +
      '<span class="chip">Semana <b id="j-p">--</b></span><span class="chip">Pistas hoy <b id="j-h"></b></span><span class="sep"></span>' +
      SJ.Son.boton() + '<button class="btn sec mini" id="b-libreta">Libreta</button><button class="btn sec mini" id="b-normas">Normas</button><button class="btn sec mini" id="b-desc">Descanso</button></div>' +
      '<div class="cuerpo"><div class="izq"><canvas class="escena" id="j-escena" width="200" height="72"></canvas>' +
      '<div class="tickets" id="j-tickets"></div>' +
      '<div class="fila"><button class="btn" id="b-entregar">Entregar</button><button class="btn sec mini" id="b-pista">Pista</button>' +
      '<button class="btn sec mini" id="b-rest">Restaurar</button><button class="btn sec mini" id="b-omitir">Omitir</button></div>' +
      '<div id="j-ver"></div><div class="solicitud papel" id="j-sol"></div></div>' +
      '<div class="der"><div class="salida" id="j-out"></div><div class="editor px">' +
      '<div class="fila"><span class="prompt" id="j-prompt"></span><span class="sep"></span><span class="etq">Ctrl + Enter ejecuta</span></div>' +
      '<textarea id="j-sql" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" aria-label="Editor de consultas SQL"></textarea>' +
      '<div class="fila"><button class="btn" id="b-run">Ejecutar</button><button class="btn sec mini" id="b-ant">Anterior</button>' +
      '<button class="btn sec mini" id="b-sig">Siguiente</button><span class="sep"></span><button class="btn sec mini" id="b-limpia">Limpiar pantalla</button></div></div></div></div></div>');
    $('#b-libreta').onclick = J.libreta;
    $('#b-normas').onclick = function () { UI.normas(false); };
    $('#b-desc').onclick = UI.descanso;
    $('#b-entregar').onclick = J.entrega;
    $('#b-pista').onclick = J.pista;
    $('#b-rest').onclick = J.restaurar;
    $('#b-omitir').onclick = J.omitir;
    $('#b-run').onclick = J.ejecuta;
    $('#b-ant').onclick = function () { J.historial(-1); };
    $('#b-sig').onclick = function () { J.historial(1); };
    $('#b-limpia').onclick = function () { $('#j-out').innerHTML = ''; J.sistema('Pantalla limpia. La base de datos no cambió.'); };
    const ta = $('#j-sql');
    previo = '';
    ta.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); J.ejecuta(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowUp') { e.preventDefault(); J.historial(-1); }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowDown') { e.preventDefault(); J.historial(1); }
      else if (e.key === 'Tab') { e.preventDefault(); const a = ta.selectionStart; ta.value = ta.value.slice(0, a) + '  ' + ta.value.slice(ta.selectionEnd); ta.selectionStart = ta.selectionEnd = a + 2; previo = ta.value; }
    });
    ta.addEventListener('input', function () {
      if (ta.value.length - previo.length > 20) { ta.value = previo; UI.cuenta('pega'); UI.aviso('Pegado bloqueado: escribe tu consulta.'); UI.guardar(); return; }
      previo = ta.value;
    });
    J.sistema('Welcome to the MySQL monitor.  Commands end with ;\nServer version: 8.0.36 MySQL Community Server - GPL\nConectado como junior@localhost. Hoy es ' + dia().nombre.toLowerCase() + ' ' + fechaCorta(dia().fecha) + '.');
    J.refresca();
    clearInterval(reloj);
    reloj = setInterval(J.tic, 1000);
  };

  J.refresca = function () {
    if (!$('#j-sol')) return;
    const R = reto(), d = dia();
    if (!R) { $('#j-sol').innerHTML = '<h3>Jornada terminada</h3>'; $('#j-dia').textContent = d.nombre; J.prompt(); J.pintaTiempo(); return; }
    const quien = R.de === 'jefe' ? E.jefe : E.gente[R.de];
    $('#j-dia').innerHTML = esc(d.nombre) + ' ' + fechaCorta(d.fecha) + ' <b>día ' + (g.d + 1) + '/' + E.dias.length + '</b>';
    $('#j-h').textContent = (PPD() - g.pistasDia) + '/' + PPD();
    const hechos = [].concat.apply([], g.res).filter(Boolean);
    $('#j-p').textContent = hechos.length ? Math.round(hechos.reduce((a, r) => a + r.p, 0) / hechos.length) + '%' : '--';
    $('#j-tickets').innerHTML = d.retos.map(function (_, k) {
      const r = g.res[g.d][k], c = r ? (r.omit ? 'omitido' : 'hecho') : k === g.i ? 'actual' : '';
      return '<div class="ticket ' + c + '">' + (r ? r.p : k === g.i ? 'AHORA' : '#' + (k + 1)) + '</div>';
    }).join('');
    const pistas = g.cur.pistas.map(function (k, n) { return '<div class="pista"><b>Pista ' + (n + 1) + ':</b> ' + esc(texto(R.pistas[k], sim.f)) + '</div>'; }).join('');
    $('#j-sol').innerHTML = '<div class="de"><canvas id="j-av" width="16" height="16" style="width:56px;height:56px"></canvas><div><b>' + esc(quien.nombre) + '</b><span>' + esc(quien.cargo) + '</span></div></div>' +
      '<h3>Solicitud ' + (g.i + 1) + ' de ' + d.retos.length + ': ' + esc(R.titulo) + '</h3><div class="cuerpo-txt">' + parrafos(texto(R.texto, sim.f)) + '</div>' + pistas +
      '<p class="etq" style="color:inherit;opacity:.7">' + (R.ref ? 'Se evalúa tu último SELECT ejecutado.' : 'Se evalúa el estado de la base de datos.') + '</p>';
    if (SJ.Pix) { SJ.Pix.avatar($('#j-av'), quien.nombre); SJ.Pix.escena($('#j-escena'), g.esc, g.d, g.i / d.retos.length, d.fecha); }
    $('#j-ver').innerHTML = '';
    J.prompt(); J.pintaTiempo();
  };
  J.prompt = function () { const p = $('#j-prompt'); if (p) p.textContent = 'mysql [' + (sim.E.sel ? E.db : '(none)') + ']>'; };
  J.pintaTiempo = function () {
    const t = $('#j-t'); if (!t) return;
    t.textContent = UI.tiempo(g.seg[g.d]);
    t.className = g.seg[g.d] > dia().min * 60 ? 'txt-aviso' : '';
  };
  J.tic = function () {
    if (!g || g.fase !== 'trabajo' || UI.enDescanso || !$('#j-t')) return;
    g.seg[g.d]++; g.cur.seg++;
    J.pintaTiempo();
    if (g.seg[g.d] % 10 === 0) UI.guardar();
  };

  /* ---------- consola ---------- */
  const num = v => { if (Number.isInteger(v)) return String(v); const s = String(+v.toFixed(4)), dec = (s.split('.')[1] || '').length; return dec < 2 ? v.toFixed(2) : s; };
  const tabla = function (o) {
    const MAX = 200, filas = o.rows.slice(0, MAX);
    return '<div class="tabla-wrap"><table class="res"><thead><tr>' + o.cols.map(c => '<th>' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' +
      filas.map(r => '<tr>' + r.map(v => v == null ? '<td class="nulo">NULL</td>' : typeof v === 'number' ? '<td class="num">' + num(v) + '</td>' : '<td>' + esc(v) + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div>' + (o.rows.length > MAX ? '<div class="info">(se muestran ' + MAX + ' de ' + o.rows.length + ' filas)</div>' : '');
  };
  J.escribe = function (html) {
    const out = $('#j-out'); if (!out) return;
    out.insertAdjacentHTML('beforeend', html);
    while (out.children.length > 160) out.removeChild(out.firstChild);
    out.scrollTop = out.scrollHeight;
  };
  J.sistema = function (t) { J.escribe('<div class="sis">' + esc(t) + '</div>'); };
  J.ejecuta = function () {
    const ta = $('#j-sql'), txt = ta.value;
    if (!txt.trim() || g.fase !== 'trabajo') return;
    if (hist[hist.length - 1] !== txt) hist.push(txt);
    hi = hist.length;
    const o = sim.corre(txt);
    let todoBien = true, html = '';
    o.res.forEach(function (r) {
      html += '<div class="cmd">mysql&gt; ' + esc(r.raw) + '</div>';
      if (!r.ok) {
        todoBien = false;
        if (r.type === 'incompleta') g.viol.sinpc++;
        else { g.viol.err++; if (r.err.code === 1175) g.viol.safe++; }
        html += '<div class="err">' + esc(r.err.texto) + '</div>' + (r.err.tip ? '<div class="tip">Ayuda: ' + esc(r.err.tip) + '</div>' : '');
        return;
      }
      if (r.out) html += r.out.rows.length ? tabla(r.out) : '';
      html += '<div class="info">' + esc(r.info) + '</div>';
      r.notes.forEach(n => { html += '<div class="tip">' + esc(n) + '</div>'; });
      r.lint.forEach(l => { g.viol[l.id]++; html += '<div class="tip">Norma del equipo: ' + esc(l.msg) + '. Se ejecutó, pero resta en buenas prácticas.</div>'; });
    });
    if (!o.res.length) html += '<div class="info">No hay ninguna sentencia para ejecutar.</div>';
    SJ.Son.tocar(todoBien ? 'ok' : 'error');
    J.escribe(html);
    if (o.nuevos.length) g.log.push.apply(g.log, o.nuevos);
    g.sel = sim.E.sel;
    if (todoBien) { ta.value = ''; previo = ''; }
    UI.guardar(); J.prompt(); ta.focus();
  };
  J.historial = function (paso) {
    if (!hist.length) return;
    hi = Math.max(0, Math.min(hist.length, hi + paso));
    const ta = $('#j-sql');
    ta.value = hi < hist.length ? hist[hi] : '';
    previo = ta.value; ta.focus();
  };

  /* ---------- charlas del jefe y libreta ---------- */
  const notaHtml = n => '<div class="nota"><h3>' + esc(n.t) + '</h3><pre>' + esc(n.s) + '</pre><p class="etq" style="color:inherit">Ejemplo</p><pre>' + esc(n.e) + '</pre>' + (n.n ? '<p>' + esc(n.n) + '</p>' : '') + '</div>';
  J.charlaSiToca = function () {
    const ch = (E.charlas || SJ.CHARLAS).find(c => c.dia === g.d && c.en === g.i), clave = g.d + '-' + g.i;
    if (!ch || g.charlas.indexOf(clave) >= 0) return;
    const lineas = (ch.en === 0 ? [E.jefe.saludos[g.d].replace('{nombre}', UI.S.al.nom.split(' ')[0])] : []).concat(ch.dice);
    let n = 0, pos = 0, tm = null;
    const v = UI.ventana('<h2>' + esc(ch.titulo) + '</h2><div class="dialogo"><canvas id="ch-av" width="16" height="16" style="width:96px;height:96px"></canvas>' +
      '<div><div class="quien">' + esc(E.jefe.nombre) + ' &middot; ' + esc(E.jefe.cargo) + '</div><div class="dice" id="ch-txt"></div></div></div>' +
      '<div id="ch-notas" class="libreta" hidden></div><div class="fila"><span class="etq" id="ch-n"></span><span class="sep"></span><button class="btn" id="ch-sig" data-foco>Siguiente</button></div>', true);
    if (SJ.Pix) SJ.Pix.avatar($('#ch-av', v), E.jefe.nombre);
    const txt = $('#ch-txt', v), btn = $('#ch-sig', v);
    const escribe = function () {
      clearInterval(tm); pos = 0; txt.textContent = '';
      $('#ch-n', v).textContent = (n + 1) + ' / ' + lineas.length;
      tm = setInterval(function () { pos += 2; txt.textContent = lineas[n].slice(0, pos); if (pos % 6 === 0) SJ.Son.tocar('blip'); if (pos >= lineas[n].length) clearInterval(tm); }, 22);
    };
    btn.onclick = function () {
      if (n >= lineas.length) { g.charlas.push(clave); UI.guardar(); UI.cerrar(); const ta = $('#j-sql'); if (ta) ta.focus(); return; }
      if (pos < lineas[n].length) { clearInterval(tm); pos = lineas[n].length; txt.textContent = lineas[n]; return; }
      n++;
      if (n < lineas.length) return escribe();
      txt.textContent = 'Esto queda anotado en tu libreta. Puedes abrirla cuando quieras, sin costo.';
      const cn = $('#ch-notas', v); cn.innerHTML = ch.notas.map(notaHtml).join(''); cn.hidden = false;
      $('#ch-n', v).textContent = ''; btn.textContent = 'Anotado, a trabajar';
    };
    escribe();
  };
  J.libreta = function () {
    const vistas = (E.charlas || SJ.CHARLAS).filter(c => g.charlas.indexOf(c.dia + '-' + c.en) >= 0);
    const v = UI.ventana('<h2>Libreta de apuntes</h2>' + (vistas.length ? vistas.map(c => '<h3 class="oro">' + esc(E.dias[c.dia].nombre + ': ' + c.titulo) + '</h3><div class="libreta">' + c.notas.map(notaHtml).join('') + '</div>').join('')
      : '<p>Todavía no tienes apuntes.</p>') + '<div class="fila"><button class="btn" id="lb-ok" data-foco>Cerrar</button></div>', true);
    $('#lb-ok', v).onclick = UI.cerrar;
  };

  /* ---------- pistas, restaurar, omitir ---------- */
  J.pista = function () {
    const R = reto(), k = g.cur.pistas.length;
    if (g.pistasDia >= PPD()) return UI.aviso(PPD() === 1 ? 'Ya usaste tu pista de hoy.' : 'Ya usaste tus ' + PPD() + ' pistas de hoy.');
    if (k >= R.pistas.length) return UI.aviso('No hay más pistas para esta solicitud.');
    UI.confirma('Pedir una pista', 'Cada pista descuenta ' + (E.descPista || CFG.DESCUENTO_PISTA) + ' puntos de esta solicitud. Te quedan ' + (PPD() - g.pistasDia) + ' por hoy. Recuerda que la libreta es gratis.', 'Usar pista', function () {
      g.cur.pistas.push(k); g.pistasDia++; UI.guardar(); J.refresca(); SJ.Son.tocar('pista');
    });
  };
  J.restaurar = function () {
    UI.confirma('Restaurar la base', 'La base de datos volverá a como estaba al empezar esta solicitud. Se deshace todo lo que modificaste en ella. No pierdes puntos.', 'Restaurar', function () {
      g.log.length = g.ini;
      sim.restaura(g.log, g.ini, g.d, g.i, g.cur.st, g.sel);
      UI.guardar(); J.sistema('Base de datos restaurada al inicio de la solicitud.');
    });
  };
  J.omitir = function () {
    UI.confirma('Omitir la solicitud', 'Tu jefe la resolverá por ti y verás su solución, pero obtendrás <b>0 puntos</b> en esta solicitud. Para cambiar de empresa necesitas más de ' + CFG.APROBACION + '% en la semana.', 'Omitir (0 puntos)', function () {
      g.log.length = g.ini;
      sim.restaura(g.log, g.ini, g.d, g.i, g.cur.st, g.sel);
      const nuevos = sim.resuelve();
      g.log.push.apply(g.log, nuevos);
      J.cierra(true);
    });
  };

  /* ---------- entrega y cierre de reto ---------- */
  J.entrega = function () {
    if (g.fase !== 'trabajo') return;
    let v;
    try { v = sim.evalua(); } catch (e) { v = { ok: false, sinIntento: true, msgs: ['No se pudo evaluar: ' + (e.message || e)] }; }
    if (v.ok) return J.cierra(false);
    SJ.Son.tocar('error');
    if (!v.sinIntento) g.cur.fallos++;
    UI.guardar();
    const desc = Math.min(CFG.MAX_DESCUENTO_FALLO, g.cur.fallos * CFG.DESCUENTO_FALLO);
    $('#j-ver').innerHTML = '<div class="px veredicto malo"><b class="txt-mal">Todavía no está resuelto</b>' + v.msgs.map(m => '<span>' + esc(m) + '</span>').join('') +
      (v.sinIntento ? '' : '<span class="tenue">Entregas incorrectas: ' + g.cur.fallos + ' (descuento acumulado: ' + desc + ' puntos).</span>') + '</div>';
    $('#j-ver').scrollIntoView({ block: 'nearest' });
  };
  J.cierra = function (omit) {
    const cur = g.cur, R = reto(), pt = SJ.puntua(cur.st, cur.fallos, cur.pistas.length, omit, E.descPista);
    const sol = omit ? sim.solucion() : null;
    g.res[g.d][g.i] = { p: pt.p, res: pt.res, prac: pt.prac, pen: pt.pen, pistas: cur.pistas.length, fallos: cur.fallos, omit: !!omit, seg: cur.seg };
    const faltas = { mayus: 0, ifexists: 0, inscols: 0 };
    cur.st.forEach(s => s.l.forEach(l => { faltas[l]++; }));
    const notas = [];
    if (faltas.mayus) notas.push(faltas.mayus + (faltas.mayus === 1 ? ' sentencia' : ' sentencias') + ' con palabras reservadas en minúsculas.');
    if (faltas.ifexists) notas.push('Faltó IF NOT EXISTS / IF EXISTS.');
    if (faltas.inscols) notas.push('INSERT sin lista de columnas.');
    g.i++; g.cur = nuevoCur(); g.ini = g.log.length;
    const ultimo = g.i >= dia().retos.length;
    if (ultimo) g.fase = 'findia';
    UI.guardar();
    SJ.Son.tocar(omit ? 'pista' : 'resuelto');
    const v = UI.ventana('<h2>' + (omit ? 'Solicitud omitida' : 'Solicitud resuelta') + '</h2><p>' + esc(R.titulo) + '</p>' +
      '<div class="caja"><div class="barra-pct"><span>Resultado</span><i><b style="width:' + (pt.res / CFG.PUNTOS_RESULTADO * 100) + '%"></b></i><span>' + pt.res + '/' + CFG.PUNTOS_RESULTADO + '</span></div>' +
      '<div class="barra-pct"><span>Buenas prácticas</span><i><b style="width:' + (pt.prac / CFG.PUNTOS_PRACTICAS * 100) + '%"></b></i><span>' + pt.prac + '/' + CFG.PUNTOS_PRACTICAS + '</span></div>' +
      (pt.pen ? '<p class="txt-aviso">Pistas usadas: -' + pt.pen + ' puntos.</p>' : '') +
      '<p>Puntaje de la solicitud: <b class="oro">' + pt.p + ' / 100</b></p></div>' +
      (notas.length && !omit ? '<div class="caja"><h3>Para mejorar</h3><ul>' + notas.map(n => '<li>' + esc(n) + '</li>').join('') + '</ul></div>' : '') +
      (!omit && !notas.length && !cur.fallos && !pt.pen ? '<p class="txt-ok">Trabajo limpio: resultado correcto y normas respetadas.</p>' : '') +
      (sol ? '<div class="nota"><h3>Así lo resolvió ' + esc(E.jefe.nombre) + '</h3><pre>' + esc(sol.join('\n')) + '</pre></div>' : '') +
      '<div class="fila"><button class="btn" id="cr-ok" data-foco>' + (ultimo ? 'Cerrar el día' : 'Siguiente solicitud') + '</button></div>');
    $('#cr-ok', v).onclick = function () {
      UI.cerrar();
      if (ultimo) return J.finDia();
      sim.inicia(g.d, g.i, g.cur.st);
      J.refresca(); J.sistema('--- Nueva solicitud en tu bandeja ---'); SJ.Son.tocar('nueva');
      J.charlaSiToca();
    };
  };

  /* ---------- fin del dia ---------- */
  J.finDia = function () {
    SJ.Son.tocar('findia');
    const d = dia(), rs = g.res[g.d], prom = Math.round(rs.reduce((a, r) => a + r.p, 0) / rs.length), fin = g.d >= E.dias.length - 1;
    const v = UI.ventana('<h2>Fin del ' + esc(d.nombre.toLowerCase()) + '</h2><table class="dias"><thead><tr><th>Solicitud</th><th>Puntaje</th><th>Pistas</th><th>Tiempo</th></tr></thead><tbody>' +
      d.retos.map((R, k) => '<tr><td>' + esc(R.titulo) + '</td><td class="' + (rs[k].omit ? 'txt-mal' : rs[k].p >= 80 ? 'txt-ok' : 'txt-aviso') + '">' + (rs[k].omit ? 'omitida' : rs[k].p) + '</td><td>' + rs[k].pistas + '</td><td>' + UI.tiempo(rs[k].seg) + '</td></tr>').join('') +
      '</tbody></table><p>Promedio del día: <b class="oro">' + prom + '%</b> &middot; Tiempo: ' + UI.tiempo(g.seg[g.d]) + ' de ' + UI.tiempo(d.min * 60) + ' sugeridos.</p>' +
      '<p class="tenue">' + esc(E.jefe.nombre) + ': "' + esc(prom >= 90 ? 'Excelente jornada. Así da gusto.' : prom > 80 ? 'Buen trabajo. Mañana subimos la dificultad.' : prom >= 60 ? 'Cumpliste, pero revisa tu libreta antes de mañana.' : 'Día difícil. Repasa los apuntes: mañana necesito más precisión.') + '"</p>' +
      '<div class="fila"><button class="btn" id="fd-ok" data-foco>' + (fin ? 'Ver mi reporte semanal' : 'Ir al ' + E.dias[g.d + 1].nombre.toLowerCase()) + '</button></div>', true);
    $('#fd-ok', v).onclick = function () {
      UI.cerrar();
      if (fin) {
        const n = new Date(), p2 = x => (x < 10 ? '0' : '') + x;
        g.fase = 'reporte'; g.fin = n.getFullYear() + '-' + p2(n.getMonth() + 1) + '-' + p2(n.getDate()) + ' ' + p2(n.getHours()) + ':' + p2(n.getMinutes());
        UI.guardar(); clearInterval(reloj); return J.reporte();
      }
      g.d++; g.i = 0; g.cur = nuevoCur(); g.ini = g.log.length; g.sel = false; g.pistasDia = 0; g.fase = 'trabajo';
      sim.inicia(g.d, g.i, g.cur.st); sim.E.sel = false;
      UI.guardar(); J.pinta(); J.charlaSiToca();
    };
  };

  /* ---------- reporte semanal ---------- */
  J.reporte = function () {
    clearInterval(reloj);
    const S = UI.S, al = S.al, inf = SJ.informe(g, E), v = g.viol, it = g.integ;
    const cod = SJ.codigoReporte(al.id, g.esc, g.intento, inf.pct, g.fin.slice(0, 10));
    if (!g.sello) SJ.Son.tocar(inf.aprobado ? 'aprobado' : 'reprobado');
    const color = inf.aprobado ? 'txt-ok' : inf.pct >= 60 ? 'txt-aviso' : 'txt-mal';
    const barra = h => '<div class="barra-pct"><span>' + esc(h.nombre) + '</span><i><b class="' + (h.pct >= 80 ? '' : h.pct >= 60 ? 'medio' : 'bajo') + '" style="width:' + h.pct + '%"></b></i><span>' + h.pct + '%</span></div>';
    const linea = (a, b) => '<tr><td>' + esc(a) + '</td><td>' + esc(b) + '</td></tr>';
    let cierre;
    if (!g.sello) cierre = '<p>Muestra esta pantalla a tu docente. Solo con su sello el reporte queda presentado.</p><div class="fila"><button class="btn oro" id="rp-sello">Sellar reporte (docente)</button></div>';
    else if (inf.aprobado) cierre = '<div class="fila"><span class="sello">REPORTE<br>PRESENTADO</span><p>Superaste el ' + CFG.APROBACION + '%. Ya puedes trabajar en otra empresa.</p></div><div class="fila"><button class="btn ok" id="rp-otra">Elegir otra empresa</button></div>';
    else cierre = '<div class="fila"><span class="sello">REPORTE<br>PRESENTADO</span><p>Para cambiar de empresa necesitas más de ' + CFG.APROBACION + '%. Puedes repetir la semana: los datos serán distintos.</p></div><div class="fila"><button class="btn" id="rp-rep">Repetir la semana</button></div>';
    UI.pinta('<div class="centro reporte" style="max-width:1040px"><div class="px form rep-cab"><div style="display:grid;gap:8px"><h2>Reporte semanal &middot; ' + esc(E.nombre) + '</h2>' +
      '<p>' + esc(al.nom) + ' ' + esc(al.ape) + ' &middot; ID ' + esc(al.id) + '</p><p class="tenue">Intento ' + g.intento + ' &middot; Cerrado el ' + esc(fechaCorta(g.fin) + g.fin.slice(10)) + ' &middot; ' + inf.retos + ' solicitudes</p>' +
      '<p>Código de verificación: <span class="codigo">' + cod + '</span></p></div>' +
      '<div style="text-align:center"><div class="rep-pct ' + color + '">' + inf.pct + '%</div><span class="chip">' + (inf.aprobado ? 'APROBADO' : 'NO SUPERA EL ' + CFG.APROBACION + '%') + '</span></div></div>' +
      '<div class="rep-grid"><div class="caja"><h3>Por día</h3><table class="dias"><thead><tr><th>Día</th><th>Puntaje</th><th>Tiempo</th><th>Sugerido</th></tr></thead><tbody>' +
      inf.dias.map(x => '<tr><td>' + esc(x.nombre) + '</td><td>' + x.pct + '%</td><td class="' + (x.seg > x.min * 60 ? 'txt-aviso' : '') + '">' + UI.tiempo(x.seg) + '</td><td>' + UI.tiempo(x.min * 60) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<div class="caja"><h3>Por habilidad</h3>' + inf.habs.map(barra).join('') + '</div>' +
      '<div class="caja"><h3 class="txt-ok">Logros</h3><ul>' + inf.logros.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' +
      '<div class="caja"><h3 class="txt-aviso">Por mejorar</h3><ul>' + inf.mejoras.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' +
      '<div class="caja"><h3>Buenas prácticas</h3><table class="dias"><tbody>' + linea('Sentencias con minúsculas', v.mayus) + linea('Sin IF [NOT] EXISTS', v.ifexists) + linea('INSERT sin columnas', v.inscols) +
      linea('Olvidos del punto y coma', v.sinpc) + linea('Bloqueos del modo seguro', v.safe) + linea('Errores de MySQL', v.err) + '</tbody></table></div>' +
      '<div class="caja"><h3>Apoyo e integridad</h3><table class="dias"><tbody>' + linea('Pistas usadas', inf.pistas) + linea('Solicitudes omitidas', inf.omitidos) + linea('Entregas incorrectas', inf.fallos) +
      linea('Salidas de la ventana', it.salidas + ' (' + UI.tiempo(it.fuera) + ' fuera)') + linea('Intentos de pegar', it.pega) + linea('Intentos de copiar', it.copia) + '</tbody></table></div></div>' +
      '<div class="px form">' + cierre + '</div></div>');
    const sello = $('#rp-sello'), otra = $('#rp-otra'), rep = $('#rp-rep');
    if (sello) sello.onclick = function () {
      UI.pideClave('Sello del docente', 'El docente confirma que revisó este reporte (código ' + cod + ', ' + inf.pct + '%).', function (clave) {
        g.sello = true; UI.guardar();
        // con el tercer reporte aprobado, la misma clave del docente habilita el nivel intermedio
        if (clave && inf.aprobado && SJ.Cripto.disponible() && SJ.ORDEN_ESCENARIOS.every(id => id === g.esc || S.hechas[id])) SJ.Cripto.abrir(clave).then(ck => { S.llave = ck; UI.guardar(); }).catch(() => { /* se pedira al abrir la empresa */ });
        J.reporte();
      });
    };
    if (otra) otra.onclick = function () { S.hechas[g.esc] = { pct: inf.pct, cod: cod, fecha: g.fin }; S.g = null; UI.guardar(); UI.empresas(); };
    if (rep) rep.onclick = function () {
      UI.confirma('Repetir la semana', 'Empezarás de nuevo en ' + esc(E.nombre) + ' con datos diferentes. Este reporte ya no estará disponible.', 'Repetir', function () { J.nueva(g.esc, g.intento + 1); });
    };
  };

  UI.arrancar();
})();

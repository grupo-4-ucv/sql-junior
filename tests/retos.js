// Prueba de todos los retos con varias semillas: node tests/retos.js [cantidad_de_semillas]
global.SJ = {};
['config', 'engine', 'datos', 'charlas', 'esc_autoandes', 'esc_mercapixel', 'esc_novatel', 'nucleo'].forEach(m => { try { require('../js/' + m + '.js'); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; } });
const init = require('../vendor/sql-asm.js');
const cw = console.warn; console.warn = () => {};
const N = +(process.argv[2] || 12), VER = process.argv[3] === 'v';
init().then(SQL => {
  console.warn = cw;
  let fallos = 0; const fallo = (...a) => { fallos++; console.log('FALLO', ...a); };
  const volcado = E => JSON.stringify(Array.from(E.cat.values()).map(t => [t.name, t.cols.map(c => c.name + ':' + c.type), E.raw('SELECT * FROM "' + t.name + '"')]));
  for (const id of SJ.ORDEN_ESCENARIOS) {
    const esc = SJ.escenarios[id]; if (!esc) { console.log('(sin escenario ' + id + ')'); continue; }
    const t0 = Date.now(); let filasRef = {};
    for (let s = 0; s < N; s++) {
      const semilla = 'ALU' + (1000 + s * 37) + '|' + id + '|1';
      let sim;
      try { sim = new SJ.Sim(SQL, esc, semilla); } catch (e) { fallo(id, semilla, 'construir:', e.stack.split('\n').slice(0, 4).join(' ')); continue; }
      if (s === 0) console.log(id + ': tablas ' + sim.E.cat.size + ', filas ' + Array.from(sim.E.cat.values()).reduce((a, t) => a + sim.E.scalar('SELECT COUNT(*) FROM "' + t.name + '"'), 0));
      const log = [];
      esc.dias.forEach((dia, d) => dia.retos.forEach((R, i) => {
        const tag = id + ' ' + semilla + ' ' + R.id;
        try {
          sim.inicia(d, i, []); sim.E.sel = true;
          if (typeof R.texto === 'function') R.texto(sim.f);
          R.pistas.forEach(p => typeof p === 'function' && p(sim.f));
          if (R.pistas.length < 2) fallo(tag, 'menos de 2 pistas');
          let v = sim.evalua();
          if (v.ok) fallo(tag, 'pasa sin resolver');
          if (R.ref) {
            sim.corre('SELECT 1;'); if (sim.evalua().ok) fallo(tag, 'acepta SELECT 1');
            const exp = sim.E.quiet(R.ref(sim.f));
            if (s === 0) filasRef[R.id] = exp.rows.length;
            if (exp.rows.length < 1) fallo(tag, 'referencia sin filas');
            if (exp.rows.length > 60) fallo(tag, 'referencia con demasiadas filas: ' + exp.rows.length);
            if (R.orden && /LIMIT/.test(R.ref(sim.f))) { const ks = exp.rows.map(r => R.orden.map(k => r[k]).join('|')); if (new Set(ks).size !== ks.length) fallo(tag, 'empate en la clave de orden'); }
            // una consulta desordenada no debe pasar si se pide orden
            if (R.orden && exp.rows.length > 1) { sim.ult = { cols: exp.cols, rows: exp.rows.slice().reverse() }; if (sim.evalua().ok) fallo(tag, 'acepta orden invertido'); }
          }
          for (const q of sim.solucion()) {
            const o = sim.corre(q), mal = o.res.find(r => !r.ok);
            if (mal) fallo(tag, 'solucion con error', mal.err.texto, q);
            if (o.res.some(r => r.lint.length)) fallo(tag, 'la solucion oficial rompe una norma', JSON.stringify(o.res.map(r => r.lint)));
            log.push(...o.nuevos);
          }
          v = sim.evalua();
          if (!v.ok) fallo(tag, 'la solucion no pasa:', v.msgs.join(' / '));
        } catch (e) { fallo(tag, 'excepcion', e.stack.split('\n').slice(0, 3).join(' ')); }
      }));
      // repeticion determinista
      const antes = volcado(sim.E);
      sim.restaura(log, log.length, 4, 4, [], true);
      if (volcado(sim.E) !== antes) fallo(id, semilla, 'la repeticion del registro no reproduce la base');
      sim.E.db.close();
    }
    console.log(id + ': ' + N + ' semillas en ' + (Date.now() - t0) + ' ms. Filas de referencia:', JSON.stringify(filasRef));
  }
  console.log(fallos ? 'FALLOS: ' + fallos : 'RETOS OK');
  process.exit(fallos ? 1 : 0);
});

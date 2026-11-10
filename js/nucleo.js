/* SQL Junior - nucleo del juego (sin interfaz): simulacion, validador de retos, puntaje e informe final. */
(function (root) {
  'use strict';
  const SJ = root.SJ = root.SJ || {};
  SJ.escenarios = SJ.escenarios || {};
  SJ.ORDEN_ESCENARIOS = ['autoandes', 'mercapixel', 'novatel'];

  /* ---------- comparacion de resultados ---------- */
  const norma = v => v == null ? '\u0000' : typeof v === 'number' ? 'n' + (+v.toFixed(4)) : 's' + String(v);

  /* Compara el resultado del estudiante con el de referencia. No importan los nombres ni el orden de las columnas;
     si el reto pide un orden, "orden" indica las columnas (de la referencia) cuya secuencia debe respetarse. */
  SJ.compara = function (exp, got, orden) {
    const falla = m => ({ ok: false, msgs: [m] });
    const ne = exp.cols.length, ng = got.cols.length;
    if (ng !== ne) return falla('Tu resultado tiene ' + ng + (ng === 1 ? ' columna' : ' columnas') + ' y la solicitud pide ' + ne + '. Devuelve solo lo que te pidieron.');
    if (got.rows.length !== exp.rows.length) return falla(got.rows.length > exp.rows.length
      ? 'Tu resultado trae más filas de las que corresponden. Revisa si te falta alguna condición.'
      : 'Tu resultado trae menos filas de las que corresponden. Revisa si alguna condición es demasiado estricta.');
    const E = exp.cols.map((_, j) => exp.rows.map(r => norma(r[j]))), G = got.cols.map((_, j) => got.rows.map(r => norma(r[j])));
    const orden_ = a => a.slice().sort().join('\u0001');
    const Es = E.map(orden_), Gs = G.map(orden_);
    if (Es.some(e => Gs.indexOf(e) < 0)) return falla('La cantidad de filas coincide, pero hay columnas con valores distintos a los solicitados. Revisa qué columnas devuelves, tus condiciones y los cálculos.');
    const usado = [], perm = [];
    const filasE = exp.rows.map((_, r) => E.map(c => c[r]).join('\u0002')).sort();
    const prueba = i => {
      if (i === ne) { const b = got.rows.map((_, r) => perm.map(j => G[j][r]).join('\u0002')).sort(); return filasE.every((x, k) => x === b[k]); }
      for (let j = 0; j < ng; j++) {
        if (usado[j] || Gs[j] !== Es[i]) continue;
        usado[j] = true; perm[i] = j;
        if (prueba(i + 1)) return true;
        usado[j] = false;
      }
      return false;
    };
    if (!prueba(0)) return falla('Las columnas tienen los valores correctos, pero no están combinadas en las mismas filas. Revisa cómo relacionas los datos.');
    if (orden && orden.length) {
      const bien = orden.every(k => E[k].every((v, r) => v === G[perm[k]][r]));
      if (!bien) return falla('Los datos son correctos, pero el orden no es el que pide la solicitud.');
    }
    return { ok: true, msgs: [] };
  };

  /* ---------- puntaje de un reto ---------- */
  SJ.puntua = function (st, fallos, pistas, omitido) {
    const C = SJ.CFG;
    if (omitido) return { p: 0, res: 0, prac: 0, pen: 0 };
    const res = Math.max(0, C.PUNTOS_RESULTADO - Math.min(C.MAX_DESCUENTO_FALLO, fallos * C.DESCUENTO_FALLO));
    const tot = st.length, malas = st.filter(s => s.l.length).length;
    const prac = Math.round(C.PUNTOS_PRACTICAS * (tot ? 1 - malas / tot : 1));
    const pen = pistas * C.DESCUENTO_PISTA;
    return { p: Math.max(0, Math.round(res + prac - pen)), res: res, prac: prac, pen: pen };
  };

  /* ---------- simulacion ---------- */
  class Sim {
    constructor(SQL, esc, semilla) { this.SQL = SQL; this.esc = esc; this.semilla = semilla; this.E = null; this.arma(); }
    arma() {
      if (this.E) { try { this.E.db.close(); } catch (e) { /* nada */ } }
      this.E = new SJ.Engine(this.SQL, { db: this.esc.db });
      this.E.sel = true;
      this.f = this.esc.construir(this.E, new SJ.Rng(this.semilla));
      this.E.sel = false;
      this.ult = null; this.pre = {}; this.st = []; this.reto = null; this.d = 0; this.i = 0;
    }
    dia(d) { this.E.now = this.esc.dias[d].fecha + ' 09:00:00'; }
    ctx() {
      const E = this.E, lc = s => String(s).toLowerCase();
      return {
        f: this.f, pre: this.pre, st: this.st, hoy: E.now.slice(0, 10),
        q: (s, p) => E.scalar(s, p),
        filas: (s, p) => E.raw(s, p),
        T: n => E.cat.get(lc(n)) || null,
        nTablas: () => E.cat.size,
        col: (t, c) => { const x = E.cat.get(lc(t)); return x ? x.cols.find(k => lc(k.name) === lc(c)) || null : null; }
      };
    }
    inicia(d, i, st) {
      this.d = d; this.i = i; this.reto = this.esc.dias[d].retos[i];
      this.dia(d); this.st = st || []; this.ult = null; this.pre = {};
      if (this.reto && this.reto.pre) this.pre = this.reto.pre(this.ctx());
    }
    /* Reconstruye la base desde la semilla y repite las sentencias guardadas. */
    restaura(log, ini, d, i, st, sel) {
      this.arma();
      const n = log.length, corte = Math.min(ini, n);
      for (let k = 0; k <= n; k++) {
        if (k === corte) this.inicia(d, i, st);
        if (k < n) { this.dia(log[k].d); this.E.sel = true; this.E.exec(log[k].q); }
      }
      this.dia(d); this.E.sel = !!sel;
    }
    corre(texto) {
      const res = this.E.exec(texto), nuevos = [];
      for (const r of res) {
        if (!r.ok) continue;
        this.st.push({ t: r.type, tb: String(r.table || '').toLowerCase(), s: r.sub || '', l: r.lint.map(x => x.id) });
        if (r.mut) nuevos.push({ d: this.d, q: r.raw });
        if (r.type === 'select') this.ult = r.out;
      }
      return { res: res, nuevos: nuevos };
    }
    evalua() {
      const R = this.reto;
      if (R.ref) {
        if (!this.ult) return { ok: false, sinIntento: true, msgs: ['Primero ejecuta la consulta que responde la solicitud. Se evalúa tu último SELECT.'] };
        return SJ.compara(this.E.quiet(R.ref(this.f)), this.ult, R.orden);
      }
      const mal = R.check(this.ctx()).filter(x => !x[0]).map(x => x[1]);
      return { ok: !mal.length, msgs: mal };
    }
    solucion() { const R = this.reto; return R.sol ? R.sol(this.f) : [R.ref(this.f)]; }
    /* Aplica la solucion oficial (cuando el estudiante omite el reto). Devuelve las sentencias que cambian la base. */
    resuelve() {
      const sel = this.E.sel, nuevos = [];
      this.E.sel = true;
      for (const q of this.solucion()) {
        const o = this.corre(q), mal = o.res.find(r => !r.ok);
        if (mal) { this.E.sel = sel; throw new Error('Solucion oficial con error: ' + (mal.err.texto || '') + ' :: ' + q); }
        nuevos.push.apply(nuevos, o.nuevos);
      }
      this.E.sel = sel;
      return nuevos;
    }
  }
  SJ.Sim = Sim;

  /* ---------- informe final ---------- */
  SJ.informe = function (g, esc) {
    const H = SJ.HABILIDADES, C = SJ.CFG, prom = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
    const todos = [], porHab = {}, dias = [];
    let pistas = 0, omitidos = 0, fallos = 0, perfectos = 0;
    esc.dias.forEach((dia, d) => {
      const rs = g.res[d] || [], pts = [];
      dia.retos.forEach((reto, i) => {
        const r = rs[i]; if (!r) return;
        pts.push(r.p); todos.push(r.p);
        (porHab[reto.hab] = porHab[reto.hab] || []).push(r.p);
        pistas += r.pistas; fallos += r.fallos; if (r.omit) omitidos++; if (r.p === 100) perfectos++;
      });
      dias.push({ nombre: dia.nombre, pct: Math.round(prom(pts)), seg: g.seg[d] || 0, min: dia.min, hechos: pts.length, total: dia.retos.length });
    });
    const pct = Math.round(prom(todos) * 10) / 10;
    const habs = Object.keys(H).filter(k => porHab[k]).map(k => ({ k: k, nombre: H[k], pct: Math.round(prom(porHab[k])) }));
    const logros = [], mejoras = [], v = g.viol;
    habs.forEach(h => {
      if (h.pct >= 90) logros.push('Dominas ' + h.nombre + ' (' + h.pct + '%).');
      else if (h.pct < 70) mejoras.push('Refuerza ' + h.nombre + ': obtuviste ' + h.pct + '%. Repasa esas notas de tu libreta.');
    });
    if (perfectos) logros.push(perfectos + (perfectos === 1 ? ' reto resuelto' : ' retos resueltos') + ' con puntaje perfecto.');
    if (!pistas) logros.push('Completaste la semana sin pedir pistas.');
    if (!v.mayus && !v.ifexists && !v.inscols) logros.push('Respetaste todas las normas de escritura del equipo.');
    if (!v.safe) logros.push('Nunca intentaste un UPDATE o DELETE sin WHERE.');
    if (dias.every(x => x.seg <= x.min * 60)) logros.push('Terminaste cada día dentro del tiempo sugerido.');
    if (v.mayus) mejoras.push('Escribe las palabras reservadas y funciones en MAYÚSCULAS: ' + v.mayus + (v.mayus === 1 ? ' sentencia tuvo' : ' sentencias tuvieron') + ' minúsculas.');
    if (v.ifexists) mejoras.push('Usa IF NOT EXISTS / IF EXISTS al crear o eliminar tablas (faltó ' + v.ifexists + (v.ifexists === 1 ? ' vez).' : ' veces).'));
    if (v.inscols) mejoras.push('Escribe la lista de columnas en cada INSERT (faltó ' + v.inscols + (v.inscols === 1 ? ' vez).' : ' veces).'));
    if (v.sinpc >= 3) mejoras.push('Olvidaste el punto y coma final ' + v.sinpc + ' veces.');
    if (v.safe) mejoras.push('El modo seguro bloqueó ' + v.safe + (v.safe === 1 ? ' UPDATE o DELETE' : ' sentencias UPDATE o DELETE') + ' sin WHERE. En un servidor real eso habría afectado toda la tabla.');
    if (omitidos) mejoras.push('Omitiste ' + omitidos + (omitidos === 1 ? ' reto' : ' retos') + ': valen 0 puntos. Vuelve a intentarlos con la libreta a la mano.');
    if (fallos >= 5) mejoras.push('Hubo ' + fallos + ' entregas incorrectas. Antes de entregar, revisa el resultado contra lo que pide la solicitud.');
    if (v.err >= 15) mejoras.push('Tus sentencias devolvieron ' + v.err + ' errores. Lee el mensaje de error completo: casi siempre indica dónde está el problema.');
    if (!mejoras.length) mejoras.push('Sin observaciones importantes. Mantén ese nivel.');
    if (!logros.length) logros.push('Completaste la semana de trabajo.');
    return { pct: pct, aprobado: pct > C.APROBACION, dias: dias, habs: habs, logros: logros, mejoras: mejoras, pistas: pistas, omitidos: omitidos, fallos: fallos, retos: todos.length };
  };
})(typeof window !== 'undefined' ? window : global);

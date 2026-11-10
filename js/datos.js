/* SQL Junior - generador de datos: azar con semilla (cada estudiante recibe datos distintos) y listas base. */
(function (root) {
  'use strict';
  const SJ = root.SJ = root.SJ || {};

  class Rng {
    constructor(semilla) {
      let h = 1779033703 ^ semilla.length;
      for (let i = 0; i < semilla.length; i++) { h = Math.imul(h ^ semilla.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
      this.a = (h ^ (h >>> 16)) >>> 0;
    }
    n() { let t = (this.a += 0x6D2B79F5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
    int(a, b) { return a + Math.floor(this.n() * (b - a + 1)); }
    pick(arr) { return arr[Math.floor(this.n() * arr.length)]; }
    prob(p) { return this.n() < p; }
    mezcla(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.n() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    varios(arr, k) { return this.mezcla(arr).slice(0, k); }
    dinero(a, b) { return Math.round((a + this.n() * (b - a)) * 100) / 100; }
    fecha(a, b) { return SJ.masDias(a, this.int(0, SJ.diasEntre(a, b))); }
    digitos(k) { let s = ''; for (let i = 0; i < k; i++) s += this.int(0, 9); return s; }
  }
  SJ.Rng = Rng;

  const ms = iso => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
  SJ.masDias = (iso, n) => new Date(ms(iso) + n * 864e5).toISOString().slice(0, 10);
  SJ.diasEntre = (a, b) => Math.round((ms(b) - ms(a)) / 864e5);

  const D = SJ.datos = {};
  D.NOM_M = 'Luis Carlos Jorge Miguel Jose Juan Pedro Raul Victor Cesar Diego Marco Oscar Hugo Ivan Renzo Bruno Fabian Andres Sergio Ricardo Manuel Alberto Javier Julio Walter Edgar Percy Wilmer Gustavo Rodrigo Martin Franco Alonso Mateo Joaquin'.split(' ');
  D.NOM_F = 'Maria Rosa Ana Carmen Lucia Elena Patricia Silvia Gloria Teresa Milagros Karina Paola Daniela Andrea Valeria Camila Fiorella Ximena Rocio Yolanda Norma Julia Diana Claudia Vanessa Mariela Katherine Luz Sonia Flor Jimena Brenda Nicole Sofia Isabel'.split(' ');
  D.APE = 'Quispe Flores Rojas Huaman Garcia Mendoza Chavez Ramos Vargas Castillo Torres Gutierrez Salazar Paredes Espinoza Cordova Aguilar Medina Campos Vega Reyes Delgado Herrera Cabrera Zapata Linares Montes Bravo Carrasco Pacheco Villanueva Palomino Yupanqui Ccori Tello Arce Bustamante Solis Lozano Figueroa Navarro Benites Calderon Ponce Rivas Cuadros Alvarado Ibarra Meza Prado'.split(' ');
  D.DISTRITOS = ['Miraflores', 'San Borja', 'Surquillo', 'San Isidro', 'La Molina', 'Los Olivos', 'Chorrillos', 'Barranco', 'Pueblo Libre', 'San Miguel', 'Magdalena', 'Jesus Maria', 'Independencia', 'La Victoria'];
  D.CALLES = 'Los Alamos|Las Begonias|Los Pinos|Grau|Bolognesi|Tupac Amaru|Los Incas|Las Palmeras|San Martin|Arequipa|Brasil|La Marina|Los Jazmines|Primavera|El Sol|Angamos|Larco|Pardo|Huaylas|Colonial'.split('|');
  D.DOMINIOS = ['gmail.com', 'gmail.com', 'gmail.com', 'hotmail.com', 'hotmail.com', 'outlook.com', 'yahoo.es'];

  /* Tres formas mal escritas de un distrito: mayusculas con espacio final, minusculas con espacios al inicio y un error de tipeo. */
  D.variantes = d => [d.toUpperCase() + ' ', '  ' + d.toLowerCase(), d.slice(0, 3) + d.slice(4)];

  /* Herramientas para armar una base: nombres, documentos y telefonos sin repetir. */
  D.fabrica = function (R) {
    const usados = { dni: new Set(), tel: new Set(), correo: new Set(), cod: new Set() };
    const unico = (k, f) => { let v; do { v = f(); } while (usados[k].has(v)); usados[k].add(v); return v; };
    const F = {
      persona() {
        const fem = R.prob(0.5), pool = fem ? D.NOM_F : D.NOM_M;
        let nom = R.pick(pool);
        if (R.prob(0.3)) { const o = R.pick(pool); if (o !== nom) nom += ' ' + o; }
        return { nombres: nom, apellidos: R.pick(D.APE) + ' ' + R.pick(D.APE), fem: fem };
      },
      dni() { return unico('dni', () => String(R.int(1, 7)) + R.digitos(7)); },
      telefono() { return unico('tel', () => '9' + R.digitos(8)); },
      correo(p, max) {
        return unico('correo', () => {
          const base = (p.nombres.split(' ')[0] + '.' + p.apellidos.split(' ')[0]).toLowerCase();
          const c = base + (R.prob(0.6) ? R.int(1, 99) : '') + '@' + R.pick(D.DOMINIOS);
          return c.length <= (max || 80) ? c : c.slice(c.length - (max || 80));
        });
      },
      codigo(f) { return unico('cod', f); },
      direccion() { return R.pick(['Av.', 'Av.', 'Jr.', 'Calle']) + ' ' + R.pick(D.CALLES) + ' ' + R.int(100, 1999); },
      /* Lista de n distritos donde los "sucios" aparecen con sus tres variantes mal escritas. */
      distritos(n, sucios) {
        const out = [];
        for (const d of sucios) { const v = D.variantes(d); out.push(v[0], v[0], v[0], v[1], v[1], v[2], v[2], d, d, d); }
        while (out.length < n) out.push(R.pick(D.DISTRITOS));
        return R.mezcla(out).slice(0, n);
      },
      sucios() { return R.varios(D.DISTRITOS.filter(d => d.length >= 8), 3); },
      limpio(sucios) { return R.pick(D.DISTRITOS.filter(d => sucios.indexOf(d) < 0)); }
    };
    return F;
  };

  /* Comprobaciones compartidas por los retos de limpieza de distritos. */
  D.listaSql = arr => arr.map(v => "'" + String(v).replace(/'/g, "''") + "'").join(', ');
  D.preDistritos = (c, tabla, sucios) => {
    const o = {};
    sucios.forEach(d => { o[d] = c.q('SELECT COUNT(*) FROM ' + tabla + ' WHERE distrito COLLATE BINARY IN (' + D.listaSql([d].concat(D.variantes(d))) + ')'); });
    return o;
  };
  D.checkDistritos = (c, tabla, sucios) => {
    const fuera = c.q('SELECT COUNT(*) FROM ' + tabla + ' WHERE distrito COLLATE BINARY NOT IN (' + D.listaSql(D.DISTRITOS) + ')');
    const cuadran = sucios.every(d => c.q('SELECT COUNT(*) FROM ' + tabla + " WHERE distrito COLLATE BINARY = '" + d + "'") === c.pre.dist[d]);
    return [
      [fuera === 0, 'Todavía hay distritos que no están escritos exactamente como en la lista oficial. Revisa mayúsculas, espacios y letras faltantes.'],
      [cuadran, 'La cantidad de filas por distrito no cuadra: algún registro terminó en un distrito que no le corresponde.']
    ];
  };
  D.solDistritos = (tabla, sucios) => sucios.map(d => 'UPDATE ' + tabla + " SET distrito = '" + d + "' WHERE distrito IN (" + D.listaSql(D.variantes(d)) + ') OR UPPER(TRIM(distrito)) = ' + "'" + d.toUpperCase() + "';");

  /* Comprueba una tabla creada por el estudiante. spec = { cols: { nombre: { tipo, nn, auto, def } }, pk, fk: [columna, tablaPadre, columnaPadre] } */
  D.checkTabla = (c, nombre, spec) => {
    const t = c.T(nombre), lc = s => String(s).toLowerCase();
    if (!t) return [[false, 'La tabla ' + nombre + ' todavía no existe.']];
    const out = [], col = n => t.cols.find(x => lc(x.name) === n), esPk = n => (t.pk || []).some(p => lc(p) === n);
    const faltan = Object.keys(spec.cols).filter(n => !col(n)), sobran = t.cols.filter(x => !spec.cols[lc(x.name)]).map(x => x.name);
    out.push([!faltan.length, 'Faltan columnas en ' + nombre + ': ' + faltan.join(', ') + '.']);
    out.push([!sobran.length, 'La tabla tiene columnas que no se pidieron: ' + sobran.join(', ') + '.']);
    Object.keys(spec.cols).forEach(n => {
      const k = col(n), s = spec.cols[n]; if (!k) return;
      const real = k.base === 'INT' ? 'INT' : k.base + (k.args.length ? '(' + k.args.join(',') + ')' : '');
      out.push([real === s.tipo, 'La columna ' + n + ' debe ser de tipo ' + s.tipo + '.']);
      if (s.nn) out.push([k.notNull || esPk(n), 'La columna ' + n + ' debe ser obligatoria (NOT NULL).']);
      if (s.auto) out.push([k.auto, 'La columna ' + n + ' debe ser autoincremental (AUTO_INCREMENT).']);
      if (s.def != null) out.push([lc(k.def) === lc(s.def), 'La columna ' + n + ' debe tener ' + s.def + ' como valor por defecto.']);
    });
    out.push([!!t.pk && t.pk.length === 1 && lc(t.pk[0]) === spec.pk, 'La clave primaria debe ser ' + spec.pk + '.']);
    if (spec.fk) out.push([t.fks.some(f => f.cols.length === 1 && lc(f.cols[0]) === spec.fk[0] && lc(f.ref) === spec.fk[1] && lc(f.refCols[0]) === spec.fk[2]),
      'Falta la clave foránea de ' + spec.fk[0] + ' hacia ' + spec.fk[1] + '(' + spec.fk[2] + ').']);
    return out;
  };
  D.DIAS = [['Lunes', '2026-11-16', 25], ['Martes', '2026-11-17', 30], ['Miércoles', '2026-11-18', 35], ['Jueves', '2026-11-19', 45], ['Viernes', '2026-11-20', 45]];
  D.DIAS2 = [['Lunes 1', '2026-11-23', 40], ['Martes 1', '2026-11-24', 40], ['Miércoles 1', '2026-11-25', 45], ['Jueves 1', '2026-11-26', 45], ['Viernes 1', '2026-11-27', 45],
    ['Lunes 2', '2026-11-30', 40], ['Martes 2', '2026-12-01', 45], ['Miércoles 2', '2026-12-02', 45], ['Jueves 2', '2026-12-03', 45], ['Viernes 2', '2026-12-04', 45]];
  D.semana2 = retosPorDia => D.DIAS2.map((d, i) => ({ nombre: d[0], fecha: d[1], min: d[2], retos: retosPorDia[i] }));
  D.masMeses = (iso, n) => { let y = +iso.slice(0, 4), m = +iso.slice(5, 7) - 1 + n; const d = Math.min(+iso.slice(8, 10), 28); y += Math.floor(m / 12); m = ((m % 12) + 12) % 12; return y + '-' + (m < 9 ? '0' : '') + (m + 1) + '-' + (d < 10 ? '0' : '') + d; };
  D.semana = retosPorDia => D.DIAS.map((d, i) => ({ nombre: d[0], fecha: d[1], min: d[2], retos: retosPorDia[i] }));
})(typeof window !== 'undefined' ? window : global);

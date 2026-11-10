/* SQL Junior - motor: capa de compatibilidad MySQL sobre SQLite (sql.js).
   Interpreta la sintaxis de MySQL, mantiene su propio catalogo de tablas y devuelve errores con el formato de MySQL. */
(function (root) {
  'use strict';
  const SJ = root.SJ = root.SJ || {};
  const W = s => new Set(s.trim().split(/\s+/));
  const KW = W(`SELECT FROM WHERE AND OR NOT NULL IS IN BETWEEN LIKE AS DISTINCT ORDER BY GROUP HAVING LIMIT OFFSET ASC DESC
    INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE DATABASE ALTER DROP TRUNCATE ADD COLUMN MODIFY CHANGE RENAME TO
    PRIMARY KEY FOREIGN REFERENCES CONSTRAINT UNIQUE INDEX DEFAULT AUTO_INCREMENT IF EXISTS USE SHOW TABLES DATABASES
    DESCRIBE EXPLAIN JOIN INNER LEFT RIGHT OUTER CROSS NATURAL ON USING UNION ALL CASE WHEN THEN ELSE END TRUE FALSE
    UNSIGNED CHECK CASCADE RESTRICT INTERVAL REGEXP DIV XOR WITH TEMPORARY VIEW START TRANSACTION COMMIT ROLLBACK OVER PARTITION`);
  const FUNCS = W(`COUNT SUM AVG MIN MAX ROUND UPPER LOWER TRIM LTRIM RTRIM CONCAT CONCAT_WS LENGTH CHAR_LENGTH REPLACE
    SUBSTRING SUBSTR LEFT RIGHT NOW CURDATE YEAR MONTH DAY DATEDIFF DATE_FORMAT IFNULL COALESCE NULLIF IF ABS CEIL
    CEILING FLOOR MOD DATE DATE_ADD DATE_SUB TIMESTAMPDIFF MONTHNAME DAYNAME DAYOFWEEK GROUP_CONCAT UCASE LCASE ISNULL
    DATABASE VERSION USER LPAD RPAD REVERSE INSTR LOCATE POW POWER SQRT TRUNCATE FORMAT CAST
    ROW_NUMBER RANK DENSE_RANK LAG LEAD GREATEST LEAST EXISTS`);
  const INTT = W('INT INTEGER TINYINT SMALLINT MEDIUMINT BIGINT BOOLEAN BOOL BIT YEAR');
  const NUMT = W('DECIMAL NUMERIC FLOAT DOUBLE REAL DEC');
  const DATET = W('DATE DATETIME TIMESTAMP TIME');
  const TXTT = W('CHAR VARCHAR TEXT TINYTEXT MEDIUMTEXT LONGTEXT ENUM JSON BLOB');
  const TYPES = new Set([...INTT, ...NUMT, ...DATET, ...TXTT]);
  const UNITS = W('DAY WEEK MONTH YEAR HOUR MINUTE SECOND');
  const ORA = { VARCHAR2: 'VARCHAR(n)', NVARCHAR2: 'VARCHAR(n)', NUMBER: 'INT o DECIMAL(p,s)', CLOB: 'TEXT', NCHAR: 'CHAR(n)' };
  const OPMAP = { '&&': 'AND', '||': 'OR', '<=>': 'IS', '/': '*1.0/' };
  const FNMAP = {
    LEFT: 'my_left', RIGHT: 'my_right', IF: 'iif', NOW: 'my_now', SYSDATE: 'my_now', CURDATE: 'my_curdate', DATE_ADD: 'my_date_add',
    ADDDATE: 'my_date_add', DATE_SUB: 'my_date_sub', SUBDATE: 'my_date_sub', TRUNCATE: 'my_truncate', CHAR_LENGTH: 'length',
    CHARACTER_LENGTH: 'length', UCASE: 'upper', LCASE: 'lower', TIMESTAMPDIFF: 'my_tsdiff', GREATEST: 'max', LEAST: 'min'
  };
  const FNBACK = { my_left: 'LEFT', my_right: 'RIGHT', iif: 'IF', my_now: 'NOW', my_curdate: 'CURDATE', my_date_add: 'DATE_ADD', my_date_sub: 'DATE_SUB', my_truncate: 'TRUNCATE', my_tsdiff: 'TIMESTAMPDIFF' };
  const IMPL = { int: '0', num: '0', txt: "''", date: "'0000-00-00'" };
  const TIPS = {
    1046: 'Primero elige la base de datos: USE nombre_base;',
    1049: 'Esa base de datos no existe. Mira las disponibles con SHOW DATABASES;',
    1050: 'La tabla ya existe. Con IF NOT EXISTS evitas este error.',
    1051: 'La tabla no existe. Con IF EXISTS evitas este error.',
    1052: 'La columna existe en más de una tabla del JOIN: escribe tabla.columna.',
    1054: 'Esa columna no existe en la tabla. Revisa los nombres con DESCRIBE tabla;',
    1060: 'Ya hay una columna con ese nombre en la tabla.',
    1062: 'Ya existe una fila con ese valor en una columna que no admite repetidos.',
    1064: 'Error de sintaxis: revisa la palabra que señala el mensaje y lo que está justo antes.',
    1048: 'Esa columna es obligatoria (NOT NULL): necesita un valor.',
    1111: 'Las funciones de agregación (COUNT, SUM, AVG...) no van en WHERE: usa HAVING.',
    1136: 'La cantidad de valores no coincide con la cantidad de columnas.',
    1146: 'La tabla no existe. Revisa el nombre con SHOW TABLES;',
    1175: 'Modo seguro: UPDATE y DELETE necesitan WHERE. Prueba antes el mismo WHERE con un SELECT.',
    1292: "Las fechas se escriben entre comillas con el formato 'AAAA-MM-DD'.",
    1366: 'Estás guardando texto en una columna numérica.',
    1406: 'El texto es más largo que el tamaño de la columna. Revisa su tipo con DESCRIBE.',
    1451: 'Hay filas en otra tabla que dependen de esta. Primero reasigna o elimina esas filas hijas.',
    1452: 'El valor de la clave foránea no existe en la tabla padre.',
    1701: 'Otra tabla depende de esta mediante una clave foránea: no se puede vaciar con TRUNCATE.',
    3730: 'Otra tabla depende de esta mediante una clave foránea.',
    1822: 'La columna referenciada debe ser clave primaria o única en la tabla padre.',
    1824: 'La tabla referenciada no existe: crea primero la tabla padre.',
    3780: 'La columna hija y la columna padre deben ser del mismo tipo.'
  };
  const lc = s => String(s).toLowerCase();
  const Q = s => '"' + String(s).replace(/"/g, '""') + '"';
  const S = s => "'" + String(s).replace(/'/g, "''") + "'";
  const cls = b => INTT.has(b) ? 'int' : NUMT.has(b) ? 'num' : DATET.has(b) ? 'date' : 'txt';
  const tipo = c => c.type.replace(/^[A-Z]+/, m => m.toLowerCase()).replace(' UNSIGNED', ' unsigned');
  const nfilas = n => n ? n + (n === 1 ? ' row' : ' rows') + ' in set' : 'Empty set';
  const OK0 = 'Query OK, 0 rows affected';

  class MyErr extends Error {
    constructor(code, state, msg, tip) { super(msg); this.code = code; this.state = state; this.tip = tip || ''; }
    get texto() { return 'ERROR ' + this.code + ' (' + this.state + '): ' + this.message; }
  }
  const noSup = () => new MyErr(1235, '42000', "This version of MySQL doesn't yet support this statement",
    'Este simulador cubre: USE, SHOW, DESCRIBE, SELECT, INSERT, UPDATE, DELETE, CREATE / ALTER / DROP TABLE y TRUNCATE.');

  /* ---------- analisis lexico ---------- */
  function tokenize(sql) {
    const T = [], n = sql.length, ws = /\s/, dg = /[0-9]/, al = /[A-Za-z_$À-￿]/, an = /[A-Za-z0-9_$À-￿]/;
    let i = 0;
    while (i < n) {
      const c = sql[i]; let j = i + 1;
      if (ws.test(c)) { i++; continue; }
      if ((c === '-' && sql[i + 1] === '-' && (i + 2 >= n || ws.test(sql[i + 2]))) || c === '#') { j = sql.indexOf('\n', i); i = j < 0 ? n : j; continue; }
      if (c === '/' && sql[i + 1] === '*') { j = sql.indexOf('*/', i + 2); i = j < 0 ? n : j + 2; continue; }
      if (c === "'" || c === '"') {
        let s = '', ok = false;
        while (j < n) {
          const e = sql[j];
          if (e === '\\' && j + 1 < n) { const x = sql[j + 1]; s += x === 'n' ? '\n' : x === 't' ? '\t' : x; j += 2; }
          else if (e === c) { if (sql[j + 1] === c) { s += c; j += 2; } else { j++; ok = true; break; } }
          else { s += e; j++; }
        }
        T.push({ t: 'str', v: s, raw: sql.slice(i, j), pos: i, open: !ok });
      } else if (c === '`') {
        j = sql.indexOf('`', i + 1); const open = j < 0; if (open) j = n;
        T.push({ t: 'id', v: sql.slice(i + 1, j), raw: sql.slice(i, j + 1), pos: i, open: open }); j++;
      } else if (dg.test(c) || (c === '.' && dg.test(sql[i + 1] || ''))) {
        const m = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(sql.slice(i)); j = i + m[0].length;
        T.push({ t: 'num', raw: m[0], v: m[0], pos: i });
      } else if (al.test(c)) {
        while (j < n && an.test(sql[j])) j++;
        const raw = sql.slice(i, j);
        T.push({ t: 'w', raw: raw, u: raw.toUpperCase(), v: raw, pos: i });
      } else {
        const three = sql.substr(i, 3), two = sql.substr(i, 2); let v = c;
        if (three === '<=>') v = three; else if (['<=', '>=', '<>', '!=', '||', '&&', ':='].indexOf(two) >= 0) v = two;
        j = i + v.length; T.push({ t: 'op', v: v, raw: v, pos: i });
      }
      i = j;
    }
    return T;
  }
  function split(sql) {
    const T = tokenize(sql), out = []; let cur = [];
    for (const k of T) {
      if (k.t === 'op' && k.v === ';') { if (cur.length) out.push({ sig: cur, text: sql.slice(cur[0].pos, k.pos + 1), start: cur[0].pos, complete: true }); cur = []; }
      else cur.push(k);
    }
    if (cur.length) out.push({ sig: cur, text: sql.slice(cur[0].pos), start: cur[0].pos, complete: false });
    return out;
  }
  function junta(o) {
    let s = '';
    for (let i = 0; i < o.length; i++) {
      const t = o[i], p = o[i - 1];
      if (i && !(t === ')' || t === ',' || t === '.' || p === '(' || p === '.' || (t === '(' && /[A-Za-z0-9_"]$/.test(p)))) s += ' ';
      s += t;
    }
    return s;
  }

  /* ---------- buenas practicas ---------- */
  function lint(sig, r) {
    const v = [], low = [], ddl = sig[0].u === 'CREATE' || sig[0].u === 'ALTER';
    sig.forEach(function (k, i) {
      if (k.t !== 'w' || k.raw === k.u) return;
      const pv = sig[i - 1], nx = sig[i + 1];
      if ((pv && pv.v === '.') || (nx && nx.v === '.')) return;
      if (KW.has(k.u) || (FUNCS.has(k.u) && nx && nx.v === '(') || (ddl && TYPES.has(k.u))) low.push(k.raw);
    });
    if (low.length) v.push({ id: 'mayus', msg: 'Palabras reservadas en minúsculas: ' + Array.from(new Set(low)).slice(0, 6).join(', ') });
    if (r.type === 'create' && r.ifx === false) v.push({ id: 'ifexists', msg: 'CREATE TABLE sin IF NOT EXISTS' });
    if (r.type === 'drop' && r.ifx === false) v.push({ id: 'ifexists', msg: 'DROP TABLE sin IF EXISTS' });
    if (r.type === 'insert' && r.insCols === false) v.push({ id: 'inscols', msg: 'INSERT sin la lista de columnas' });
    return v;
  }

  /* ---------- cursor sobre los tokens ---------- */
  class Cur {
    constructor(sig, eng) { this.s = sig; this.i = 0; this.e = eng; }
    peek(o) { return this.s[this.i + (o || 0)]; }
    next() { return this.s[this.i++]; }
    end() { return this.i >= this.s.length; }
    isW(u, o) { const k = this.peek(o); return !!k && k.t === 'w' && k.u === u; }
    isV(v, o) { const k = this.peek(o); return !!k && k.t === 'op' && k.v === v; }
    eatW() { for (let n = 0; n < arguments.length; n++) if (!this.isW(arguments[n], n)) return false; this.i += arguments.length; return true; }
    eatV(v) { if (this.isV(v)) { this.i++; return true; } return false; }
    needV(v) { if (!this.eatV(v)) throw this.e.syn(this.peek()); }
    needW(u) { if (!this.eatW(u)) throw this.e.syn(this.peek()); }
    ident() { const k = this.peek(); if (!k || (k.t !== 'w' && k.t !== 'id')) throw this.e.syn(k); this.i++; return k.v; }
    table() { let n = this.ident(); if (this.isV('.')) { this.i++; n = this.ident(); } return n; }
    cols() {
      this.needV('('); const r = [];
      do { r.push(this.ident()); if (this.isV('(')) this.paren(); if (!this.eatW('ASC')) this.eatW('DESC'); } while (this.eatV(','));
      this.needV(')'); return r;
    }
    paren() {
      this.needV('('); const r = []; let dep = 1;
      while (!this.end()) {
        const k = this.s[this.i++];
        if (k.t === 'op' && k.v === '(') dep++;
        if (k.t === 'op' && k.v === ')' && --dep === 0) return r;
        r.push(k);
      }
      throw this.e.syn(undefined);
    }
  }

  /* ---------- motor ---------- */
  class Engine {
    constructor(SQL, opt) {
      this.db = new SQL.Database();
      this.dbName = opt.db;
      this.sel = false;
      this.now = opt.now || '2026-11-16 09:00:00';
      this.cat = new Map();
      this.views = new Map();
      this.idx = [];
      this.tx = false;
      this.st = null;
      this.db.run('PRAGMA foreign_keys=ON');
      this.funciones();
    }

    funciones() {
      const d = this.db, self = this, F = (n, f) => d.create_function(n, f);
      const pd = v => {
        if (v == null) return null;
        const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(String(v));
        return m ? new Date(Date.UTC(+m[1], m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0))) : null;
      };
      const p2 = n => (n < 10 ? '0' : '') + n;
      const fmt = (x, t) => x.getUTCFullYear() + '-' + p2(x.getUTCMonth() + 1) + '-' + p2(x.getUTCDate()) + (t ? ' ' + p2(x.getUTCHours()) + ':' + p2(x.getUTCMinutes()) + ':' + p2(x.getUTCSeconds()) : '');
      const dia = x => Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate());
      const MES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const DIA = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const mueve = (v, n, u) => {
        const x = pd(v); if (!x || n == null) return null;
        const t = String(v).length > 10; n = +n; u = String(u).toUpperCase();
        if (u === 'DAY') x.setUTCDate(x.getUTCDate() + n); else if (u === 'WEEK') x.setUTCDate(x.getUTCDate() + 7 * n);
        else if (u === 'MONTH') x.setUTCMonth(x.getUTCMonth() + n); else if (u === 'YEAR') x.setUTCFullYear(x.getUTCFullYear() + n);
        else if (u === 'HOUR') x.setUTCHours(x.getUTCHours() + n); else if (u === 'MINUTE') x.setUTCMinutes(x.getUTCMinutes() + n); else x.setUTCSeconds(x.getUTCSeconds() + n);
        return fmt(x, t || u === 'HOUR' || u === 'MINUTE' || u === 'SECOND');
      };
      const parte = f => v => { const x = pd(v); return x ? f(x) : null; };
      F('my_now', () => self.now);
      F('my_curdate', () => self.now.slice(0, 10));
      F('year', parte(x => x.getUTCFullYear()));
      F('month', parte(x => x.getUTCMonth() + 1));
      F('day', parte(x => x.getUTCDate()));
      F('dayofmonth', parte(x => x.getUTCDate()));
      F('hour', parte(x => x.getUTCHours()));
      F('minute', parte(x => x.getUTCMinutes()));
      F('quarter', parte(x => Math.floor(x.getUTCMonth() / 3) + 1));
      F('dayofweek', parte(x => x.getUTCDay() + 1));
      F('weekday', parte(x => (x.getUTCDay() + 6) % 7));
      F('monthname', parte(x => MES[x.getUTCMonth()]));
      F('dayname', parte(x => DIA[x.getUTCDay()]));
      F('last_day', parte(x => fmt(new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 0)))));
      F('datediff', (a, b) => { const x = pd(a), y = pd(b); return x && y ? Math.round((dia(x) - dia(y)) / 864e5) : null; });
      F('my_date_add', (v, n, u) => mueve(v, n, u));
      F('my_date_sub', (v, n, u) => mueve(v, n == null ? null : -n, u));
      F('my_tsdiff', (u, a, b) => {
        const x = pd(a), y = pd(b); if (!x || !y) return null;
        const ms = y - x; u = String(u).toUpperCase();
        if (u === 'YEAR' || u === 'MONTH') { let m = (y.getUTCFullYear() - x.getUTCFullYear()) * 12 + y.getUTCMonth() - x.getUTCMonth(); if (y.getUTCDate() < x.getUTCDate()) m--; return u === 'YEAR' ? Math.trunc(m / 12) : m; }
        return Math.trunc(ms / ({ DAY: 864e5, WEEK: 6048e5, HOUR: 36e5, MINUTE: 6e4, SECOND: 1e3 }[u] || 864e5));
      });
      F('date_format', (v, f) => {
        const x = pd(v); if (!x || f == null) return null;
        const m = { Y: x.getUTCFullYear(), y: p2(x.getUTCFullYear() % 100), m: p2(x.getUTCMonth() + 1), c: x.getUTCMonth() + 1, d: p2(x.getUTCDate()), e: x.getUTCDate(), H: p2(x.getUTCHours()), i: p2(x.getUTCMinutes()), s: p2(x.getUTCSeconds()), M: MES[x.getUTCMonth()], b: MES[x.getUTCMonth()].slice(0, 3), W: DIA[x.getUTCDay()], a: DIA[x.getUTCDay()].slice(0, 3) };
        return String(f).replace(/%(.)/g, (_, k) => m[k] != null ? m[k] : k);
      });
      F('my_left', (s, n) => s == null ? null : String(s).slice(0, Math.max(0, n)));
      F('my_right', (s, n) => s == null ? null : n > 0 ? String(s).slice(-n) : '');
      F('isnull', v => v == null ? 1 : 0);
      F('database', () => self.sel ? self.dbName : null);
      F('version', () => '8.0.36-sqljunior');
      F('user', () => 'junior@localhost');
      F('current_user', () => 'junior@localhost');
      F('lpad', (s, n, p) => s == null ? null : String(s).length >= n ? String(s).slice(0, n) : String(s).padStart(n, String(p)));
      F('rpad', (s, n, p) => s == null ? null : String(s).length >= n ? String(s).slice(0, n) : String(s).padEnd(n, String(p)));
      F('reverse', s => s == null ? null : String(s).split('').reverse().join(''));
      F('locate', (a, b) => a == null || b == null ? null : String(b).toLowerCase().indexOf(String(a).toLowerCase()) + 1);
      F('repeat', (s, n) => s == null ? null : String(s).repeat(Math.max(0, n)));
      F('space', n => ' '.repeat(Math.max(0, n)));
      F('ceil', v => v == null ? null : Math.ceil(v));
      F('ceiling', v => v == null ? null : Math.ceil(v));
      F('floor', v => v == null ? null : Math.floor(v));
      F('pow', (a, b) => a == null || b == null ? null : Math.pow(a, b));
      F('power', (a, b) => a == null || b == null ? null : Math.pow(a, b));
      F('sqrt', v => v == null || v < 0 ? null : Math.sqrt(v));
      F('mod', (a, b) => a == null || b == null || +b === 0 ? null : a % b);
      F('my_truncate', (v, n) => { if (v == null) return null; const f = Math.pow(10, n || 0); return Math.trunc(v * f) / f; });
      F('format', (v, n) => v == null ? null : Number(v).toLocaleString('en-US', { minimumFractionDigits: n || 0, maximumFractionDigits: n || 0 }));
      F('regexp', (p, v) => { if (p == null || v == null) return null; try { return new RegExp(p, 'i').test(String(v)) ? 1 : 0; } catch (e) { return 0; } });
    }

    /* --- utilidades internas (hablan SQLite directamente) --- */
    raw(sql, p) {
      const st = this.db.prepare(sql), rows = [];
      try { if (p) st.bind(p); while (st.step()) rows.push(st.get()); } finally { st.free(); }
      return rows;
    }
    scalar(sql, p) { const r = this.raw(sql, p); return r.length ? r[0][0] : null; }
    ins(table, cols, rows) {
      const d = this.db; d.run('BEGIN');
      const st = d.prepare('INSERT INTO ' + Q(table) + ' (' + cols.map(Q).join(',') + ') VALUES (' + cols.map(() => '?').join(',') + ')');
      try { for (const r of rows) st.run(r); } finally { st.free(); }
      d.run('COMMIT');
    }
    ddl(text) {
      const s = this.sel; this.sel = true;
      const res = this.exec(text); this.sel = s;
      const bad = res.find(r => !r.ok);
      if (bad) throw new Error('DDL interno: ' + bad.err.texto + ' :: ' + bad.raw);
    }
    /* Ejecuta un SELECT en sintaxis MySQL sin exigir USE (para las consultas de referencia). */
    quiet(sql) {
      const st = split(sql)[0], r = {}; this.st = st;
      this.select(st.sig, r); return r.out;
    }
    tbl(n) {
      const t = this.cat.get(lc(n));
      if (!t) throw new MyErr(1146, '42S02', "Table '" + this.dbName + '.' + n + "' doesn't exist");
      return t;
    }
    syn(k) {
      const st = this.st; let near = '', line = 1;
      if (st && k) { const p = k.pos - st.start; near = st.text.slice(p, p + 70).replace(/;\s*$/, ''); line = st.text.slice(0, p).split('\n').length; }
      else if (st) line = st.text.split('\n').length;
      return new MyErr(1064, '42000', "You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '" + near + "' at line " + line);
    }

    /* --- traduccion de expresiones MySQL a SQLite --- */
    emit(sig) {
      const o = [], db = this.dbName.toUpperCase();
      for (let i = 0; i < sig.length; i++) {
        const k = sig[i], nx = sig[i + 1], pv = sig[i - 1];
        const punto = nx && nx.t === 'op' && nx.v === '.';
        if (k.t === 'str') { o.push(S(k.v)); continue; }
        if (k.t === 'id') { if (k.v.toUpperCase() === db && punto) { i++; continue; } o.push(Q(k.v)); continue; }
        if (k.t === 'op') { o.push(OPMAP[k.v] || k.v); continue; }
        if (k.t === 'w') {
          const u = k.u, call = nx && nx.t === 'op' && nx.v === '(', dot = pv && pv.t === 'op' && pv.v === '.';
          if (!dot && u === db && punto) { i++; continue; }
          if (!dot && call && FNMAP[u]) {
            o.push(FNMAP[u]);
            if (u === 'TIMESTAMPDIFF' && sig[i + 2] && sig[i + 2].t === 'w') { o.push('(', S(sig[i + 2].u)); i += 2; }
            continue;
          }
          if (!dot && (u === 'CURRENT_DATE' || u === 'CURRENT_TIMESTAMP' || u === 'LOCALTIMESTAMP')) {
            o.push(u === 'CURRENT_DATE' ? 'my_curdate()' : 'my_now()');
            if (call && sig[i + 2] && sig[i + 2].v === ')') i += 2;
            continue;
          }
          if (u === 'INTERVAL' && !call && nx && sig[i + 2] && sig[i + 2].t === 'w' && UNITS.has(sig[i + 2].u)) {
            o.push(nx.t === 'str' ? S(nx.v) : nx.raw, ',', S(sig[i + 2].u)); i += 2; continue;
          }
          if (u === 'FULL' && nx && nx.t === 'w' && (nx.u === 'JOIN' || nx.u === 'OUTER')) throw this.syn(k);
          if (u === 'DIV') { o.push('/'); continue; }
        }
        o.push(k.raw);
      }
      return junta(o);
    }

    /* --- ejecucion --- */
    exec(text) {
      const res = [];
      for (const st of split(text)) {
        if (!st.complete) {
          res.push({ raw: st.text.trim(), ok: false, type: 'incompleta', lint: [], notes: [], err: { code: 0, texto: "    -> (MySQL sigue esperando el cierre de la sentencia)", tip: 'Falta el punto y coma (;) al final. Sin él la sentencia no se ejecuta.' } });
          break;
        }
        const r = this.one(st); res.push(r);
        if (!r.ok) break;
      }
      return res;
    }
    one(st) {
      this.st = st;
      const sig = st.sig, r = { raw: st.text.trim(), ok: true, type: 'otro', table: '', mut: false, lint: [], notes: [], out: null, info: '' };
      try {
        const bad = sig.find(k => k.open);
        if (bad) throw this.syn(bad);
        this.dispatch(sig, r);
        r.lint = lint(sig, r);
      } catch (e) {
        r.ok = false;
        r.err = e instanceof MyErr ? e : this.mapErr(e, r);
        if (!r.err.tip) r.err.tip = TIPS[r.err.code] || '';
      }
      return r;
    }
    dispatch(sig, r) {
      const c = new Cur(sig, this), k0 = sig[0], u = k0.t === 'w' ? k0.u : k0.v;
      c.i = 1;
      const need = () => { if (!this.sel) throw new MyErr(1046, '3D000', 'No database selected'); };
      const acceso = () => new MyErr(1044, '42000', "Access denied for user 'junior'@'localhost' to database '" + ((sig[sig.length - 1] || {}).v || '') + "'",
        'Como junior no tienes permiso para crear ni borrar bases de datos. Trabaja dentro de la base de la empresa.');
      switch (u) {
        case 'USE': {
          const n = c.ident();
          if (!c.end()) throw this.syn(c.peek());
          if (lc(n) !== lc(this.dbName)) throw new MyErr(1049, '42000', "Unknown database '" + n + "'");
          this.sel = true; r.type = 'use'; r.info = 'Database changed'; return;
        }
        case 'SHOW': return this.show(c, r, need);
        case 'DESCRIBE': case 'DESC': case 'EXPLAIN': {
          if (c.isW('SELECT')) throw noSup();
          need(); const nom = c.table(), vis = this.views.get(lc(nom));
          if (!c.end()) throw this.syn(c.peek());
          r.type = 'describe';
          if (vis) { r.table = vis.name; r.out = { cols: ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'], rows: this.raw('PRAGMA table_info(' + Q(vis.name) + ')').map(x => [x[1], String(x[2] || '').toLowerCase(), 'YES', '', null, '']) }; }
          else { const t = this.tbl(nom); r.table = t.name; r.out = this.describe(t); }
          r.info = nfilas(r.out.rows.length); return;
        }
        case 'SELECT': case 'WITH': case '(':
          r.type = 'select';
          if (sig.some(k => k.t === 'w' && k.u === 'FROM')) need();
          this.select(sig, r); r.info = nfilas(r.out.rows.length); return;
        case 'INSERT': case 'REPLACE': need(); r.type = 'insert'; return this.dml(sig, r);
        case 'UPDATE': need(); r.type = 'update'; return this.dml(sig, r);
        case 'DELETE': need(); r.type = 'delete'; return this.dml(sig, r);
        case 'CREATE':
          need(); c.eatW('TEMPORARY');
          if (c.isW('DATABASE') || c.isW('SCHEMA')) throw acceso();
          this.cierraTx(r);
          if (c.eatW('TABLE')) return this.create(c, r);
          { const rep = c.eatW('OR', 'REPLACE'); if (c.eatW('VIEW')) return this.createView(c, r, rep); if (rep) throw this.syn(c.peek()); }
          if (c.isW('INDEX') || (c.isW('UNIQUE') && c.isW('INDEX', 1))) {
            c.eatW('UNIQUE'); c.i++; const nom = c.ident(); c.needW('ON'); const tb = this.tbl(c.table());
            const sql = this.emit(sig); this.db.run(sql);
            this.idx.push({ name: nom, table: lc(tb.name), sql: sql }); r.type = 'indice'; r.table = tb.name; r.mut = true; r.info = OK0 + '\nRecords: 0  Duplicates: 0  Warnings: 0'; return;
          }
          throw noSup();
        case 'ALTER': need(); c.needW('TABLE'); this.cierraTx(r); return this.alter(c, r);
        case 'DROP':
          need(); c.eatW('TEMPORARY');
          if (c.isW('DATABASE') || c.isW('SCHEMA')) throw acceso();
          this.cierraTx(r);
          if (c.eatW('TABLE')) return this.drop(c, r);
          if (c.eatW('VIEW')) return this.dropView(c, r);
          if (c.eatW('INDEX')) { const nom = c.ident(); this.db.run('DROP INDEX ' + Q(nom)); this.idx = this.idx.filter(x => lc(x.name) !== lc(nom)); r.type = 'indice'; r.mut = true; r.info = OK0; return; }
          throw noSup();
        case 'TRUNCATE': need(); c.eatW('TABLE'); this.cierraTx(r); return this.truncate(c, r);
        case 'RENAME': {
          need(); c.needW('TABLE'); const a = c.table(); c.needW('TO'); const b = c.table();
          this.tbl(a); this.renameTable(a, b); r.type = 'alter'; r.table = b; r.mut = true; r.info = OK0; return;
        }
        case 'SET':
          throw new MyErr(1227, '42000', 'Access denied; you need (at least one of) the SUPER or SYSTEM_VARIABLES_ADMIN privilege(s) for this operation',
            'En este servidor no puedes cambiar variables: el modo seguro lo administra tu jefe.');
        case 'START': case 'BEGIN':
          need(); if (u === 'START') c.needW('TRANSACTION'); else c.eatW('WORK');
          if (!c.end()) throw this.syn(c.peek());
          if (this.tx) this.db.run('COMMIT');
          this.db.run('BEGIN'); this.tx = true; r.type = 'tx'; r.sub = 'start'; r.mut = true; r.info = OK0; return;
        case 'COMMIT': case 'ROLLBACK':
          need(); c.eatW('WORK'); if (!c.end()) throw this.syn(c.peek());
          if (this.tx) this.db.run(u);
          this.tx = false; r.type = 'tx'; r.sub = u === 'COMMIT' ? 'commit' : 'rollback'; r.mut = true; r.info = OK0; return;
        case 'GRANT': case 'REVOKE': case 'CALL': case 'LOCK': case 'UNLOCK':
          throw noSup();
        default: throw this.syn(k0);
      }
    }
    select(sig, r) {
      const st = this.db.prepare(this.emit(sig));
      try {
        const cols = st.getColumnNames().map(n => n.replace(/ ?\*1\.0\/ ?/g, '/').replace(/\b(my_\w+|iif)\(/g, (m, f) => (FNBACK[f] || f) + '(')), rows = [];
        while (st.step()) rows.push(st.get());
        r.out = { cols: cols, rows: rows };
      } finally { st.free(); }
    }
    dml(sig, r) {
      const u = sig[0].u; let sql;
      const nom = i => (sig[i + 1] && sig[i + 1].v === '.' && sig[i + 2] ? sig[i + 2] : sig[i] || {}).v || '';
      if (u === 'INSERT' || u === 'REPLACE') {
        let i = 1; const ign = !!(sig[i] && sig[i].u === 'IGNORE'); if (ign) i++;
        if (sig[i] && sig[i].u === 'INTO') i++;
        r.table = nom(i);
        const j = sig[i + 1] && sig[i + 1].v === '.' ? i + 3 : i + 1;
        r.insCols = !!(sig[j] && sig[j].t === 'op' && sig[j].v === '(');
        sql = ign ? 'INSERT OR IGNORE ' + this.emit(sig.slice(2)) : this.emit(sig);
      } else {
        r.table = nom(u === 'UPDATE' ? 1 : 2);
        let dep = 0, w = false, j = false;
        for (const k of sig) { if (k.t === 'op' && k.v === '(') dep++; else if (k.t === 'op' && k.v === ')') dep--; else if (k.t === 'w' && dep === 0 && k.u === 'WHERE') w = true; else if (k.t === 'w' && dep === 0 && k.u === 'JOIN') j = true; }
        if (!w && !j) throw new MyErr(1175, 'HY000', 'You are using safe update mode and you tried to update a table without a WHERE that uses a KEY column.');
        sql = u === 'UPDATE' ? this.updJoin(sig, r) : (sig[1] && sig[1].t === 'w' && sig[1].u === 'FROM') ? this.emit(sig) : this.delJoin(sig, r);
      }
      this.db.run(sql);
      const n = this.db.getRowsModified();
      r.mut = true; r.rows = n; r.info = 'Query OK, ' + n + (n === 1 ? ' row' : ' rows') + ' affected';
      if (u === 'UPDATE') r.info += '\nRows matched: ' + n + '  Changed: ' + n + '  Warnings: 0';
    }
    /* UPDATE de MySQL (con alias, columnas calificadas y JOIN) convertido a UPDATE ... FROM de SQLite. */
    updJoin(sig, r) {
      const tope = (pal, desde) => { let dep = 0; for (let i = desde; i < sig.length; i++) { const k = sig[i]; if (k.t === 'op' && k.v === '(') dep++; else if (k.t === 'op' && k.v === ')') dep--; else if (k.t === 'w' && dep === 0 && k.u === pal) return i; } return -1; };
      const iSet = tope('SET', 1);
      if (iSet < 2) throw this.syn(sig[1]);
      let iW = tope('WHERE', iSet); if (iW < 0) iW = sig.length;
      const partes = []; let cur = [];
      for (const k of sig.slice(1, iSet)) {
        if (k.t === 'w' && k.u === 'JOIN') { partes.push(cur); cur = []; }
        else if (k.t === 'w' && (k.u === 'INNER' || k.u === 'CROSS')) { /* se omite */ }
        else if (k.t === 'w' && (k.u === 'LEFT' || k.u === 'RIGHT')) throw noSup();
        else cur.push(k);
      }
      partes.push(cur);
      const ref = seg => {
        if (!seg.length || seg[0].t === 'op') throw this.syn(seg[0] || sig[iSet]);
        let i = 1; if (seg[i] && seg[i].t === 'op' && seg[i].v === '.') { seg = seg.slice(2); }
        if (seg[i] && seg[i].t === 'w' && seg[i].u === 'AS') i++;
        const al = seg[i] && seg[i].t !== 'op' && seg[i].u !== 'ON' ? seg[i++].v : null;
        return { t: this.tbl(seg[0].v).name, al: al, rest: seg.slice(i) };
      };
      const p0 = ref(partes[0]), froms = [], conds = [];
      if (p0.rest.length) throw this.syn(p0.rest[0]);
      r.table = p0.t;
      partes.slice(1).forEach(s => {
        const p = ref(s); froms.push(Q(p.t) + (p.al ? ' AS ' + Q(p.al) : ''));
        if (!p.rest.length || p.rest[0].u !== 'ON') throw this.syn(p.rest[0] || sig[iSet]);
        conds.push('(' + this.emit(p.rest.slice(1)) + ')');
      });
      const set = sig.slice(iSet + 1, iW), nombres = [p0.t, p0.al].filter(Boolean).map(lc), out = [];
      let dep = 0, inicio = true;
      for (let i = 0; i < set.length; i++) {
        const k = set[i];
        if (inicio && k.t !== 'op' && set[i + 1] && set[i + 1].t === 'op' && set[i + 1].v === '.' && nombres.indexOf(lc(k.v)) >= 0) { i++; inicio = false; continue; }
        inicio = false;
        if (k.t === 'op') { if (k.v === '(') dep++; else if (k.v === ')') dep--; else if (k.v === ',' && dep === 0) inicio = true; }
        out.push(k);
      }
      if (iW < sig.length) conds.push('(' + this.emit(sig.slice(iW + 1)) + ')');
      return 'UPDATE ' + Q(p0.t) + (p0.al ? ' AS ' + Q(p0.al) : '') + ' SET ' + this.emit(out) + (froms.length ? ' FROM ' + froms.join(', ') : '') + (conds.length ? ' WHERE ' + conds.join(' AND ') : '');
    }
    /* DELETE alias FROM tabla alias JOIN ... de MySQL convertido a DELETE ... WHERE rowid IN (SELECT ...). */
    delJoin(sig, r) {
      const al = sig[1].v;
      if (!sig[2] || sig[2].u !== 'FROM') throw this.syn(sig[2] || sig[1]);
      const rest = sig.slice(3); let tabla = null;
      for (let i = 0; i < rest.length && !tabla; i++) {
        const k = rest[i]; if (k.t === 'op' || !this.cat.has(lc(k.v))) continue;
        const nx = rest[i + 1], a = nx && nx.t === 'w' && nx.u === 'AS' ? rest[i + 2] : nx;
        if (lc(k.v) === lc(al) || (a && a.t !== 'op' && lc(a.v) === lc(al))) tabla = this.cat.get(lc(k.v)).name;
      }
      if (!tabla) throw new MyErr(1109, '42S02', "Unknown table '" + al + "' in MULTI DELETE");
      r.table = tabla;
      return 'DELETE FROM ' + Q(tabla) + ' WHERE rowid IN (SELECT ' + Q(al) + '.rowid FROM ' + this.emit(rest) + ')';
    }
    /* En MySQL una sentencia DDL confirma la transaccion en curso. */
    cierraTx(r) {
      if (!this.tx) return;
      this.db.run('COMMIT'); this.tx = false;
      r.notes.push('Aviso: en MySQL una sentencia que cambia la estructura confirma (COMMIT) la transacción en curso.');
    }
    createView(c, r, rep) {
      const name = c.table(); c.needW('AS');
      const cuerpo = c.s.slice(c.i), previa = this.views.get(lc(name));
      if (!cuerpo.length) throw this.syn(undefined);
      if (this.cat.has(lc(name)) || (previa && !rep)) throw new MyErr(1050, '42S01', "Table '" + name + "' already exists");
      const sql = 'CREATE VIEW ' + Q(name) + ' AS ' + this.emit(cuerpo);
      if (previa) this.db.run('DROP VIEW ' + Q(previa.name));
      try { this.db.run(sql); const st = this.db.prepare('SELECT * FROM ' + Q(name) + ' LIMIT 0'); st.free(); }
      catch (e) { try { this.db.run('DROP VIEW IF EXISTS ' + Q(name)); if (previa) this.db.run(previa.sql); } catch (x) { /* nada */ } throw e; }
      this.views.set(lc(name), { name: name, sql: sql });
      r.type = 'vista'; r.table = name; r.mut = true; r.info = OK0;
    }
    dropView(c, r) {
      const ifx = c.eatW('IF', 'EXISTS'), name = c.table(), v = this.views.get(lc(name));
      if (!c.end()) throw this.syn(c.peek());
      r.type = 'vista'; r.sub = 'drop'; r.table = name; r.info = OK0;
      if (!v) { if (ifx) { r.info = OK0 + ', 1 warning'; r.notes.push("Note 1051: Unknown table '" + this.dbName + '.' + name + "'"); return; } throw new MyErr(1051, '42S02', "Unknown table '" + this.dbName + '.' + name + "'"); }
      this.db.run('DROP VIEW ' + Q(v.name)); this.views.delete(lc(name)); r.mut = true;
    }
    show(c, r, need) {
      r.type = 'show';
      if (c.eatW('DATABASES') || c.eatW('SCHEMAS')) r.out = { cols: ['Database'], rows: [['information_schema'], [this.dbName]] };
      else if (c.eatW('TABLES') || c.eatW('FULL', 'TABLES')) {
        need(); r.sub = 'tables';
        r.out = { cols: ['Tables_in_' + this.dbName], rows: Array.from(this.cat.values()).concat(Array.from(this.views.values())).map(t => [t.name]).sort((a, b) => a[0] < b[0] ? -1 : 1) };
      } else if (c.eatW('COLUMNS') || c.eatW('FIELDS') || c.eatW('FULL', 'COLUMNS')) {
        need(); if (!c.eatW('FROM') && !c.eatW('IN')) throw this.syn(c.peek());
        const t = this.tbl(c.table()); r.type = 'describe'; r.table = t.name; r.out = this.describe(t);
      } else if (c.eatW('CREATE', 'TABLE')) {
        need(); const t = this.tbl(c.table());
        r.out = { cols: ['Table', 'Create Table'], rows: [[t.name, this.showCreate(t)]] };
      } else throw this.syn(c.peek());
      if (!c.end()) throw this.syn(c.peek());
      r.info = nfilas(r.out.rows.length);
    }
    describe(t) {
      const pk = (t.pk || []).map(lc);
      return {
        cols: ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'],
        rows: t.cols.map(c => {
          const n = lc(c.name);
          const key = pk.indexOf(n) >= 0 ? 'PRI' : c.unique || t.uniq.some(u => lc(u[0]) === n) ? 'UNI' : t.fks.some(f => lc(f.cols[0]) === n) ? 'MUL' : '';
          return [c.name, tipo(c), c.notNull || pk.indexOf(n) >= 0 ? 'NO' : 'YES', key, c.def, c.auto ? 'auto_increment' : ''];
        })
      };
    }
    showCreate(t) {
      const L = t.cols.map(c => {
        const nn = c.notNull || (t.pk || []).some(p => lc(p) === lc(c.name));
        return '  `' + c.name + '` ' + tipo(c) + (nn ? ' NOT NULL' : '') + (c.def != null ? ' DEFAULT ' + (/^(CURRENT_TIMESTAMP|CURRENT_DATE|NOW\(\)|CURDATE\(\))$/i.test(c.def) ? c.def : "'" + c.def + "'") : nn ? '' : ' DEFAULT NULL') + (c.auto ? ' AUTO_INCREMENT' : '');
      });
      if (t.pk) L.push('  PRIMARY KEY (' + t.pk.map(p => '`' + p + '`').join(',') + ')');
      t.fks.forEach(f => L.push('  CONSTRAINT `' + f.name + '` FOREIGN KEY (' + f.cols.map(p => '`' + p + '`').join(',') + ') REFERENCES `' + f.ref + '` (' + f.refCols.map(p => '`' + p + '`').join(',') + ')'));
      return 'CREATE TABLE `' + t.name + '` (\n' + L.join(',\n') + '\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4';
    }

    /* --- DDL --- */
    colDef(c, t) {
      const col = { name: c.ident(), notNull: false, def: null, defSql: null, auto: false, unique: false };
      const k = c.peek();
      if (!k || k.t !== 'w') throw this.syn(k);
      if (ORA[k.u]) { const e = this.syn(k); e.tip = k.u + ' es un tipo de Oracle. En MySQL usa ' + ORA[k.u] + '.'; throw e; }
      if (!TYPES.has(k.u)) throw this.syn(k);
      c.i++;
      col.base = k.u === 'INTEGER' ? 'INT' : k.u === 'BOOL' || k.u === 'BOOLEAN' ? 'TINYINT' : k.u === 'NUMERIC' || k.u === 'DEC' ? 'DECIMAL' : k.u;
      col.args = [];
      if (c.isV('(')) col.args = c.paren().filter(x => x.v !== ',').map(x => x.t === 'str' ? S(x.v) : x.raw);
      if (col.base === 'VARCHAR' && !col.args.length) throw this.syn(c.peek());
      if (k.u === 'BOOL' || k.u === 'BOOLEAN') col.args = ['1'];
      col.type = col.base + (col.args.length ? '(' + col.args.join(',') + ')' : '');
      for (;;) {
        if (c.end() || c.isV(',') || c.isV(')') || c.isW('FIRST') || c.isW('AFTER')) break;
        if (c.eatW('UNSIGNED')) col.type += ' UNSIGNED';
        else if (c.eatW('ZEROFILL') || c.eatW('SIGNED')) { /* sin efecto */ }
        else if (c.eatW('NOT', 'NULL')) col.notNull = true;
        else if (c.eatW('NULL')) col.notNull = false;
        else if (c.eatW('DEFAULT')) {
          let d = [];
          if (c.isV('(')) d = [{ t: 'op', v: '(', raw: '(' }].concat(c.paren(), [{ t: 'op', v: ')', raw: ')' }]);
          else {
            if (c.isV('-') || c.isV('+')) d.push(c.next());
            const k2 = c.peek(); if (!k2 || k2.t === 'op') throw this.syn(k2);
            d.push(c.next());
            if (c.isV('(') && c.isV(')', 1)) { d.push(c.next()); d.push(c.next()); }
          }
          if (d.length === 1 && d[0].t === 'w' && d[0].u === 'NULL') { col.def = null; col.defSql = null; }
          else { col.def = d.map(x => x.t === 'str' ? x.v : x.raw).join(''); const e = this.emit(d); col.defSql = /\(/.test(e) && e[0] !== '(' ? '(' + e + ')' : e; }
        }
        else if (c.eatW('AUTO_INCREMENT')) col.auto = true;
        else if (c.eatW('PRIMARY', 'KEY') || c.eatW('KEY')) col.pk = true;
        else if (c.eatW('UNIQUE')) { c.eatW('KEY'); col.unique = true; }
        else if (c.eatW('COMMENT') || c.eatW('COLLATE') || c.eatW('CHARSET')) c.i++;
        else if (c.eatW('CHARACTER', 'SET')) c.i++;
        else if (c.eatW('REFERENCES')) { c.table(); if (c.isV('(')) c.cols(); while (c.eatW('ON')) { c.i++; if (c.eatW('SET') || c.eatW('NO')) c.i++; else c.i++; } col.refIgn = true; }
        else if (c.eatW('CHECK')) t.checks.push(c.paren());
        else if (c.eatW('ON', 'UPDATE')) { c.i++; if (c.isV('(')) c.paren(); }
        else throw this.syn(c.peek());
      }
      return col;
    }
    refs(c, fk) {
      c.needW('REFERENCES'); fk.ref = c.table(); fk.refCols = c.cols(); fk.onDelete = null; fk.onUpdate = null;
      while (c.eatW('ON')) {
        const w = c.peek();
        if (!c.eatW('DELETE') && !c.eatW('UPDATE')) throw this.syn(w);
        let a;
        if (c.eatW('CASCADE')) a = 'CASCADE'; else if (c.eatW('RESTRICT')) a = 'RESTRICT'; else if (c.eatW('SET', 'NULL')) a = 'SET NULL';
        else if (c.eatW('NO', 'ACTION')) a = 'NO ACTION'; else if (c.eatW('SET', 'DEFAULT')) a = 'SET DEFAULT'; else throw this.syn(c.peek());
        if (w.u === 'DELETE') fk.onDelete = a; else fk.onUpdate = a;
      }
      return fk;
    }
    item(c, t, r) {
      let cn = null, hasC = false;
      if (c.eatW('CONSTRAINT')) { hasC = true; if (!['PRIMARY', 'FOREIGN', 'UNIQUE', 'CHECK'].some(w => c.isW(w))) cn = c.ident(); }
      if (c.eatW('PRIMARY', 'KEY')) { if (t.pk) throw new MyErr(1068, '42000', 'Multiple primary key defined'); t.pk = c.cols(); }
      else if (c.eatW('FOREIGN', 'KEY')) { if (!c.isV('(')) cn = c.ident(); const cols = c.cols(); t.fks.push(this.refs(c, { name: cn, cols: cols })); }
      else if (c.eatW('UNIQUE')) { if (!c.eatW('KEY')) c.eatW('INDEX'); if (!c.isV('(')) c.ident(); t.uniq.push(c.cols()); }
      else if (c.eatW('CHECK')) t.checks.push(c.paren());
      else if (!hasC && (c.isW('KEY') || c.isW('INDEX')) && (c.isV('(', 1) || c.isV('(', 2))) { c.i++; if (!c.isV('(')) c.ident(); c.cols(); }
      else if (hasC) throw this.syn(c.peek());
      else {
        const col = this.colDef(c, t);
        if (t.cols.some(x => lc(x.name) === lc(col.name))) throw new MyErr(1060, '42S21', "Duplicate column name '" + col.name + "'");
        t.cols.push(col);
        if (col.pk) { if (t.pk) throw new MyErr(1068, '42000', 'Multiple primary key defined'); t.pk = [col.name]; }
        if (col.refIgn && r) r.notes.push('Aviso: MySQL ignora REFERENCES escrito junto a la columna. Para crear la clave foránea usa FOREIGN KEY (columna) REFERENCES tabla(columna).');
        return col;
      }
      return null;
    }
    validate(t) {
      const has = n => t.cols.find(x => lc(x.name) === lc(n));
      for (const p of t.pk || []) if (!has(p)) throw new MyErr(1072, '42000', "Key column '" + p + "' doesn't exist in table");
      const au = t.cols.filter(x => x.auto);
      if (au.length > 1 || (au.length && !((t.pk || []).some(p => lc(p) === lc(au[0].name)) || au[0].unique)))
        throw new MyErr(1075, '42000', 'Incorrect table definition; there can be only one auto column and it must be defined as a key');
      const usados = new Set(t.fks.filter(f => f.name).map(f => lc(f.name)));
      let n = 0;
      for (const f of t.fks) {
        if (!f.name) { do { n++; f.name = t.name + '_ibfk_' + n; } while (usados.has(lc(f.name))); usados.add(lc(f.name)); }
        for (const cn of f.cols) if (!has(cn)) throw new MyErr(1072, '42000', "Key column '" + cn + "' doesn't exist in table");
        const p = lc(f.ref) === lc(t.name) ? t : this.cat.get(lc(f.ref));
        if (!p) throw new MyErr(1824, 'HY000', "Failed to open the referenced table '" + f.ref + "'");
        if (f.cols.length !== f.refCols.length) throw new MyErr(1239, '42000', "Incorrect foreign key definition for '" + f.name + "': Key reference and table reference don't match");
        f.refCols.forEach((rc, i) => {
          const pc = p.cols.find(x => lc(x.name) === lc(rc));
          if (!pc) throw new MyErr(3734, 'HY000', "Failed to add the foreign key constraint. Missing column '" + rc + "' for constraint '" + f.name + "' in the referenced table '" + p.name + "'");
          if (cls(pc.base) !== cls(has(f.cols[i]).base)) throw new MyErr(3780, 'HY000', "Referencing column '" + f.cols[i] + "' and referenced column '" + rc + "' in foreign key constraint '" + f.name + "' are incompatible.");
        });
        const key = f.refCols.map(lc).join(',');
        const okKey = (p.pk && p.pk.map(lc).join(',') === key) || p.uniq.some(u => u.map(lc).join(',') === key) || (f.refCols.length === 1 && p.cols.find(x => lc(x.name) === key).unique);
        if (!okKey) throw new MyErr(1822, 'HY000', "Failed to add the foreign key constraint. Missing index for constraint '" + f.name + "' in the referenced table '" + p.name + "'");
      }
    }
    gen(t, as) {
      const L = [], K = [], pk = (t.pk || []).map(lc), solo = pk.length === 1 ? pk[0] : null;
      let pkHecha = false;
      for (const c of t.cols) {
        const k = cls(c.base), n = lc(c.name), q = Q(c.name);
        if (c.auto && solo === n && k === 'int') { L.push(q + ' INTEGER PRIMARY KEY AUTOINCREMENT'); pkHecha = true; continue; }
        let s = q + ' ' + (k === 'int' ? 'INT' : k === 'num' ? 'NUMERIC' : k === 'txt' ? 'TEXT COLLATE NOCASE' : 'TEXT');
        if (c.notNull || pk.indexOf(n) >= 0) s += ' NOT NULL';
        if (c.defSql != null) s += ' DEFAULT ' + c.defSql;
        L.push(s);
        if (k === 'int' || k === 'num') K.push('CONSTRAINT ' + Q('ckn_' + c.name) + " CHECK(typeof(" + q + ") <> 'text')");
        else if ((c.base === 'VARCHAR' || c.base === 'CHAR') && c.args.length) K.push('CONSTRAINT ' + Q('ckl_' + c.name) + ' CHECK(length(' + q + ') <= ' + (+c.args[0] || 255) + ')');
        else if (c.base === 'DATE') K.push('CONSTRAINT ' + Q('ckd_' + c.name) + ' CHECK(' + q + " IS NULL OR " + q + " GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')");
        else if (c.base === 'DATETIME' || c.base === 'TIMESTAMP') K.push('CONSTRAINT ' + Q('ckd_' + c.name) + ' CHECK(' + q + " IS NULL OR " + q + " GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]*')");
        else if (c.base === 'ENUM') K.push('CONSTRAINT ' + Q('cke_' + c.name) + ' CHECK(' + q + ' IS NULL OR ' + q + ' IN (' + c.args.join(',') + '))');
        if (c.unique) K.push('UNIQUE(' + q + ')');
      }
      if (pk.length && !pkHecha) K.push('PRIMARY KEY(' + t.pk.map(Q).join(',') + ')');
      for (const u of t.uniq) K.push('UNIQUE(' + u.map(Q).join(',') + ')');
      for (const f of t.fks) K.push('CONSTRAINT ' + Q(f.name) + ' FOREIGN KEY(' + f.cols.map(Q).join(',') + ') REFERENCES ' + Q(f.ref) + '(' + f.refCols.map(Q).join(',') + ')' +
        (f.onDelete ? ' ON DELETE ' + f.onDelete : '') + (f.onUpdate ? ' ON UPDATE ' + f.onUpdate : ''));
      for (const ch of t.checks) K.push('CHECK(' + this.emit(ch) + ')');
      return 'CREATE TABLE ' + Q(as || t.name) + ' (' + L.concat(K).join(', ') + ')';
    }
    create(c, r) {
      const ine = c.eatW('IF', 'NOT', 'EXISTS'), name = c.table();
      r.type = 'create'; r.table = name; r.ifx = ine;
      if (this.cat.has(lc(name))) {
        if (ine) { r.info = OK0 + ', 1 warning'; r.notes.push("Note 1050: Table '" + name + "' already exists"); return; }
        throw new MyErr(1050, '42S01', "Table '" + name + "' already exists");
      }
      let t = { name: name, cols: [], pk: null, fks: [], uniq: [], checks: [] };
      if (c.eatW('LIKE')) {
        const o = this.tbl(c.table());
        t = JSON.parse(JSON.stringify(o)); t.name = name; t.fks = [];
        this.db.run(this.gen(t));
      } else if (c.eatW('AS') || c.isW('SELECT')) {
        this.db.run('CREATE TABLE ' + Q(name) + ' AS ' + this.emit(c.s.slice(c.i)));
        const n = this.scalar('SELECT COUNT(*) FROM ' + Q(name));
        t.cols = this.raw('PRAGMA table_info(' + Q(name) + ')').map(x => {
          const ty = String(x[2] || '').toUpperCase(), base = /INT/.test(ty) ? 'INT' : /NUM|REAL/.test(ty) ? 'DECIMAL' : 'VARCHAR', args = base === 'INT' ? [] : base === 'DECIMAL' ? ['12', '2'] : ['255'];
          return { name: x[1], notNull: false, def: null, defSql: null, auto: false, unique: false, base: base, args: args, type: base + (args.length ? '(' + args.join(',') + ')' : '') };
        });
        this.rebuild(name, t, new Map(t.cols.map(x => [lc(x.name), Q(x.name)])));
        this.cat.set(lc(name), t); r.mut = true; r.info = 'Query OK, ' + n + ' rows affected'; return;
      } else {
        c.needV('(');
        do { this.item(c, t, r); } while (c.eatV(','));
        c.needV(')');
        while (!c.end()) { const k = c.next(); if (k.t === 'op' && k.v !== '=') throw this.syn(k); }
        if (!t.cols.length) throw new MyErr(1113, '42000', 'A table must have at least 1 column');
        this.validate(t);
        this.db.run(this.gen(t));
      }
      this.cat.set(lc(name), t); r.mut = true; r.info = OK0;
    }
    alter(c, r) {
      const t0 = this.tbl(c.table());
      r.type = 'alter'; r.table = t0.name;
      const t = JSON.parse(JSON.stringify(t0)), map = new Map(t.cols.map(x => [lc(x.name), Q(x.name)])), ren = [];
      let newName = null;
      const idx = n => t.cols.findIndex(x => lc(x.name) === lc(n));
      const unk = n => new MyErr(1054, '42S22', "Unknown column '" + n + "' in '" + t.name + "'");
      const place = at => {
        if (c.eatW('FIRST')) return 0;
        if (c.eatW('AFTER')) { const n = c.ident(), a = idx(n); if (a < 0) throw unk(n); return a + 1; }
        return at;
      };
      const renCol = (a, b) => {
        const m = x => lc(x) === lc(a) ? b : x;
        if (t.pk) t.pk = t.pk.map(m);
        t.uniq = t.uniq.map(u => u.map(m));
        t.fks.forEach(f => { f.cols = f.cols.map(m); if (lc(f.ref) === lc(t.name)) f.refCols = f.refCols.map(m); });
        ren.push([a, b]);
      };
      do {
        if (c.eatW('ADD')) {
          const esCol = !(['CONSTRAINT', 'PRIMARY', 'FOREIGN', 'UNIQUE', 'CHECK'].some(w => c.isW(w)) || ((c.isW('INDEX') || c.isW('KEY')) && (c.isV('(', 1) || c.isV('(', 2))));
          if (esCol) c.eatW('COLUMN');
          const col = this.item(c, t, r);
          if (col) {
            t.cols.pop(); const at = place(t.cols.length); t.cols.splice(at, 0, col);
            map.set(lc(col.name), col.defSql != null ? col.defSql : col.notNull ? IMPL[cls(col.base)] : 'NULL');
          }
        } else if (c.eatW('DROP')) {
          const falta = n => new MyErr(1091, '42000', "Can't DROP '" + n + "'; check that column/key exists");
          if (c.eatW('PRIMARY', 'KEY')) { if (!t.pk) throw falta('PRIMARY'); t.pk = null; }
          else if (c.eatW('FOREIGN', 'KEY') || c.eatW('CONSTRAINT')) { const n = c.ident(), i = t.fks.findIndex(f => lc(f.name) === lc(n)); if (i < 0) throw falta(n); t.fks.splice(i, 1); }
          else if (c.eatW('INDEX') || c.eatW('KEY')) c.ident();
          else {
            c.eatW('COLUMN'); const n = c.ident(), i = idx(n);
            if (i < 0) throw falta(n);
            const fk = t.fks.find(f => f.cols.some(x => lc(x) === lc(n)));
            if (fk) throw new MyErr(1828, 'HY000', "Cannot drop column '" + n + "': needed in a foreign key constraint '" + fk.name + "'");
            for (const o of this.cat.values()) {
              const f2 = o.fks.find(f => lc(f.ref) === lc(t.name) && f.refCols.some(x => lc(x) === lc(n)));
              if (f2) throw new MyErr(1829, 'HY000', "Cannot drop column '" + n + "': needed in a foreign key constraint '" + f2.name + "' of table '" + o.name + "'");
            }
            if (t.cols.length === 1) throw new MyErr(1090, '42000', "You can't delete all columns with ALTER TABLE; use DROP TABLE instead");
            t.cols.splice(i, 1); map.delete(lc(n));
            if (t.pk) { t.pk = t.pk.filter(x => lc(x) !== lc(n)); if (!t.pk.length) t.pk = null; }
            t.uniq = t.uniq.filter(u => !u.some(x => lc(x) === lc(n)));
          }
        } else if (c.isW('MODIFY') || c.isW('CHANGE')) {
          const chg = c.next().u === 'CHANGE'; c.eatW('COLUMN');
          const old = chg ? c.ident() : (c.peek() || {}).v, i = idx(old);
          if (old == null) throw this.syn(c.peek());
          if (i < 0) throw unk(old);
          const viejo = t.cols[i].name, col = this.colDef(c, t);
          if (col.pk) { if (t.pk && !(t.pk.length === 1 && lc(t.pk[0]) === lc(viejo))) throw new MyErr(1068, '42000', 'Multiple primary key defined'); t.pk = [viejo]; }
          if (lc(col.name) !== lc(viejo)) { if (idx(col.name) >= 0) throw new MyErr(1060, '42S21', "Duplicate column name '" + col.name + "'"); renCol(viejo, col.name); }
          const src = map.get(lc(viejo)); map.delete(lc(viejo)); map.set(lc(col.name), src);
          t.cols.splice(i, 1); const at = place(i); t.cols.splice(Math.min(at, t.cols.length), 0, col);
        } else if (c.eatW('RENAME')) {
          if (c.eatW('COLUMN')) {
            const old = c.ident(); c.needW('TO'); const nw = c.ident(), i = idx(old);
            if (i < 0) throw unk(old);
            if (idx(nw) >= 0) throw new MyErr(1060, '42S21', "Duplicate column name '" + nw + "'");
            const src = map.get(lc(old)); map.delete(lc(old)); map.set(lc(nw), src);
            renCol(t.cols[i].name, nw); t.cols[i].name = nw;
          } else { if (!c.eatW('TO')) c.eatW('AS'); newName = c.table(); }
        } else throw this.syn(c.peek());
      } while (c.eatV(','));
      if (!c.end()) throw this.syn(c.peek());
      this.validate(t);
      if (newName && this.cat.has(lc(newName))) throw new MyErr(1050, '42S01', "Table '" + newName + "' already exists");
      this.rebuild(t0.name, t, map);
      this.cat.set(lc(t0.name), t);
      if (ren.length) for (const o of this.cat.values()) {
        if (o === t) continue;
        let ch = false;
        for (const f of o.fks) if (lc(f.ref) === lc(t.name)) f.refCols = f.refCols.map(x => { const m = ren.find(p => lc(p[0]) === lc(x)); if (m) ch = true; return m ? m[1] : x; });
        if (ch) this.rebuild(o.name, o, new Map(o.cols.map(x => [lc(x.name), Q(x.name)])));
      }
      if (newName) this.renameTable(t.name, newName);
      r.mut = true; r.info = OK0 + '\nRecords: 0  Duplicates: 0  Warnings: 0';
    }
    rebuild(name, t, map) {
      const d = this.db, tmp = '__sj_nueva';
      for (const v of this.views.values()) d.run('DROP VIEW IF EXISTS ' + Q(v.name));
      d.run('PRAGMA foreign_keys=OFF'); d.run('BEGIN');
      try {
        d.run(this.gen(t, tmp));
        const cs = t.cols.filter(x => map.has(lc(x.name)));
        if (cs.length) d.run('INSERT INTO ' + Q(tmp) + ' (' + cs.map(x => Q(x.name)).join(',') + ') SELECT ' + cs.map(x => map.get(lc(x.name))).join(',') + ' FROM ' + Q(name));
        d.run('DROP TABLE ' + Q(name));
        d.run('ALTER TABLE ' + Q(tmp) + ' RENAME TO ' + Q(name));
        if (this.raw('PRAGMA foreign_key_check(' + Q(name) + ')').length) throw new MyErr(1452, '23000', 'Cannot add or update a child row: a foreign key constraint fails');
        d.run('COMMIT');
      } catch (e) { try { d.run('ROLLBACK'); } catch (x) { /* nada */ } throw e; }
      finally {
        d.run('PRAGMA foreign_keys=ON');
        for (const [k, v] of Array.from(this.views)) { try { d.run(v.sql); const st = d.prepare('SELECT * FROM ' + Q(v.name) + ' LIMIT 0'); st.free(); } catch (x) { try { d.run('DROP VIEW IF EXISTS ' + Q(v.name)); } catch (y) { /* nada */ } this.views.delete(k); } }
        for (const ix of this.idx.filter(x => x.table === lc(name))) { try { d.run(ix.sql); } catch (x) { this.idx = this.idx.filter(y => y !== ix); } }
      }
    }
    renameTable(a, b) {
      if (this.cat.has(lc(b))) throw new MyErr(1050, '42S01', "Table '" + b + "' already exists");
      this.db.run('ALTER TABLE ' + Q(a) + ' RENAME TO ' + Q(b));
      const nuevo = new Map();
      for (const [k, v] of this.cat) { if (k === lc(a)) { v.name = b; nuevo.set(lc(b), v); } else nuevo.set(k, v); v.fks.forEach(f => { if (lc(f.ref) === lc(a)) f.ref = b; }); }
      this.cat = nuevo;
    }
    drop(c, r) {
      const ifx = c.eatW('IF', 'EXISTS'), names = [];
      do { names.push(c.table()); } while (c.eatV(','));
      if (!c.end() && !c.eatW('CASCADE') && !c.eatW('RESTRICT')) throw this.syn(c.peek());
      r.type = 'drop'; r.ifx = ifx; r.table = names[0]; r.info = OK0;
      for (const n of names) {
        const t = this.cat.get(lc(n));
        if (!t) { if (ifx) { r.info = OK0 + ', 1 warning'; r.notes.push("Note 1051: Unknown table '" + this.dbName + '.' + n + "'"); continue; } throw new MyErr(1051, '42S02', "Unknown table '" + this.dbName + '.' + n + "'"); }
        for (const o of this.cat.values()) {
          if (o === t || names.some(x => lc(x) === lc(o.name))) continue;
          const f = o.fks.find(x => lc(x.ref) === lc(n));
          if (f) throw new MyErr(3730, 'HY000', "Cannot drop table '" + t.name + "' referenced by a foreign key constraint '" + f.name + "' on table '" + o.name + "'.");
        }
        this.db.run('PRAGMA foreign_keys=OFF');
        try { this.db.run('DROP TABLE ' + Q(t.name)); } finally { this.db.run('PRAGMA foreign_keys=ON'); }
        this.cat.delete(lc(n)); r.mut = true;
      }
    }
    truncate(c, r) {
      const t = this.tbl(c.table());
      if (!c.end()) throw this.syn(c.peek());
      r.type = 'truncate'; r.table = t.name;
      for (const o of this.cat.values()) {
        const f = o !== t && o.fks.find(x => lc(x.ref) === lc(t.name));
        if (f) throw new MyErr(1701, '42000', 'Cannot truncate a table referenced in a foreign key constraint (`' + this.dbName + '`.`' + o.name + '`, CONSTRAINT `' + f.name + '`)');
      }
      this.db.run('DELETE FROM ' + Q(t.name));
      try { this.db.run('DELETE FROM sqlite_sequence WHERE name=' + S(t.name)); } catch (e) { /* sin tablas autoincrementales */ }
      r.mut = true; r.info = OK0;
    }

    /* --- errores de SQLite con formato MySQL --- */
    mapErr(e, r) {
      const m = String((e && e.message) || e), db = this.dbName, E = (c, s, t) => new MyErr(c, s, t);
      let x;
      if ((x = /no such table: (?:main\.)?(\S+)/.exec(m))) return E(1146, '42S02', "Table '" + db + '.' + x[1] + "' doesn't exist");
      if ((x = /no such column: (\S+)/.exec(m)) || (x = /has no column named (\S+)/.exec(m))) return E(1054, '42S22', "Unknown column '" + x[1].replace(/"/g, '') + "' in 'field list'");
      if (/values? for \d+ columns?|columns? but \d+ values?/.test(m)) return E(1136, '21S01', "Column count doesn't match value count at row 1");
      if ((x = /UNIQUE constraint failed: (\S+?)\.(\S+)/.exec(m))) {
        const t = this.cat.get(lc(x[1])), esPk = t && t.pk && t.pk.some(p => lc(p) === lc(x[2].replace(/,.*/, '')));
        return E(1062, '23000', "Duplicate entry for key '" + (x[1] === '__sj_nueva' ? r.table : x[1]) + '.' + (esPk ? 'PRIMARY' : x[2]) + "'");
      }
      if ((x = /NOT NULL constraint failed: \S+?\.(\S+)/.exec(m))) return E(1048, '23000', "Column '" + x[1] + "' cannot be null");
      if (/FOREIGN KEY constraint failed/.test(m)) {
        let hijo = r.type === 'insert';
        if (r.type === 'update') {
          const t = this.cat.get(lc(r.table)), sig = this.st.sig, fkc = t ? [].concat.apply([], t.fks.map(f => f.cols.map(lc))) : [];
          hijo = sig.some((k, i) => k.t !== 'op' && fkc.indexOf(lc(k.v)) >= 0 && sig[i + 1] && sig[i + 1].v === '=');
        }
        return hijo ? E(1452, '23000', 'Cannot add or update a child row: a foreign key constraint fails')
          : E(1451, '23000', 'Cannot delete or update a parent row: a foreign key constraint fails');
      }
      if ((x = /CHECK constraint failed: ck([nlde])_(.+)/.exec(m))) {
        if (x[1] === 'l') return E(1406, '22001', "Data too long for column '" + x[2] + "' at row 1");
        if (x[1] === 'n') return E(1366, 'HY000', "Incorrect integer value for column '" + x[2] + "' at row 1");
        if (x[1] === 'd') return E(1292, '22007', "Incorrect date value for column '" + x[2] + "' at row 1");
        return E(1265, '01000', "Data truncated for column '" + x[2] + "' at row 1");
      }
      if (/CHECK constraint failed/.test(m)) return E(3819, 'HY000', 'Check constraint is violated.');
      if (/datatype mismatch/.test(m)) return E(1366, 'HY000', 'Incorrect integer value at row 1');
      if ((x = /near "([^"]*)": syntax error/.exec(m))) {
        const st = this.st, p = st.text.toLowerCase().lastIndexOf(x[1].toLowerCase());
        return this.syn(p >= 0 ? { pos: st.start + p } : undefined);
      }
      if (/incomplete input|syntax error/.test(m)) return this.syn(undefined);
      if ((x = /ambiguous column name: (\S+)/.exec(m))) return E(1052, '23000', "Column '" + x[1] + "' in field list is ambiguous");
      if ((x = /no such function: (\S+)/.exec(m))) return E(1305, '42000', 'FUNCTION ' + db + '.' + x[1] + ' does not exist');
      if (/misuse of aggregate/.test(m)) return E(1111, 'HY000', 'Invalid use of group function');
      if ((x = /wrong number of arguments to function (\w+)/.exec(m))) return E(1582, '42000', "Incorrect parameter count in the call to native function '" + (FNBACK[x[1]] || x[1].toUpperCase()) + "'");
      if ((x = /index (\S+) already exists/.exec(m))) return E(1061, '42000', "Duplicate key name '" + x[1] + "'");
      if (/already exists/.test(m)) return E(1050, '42S01', m);
      return E(1105, 'HY000', m);
    }
  }

  SJ.Engine = Engine;
  SJ.MyErr = MyErr;
  SJ.sqlUtil = { tokenize: tokenize, split: split, lc: lc, Q: Q, S: S };
})(typeof window !== 'undefined' ? window : global);

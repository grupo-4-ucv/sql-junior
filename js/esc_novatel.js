/* SQL Junior - escenario 3: NovaTel (empresa de telecomunicaciones). Base de datos, datos con semilla y 25 solicitudes. */
(function (root) {
  'use strict';
  const SJ = root.SJ = root.SJ || {}, D = SJ.datos;
  SJ.escenarios = SJ.escenarios || {};

  const ZONAS = [['Lima Norte', 'Lima'], ['Lima Sur', 'Lima'], ['Lima Este', 'Lima'], ['Lima Centro', 'Lima'], ['Callao', 'Callao'], ['Arequipa', 'Arequipa'], ['Trujillo', 'La Libertad'], ['Cusco', 'Cusco']];
  const PLANES = [['Nova Lite 10', 'POSTPAGO', 29.9, 10, 200], ['Nova Plus 25', 'POSTPAGO', 39.9, 25, 500], ['Nova Max 50', 'POSTPAGO', 55.9, 50, 1000], ['Nova Ultra 100', 'POSTPAGO', 79.9, 100, 3000],
    ['Nova Joven 15', 'POSTPAGO', 34.9, 15, 300], ['Prepago Chip', 'PREPAGO', 5, 1, 30], ['Prepago Full', 'PREPAGO', 10, 3, 60], ['Prepago Redes', 'PREPAGO', 7, 2, 0],
    ['Hogar 100 Mbps', 'HOGAR', 69.9, null, null], ['Hogar 300 Mbps', 'HOGAR', 99.9, null, null], ['Hogar Giga', 'HOGAR', 149.9, null, null], ['Nova Max 50', 'POSTPAGO', 55.9, 50, 1000]];
  const PESOS = [1, 1, 1, 2, 2, 2, 3, 3, 4, 5, 5, 6, 6, 6, 7, 7, 8, 9, 9, 10, 11];
  const CATEG = ['SIN SERVICIO', 'INTERNET LENTO', 'FACTURACION', 'CAMBIO DE PLAN', 'EQUIPO'];
  const PRIOR = ['ALTA', 'MEDIA', 'MEDIA', 'BAJA'];
  const NUEVOS = ['Hogar Giga Familiar Ilimitado', 'Hogar Fibra Giga Premium Total', 'Hogar Giga Plus Entretenimiento'];

  const ESQUEMA = `
    CREATE TABLE zonas (id_zona INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(30) NOT NULL, region VARCHAR(30));
    CREATE TABLE planes (id_plan INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(20) NOT NULL, tipo VARCHAR(10) NOT NULL, precio_mensual DECIMAL(6,2) NOT NULL, gigas INT, minutos INT);
    CREATE TABLE clientes (id_cliente INT AUTO_INCREMENT PRIMARY KEY, dni CHAR(8) NOT NULL, nombres VARCHAR(40) NOT NULL, apellidos VARCHAR(40) NOT NULL, correo VARCHAR(60),
      direccion VARCHAR(60), distrito VARCHAR(30), id_zona INT NOT NULL, fecha_alta DATE, FOREIGN KEY (id_zona) REFERENCES zonas(id_zona));
    CREATE TABLE equipos (id_equipo INT AUTO_INCREMENT PRIMARY KEY, marca VARCHAR(20) NOT NULL, modelo VARCHAR(30) NOT NULL, precio DECIMAL(8,2), stock INT DEFAULT 0);
    CREATE TABLE lineas (id_linea INT AUTO_INCREMENT PRIMARY KEY, id_cliente INT NOT NULL, id_plan INT NOT NULL, numero CHAR(9) NOT NULL, fecha_activacion DATE,
      estado VARCHAR(12) NOT NULL DEFAULT 'ACTIVA', FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente), FOREIGN KEY (id_plan) REFERENCES planes(id_plan));
    CREATE TABLE contratos (id_contrato INT AUTO_INCREMENT PRIMARY KEY, id_linea INT NOT NULL, id_equipo INT, fecha_inicio DATE NOT NULL, meses INT NOT NULL, penalidad DECIMAL(8,2) DEFAULT 0,
      FOREIGN KEY (id_linea) REFERENCES lineas(id_linea), FOREIGN KEY (id_equipo) REFERENCES equipos(id_equipo));
    CREATE TABLE facturas (id_factura INT AUTO_INCREMENT PRIMARY KEY, id_linea INT NOT NULL, periodo CHAR(7) NOT NULL, fecha_emision DATE NOT NULL, fecha_vencimiento DATE NOT NULL,
      monto DECIMAL(8,2) NOT NULL, estado VARCHAR(10) NOT NULL, FOREIGN KEY (id_linea) REFERENCES lineas(id_linea));
    CREATE TABLE pagos (id_pago INT AUTO_INCREMENT PRIMARY KEY, id_factura INT NOT NULL, fecha_pago DATE, monto DECIMAL(8,2), medio VARCHAR(12), FOREIGN KEY (id_factura) REFERENCES facturas(id_factura));
    CREATE TABLE recargas (id_recarga INT AUTO_INCREMENT PRIMARY KEY, id_linea INT NOT NULL, fecha_recarga DATE, monto DECIMAL(6,2), canal VARCHAR(12), FOREIGN KEY (id_linea) REFERENCES lineas(id_linea));
    CREATE TABLE tecnicos (id_tecnico INT AUTO_INCREMENT PRIMARY KEY, nombres VARCHAR(40) NOT NULL, apellidos VARCHAR(40) NOT NULL, id_zona INT NOT NULL, activo TINYINT DEFAULT 1,
      FOREIGN KEY (id_zona) REFERENCES zonas(id_zona));
    CREATE TABLE tickets_soporte (id_ticket INT AUTO_INCREMENT PRIMARY KEY, id_linea INT NOT NULL, id_tecnico INT, fecha_apertura DATE NOT NULL, fecha_cierre DATE, categoria VARCHAR(20),
      prioridad VARCHAR(6), estado VARCHAR(12), FOREIGN KEY (id_linea) REFERENCES lineas(id_linea), FOREIGN KEY (id_tecnico) REFERENCES tecnicos(id_tecnico));
    CREATE TABLE tmp_migracion_lineas (id INT, numero CHAR(9), plan_antiguo VARCHAR(30));
    CREATE TABLE log_cargas (id_log INT AUTO_INCREMENT PRIMARY KEY, proceso VARCHAR(30), fecha_carga DATE, registros INT);`;

  function construir(E, R) {
    const F = D.fabrica(R), f = {}, r2 = x => Math.round(x * 100) / 100, p2 = n => (n < 10 ? '0' : '') + n;
    E.ddl(ESQUEMA);
    E.ins('zonas', ['nombre', 'region'], ZONAS);
    E.ins('planes', ['nombre', 'tipo', 'precio_mensual', 'gigas', 'minutos'], PLANES);

    /* clientes */
    f.sucios = F.sucios();
    const N = 120, dist = F.distritos(N, f.sucios), CL = [], zX3 = R.int(1, 8), CX3 = 56;
    for (let i = 0; i < N; i++) {
      const p = F.persona(), x = R.n();
      CL.push({ dni: F.dni(), nombres: p.nombres, apellidos: p.apellidos, correo: x < 0.1 ? null : x < 0.15 ? '' : F.correo(p, 60), direccion: F.direccion(), distrito: dist[i], zona: R.int(1, 8), alta: R.fecha('2020-01-15', '2026-10-31') });
    }
    const apeM1 = R.pick(D.APE);
    [[3, 'Jr.'], [40, 'Jr.'], [77, 'Av.']].forEach(par => { const c = CL[par[0]]; c.apellidos = apeM1 + ' ' + R.pick(D.APE); c.direccion = par[1] + ' ' + R.pick(D.CALLES) + ' ' + R.int(100, 1999); });
    f.m1 = { pref: apeM1.slice(0, 3) };
    CL[CX3 - 1].zona = zX3;
    E.ins('clientes', ['dni', 'nombres', 'apellidos', 'correo', 'direccion', 'distrito', 'id_zona', 'fecha_alta'], CL.map(c => [c.dni, c.nombres, c.apellidos, c.correo, c.direccion, c.distrito, c.zona, c.alta]));
    const px = F.persona(), zX1 = R.int(1, 8);
    f.x1 = { dni: F.dni(), nombres: px.nombres, apellidos: px.apellidos, correo: F.correo(px, 60), direccion: F.direccion(), distrito: F.limpio(f.sucios), zona: ZONAS[zX1 - 1][0], idZona: zX1 };

    /* equipos */
    const EQ = [], modelos = new Set();
    while (EQ.length < 20) { const m = R.pick(['Kuntur', 'Volt', 'Nexa', 'Orbit']) + '|' + R.pick(['A', 'S', 'X', 'Note ', 'Pro ']) + R.int(5, 60); if (!modelos.has(m)) { modelos.add(m); EQ.push([m.split('|')[0], m.split('|')[1], R.dinero(299, 3999), R.int(0, 60)]); } }
    E.ins('equipos', ['marca', 'modelo', 'precio', 'stock'], EQ);

    /* lineas */
    const LN = [], pl = R.varios([1, 2, 4, 5], 2);
    const linea = o => {
      const l = Object.assign({ cli: R.int(1, N), plan: R.pick(PESOS), numero: F.telefono(), act: R.fecha('2022-01-01', '2026-10-31') }, o);
      if (!l.estado) { const x = R.n(); l.estado = x < 0.75 ? 'ACTIVA' : x < 0.87 ? 'SUSPENDIDA' : 'BAJA'; }
      LN.push(l); return l;
    };
    for (let i = 0; i < 190; i++) linea({});
    LN[150].numero = LN[20].numero; LN[160].numero = LN[45].numero; LN[170].numero = LN[45].numero;
    for (let i = 0; i < 7; i++) linea({ plan: 12 });
    for (let i = 0; i < 3; i++) linea({ plan: pl[i % 2], estado: 'ACTIVA', act: R.fecha('2026-01-10', '2026-10-31') });
    linea({ plan: pl[0], estado: 'SUSPENDIDA', act: R.fecha('2026-02-01', '2026-09-30') });
    linea({ plan: pl[1], estado: 'ACTIVA', act: R.fecha('2025-01-05', '2025-12-20') });
    const lx = linea({ cli: CX3, plan: 2, estado: 'ACTIVA', act: '2024-05-10' });
    const LM = R.mezcla(LN); LM.forEach((l, i) => { l.id = i + 1; });
    E.ins('lineas', ['id_cliente', 'id_plan', 'numero', 'fecha_activacion', 'estado'], LM.map(l => [l.cli, l.plan, l.numero, l.act, l.estado]));
    f.l4 = { a: PLANES[pl[0] - 1][0], b: PLANES[pl[1] - 1][0], ia: pl[0], ib: pl[1] };

    /* contratos, facturas, pagos y recargas */
    const CO = [], FA = [], montos = new Set(), impagas = {};
    let forzadas = 0;
    LM.forEach(l => {
      const tipo = PLANES[l.plan - 1][1];
      if (tipo === 'PREPAGO') return;
      CO.push([l.id, R.prob(0.4) ? R.int(1, 20) : null, l.act, R.pick([12, 18, 24]), R.dinero(0, 600)]);
      if (l.estado === 'BAJA') return;
      const ciclo = R.pick([1, 8, 15, 22]), forzar = forzadas < 5 && l.act < '2026-08-01';
      if (forzar) forzadas++;
      ['2026-08', '2026-09', '2026-10', '2026-11'].forEach(per => {
        const em = per + '-' + p2(ciclo); if (em > '2026-11-13' || l.act > em) return;
        const ven = SJ.masDias(em, 15), x = R.n(); let monto, estado;
        do { monto = r2(PLANES[l.plan - 1][2] + R.int(0, 2500) / 100); } while (montos.has(monto)); montos.add(monto);
        if (ven >= '2026-11-16') estado = x < 0.45 ? 'PAGADA' : 'PENDIENTE';
        else estado = x < 0.78 ? 'PAGADA' : x < 0.93 ? 'VENCIDA' : 'RECLAMADA';
        if (forzar && (per === '2026-09' || per === '2026-10')) estado = 'VENCIDA';
        if (estado === 'VENCIDA' || estado === 'PENDIENTE') impagas[l.cli] = (impagas[l.cli] || 0) + 1;
        FA.push({ linea: l.id, per: per, em: em, ven: ven, monto: monto, estado: estado });
      });
    });
    FA.sort((a, b) => a.em < b.em ? -1 : a.em > b.em ? 1 : a.linea - b.linea);
    FA.forEach((x, i) => { x.id = i + 1; });
    E.ins('contratos', ['id_linea', 'id_equipo', 'fecha_inicio', 'meses', 'penalidad'], CO);
    E.ins('facturas', ['id_linea', 'periodo', 'fecha_emision', 'fecha_vencimiento', 'monto', 'estado'], FA.map(x => [x.linea, x.per, x.em, x.ven, x.monto, x.estado]));
    E.ins('pagos', ['id_factura', 'fecha_pago', 'monto', 'medio'], FA.filter(x => x.estado === 'PAGADA').map(x => [x.id, SJ.masDias(x.em, R.int(1, 12)), x.monto, R.pick(['APP', 'BANCO', 'AGENTE', 'TARJETA'])]));
    const im = Object.keys(impagas).map(k => impagas[k]).sort((a, b) => b - a);
    f.v5 = { min: Math.max(2, im[Math.min(5, im.length - 2)] || 2) };
    const pre = LM.filter(l => PLANES[l.plan - 1][1] === 'PREPAGO'), RC = [];
    for (let i = 0; i < 150; i++) RC.push([R.pick(pre).id, R.fecha('2026-05-01', '2026-11-13'), R.pick([5, 10, 10, 20, 30]), R.pick(['APP', 'BODEGA', 'BANCO', 'WEB'])]);
    E.ins('recargas', ['id_linea', 'fecha_recarga', 'monto', 'canal'], RC);

    /* tecnicos: en la zona del reto X3 hay un solo tecnico activo */
    const TC = [], otras = [1, 2, 3, 4, 5, 6, 7, 8].filter(z => z !== zX3), tec = o => { const t = Object.assign(F.persona(), { activo: 1 }, o); TC.push(t); return t; };
    for (let z = 1; z <= 8; z++) tec({ zona: z });
    tec({ zona: zX3, activo: 0 });
    tec({ zona: R.pick(otras), libre: true }); tec({ zona: R.pick(otras), libre: true }); tec({ zona: R.pick(otras), activo: 0, libre: true });
    tec({ zona: R.pick(otras) }); tec({ zona: R.pick(otras) });
    const TM = R.mezcla(TC); TM.forEach((t, i) => { t.id = i + 1; });
    E.ins('tecnicos', ['nombres', 'apellidos', 'id_zona', 'activo'], TM.map(t => [t.nombres, t.apellidos, t.zona, t.activo]));
    const asignables = TM.filter(t => !t.libre), tX3 = TM.find(t => t.zona === zX3 && t.activo);

    /* tickets de soporte */
    const TK = [], ticket = o => {
      const k = Object.assign({ linea: R.int(1, LM.length), cat: R.pick(CATEG), pri: R.pick(PRIOR) }, o);
      if (!k.ap) k.ap = R.fecha('2026-03-01', '2026-11-12');
      if (!k.estado) k.estado = k.ap < '2026-11-01' ? (R.prob(0.9) ? 'CERRADO' : 'EN PROCESO') : R.pick(['ABIERTO', 'ABIERTO', 'EN PROCESO', 'CERRADO']);
      if (k.estado === 'CERRADO' && !k.ci) k.ci = SJ.masDias(k.ap, k.dias != null ? k.dias : R.int(0, 3));
      if (k.estado === 'CERRADO' && k.ci > '2026-11-13') k.ci = '2026-11-13';
      if (k.tec === undefined) k.tec = TK.length < asignables.length ? asignables[TK.length].id : (k.estado === 'ABIERTO' && R.prob(0.4) ? null : R.pick(asignables).id);
      if (k.tec === null && k.cat === 'SIN SERVICIO' && k.pri === 'ALTA' && !k.x3) k.pri = 'MEDIA';
      TK.push(k); return k;
    };
    for (let i = 0; i < 145; i++) ticket({});
    for (let i = 0; i < 5; i++) ticket({ ap: R.fecha('2026-10-01', '2026-10-20'), estado: 'CERRADO', dias: R.int(4, 9) });
    for (let i = 0; i < 2; i++) ticket({ ap: R.fecha('2026-10-02', '2026-10-18'), estado: 'CERRADO', dias: 3 });
    ticket({ cat: 'SIN SERVICIO', pri: 'ALTA', estado: 'ABIERTO', ap: '2026-11-12', tec: R.pick(asignables).id });
    ticket({ cat: 'INTERNET LENTO', pri: 'ALTA', estado: 'ABIERTO', ap: '2026-11-12', tec: null });
    const kx = ticket({ linea: lx.id, cat: 'SIN SERVICIO', pri: 'ALTA', estado: 'ABIERTO', ap: '2026-11-13', tec: null, x3: true });
    const KM = R.mezcla(TK); KM.forEach((k, i) => { k.id = i + 1; });
    E.ins('tickets_soporte', ['id_linea', 'id_tecnico', 'fecha_apertura', 'fecha_cierre', 'categoria', 'prioridad', 'estado'], KM.map(k => [k.linea, k.tec, k.ap, k.ci || null, k.cat, k.pri, k.estado]));
    f.x3 = { ticket: kx.id, tec: tX3.id };

    /* restos de migracion */
    E.ins('tmp_migracion_lineas', ['id', 'numero', 'plan_antiguo'], LM.slice(0, 25).map((l, i) => [i + 1, l.numero, 'Plan ' + R.pick(['Control', 'Libre', 'Mega', 'Chip']) + ' ' + R.int(20, 90)]));
    const LG = [];
    for (let i = 0; i < 40; i++) LG.push([R.pick(['facturacion_mensual', 'recargas_diarias', 'altas_y_bajas', 'tickets']), R.fecha('2026-01-05', '2026-11-13'), R.int(20, 900)]);
    E.ins('log_cargas', ['proceso', 'fecha_carga', 'registros'], LG);
    f.x2 = { numero: F.telefono() };
    f.j3 = { nombre: R.pick(NUEVOS) };
    return f;
  }

  const q1 = s => String(s).replace(/'/g, "''");
  const retos = [
    [ /* ---------------- LUNES ---------------- */
      { id: 'L1', hab: 'explorar', de: 'jefe', titulo: 'Reconoce el terreno',
        texto: 'Tu usuario ya tiene acceso al servidor. Conéctate a la base de la empresa, mira qué tablas tiene y revisa la estructura de la tabla donde están las líneas telefónicas de los clientes.\nNo necesito que me envíes nada: solo quiero que conozcas la base antes de recibir pedidos. Cuando termines, presiona Entregar.',
        pistas: ['Son tres sentencias, en este orden: elegir la base, listar sus tablas y describir una tabla. Las tres están en la primera nota de tu libreta.', 'La base se llama novatel. La tabla de las líneas es lineas.'],
        check: c => [[c.st.some(s => s.t === 'use'), 'Todavía no seleccionaste la base de datos.'], [c.st.some(s => s.s === 'tables'), 'Falta listar las tablas de la base.'], [c.st.some(s => s.t === 'describe' && s.tb === 'lineas'), 'Falta revisar la estructura de la tabla de las líneas.']],
        sol: () => ['USE novatel;', 'SHOW TABLES;', 'DESCRIBE lineas;'] },
      { id: 'L2', hab: 'select', de: 'com', titulo: 'Planes prepago',
        texto: 'Estoy actualizando los afiches de las tiendas y necesito los datos de nuestros planes prepago.\nPásame el nombre, el precio mensual y los gigas de todos los planes de tipo prepago.',
        pistas: ['Explora la tabla de planes con SELECT *: una columna indica el tipo de plan y cómo está escrito.', "La columna es tipo y el valor es 'PREPAGO'. Devuelve solo nombre, precio_mensual y gigas."],
        ref: () => "SELECT nombre, precio_mensual, gigas FROM planes WHERE tipo = 'PREPAGO';" },
      { id: 'L3', hab: 'select', de: 'cob', titulo: 'Las cinco deudas más grandes',
        texto: 'Voy a empezar las llamadas de cobranza por los montos más altos.\nEnvíame el número de factura, la fecha de vencimiento y el monto de las cinco facturas pendientes de mayor monto, de la mayor a la menor.',
        pistas: ['Filtra las facturas pendientes, ordena por monto de mayor a menor y quédate con cinco filas.', "WHERE estado = 'PENDIENTE' ORDER BY monto DESC LIMIT 5"],
        ref: () => "SELECT id_factura, fecha_vencimiento, monto FROM facturas WHERE estado = 'PENDIENTE' ORDER BY monto DESC LIMIT 5;", orden: [2] },
      { id: 'L4', hab: 'filtros', de: 'com', titulo: 'Líneas nuevas de dos planes',
        texto: f => 'Quiero medir la campaña de este año de dos planes: ' + f.l4.a + ' y ' + f.l4.b + '.\nDame el número y la fecha de activación de las líneas activas de esos planes que se activaron desde el 1 de enero de 2026, ordenadas por número.',
        pistas: ['La tabla de líneas no guarda el nombre del plan: guarda un identificador. Averigua en otra tabla cuáles corresponden a esos dos planes.', 'Son tres condiciones unidas con AND. Las dos de plan van juntas, entre paréntesis y unidas con OR.'],
        ref: f => "SELECT numero, fecha_activacion FROM lineas WHERE estado = 'ACTIVA' AND (id_plan = " + f.l4.ia + ' OR id_plan = ' + f.l4.ib + ") AND fecha_activacion >= '2026-01-01' ORDER BY numero;", orden: [0] }
    ],
    [ /* ---------------- MARTES ---------------- */
      { id: 'M1', hab: 'filtros', de: 'atc', titulo: 'La llamada que se cortó',
        texto: f => 'Me llamó un cliente y se cortó la comunicación. Solo alcancé a anotar que su primer apellido empieza con "' + f.m1.pref + '" y que vive en un jirón: su dirección empieza con Jr.\nPásame nombres, apellidos y dirección de los clientes que coincidan.',
        pistas: ['Necesitas dos patrones con LIKE, los dos para textos que empiezan de cierta forma.', f => "apellidos LIKE '" + f.m1.pref + "%' AND direccion LIKE 'Jr.%'"],
        ref: f => "SELECT nombres, apellidos, direccion FROM clientes WHERE apellidos LIKE '" + f.m1.pref + "%' AND direccion LIKE 'Jr.%';" },
      { id: 'M2', hab: 'filtros', de: 'cob', titulo: 'Facturas sin cobrar de la quincena',
        texto: 'Estoy revisando lo que no se cobró. Necesito las facturas emitidas entre el 1 y el 15 de octubre de 2026 que están vencidas o en reclamo.\nEnvíame el número de factura, la fecha de emisión y el monto, de mayor a menor monto.',
        pistas: ['Revisa cómo están escritos los estados en la tabla de facturas. Luego combina un rango de fechas con una lista de valores.', "fecha_emision BETWEEN '2026-10-01' AND '2026-10-15' AND estado IN ('VENCIDA', 'RECLAMADA')"],
        ref: () => "SELECT id_factura, fecha_emision, monto FROM facturas WHERE fecha_emision BETWEEN '2026-10-01' AND '2026-10-15' AND estado IN ('VENCIDA', 'RECLAMADA') ORDER BY monto DESC;", orden: [2] },
      { id: 'M3', hab: 'filtros', de: 'atc', titulo: 'Clientes sin correo',
        texto: 'Vamos a enviar las facturas solo por correo y necesito saber a quiénes no les llegarán.\nDame DNI, nombres, apellidos y dirección de los clientes que no tienen correo registrado. Revisa bien cómo quedó guardado ese vacío: el sistema antiguo y el nuevo no lo guardaban igual.',
        pistas: ["Hay dos tipos de vacío en esa columna: el valor NULL y el texto vacío ''. Tu filtro debe cubrir los dos.", "WHERE correo IS NULL OR correo = ''"],
        ref: () => "SELECT dni, nombres, apellidos, direccion FROM clientes WHERE correo IS NULL OR correo = '';" },
      { id: 'M4', hab: 'funciones', de: 'jefe', titulo: 'Distritos mal escritos',
        texto: 'Sospecho que los distritos de los clientes están escritos de varias formas: con mayúsculas mezcladas, con espacios de más y hasta con errores de tipeo.\nDame la lista de distritos sin repetir, pasando cada uno a mayúsculas y sin espacios al inicio ni al final, en orden alfabético. Con eso veré cuáles siguen mal escritos.',
        pistas: ['Se combinan dos funciones de texto, una dentro de la otra, y se quitan los repetidos del resultado.', 'SELECT DISTINCT UPPER(TRIM(distrito)) FROM clientes ORDER BY 1'],
        ref: () => 'SELECT DISTINCT UPPER(TRIM(distrito)) FROM clientes ORDER BY 1;', orden: [0] },
      { id: 'M5', hab: 'funciones', de: 'sop', titulo: 'Tickets que tardaron',
        texto: 'El regulador nos exige resolver los reclamos en 3 días. Necesito los tickets que se abrieron en octubre de 2026 y tardaron más de 3 días en cerrarse.\nEnvíame el número de ticket, la categoría y cuántos días pasaron entre la apertura y el cierre.',
        pistas: ['DATEDIFF(fecha_fin, fecha_inicio) calcula los días. Puedes usarla en el SELECT y también en el WHERE.', 'WHERE YEAR(fecha_apertura) = 2026 AND MONTH(fecha_apertura) = 10 AND DATEDIFF(fecha_cierre, fecha_apertura) > 3'],
        ref: () => 'SELECT id_ticket, categoria, DATEDIFF(fecha_cierre, fecha_apertura) FROM tickets_soporte WHERE YEAR(fecha_apertura) = 2026 AND MONTH(fecha_apertura) = 10 AND DATEDIFF(fecha_cierre, fecha_apertura) > 3;' }
    ],
    [ /* ---------------- MIERCOLES ---------------- */
      { id: 'X1', hab: 'dml', de: 'atc', titulo: 'Cliente nuevo',
        texto: f => 'Acaba de afiliarse un cliente en la tienda. Ingrésalo a la base con fecha de alta de hoy.\nNombres: ' + f.x1.nombres + '\nApellidos: ' + f.x1.apellidos + '\nDNI: ' + f.x1.dni + '\nCorreo: ' + f.x1.correo + '\nDirección: ' + f.x1.direccion + '\nDistrito: ' + f.x1.distrito + '\nZona de cobertura: ' + f.x1.zona,
        pistas: ['La tabla de clientes pide el identificador de la zona, no su nombre. Búscalo primero. El id del cliente se genera solo.', 'INSERT INTO clientes (dni, nombres, apellidos, correo, direccion, distrito, id_zona, fecha_alta) VALUES (...). La fecha de hoy la entrega CURDATE().'],
        pre: c => ({ n: c.q('SELECT COUNT(*) FROM clientes') }),
        check: c => {
          const x = c.f.x1, n = c.q('SELECT COUNT(*) FROM clientes WHERE dni = ?', [x.dni]);
          return [[n === 1, n ? 'Ese DNI quedó registrado más de una vez. Restaura la base y vuelve a intentarlo.' : 'No encuentro ningún cliente con el DNI de la ficha.'],
            [c.q('SELECT COUNT(*) FROM clientes WHERE dni = ? AND nombres = ? AND apellidos = ? AND correo = ? AND direccion = ? AND distrito = ?', [x.dni, x.nombres, x.apellidos, x.correo, x.direccion, x.distrito]) === 1, 'El cliente existe, pero algún dato (nombres, apellidos, correo, dirección o distrito) no coincide con la ficha.'],
            [c.q('SELECT COUNT(*) FROM clientes WHERE dni = ? AND id_zona = ?', [x.dni, x.idZona]) === 1, 'La zona de cobertura no es la indicada en la ficha.'],
            [c.q('SELECT COUNT(*) FROM clientes WHERE dni = ? AND fecha_alta = ?', [x.dni, c.hoy]) === 1, 'La fecha de alta debe ser la de hoy.'],
            [c.q('SELECT COUNT(*) FROM clientes') === c.pre.n + 1, 'La tabla de clientes debe tener exactamente un registro más que antes.']];
        },
        sol: f => ["INSERT INTO clientes (dni, nombres, apellidos, correo, direccion, distrito, id_zona, fecha_alta) VALUES ('" + f.x1.dni + "', '" + q1(f.x1.nombres) + "', '" + q1(f.x1.apellidos) + "', '" + f.x1.correo + "', '" + f.x1.direccion + "', '" + f.x1.distrito + "', " + f.x1.idZona + ', CURDATE());'] },
      { id: 'X2', hab: 'dml', de: 'com', titulo: 'Primera línea del día',
        texto: f => 'El cliente que registraste hace un momento ya contrató. Actívale una línea con el número ' + f.x2.numero + ' en nuestro plan postpago de menor precio, con fecha de hoy.\nLuego registra su contrato: empieza hoy, dura 12 meses, sin equipo y sin penalidad.',
        pistas: ['Antes de escribir necesitas el id del cliente y el id del plan postpago más barato. Cada uno sale de un SELECT.', 'Son dos INSERT: primero en lineas (estado ACTIVA) y luego en contratos, usando el id de la línea recién creada. Sin equipo significa que id_equipo queda en NULL.'],
        pre: c => ({ nl: c.q('SELECT COUNT(*) FROM lineas'), nc: c.q('SELECT COUNT(*) FROM contratos') }),
        check: c => {
          const x = c.f.x2, n = c.q('SELECT COUNT(*) FROM lineas WHERE numero = ?', [x.numero]);
          return [[n === 1, n ? 'Ese número quedó registrado más de una vez. Restaura la base y vuelve a intentarlo.' : 'No encuentro la línea con el número indicado.'],
            [c.q("SELECT COUNT(*) FROM lineas WHERE numero = ? AND id_cliente IN (SELECT id_cliente FROM clientes WHERE dni = ?) AND id_plan = 1 AND fecha_activacion = ? AND estado = 'ACTIVA'", [x.numero, c.f.x1.dni, c.hoy]) === 1, 'La línea existe, pero el cliente, el plan, la fecha o el estado no coinciden. El plan es el postpago de menor precio mensual.'],
            [c.q('SELECT COUNT(*) FROM contratos k INNER JOIN lineas l ON k.id_linea = l.id_linea WHERE l.numero = ? AND k.meses = 12 AND k.id_equipo IS NULL AND k.fecha_inicio = ? AND (k.penalidad = 0 OR k.penalidad IS NULL)', [x.numero, c.hoy]) === 1, 'Falta el contrato de esa línea con los datos solicitados: 12 meses, sin equipo, sin penalidad y con fecha de hoy.'],
            [c.q('SELECT COUNT(*) FROM lineas') === c.pre.nl + 1 && c.q('SELECT COUNT(*) FROM contratos') === c.pre.nc + 1, 'Debe haber exactamente una línea nueva y un contrato nuevo.']];
        },
        sol: f => ["INSERT INTO lineas (id_cliente, id_plan, numero, fecha_activacion, estado) VALUES ((SELECT id_cliente FROM clientes WHERE dni = '" + f.x1.dni + "'), 1, '" + f.x2.numero + "', CURDATE(), 'ACTIVA');",
          "INSERT INTO contratos (id_linea, id_equipo, fecha_inicio, meses, penalidad) VALUES ((SELECT id_linea FROM lineas WHERE numero = '" + f.x2.numero + "'), NULL, CURDATE(), 12, 0);"] },
      { id: 'X3', hab: 'dml', de: 'sop', titulo: 'Un ticket sin dueño',
        texto: 'Tengo un ticket de prioridad alta por falta de servicio que sigue abierto y sin técnico asignado.\nAsígnalo al técnico activo de la zona donde vive el cliente dueño de esa línea y deja el ticket en estado EN PROCESO.',
        pistas: ['Recorre el camino por partes: el ticket te da la línea, la línea te da el cliente, el cliente te da la zona y la zona te da su técnico activo.', "Cuando tengas los dos identificadores: UPDATE tickets_soporte SET id_tecnico = ..., estado = 'EN PROCESO' WHERE id_ticket = ...;"],
        pre: c => ({ ep: c.q("SELECT COUNT(*) FROM tickets_soporte WHERE estado = 'EN PROCESO'"), st: c.q('SELECT COUNT(*) FROM tickets_soporte WHERE id_tecnico IS NULL') }),
        check: c => {
          const x = c.f.x3;
          return [[c.q('SELECT id_tecnico FROM tickets_soporte WHERE id_ticket = ?', [x.ticket]) === x.tec, 'El ticket correcto todavía no tiene asignado al técnico activo de la zona del cliente.'],
            [c.q('SELECT estado FROM tickets_soporte WHERE id_ticket = ?', [x.ticket]) === 'EN PROCESO', 'El ticket debe quedar en estado EN PROCESO.'],
            [c.q("SELECT COUNT(*) FROM tickets_soporte WHERE estado = 'EN PROCESO'") === c.pre.ep + 1 && c.q('SELECT COUNT(*) FROM tickets_soporte WHERE id_tecnico IS NULL') === c.pre.st - 1, 'Solo un ticket debía cambiar. Restaura la base y actualiza únicamente el que corresponde.']];
        },
        sol: f => ["UPDATE tickets_soporte SET id_tecnico = " + f.x3.tec + ", estado = 'EN PROCESO' WHERE id_ticket = " + f.x3.ticket + ';'] },
      { id: 'X4', hab: 'dml', de: 'jefe', titulo: 'Limpieza de distritos',
        texto: f => 'Ayer viste que hay distritos mal escritos en la tabla de clientes. Toca corregirlos.\nLos tres con problemas son ' + f.sucios[0] + ', ' + f.sucios[1] + ' y ' + f.sucios[2] + '. Todas sus variantes (mayúsculas, espacios de más, errores de tipeo) deben quedar escritas exactamente así. El resto de distritos está bien.',
        pistas: ["Lista primero las variantes de cada distrito con SELECT DISTINCT. Los espacios no se ven a simple vista: CONCAT('[', distrito, ']') o LENGTH(distrito) los delatan.", 'Un UPDATE por distrito. En el WHERE, UPPER(TRIM(distrito)) atrapa las variantes con mayúsculas y espacios; la variante con error de tipeo se agrega con OR.'],
        pre: c => ({ dist: D.preDistritos(c, 'clientes', c.f.sucios) }),
        check: c => D.checkDistritos(c, 'clientes', c.f.sucios),
        sol: f => D.solDistritos('clientes', f.sucios) },
      { id: 'X5', hab: 'dml', de: 'jefe', titulo: 'Plan duplicado',
        texto: 'En la app el plan Nova Max 50 aparece dos veces: uno de ellos se creó por error en una migración.\nConserva el más antiguo, que es el de menor identificador, y elimina el duplicado. Antes de borrarlo, pasa sus líneas al plan original: ningún cliente puede quedarse sin plan.',
        pistas: ['Si intentas el DELETE directo, MySQL responde el error 1451: el plan duplicado tiene líneas que dependen de él.', 'Un UPDATE cambia el id_plan de las líneas del duplicado al id del original; recién entonces funciona el DELETE.'],
        pre: c => ({ n: c.q('SELECT COUNT(*) FROM planes'), pl: c.q('SELECT COUNT(*) FROM lineas WHERE id_plan IN (3, 12)'), nl: c.q('SELECT COUNT(*) FROM lineas') }),
        check: c => [[c.q('SELECT COUNT(*) FROM planes WHERE id_plan = 12') === 0, 'El plan duplicado todavía existe.'],
          [c.q('SELECT COUNT(*) FROM planes WHERE id_plan = 3') === 1, 'El plan original ya no existe y era el que debía conservarse. Restaura la base.'],
          [c.q('SELECT COUNT(*) FROM lineas WHERE id_plan = 3') === c.pre.pl, 'No todas las líneas del plan duplicado pasaron al original.'],
          [c.q('SELECT COUNT(*) FROM lineas') === c.pre.nl && c.q('SELECT COUNT(*) FROM planes') === c.pre.n - 1, 'No debía eliminarse ninguna línea, y solo un plan.']],
        sol: () => ['UPDATE lineas SET id_plan = 3 WHERE id_plan = 12;', 'DELETE FROM planes WHERE id_plan = 12;'] }
    ],
    [ /* ---------------- JUEVES ---------------- */
      { id: 'J1', hab: 'ddl', de: 'com', titulo: 'Tecnología de la línea',
        texto: 'Estamos desplegando la red 5G y necesitamos saber con qué tecnología opera cada línea.\nAgrega a la tabla de líneas una columna llamada tecnologia, de texto de hasta 5 caracteres, que por defecto valga 4G.',
        pistas: ['Es un ALTER TABLE con ADD COLUMN. El valor por defecto se indica con DEFAULT después del tipo.', "ALTER TABLE lineas ADD COLUMN tecnologia VARCHAR(5) DEFAULT '4G';"],
        check: c => {
          const k = c.col('lineas', 'tecnologia');
          return [[!!k, 'La tabla lineas todavía no tiene la columna tecnologia.'], [!!k && k.base === 'VARCHAR' && +k.args[0] === 5, 'La columna debe ser VARCHAR(5).'], [!!k && String(k.def).toUpperCase() === '4G', 'El valor por defecto debe ser 4G.']];
        },
        sol: () => ["ALTER TABLE lineas ADD COLUMN tecnologia VARCHAR(5) DEFAULT '4G';"] },
      { id: 'J2', hab: 'ddl', de: 'jefe', titulo: 'Tabla de portabilidades',
        texto: 'Vamos a registrar en la base a los clientes que llegan desde otro operador. Crea la tabla portabilidades con estas columnas:\nid_portabilidad: entero, autoincremental, clave primaria.\nid_linea: entero, obligatorio, clave foránea hacia la tabla de líneas.\noperador_origen: texto de hasta 30 caracteres, obligatorio.\nfecha_solicitud: fecha.\nmonto_cobrado: decimal de 6 dígitos con 2 decimales.',
        pistas: ['Sigue el ejemplo de CREATE TABLE de tu libreta: primero las columnas, luego PRIMARY KEY y FOREIGN KEY con REFERENCES. No olvides IF NOT EXISTS.', 'La clave foránea se escribe: FOREIGN KEY (id_linea) REFERENCES lineas(id_linea). Obligatorio se escribe NOT NULL.'],
        check: c => D.checkTabla(c, 'portabilidades', { cols: { id_portabilidad: { tipo: 'INT', auto: true }, id_linea: { tipo: 'INT', nn: true }, operador_origen: { tipo: 'VARCHAR(30)', nn: true }, fecha_solicitud: { tipo: 'DATE' }, monto_cobrado: { tipo: 'DECIMAL(6,2)' } }, pk: 'id_portabilidad', fk: ['id_linea', 'lineas', 'id_linea'] }),
        sol: () => ['CREATE TABLE IF NOT EXISTS portabilidades (id_portabilidad INT AUTO_INCREMENT, id_linea INT NOT NULL, operador_origen VARCHAR(30) NOT NULL, fecha_solicitud DATE, monto_cobrado DECIMAL(6,2), PRIMARY KEY (id_portabilidad), FOREIGN KEY (id_linea) REFERENCES lineas(id_linea));'] },
      { id: 'J3', hab: 'ddl', de: 'com', titulo: 'Un nombre que no entra',
        texto: f => 'Marketing renombró nuestro plan de tipo hogar de mayor precio: ahora se llama ' + f.j3.nombre + '. El sistema rechaza el cambio porque el nombre es demasiado largo.\nAmplía la columna del nombre de los planes a 50 caracteres, manteniéndola obligatoria, y actualiza el nombre de ese plan.',
        pistas: ['Ubica primero el plan: filtra los de tipo hogar y ordena por precio. Revisa con DESCRIBE el tamaño actual de la columna. En MODIFY se vuelve a escribir el tipo completo, incluido NOT NULL.', 'ALTER TABLE planes MODIFY nombre VARCHAR(50) NOT NULL; y después un UPDATE con el id del plan.'],
        check: c => {
          const k = c.col('planes', 'nombre'), x = c.f.j3;
          return [[!!k && k.base === 'VARCHAR' && +k.args[0] === 50, 'La columna nombre debe quedar como VARCHAR(50).'], [!!k && k.notNull, 'La columna nombre debe seguir siendo obligatoria (NOT NULL).'],
            [c.q('SELECT nombre FROM planes WHERE id_plan = 11') === x.nombre, 'El plan de tipo hogar de mayor precio todavía no tiene el nombre nuevo, escrito tal como lo pidió marketing.'],
            [c.q('SELECT COUNT(*) FROM planes WHERE nombre = ?', [x.nombre]) <= 1, 'Ese nombre quedó en más de un plan. Restaura la base y actualiza solo el que corresponde.']];
        },
        sol: f => ['ALTER TABLE planes MODIFY nombre VARCHAR(50) NOT NULL;', "UPDATE planes SET nombre = '" + f.j3.nombre + "' WHERE id_plan = 11;"] },
      { id: 'J4', hab: 'ddl', de: 'jefe', titulo: 'Orden en la casa',
        texto: 'Quedaron restos de una migración antigua. Hay una tabla temporal con una copia vieja de líneas que ya nadie usa: elimínala.\nAdemás, la tabla que registra las cargas de procesos debe quedar vacía, pero tiene que seguir existiendo porque el sistema la usa cada noche.',
        pistas: ['SHOW TABLES te muestra las dos tablas: el nombre de una empieza con tmp y el de la otra con log.', 'DROP TABLE IF EXISTS tmp_migracion_lineas; y TRUNCATE TABLE log_cargas;'],
        pre: c => ({ nt: c.nTablas() }),
        check: c => [[!c.T('tmp_migracion_lineas'), 'La tabla temporal todavía existe.'], [!!c.T('log_cargas'), 'La tabla de cargas ya no existe: debía quedar vacía, no eliminada. Restaura la base.'],
          [!c.T('log_cargas') || c.q('SELECT COUNT(*) FROM log_cargas') === 0, 'La tabla de cargas todavía tiene filas.'], [c.nTablas() === c.pre.nt - 1, 'Debía eliminarse una sola tabla. Restaura la base y vuelve a intentarlo.']],
        sol: () => ['DROP TABLE IF EXISTS tmp_migracion_lineas;', 'TRUNCATE TABLE log_cargas;'] },
      { id: 'J5', hab: 'agregacion', de: 'cob', titulo: 'Facturas por estado',
        texto: 'Para la reunión de mañana necesito una foto de la cobranza.\nPor cada estado de factura dime cuántas facturas hay y cuál es su monto promedio, redondeado a 2 decimales.',
        pistas: ['Agrupa por el estado y usa COUNT y AVG. El redondeo se hace con ROUND(valor, 2).', 'SELECT estado, COUNT(*), ROUND(AVG(monto), 2) FROM facturas GROUP BY estado'],
        ref: () => 'SELECT estado, COUNT(*), ROUND(AVG(monto), 2) FROM facturas GROUP BY estado;' },
      { id: 'J6', hab: 'agregacion', de: 'jefe', titulo: 'Números repetidos',
        texto: 'Un número de teléfono debería pertenecer a una sola línea, pero la migración dejó números repetidos.\nDame cada número que esté repetido en la tabla de líneas con la cantidad de veces que aparece.',
        pistas: ['Agrupa por número y cuenta. La condición "más de una vez" se aplica al grupo, no a la fila.', 'GROUP BY numero HAVING COUNT(*) > 1'],
        ref: () => 'SELECT numero, COUNT(*) FROM lineas GROUP BY numero HAVING COUNT(*) > 1;' }
    ],
    [ /* ---------------- VIERNES ---------------- */
      { id: 'V1', hab: 'join', de: 'com', titulo: 'Líneas suspendidas y su plan',
        texto: 'Voy a lanzar una oferta para recuperar líneas suspendidas y necesito saber qué plan tiene cada una.\nDos columnas: el número de la línea y el nombre de su plan, ordenadas por número.',
        pistas: ['La tabla de líneas tiene la clave foránea hacia planes. Usa alias para las dos tablas.', "FROM lineas l INNER JOIN planes p ON l.id_plan = p.id_plan WHERE l.estado = 'SUSPENDIDA' ORDER BY l.numero"],
        ref: () => "SELECT l.numero, p.nombre FROM lineas l INNER JOIN planes p ON l.id_plan = p.id_plan WHERE l.estado = 'SUSPENDIDA' ORDER BY l.numero;", orden: [0] },
      { id: 'V2', hab: 'join', de: 'cob', titulo: 'Vencidas de octubre, legibles',
        texto: 'Necesito llamar a los clientes con facturas vencidas del periodo de octubre de 2026, que en la base figura como 2026-10.\nPor cada factura: los apellidos del cliente, el número de la línea, el periodo y el monto.',
        pistas: ['Una factura llega a su cliente a través de la línea. Une las tres tablas.', "FROM facturas f INNER JOIN lineas l ON f.id_linea = l.id_linea INNER JOIN clientes c ON l.id_cliente = c.id_cliente WHERE f.estado = 'VENCIDA' AND f.periodo = '2026-10'"],
        ref: () => "SELECT c.apellidos, l.numero, f.periodo, f.monto FROM facturas f INNER JOIN lineas l ON f.id_linea = l.id_linea INNER JOIN clientes c ON l.id_cliente = c.id_cliente WHERE f.estado = 'VENCIDA' AND f.periodo = '2026-10';" },
      { id: 'V3', hab: 'join', de: 'sop', titulo: 'Técnicos sin tickets',
        texto: 'Quiero repartir mejor la carga. Dame los técnicos activos que nunca han tenido un ticket asignado.\nPásame sus nombres y apellidos.',
        pistas: ['Un INNER JOIN solo trae técnicos que sí tienen tickets. Necesitas el JOIN que conserva a todos los técnicos y quedarte con los que no encontraron pareja.', 'FROM tecnicos t LEFT JOIN tickets_soporte k ON t.id_tecnico = k.id_tecnico WHERE k.id_ticket IS NULL AND t.activo = 1'],
        ref: () => 'SELECT t.nombres, t.apellidos FROM tecnicos t LEFT JOIN tickets_soporte k ON t.id_tecnico = k.id_tecnico WHERE k.id_ticket IS NULL AND t.activo = 1;' },
      { id: 'V4', hab: 'join', de: 'com', titulo: 'Recaudación por plan',
        texto: '¿Qué planes nos dejan más dinero? Considera solo las facturas pagadas.\nPor cada plan quiero su nombre, la cantidad de facturas pagadas y el monto total recaudado, del plan que más recauda al que menos.',
        pistas: ['Una factura llega a su plan a través de la línea. Une las tres tablas y luego agrupa por el nombre del plan.', "WHERE f.estado = 'PAGADA' GROUP BY p.nombre ORDER BY SUM(f.monto) DESC"],
        ref: () => "SELECT p.nombre, COUNT(*), SUM(f.monto) FROM facturas f INNER JOIN lineas l ON f.id_linea = l.id_linea INNER JOIN planes p ON l.id_plan = p.id_plan WHERE f.estado = 'PAGADA' GROUP BY p.nombre ORDER BY SUM(f.monto) DESC;", orden: [2] },
      { id: 'V5', hab: 'join', de: 'cob', titulo: 'Los mayores deudores',
        texto: f => 'Cierre de semana: gerencia quiere visitar en persona a los mayores deudores.\nQuiero el top 3 de clientes por deuda total, sumando sus facturas vencidas y pendientes, y considerando solo a quienes tienen al menos ' + f.v5.min + ' facturas impagas. Por cada uno: nombres, apellidos, nombre de su zona, cantidad de facturas impagas y deuda total, del primero al tercero.',
        pistas: ['Arma primero el JOIN de facturas, líneas, clientes y zonas filtrando los dos estados. Luego agrupa por cliente, filtra los grupos con HAVING, ordena y corta.', "WHERE f.estado IN ('VENCIDA', 'PENDIENTE') GROUP BY c.id_cliente, c.nombres, c.apellidos, z.nombre HAVING COUNT(*) >= (mínimo) ORDER BY SUM(f.monto) DESC LIMIT 3"],
        ref: f => "SELECT c.nombres, c.apellidos, z.nombre, COUNT(*), SUM(f.monto) FROM facturas f INNER JOIN lineas l ON f.id_linea = l.id_linea INNER JOIN clientes c ON l.id_cliente = c.id_cliente INNER JOIN zonas z ON c.id_zona = z.id_zona WHERE f.estado IN ('VENCIDA', 'PENDIENTE') GROUP BY c.id_cliente, c.nombres, c.apellidos, z.nombre HAVING COUNT(*) >= " + f.v5.min + ' ORDER BY SUM(f.monto) DESC LIMIT 3;', orden: [4] }
    ]
  ];

  SJ.escenarios.novatel = {
    id: 'novatel', nombre: 'NovaTel', db: 'novatel', rubro: 'Empresa de telecomunicaciones',
    resumen: 'Operador de telefonía móvil e internet para el hogar. Su base reúne planes, líneas, contratos, facturas y tickets de soporte.',
    jefe: { nombre: 'Julio Calderon', cargo: 'Jefe de Datos', saludos: [
      'Hola, {nombre}. Soy Julio Calderon, jefe de datos de NovaTel. Damos telefonía e internet a miles de clientes y cada línea, factura y reclamo vive en nuestra base. Esta semana me ayudas a mantenerla al día.',
      'Buen día, {nombre}. Ayer reconociste la base. Hoy te van a llegar pedidos con datos a medias.',
      'Miércoles, {nombre}. Desde hoy tienes permiso de escritura sobre la base.',
      'Jueves. La red crece y nos toca adaptar las tablas.',
      'Viernes, {nombre}. Cierre de semana: gerencia quiere reportes que cruzan varias tablas.'] },
    gente: {
      com: { nombre: 'Andrea Solis', cargo: 'Jefa Comercial' }, cob: { nombre: 'Percy Meza', cargo: 'Analista de Cobranzas' },
      sop: { nombre: 'Ximena Lozano', cargo: 'Supervisora de Soporte' }, atc: { nombre: 'Bruno Arce', cargo: 'Atención al Cliente' } },
    construir: construir, dias: D.semana(retos)
  };
})(typeof window !== 'undefined' ? window : global);

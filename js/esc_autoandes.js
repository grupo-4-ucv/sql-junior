/* SQL Junior - escenario 1: AutoAndes (empresa automotriz). Base de datos, datos con semilla y 25 solicitudes. */
(function (root) {
  'use strict';
  const SJ = root.SJ = root.SJ || {}, D = SJ.datos;
  SJ.escenarios = SJ.escenarios || {};

  const SEDES = [['AutoAndes Lima', 'Lima', 'Av. Javier Prado 4200'], ['AutoAndes Arequipa', 'Arequipa', 'Av. Ejercito 710'], ['AutoAndes Trujillo', 'Trujillo', 'Av. America Norte 1245'], ['AutoAndes Cusco', 'Cusco', 'Av. La Cultura 2010'], ['AutoAndes Piura', 'Piura', 'Av. Grau 1530']];
  const MARCAS = [['Toyota', 'Japon'], ['Hyundai', 'Corea del Sur'], ['Kia', 'Corea del Sur'], ['Nissan', 'Japon'], ['Chevrolet', 'Estados Unidos'], ['Suzuki', 'Japon'], ['Mazda', 'Japon'], ['Volkswagen', 'Alemania']];
  const MODELOS = [[1, 'Yaris', 'SEDAN'], [1, 'Corolla', 'SEDAN'], [1, 'Hilux', 'PICKUP'], [1, 'RAV4', 'SUV'], [2, 'Accent', 'SEDAN'], [2, 'Tucson', 'SUV'], [2, 'Creta', 'SUV'], [2, 'i10', 'HATCHBACK'],
    [3, 'Rio', 'SEDAN'], [3, 'Sportage', 'SUV'], [3, 'Picanto', 'HATCHBACK'], [3, 'Seltos', 'SUV'], [4, 'Versa', 'SEDAN'], [4, 'Sentra', 'SEDAN'], [4, 'Frontier', 'PICKUP'], [4, 'Kicks', 'SUV'],
    [5, 'Onix', 'SEDAN'], [5, 'Tracker', 'SUV'], [5, 'Spark', 'HATCHBACK'], [6, 'Swift', 'HATCHBACK'], [6, 'Vitara', 'SUV'], [6, 'Baleno', 'HATCHBACK'], [7, 'Mazda3', 'SEDAN'], [7, 'CX-5', 'SUV'], [7, 'CX-30', 'SUV'],
    [8, 'Gol', 'HATCHBACK'], [8, 'Virtus', 'SEDAN'], [8, 'T-Cross', 'SUV'], [8, 'Amarok', 'PICKUP'], [1, 'Fortuner', 'SUV']];
  const COLORES = ['Blanco', 'Negro', 'Plata', 'Gris', 'Rojo', 'Azul', 'Verde', 'Beige'];
  const PAGOS = ['CONTADO', 'CREDITO', 'TRANSFERENCIA', 'LEASING'];
  const MOTIVOS = ['PRUEBA DE MANEJO', 'MANTENIMIENTO', 'COTIZACION', 'ENTREGA DE VEHICULO', 'REVISION TECNICA'];
  const SERVICIOS = ['MANTENIMIENTO 10000 KM', 'CAMBIO DE ACEITE', 'FRENOS', 'ALINEAMIENTO Y BALANCEO', 'PLANCHADO Y PINTURA', 'DIAGNOSTICO GENERAL', 'CAMBIO DE BATERIA'];
  const PIEZAS = ['Filtro de aceite', 'Filtro de aire', 'Pastillas de freno', 'Bujia', 'Amortiguador', 'Correa de distribucion', 'Bateria 12V', 'Faro delantero', 'Espejo lateral', 'Radiador', 'Disco de freno', 'Bomba de agua'];
  const ESPECIALES = [['Estefania', 'Zegarra Olano'], ['Leonela', 'Urrutia Baca'], ['Gianella', 'Oblitas Rengifo'], ['Maricielo', 'Tuesta Pinedo']];

  const ESQUEMA = `
    CREATE TABLE sedes (id_sede INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(40) NOT NULL, ciudad VARCHAR(30) NOT NULL, direccion VARCHAR(60));
    CREATE TABLE marcas (id_marca INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(30) NOT NULL, pais_origen VARCHAR(30));
    CREATE TABLE modelos (id_modelo INT AUTO_INCREMENT PRIMARY KEY, id_marca INT NOT NULL, nombre VARCHAR(30) NOT NULL, carroceria VARCHAR(15),
      FOREIGN KEY (id_marca) REFERENCES marcas(id_marca));
    CREATE TABLE vehiculos (id_vehiculo INT AUTO_INCREMENT PRIMARY KEY, id_modelo INT NOT NULL, id_sede INT NOT NULL, placa VARCHAR(7) NOT NULL, color VARCHAR(15),
      anio INT, kilometraje INT DEFAULT 0, precio DECIMAL(10,2) NOT NULL, estado VARCHAR(12) NOT NULL DEFAULT 'DISPONIBLE',
      FOREIGN KEY (id_modelo) REFERENCES modelos(id_modelo), FOREIGN KEY (id_sede) REFERENCES sedes(id_sede));
    CREATE TABLE clientes (id_cliente INT AUTO_INCREMENT PRIMARY KEY, dni CHAR(8) NOT NULL, nombres VARCHAR(40) NOT NULL, apellidos VARCHAR(40) NOT NULL,
      telefono VARCHAR(9), correo VARCHAR(40), distrito VARCHAR(30), fecha_registro DATE);
    CREATE TABLE vendedores (id_vendedor INT AUTO_INCREMENT PRIMARY KEY, id_sede INT NOT NULL, nombres VARCHAR(40) NOT NULL, apellidos VARCHAR(40) NOT NULL,
      fecha_ingreso DATE, comision_pct DECIMAL(4,2), activo TINYINT DEFAULT 1, FOREIGN KEY (id_sede) REFERENCES sedes(id_sede));
    CREATE TABLE ventas (id_venta INT AUTO_INCREMENT PRIMARY KEY, id_vehiculo INT NOT NULL, id_cliente INT NOT NULL, id_vendedor INT NOT NULL,
      fecha_venta DATE NOT NULL, precio_final DECIMAL(10,2) NOT NULL, forma_pago VARCHAR(15),
      FOREIGN KEY (id_vehiculo) REFERENCES vehiculos(id_vehiculo), FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente), FOREIGN KEY (id_vendedor) REFERENCES vendedores(id_vendedor));
    CREATE TABLE repuestos (id_repuesto INT AUTO_INCREMENT PRIMARY KEY, codigo VARCHAR(10) NOT NULL, descripcion VARCHAR(60), stock INT DEFAULT 0, precio_unitario DECIMAL(8,2));
    CREATE TABLE servicios_taller (id_servicio INT AUTO_INCREMENT PRIMARY KEY, id_cliente INT NOT NULL, id_sede INT NOT NULL, placa VARCHAR(7), tipo_servicio VARCHAR(30),
      fecha_ingreso DATE NOT NULL, fecha_salida DATE, costo DECIMAL(8,2), estado VARCHAR(12),
      FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente), FOREIGN KEY (id_sede) REFERENCES sedes(id_sede));
    CREATE TABLE citas (id_cita INT AUTO_INCREMENT PRIMARY KEY, id_cliente INT NOT NULL, id_sede INT NOT NULL, fecha_cita DATE NOT NULL, hora VARCHAR(5), motivo VARCHAR(30), estado VARCHAR(12),
      FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente), FOREIGN KEY (id_sede) REFERENCES sedes(id_sede));
    CREATE TABLE tmp_clientes_2019 (id INT, dni CHAR(8), nombre_completo VARCHAR(80));
    CREATE TABLE log_importacion (id_log INT AUTO_INCREMENT PRIMARY KEY, archivo VARCHAR(40), fecha_carga DATE, filas INT);`;

  function construir(E, R) {
    const F = D.fabrica(R), f = {}, r2 = x => Math.round(x * 100) / 100;
    E.ddl(ESQUEMA);
    E.ins('sedes', ['nombre', 'ciudad', 'direccion'], SEDES);
    E.ins('marcas', ['nombre', 'pais_origen'], MARCAS);
    E.ins('modelos', ['id_marca', 'nombre', 'carroceria'], MODELOS);

    /* vendedores: 15 regulares (3 por sede), 2 activos sin ventas y 1 inactivo sin ventas */
    const fechasV = new Set(), fIng = (a, b) => { let x; do { x = R.fecha(a, b); } while (fechasV.has(x)); fechasV.add(x); return x; };
    const VD = [];
    for (let s = 1; s <= 5; s++) for (let k = 0; k < 3; k++) VD.push(Object.assign(F.persona(), { sede: s, ingreso: fIng('2012-01-10', '2024-06-30'), activo: 1 }));
    const sX2 = R.int(1, 5), sInact = (sX2 % 5) + 1;
    VD.filter(v => v.sede === sInact).sort((a, b) => a.ingreso < b.ingreso ? 1 : -1)[0].activo = 0;
    VD.push(Object.assign(F.persona(), { sede: R.int(1, 5), ingreso: fIng('2025-02-01', '2025-09-30'), activo: 1, sinVentas: true }));
    VD.push(Object.assign(F.persona(), { sede: R.int(1, 5), ingreso: fIng('2025-02-01', '2025-09-30'), activo: 1, sinVentas: true }));
    VD.push(Object.assign(F.persona(), { sede: R.int(1, 5), ingreso: fIng('2020-01-01', '2021-12-31'), activo: 0, sinVentas: true }));
    VD.forEach((v, i) => { v.id = i + 1; });
    E.ins('vendedores', ['id_sede', 'nombres', 'apellidos', 'fecha_ingreso', 'comision_pct', 'activo'], VD.map(v => [v.sede, v.nombres, v.apellidos, v.ingreso, R.pick([1.5, 2, 2.5, 3]), v.activo]));
    const mayor = VD.filter(v => v.sede === sX2 && v.activo && !v.sinVentas).sort((a, b) => a.ingreso < b.ingreso ? -1 : 1)[0];

    /* vehiculos */
    const precios = new Set(), kms = new Set(), placas = new Set(), L = 'ABCDEFGHJKLMNPRSTVWXYZ';
    const precio = (a, b) => { let p; do { p = r2(R.int(a, b) + R.int(0, 99) / 100); } while (precios.has(p)); precios.add(p); return p; };
    const km = (a, b) => { let k; do { k = R.int(a, b); } while (kms.has(k)); kms.add(k); return k; };
    const placa = () => { let p; do { p = R.pick(L) + R.pick(L) + R.pick(L) + '-' + R.digitos(3); } while (placas.has(p)); placas.add(p); return p; };
    const veh = o => {
      const v = Object.assign({ modelo: R.int(1, 30), sede: R.int(1, 5), placa: placa(), color: R.pick(COLORES), anio: R.int(2015, 2026), estado: 'DISPONIBLE' }, o);
      if (v.km == null) v.km = v.anio >= 2026 ? 0 : km(4000, 165000);
      if (v.precio == null) v.precio = precio(9500, 45000);
      return v;
    };
    const VS = [];
    for (let i = 0; i < 100; i++) VS.push(veh({ estado: 'VENDIDO' }));
    for (let i = 0; i < R.int(6, 9); i++) VS.push(veh({ estado: 'RESERVADO' }));
    for (let i = 0; i < 5; i++) VS.push(veh({ estado: 'EN TALLER' }));
    for (let i = 0; i < 46; i++) VS.push(veh({}));
    const sL4 = R.int(1, 5), cols = R.varios(COLORES, 2);
    for (let i = 0; i < 3; i++) VS.push(veh({ sede: sL4, color: cols[i % 2], anio: R.int(2021, 2025), km: km(8000, 59000) }));
    VS.push(veh({ sede: sL4, color: cols[0], anio: 2019, km: km(20000, 59000) }));
    VS.push(veh({ sede: sL4, color: cols[1], anio: 2023, km: km(61000, 120000) }));
    const barato = veh({ sede: sX2, anio: R.int(2015, 2018), precio: precio(7000, 8900) });
    VS.push(barato);
    const VM = R.mezcla(VS); VM.forEach((v, i) => { v.id = i + 1; });
    E.ins('vehiculos', ['id_modelo', 'id_sede', 'placa', 'color', 'anio', 'kilometraje', 'precio', 'estado'], VM.map(v => [v.modelo, v.sede, v.placa, v.color, v.anio, v.km, v.precio, v.estado]));
    f.l4 = { ciudad: SEDES[sL4 - 1][1], sede: sL4, c1: cols[0], c2: cols[1], anio: 2021, km: 60000 };

    /* clientes: 130 base + duplicados */
    f.sucios = F.sucios();
    const N = 130, dist = F.distritos(N, f.sucios), CL = [];
    for (let i = 0; i < N; i++) {
      const p = F.persona(), x = R.n();
      CL.push({ dni: F.dni(), nombres: p.nombres, apellidos: p.apellidos, telefono: F.telefono(), correo: x < 0.09 ? null : x < 0.14 ? '' : F.correo(p, 40), distrito: dist[i], reg: R.fecha('2019-01-15', '2026-11-10') });
    }
    const apeM1 = R.pick(D.APE);
    [[3, 'gmail.com'], [40, 'gmail.com'], [77, 'hotmail.com']].forEach(par => {
      const c = CL[par[0]]; c.apellidos = apeM1 + ' ' + R.pick(D.APE);
      c.correo = (c.nombres.split(' ')[0] + '.' + apeM1 + R.int(100, 999)).toLowerCase() + '@' + par[1];
    });
    f.m1 = { pref: apeM1.slice(0, 3) };
    const esp = R.pick(ESPECIALES), orig = CL[20];
    orig.nombres = esp[0]; orig.apellidos = esp[1]; orig.distrito = F.limpio(f.sucios); orig.correo = (esp[0] + '.' + esp[1].split(' ')[0]).toLowerCase() + '@gmail.com';
    [10, 64, 64, 101].forEach(k => { const o = CL[k]; CL.push({ dni: o.dni, nombres: o.nombres, apellidos: o.apellidos, telefono: F.telefono(), correo: null, distrito: F.limpio(f.sucios), reg: R.fecha('2026-06-01', '2026-11-05') }); });
    CL.push({ dni: orig.dni, nombres: orig.nombres, apellidos: orig.apellidos, telefono: F.telefono(), correo: null, distrito: orig.distrito, reg: '2026-11-12' });
    E.ins('clientes', ['dni', 'nombres', 'apellidos', 'telefono', 'correo', 'distrito', 'fecha_registro'], CL.map(c => [c.dni, c.nombres, c.apellidos, c.telefono, c.correo, c.distrito, c.reg]));
    const idOrig = 21, idDup = CL.length;
    f.x5 = { nombres: orig.nombres, apellidos: orig.apellidos, orig: idOrig, dup: idDup };
    const px1 = F.persona();
    f.x1 = { dni: F.dni(), nombres: px1.nombres, apellidos: px1.apellidos, telefono: F.telefono(), correo: F.correo(px1, 40), distrito: F.limpio(f.sucios) };

    /* ventas */
    const finales = new Set(), VT = [];
    VS.filter(v => v.estado === 'VENDIDO').forEach((v, i) => {
      const c = VD.filter(x => x.sede === v.sede && !x.sinVentas), vd = R.pick([c[0], c[0], c[0], c[1], c[1], c[2]]);
      let fecha = R.prob(0.25) ? R.fecha('2025-03-01', '2025-12-28') : R.fecha('2026-01-05', '2026-11-13'), pago = R.pick(PAGOS), pf;
      if (i < 5) { fecha = R.fecha('2026-10-01', '2026-10-15'); pago = R.pick(['CONTADO', 'TRANSFERENCIA']); }
      else if (i < 8) { fecha = R.fecha('2026-10-01', '2026-10-15'); pago = R.pick(['CREDITO', 'LEASING']); }
      else if (i < 12) fecha = R.fecha('2026-10-16', '2026-10-31');
      do { pf = r2(v.precio * (0.93 + R.n() * 0.07)); } while (finales.has(pf)); finales.add(pf);
      VT.push({ veh: v.id, cli: R.int(1, N), vend: vd.id, fecha: fecha, pf: pf, pago: pago });
    });
    VT.sort((a, b) => a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.veh - b.veh);
    E.ins('ventas', ['id_vehiculo', 'id_cliente', 'id_vendedor', 'fecha_venta', 'precio_final', 'forma_pago'], VT.map(v => [v.veh, v.cli, v.vend, v.fecha, v.pf, v.pago]));
    const top = VT.filter(v => v.fecha >= '2026-01-01').sort((a, b) => b.pf - a.pf)[0], cj = CL[top.cli - 1];
    f.j3 = { cliente: top.cli, correo: (cj.nombres.split(' ')[0] + '.' + cj.apellidos.split(' ')[0]).toLowerCase() + '.gerencia.general@corporacionandinadelsur.com.pe' };
    const cuenta = {}; VT.filter(v => v.fecha >= '2026-01-01').forEach(v => { cuenta[v.vend] = (cuenta[v.vend] || 0) + 1; });
    const orden = Object.keys(cuenta).map(k => cuenta[k]).sort((a, b) => b - a);
    f.v5 = { min: Math.max(2, orden[Math.min(4, orden.length - 2)]) };
    f.x2 = { ciudad: SEDES[sX2 - 1][1], sede: sX2, veh: barato.id, precio: barato.precio, vend: mayor.id };

    /* citas */
    const sX3 = R.int(1, 5), mX3 = R.pick(MOTIVOS), CT = [];
    for (let i = 0; i < 80; i++) {
      let fe; do { fe = R.fecha('2026-09-01', '2026-11-30'); } while (fe === '2026-11-19');
      CT.push([R.int(1, N), R.int(1, 5), fe, R.pick(['09:00', '10:30', '11:00', '15:00', '16:30']), R.pick(MOTIVOS), fe < '2026-11-16' ? R.pick(['ATENDIDA', 'ATENDIDA', 'CANCELADA']) : 'PENDIENTE']);
    }
    const idX3 = 56;
    CT.push([idX3, sX3, '2026-11-19', '10:30', mX3, 'PENDIENTE']);
    CT.push([R.int(60, 120), (sX3 % 5) + 1, '2026-11-19', '09:00', R.pick(MOTIVOS), 'PENDIENTE']);
    CT.push([R.int(60, 120), ((sX3 + 1) % 5) + 1, '2026-11-19', '15:00', mX3, 'PENDIENTE']);
    CT.push([idDup, R.int(1, 5), '2026-11-24', '11:00', 'COTIZACION', 'PENDIENTE']);
    CT.push([idDup, R.int(1, 5), '2026-11-27', '16:30', 'PRUEBA DE MANEJO', 'PENDIENTE']);
    E.ins('citas', ['id_cliente', 'id_sede', 'fecha_cita', 'hora', 'motivo', 'estado'], R.mezcla(CT));
    f.x3 = { ciudad: SEDES[sX3 - 1][1], sede: sX3, motivo: mX3, cliente: idX3, tel: F.telefono() };

    /* servicios de taller */
    const SV = [], serv = (ing, dur, cli) => {
      const sal = SJ.masDias(ing, dur), listo = sal <= '2026-11-13';
      SV.push([cli || R.int(1, N), R.int(1, 5), placa(), R.pick(SERVICIOS), ing, listo ? sal : null, R.dinero(80, 2500), listo ? 'ENTREGADO' : 'EN PROCESO']);
    };
    for (let i = 0; i < 140; i++) serv(R.fecha('2025-06-01', '2026-11-12'), R.int(0, 6));
    for (let i = 0; i < 5; i++) serv(R.fecha('2026-10-01', '2026-10-18'), R.int(8, 15));
    for (let i = 0; i < 2; i++) serv(R.fecha('2026-10-03', '2026-10-20'), 7);
    for (let i = 0; i < 3; i++) serv(R.fecha('2026-09-01', '2026-09-15'), R.int(9, 14));
    serv('2026-11-12', 1, idDup);
    E.ins('servicios_taller', ['id_cliente', 'id_sede', 'placa', 'tipo_servicio', 'fecha_ingreso', 'fecha_salida', 'costo', 'estado'], R.mezcla(SV));

    /* repuestos y restos de migracion */
    const RP = [];
    for (let i = 0; i < 60; i++) RP.push([F.codigo(() => 'RP-' + R.digitos(4)), R.pick(PIEZAS) + ' ' + R.pick(MARCAS)[0], R.int(0, 80), R.dinero(15, 900)]);
    E.ins('repuestos', ['codigo', 'descripcion', 'stock', 'precio_unitario'], RP);
    E.ins('tmp_clientes_2019', ['id', 'dni', 'nombre_completo'], CL.slice(0, 20).map((c, i) => [i + 1, c.dni, (c.apellidos + ', ' + c.nombres).toUpperCase()]));
    const LG = [];
    for (let i = 0; i < 40; i++) LG.push(['carga_' + R.pick(['clientes', 'ventas', 'repuestos', 'citas']) + '_' + R.digitos(4) + '.csv', R.fecha('2026-01-05', '2026-11-13'), R.int(10, 900)]);
    E.ins('log_importacion', ['archivo', 'fecha_carga', 'filas'], LG);
    return f;
  }

  const q1 = s => String(s).replace(/'/g, "''");
  const retos = [
    [ /* ---------------- LUNES ---------------- */
      { id: 'L1', hab: 'explorar', de: 'jefe', titulo: 'Reconoce el terreno',
        texto: 'Tu usuario ya tiene acceso al servidor. Conéctate a la base de la empresa, mira qué tablas tiene y revisa la estructura de la tabla donde registramos los autos que vendemos.\nNo necesito que me envíes nada: solo quiero que conozcas la base antes de recibir pedidos. Cuando termines, presiona Entregar.',
        pistas: ['Son tres sentencias, en este orden: elegir la base, listar sus tablas y describir una tabla. Las tres están en la primera nota de tu libreta.', 'La base se llama autoandes. La tabla de los autos es vehiculos.'],
        check: c => [[c.st.some(s => s.t === 'use'), 'Todavía no seleccionaste la base de datos.'], [c.st.some(s => s.s === 'tables'), 'Falta listar las tablas de la base.'], [c.st.some(s => s.t === 'describe' && s.tb === 'vehiculos'), 'Falta revisar la estructura de la tabla donde están los autos.']],
        sol: () => ['USE autoandes;', 'SHOW TABLES;', 'DESCRIBE vehiculos;'] },
      { id: 'L2', hab: 'select', de: 'ventas', titulo: 'Autos reservados',
        texto: 'Hola. Tengo clientes preguntando por autos que figuran como reservados y quiero confirmar cuáles son.\nPásame la placa, el color y el precio de todos los vehículos reservados.',
        pistas: ['Explora primero: un SELECT * sobre la tabla de vehículos te muestra qué columna guarda la situación de cada auto y cómo está escrito el valor.', "La columna es estado y el valor es 'RESERVADO'. Devuelve solo placa, color y precio."],
        ref: () => "SELECT placa, color, precio FROM vehiculos WHERE estado = 'RESERVADO';" },
      { id: 'L3', hab: 'select', de: 'ger', titulo: 'Los cinco más caros',
        texto: 'Para la vitrina de la web necesito los cinco autos disponibles de mayor precio.\nEnvíame placa, año y precio, del más caro al más barato.',
        pistas: ['Filtra los disponibles, ordena por precio de mayor a menor y quédate con cinco filas.', "WHERE estado = 'DISPONIBLE' ORDER BY precio DESC LIMIT 5"],
        ref: () => "SELECT placa, anio, precio FROM vehiculos WHERE estado = 'DISPONIBLE' ORDER BY precio DESC LIMIT 5;", orden: [2] },
      { id: 'L4', hab: 'filtros', de: 'ventas', titulo: 'Un pedido muy específico',
        texto: f => 'Tengo un cliente en nuestra sede de ' + f.l4.ciudad + '. Quiere un auto disponible de color ' + f.l4.c1 + ' o ' + f.l4.c2 + ', del año ' + f.l4.anio + ' en adelante y con menos de ' + f.l4.km + ' kilómetros.\nDame placa, color, año y kilometraje de los que cumplan, ordenados del menor al mayor kilometraje.',
        pistas: ['La tabla de vehículos no guarda la ciudad: guarda un identificador de sede. Averigua en otra tabla cuál corresponde a esa ciudad.', 'Son cinco condiciones unidas con AND. Las dos de color van juntas, entre paréntesis y unidas con OR.'],
        ref: f => "SELECT placa, color, anio, kilometraje FROM vehiculos WHERE estado = 'DISPONIBLE' AND id_sede = " + f.l4.sede + " AND (color = '" + f.l4.c1 + "' OR color = '" + f.l4.c2 + "') AND anio >= " + f.l4.anio + ' AND kilometraje < ' + f.l4.km + ' ORDER BY kilometraje;', orden: [3] }
    ],
    [ /* ---------------- MARTES ---------------- */
      { id: 'M1', hab: 'filtros', de: 'atc', titulo: 'La llamada que se cortó',
        texto: f => 'Me llamó un cliente y se cortó la comunicación. Solo alcancé a anotar que su primer apellido empieza con "' + f.m1.pref + '" y que su correo es de Gmail.\nPásame nombres, apellidos y teléfono de los clientes que coincidan, para devolverle la llamada.',
        pistas: ['Necesitas dos patrones con LIKE: uno para un texto que empieza de cierta forma y otro para un texto que termina de cierta forma.', f => "apellidos LIKE '" + f.m1.pref + "%' AND correo LIKE '%@gmail.com'"],
        ref: f => "SELECT nombres, apellidos, telefono FROM clientes WHERE apellidos LIKE '" + f.m1.pref + "%' AND correo LIKE '%@gmail.com';" },
      { id: 'M2', hab: 'filtros', de: 'ventas', titulo: 'Ventas de la primera quincena',
        texto: 'Estoy cuadrando caja. Necesito las ventas hechas entre el 1 y el 15 de octubre de 2026 que se pagaron al contado o con transferencia.\nEnvíame el número de venta, la fecha y el precio final, de mayor a menor precio.',
        pistas: ['Revisa cómo están escritas las formas de pago en la tabla de ventas. Luego combina un rango de fechas con una lista de valores.', "fecha_venta BETWEEN '2026-10-01' AND '2026-10-15' AND forma_pago IN ('CONTADO', 'TRANSFERENCIA')"],
        ref: () => "SELECT id_venta, fecha_venta, precio_final FROM ventas WHERE fecha_venta BETWEEN '2026-10-01' AND '2026-10-15' AND forma_pago IN ('CONTADO', 'TRANSFERENCIA') ORDER BY precio_final DESC;", orden: [2] },
      { id: 'M3', hab: 'filtros', de: 'atc', titulo: 'Clientes sin correo',
        texto: 'Vamos a lanzar una campaña por correo y necesito saber a quiénes no podremos escribirles.\nDame DNI, nombres, apellidos y teléfono de los clientes que no tienen correo registrado. Revisa bien cómo quedó guardado ese vacío: el sistema antiguo y el nuevo no lo guardaban igual.',
        pistas: ["Hay dos tipos de vacío en esa columna: el valor NULL y el texto vacío ''. Tu filtro debe cubrir los dos.", "WHERE correo IS NULL OR correo = ''"],
        ref: () => "SELECT dni, nombres, apellidos, telefono FROM clientes WHERE correo IS NULL OR correo = '';" },
      { id: 'M4', hab: 'funciones', de: 'jefe', titulo: 'Distritos mal escritos',
        texto: 'Sospecho que los distritos de los clientes están escritos de varias formas: con mayúsculas mezcladas, con espacios de más y hasta con errores de tipeo.\nDame la lista de distritos sin repetir, pasando cada uno a mayúsculas y sin espacios al inicio ni al final, en orden alfabético. Con eso veré cuáles siguen mal escritos.',
        pistas: ['Se combinan dos funciones de texto, una dentro de la otra, y se quitan los repetidos del resultado.', 'SELECT DISTINCT UPPER(TRIM(distrito)) FROM clientes ORDER BY 1'],
        ref: () => 'SELECT DISTINCT UPPER(TRIM(distrito)) FROM clientes ORDER BY 1;', orden: [0] },
      { id: 'M5', hab: 'funciones', de: 'taller', titulo: 'Autos que se quedaron de más',
        texto: 'Gerencia me reclama por demoras. Necesito los servicios de taller que ingresaron en octubre de 2026 y estuvieron más de 7 días con nosotros.\nEnvíame la placa, el tipo de servicio y cuántos días pasaron entre el ingreso y la salida.',
        pistas: ['DATEDIFF(fecha_fin, fecha_inicio) calcula los días. Puedes usarla en el SELECT y también en el WHERE.', 'WHERE YEAR(fecha_ingreso) = 2026 AND MONTH(fecha_ingreso) = 10 AND DATEDIFF(fecha_salida, fecha_ingreso) > 7'],
        ref: () => 'SELECT placa, tipo_servicio, DATEDIFF(fecha_salida, fecha_ingreso) FROM servicios_taller WHERE YEAR(fecha_ingreso) = 2026 AND MONTH(fecha_ingreso) = 10 AND DATEDIFF(fecha_salida, fecha_ingreso) > 7;' }
    ],
    [ /* ---------------- MIERCOLES ---------------- */
      { id: 'X1', hab: 'dml', de: 'atc', titulo: 'Cliente nuevo',
        texto: f => 'Acaba de registrarse un cliente en el mostrador. Ingrésalo a la base con fecha de registro de hoy.\nNombres: ' + f.x1.nombres + '\nApellidos: ' + f.x1.apellidos + '\nDNI: ' + f.x1.dni + '\nTeléfono: ' + f.x1.telefono + '\nCorreo: ' + f.x1.correo + '\nDistrito: ' + f.x1.distrito,
        pistas: ['Mira la estructura de la tabla de clientes con DESCRIBE. El identificador se genera solo: no lo incluyas.', 'INSERT INTO clientes (dni, nombres, apellidos, telefono, correo, distrito, fecha_registro) VALUES (...). La fecha de hoy la entrega CURDATE().'],
        pre: c => ({ n: c.q('SELECT COUNT(*) FROM clientes') }),
        check: c => {
          const x = c.f.x1, n = c.q('SELECT COUNT(*) FROM clientes WHERE dni = ?', [x.dni]);
          return [[n === 1, n ? 'Ese DNI quedó registrado más de una vez. Restaura la base y vuelve a intentarlo.' : 'No encuentro ningún cliente con el DNI de la ficha.'],
            [c.q('SELECT COUNT(*) FROM clientes WHERE dni = ? AND nombres = ? AND apellidos = ? AND telefono = ? AND correo = ? AND distrito = ?', [x.dni, x.nombres, x.apellidos, x.telefono, x.correo, x.distrito]) === 1, 'El cliente existe, pero algún dato (nombres, apellidos, teléfono, correo o distrito) no coincide con la ficha.'],
            [c.q('SELECT COUNT(*) FROM clientes WHERE dni = ? AND fecha_registro = ?', [x.dni, c.hoy]) === 1, 'La fecha de registro debe ser la de hoy.'],
            [c.q('SELECT COUNT(*) FROM clientes') === c.pre.n + 1, 'La tabla de clientes debe tener exactamente un registro más que antes.']];
        },
        sol: f => ["INSERT INTO clientes (dni, nombres, apellidos, telefono, correo, distrito, fecha_registro) VALUES ('" + f.x1.dni + "', '" + q1(f.x1.nombres) + "', '" + q1(f.x1.apellidos) + "', '" + f.x1.telefono + "', '" + f.x1.correo + "', '" + f.x1.distrito + "', CURDATE());"] },
      { id: 'X2', hab: 'dml', de: 'ventas', titulo: 'Primera venta del día',
        texto: f => 'El cliente que registraste hace un momento ya compró. Se llevó el auto disponible más económico de la sede de ' + f.x2.ciudad + ', al contado y al precio de lista. Lo atendió la persona con más antigüedad del equipo de ventas activo de esa sede.\nRegistra la venta con fecha de hoy y no olvides que ese auto ya no está disponible.',
        pistas: ['Antes de escribir necesitas cuatro datos: el id del cliente, el id del auto con su precio, el id de la sede y el id del vendedor. Cada uno sale de un SELECT.', "Son dos sentencias: un INSERT en ventas con forma de pago 'CONTADO' y un UPDATE que deja el estado del auto en 'VENDIDO'."],
        pre: c => ({ nv: c.q('SELECT COUNT(*) FROM ventas'), ve: c.q("SELECT COUNT(*) FROM vehiculos WHERE estado = 'VENDIDO'") }),
        check: c => {
          const x = c.f.x2;
          return [[c.q('SELECT COUNT(*) FROM ventas WHERE id_vehiculo = ? AND fecha_venta = ?', [x.veh, c.hoy]) === 1, 'No encuentro una venta de hoy para el auto correcto. Revisa cuál es el disponible más económico de esa sede.'],
            [c.q("SELECT COUNT(*) FROM ventas WHERE id_vehiculo = ? AND id_cliente IN (SELECT id_cliente FROM clientes WHERE dni = ?) AND id_vendedor = ? AND ABS(precio_final - ?) < 0.01 AND forma_pago = 'CONTADO'", [x.veh, c.f.x1.dni, x.vend, x.precio]) === 1, 'La venta existe, pero el cliente, el vendedor, el precio final o la forma de pago no coinciden con lo solicitado.'],
            [c.q('SELECT estado FROM vehiculos WHERE id_vehiculo = ?', [x.veh]) === 'VENDIDO', 'El auto vendido todavía no figura como VENDIDO.'],
            [c.q('SELECT COUNT(*) FROM ventas') === c.pre.nv + 1, 'Debe haber exactamente una venta nueva.'],
            [c.q("SELECT COUNT(*) FROM vehiculos WHERE estado = 'VENDIDO'") === c.pre.ve + 1, 'Solo un vehículo debía cambiar de estado.']];
        },
        sol: f => ["INSERT INTO ventas (id_vehiculo, id_cliente, id_vendedor, fecha_venta, precio_final, forma_pago) VALUES (" + f.x2.veh + ", (SELECT id_cliente FROM clientes WHERE dni = '" + f.x1.dni + "'), " + f.x2.vend + ', CURDATE(), ' + f.x2.precio + ", 'CONTADO');",
          "UPDATE vehiculos SET estado = 'VENDIDO' WHERE id_vehiculo = " + f.x2.veh + ';'] },
      { id: 'X3', hab: 'dml', de: 'atc', titulo: 'Cambio de teléfono',
        texto: f => 'Llamó la persona que tiene cita este jueves 19 en la sede de ' + f.x3.ciudad + ' por "' + f.x3.motivo + '". Cambió de número y el nuevo es ' + f.x3.tel + '.\nActualiza su teléfono. No anoté su nombre: tendrás que ubicarla por la cita.',
        pistas: ['Recorre el camino por partes: la ciudad te da un id de sede; con ese id, la fecha y el motivo encuentras la cita; y la cita te dice qué cliente es.', "Cuando tengas el id del cliente: UPDATE clientes SET telefono = '...' WHERE id_cliente = ...;"],
        check: c => [[c.q('SELECT telefono FROM clientes WHERE id_cliente = ?', [c.f.x3.cliente]) === c.f.x3.tel, 'El cliente de esa cita todavía no tiene el teléfono nuevo.'],
          [c.q('SELECT COUNT(*) FROM clientes WHERE telefono = ?', [c.f.x3.tel]) <= 1, 'Ese número quedó en más de un cliente. Restaura la base y actualiza solo a quien corresponde.']],
        sol: f => ["UPDATE clientes SET telefono = '" + f.x3.tel + "' WHERE id_cliente = " + f.x3.cliente + ';'] },
      { id: 'X4', hab: 'dml', de: 'jefe', titulo: 'Limpieza de distritos',
        texto: f => 'Ayer viste que hay distritos mal escritos en la tabla de clientes. Toca corregirlos.\nLos tres con problemas son ' + f.sucios[0] + ', ' + f.sucios[1] + ' y ' + f.sucios[2] + '. Todas sus variantes (mayúsculas, espacios de más, errores de tipeo) deben quedar escritas exactamente así. El resto de distritos está bien.',
        pistas: ["Lista primero las variantes de cada distrito con SELECT DISTINCT. Los espacios no se ven a simple vista: CONCAT('[', distrito, ']') o LENGTH(distrito) los delatan.", 'Un UPDATE por distrito. En el WHERE, UPPER(TRIM(distrito)) atrapa las variantes con mayúsculas y espacios; la variante con error de tipeo se agrega con OR.'],
        pre: c => ({ dist: D.preDistritos(c, 'clientes', c.f.sucios) }),
        check: c => D.checkDistritos(c, 'clientes', c.f.sucios),
        sol: f => D.solDistritos('clientes', f.sucios) },
      { id: 'X5', hab: 'dml', de: 'jefe', titulo: 'Cliente duplicado',
        texto: f => 'Atención al cliente reporta que a la clienta ' + f.x5.nombres + ' ' + f.x5.apellidos + ' le llegan los mensajes dos veces. Seguro está registrada dos veces.\nConserva su registro más antiguo y elimina el duplicado. Antes de borrarlo, pasa al registro original todo lo que el duplicado tenga asociado en otras tablas: no se puede perder historial.',
        pistas: ['Si intentas el DELETE directo, MySQL responde el error 1451: el duplicado tiene filas hijas. Busca su id en las tablas que tienen la columna id_cliente.', 'El duplicado tiene citas y un servicio de taller. Dos UPDATE cambian su id_cliente al del registro original; recién entonces funciona el DELETE.'],
        pre: c => ({ n: c.q('SELECT COUNT(*) FROM clientes'), ci: c.q('SELECT COUNT(*) FROM citas WHERE id_cliente IN (?, ?)', [c.f.x5.orig, c.f.x5.dup]), se: c.q('SELECT COUNT(*) FROM servicios_taller WHERE id_cliente IN (?, ?)', [c.f.x5.orig, c.f.x5.dup]) }),
        check: c => {
          const x = c.f.x5;
          return [[c.q('SELECT COUNT(*) FROM clientes WHERE id_cliente = ?', [x.dup]) === 0, 'El registro duplicado todavía existe.'],
            [c.q('SELECT COUNT(*) FROM clientes WHERE id_cliente = ?', [x.orig]) === 1, 'El registro original ya no existe y era el que debía conservarse. Restaura la base.'],
            [c.q('SELECT COUNT(*) FROM citas WHERE id_cliente = ?', [x.orig]) === c.pre.ci && c.q('SELECT COUNT(*) FROM servicios_taller WHERE id_cliente = ?', [x.orig]) === c.pre.se, 'El historial del duplicado (citas y servicios) no pasó completo al registro original.'],
            [c.q('SELECT COUNT(*) FROM clientes') === c.pre.n - 1, 'Solo debía eliminarse un cliente.']];
        },
        sol: f => ['UPDATE citas SET id_cliente = ' + f.x5.orig + ' WHERE id_cliente = ' + f.x5.dup + ';', 'UPDATE servicios_taller SET id_cliente = ' + f.x5.orig + ' WHERE id_cliente = ' + f.x5.dup + ';', 'DELETE FROM clientes WHERE id_cliente = ' + f.x5.dup + ';'] }
    ],
    [ /* ---------------- JUEVES ---------------- */
      { id: 'J1', hab: 'ddl', de: 'ger', titulo: 'Tipo de combustible',
        texto: 'Desde este mes vendemos híbridos y eléctricos, así que necesitamos registrar el combustible de cada auto.\nAgrega a la tabla de vehículos una columna llamada combustible, de texto de hasta 15 caracteres, que por defecto valga GASOLINA.',
        pistas: ['Es un ALTER TABLE con ADD COLUMN. El valor por defecto se indica con DEFAULT después del tipo.', "ALTER TABLE vehiculos ADD COLUMN combustible VARCHAR(15) DEFAULT 'GASOLINA';"],
        check: c => {
          const k = c.col('vehiculos', 'combustible');
          return [[!!k, 'La tabla vehiculos todavía no tiene la columna combustible.'], [!!k && k.base === 'VARCHAR' && +k.args[0] === 15, 'La columna debe ser VARCHAR(15).'], [!!k && String(k.def).toUpperCase() === 'GASOLINA', 'El valor por defecto debe ser GASOLINA.']];
        },
        sol: () => ["ALTER TABLE vehiculos ADD COLUMN combustible VARCHAR(15) DEFAULT 'GASOLINA';"] },
      { id: 'J2', hab: 'ddl', de: 'jefe', titulo: 'Tabla de seguros',
        texto: 'Vamos a vender seguros vehiculares y necesitamos dónde guardarlos. Crea la tabla seguros con estas columnas:\nid_seguro: entero, autoincremental, clave primaria.\nid_vehiculo: entero, obligatorio, clave foránea hacia la tabla de vehículos.\naseguradora: texto de hasta 40 caracteres, obligatorio.\nfecha_inicio y fecha_fin: fechas.\nprima: decimal de 8 dígitos con 2 decimales.',
        pistas: ['Sigue el ejemplo de CREATE TABLE de tu libreta: primero las columnas, luego PRIMARY KEY y FOREIGN KEY con REFERENCES. No olvides IF NOT EXISTS.', 'La clave foránea se escribe: FOREIGN KEY (id_vehiculo) REFERENCES vehiculos(id_vehiculo). Obligatorio se escribe NOT NULL.'],
        check: c => D.checkTabla(c, 'seguros', { cols: { id_seguro: { tipo: 'INT', auto: true }, id_vehiculo: { tipo: 'INT', nn: true }, aseguradora: { tipo: 'VARCHAR(40)', nn: true }, fecha_inicio: { tipo: 'DATE' }, fecha_fin: { tipo: 'DATE' }, prima: { tipo: 'DECIMAL(8,2)' } }, pk: 'id_seguro', fk: ['id_vehiculo', 'vehiculos', 'id_vehiculo'] }),
        sol: () => ['CREATE TABLE IF NOT EXISTS seguros (id_seguro INT AUTO_INCREMENT, id_vehiculo INT NOT NULL, aseguradora VARCHAR(40) NOT NULL, fecha_inicio DATE, fecha_fin DATE, prima DECIMAL(8,2), PRIMARY KEY (id_seguro), FOREIGN KEY (id_vehiculo) REFERENCES vehiculos(id_vehiculo));'] },
      { id: 'J3', hab: 'ddl', de: 'atc', titulo: 'Un correo que no entra',
        texto: f => 'No puedo guardar el correo corporativo de un cliente: el sistema dice que es demasiado largo.\nEs el cliente de la venta con mayor precio final de este año. Su nuevo correo es ' + f.j3.correo + '\nAmplía la columna de correo de los clientes a 100 caracteres y luego actualiza su correo.',
        pistas: ['Primero ubica al cliente: ordena las ventas de 2026 por precio final. Luego revisa con DESCRIBE qué tamaño tiene hoy la columna correo.', 'ALTER TABLE clientes MODIFY correo VARCHAR(100); y después un UPDATE con el id del cliente.'],
        check: c => {
          const k = c.col('clientes', 'correo');
          return [[!!k && k.base === 'VARCHAR' && +k.args[0] === 100, 'La columna correo debe quedar como VARCHAR(100).'],
            [String(c.q('SELECT correo FROM clientes WHERE id_cliente = ?', [c.f.j3.cliente])).toLowerCase() === c.f.j3.correo, 'El cliente de la venta más cara de 2026 todavía no tiene el correo nuevo.'],
            [c.q('SELECT COUNT(*) FROM clientes WHERE correo = ?', [c.f.j3.correo]) <= 1, 'Ese correo quedó en más de un cliente.']];
        },
        sol: f => ['ALTER TABLE clientes MODIFY correo VARCHAR(100);', "UPDATE clientes SET correo = '" + f.j3.correo + "' WHERE id_cliente = " + f.j3.cliente + ';'] },
      { id: 'J4', hab: 'ddl', de: 'jefe', titulo: 'Orden en la casa',
        texto: 'Quedaron restos de una migración antigua. Hay una tabla temporal con una copia vieja de clientes que ya nadie usa: elimínala.\nAdemás, la tabla que registra las importaciones de archivos debe quedar vacía, pero tiene que seguir existiendo porque el sistema la usa cada noche.',
        pistas: ['SHOW TABLES te muestra las dos tablas: el nombre de una empieza con tmp y el de la otra con log.', 'DROP TABLE IF EXISTS tmp_clientes_2019; y TRUNCATE TABLE log_importacion;'],
        pre: c => ({ nt: c.nTablas() }),
        check: c => [[!c.T('tmp_clientes_2019'), 'La tabla temporal todavía existe.'], [!!c.T('log_importacion'), 'La tabla de importaciones ya no existe: debía quedar vacía, no eliminada. Restaura la base.'],
          [!c.T('log_importacion') || c.q('SELECT COUNT(*) FROM log_importacion') === 0, 'La tabla de importaciones todavía tiene filas.'], [c.nTablas() === c.pre.nt - 1, 'Debía eliminarse una sola tabla. Restaura la base y vuelve a intentarlo.']],
        sol: () => ['DROP TABLE IF EXISTS tmp_clientes_2019;', 'TRUNCATE TABLE log_importacion;'] },
      { id: 'J5', hab: 'agregacion', de: 'ger', titulo: 'Stock por sede',
        texto: 'Para la reunión de mañana necesito saber cómo está repartido el stock.\nPor cada sede (basta con su identificador) dime cuántos autos disponibles tiene y cuál es su precio promedio, redondeado a 2 decimales.',
        pistas: ['Filtra los disponibles con WHERE, agrupa por la sede y usa COUNT y AVG. El redondeo se hace con ROUND(valor, 2).', "SELECT id_sede, COUNT(*), ROUND(AVG(precio), 2) FROM vehiculos WHERE estado = 'DISPONIBLE' GROUP BY id_sede"],
        ref: () => "SELECT id_sede, COUNT(*), ROUND(AVG(precio), 2) FROM vehiculos WHERE estado = 'DISPONIBLE' GROUP BY id_sede;" },
      { id: 'J6', hab: 'agregacion', de: 'jefe', titulo: 'Más duplicados',
        texto: 'El caso de ayer no era el único. Quiero saber qué DNI están registrados más de una vez en la tabla de clientes.\nDame cada DNI repetido con la cantidad de veces que aparece.',
        pistas: ['Agrupa por DNI y cuenta. La condición "más de una vez" se aplica al grupo, no a la fila.', 'GROUP BY dni HAVING COUNT(*) > 1'],
        ref: () => 'SELECT dni, COUNT(*) FROM clientes GROUP BY dni HAVING COUNT(*) > 1;' }
    ],
    [ /* ---------------- VIERNES ---------------- */
      { id: 'V1', hab: 'join', de: 'ventas', titulo: 'Catálogo de modelos',
        texto: 'Estamos rehaciendo el catálogo. Necesito la lista completa de modelos con el nombre de su marca.\nDos columnas: marca y modelo, ordenadas por marca y luego por modelo.',
        pistas: ['La tabla de modelos tiene la clave foránea hacia marcas. Las dos tablas tienen una columna llamada nombre: usa alias para distinguirlas.', 'FROM modelos mo INNER JOIN marcas ma ON mo.id_marca = ma.id_marca ORDER BY ma.nombre, mo.nombre'],
        ref: () => 'SELECT ma.nombre, mo.nombre FROM modelos mo INNER JOIN marcas ma ON mo.id_marca = ma.id_marca ORDER BY ma.nombre, mo.nombre;', orden: [0, 1] },
      { id: 'V2', hab: 'join', de: 'ger', titulo: 'Ventas de octubre, legibles',
        texto: 'Necesito el detalle de las ventas de octubre de 2026, pero legible: sin identificadores.\nPor cada venta: la fecha, los apellidos del cliente, la placa del vehículo y el precio final.',
        pistas: ['La tabla de ventas es el centro: se une con clientes por un lado y con vehículos por el otro.', "FROM ventas v INNER JOIN clientes c ON v.id_cliente = c.id_cliente INNER JOIN vehiculos ve ON v.id_vehiculo = ve.id_vehiculo WHERE v.fecha_venta BETWEEN '2026-10-01' AND '2026-10-31'"],
        ref: () => "SELECT v.fecha_venta, c.apellidos, ve.placa, v.precio_final FROM ventas v INNER JOIN clientes c ON v.id_cliente = c.id_cliente INNER JOIN vehiculos ve ON v.id_vehiculo = ve.id_vehiculo WHERE v.fecha_venta BETWEEN '2026-10-01' AND '2026-10-31';" },
      { id: 'V3', hab: 'join', de: 'ventas', titulo: 'Vendedores sin ventas',
        texto: 'Quiero conversar con los vendedores activos que todavía no han registrado ninguna venta, ni este año ni antes.\nPásame sus nombres y apellidos.',
        pistas: ['Un INNER JOIN solo trae vendedores que sí tienen ventas. Necesitas el JOIN que conserva a todos los vendedores y quedarte con los que no encontraron pareja.', 'FROM vendedores ve LEFT JOIN ventas v ON ve.id_vendedor = v.id_vendedor WHERE v.id_venta IS NULL AND ve.activo = 1'],
        ref: () => 'SELECT ve.nombres, ve.apellidos FROM vendedores ve LEFT JOIN ventas v ON ve.id_vendedor = v.id_vendedor WHERE v.id_venta IS NULL AND ve.activo = 1;' },
      { id: 'V4', hab: 'join', de: 'ger', titulo: 'Ventas por sede',
        texto: '¿Cómo va cada sede este año? Considera solo las ventas de 2026.\nPor cada sede quiero su nombre, la cantidad de ventas y el monto total vendido, de la sede que más vendió a la que menos.',
        pistas: ['Una venta llega a su sede a través del vendedor que la hizo. Une las tres tablas y luego agrupa por el nombre de la sede.', 'WHERE YEAR(v.fecha_venta) = 2026 GROUP BY s.nombre ORDER BY SUM(v.precio_final) DESC'],
        ref: () => 'SELECT s.nombre, COUNT(*), SUM(v.precio_final) FROM ventas v INNER JOIN vendedores ve ON v.id_vendedor = ve.id_vendedor INNER JOIN sedes s ON ve.id_sede = s.id_sede WHERE YEAR(v.fecha_venta) = 2026 GROUP BY s.nombre ORDER BY SUM(v.precio_final) DESC;', orden: [2] },
      { id: 'V5', hab: 'join', de: 'ger', titulo: 'Podio de vendedores',
        texto: f => 'Cierre de semana: vamos a premiar a los mejores vendedores de 2026.\nQuiero el top 3 por monto total vendido este año, considerando solo a quienes tienen al menos ' + f.v5.min + ' ventas en el año. Por cada uno: nombres, apellidos, nombre de su sede, cantidad de ventas y monto total, del primero al tercero.',
        pistas: ['Arma primero el JOIN de ventas, vendedores y sedes filtrando 2026. Luego agrupa por vendedor, filtra los grupos con HAVING, ordena y corta.', 'GROUP BY ve.id_vendedor, ve.nombres, ve.apellidos, s.nombre HAVING COUNT(*) >= (mínimo) ORDER BY SUM(v.precio_final) DESC LIMIT 3'],
        ref: f => 'SELECT ve.nombres, ve.apellidos, s.nombre, COUNT(*), SUM(v.precio_final) FROM ventas v INNER JOIN vendedores ve ON v.id_vendedor = ve.id_vendedor INNER JOIN sedes s ON ve.id_sede = s.id_sede WHERE YEAR(v.fecha_venta) = 2026 GROUP BY ve.id_vendedor, ve.nombres, ve.apellidos, s.nombre HAVING COUNT(*) >= ' + f.v5.min + ' ORDER BY SUM(v.precio_final) DESC LIMIT 3;', orden: [4] }
    ]
  ];

  SJ.escenarios.autoandes = {
    id: 'autoandes', nombre: 'AutoAndes', db: 'autoandes', rubro: 'Empresa automotriz',
    resumen: 'Venta de autos nuevos y usados en cinco ciudades, con taller propio. Su base mezcla ventas, citas y servicios.',
    jefe: { nombre: 'Renato Salas', cargo: 'Jefe de Datos', saludos: [
      'Hola, {nombre}. Soy Renato Salas, jefe de datos de AutoAndes. Vendemos autos nuevos y usados en cinco ciudades, y nuestra base lleva años recibiendo datos de todo el mundo. Esta semana me ayudas a ponerla en orden.',
      'Buen día, {nombre}. Ayer reconociste la base. Hoy te van a llegar pedidos con datos a medias.',
      'Miércoles, {nombre}. Desde hoy tienes permiso de escritura sobre la base.',
      'Jueves. Gerencia aprobó cambios en el sistema y nos toca adaptar las tablas.',
      'Viernes, {nombre}. Cierre de semana: gerencia quiere reportes que cruzan varias tablas.'] },
    gente: {
      ventas: { nombre: 'Carla Montoya', cargo: 'Supervisora de Ventas' }, taller: { nombre: 'Hugo Paucar', cargo: 'Jefe de Taller' },
      atc: { nombre: 'Milagros Rivas', cargo: 'Atención al Cliente' }, ger: { nombre: 'Beatriz Luna', cargo: 'Gerente Comercial' } },
    construir: construir, dias: D.semana(retos)
  };
})(typeof window !== 'undefined' ? window : global);

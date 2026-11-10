/* SQL Junior - escenario 2: MercaPixel (venta de productos online). Base de datos, datos con semilla y 25 solicitudes. */
(function (root) {
  'use strict';
  const SJ = root.SJ = root.SJ || {}, D = SJ.datos;
  SJ.escenarios = SJ.escenarios || {};

  /* [categoria, prefijo del codigo, tipos de producto: [nombre, precio minimo, precio maximo]] */
  const CATS = [
    ['Audio', 'AUD', [['Audifonos Inalambricos', 80, 600], ['Parlante Inalambrico', 90, 900], ['Audifonos Gamer', 120, 700], ['Barra de Sonido', 300, 1800], ['Microfono USB', 100, 650]]],
    ['Computo', 'COM', [['Laptop', 1800, 6500], ['Monitor', 450, 2200], ['Mouse Inalambrico', 40, 250], ['Teclado Mecanico', 150, 600], ['Disco SSD', 120, 700], ['Memoria RAM', 90, 500]]],
    ['Celulares', 'CEL', [['Smartphone', 600, 4800], ['Cargador Rapido', 40, 180], ['Funda Protectora', 20, 90], ['Power Bank', 60, 260]]],
    ['Gaming', 'GAM', [['Consola Portatil', 900, 2800], ['Mando Inalambrico', 150, 400], ['Silla Gamer', 500, 1600], ['Mousepad XL', 35, 150]]],
    ['Hogar Inteligente', 'HOG', [['Foco Inteligente', 30, 120], ['Enchufe Inteligente', 40, 140], ['Camara de Seguridad', 120, 600], ['Aspiradora Robot', 700, 2500]]],
    ['Camaras', 'CAM', [['Camara Deportiva', 300, 1900], ['Tripode', 60, 350], ['Webcam HD', 90, 450], ['Aro de Luz', 50, 260]]],
    ['Accesorios', 'ACC', [['Cable USB-C', 15, 70], ['Adaptador HDMI', 25, 110], ['Hub USB', 60, 280], ['Soporte para Laptop', 50, 220]]],
    ['Oficina', 'OFI', [['Impresora Multifuncional', 500, 2200], ['Silla Ergonomica', 400, 1800], ['Escritorio Elevable', 900, 2800], ['Lampara LED', 50, 240]]],
    ['Wearables', 'WEA', [['Reloj Inteligente', 200, 1600], ['Banda Deportiva', 90, 420], ['Audifonos Deportivos', 80, 450]]]
  ];
  const MARCAS = ['Kuntur', 'Volt', 'Nexa', 'Orbit', 'Lumen', 'Inti', 'Andes', 'Pixelar'];
  const COURIERS = ['Chasqui Envios', 'Rapidito Express', 'Condor Cargo', 'Llama Delivery', 'Inti Logistica'];
  const METODOS = ['TARJETA', 'YAPE', 'TRANSFERENCIA', 'CONTRAENTREGA'];
  const COMENT = { 5: ['Excelente producto', 'Llego antes de lo esperado', 'Lo recomiendo'], 4: ['Buen producto', 'Cumple lo que promete'], 3: ['Normal, nada especial', 'Esperaba un poco mas'], 2: ['La caja llego golpeada', 'Demoro demasiado'], 1: ['No funciono', 'Llego con la caja abierta'] };
  const CUPONES = [['BIENVENIDA10', 10], ['VERANO15', 15], ['PIXEL20', 20], ['ENVIOGRATIS', 5], ['CYBER25', 25], ['MAMA10', 10], ['PAPA10', 10], ['FIESTAS15', 15], ['ESTUDIANTE', 12], ['VUELVE5', 5], ['APP10', 10], ['NAVIDAD30', 30]];

  const ESQUEMA = `
    CREATE TABLE categorias (id_categoria INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(30) NOT NULL, descripcion VARCHAR(80));
    CREATE TABLE productos (id_producto INT AUTO_INCREMENT PRIMARY KEY, id_categoria INT NOT NULL, sku VARCHAR(10) NOT NULL, nombre VARCHAR(60) NOT NULL,
      precio DECIMAL(8,2) NOT NULL, stock INT DEFAULT 0, activo TINYINT DEFAULT 1, FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria));
    CREATE TABLE clientes (id_cliente INT AUTO_INCREMENT PRIMARY KEY, dni CHAR(8) NOT NULL, nombres VARCHAR(40) NOT NULL, apellidos VARCHAR(40) NOT NULL,
      correo VARCHAR(60) NOT NULL, telefono VARCHAR(9), fecha_registro DATE);
    CREATE TABLE direcciones (id_direccion INT AUTO_INCREMENT PRIMARY KEY, id_cliente INT NOT NULL, direccion VARCHAR(60) NOT NULL, distrito VARCHAR(30),
      referencia VARCHAR(60), principal TINYINT DEFAULT 0, FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente));
    CREATE TABLE couriers (id_courier INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(30) NOT NULL, telefono_contacto VARCHAR(9));
    CREATE TABLE pedidos (id_pedido INT AUTO_INCREMENT PRIMARY KEY, id_cliente INT NOT NULL, id_direccion INT NOT NULL, fecha_pedido DATE NOT NULL,
      estado VARCHAR(12) NOT NULL, total DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente), FOREIGN KEY (id_direccion) REFERENCES direcciones(id_direccion));
    CREATE TABLE detalle_pedido (id_detalle INT AUTO_INCREMENT PRIMARY KEY, id_pedido INT NOT NULL, id_producto INT NOT NULL, cantidad INT NOT NULL,
      precio_unitario DECIMAL(8,2) NOT NULL, FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido), FOREIGN KEY (id_producto) REFERENCES productos(id_producto));
    CREATE TABLE pagos (id_pago INT AUTO_INCREMENT PRIMARY KEY, id_pedido INT NOT NULL, fecha_pago DATE, metodo VARCHAR(15), monto DECIMAL(10,2),
      FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido));
    CREATE TABLE envios (id_envio INT AUTO_INCREMENT PRIMARY KEY, id_pedido INT NOT NULL, id_courier INT NOT NULL, fecha_envio DATE NOT NULL, fecha_entrega DATE,
      estado VARCHAR(12), FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido), FOREIGN KEY (id_courier) REFERENCES couriers(id_courier));
    CREATE TABLE resenas (id_resena INT AUTO_INCREMENT PRIMARY KEY, id_producto INT NOT NULL, id_cliente INT NOT NULL, puntuacion INT NOT NULL,
      comentario VARCHAR(100), fecha DATE, FOREIGN KEY (id_producto) REFERENCES productos(id_producto), FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente));
    CREATE TABLE cupones (id_cupon INT AUTO_INCREMENT PRIMARY KEY, codigo VARCHAR(12) NOT NULL, descuento_pct INT NOT NULL, fecha_vencimiento DATE, usos INT DEFAULT 0);
    CREATE TABLE tmp_carga_productos (id INT, sku VARCHAR(10), nombre VARCHAR(60), precio_antiguo DECIMAL(8,2));
    CREATE TABLE log_sincronizacion (id_log INT AUTO_INCREMENT PRIMARY KEY, origen VARCHAR(30), fecha_sync DATE, registros INT);`;

  function construir(E, R) {
    const F = D.fabrica(R), f = {}, r2 = x => Math.round(x * 100) / 100;
    E.ddl(ESQUEMA);
    E.ins('categorias', ['nombre', 'descripcion'], CATS.map(c => [c[0], 'Productos de ' + c[0].toLowerCase()]).concat([['Audio', 'Duplicada en la migracion de 2024']]));
    E.ins('couriers', ['nombre', 'telefono_contacto'], COURIERS.map(c => [c, F.telefono()]));

    /* productos */
    const nombres = new Set(), precios = new Set(), PR = [];
    const prod = (ci, idCat) => {
      const c = CATS[ci]; let nombre, precio, tp;
      do { tp = R.pick(c[2]); nombre = tp[0] + ' ' + R.pick(MARCAS) + ' ' + R.pick('ABCGKMPRSTXZ') + R.int(10, 99); } while (nombres.has(nombre)); nombres.add(nombre);
      do { precio = r2(R.int(tp[1], tp[2]) + R.pick([0, 0.5, 0.9, 0.99])); } while (precios.has(precio)); precios.add(precio);
      return { cat: idCat, sku: F.codigo(() => c[1] + '-' + R.digitos(4)), nombre: nombre, precio: precio, stock: R.int(3, 120), activo: R.prob(0.92) ? 1 : 0 };
    };
    for (let ci = 0; ci < 9; ci++) for (let k = 0; k < 12; k++) PR.push(prod(ci, ci + 1));
    for (let k = 0; k < 6; k++) PR.push(prod(0, 10));
    const esp = R.varios(PR.filter(p => p.cat !== 10), 11);
    esp.slice(0, 4).forEach(p => { p.activo = 1; p.sinVenta = true; });
    esp.slice(4, 6).forEach(p => { p.activo = 0; p.sinVenta = true; });
    esp.slice(6, 10).forEach(p => { p.activo = 1; p.stock = 0; });
    const pX3 = esp[10]; pX3.activo = 1;
    const cab = R.varios([2, 3, 4, 5, 6, 7, 8, 9], 2);
    PR.filter(p => (p.cat === cab[0] || p.cat === cab[1]) && !p.sinVenta && p !== pX3 && p.stock > 0).sort((a, b) => a.precio - b.precio).slice(0, 4).forEach(p => {
      p.activo = 1; if (p.stock <= 10) p.stock = R.int(15, 90);
      if (p.precio >= 800) { let x; do { x = r2(R.int(300, 790) + 0.9); } while (precios.has(x)); precios.add(x); p.precio = x; }
    });
    const PM = R.mezcla(PR); PM.forEach((p, i) => { p.id = i + 1; });
    E.ins('productos', ['id_categoria', 'sku', 'nombre', 'precio', 'stock', 'activo'], PM.map(p => [p.cat, p.sku, p.nombre, p.precio, p.stock, p.activo]));
    f.l4 = { a: CATS[cab[0] - 1][0], b: CATS[cab[1] - 1][0], ia: cab[0], ib: cab[1], precio: 800, stock: 10 };

    /* clientes y direcciones */
    const N = 120, CL = [];
    for (let i = 0; i < N; i++) {
      const p = F.persona(), x = R.n();
      CL.push({ dni: F.dni(), nombres: p.nombres, apellidos: p.apellidos, correo: F.correo(p, 60), telefono: x < 0.08 ? null : x < 0.12 ? '' : F.telefono(), reg: R.fecha('2021-03-01', '2026-11-10') });
    }
    CL[88].correo = CL[12].correo; CL[95].correo = CL[30].correo; CL[110].correo = CL[30].correo; CL[71].correo = CL[47].correo;
    E.ins('clientes', ['dni', 'nombres', 'apellidos', 'correo', 'telefono', 'fecha_registro'], CL.map(c => [c.dni, c.nombres, c.apellidos, c.correo, c.telefono, c.reg]));
    f.sucios = F.sucios();
    const DR = [], dirs = {}, CMAX = 26;
    for (let i = 1; i <= N; i++) {
      const dos = i === CMAX || R.prob(0.4);
      DR.push({ cli: i, principal: i === CMAX ? 0 : 1 });
      if (dos) DR.push({ cli: i, principal: i === CMAX ? 1 : 0 });
    }
    const dist = F.distritos(DR.length, f.sucios);
    DR.forEach((d, i) => { d.id = i + 1; (dirs[d.cli] = dirs[d.cli] || []).push(d.id); });
    E.ins('direcciones', ['id_cliente', 'direccion', 'distrito', 'referencia', 'principal'], DR.map((d, i) => [d.cli, F.direccion(), dist[i], R.prob(0.5) ? R.pick(['Frente al parque', 'Al lado de la farmacia', 'Edificio azul', 'Porton negro', 'Segundo piso']) : null, d.principal]));
    const dirMax = DR.filter(d => d.cli === CMAX);

    /* pedidos, detalle, pagos y envios */
    const vendibles = PR.filter(p => !p.sinVenta), totales = new Set(), PD = [];
    const pedido = o => {
      const p = Object.assign({ cli: R.int(1, N) }, o);
      if (!p.fecha) p.fecha = R.fecha('2025-08-01', '2026-11-13');
      if (!p.estado) { const x = R.n(); p.estado = p.fecha < '2026-11-01' ? (x < 0.82 ? 'ENTREGADO' : x < 0.93 ? 'ANULADO' : 'ENVIADO') : R.pick(['ENVIADO', 'PAGADO', 'PAGADO', 'PENDIENTE', 'ANULADO']); }
      if (!p.dir) p.dir = R.pick(dirs[p.cli]);
      do {
        if (!o.items || p.total != null) p.items = R.varios(vendibles, R.int(1, 4)).map(x => ({ prod: x, cant: R.int(1, 3) }));
        p.total = r2(p.items.reduce((a, it) => a + it.cant * it.prod.precio, 0));
      } while (totales.has(p.total));
      totales.add(p.total); PD.push(p); return p;
    };
    const caros = vendibles.slice().sort((a, b) => b.precio - a.precio).slice(0, 4);
    pedido({ cli: CMAX, dir: dirMax[0].id, fecha: '2026-08-14', estado: 'ENTREGADO', items: caros.map(x => ({ prod: x, cant: 3 })) });
    for (let i = 0; i < 5; i++) pedido({ fecha: R.fecha('2026-10-02', '2026-10-14'), estado: 'ENTREGADO', entrega: R.int(6, 10) });
    for (let i = 0; i < 2; i++) pedido({ fecha: R.fecha('2026-10-03', '2026-10-12'), estado: 'ENTREGADO', entrega: 5 });
    for (let i = 0; i < 2; i++) pedido({ fecha: R.fecha('2026-10-01', '2026-10-15'), estado: 'ANULADO' });
    for (let i = 0; i < 4; i++) pedido({ fecha: R.fecha('2026-10-16', '2026-10-31') });
    for (let i = 0; i < 205; i++) pedido({});
    PD.sort((a, b) => a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.total - b.total);
    PD.forEach((p, i) => { p.id = i + 1; });
    E.ins('pedidos', ['id_cliente', 'id_direccion', 'fecha_pedido', 'estado', 'total'], PD.map(p => [p.cli, p.dir, p.fecha, p.estado, p.total]));
    const DT = [], PG = [], EN = [], unidades = {};
    PD.forEach(p => {
      p.items.forEach(it => {
        DT.push([p.id, it.prod.id, it.cant, it.prod.precio]);
        if (p.fecha >= '2026-01-01' && p.estado !== 'ANULADO') unidades[it.prod.id] = (unidades[it.prod.id] || 0) + it.cant;
      });
      if (p.estado === 'ENTREGADO' || p.estado === 'ENVIADO' || p.estado === 'PAGADO') PG.push([p.id, SJ.masDias(p.fecha, R.int(0, 1)), R.pick(METODOS), p.total]);
      if (p.estado === 'ENTREGADO' || p.estado === 'ENVIADO') {
        const env = SJ.masDias(p.fecha, R.int(1, 2));
        EN.push([p.id, R.int(1, 5), env, p.estado === 'ENTREGADO' ? SJ.masDias(env, p.entrega || R.int(1, 4)) : null, p.estado === 'ENTREGADO' ? 'ENTREGADO' : 'EN RUTA']);
      }
    });
    E.ins('detalle_pedido', ['id_pedido', 'id_producto', 'cantidad', 'precio_unitario'], DT);
    E.ins('pagos', ['id_pedido', 'fecha_pago', 'metodo', 'monto'], PG);
    E.ins('envios', ['id_pedido', 'id_courier', 'fecha_envio', 'fecha_entrega', 'estado'], EN);
    const us = Object.keys(unidades).map(k => unidades[k]).sort((a, b) => b - a);
    f.v5 = { min: Math.max(2, us[Math.min(9, us.length - 2)]) };

    /* resenas */
    const RS = [], CX3 = 61;
    for (let i = 0; i < 150; i++) {
      const x = R.n(); let pt = x < 0.35 ? 5 : x < 0.65 ? 4 : x < 0.8 ? 3 : x < 0.92 ? 2 : 1; const pr = R.int(1, PM.length);
      if (pr === pX3.id && pt === 1) pt = 2;
      RS.push([pr, R.int(1, N), pt, R.pick(COMENT[pt]), R.fecha('2025-09-01', '2026-11-12')]);
    }
    RS.push([pX3.id, CX3, 1, 'Llego con la caja abierta', '2026-11-09']);
    RS.push([pX3.id, R.int(1, 50), 4, 'Buen producto', '2026-10-20']);
    RS.push([pX3.id, R.int(70, 110), 2, 'Demoro demasiado', '2026-10-28']);
    E.ins('resenas', ['id_producto', 'id_cliente', 'puntuacion', 'comentario', 'fecha'], R.mezcla(RS));
    const cx = CL[CX3 - 1];
    f.x3 = { producto: pX3.nombre, cliente: CX3, correo: (cx.nombres.split(' ')[0] + '.' + cx.apellidos.split(' ')[0]).toLowerCase() + '.2026@outlook.com' };

    /* cupones y restos de migracion */
    E.ins('cupones', ['codigo', 'descuento_pct', 'fecha_vencimiento', 'usos'], CUPONES.map(c => [c[0], c[1], R.fecha('2026-06-30', '2027-03-31'), R.int(0, 400)]));
    E.ins('tmp_carga_productos', ['id', 'sku', 'nombre', 'precio_antiguo'], PM.slice(0, 25).map((p, i) => [i + 1, p.sku, p.nombre, r2(p.precio * 0.9)]));
    const LG = [];
    for (let i = 0; i < 40; i++) LG.push([R.pick(['pasarela_pagos', 'almacen', 'courier', 'tienda_web']), R.fecha('2026-01-05', '2026-11-13'), R.int(5, 600)]);
    E.ins('log_sincronizacion', ['origen', 'fecha_sync', 'registros'], LG);

    f.x1 = { cat: 'Hogar Inteligente', idCat: 5, sku: F.codigo(() => 'HOG-' + R.digitos(4)), nombre: 'Timbre Inteligente ' + R.pick(MARCAS) + ' T' + R.int(10, 99), precio: r2(R.int(120, 380) + 0.9), stock: R.int(10, 40) };
    f.x2 = { cliente: CMAX, dir: dirMax[1].id, total: r2(f.x1.precio * 2) };
    f.j3 = { codigo: 'CYBERPIXEL-NOVIEMBRE-2026', pct: R.pick([15, 20, 25, 30]) };
    return f;
  }

  const retos = [
    [ /* ---------------- LUNES ---------------- */
      { id: 'L1', hab: 'explorar', de: 'jefe', titulo: 'Reconoce el terreno',
        texto: 'Tu usuario ya tiene acceso al servidor. Conéctate a la base de la tienda, mira qué tablas tiene y revisa la estructura de la tabla donde está nuestro catálogo de productos.\nNo necesito que me envíes nada: solo quiero que conozcas la base antes de recibir pedidos. Cuando termines, presiona Entregar.',
        pistas: ['Son tres sentencias, en este orden: elegir la base, listar sus tablas y describir una tabla. Las tres están en la primera nota de tu libreta.', 'La base se llama mercapixel. La tabla del catálogo es productos.'],
        check: c => [[c.st.some(s => s.t === 'use'), 'Todavía no seleccionaste la base de datos.'], [c.st.some(s => s.s === 'tables'), 'Falta listar las tablas de la base.'], [c.st.some(s => s.t === 'describe' && s.tb === 'productos'), 'Falta revisar la estructura de la tabla del catálogo.']],
        sol: () => ['USE mercapixel;', 'SHOW TABLES;', 'DESCRIBE productos;'] },
      { id: 'L2', hab: 'select', de: 'cat', titulo: 'Productos dados de baja',
        texto: 'Estoy revisando el catálogo y quiero saber qué productos ya no están activos en la tienda.\nPásame el nombre, el precio y el stock de todos los productos inactivos.',
        pistas: ['Explora la tabla de productos con SELECT *: una columna indica con 1 o 0 si el producto está activo.', 'La columna es activo y los inactivos tienen el valor 0. Devuelve solo nombre, precio y stock.'],
        ref: () => 'SELECT nombre, precio, stock FROM productos WHERE activo = 0;' },
      { id: 'L3', hab: 'select', de: 'ger', titulo: 'Los cinco pedidos más grandes',
        texto: 'Quiero conocer nuestras ventas más grandes de todos los tiempos.\nEnvíame el número de pedido, la fecha y el total de los cinco pedidos de mayor total, del mayor al menor.',
        pistas: ['Ordena los pedidos por su total de mayor a menor y quédate con cinco filas.', 'ORDER BY total DESC LIMIT 5'],
        ref: () => 'SELECT id_pedido, fecha_pedido, total FROM pedidos ORDER BY total DESC LIMIT 5;', orden: [2] },
      { id: 'L4', hab: 'filtros', de: 'cat', titulo: 'Campaña de precios bajos',
        texto: f => 'Voy a armar una campaña con productos accesibles de dos categorías: ' + f.l4.a + ' y ' + f.l4.b + '.\nNecesito nombre, precio y stock de los productos activos de esas categorías que cuesten menos de ' + f.l4.precio + ' soles y tengan más de ' + f.l4.stock + ' unidades en stock, del más barato al más caro.',
        pistas: ['La tabla de productos no guarda el nombre de la categoría: guarda un identificador. Averigua en otra tabla cuáles corresponden a esas dos categorías.', 'Son cuatro condiciones unidas con AND. Las dos de categoría van juntas, entre paréntesis y unidas con OR.'],
        ref: f => 'SELECT nombre, precio, stock FROM productos WHERE activo = 1 AND (id_categoria = ' + f.l4.ia + ' OR id_categoria = ' + f.l4.ib + ') AND precio < ' + f.l4.precio + ' AND stock > ' + f.l4.stock + ' ORDER BY precio;', orden: [1] }
    ],
    [ /* ---------------- MARTES ---------------- */
      { id: 'M1', hab: 'filtros', de: 'atc', titulo: 'El producto sin nombre',
        texto: 'Un cliente me pregunta por un producto y no recuerda el nombre exacto. Solo sabe que es inalámbrico y que es de audio: el código de esos productos empieza con AUD.\nPásame el código, el nombre y el precio de los productos que coincidan.',
        pistas: ['Necesitas dos patrones con LIKE: uno para un texto que contiene una palabra y otro para un código que empieza de cierta forma.', "nombre LIKE '%Inalambric%' AND sku LIKE 'AUD%'"],
        ref: () => "SELECT sku, nombre, precio FROM productos WHERE nombre LIKE '%Inalambric%' AND sku LIKE 'AUD%';" },
      { id: 'M2', hab: 'filtros', de: 'log', titulo: 'Pedidos de la primera quincena',
        texto: 'Estoy revisando los despachos. Necesito los pedidos hechos entre el 1 y el 15 de octubre de 2026 que ya fueron entregados o están enviados.\nEnvíame el número de pedido, la fecha y el total, de mayor a menor total.',
        pistas: ['Revisa cómo están escritos los estados en la tabla de pedidos. Luego combina un rango de fechas con una lista de valores.', "fecha_pedido BETWEEN '2026-10-01' AND '2026-10-15' AND estado IN ('ENTREGADO', 'ENVIADO')"],
        ref: () => "SELECT id_pedido, fecha_pedido, total FROM pedidos WHERE fecha_pedido BETWEEN '2026-10-01' AND '2026-10-15' AND estado IN ('ENTREGADO', 'ENVIADO') ORDER BY total DESC;", orden: [2] },
      { id: 'M3', hab: 'filtros', de: 'atc', titulo: 'Clientes sin teléfono',
        texto: 'El courier nos pide un teléfono de contacto para cada entrega y hay clientes que no lo tienen.\nDame DNI, nombres, apellidos y correo de los clientes sin teléfono registrado. Revisa bien cómo quedó guardado ese vacío: la tienda antigua y la nueva no lo guardaban igual.',
        pistas: ["Hay dos tipos de vacío en esa columna: el valor NULL y el texto vacío ''. Tu filtro debe cubrir los dos.", "WHERE telefono IS NULL OR telefono = ''"],
        ref: () => "SELECT dni, nombres, apellidos, correo FROM clientes WHERE telefono IS NULL OR telefono = '';" },
      { id: 'M4', hab: 'funciones', de: 'jefe', titulo: 'Distritos mal escritos',
        texto: 'Los clientes escriben su distrito a mano al registrar una dirección, y sospecho que hay de todo: mayúsculas mezcladas, espacios de más y errores de tipeo.\nDame la lista de distritos de las direcciones sin repetir, pasando cada uno a mayúsculas y sin espacios al inicio ni al final, en orden alfabético.',
        pistas: ['Se combinan dos funciones de texto, una dentro de la otra, y se quitan los repetidos del resultado.', 'SELECT DISTINCT UPPER(TRIM(distrito)) FROM direcciones ORDER BY 1'],
        ref: () => 'SELECT DISTINCT UPPER(TRIM(distrito)) FROM direcciones ORDER BY 1;', orden: [0] },
      { id: 'M5', hab: 'funciones', de: 'log', titulo: 'Entregas que tardaron',
        texto: 'Tenemos reclamos por demoras. Necesito los envíos despachados en octubre de 2026 que tardaron más de 5 días en ser entregados.\nEnvíame el número de pedido, la fecha de envío y cuántos días pasaron entre el envío y la entrega.',
        pistas: ['DATEDIFF(fecha_fin, fecha_inicio) calcula los días. Puedes usarla en el SELECT y también en el WHERE.', 'WHERE YEAR(fecha_envio) = 2026 AND MONTH(fecha_envio) = 10 AND DATEDIFF(fecha_entrega, fecha_envio) > 5'],
        ref: () => 'SELECT id_pedido, fecha_envio, DATEDIFF(fecha_entrega, fecha_envio) FROM envios WHERE YEAR(fecha_envio) = 2026 AND MONTH(fecha_envio) = 10 AND DATEDIFF(fecha_entrega, fecha_envio) > 5;' }
    ],
    [ /* ---------------- MIERCOLES ---------------- */
      { id: 'X1', hab: 'dml', de: 'cat', titulo: 'Producto nuevo',
        texto: f => 'Entra un producto nuevo al catálogo. Regístralo como activo.\nCategoría: ' + f.x1.cat + '\nCódigo (SKU): ' + f.x1.sku + '\nNombre: ' + f.x1.nombre + '\nPrecio: ' + f.x1.precio.toFixed(2) + '\nStock inicial: ' + f.x1.stock,
        pistas: ['La tabla de productos pide el identificador de la categoría, no su nombre. Búscalo primero. El id del producto se genera solo.', 'INSERT INTO productos (id_categoria, sku, nombre, precio, stock, activo) VALUES (...);'],
        pre: c => ({ n: c.q('SELECT COUNT(*) FROM productos') }),
        check: c => {
          const x = c.f.x1, n = c.q('SELECT COUNT(*) FROM productos WHERE sku = ?', [x.sku]);
          return [[n === 1, n ? 'Ese código quedó registrado más de una vez. Restaura la base y vuelve a intentarlo.' : 'No encuentro ningún producto con el código de la ficha.'],
            [c.q('SELECT COUNT(*) FROM productos WHERE sku = ? AND id_categoria = ?', [x.sku, x.idCat]) === 1, 'El producto no quedó en la categoría indicada.'],
            [c.q('SELECT COUNT(*) FROM productos WHERE sku = ? AND nombre = ? AND ABS(precio - ?) < 0.01 AND stock = ? AND activo = 1', [x.sku, x.nombre, x.precio, x.stock]) === 1, 'El producto existe, pero el nombre, el precio, el stock o el indicador de activo no coinciden con la ficha.'],
            [c.q('SELECT COUNT(*) FROM productos') === c.pre.n + 1, 'La tabla de productos debe tener exactamente un registro más que antes.']];
        },
        sol: f => ["INSERT INTO productos (id_categoria, sku, nombre, precio, stock, activo) VALUES (" + f.x1.idCat + ", '" + f.x1.sku + "', '" + f.x1.nombre + "', " + f.x1.precio + ', ' + f.x1.stock + ', 1);'] },
      { id: 'X2', hab: 'dml', de: 'atc', titulo: 'Pedido por teléfono',
        texto: 'La persona que hizo el pedido de mayor total de toda nuestra historia acaba de comprar por teléfono 2 unidades del producto que registraste hace un momento.\nCrea su pedido con fecha de hoy, en estado PAGADO y con entrega en su dirección principal. Luego registra el detalle del pedido. El total es la cantidad por el precio del producto.',
        pistas: ['Antes de escribir necesitas: el id del cliente, el id de su dirección marcada como principal y el id con el precio del producto nuevo. Cada dato sale de un SELECT.', 'Son dos INSERT: primero en pedidos y luego en detalle_pedido, usando el id del pedido que se acaba de crear.'],
        pre: c => ({ np: c.q('SELECT COUNT(*) FROM pedidos'), nd: c.q('SELECT COUNT(*) FROM detalle_pedido') }),
        check: c => {
          const x = c.f.x2, p = c.f.x1;
          return [[c.q('SELECT COUNT(*) FROM pedidos WHERE id_cliente = ? AND fecha_pedido = ?', [x.cliente, c.hoy]) === 1, 'No encuentro un pedido de hoy para el cliente correcto. Revisa quién hizo el pedido de mayor total.'],
            [c.q("SELECT COUNT(*) FROM pedidos WHERE id_cliente = ? AND fecha_pedido = ? AND id_direccion = ? AND estado = 'PAGADO' AND ABS(total - ?) < 0.01", [x.cliente, c.hoy, x.dir, x.total]) === 1, 'El pedido existe, pero la dirección, el estado o el total no coinciden. La entrega va a la dirección marcada como principal.'],
            [c.q('SELECT COUNT(*) FROM detalle_pedido d INNER JOIN pedidos p ON d.id_pedido = p.id_pedido WHERE p.id_cliente = ? AND p.fecha_pedido = ? AND d.id_producto IN (SELECT id_producto FROM productos WHERE sku = ?) AND d.cantidad = 2 AND ABS(d.precio_unitario - ?) < 0.01', [x.cliente, c.hoy, p.sku, p.precio]) === 1, 'Falta el detalle del pedido con el producto, la cantidad y el precio unitario correctos.'],
            [c.q('SELECT COUNT(*) FROM pedidos') === c.pre.np + 1 && c.q('SELECT COUNT(*) FROM detalle_pedido') === c.pre.nd + 1, 'Debe haber exactamente un pedido nuevo y una línea de detalle nueva.']];
        },
        sol: f => ["INSERT INTO pedidos (id_cliente, id_direccion, fecha_pedido, estado, total) VALUES (" + f.x2.cliente + ', ' + f.x2.dir + ", CURDATE(), 'PAGADO', " + f.x2.total + ');',
          "INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES ((SELECT MAX(id_pedido) FROM pedidos), (SELECT id_producto FROM productos WHERE sku = '" + f.x1.sku + "'), 2, " + f.x1.precio + ');'] },
      { id: 'X3', hab: 'dml', de: 'atc', titulo: 'Cambio de correo',
        texto: f => 'Me escribió la persona que dejó la única reseña de 1 estrella del producto "' + f.x3.producto + '". Quiere que le respondamos a su correo nuevo: ' + f.x3.correo + '\nActualiza su correo. No me dejó su nombre: tendrás que ubicarla por la reseña.',
        pistas: ['Recorre el camino por partes: el nombre del producto te da su id; con ese id y la puntuación encuentras la reseña; y la reseña te dice qué cliente es.', "Cuando tengas el id del cliente: UPDATE clientes SET correo = '...' WHERE id_cliente = ...;"],
        check: c => [[String(c.q('SELECT correo FROM clientes WHERE id_cliente = ?', [c.f.x3.cliente])).toLowerCase() === c.f.x3.correo, 'El cliente de esa reseña todavía no tiene el correo nuevo.'],
          [c.q('SELECT COUNT(*) FROM clientes WHERE correo = ?', [c.f.x3.correo]) <= 1, 'Ese correo quedó en más de un cliente. Restaura la base y actualiza solo a quien corresponde.']],
        sol: f => ["UPDATE clientes SET correo = '" + f.x3.correo + "' WHERE id_cliente = " + f.x3.cliente + ';'] },
      { id: 'X4', hab: 'dml', de: 'jefe', titulo: 'Limpieza de distritos',
        texto: f => 'Ayer viste que hay distritos mal escritos en las direcciones de entrega. Toca corregirlos.\nLos tres con problemas son ' + f.sucios[0] + ', ' + f.sucios[1] + ' y ' + f.sucios[2] + '. Todas sus variantes (mayúsculas, espacios de más, errores de tipeo) deben quedar escritas exactamente así. El resto de distritos está bien.',
        pistas: ["Lista primero las variantes de cada distrito con SELECT DISTINCT. Los espacios no se ven a simple vista: CONCAT('[', distrito, ']') o LENGTH(distrito) los delatan.", 'Un UPDATE por distrito. En el WHERE, UPPER(TRIM(distrito)) atrapa las variantes con mayúsculas y espacios; la variante con error de tipeo se agrega con OR.'],
        pre: c => ({ dist: D.preDistritos(c, 'direcciones', c.f.sucios) }),
        check: c => D.checkDistritos(c, 'direcciones', c.f.sucios),
        sol: f => D.solDistritos('direcciones', f.sucios) },
      { id: 'X5', hab: 'dml', de: 'jefe', titulo: 'Categoría duplicada',
        texto: 'En el filtro de la web la categoría Audio aparece dos veces: una de ellas se creó por error en una migración.\nConserva la más antigua, que es la de menor identificador, y elimina la duplicada. Antes de borrarla, pasa sus productos a la categoría original: no se puede perder ningún producto.',
        pistas: ['Si intentas el DELETE directo, MySQL responde el error 1451: la categoría duplicada tiene productos que dependen de ella.', 'Un UPDATE cambia el id_categoria de los productos de la duplicada al id de la original; recién entonces funciona el DELETE.'],
        pre: c => ({ n: c.q('SELECT COUNT(*) FROM categorias'), po: c.q('SELECT COUNT(*) FROM productos WHERE id_categoria IN (1, 10)'), np: c.q('SELECT COUNT(*) FROM productos') }),
        check: c => [[c.q('SELECT COUNT(*) FROM categorias WHERE id_categoria = 10') === 0, 'La categoría duplicada todavía existe.'],
          [c.q('SELECT COUNT(*) FROM categorias WHERE id_categoria = 1') === 1, 'La categoría original ya no existe y era la que debía conservarse. Restaura la base.'],
          [c.q('SELECT COUNT(*) FROM productos WHERE id_categoria = 1') === c.pre.po, 'No todos los productos de la categoría duplicada pasaron a la original.'],
          [c.q('SELECT COUNT(*) FROM productos') === c.pre.np && c.q('SELECT COUNT(*) FROM categorias') === c.pre.n - 1, 'No debía eliminarse ningún producto, y solo una categoría.']],
        sol: () => ['UPDATE productos SET id_categoria = 1 WHERE id_categoria = 10;', 'DELETE FROM categorias WHERE id_categoria = 10;'] }
    ],
    [ /* ---------------- JUEVES ---------------- */
      { id: 'J1', hab: 'ddl', de: 'ger', titulo: 'Canal de venta',
        texto: 'Desde este mes también vendemos por la app y por teléfono, así que necesitamos saber por dónde entra cada pedido.\nAgrega a la tabla de pedidos una columna llamada canal, de texto de hasta 15 caracteres, que por defecto valga WEB.',
        pistas: ['Es un ALTER TABLE con ADD COLUMN. El valor por defecto se indica con DEFAULT después del tipo.', "ALTER TABLE pedidos ADD COLUMN canal VARCHAR(15) DEFAULT 'WEB';"],
        check: c => {
          const k = c.col('pedidos', 'canal');
          return [[!!k, 'La tabla pedidos todavía no tiene la columna canal.'], [!!k && k.base === 'VARCHAR' && +k.args[0] === 15, 'La columna debe ser VARCHAR(15).'], [!!k && String(k.def).toUpperCase() === 'WEB', 'El valor por defecto debe ser WEB.']];
        },
        sol: () => ["ALTER TABLE pedidos ADD COLUMN canal VARCHAR(15) DEFAULT 'WEB';"] },
      { id: 'J2', hab: 'ddl', de: 'jefe', titulo: 'Tabla de devoluciones',
        texto: 'Vamos a registrar las devoluciones en la base y necesitamos dónde guardarlas. Crea la tabla devoluciones con estas columnas:\nid_devolucion: entero, autoincremental, clave primaria.\nid_pedido: entero, obligatorio, clave foránea hacia la tabla de pedidos.\nmotivo: texto de hasta 100 caracteres, obligatorio.\nfecha_solicitud: fecha.\nmonto_reembolso: decimal de 8 dígitos con 2 decimales.',
        pistas: ['Sigue el ejemplo de CREATE TABLE de tu libreta: primero las columnas, luego PRIMARY KEY y FOREIGN KEY con REFERENCES. No olvides IF NOT EXISTS.', 'La clave foránea se escribe: FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido). Obligatorio se escribe NOT NULL.'],
        check: c => D.checkTabla(c, 'devoluciones', { cols: { id_devolucion: { tipo: 'INT', auto: true }, id_pedido: { tipo: 'INT', nn: true }, motivo: { tipo: 'VARCHAR(100)', nn: true }, fecha_solicitud: { tipo: 'DATE' }, monto_reembolso: { tipo: 'DECIMAL(8,2)' } }, pk: 'id_devolucion', fk: ['id_pedido', 'pedidos', 'id_pedido'] }),
        sol: () => ['CREATE TABLE IF NOT EXISTS devoluciones (id_devolucion INT AUTO_INCREMENT, id_pedido INT NOT NULL, motivo VARCHAR(100) NOT NULL, fecha_solicitud DATE, monto_reembolso DECIMAL(8,2), PRIMARY KEY (id_devolucion), FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido));'] },
      { id: 'J3', hab: 'ddl', de: 'ger', titulo: 'Un cupón que no entra',
        texto: f => 'Marketing quiere lanzar el cupón ' + f.j3.codigo + ' y el sistema lo rechaza porque el código es demasiado largo.\nAmplía la columna del código de los cupones a 30 caracteres, manteniéndola obligatoria, y registra el cupón: ' + f.j3.pct + '% de descuento, vence el 30 de noviembre de 2026 y empieza con 0 usos.',
        pistas: ['Revisa con DESCRIBE el tamaño actual de la columna. En MODIFY se vuelve a escribir el tipo completo, incluido NOT NULL.', 'ALTER TABLE cupones MODIFY codigo VARCHAR(30) NOT NULL; y después un INSERT con la lista de columnas.'],
        pre: c => ({ n: c.q('SELECT COUNT(*) FROM cupones') }),
        check: c => {
          const k = c.col('cupones', 'codigo'), x = c.f.j3;
          return [[!!k && k.base === 'VARCHAR' && +k.args[0] === 30, 'La columna codigo debe quedar como VARCHAR(30).'], [!!k && k.notNull, 'La columna codigo debe seguir siendo obligatoria (NOT NULL).'],
            [c.q("SELECT COUNT(*) FROM cupones WHERE codigo = ? AND descuento_pct = ? AND fecha_vencimiento = '2026-11-30' AND usos = 0", [x.codigo, x.pct]) === 1, 'No encuentro el cupón nuevo con el descuento, el vencimiento y los usos solicitados.'],
            [c.q('SELECT COUNT(*) FROM cupones') === c.pre.n + 1, 'Debe haber exactamente un cupón nuevo.']];
        },
        sol: f => ['ALTER TABLE cupones MODIFY codigo VARCHAR(30) NOT NULL;', "INSERT INTO cupones (codigo, descuento_pct, fecha_vencimiento, usos) VALUES ('" + f.j3.codigo + "', " + f.j3.pct + ", '2026-11-30', 0);"] },
      { id: 'J4', hab: 'ddl', de: 'jefe', titulo: 'Orden en la casa',
        texto: 'Quedaron restos de una carga masiva antigua. Hay una tabla temporal con una copia vieja de productos que ya nadie usa: elimínala.\nAdemás, la tabla que registra las sincronizaciones debe quedar vacía, pero tiene que seguir existiendo porque el sistema la usa cada noche.',
        pistas: ['SHOW TABLES te muestra las dos tablas: el nombre de una empieza con tmp y el de la otra con log.', 'DROP TABLE IF EXISTS tmp_carga_productos; y TRUNCATE TABLE log_sincronizacion;'],
        pre: c => ({ nt: c.nTablas() }),
        check: c => [[!c.T('tmp_carga_productos'), 'La tabla temporal todavía existe.'], [!!c.T('log_sincronizacion'), 'La tabla de sincronizaciones ya no existe: debía quedar vacía, no eliminada. Restaura la base.'],
          [!c.T('log_sincronizacion') || c.q('SELECT COUNT(*) FROM log_sincronizacion') === 0, 'La tabla de sincronizaciones todavía tiene filas.'], [c.nTablas() === c.pre.nt - 1, 'Debía eliminarse una sola tabla. Restaura la base y vuelve a intentarlo.']],
        sol: () => ['DROP TABLE IF EXISTS tmp_carga_productos;', 'TRUNCATE TABLE log_sincronizacion;'] },
      { id: 'J5', hab: 'agregacion', de: 'cat', titulo: 'Catálogo por categoría',
        texto: 'Para la reunión de mañana necesito saber cómo está repartido el catálogo.\nPor cada categoría (basta con su identificador) dime cuántos productos activos tiene y cuál es su precio promedio, redondeado a 2 decimales.',
        pistas: ['Filtra los activos con WHERE, agrupa por la categoría y usa COUNT y AVG. El redondeo se hace con ROUND(valor, 2).', 'SELECT id_categoria, COUNT(*), ROUND(AVG(precio), 2) FROM productos WHERE activo = 1 GROUP BY id_categoria'],
        ref: () => 'SELECT id_categoria, COUNT(*), ROUND(AVG(precio), 2) FROM productos WHERE activo = 1 GROUP BY id_categoria;' },
      { id: 'J6', hab: 'agregacion', de: 'jefe', titulo: 'Correos compartidos',
        texto: 'El correo debería identificar a un solo cliente, pero sospecho que hay cuentas distintas registradas con el mismo correo.\nDame cada correo que esté repetido en la tabla de clientes con la cantidad de veces que aparece.',
        pistas: ['Agrupa por correo y cuenta. La condición "más de una vez" se aplica al grupo, no a la fila.', 'GROUP BY correo HAVING COUNT(*) > 1'],
        ref: () => 'SELECT correo, COUNT(*) FROM clientes GROUP BY correo HAVING COUNT(*) > 1;' }
    ],
    [ /* ---------------- VIERNES ---------------- */
      { id: 'V1', hab: 'join', de: 'cat', titulo: 'Agotados por categoría',
        texto: 'Necesito reponer mercadería. Dame los productos activos que se quedaron sin stock, con el nombre de su categoría.\nDos columnas: categoría y producto, ordenadas por categoría y luego por producto.',
        pistas: ['La tabla de productos tiene la clave foránea hacia categorías. Las dos tablas tienen una columna llamada nombre: usa alias para distinguirlas.', 'FROM productos p INNER JOIN categorias c ON p.id_categoria = c.id_categoria WHERE p.activo = 1 AND p.stock = 0 ORDER BY c.nombre, p.nombre'],
        ref: () => 'SELECT c.nombre, p.nombre FROM productos p INNER JOIN categorias c ON p.id_categoria = c.id_categoria WHERE p.activo = 1 AND p.stock = 0 ORDER BY c.nombre, p.nombre;', orden: [0, 1] },
      { id: 'V2', hab: 'join', de: 'log', titulo: 'Pedidos de octubre, legibles',
        texto: 'Necesito el detalle de los pedidos de octubre de 2026, pero legible: sin identificadores.\nPor cada pedido: la fecha, los apellidos del cliente, el distrito de la dirección de entrega y el total.',
        pistas: ['La tabla de pedidos es el centro: se une con clientes por un lado y con direcciones por el otro.', "FROM pedidos p INNER JOIN clientes c ON p.id_cliente = c.id_cliente INNER JOIN direcciones d ON p.id_direccion = d.id_direccion WHERE p.fecha_pedido BETWEEN '2026-10-01' AND '2026-10-31'"],
        ref: () => "SELECT p.fecha_pedido, c.apellidos, d.distrito, p.total FROM pedidos p INNER JOIN clientes c ON p.id_cliente = c.id_cliente INNER JOIN direcciones d ON p.id_direccion = d.id_direccion WHERE p.fecha_pedido BETWEEN '2026-10-01' AND '2026-10-31';" },
      { id: 'V3', hab: 'join', de: 'cat', titulo: 'Productos que nadie compró',
        texto: 'Quiero revisar los productos activos que nunca se han vendido, es decir, que no aparecen en ningún pedido.\nPásame su código y su nombre.',
        pistas: ['Un INNER JOIN solo trae productos que sí tienen ventas. Necesitas el JOIN que conserva todos los productos y quedarte con los que no encontraron pareja.', 'FROM productos p LEFT JOIN detalle_pedido d ON p.id_producto = d.id_producto WHERE d.id_detalle IS NULL AND p.activo = 1'],
        ref: () => 'SELECT p.sku, p.nombre FROM productos p LEFT JOIN detalle_pedido d ON p.id_producto = d.id_producto WHERE d.id_detalle IS NULL AND p.activo = 1;' },
      { id: 'V4', hab: 'join', de: 'ger', titulo: 'Ingresos por categoría',
        texto: '¿Qué categorías nos dan más dinero? Considera todo lo que se ha pedido.\nPor cada categoría quiero su nombre, las unidades pedidas y el ingreso total (cantidad por precio unitario), de la que más ingreso genera a la que menos.',
        pistas: ['Cada línea del detalle llega a su categoría a través del producto. Une las tres tablas y luego agrupa por el nombre de la categoría.', 'SUM(d.cantidad), SUM(d.cantidad * d.precio_unitario) con GROUP BY c.nombre ORDER BY SUM(d.cantidad * d.precio_unitario) DESC'],
        ref: () => 'SELECT c.nombre, SUM(d.cantidad), SUM(d.cantidad * d.precio_unitario) FROM detalle_pedido d INNER JOIN productos p ON d.id_producto = p.id_producto INNER JOIN categorias c ON p.id_categoria = c.id_categoria GROUP BY c.nombre ORDER BY SUM(d.cantidad * d.precio_unitario) DESC;', orden: [2] },
      { id: 'V5', hab: 'join', de: 'ger', titulo: 'Los productos estrella',
        texto: f => 'Cierre de semana: vamos a destacar en la portada los productos estrella de 2026.\nQuiero el top 3 por ingreso total en pedidos de este año, sin contar los pedidos anulados y considerando solo productos con al menos ' + f.v5.min + ' unidades pedidas. Por cada uno: nombre del producto, nombre de su categoría, unidades e ingreso total, del primero al tercero.',
        pistas: ['Arma primero el JOIN de detalle, pedidos, productos y categorías, filtrando el año y el estado. Luego agrupa por producto, filtra los grupos con HAVING, ordena y corta.', "WHERE YEAR(pe.fecha_pedido) = 2026 AND pe.estado <> 'ANULADO' GROUP BY p.id_producto, p.nombre, c.nombre HAVING SUM(d.cantidad) >= (mínimo) ORDER BY SUM(d.cantidad * d.precio_unitario) DESC LIMIT 3"],
        ref: f => "SELECT p.nombre, c.nombre, SUM(d.cantidad), SUM(d.cantidad * d.precio_unitario) FROM detalle_pedido d INNER JOIN pedidos pe ON d.id_pedido = pe.id_pedido INNER JOIN productos p ON d.id_producto = p.id_producto INNER JOIN categorias c ON p.id_categoria = c.id_categoria WHERE YEAR(pe.fecha_pedido) = 2026 AND pe.estado <> 'ANULADO' GROUP BY p.id_producto, p.nombre, c.nombre HAVING SUM(d.cantidad) >= " + f.v5.min + ' ORDER BY SUM(d.cantidad * d.precio_unitario) DESC LIMIT 3;', orden: [3] }
    ]
  ];

  SJ.escenarios.mercapixel = {
    id: 'mercapixel', nombre: 'MercaPixel', db: 'mercapixel', rubro: 'Venta de productos online',
    resumen: 'Tienda de tecnología por internet con envíos a todo Lima. Su base une catálogo, pedidos, pagos, envíos y reseñas.',
    jefe: { nombre: 'Sofia Paredes', cargo: 'Jefa de Datos', saludos: [
      'Hola, {nombre}. Soy Sofia Paredes, jefa de datos de MercaPixel. Vendemos tecnología por internet y cada clic termina en una fila de nuestra base. Esta semana me ayudas a mantenerla confiable.',
      'Buen día, {nombre}. Ayer reconociste la base. Hoy te van a llegar pedidos con datos a medias.',
      'Miércoles, {nombre}. Desde hoy tienes permiso de escritura sobre la base.',
      'Jueves. La tienda crece y nos toca adaptar las tablas.',
      'Viernes, {nombre}. Cierre de semana: gerencia quiere reportes que cruzan varias tablas.'] },
    gente: {
      cat: { nombre: 'Diego Arana', cargo: 'Jefe de Catálogo' }, log: { nombre: 'Rosa Quiroz', cargo: 'Coordinadora de Logística' },
      atc: { nombre: 'Kevin Tapia', cargo: 'Servicio al Cliente' }, ger: { nombre: 'Lucia Benavides', cargo: 'Gerente de E-commerce' } },
    construir: construir, dias: D.semana(retos)
  };
})(typeof window !== 'undefined' ? window : global);

// Soluciones alternativas validas (como las escribiria un estudiante) y respuestas incorrectas tipicas: node tests/alternativas.js
global.SJ = {};
['config', 'engine', 'datos', 'charlas', 'esc_autoandes', 'esc_mercapixel', 'esc_novatel', 'nucleo'].forEach(m => require('../js/' + m + '.js'));
const init = require('../vendor/sql-asm.js'); const cw = console.warn; console.warn = () => {};
init().then(SQL => {
  console.warn = cw;
  let fallos = 0;
  const esc = SJ.escenarios.autoandes, sim = new SJ.Sim(SQL, esc, 'ALT-01|autoandes|1'), f = sim.f;
  const log = []; let pd = 0, pi = 0, hecho = false, temp = [];
  const abre = () => { sim.inicia(pd, pi, []); sim.E.sel = true; hecho = false; temp = []; };
  const ir = id => {
    for (;;) {
      if (esc.dias[pd].retos[pi].id === id && !hecho) return;
      if (!hecho) log.push(...sim.resuelve());
      pi++; if (pi >= esc.dias[pd].retos.length) { pd++; pi = 0; }
      abre();
    }
  };
  const prueba = (nombre, sqls, debePasar) => {
    for (const q of sqls) { const o = sim.corre(q), mal = o.res.find(r => !r.ok); temp.push(...o.nuevos); if (mal && debePasar) { fallos++; console.log('FALLO', nombre, 'error:', mal.err.texto, '\n   ', q); return; } }
    const v = sim.evalua();
    if (v.ok !== debePasar) { fallos++; console.log('FALLO', nombre, debePasar ? 'deberia pasar: ' + v.msgs.join(' / ') : 'no deberia pasar'); }
    if (v.ok) { log.push(...temp); temp = []; hecho = true; }
  };
  const deshaz = () => { sim.restaura(log, log.length, pd, pi, [], true); temp = []; };
  abre();
  const sede = n => sim.E.scalar('SELECT id_sede FROM sedes WHERE ciudad = ?', [n]);
  ir('L2');
  prueba('L2 comillas dobles y alias', ['select color as "Color", placa, precio from autoandes.vehiculos where estado = "reservado";'], true);
  prueba('L2 con SELECT *', ["SELECT * FROM vehiculos WHERE estado = 'RESERVADO';"], false);
  prueba('L2 sin filtro', ['SELECT placa, color, precio FROM vehiculos;'], false);
  ir('L3');
  prueba('L3 sin orden', ["SELECT placa, anio, precio FROM vehiculos WHERE estado = 'DISPONIBLE' ORDER BY precio ASC LIMIT 5;"], false);
  prueba('L3 orden por posicion', ["SELECT precio, placa, anio FROM vehiculos WHERE estado LIKE 'DISPONIBLE' ORDER BY 1 DESC LIMIT 0, 5;"], true);
  ir('L4');
  prueba('L4 con IN y JOIN', ["SELECT v.placa, v.color, v.anio, v.kilometraje FROM vehiculos v JOIN sedes s ON s.id_sede = v.id_sede WHERE s.ciudad = '" + f.l4.ciudad + "' AND v.estado = 'DISPONIBLE' AND v.color IN ('" + f.l4.c1 + "', '" + f.l4.c2 + "') AND v.anio > " + (f.l4.anio - 1) + ' AND v.kilometraje < ' + f.l4.km + ' ORDER BY v.kilometraje ASC;'], true);
  prueba('L4 sin parentesis', ["SELECT placa, color, anio, kilometraje FROM vehiculos WHERE estado = 'DISPONIBLE' AND id_sede = " + f.l4.sede + " AND color = '" + f.l4.c1 + "' OR color = '" + f.l4.c2 + "' AND anio >= " + f.l4.anio + ' AND kilometraje < ' + f.l4.km + ' ORDER BY kilometraje;'], false);
  ir('M3');
  prueba('M3 solo NULL', ['SELECT dni, nombres, apellidos, telefono FROM clientes WHERE correo IS NULL;'], false);
  prueba('M3 con IFNULL', ["SELECT dni, nombres, apellidos, telefono FROM clientes WHERE IFNULL(correo, '') = '';"], true);
  ir('M5');
  prueba('M5 con BETWEEN', ["SELECT placa, tipo_servicio, DATEDIFF(fecha_salida, fecha_ingreso) AS dias FROM servicios_taller WHERE fecha_ingreso BETWEEN '2026-10-01' AND '2026-10-31' AND DATEDIFF(fecha_salida, fecha_ingreso) >= 8;"], true);
  ir('X2');
  const idc = sim.E.scalar('SELECT id_cliente FROM clientes WHERE dni = ?', [f.x1.dni]);
  prueba('X2 solo el INSERT', ['INSERT INTO ventas (id_vehiculo, id_cliente, id_vendedor, fecha_venta, precio_final, forma_pago) VALUES (' + f.x2.veh + ', ' + idc + ', ' + f.x2.vend + ", '2026-11-18', " + f.x2.precio + ", 'contado');"], false);
  prueba('X2 completo con fecha escrita', ["UPDATE vehiculos SET estado = 'VENDIDO' WHERE id_vehiculo = " + f.x2.veh + ';'], true);
  ir('X4');
  prueba('X4 con LIKE y TRIM', f.sucios.map(d => "UPDATE clientes SET distrito = '" + d + "' WHERE UPPER(TRIM(distrito)) LIKE '" + d.slice(0, 3).toUpperCase() + "%" + d.slice(-3).toUpperCase() + "';"), true);
  ir('X5');
  prueba('X5 borrado directo', ['DELETE FROM clientes WHERE id_cliente = ' + f.x5.dup + ';'], false);
  deshaz();
  prueba('X5 borrando hijos (pierde historial)', ['DELETE FROM citas WHERE id_cliente = ' + f.x5.dup + ';', 'DELETE FROM servicios_taller WHERE id_cliente = ' + f.x5.dup + ';', 'DELETE FROM clientes WHERE id_cliente = ' + f.x5.dup + ';'], false);
  deshaz(); ir('J1');
  prueba('J1 con NOT NULL y sin COLUMN', ["ALTER TABLE vehiculos ADD combustible VARCHAR(15) NOT NULL DEFAULT 'GASOLINA';"], true);
  ir('J2');
  prueba('J2 con REFERENCES en linea (MySQL lo ignora)', ['CREATE TABLE IF NOT EXISTS seguros (id_seguro INT PRIMARY KEY AUTO_INCREMENT, id_vehiculo INT NOT NULL REFERENCES vehiculos(id_vehiculo), aseguradora VARCHAR(40) NOT NULL, fecha_inicio DATE, fecha_fin DATE, prima DECIMAL(8,2));'], false);
  prueba('J2 corrigiendo con ALTER', ['ALTER TABLE seguros ADD CONSTRAINT fk_seg_veh FOREIGN KEY (id_vehiculo) REFERENCES vehiculos (id_vehiculo);'], true);
  ir('J4');
  prueba('J4 con DELETE en lugar de TRUNCATE', ['DROP TABLE IF EXISTS tmp_clientes_2019;', 'DELETE FROM log_importacion WHERE id_log > 0;'], true);
  ir('J6');
  prueba('J6 con alias y orden', ['SELECT dni, COUNT(dni) AS veces FROM clientes GROUP BY dni HAVING veces > 1 ORDER BY veces DESC;'], true);
  ir('V3');
  prueba('V3 con NOT IN', ['SELECT nombres, apellidos FROM vendedores WHERE activo = 1 AND id_vendedor NOT IN (SELECT id_vendedor FROM ventas);'], true);
  prueba('V3 con RIGHT JOIN', ['SELECT ve.nombres, ve.apellidos FROM ventas v RIGHT JOIN vendedores ve ON ve.id_vendedor = v.id_vendedor WHERE v.id_venta IS NULL AND ve.activo = TRUE;'], true);
  ir('V4');
  prueba('V4 por la sede del vehiculo', ["SELECT s.nombre, COUNT(v.id_venta) AS ventas, SUM(v.precio_final) AS total FROM ventas v JOIN vehiculos ve USING (id_vehiculo) JOIN sedes s ON s.id_sede = ve.id_sede WHERE v.fecha_venta >= '2026-01-01' GROUP BY s.id_sede, s.nombre ORDER BY total DESC;"], true);
  console.log(fallos ? 'FALLOS: ' + fallos : 'ALTERNATIVAS OK');
  process.exit(fallos ? 1 : 0);
});

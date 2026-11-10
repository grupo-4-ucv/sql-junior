// Prueba rapida del motor: node tests/motor.js
global.SJ = {};
require('../js/config.js'); require('../js/engine.js');
const init = require('../vendor/sql-asm.js');
const cw = console.warn; console.warn = () => {};
init().then(SQL => {
  console.warn = cw;
  const E = new SJ.Engine(SQL, { db: 'tienda' });
  let fallos = 0;
  const run = (sql, esperado) => {
    const rs = E.exec(sql), r = rs[rs.length - 1];
    const got = r.ok ? (r.out ? JSON.stringify(r.out.rows) : r.info.split('\n')[0]) : (r.err.code + '');
    const ok = esperado === undefined || got === String(esperado) || (esperado instanceof RegExp && esperado.test(got));
    if (!ok) { fallos++; console.log('FALLO:', sql, '\n   obtuvo:', got, r.ok ? '' : r.err.texto, '\n   esperaba:', esperado); }
    return r;
  };
  run('SELECT 1;', '1046'.length ? undefined : 0);
  run('SELECT * FROM x;', '1046');
  run('USE otra;', '1049');
  run('USE tienda;', 'Database changed');
  run(`CREATE TABLE IF NOT EXISTS categorias (id_categoria INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(30) NOT NULL UNIQUE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`, 'Query OK, 0 rows affected');
  run(`CREATE TABLE productos (
     id_producto INT NOT NULL AUTO_INCREMENT,
     id_categoria INT NOT NULL,
     nombre VARCHAR(20) NOT NULL,
     precio DECIMAL(8,2) DEFAULT 0,
     alta DATE,
     creado DATETIME DEFAULT CURRENT_TIMESTAMP,
     estado ENUM('A','B') DEFAULT 'A',
     PRIMARY KEY (id_producto),
     CONSTRAINT fk_cat FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
  );`, 'Query OK, 0 rows affected');
  run('CREATE TABLE productos (a INT);', '1050');
  run('CREATE TABLE z (a VARCHAR2(10));', '1064');
  run('CREATE TABLE z (a INT, FOREIGN KEY (a) REFERENCES nada(id));', '1824');
  run('SHOW TABLES;', '[["categorias"],["productos"]]');
  run('DESCRIBE productos;', /"id_producto","int","NO","PRI",null,"auto_increment"/);
  run("INSERT INTO categorias (nombre) VALUES ('Audio'), ('Video');", 'Query OK, 2 rows affected');
  run("INSERT INTO categorias (nombre) VALUES ('audio');", '1062');
  run("INSERT INTO productos (id_categoria, nombre, precio, alta) VALUES (1, 'Parlante', 99.5, '2026-10-01'), (2, \"Tele\", 1500, CURDATE());", 'Query OK, 2 rows affected');
  run("INSERT INTO productos (id_categoria, nombre) VALUES (9, 'X');", '1452');
  run("INSERT INTO productos (id_categoria, nombre) VALUES (1, 'Nombre demasiado largo para la columna');", '1406');
  run("INSERT INTO productos (id_categoria, nombre, precio) VALUES (1, 'Y', 'caro');", '1366');
  run("INSERT INTO productos (id_categoria, nombre, alta) VALUES (1, 'Y', '01/10/2026');", '1292');
  run("INSERT INTO productos (id_categoria, nombre, estado) VALUES (1, 'Y', 'Z');", '1265');
  run("INSERT INTO productos VALUES (1, 'Y');", '1136');
  run('SELECT nombre, precio FROM productos WHERE NOMBRE = "parlante";', '[["Parlante",99.5]]');
  run('SELECT `nombre`, creado, alta FROM tienda.productos ORDER BY precio DESC LIMIT 1;', '[["Tele","2026-11-16 09:00:00","2026-11-16"]]');
  run('SELECT 7/2, 7 DIV 2, YEAR(alta), MONTH(alta), DATEDIFF(CURDATE(), alta) FROM productos WHERE id_producto = 1;', '[[3.5,3,2026,10,46]]');
  run("SELECT CONCAT(UPPER(nombre), '-', LEFT(nombre, 3)), IF(precio > 100, 'caro', 'ok'), DATE_ADD(alta, INTERVAL 1 MONTH) FROM productos ORDER BY 1;", '[["PARLANTE-Par","ok","2026-11-01"],["TELE-Tel","caro","2026-12-16"]]');
  run('SELECT c.nombre, COUNT(*) AS total, ROUND(AVG(p.precio), 2) FROM productos p INNER JOIN categorias c ON c.id_categoria = p.id_categoria GROUP BY c.nombre HAVING COUNT(*) >= 1 ORDER BY total DESC, c.nombre;', '[["Audio",1,99.5],["Video",1,1500]]');
  run('SELECT c.nombre FROM categorias c RIGHT JOIN productos p ON p.id_categoria = c.id_categoria WHERE p.precio > 100;', '[["Video"]]');
  run('SELECT * FROM productos p FULL JOIN categorias c ON 1 = 1;', '1064');
  run('SELECT nombre FROM productoss;', '1146');
  run('SELECT nombres FROM productos;', '1054');
  run('SELECT id_categoria FROM productos p JOIN categorias c ON p.id_categoria = c.id_categoria;', '1052');
  run('SELEC nombre FROM productos;', '1064');
  run('SELECT nombre FORM productos;', '1064');
  run('SELECT nombre FROM productos WHERE COUNT(*) > 1;', '1111');
  run('UPDATE productos SET precio = 10;', '1175');
  run('DELETE FROM productos;', '1175');
  run('UPDATE productos SET precio = precio * 2 WHERE id_producto = 1;', 'Query OK, 1 row affected');
  run('DELETE FROM categorias WHERE id_categoria = 1;', '1451');
  run('UPDATE productos SET id_categoria = 77 WHERE id_producto = 1;', '1452');
  run('TRUNCATE TABLE categorias;', '1701');
  run('DROP TABLE categorias;', '3730');
  run("ALTER TABLE productos ADD COLUMN stock INT NOT NULL DEFAULT 5 AFTER nombre, ADD marca VARCHAR(15);", 'Query OK, 0 rows affected');
  run('SELECT stock, marca, precio FROM productos ORDER BY id_producto;', '[[5,null,199],[5,null,1500]]');
  run('DESCRIBE productos;', /\["stock","int","NO","","5",""\]/);
  run('ALTER TABLE productos MODIFY nombre VARCHAR(60) NOT NULL;', 'Query OK, 0 rows affected');
  run("UPDATE productos SET nombre = 'Parlante con nombre bastante mas largo' WHERE id_producto = 1;", 'Query OK, 1 row affected');
  run('ALTER TABLE productos MODIFY nombre VARCHAR(5);', '1406');
  run('ALTER TABLE productos CHANGE marca fabricante VARCHAR(30) DEFAULT \'Generico\';', 'Query OK, 0 rows affected');
  run('ALTER TABLE productos DROP COLUMN id_categoria;', '1828');
  run('ALTER TABLE productos DROP COLUMN noexiste;', '1091');
  run('ALTER TABLE productos DROP COLUMN fabricante;', 'Query OK, 0 rows affected');
  run('ALTER TABLE categorias RENAME COLUMN id_categoria TO id_cat;', 'Query OK, 0 rows affected');
  run("INSERT INTO productos (id_categoria, nombre) VALUES (99, 'huerfano');", '1452');
  run("INSERT INTO productos (id_categoria, nombre) VALUES (2, 'Radio');", 'Query OK, 1 row affected');
  run('SELECT MAX(id_producto) FROM productos;', '[[3]]');
  run('CREATE TABLE IF NOT EXISTS copia AS SELECT nombre, precio FROM productos;', 'Query OK, 3 rows affected');
  run('DROP TABLE IF EXISTS copia, nohay;', 'Query OK, 0 rows affected, 1 warning');
  run('DROP TABLE nohay;', '1051');
  run('CREATE TABLE log_x (id INT AUTO_INCREMENT PRIMARY KEY, t TEXT);', 'Query OK, 0 rows affected');
  run("INSERT INTO log_x (t) VALUES ('a'), ('b');");
  run('TRUNCATE TABLE log_x;', 'Query OK, 0 rows affected');
  run("INSERT INTO log_x (t) VALUES ('c');"); run('SELECT id FROM log_x;', '[[1]]');
  run('RENAME TABLE log_x TO bitacora;', 'Query OK, 0 rows affected');
  run('SHOW TABLES;', '[["bitacora"],["categorias"],["productos"]]');
  run('CREATE DATABASE prueba;', '1044');
  run('SET SQL_SAFE_UPDATES = 0;', '1227');
  run("SELECT nombre FROM productos WHERE nombre LIKE 'par%' AND precio BETWEEN 1 AND 500 AND alta IS NOT NULL AND id_categoria IN (1, 2);", /Parlante/);
  run('ALTER TABLE productos ADD CONSTRAINT fk2 FOREIGN KEY (stock) REFERENCES categorias(id_cat);', '1452');
  run('SELECT COUNT(DISTINCT id_categoria), SUM(precio), MIN(precio), MAX(precio) FROM productos;', '[[2,1699,0,1500]]');
  // sin punto y coma
  let r = E.exec('SELECT 1')[0]; if (r.ok || r.type !== 'incompleta') { fallos++; console.log('FALLO: sin punto y coma'); }
  // buenas practicas
  r = E.exec('select nombre from productos where precio > 1;')[0]; if (!r.lint.some(l => l.id === 'mayus')) { fallos++; console.log('FALLO lint mayus'); }
  r = E.exec('SELECT nombre FROM productos WHERE precio > 1;')[0]; if (r.lint.length) { fallos++; console.log('FALLO lint limpio', r.lint); }
  r = E.exec("INSERT INTO bitacora VALUES (NULL, 'x');")[0]; if (!r.lint.some(l => l.id === 'inscols')) { fallos++; console.log('FALLO lint inscols', r); }
  r = E.exec('CREATE TABLE q1 (a INT);')[0]; if (!r.lint.some(l => l.id === 'ifexists')) { fallos++; console.log('FALLO lint ifexists'); }
  r = E.exec('SHOW CREATE TABLE productos;')[0]; console.log(r.out.rows[0][1]);
  r = E.exec('SELECT nombre FORM productos;')[0]; console.log(r.err.texto);
  r = E.exec('SELECT precio/2, LEFT(nombre,2), COUNT(*) FROM productos;')[0]; console.log(r.out.cols);
  console.log(fallos ? 'FALLOS: ' + fallos : 'MOTOR OK');
});

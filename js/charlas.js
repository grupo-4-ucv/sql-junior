/* SQL Junior - normas del equipo y charlas del jefe (se muestran antes de los retos y quedan en la libreta). */
(function (root) {
  'use strict';
  const SJ = root.SJ = root.SJ || {};

  SJ.NORMAS = [
    'Al empezar cada día selecciona la base de datos con <code>USE</code>. Sin eso el servidor responde el error 1046.',
    'Toda sentencia termina en punto y coma <code>;</code>. Sin él, MySQL se queda esperando y no ejecuta nada.',
    'Palabras reservadas y funciones en MAYÚSCULAS (<code>SELECT</code>, <code>WHERE</code>, <code>COUNT</code>). Tablas y columnas tal como existen en la base.',
    'Usa <code>CREATE TABLE IF NOT EXISTS</code> y <code>DROP TABLE IF EXISTS</code>.',
    '<code>UPDATE</code> y <code>DELETE</code> siempre con <code>WHERE</code>. El servidor está en modo seguro y los bloquea si falta. Antes de modificar, prueba el mismo <code>WHERE</code> con un <code>SELECT</code>.',
    'En cada <code>INSERT</code> escribe la lista de columnas.',
    'No escribas <code>ENGINE</code> ni <code>CHARSET</code>: el servidor ya trabaja con InnoDB y utf8mb4.',
    'Las consultas se escriben, no se pegan. El pegado está bloqueado y el reporte registra las salidas de la ventana.'
  ];

  SJ.HABILIDADES = {
    explorar: 'Explorar la base', select: 'SELECT básico', filtros: 'Filtros', funciones: 'Funciones de texto y fecha',
    dml: 'INSERT, UPDATE, DELETE', ddl: 'Estructura (DDL)', agregacion: 'Agregación', join: 'JOIN',
    logica: 'CASE y lógica condicional', subconsulta: 'Subconsultas', conjuntos: 'UNION y autouniones', ventana: 'Funciones de ventana',
    vistas: 'Vistas', dmlav: 'Cambios masivos', transaccion: 'Transacciones', integridad: 'Restricciones e índices', reporte: 'Reportes integradores'
  };

  /* Cada charla: dia (0 = lunes), en (indice del reto antes del cual aparece), titulo, dice (lineas del jefe) y notas para la libreta.
     Los ejemplos usan una base de biblioteca, distinta a la de los retos. */
  SJ.CHARLAS = [
    { dia: 0, en: 0, titulo: 'Conectarte y reconocer la base', dice: [
      'Antes de tocar un solo dato, un buen analista reconoce el terreno.',
      'Al conectarte, el servidor no sabe con qué base quieres trabajar. Se lo dices con USE. Sin eso, todo falla con el error 1046.',
      'SHOW TABLES lista las tablas. DESCRIBE muestra las columnas de una tabla, su tipo y sus claves: PRI es la clave primaria y MUL suele ser una clave foránea.',
      'Para leer datos usas SELECT: eliges columnas, indicas la tabla con FROM y filtras filas con WHERE. Los textos y las fechas van entre comillas simples.',
      'Las solicitudes llegan como en la vida real: nadie te dirá el nombre de la tabla ni de la columna. Explora antes de responder. Te dejo todo anotado en tu libreta.'
    ], notas: [
      { t: 'Conectar y explorar', s: 'USE nombre_base;\nSHOW TABLES;\nDESCRIBE nombre_tabla;', e: 'USE biblioteca;\nSHOW TABLES;\nDESCRIBE libros;', n: 'En DESCRIBE: PRI = clave primaria, MUL = clave foránea hacia otra tabla.' },
      { t: 'SELECT con WHERE', s: 'SELECT columna1, columna2\nFROM tabla\nWHERE condicion;', e: "SELECT titulo, precio\nFROM libros\nWHERE genero = 'Novela';", n: 'Comparadores: =  <>  >  <  >=  <=. SELECT * trae todas las columnas: sirve para explorar, no para entregar.' }
    ] },
    { dia: 0, en: 2, titulo: 'Ordenar, limitar y combinar condiciones', dice: [
      'Los jefes siempre piden "los más" y "los menos". Eso es ordenar y cortar.',
      'ORDER BY ordena el resultado: ASC de menor a mayor, que es lo que hace por defecto, y DESC de mayor a menor. LIMIT se queda con las primeras filas.',
      'Para combinar condiciones: AND exige que se cumplan todas y OR que se cumpla alguna. Si mezclas ambas, usa paréntesis o el resultado te va a sorprender.'
    ], notas: [
      { t: 'ORDER BY y LIMIT', s: 'SELECT columnas\nFROM tabla\nORDER BY columna DESC\nLIMIT cantidad;', e: 'SELECT titulo, precio\nFROM libros\nORDER BY precio DESC\nLIMIT 3;', n: 'ASC = menor a mayor (por defecto). DESC = mayor a menor.' },
      { t: 'AND, OR y paréntesis', s: 'WHERE condicion1 AND (condicion2 OR condicion3)', e: "SELECT titulo\nFROM libros\nWHERE anio >= 2020\n  AND (genero = 'Novela' OR genero = 'Cuento');", n: 'AND se evalúa antes que OR. Los paréntesis dejan claro qué quieres.' }
    ] },
    { dia: 1, en: 0, titulo: 'Filtros finos', dice: [
      'Ayer filtraste por valores exactos. Hoy las solicitudes vienen incompletas: "empieza con...", "entre tal y tal fecha", "los que no tienen...".',
      'LIKE busca por patrón: el signo % reemplaza cualquier cantidad de caracteres y el guion bajo reemplaza exactamente uno.',
      'IN compara contra una lista de valores. BETWEEN cubre un rango e incluye los dos extremos; sirve para números y para fechas.',
      'Cuidado con los vacíos. NULL significa "sin dato" y no se compara con el signo igual: se pregunta con IS NULL. Y un texto vacío no es NULL. En las bases reales conviven los dos.'
    ], notas: [
      { t: 'LIKE', s: "WHERE columna LIKE 'patron'", e: "SELECT titulo FROM libros WHERE titulo LIKE 'El %';\nSELECT titulo FROM libros WHERE titulo LIKE '%amor%';", n: '%  = cualquier cantidad de caracteres.   _  = un solo carácter.' },
      { t: 'IN y BETWEEN', s: 'WHERE columna IN (valor1, valor2)\nWHERE columna BETWEEN minimo AND maximo', e: "SELECT titulo FROM libros\nWHERE genero IN ('Novela', 'Poesia')\n  AND fecha_compra BETWEEN '2026-01-01' AND '2026-01-31';", n: 'BETWEEN incluye ambos extremos. Las fechas van como \'AAAA-MM-DD\'.' },
      { t: 'IS NULL', s: 'WHERE columna IS NULL\nWHERE columna IS NOT NULL', e: "SELECT nombre FROM socios\nWHERE telefono IS NULL OR telefono = '';", n: "NULL no es lo mismo que un texto vacío ''. Nunca escribas = NULL." }
    ] },
    { dia: 1, en: 3, titulo: 'Funciones de texto y fecha', dice: [
      'Los datos los escribe gente apurada: mayúsculas mezcladas, espacios de más, nombres con letras faltantes. Antes de limpiar hay que detectar.',
      'DISTINCT quita las filas repetidas del resultado. UPPER, LOWER y TRIM normalizan un texto, y LENGTH delata los espacios escondidos.',
      'Con fechas: CURDATE() es hoy, YEAR() y MONTH() extraen el año y el mes, y DATEDIFF(fin, inicio) devuelve los días entre dos fechas.'
    ], notas: [
      { t: 'DISTINCT y funciones de texto', s: 'SELECT DISTINCT columna FROM tabla;\nUPPER(texto)  LOWER(texto)  TRIM(texto)\nLENGTH(texto)  CONCAT(a, b)  REPLACE(texto, busca, pon)', e: 'SELECT DISTINCT UPPER(TRIM(ciudad))\nFROM socios\nORDER BY 1;', n: 'TRIM quita espacios al inicio y al final. ORDER BY 1 ordena por la primera columna del resultado.' },
      { t: 'Funciones de fecha', s: 'CURDATE()   YEAR(fecha)   MONTH(fecha)\nDATEDIFF(fecha_fin, fecha_inicio)', e: 'SELECT id_prestamo, DATEDIFF(fecha_devolucion, fecha_prestamo)\nFROM prestamos\nWHERE YEAR(fecha_prestamo) = 2026 AND MONTH(fecha_prestamo) = 3;', n: 'Si una de las fechas es NULL, DATEDIFF devuelve NULL y la fila no pasa el filtro.' }
    ] },
    { dia: 2, en: 0, titulo: 'Modificar datos sin romper nada', dice: [
      'Hoy dejas de mirar y empiezas a modificar. Aquí un error cuesta caro, así que escucha.',
      'INSERT agrega filas. Escribe siempre la lista de columnas: si mañana alguien agrega una columna a la tabla, tu sentencia seguirá funcionando.',
      'UPDATE cambia y DELETE elimina. Los dos llevan WHERE. El servidor los rechaza si falta, pero un WHERE equivocado igual hace daño: primero pruébalo con un SELECT.',
      'Las claves foráneas te cuidan. No puedes apuntar a un padre que no existe, eso es el error 1452, ni borrar un padre que tiene hijos, que es el error 1451. Si te pasa, resuelve primero a los hijos.',
      'Si algo sale muy mal, el botón Restaurar devuelve la base al inicio de la solicitud.'
    ], notas: [
      { t: 'INSERT', s: 'INSERT INTO tabla (columna1, columna2)\nVALUES (valor1, valor2);', e: "INSERT INTO socios (nombre, ciudad, fecha_alta)\nVALUES ('Ana Ruiz', 'Lima', CURDATE());", n: 'La clave primaria AUTO_INCREMENT no se escribe: el servidor la asigna sola.' },
      { t: 'UPDATE', s: 'UPDATE tabla\nSET columna = valor\nWHERE condicion;', e: "SELECT * FROM socios WHERE id_socio = 14;\nUPDATE socios SET ciudad = 'Cusco' WHERE id_socio = 14;", n: 'Primero el SELECT con el mismo WHERE. Si devuelve lo que esperas, recién ejecuta el UPDATE.' },
      { t: 'DELETE y claves foráneas', s: 'DELETE FROM tabla\nWHERE condicion;', e: 'UPDATE prestamos SET id_socio = 14 WHERE id_socio = 31;\nDELETE FROM socios WHERE id_socio = 31;', n: 'Error 1451: la fila tiene hijos en otra tabla. Reasigna o elimina a los hijos antes de borrar al padre.' }
    ] },
    { dia: 3, en: 0, titulo: 'Cambiar la estructura', dice: [
      'El negocio cambia y las tablas también. Hoy modificas estructura, lo que se conoce como DDL.',
      'ALTER TABLE agrega columnas con ADD, las cambia con MODIFY y las quita con DROP COLUMN. En MODIFY vuelves a escribir el tipo completo.',
      'CREATE TABLE define las columnas, la clave primaria y las claves foráneas. La tabla padre debe existir antes y los tipos de ambas columnas deben coincidir.',
      'DROP TABLE elimina la tabla entera. TRUNCATE la deja vacía pero viva. Norma de la casa: IF NOT EXISTS al crear, IF EXISTS al eliminar.'
    ], notas: [
      { t: 'ALTER TABLE', s: 'ALTER TABLE tabla ADD COLUMN columna TIPO;\nALTER TABLE tabla MODIFY columna NUEVO_TIPO;\nALTER TABLE tabla DROP COLUMN columna;', e: "ALTER TABLE libros ADD COLUMN idioma VARCHAR(20) DEFAULT 'ES';\nALTER TABLE libros MODIFY titulo VARCHAR(150) NOT NULL;", n: 'Tipos frecuentes: INT, DECIMAL(10,2), VARCHAR(n), DATE.' },
      { t: 'CREATE TABLE', s: 'CREATE TABLE IF NOT EXISTS tabla (\n  columna TIPO restricciones,\n  PRIMARY KEY (columna),\n  FOREIGN KEY (columna) REFERENCES padre(columna)\n);', e: 'CREATE TABLE IF NOT EXISTS reservas (\n  id_reserva INT AUTO_INCREMENT,\n  id_libro INT NOT NULL,\n  fecha_reserva DATE,\n  nota VARCHAR(80),\n  PRIMARY KEY (id_reserva),\n  FOREIGN KEY (id_libro) REFERENCES libros(id_libro)\n);', n: 'Obligatorio = NOT NULL. Autoincremental = AUTO_INCREMENT. La clave foránea se declara aparte, con FOREIGN KEY.' },
      { t: 'DROP TABLE y TRUNCATE', s: 'DROP TABLE IF EXISTS tabla;\nTRUNCATE TABLE tabla;', e: 'DROP TABLE IF EXISTS tmp_prestamos_viejos;\nTRUNCATE TABLE bitacora_cargas;', n: 'DROP borra la tabla. TRUNCATE borra todas sus filas y conserva la estructura.' }
    ] },
    { dia: 3, en: 4, titulo: 'Resumir datos', dice: [
      'Gerencia no lee filas: lee totales.',
      'COUNT cuenta, SUM suma, AVG promedia, y MIN y MAX dan los extremos. ROUND(valor, 2) deja dos decimales.',
      'GROUP BY arma grupos y calcula un resultado por cada uno. Toda columna del SELECT que no sea una función de agregación debe estar en el GROUP BY.',
      'WHERE filtra filas antes de agrupar. HAVING filtra grupos después. Para encontrar "los que aparecen más de una vez", la condición va en HAVING.'
    ], notas: [
      { t: 'Funciones de agregación', s: 'COUNT(*)  SUM(columna)  AVG(columna)\nMIN(columna)  MAX(columna)  ROUND(valor, 2)', e: "SELECT COUNT(*), ROUND(AVG(precio), 2)\nFROM libros\nWHERE genero = 'Novela';", n: 'COUNT(*) cuenta filas. COUNT(columna) no cuenta los NULL.' },
      { t: 'GROUP BY', s: 'SELECT columna, FUNCION(...)\nFROM tabla\nWHERE condicion\nGROUP BY columna;', e: 'SELECT genero, COUNT(*), ROUND(AVG(precio), 2)\nFROM libros\nGROUP BY genero;', n: 'Una fila de resultado por cada grupo.' },
      { t: 'HAVING', s: 'GROUP BY columna\nHAVING condicion_sobre_el_grupo', e: 'SELECT isbn, COUNT(*)\nFROM libros\nGROUP BY isbn\nHAVING COUNT(*) > 1;', n: 'WHERE filtra filas (antes de agrupar). HAVING filtra grupos (después).' }
    ] },
    { dia: 4, en: 0, titulo: 'Unir tablas', dice: [
      'Último día. Hasta hoy buscabas un id en una tabla y lo usabas en otra. JOIN hace ese viaje en una sola consulta.',
      'INNER JOIN une las filas que coinciden en las dos tablas. La condición va en ON y casi siempre es clave foránea igual a clave primaria.',
      'Usa alias cortos y escribe alias.columna. Si una columna existe en las dos tablas y no dices de cuál es, MySQL responde el error 1052.',
      'LEFT JOIN conserva todas las filas de la tabla izquierda aunque no tengan pareja; lo que falta llega como NULL. Por eso LEFT JOIN con IS NULL encuentra "los que no tienen". RIGHT JOIN hace lo mismo mirando desde la derecha.'
    ], notas: [
      { t: 'INNER JOIN', s: 'SELECT a.columna, b.columna\nFROM tabla_a a\nINNER JOIN tabla_b b ON a.id_b = b.id_b;', e: 'SELECT l.titulo, e.nombre\nFROM libros l\nINNER JOIN editoriales e ON l.id_editorial = e.id_editorial\nORDER BY e.nombre, l.titulo;', n: 'ON: clave foránea = clave primaria. Los alias (l, e) evitan el error 1052.' },
      { t: 'JOIN de tres tablas', s: 'FROM a\nINNER JOIN b ON ...\nINNER JOIN c ON ...', e: "SELECT p.fecha_prestamo, s.nombre, l.titulo\nFROM prestamos p\nINNER JOIN socios s ON p.id_socio = s.id_socio\nINNER JOIN libros l ON p.id_libro = l.id_libro\nWHERE p.fecha_prestamo >= '2026-01-01';", n: 'Cada JOIN agrega una tabla y su propia condición ON.' },
      { t: 'LEFT JOIN y RIGHT JOIN', s: 'FROM a\nLEFT JOIN b ON a.id = b.id_a\nWHERE b.id IS NULL', e: 'SELECT s.nombre\nFROM socios s\nLEFT JOIN prestamos p ON s.id_socio = p.id_socio\nWHERE p.id_prestamo IS NULL;', n: 'Devuelve los socios que nunca pidieron un préstamo. RIGHT JOIN conserva todas las filas de la tabla derecha.' }
    ] },
    { dia: 4, en: 3, titulo: 'El reporte completo', dice: [
      'Para cerrar la semana: el resultado de un JOIN también se puede agrupar.',
      'El orden de escritura es siempre el mismo: SELECT, FROM, JOIN, WHERE, GROUP BY, HAVING, ORDER BY y LIMIT.',
      'Arma el reporte por partes. Primero el JOIN y revisa que las filas tengan sentido. Luego agrupa. Al final ordena y corta.'
    ], notas: [
      { t: 'JOIN con GROUP BY', s: 'SELECT ... FROM ... JOIN ...\nWHERE ...\nGROUP BY ...\nHAVING ...\nORDER BY ...\nLIMIT ...;', e: 'SELECT e.nombre, COUNT(*), SUM(l.precio)\nFROM libros l\nINNER JOIN editoriales e ON l.id_editorial = e.id_editorial\nWHERE l.anio = 2026\nGROUP BY e.nombre\nHAVING COUNT(*) >= 5\nORDER BY SUM(l.precio) DESC\nLIMIT 3;', n: 'Las cláusulas siempre se escriben en ese orden.' }
    ] }
  ];
})(typeof window !== 'undefined' ? window : global);

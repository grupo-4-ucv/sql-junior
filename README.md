# SQL Junior

Simulador de bases de datos MySQL en HTML, CSS y JavaScript. El estudiante vive su primera semana como analista junior en una de tres empresas (automotriz, venta online o telecomunicaciones), recibe solicitudes como las de un trabajo real y las resuelve escribiendo consultas.

No necesita servidor ni base de datos: todo corre en el navegador.

## Cómo se juega

- Elige una empresa. No puede cambiarla hasta terminar la semana, presentar el reporte y superar el 80%.
- Cinco días (lunes a viernes), 25 solicitudes por empresa:

| Día | Tema | Solicitudes | Tiempo sugerido |
|---|---|---|---|
| Lunes | USE, SHOW, DESCRIBE, SELECT, WHERE, ORDER BY, LIMIT | 4 | 25 min |
| Martes | LIKE, IN, BETWEEN, IS NULL, DISTINCT, funciones de texto y fecha | 5 | 30 min |
| Miércoles | INSERT, UPDATE, DELETE y claves foráneas | 5 | 35 min |
| Jueves | ALTER, CREATE, DROP, TRUNCATE, COUNT/SUM/AVG, GROUP BY, HAVING | 6 | 45 min |
| Viernes | INNER JOIN, LEFT JOIN, JOIN con agregación | 5 | 45 min |

- Antes de cada tema el jefe del equipo da una charla breve. Lo explicado queda en la libreta, que se consulta sin costo.
- Dos pistas por día. Cada pista resta 10 puntos a la solicitud donde se usa.
- Un descanso de 15 minutos con cuenta regresiva (botón "Descanso"). El reloj del día se detiene.
- Cada solicitud vale 100 puntos: 80 por el resultado y 20 por buenas prácticas. Cada entrega incorrecta resta 5 (máximo 20). Omitir una solicitud da 0 puntos y muestra la solución.
- Efectos de sonido al ejecutar consultas, recibir solicitudes, resolverlas y cerrar el día. Se encienden o apagan con el botón "Sonido".

## Mejora de contrato: nivel intermedio

Quien aprueba las tres empresas junior recibe una oferta de ascenso. En la pantalla de selección aparecen tres empresas nuevas, bloqueadas hasta entonces:

| Empresa | Rubro | Puesto | Estado |
|---|---|---|---|
| Kallpa Finanzas | Banca digital | Analista de Riesgo Crediticio | Disponible |
| PachaSalud | Red de clínicas | Analista de Información Clínica | Próximamente |
| RutaNorte | Transporte y logística | Analista de Operaciones | Próximamente |

- Dos semanas de trabajo (10 días) y 50 solicitudes por empresa.
- Una pista por día, solo conceptual, que resta 15 puntos.
- Solicitudes con más lógica: varios pasos, datos que hay que investigar y cifras que deben cuadrar exactamente.

| Semana | Temas |
|---|---|
| 1 | JOIN de varias tablas, CASE, COALESCE, TIMESTAMPDIFF, DATE_FORMAT, subconsultas (escalares, IN, EXISTS, correlacionadas y en el FROM), UNION, autouniones, ROW_NUMBER |
| 2 | Vistas, INSERT ... SELECT, UPDATE y DELETE con JOIN, transacciones (COMMIT y ROLLBACK), CHECK, UNIQUE, índices, claves primarias compuestas, RANK y acumulados |

## Qué entiende el simulador

Sintaxis de MySQL sobre un motor SQLite (sql.js) con una capa de compatibilidad:

- `USE`, `SHOW DATABASES`, `SHOW TABLES`, `DESCRIBE`, `SHOW COLUMNS`, `SHOW CREATE TABLE`.
- `SELECT` con `WHERE`, `AND/OR/NOT`, `LIKE`, `IN`, `BETWEEN`, `IS NULL`, `DISTINCT`, `ORDER BY`, `LIMIT`, subconsultas, `GROUP BY`, `HAVING`, `INNER/LEFT/RIGHT JOIN`, `UNION`.
- Funciones: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, `ROUND`, `UPPER`, `LOWER`, `TRIM`, `CONCAT`, `LENGTH`, `REPLACE`, `SUBSTRING`, `LEFT`, `RIGHT`, `IF`, `IFNULL`, `COALESCE`, `NOW`, `CURDATE`, `YEAR`, `MONTH`, `DAY`, `DATEDIFF`, `DATE_ADD`, `DATE_SUB`, `DATE_FORMAT`, entre otras.
- `INSERT`, `UPDATE`, `DELETE` con claves foráneas activas y modo seguro (sin `WHERE` se bloquean, error 1175).
- `CREATE TABLE` (tipos de MySQL, `AUTO_INCREMENT`, `PRIMARY KEY`, `FOREIGN KEY`, `DEFAULT`, `NOT NULL`, `UNIQUE`, `ENUM`), `ALTER TABLE` (`ADD`, `MODIFY`, `CHANGE`, `DROP COLUMN`, `RENAME`), `DROP TABLE`, `TRUNCATE`.
- Errores con el número y el texto de MySQL (1046, 1054, 1062, 1064, 1146, 1451, 1452, 1406...) y una ayuda en español debajo.
- Vistas (`CREATE [OR REPLACE] VIEW`, `DROP VIEW`), transacciones (`START TRANSACTION`, `COMMIT`, `ROLLBACK`), `UPDATE` y `DELETE` con `JOIN`, `INSERT ... SELECT`, `CREATE INDEX`, restricciones `CHECK` y `UNIQUE`, y funciones de ventana (`ROW_NUMBER`, `RANK`, `SUM ... OVER`).
- La fecha del servidor es la del día simulado.

No incluye procedimientos almacenados, triggers ni usuarios. Los tipos de Oracle (`VARCHAR2`, `NUMBER`) devuelven un aviso con su equivalente en MySQL.

## Estructura

```
index.html            el juego
docente.html          verificador de códigos y cambio de clave
css/style.css         estilos
js/config.js          ajustes del docente
js/engine.js          motor: MySQL sobre SQLite
js/datos.js           generador de datos con semilla
js/charlas.js         normas y charlas del jefe
js/esc_*.js           las tres empresas: tablas, datos y solicitudes
js/nucleo.js          validador, puntaje e informe
js/int_*.js           empresas del nivel intermedio
js/cripto.js          apertura del nivel intermedio
js/pixel.js           pixel art dibujado por código
js/sonido.js          efectos de sonido (Web Audio)
js/ui.js, juego.js    pantallas
vendor/sql-asm.js     SQLite compilado a JavaScript (sql.js, licencia MIT)
tests/                pruebas automáticas
```

## Pruebas

Con Node.js instalado:

```
node tests/motor.js            motor SQL
node tests/retos.js 50         las 75 solicitudes con 50 semillas por empresa
node tests/alternativas.js     soluciones alternativas y respuestas incorrectas
node tests/navegador.js        recorrido completo en Chromium (requiere Playwright)
node tests/candado.js          bloqueo del nivel intermedio
```

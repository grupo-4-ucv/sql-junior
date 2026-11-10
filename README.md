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

## Qué entiende el simulador

Sintaxis de MySQL sobre un motor SQLite (sql.js) con una capa de compatibilidad:

- `USE`, `SHOW DATABASES`, `SHOW TABLES`, `DESCRIBE`, `SHOW COLUMNS`, `SHOW CREATE TABLE`.
- `SELECT` con `WHERE`, `AND/OR/NOT`, `LIKE`, `IN`, `BETWEEN`, `IS NULL`, `DISTINCT`, `ORDER BY`, `LIMIT`, subconsultas, `GROUP BY`, `HAVING`, `INNER/LEFT/RIGHT JOIN`, `UNION`.
- Funciones: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, `ROUND`, `UPPER`, `LOWER`, `TRIM`, `CONCAT`, `LENGTH`, `REPLACE`, `SUBSTRING`, `LEFT`, `RIGHT`, `IF`, `IFNULL`, `COALESCE`, `NOW`, `CURDATE`, `YEAR`, `MONTH`, `DAY`, `DATEDIFF`, `DATE_ADD`, `DATE_SUB`, `DATE_FORMAT`, entre otras.
- `INSERT`, `UPDATE`, `DELETE` con claves foráneas activas y modo seguro (sin `WHERE` se bloquean, error 1175).
- `CREATE TABLE` (tipos de MySQL, `AUTO_INCREMENT`, `PRIMARY KEY`, `FOREIGN KEY`, `DEFAULT`, `NOT NULL`, `UNIQUE`, `ENUM`), `ALTER TABLE` (`ADD`, `MODIFY`, `CHANGE`, `DROP COLUMN`, `RENAME`), `DROP TABLE`, `TRUNCATE`.
- Errores con el número y el texto de MySQL (1046, 1054, 1062, 1064, 1146, 1451, 1452, 1406...) y una ayuda en español debajo.
- La fecha del servidor es la del día simulado (del lunes 16 al viernes 20 de noviembre de 2026).

No incluye transacciones, vistas, procedimientos ni usuarios. Los tipos de Oracle (`VARCHAR2`, `NUMBER`) devuelven un aviso con su equivalente en MySQL.

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
js/pixel.js           pixel art dibujado por código
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
```

// Candado del nivel intermedio y sonido: node tests/candado.js [carpeta_capturas]
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const RAIZ = path.join(__dirname, '..'), OUT = process.argv[2] || path.join(RAIZ, 'tests', 'capturas');
fs.mkdirSync(OUT, { recursive: true });
const srv = http.createServer((q, r) => { const f = path.join(RAIZ, q.url === '/' ? '/index.html' : q.url.split('?')[0]); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html; charset=utf-8' }); r.end(d); }); });
(async () => {
  await new Promise(ok => srv.listen(0, ok));
  const br = await chromium.launch(), pg = await br.newPage({ viewport: { width: 1280, height: 900 } }), err = [], notas = [];
  pg.on('pageerror', e => err.push(e.message));
  await pg.goto('http://localhost:' + srv.address().port + '/'); await pg.waitForSelector('#in-form');
  await pg.type('#in-id', 'CANDADO1'); await pg.type('#in-nom', 'Mia'); await pg.type('#in-ape', 'Rojas'); await pg.click('#in-form button');
  await pg.check('#nm-chk'); await pg.click('#nm-sig'); await pg.waitForSelector('.empresa[data-int]');
  await pg.evaluate(() => document.querySelector('.empresa[data-int]').scrollIntoView());
  await pg.screenshot({ path: path.join(OUT, '30-empresas-con-candado.png'), fullPage: false });
  await pg.click('.empresa[data-int="kallpa"]'); await pg.waitForSelector('#cd-ok');
  await pg.screenshot({ path: path.join(OUT, '31-aviso-candado.png') });
  notas.push('aviso: ' + (await pg.textContent('.ventana h2')));
  await pg.click('#cd-ok');
  // forzar desde la consola: marcar un desbloqueo falso sin tres empresas aprobadas
  await pg.evaluate(() => { SJ.UI.S.hechas = { autoandes: { pct: 95 } }; SJ.UI.guardar(); SJ.UI.empresas(); });
  await pg.click('.empresa[data-int="rutanorte"]'); notas.push('con 1 aprobada: ' + (await pg.textContent('.ventana h2'))); await pg.click('#cd-ok');
  await pg.evaluate(() => { SJ.UI.S.hechas = { autoandes: { pct: 95 }, mercapixel: { pct: 88 }, novatel: { pct: 91 } }; SJ.UI.guardar(); SJ.UI.empresas(); });
  await pg.click('.empresa[data-int="pachasalud"]'); notas.push('con 3 aprobadas: ' + (await pg.textContent('.ventana h2')));
  await pg.screenshot({ path: path.join(OUT, '32-ascenso.png') });
  const son = await pg.evaluate(() => { const a = document.querySelector('[data-son]'); return a ? a.textContent : 'sin boton en esta pantalla'; });
  notas.push('boton de sonido: ' + son);
  console.log(notas.join('\n')); console.log('errores:', JSON.stringify(err));
  await br.close(); srv.close(); process.exit(err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e.message); process.exit(1); });

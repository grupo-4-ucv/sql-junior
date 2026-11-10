// Recorrido completo en un navegador real: node tests/navegador.js [empresa] [carpeta_capturas]
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const RAIZ = path.join(__dirname, '..'), EMP = process.argv[2] || 'autoandes', OUT = process.argv[3] || path.join(RAIZ, 'tests', 'capturas');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
fs.mkdirSync(OUT, { recursive: true });
const srv = http.createServer((q, r) => {
  const f = path.join(RAIZ, decodeURIComponent(q.url.split('?')[0] === '/' ? '/index.html' : q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com" }); r.end(d); });
});
(async () => {
  await new Promise(ok => srv.listen(0, ok));
  const url = 'http://localhost:' + srv.address().port + '/';
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
  const errores = [];
  pg.on('pageerror', e => errores.push('pageerror: ' + e.message));
  pg.on('console', m => { if (m.type() === 'error') errores.push('console: ' + m.text()); });
  const foto = n => pg.screenshot({ path: path.join(OUT, n + '.png') });
  await pg.goto(url); await pg.waitForSelector('#in-form'); await pg.waitForTimeout(600); await foto('01-inicio');
  await pg.type('#in-id', 'A20261234'); await pg.type('#in-nom', 'Luis Alberto'); await pg.type('#in-ape', 'Quispe Rojas'); await pg.click('#in-form button');
  await pg.waitForSelector('#nm-chk'); await foto('02-normas'); await pg.check('#nm-chk'); await pg.click('#nm-sig');
  await pg.waitForSelector('.empresa'); await pg.waitForTimeout(200); await foto('03-empresas');
  await pg.click('.empresa[data-esc="' + EMP + '"]'); await pg.click('#cf-si');
  await pg.waitForSelector('#ch-sig'); await pg.waitForTimeout(900); await foto('04-charla');
  const charla = async () => { while (await pg.$('#ch-sig')) { await pg.click('#ch-sig'); await pg.waitForTimeout(15); } };
  const corre = async q => { await pg.click('#j-sql'); await pg.keyboard.press('Control+A'); await pg.keyboard.press('Backspace'); await pg.keyboard.type(q); await pg.keyboard.press('Control+Enter'); };
  const sols = await pg.evaluate(emp => {
    const esc = SJ.escenarios[emp], s = new SJ.Sim(SJ.SQL, esc, 'A20261234|' + emp + '|1');
    return esc.dias.map(d => d.retos.map(r => (r.sol ? r.sol(s.f) : [r.ref(s.f)])));
  }, EMP);
  const db = await pg.evaluate(emp => SJ.escenarios[emp].db, EMP);
  for (let d = 0; d < 5; d++) {
    await charla();
    if (d > 0) await corre('USE ' + db + ';');
    if (d === 0) { await pg.click('#b-libreta'); await pg.waitForTimeout(100); await foto('05-libreta'); await pg.click('#lb-ok'); }
    for (let i = 0; i < sols[d].length; i++) {
      await charla();
      if (d === 0 && i === 1) {
        await corre('select * from vehiculo'); await corre('SELECT placa FROM vehiculo;'); await corre('select placa, precio from ' + (EMP === 'autoandes' ? 'vehiculos' : EMP === 'mercapixel' ? 'productos' : 'planes') + ' limit 3;');
        await pg.click('#b-entregar'); await pg.waitForTimeout(150); await foto('06-consola-errores');
        await pg.click('#b-pista'); await pg.click('#cf-si'); await pg.waitForTimeout(100); await foto('07-pista');
      }
      if (d === 2 && i === 0) { await corre('DELETE FROM clientes;'); await pg.waitForTimeout(100); await foto('08-modo-seguro'); }
      for (const q of sols[d][i]) await corre(q);
      if (d === 4 && i === 4) await foto('09-ultimo-reto');
      await pg.click('#b-entregar');
      try { await pg.waitForSelector('#cr-ok', { timeout: 3000 }); } catch (e) { await foto('ERROR-' + d + '-' + i); throw new Error('No se resolvio ' + d + '-' + i + ': ' + await pg.textContent('#j-ver')); }
      if (d === 0 && i === 1) await foto('10-reto-resuelto');
      await pg.click('#cr-ok');
    }
    await pg.waitForSelector('#fd-ok'); if (d === 0) await foto('11-fin-dia');
    if (d === 1) { // recarga a mitad de semana: el progreso debe conservarse
      await pg.reload(); await pg.waitForSelector('#in-seguir'); await pg.click('#in-seguir'); await pg.waitForSelector('#fd-ok');
    }
    await pg.click('#fd-ok');
  }
  await pg.waitForSelector('.rep-pct'); await foto('12-reporte');
  await pg.click('#rp-sello'); await pg.type('#cl-in', 'DOCENTE-2026'); await pg.click('#cl-form button[type=submit]');
  await pg.waitForSelector('.sello'); await pg.screenshot({ path: path.join(OUT, '13-reporte-sellado.png'), fullPage: true });
  const pct = await pg.textContent('.rep-pct');
  const puedeSeguir = !!(await pg.$('#rp-otra'));
  if (puedeSeguir) { await pg.click('#rp-otra'); await pg.waitForSelector('.empresa'); await foto('14-empresas-despues'); }
  // vista de telefono
  const tel = await br.newPage({ viewport: { width: 400, height: 860 }, deviceScaleFactor: 1 });
  tel.on('pageerror', e => errores.push('tel pageerror: ' + e.message));
  await tel.goto(url); await tel.waitForSelector('#in-form'); await tel.waitForTimeout(400); await tel.screenshot({ path: path.join(OUT, '20-tel-inicio.png') });
  await tel.type('#in-id', 'B777'); await tel.type('#in-nom', 'Ana'); await tel.type('#in-ape', 'Flores'); await tel.click('#in-form button');
  await tel.check('#nm-chk'); await tel.click('#nm-sig'); await tel.click('.empresa[data-esc="novatel"]'); await tel.click('#cf-si');
  await tel.waitForSelector('#ch-sig'); await tel.waitForTimeout(500); await tel.screenshot({ path: path.join(OUT, '21-tel-charla.png') });
  while (await tel.$('#ch-sig')) { await tel.click('#ch-sig'); await tel.waitForTimeout(15); }
  await tel.click('#j-sql'); await tel.keyboard.type('USE novatel;'); await tel.keyboard.press('Control+Enter');
  await tel.keyboard.type('SELECT * FROM planes;'); await tel.keyboard.press('Control+Enter'); await tel.waitForTimeout(200);
  await tel.screenshot({ path: path.join(OUT, '22-tel-juego.png'), fullPage: true });
  const ancho = await tel.evaluate(() => document.documentElement.scrollWidth);
  await tel.click('#b-desc'); await tel.click('#cf-si'); await tel.waitForTimeout(700); await tel.screenshot({ path: path.join(OUT, '23-tel-descanso.png') });
  console.log(JSON.stringify({ empresa: EMP, puntaje: pct, puedeCambiarDeEmpresa: puedeSeguir, anchoTelefono: ancho, errores: errores }, null, 1));
  await br.close(); srv.close();
  process.exit(errores.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e.message); process.exit(1); });

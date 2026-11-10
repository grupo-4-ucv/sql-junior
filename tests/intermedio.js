// Nivel intermedio en el navegador: candado, clave docente, recorrido completo de una empresa y recarga.
// Uso: node tests/intermedio.js [empresa] [carpeta_capturas]
// La clave docente se toma de la variable de entorno SJ_CLAVE.
const CLAVE = process.env.SJ_CLAVE || '';
if (!CLAVE) { console.error('Define SJ_CLAVE con la clave docente para ejecutar esta prueba.'); process.exit(1); }
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const RAIZ = path.join(__dirname, '..'), EMP = process.argv[2] || 'kallpa', OUT = process.argv[3] || path.join(RAIZ, 'tests', 'capturas');
fs.mkdirSync(OUT, { recursive: true });
const srv = http.createServer((q, r) => { const f = path.join(RAIZ, q.url === '/' ? '/index.html' : q.url.split('?')[0]); if (f.indexOf(path.join(RAIZ, 'privado')) === 0) { r.writeHead(403); r.end(); return; } fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html; charset=utf-8' }); r.end(d); }); });
(async () => {
  await new Promise(ok => srv.listen(0, ok));
  const br = await chromium.launch(), pg = await br.newPage({ viewport: { width: 1366, height: 768 } }), err = [], notas = [];
  pg.on('pageerror', e => err.push(e.message));
  const foto = n => pg.screenshot({ path: path.join(OUT, n + '.png') });
  await pg.goto('http://localhost:' + srv.address().port + '/'); await pg.waitForSelector('#in-form');
  await pg.type('#in-id', 'INTER01'); await pg.type('#in-nom', 'Camila'); await pg.type('#in-ape', 'Torres'); await pg.click('#in-form button');
  await pg.check('#nm-chk'); await pg.click('#nm-sig'); await pg.waitForSelector('.empresa[data-int]');
  notas.push('contenido legible antes de la clave: ' + await pg.evaluate(e => !!SJ.escenarios[e], EMP));
  notas.push('forzar inicio por consola: ' + await pg.evaluate(e => { try { SJ.Juego.nueva(e, 1); return 'INICIO (mal)'; } catch (x) { SJ.UI.S.g = null; SJ.UI.guardar(); return 'bloqueado'; } }, EMP));
  await pg.evaluate(() => { SJ.UI.S.hechas = { autoandes: { pct: 95 }, mercapixel: { pct: 88 }, novatel: { pct: 91 } }; SJ.UI.guardar(); SJ.UI.empresas(); });
  notas.push('con registro forzado, sin clave: ' + await pg.evaluate(e => !!SJ.escenarios[e], EMP));
  await pg.click('.empresa[data-int="' + EMP + '"]'); await pg.waitForSelector('#cl-in');
  await pg.type('#cl-in', 'otra-clave'); await pg.click('#cl-form button[type=submit]'); notas.push('clave incorrecta: ' + await pg.textContent('#cl-err'));
  await pg.fill('#cl-in', ''); await pg.type('#cl-in', CLAVE); await pg.click('#cl-form button[type=submit]');
  await pg.waitForFunction(e => !!SJ.escenarios[e], EMP); await pg.waitForTimeout(300); await foto('40-intermedio-disponible');
  await pg.click('.empresa[data-int="' + EMP + '"]'); await pg.click('#cf-si'); await pg.waitForSelector('#ch-sig'); await pg.waitForTimeout(700); await foto('41-intermedio-charla');
  const charla = async () => { while (await pg.$('#ch-sig')) { await pg.click('#ch-sig'); await pg.waitForTimeout(10); } };
  const corre = async q => { await pg.click('#j-sql'); await pg.keyboard.press('Control+A'); await pg.keyboard.press('Backspace'); await pg.keyboard.type(q); await pg.keyboard.press('Control+Enter'); };
  const info = await pg.evaluate(emp => { const esc = SJ.escenarios[emp], s = new SJ.Sim(SJ.SQL, esc, 'INTER01|' + emp + '|1'); return { db: esc.db, sols: esc.dias.map(d => d.retos.map(r => (r.sol ? r.sol(s.f) : [r.ref(s.f)]))) }; }, EMP);
  for (let d = 0; d < info.sols.length; d++) {
    await charla();
    if (d > 0) await corre('USE ' + info.db + ';');
    for (let i = 0; i < info.sols[d].length; i++) {
      await charla();
      for (const q of info.sols[d][i]) await corre(q);
      if (d === 7 && i === 2) await foto('42-intermedio-transaccion');
      await pg.click('#b-entregar');
      try { await pg.waitForSelector('#cr-ok', { timeout: 4000 }); } catch (e) { await foto('ERROR-int-' + d + '-' + i); throw new Error('No se resolvio ' + d + '-' + i + ': ' + await pg.textContent('#j-ver') + ' | ' + (await pg.$$eval('#j-out .err', n => n.slice(-2).map(x => x.textContent).join(' / ')))); }
      await pg.click('#cr-ok');
    }
    await pg.waitForSelector('#fd-ok');
    if (d === 4) { await pg.reload(); await pg.waitForSelector('#in-seguir'); await pg.click('#in-seguir'); await pg.waitForSelector('#fd-ok'); notas.push('recarga a mitad de camino: progreso conservado'); }
    await pg.click('#fd-ok');
  }
  await pg.waitForSelector('.rep-pct'); notas.push('puntaje: ' + await pg.textContent('.rep-pct'));
  await pg.screenshot({ path: path.join(OUT, '43-intermedio-reporte.png'), fullPage: true });
  console.log(notas.join('\n')); console.log('errores:', JSON.stringify(err));
  await br.close(); srv.close(); process.exit(err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e.message); process.exit(1); });

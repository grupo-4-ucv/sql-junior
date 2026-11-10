// Omitir, restaurar, clave incorrecta y repetir la semana en el navegador: node tests/omitir.js
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const RAIZ = path.join(__dirname, '..');
const srv = http.createServer((q, r) => { const f = path.join(RAIZ, q.url === '/' ? '/index.html' : q.url.split('?')[0]); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html; charset=utf-8' }); r.end(d); }); });
(async () => {
  await new Promise(ok => srv.listen(0, ok));
  const br = await chromium.launch(), pg = await br.newPage({ viewport: { width: 1280, height: 800 } }), err = [];
  pg.on('pageerror', e => err.push(e.message));
  await pg.goto('http://localhost:' + srv.address().port + '/'); await pg.waitForSelector('#in-form');
  await pg.type('#in-id', 'OMITE01'); await pg.type('#in-nom', 'Rosa'); await pg.type('#in-ape', 'Vega'); await pg.click('#in-form button');
  await pg.check('#nm-chk'); await pg.click('#nm-sig'); await pg.click('.empresa[data-esc="novatel"]'); await pg.click('#cf-si');
  const charla = async () => { while (await pg.$('#ch-sig')) { await pg.click('#ch-sig'); await pg.waitForTimeout(10); } };
  const corre = async q => { await pg.click('#j-sql'); await pg.keyboard.press('Control+A'); await pg.keyboard.press('Backspace'); await pg.keyboard.type(q); await pg.keyboard.press('Control+Enter'); };
  const ultima = async () => (await pg.$$eval('#j-out > *', n => n.slice(-3).map(x => x.textContent).join(' | ')));
  const notas = [];
  for (let d = 0; d < 5; d++) {
    const n = await pg.evaluate(k => SJ.escenarios.novatel.dias[k].retos.length, d);
    for (let i = 0; i < n; i++) {
      await charla();
      if (d === 2 && i === 0) {
        await corre('USE novatel;'); await corre("DELETE FROM recargas WHERE id_recarga < 50;"); notas.push('tras borrar: ' + await ultima());
        await corre('SELECT COUNT(*) FROM recargas;'); const a = await ultima();
        await pg.click('#b-rest'); await pg.click('#cf-si'); await corre('SELECT COUNT(*) FROM recargas;'); const b = await ultima();
        notas.push('conteo borrado: ' + a.replace(/\s+/g, ' ')); notas.push('conteo restaurado: ' + b.replace(/\s+/g, ' '));
        await pg.keyboard.type('x'.repeat(3)); await pg.evaluate(() => { const t = document.querySelector('#j-sql'); t.value += 'SELECT pegado FROM un_texto_largo_que_no_se_tipeo;'; t.dispatchEvent(new Event('input', { bubbles: true })); });
        notas.push('editor tras pegado simulado: "' + await pg.inputValue('#j-sql') + '"');
      }
      await pg.click('#b-omitir'); await pg.click('#cf-si'); await pg.waitForSelector('#cr-ok');
      if (d === 2 && i === 1) notas.push('solucion mostrada: ' + (await pg.textContent('.ventana .nota pre')).slice(0, 90));
      await pg.click('#cr-ok');
    }
    await pg.waitForSelector('#fd-ok'); await pg.click('#fd-ok');
  }
  await pg.waitForSelector('.rep-pct'); notas.push('puntaje: ' + await pg.textContent('.rep-pct'));
  await pg.click('#rp-sello'); await pg.type('#cl-in', 'clave-mala'); await pg.click('#cl-form button[type=submit]'); notas.push('clave mala: ' + await pg.textContent('#cl-err'));
  await pg.fill('#cl-in', ''); await pg.type('#cl-in', 'docente-2026'); await pg.click('#cl-form button[type=submit]'); await pg.waitForSelector('.sello');
  notas.push('puede elegir otra: ' + !!(await pg.$('#rp-otra')) + ', puede repetir: ' + !!(await pg.$('#rp-rep')));
  const f1 = await pg.evaluate(() => new SJ.Sim(SJ.SQL, SJ.escenarios.novatel, 'OMITE01|novatel|1').f.x1.dni);
  await pg.click('#rp-rep'); await pg.click('#cf-si'); await pg.waitForSelector('#ch-sig');
  const g = await pg.evaluate(() => { const g = SJ.UI.S.g; return { intento: g.intento, d: g.d, i: g.i, log: g.log.length }; });
  const f2 = await pg.evaluate(() => new SJ.Sim(SJ.SQL, SJ.escenarios.novatel, 'OMITE01|novatel|2').f.x1.dni);
  notas.push('nueva partida: ' + JSON.stringify(g) + ', datos distintos: ' + (f1 !== f2));
  console.log(notas.join('\n')); console.log('errores:', JSON.stringify(err));
  await br.close(); srv.close(); process.exit(err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e.message); process.exit(1); });

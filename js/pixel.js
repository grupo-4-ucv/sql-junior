/* SQL Junior - pixel art generado por codigo: portada, fachadas, oficina, retratos y taza de cafe. */
(function () {
  'use strict';
  const SJ = window.SJ, Pix = SJ.Pix = {};
  const TEMA = {
    autoandes: { pared: '#39425f', acento: '#ff7a45', edificio: '#55476b', letrero: 'AUTOANDES' },
    mercapixel: { pared: '#3d3463', acento: '#c77dff', edificio: '#3f5a7a', letrero: 'MERCAPIXEL' },
    novatel: { pared: '#2b4459', acento: '#35c9d6', edificio: '#4a4f73', letrero: 'NOVATEL' },
    kallpa: { pared: '#2f4a3f', acento: '#7ddc7a', edificio: '#3c5a52', letrero: 'KALLPA' },
    pachasalud: { pared: '#4a3550', acento: '#ff8fb1', edificio: '#5a4a6b', letrero: 'PACHASALUD' },
    rutanorte: { pared: '#4a4030', acento: '#f6c544', edificio: '#5b5140', letrero: 'RUTANORTE' }
  };
  const F = {
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011',
    H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111101101101', N: '111101101101101',
    O: '010101101101010', P: '110101110100100', Q: '010101101111011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111',
    V: '101101101101010', W: '101101101111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111',
    0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110', 4: '101101111001001', 5: '111100110001110',
    6: '011100110101010', 7: '111001010010010', 8: '010101010101010', 9: '010101011001110', '*': '000101010101000', ';': '000010000010100', '>': '100010001010100', '_': '000000000000111'
  };
  const lienzo = cv => { const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, cv.width, cv.height); return c; };
  const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const texto = (c, t, x, y, col) => {
    c.fillStyle = col;
    for (const ch of String(t).toUpperCase()) {
      const g = F[ch];
      if (g) for (let i = 0; i < 15; i++) if (g[i] === '1') c.fillRect(x + i % 3, y + Math.floor(i / 3), 1, 1);
      x += 4;
    }
  };
  const azar = semilla => { let h = 2166136261; for (let i = 0; i < semilla.length; i++) { h ^= semilla.charCodeAt(i); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; }; };
  const ciudad = (c, x0, x1, base, rnd, col, luz) => {
    for (let x = x0; x < x1;) {
      const w = 5 + Math.floor(rnd() * 7), h = 6 + Math.floor(rnd() * 16);
      R(c, x, base - h, Math.min(w, x1 - x), h, col);
      for (let yy = base - h + 2; yy < base - 2; yy += 3) for (let xx = x + 1; xx < Math.min(x + w, x1) - 1; xx += 2) if (rnd() < 0.45) R(c, xx, yy, 1, 1, luz);
      x += w + 1;
    }
  };
  const auto = (c, x, y, col) => { R(c, x + 4, y, 10, 4, col); R(c, x, y + 3, 20, 5, col); R(c, x + 6, y + 1, 3, 2, '#bfe6ff'); R(c, x + 10, y + 1, 3, 2, '#bfe6ff'); R(c, x + 3, y + 7, 4, 3, '#0a0d18'); R(c, x + 13, y + 7, 4, 3, '#0a0d18'); R(c, x + 19, y + 4, 1, 2, '#ffe9a0'); };
  const cajas = (c, x, y, col) => { R(c, x, y + 6, 9, 8, '#c9955a'); R(c, x + 10, y + 6, 9, 8, '#b98248'); R(c, x + 5, y - 2, 9, 8, '#d7a66b'); R(c, x + 4, y + 6, 1, 8, col); R(c, x + 14, y + 6, 1, 8, col); R(c, x + 9, y - 2, 1, 8, col); };
  const antena = (c, x, y, col, enc) => { R(c, x + 4, y, 1, 22, '#c9c9d6'); for (let k = 0; k < 5; k++) { R(c, x + 4 - k, y + 4 + k * 4, 1, 4, '#8e94b8'); R(c, x + 4 + k, y + 4 + k * 4, 1, 4, '#8e94b8'); R(c, x + 4 - k, y + 7 + k * 4, k * 2 + 1, 1, '#8e94b8'); } R(c, x + 3, y - 2, 3, 2, enc ? '#ff5d5d' : col); R(c, x, y + 2, 3, 1, col); R(c, x + 6, y + 2, 3, 1, col); };
  const monedas = (c, x, y) => { for (let k = 0; k < 4; k++) { R(c, x + 2, y + 16 - k * 4, 12, 3, '#f6c544'); R(c, x + 2, y + 18 - k * 4, 12, 1, '#c99a2e'); } R(c, x + 6, y + 1, 4, 2, '#ffe9a0'); };
  const cruz = (c, x, y, col) => { R(c, x + 2, y + 4, 16, 16, '#ffffff'); R(c, x + 8, y + 6, 4, 12, col); R(c, x + 4, y + 10, 12, 4, col); };
  const emblema = (c, id, x, y, t, enc) => { if (id === 'autoandes' || id === 'rutanorte') auto(c, x, y + 10, t.acento); else if (id === 'mercapixel') cajas(c, x, y + 6, t.acento); else if (id === 'kallpa') monedas(c, x + 3, y); else if (id === 'pachasalud') cruz(c, x, y - 2, '#ff5d7a'); else antena(c, x + 5, y - 2, t.acento, enc); };

  /* Portada: ciudad de noche y una consulta en la terminal. */
  Pix.portada = function (cv) {
    const c = lienzo(cv), rnd = azar('portada');
    ['#141a33', '#1b2447', '#25305c', '#34407a'].forEach((col, i) => R(c, 0, i * 7, 120, 7, col));
    for (let i = 0; i < 26; i++) R(c, Math.floor(rnd() * 120), Math.floor(rnd() * 20), 1, 1, '#e9edff');
    R(c, 96, 5, 6, 6, '#f6e7a8'); R(c, 97, 4, 4, 8, '#f6e7a8');
    ciudad(c, 0, 120, 31, rnd, '#0f1428', '#f6c544');
    R(c, 0, 31, 120, 13, '#0a0f1e'); R(c, 0, 31, 120, 1, '#43538a');
    texto(c, '> SELECT * FROM FUTURO;', 6, 35, '#62d68d'); R(c, 99, 35, 3, 5, '#62d68d');
  };

  /* Fachada de cada empresa para la pantalla de seleccion. */
  Pix.fachada = function (cv, id) {
    const c = lienzo(cv), t = TEMA[id], rnd = azar(id);
    R(c, 0, 0, 96, 30, '#8fd0ff'); R(c, 0, 30, 96, 14, '#bfe6ff'); R(c, 0, 44, 96, 12, '#4a4f63'); R(c, 0, 44, 96, 1, '#2b2f3f');
    R(c, 10, 5, 12, 3, '#fff'); R(c, 14, 3, 10, 3, '#fff'); R(c, 66, 8, 14, 3, '#fff');
    R(c, 20, 12, 46, 32, t.edificio); R(c, 18, 10, 50, 3, '#0a0d18');
    R(c, 22, 15, 42, 8, t.acento); texto(c, t.letrero, 23 + Math.max(0, Math.floor((40 - t.letrero.length * 4) / 2)), 17, '#1d1020');
    for (let y = 26; y < 38; y += 6) for (let x = 24; x < 62; x += 7) R(c, x, y, 4, 4, rnd() < 0.6 ? '#ffe9a0' : '#27324f');
    R(c, 40, 37, 7, 7, '#0a0d18'); R(c, 41, 38, 5, 6, '#bfe6ff');
    emblema(c, id, 70, 24, t, true);
  };

  /* Retrato de 16x16 generado a partir del nombre. */
  Pix.avatar = function (cv, nombre) {
    const c = lienzo(cv), rnd = azar('cara:' + nombre), pick = a => a[Math.floor(rnd() * a.length)];
    const fem = SJ.datos.NOM_F.indexOf(String(nombre).split(' ')[0]) >= 0;
    const piel = pick(['#f2c9a0', '#e3ad7c', '#cf9160', '#b0764a', '#8f5c38']), pelo = pick(['#1c1410', '#2b1c12', '#4a2f1a', '#6b4423', '#26262e', '#8b8b96']);
    const ropa = pick(['#e9edff', '#ff7a45', '#35c9d6', '#c77dff', '#62d68d', '#f6c544']), fondo = pick(['#2a3558', '#3d2f5c', '#234a4f', '#4a3040', '#33415e']);
    R(c, 0, 0, 16, 16, fondo);
    R(c, 4, 2, 8, 3, pelo); R(c, 3, 3, 10, 2, pelo);
    if (fem) { R(c, 3, 4, 1, 8, pelo); R(c, 12, 4, 1, 8, pelo); R(c, 2, 6, 1, 5, pelo); R(c, 13, 6, 1, 5, pelo); }
    R(c, 4, 4, 8, 7, piel); R(c, 5, 11, 6, 1, piel);
    if (!fem) { R(c, 3, 7, 1, 2, piel); R(c, 12, 7, 1, 2, piel); }
    const fl = Math.floor(rnd() * 3);
    if (fl === 0) R(c, 4, 4, 8, 1, pelo); else if (fl === 1) R(c, 4, 4, 5, 1, pelo); else { R(c, 4, 4, 2, 2, pelo); R(c, 10, 4, 2, 1, pelo); }
    R(c, 6, 7, 1, 1, '#16161d'); R(c, 9, 7, 1, 1, '#16161d');
    if (rnd() < 0.3) { R(c, 5, 6, 3, 1, '#16161d'); R(c, 8, 6, 3, 1, '#16161d'); R(c, 5, 8, 3, 1, '#16161d'); R(c, 8, 8, 3, 1, '#16161d'); R(c, 6, 7, 1, 1, '#dfe9ff'); R(c, 9, 7, 1, 1, '#dfe9ff'); }
    if (!fem && rnd() < 0.3) { R(c, 4, 9, 8, 2, pelo); R(c, 5, 11, 6, 1, pelo); }
    R(c, 7, 9, 2, 1, '#7d2f2f');
    R(c, 7, 12, 2, 1, piel); R(c, 3, 13, 10, 3, ropa); R(c, 2, 14, 12, 2, ropa); R(c, 7, 13, 2, 1, '#ffffff');
    if (rnd() < 0.5) R(c, 7, 14, 2, 2, '#16161d');
  };

  /* Oficina: la ventana cambia con el avance del dia y el calendario muestra la fecha. */
  Pix.escena = function (cv, id, d, avance, fecha) {
    const c = lienzo(cv), t = TEMA[id] || TEMA.autoandes, rnd = azar(id + d), p = Math.max(0, Math.min(1, avance || 0));
    R(c, 0, 0, 200, 58, t.pared); for (let x = 0; x < 200; x += 16) R(c, x, 0, 1, 58, 'rgba(0,0,0,.12)');
    R(c, 0, 56, 200, 2, '#0a0d18'); R(c, 0, 58, 200, 14, '#1b2136'); for (let x = 0; x < 200; x += 20) R(c, x, 58, 1, 14, '#141a2c');
    const cielo = p < 0.34 ? '#9ad8ff' : p < 0.67 ? '#7cc4f5' : '#ffb27a';
    R(c, 6, 6, 78, 40, '#0a0d18'); R(c, 8, 8, 74, 36, cielo);
    R(c, 14 + Math.floor(p * 54), 12 + Math.floor(Math.abs(p - 0.5) * 16), 6, 6, p < 0.67 ? '#fff3b0' : '#ff7a45');
    R(c, 20, 14, 12, 3, '#ffffff'); R(c, 24, 12, 10, 3, '#ffffff'); R(c, 56, 18, 14, 3, '#ffffff');
    ciudad(c, 8, 82, 38, rnd, '#34406e', '#ffe9a0');
    R(c, 8, 38, 74, 6, '#4a4f63'); emblema(c, id, 46, 14, t, d % 2 === 0);
    R(c, 44, 8, 2, 36, '#0a0d18'); R(c, 8, 25, 74, 2, '#0a0d18'); R(c, 4, 46, 82, 3, '#c9c9d6');
    R(c, 92, 8, 48, 11, t.acento); R(c, 92, 19, 48, 1, '#0a0d18'); texto(c, t.letrero, 94 + Math.max(0, Math.floor((44 - t.letrero.length * 4) / 2)), 11, '#1d1020');
    R(c, 150, 6, 22, 24, '#f1e7c9'); R(c, 150, 6, 22, 6, '#ff6f6f'); texto(c, fecha ? fecha.slice(8, 10) : String(16 + d), 157, 16, '#2b2334'); texto(c, fecha && fecha.slice(5, 7) === '12' ? 'DIC' : 'NOV', 155, 23, '#8a7a5a');
    R(c, 180, 8, 12, 12, '#0a0d18'); R(c, 181, 9, 10, 10, '#f1e7c9'); R(c, 186, 11, 1, 4, '#2b2334'); R(c, 186, 14, 3 - Math.floor(p * 2), 1, '#2b2334');
    R(c, 96, 44, 98, 4, '#8a5a34'); R(c, 96, 48, 98, 1, '#5d3b20'); R(c, 100, 48, 4, 10, '#5d3b20'); R(c, 186, 48, 4, 10, '#5d3b20');
    R(c, 124, 22, 40, 20, '#0a0d18'); R(c, 126, 24, 36, 15, '#0d2118'); R(c, 141, 42, 6, 2, '#0a0d18');
    const lineas = 1 + Math.floor(p * 4);
    for (let k = 0; k < lineas; k++) R(c, 128, 26 + k * 3, 8 + Math.floor(rnd() * 22), 1, k === lineas - 1 ? '#f6c544' : '#62d68d');
    R(c, 104, 41, 16, 3, '#f1e7c9'); R(c, 106, 39, 14, 2, '#e6d9b4');
    R(c, 172, 37, 7, 7, t.acento); R(c, 179, 39, 2, 3, t.acento); R(c, 174, 33 + (d % 2), 1, 2, '#e9edff'); R(c, 176, 34 - (d % 2), 1, 2, '#e9edff');
    R(c, 139, 48, 14, 12, '#2a3558'); R(c, 137, 60, 18, 2, '#0a0d18'); R(c, 142, 36, 8, 8, '#2b1c12'); R(c, 140, 44, 12, 6, '#e9edff');
    R(c, 86, 50, 9, 8, '#a8553a'); R(c, 88, 42, 2, 8, '#3f9d5d'); R(c, 85, 44, 3, 3, '#62d68d'); R(c, 91, 40, 3, 4, '#62d68d'); R(c, 89, 38, 2, 3, '#3f9d5d');
  };

  /* Candado dorado en (x, y), de 14 x 18 pixeles. */
  const candado = (c, x, y) => {
    R(c, x + 3, y, 8, 2, '#c9c9d6'); R(c, x + 1, y + 1, 3, 7, '#c9c9d6'); R(c, x + 10, y + 1, 3, 7, '#c9c9d6'); R(c, x + 2, y + 1, 1, 6, '#8e94b8');
    R(c, x - 1, y + 7, 16, 12, '#0a0d18'); R(c, x, y + 8, 14, 10, '#f6c544'); R(c, x, y + 8, 14, 2, '#ffe9a0'); R(c, x, y + 16, 14, 2, '#c99a2e');
    R(c, x + 6, y + 11, 2, 3, '#1d1020'); R(c, x + 5, y + 11, 4, 2, '#1d1020');
  };
  Pix.candado = function (cv) { const c = lienzo(cv); R(c, 0, 0, 32, 32, '#2a3558'); candado(c, 9, 5); };
  /* Fachada en gris con candado para las empresas del nivel intermedio. */
  Pix.bloqueada = function (cv, id) {
    const c = lienzo(cv), rnd = azar(id), nom = { kallpa: 'KALLPA', pachasalud: 'PACHASALUD', rutanorte: 'RUTANORTE' }[id] || '';
    R(c, 0, 0, 96, 44, '#3a4160'); R(c, 0, 44, 96, 12, '#2b2f3f');
    R(c, 14, 8, 68, 36, '#4a4f63'); R(c, 12, 6, 72, 3, '#0a0d18'); R(c, 16, 11, 64, 8, '#5d6380');
    texto(c, nom, 18 + Math.max(0, Math.floor((60 - nom.length * 4) / 2)), 13, '#9ea9d3');
    for (let y = 23; y < 40; y += 6) for (let x = 18; x < 78; x += 7) R(c, x, y, 4, 4, rnd() < 0.2 ? '#6b7088' : '#33384d');
    R(c, 0, 0, 96, 56, 'rgba(10,13,24,.35)');
    candado(c, 41, 18);
  };

  /* Taza de cafe para el descanso. */
  Pix.cafe = function (cv, cuadro) {
    const c = lienzo(cv), f = cuadro % 4;
    R(c, 4, 27, 24, 2, '#8e94b8'); R(c, 8, 14, 15, 13, '#f1e7c9'); R(c, 8, 25, 15, 2, '#cdbc8b'); R(c, 9, 14, 13, 2, '#4a2f1a');
    R(c, 23, 16, 3, 2, '#f1e7c9'); R(c, 25, 18, 2, 4, '#f1e7c9'); R(c, 23, 22, 3, 2, '#f1e7c9'); R(c, 12, 19, 7, 4, '#ff7a45');
    [[11, 0], [15, 2], [19, 1]].forEach((s, i) => { const y = 10 - ((f + s[1]) % 4) * 2; R(c, s[0] + ((f + i) % 2), y, 1, 2, '#e9edff'); R(c, s[0] + ((f + i + 1) % 2), y - 3, 1, 2, '#9ea9d3'); });
  };
})();

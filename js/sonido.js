/* SQL Junior - sonido estilo consola antigua, generado con Web Audio (sin archivos). */
(function () {
  'use strict';
  const SJ = window.SJ, Son = SJ.Son = {}, CLAVE = 'sqljunior_sonido';
  let ctx = null, master = null, cuenta = 0;
  let pref = { on: SJ.CFG.SONIDO_INICIAL !== false, vol: 0.6 };
  try { const p = JSON.parse(localStorage.getItem(CLAVE)); if (p && typeof p.on === 'boolean') pref = p; } catch (e) { /* sin almacenamiento */ }

  const audio = function () {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C(); master = ctx.createGain(); master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    master.gain.value = pref.vol;
    return ctx;
  };
  /* nota: frecuencia, inicio y duracion en segundos, forma de onda, volumen y frecuencia final opcional */
  const nota = function (c, f, t, d, tipo, v, f2) {
    const o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + t;
    o.type = tipo || 'square';
    o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
    g.gain.setValueAtTime(v || 0.12, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + d + 0.03);
  };
  const melodia = (c, notas, paso, tipo, v) => notas.forEach((f, i) => { if (f) nota(c, f, i * paso, paso * 0.95, tipo, v); });

  const SONIDOS = {
    click: c => nota(c, 660, 0, 0.03, 'square', 0.04),
    blip: c => nota(c, 480 + Math.random() * 120, 0, 0.035, 'square', 0.035),
    ok: c => { nota(c, 880, 0, 0.06, 'square', 0.08); nota(c, 1320, 0.06, 0.09, 'square', 0.08); },
    error: c => { nota(c, 196, 0, 0.12, 'sawtooth', 0.1); nota(c, 147, 0.12, 0.22, 'sawtooth', 0.1); },
    nueva: c => { nota(c, 988, 0, 0.09, 'triangle', 0.2); nota(c, 1319, 0.1, 0.18, 'triangle', 0.2); },
    resuelto: c => { melodia(c, [523, 659, 784, 1047], 0.08, 'square', 0.09); nota(c, 1047, 0.32, 0.3, 'triangle', 0.12); },
    pista: c => nota(c, 740, 0, 0.25, 'triangle', 0.15, 440),
    findia: c => melodia(c, [523, 659, 784, 659, 784, 1047, 0, 1047], 0.11, 'square', 0.08),
    aprobado: c => { melodia(c, [523, 523, 523, 0, 415, 466, 523, 0, 466, 523], 0.1, 'square', 0.09); nota(c, 1047, 1.0, 0.5, 'triangle', 0.12); },
    reprobado: c => melodia(c, [392, 370, 349, 330], 0.2, 'triangle', 0.12),
    candado: c => { nota(c, 120, 0, 0.07, 'square', 0.14); nota(c, 82, 0.08, 0.16, 'square', 0.14); },
    alarma: c => { for (let i = 0; i < 6; i++) nota(c, i % 2 ? 660 : 880, i * 0.16, 0.14, 'square', 0.1); }
  };

  Son.tocar = function (nombre) {
    if (!pref.on || !SONIDOS[nombre]) return;
    if (nombre === 'blip' && (cuenta++ % 2)) return;
    try { const c = audio(); if (c) SONIDOS[nombre](c); } catch (e) { /* el sonido nunca debe romper el juego */ }
  };
  Son.activo = () => pref.on;
  Son.boton = () => '<button class="btn sec mini" type="button" data-son>' + (pref.on ? 'Sonido: SI' : 'Sonido: NO') + '</button>';

  document.addEventListener('click', function (e) {
    const b = e.target.closest && e.target.closest('[data-son]');
    if (b) {
      pref.on = !pref.on;
      try { localStorage.setItem(CLAVE, JSON.stringify(pref)); } catch (x) { /* nada */ }
      document.querySelectorAll('[data-son]').forEach(x => { x.textContent = pref.on ? 'Sonido: SI' : 'Sonido: NO'; });
      Son.tocar('ok');
      return;
    }
    if (e.target.closest && e.target.closest('.btn')) Son.tocar('click');
  }, true);
})();

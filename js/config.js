/* SQL Junior - configuracion general. El docente puede ajustar estos valores. */
(function (root) {
  'use strict';
  var SJ = root.SJ = root.SJ || {};

  SJ.CFG = {
    VERSION: '1.0',
    CLAVE_GUARDADO: 'sqljunior_v1',
    APROBACION: 80,            // para cambiar de empresa el puntaje debe ser MAYOR a este valor
    PISTAS_POR_DIA: 2,
    DESCUENTO_PISTA: 10,       // puntos que resta cada pista al reto donde se usa
    DESCUENTO_FALLO: 5,        // puntos que resta cada entrega incorrecta
    MAX_DESCUENTO_FALLO: 20,
    PUNTOS_RESULTADO: 80,
    PUNTOS_PRACTICAS: 20,
    DESCANSO_SEGUNDOS: 15 * 60,
    // Llave del contenido intermedio, protegida con la clave docente. Se regenera con docente.html al cambiar la clave.
    LLAVE_INTERMEDIO: '4TVgy1xsm26+HuJ8oGQC6vYt6huq89B1ZDgSSki9zbINCOofwwHp+Lqn5HD9fBW36zwJT4oCJ+sSn0Ml',
    SONIDO_INICIAL: true,      // false: el sonido arranca apagado en cada computadora
    REQUIERE_CLAVE_DOCENTE: true,
    // Huella de la clave docente. Para cambiarla abre docente.html, genera la huella y pegala aqui.
    HUELLA_CLAVE_DOCENTE: 'ZX1123G8JD',
    SAL: 'sj-piad223-2026'
  };

  // Huella numerica (cyrb53) usada para la clave docente y el codigo de verificacion.
  SJ.huella = function (texto) {
    var h1 = 0xdeadbeef ^ 7, h2 = 0x41c6ce57 ^ 7, i, ch;
    for (i = 0; i < texto.length; i++) {
      ch = texto.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    var n = 4294967296 * (2097151 & h2) + (h1 >>> 0);
    return n.toString(36).toUpperCase();
  };

  SJ.huellaClave = function (clave) {
    return SJ.huella(SJ.CFG.SAL + '|' + String(clave).trim().toUpperCase());
  };

  // Codigo de verificacion del reporte: depende del alumno, la empresa, el intento, el puntaje y la fecha.
  SJ.codigoReporte = function (id, empresa, intento, puntaje, fecha) {
    var h = SJ.huella([SJ.CFG.SAL, String(id).trim().toUpperCase(), empresa, intento, puntaje, fecha].join('|'));
    h = ('00000000' + h).slice(-8);
    return h.slice(0, 4) + '-' + h.slice(4);
  };
})(typeof window !== 'undefined' ? window : global);

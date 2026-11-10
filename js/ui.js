/* SQL Junior - interfaz base: guardado, pantallas de inicio, ventanas, descanso e integridad. */
(function () {
  'use strict';
  const SJ = window.SJ, CFG = SJ.CFG;
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const UI = SJ.UI = { S: null, enDescanso: false, $: $, esc: esc };

  /* ---------- guardado ---------- */
  UI.cargar = function () {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(CFG.CLAVE_GUARDADO)); } catch (e) { s = null; }
    UI.S = s && s.v === 1 ? s : { v: 1, al: null, normas: false, hechas: {}, g: null };
  };
  UI.guardar = function () {
    try { localStorage.setItem(CFG.CLAVE_GUARDADO, JSON.stringify(UI.S)); } catch (e) { /* sin almacenamiento: se juega sin guardar */ }
  };

  /* ---------- piezas ---------- */
  UI.pinta = function (html) { const a = $('#app'); a.innerHTML = html; a.scrollTop = 0; };
  UI.ventana = function (html, ancha) {
    const c = $('#capa');
    c.innerHTML = '<div class="ventana px' + (ancha ? ' ancha' : '') + '" role="dialog" aria-modal="true">' + html + '</div>';
    c.hidden = false;
    const f = c.querySelector('[data-foco]') || c.querySelector('button, input');
    if (f) f.focus();
    return c.firstChild;
  };
  UI.cerrar = function () { const c = $('#capa'); c.hidden = true; c.innerHTML = ''; };
  UI.aviso = function (msg) {
    const d = document.createElement('div');
    d.className = 'aviso'; d.textContent = msg;
    $('#avisos').appendChild(d);
    setTimeout(function () { d.remove(); }, 3400);
  };
  UI.confirma = function (titulo, textoHtml, si, alAceptar, no) {
    const v = UI.ventana('<h2>' + esc(titulo) + '</h2><p>' + textoHtml + '</p><div class="fila"><button class="btn" id="cf-si" data-foco>' + esc(si) +
      '</button><button class="btn sec" id="cf-no">' + esc(no || 'Cancelar') + '</button></div>');
    $('#cf-si', v).onclick = function () { UI.cerrar(); alAceptar(); };
    $('#cf-no', v).onclick = UI.cerrar;
  };
  UI.tiempo = function (s) {
    s = Math.max(0, Math.round(s));
    const m = Math.floor(s / 60);
    return (m < 10 ? '0' : '') + m + ':' + ('0' + (s % 60)).slice(-2);
  };
  UI.pideClave = function (titulo, textoHtml, alAcertar) {
    if (!CFG.REQUIERE_CLAVE_DOCENTE) { alAcertar(); return; }
    const v = UI.ventana('<h2>' + esc(titulo) + '</h2><p>' + textoHtml + '</p><form id="cl-form" class="campo" autocomplete="off"><label class="etq" for="cl-in">Clave del docente</label>' +
      '<input id="cl-in" class="libre" type="password" autocomplete="off" data-foco><p class="error" id="cl-err"></p>' +
      '<div class="fila"><button class="btn" type="submit">Validar</button><button class="btn sec" type="button" id="cl-no">Cancelar</button></div></form>');
    $('#cl-no', v).onclick = UI.cerrar;
    $('#cl-form', v).onsubmit = function (e) {
      e.preventDefault();
      const cl = $('#cl-in', v).value;
      if (SJ.huellaClave(cl) === CFG.HUELLA_CLAVE_DOCENTE) { UI.cerrar(); alAcertar(cl); }
      else $('#cl-err', v).textContent = 'Clave incorrecta. Llama a tu docente.';
    };
  };

  /* ---------- inicio y registro ---------- */
  UI.inicio = function () {
    const S = UI.S, al = S.al;
    document.body.dataset.esc = S.g ? S.g.esc : '';
    const ficha = al
      ? '<div class="px form"><h2>Sesión guardada</h2><p>' + esc(al.nom) + ' ' + esc(al.ape) + ' &middot; ID ' + esc(al.id) + '</p>' +
        '<div class="fila"><button class="btn" id="in-seguir">Continuar</button><span class="sep"></span><button class="btn sec mini" id="in-borrar">Borrar progreso</button></div></div>'
      : '<form class="px form" id="in-form" autocomplete="off"><h2>Ficha de ingreso</h2>' +
        '<div class="campo"><label class="etq" for="in-id">ID de estudiante</label><input id="in-id" class="libre" maxlength="20" autocomplete="off" spellcheck="false"></div>' +
        '<div class="campo"><label class="etq" for="in-nom">Nombres</label><input id="in-nom" class="libre" maxlength="40" autocomplete="off" spellcheck="false"></div>' +
        '<div class="campo"><label class="etq" for="in-ape">Apellidos</label><input id="in-ape" class="libre" maxlength="40" autocomplete="off" spellcheck="false"></div>' +
        '<p class="error" id="in-err"></p><button class="btn" type="submit">Comenzar</button></form>';
    UI.pinta('<div class="centro"><div class="portada px"><canvas id="in-arte" width="120" height="44" style="width:min(100%,480px)"></canvas>' +
      '<h1>SQL JUNIOR</h1><p class="sub">Tu primera semana en el equipo de datos.<br>Cinco días, una base real y solicitudes que no esperan.</p>' + SJ.Son.boton() + '</div>' + ficha +
      '<p class="tenue" style="text-align:center">Simulador de MySQL para el curso de Bases de Datos. Se juega mejor en computadora, con teclado.</p></div>');
    if (SJ.Pix) SJ.Pix.portada($('#in-arte'));
    if (al) {
      $('#in-seguir').onclick = UI.ruta;
      $('#in-borrar').onclick = function () {
        UI.pideClave('Borrar progreso', 'Se eliminará todo el avance guardado en este navegador. Solo el docente puede autorizarlo.', function () {
          UI.S = { v: 1, al: null, normas: false, hechas: {}, g: null };
          UI.guardar(); UI.inicio();
        });
      };
      return;
    }
    $('#in-form').onsubmit = function (e) {
      e.preventDefault();
      const id = $('#in-id').value.trim(), nom = $('#in-nom').value.trim().replace(/\s+/g, ' '), ape = $('#in-ape').value.trim().replace(/\s+/g, ' ');
      const err = $('#in-err'), letras = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{2,}$/;
      if (!/^[A-Za-z0-9-]{3,20}$/.test(id)) { err.textContent = 'Escribe tu ID de estudiante (3 a 20 letras o números, sin espacios).'; return; }
      if (!letras.test(nom)) { err.textContent = 'Escribe tus nombres (solo letras).'; return; }
      if (!letras.test(ape)) { err.textContent = 'Escribe tus apellidos (solo letras).'; return; }
      S.al = { id: id.toUpperCase(), nom: nom, ape: ape };
      UI.guardar(); UI.ruta();
    };
  };

  UI.ruta = function () {
    const S = UI.S;
    if (!S.al) return UI.inicio();
    if (!S.normas) return UI.normas(true);
    if (!S.g) return UI.empresas();
    if (!SJ.escenarios[S.g.esc]) {
      const v = UI.ventana('<h2>Nivel intermedio protegido</h2><p>Tu partida en curso es del nivel intermedio. Para continuarla en este navegador, tu docente debe ingresar su clave.</p><div class="fila"><button class="btn" id="rt-ok" data-foco>Ingresar clave</button></div>');
      $('#rt-ok', v).onclick = function () { UI.pideClave('Continuar el nivel intermedio', 'La clave del docente abre el contenido del nivel intermedio.', function (cl) { SJ.Cripto.abrir(cl).then(ck => { S.llave = ck; UI.guardar(); SJ.Juego.abrir(); }).catch(() => UI.aviso('No se pudo abrir el nivel intermedio en este navegador.')); }); };
      return;
    }
    SJ.Juego.abrir();
  };

  /* ---------- normas del equipo ---------- */
  UI.normasHtml = function () {
    return '<ol>' + SJ.NORMAS.map(function (n) { return '<li>' + n + '</li>'; }).join('') + '</ol>';
  };
  UI.normas = function (primera) {
    if (!primera) {
      const v = UI.ventana('<h2>Normas del equipo</h2><div class="papel normas">' + UI.normasHtml() + '</div><div class="fila"><button class="btn" id="nm-ok" data-foco>Entendido</button></div>', true);
      $('#nm-ok', v).onclick = UI.cerrar;
      return;
    }
    UI.pinta('<div class="centro"><div class="px form"><h2>Antes de empezar: normas del equipo</h2>' +
      '<p>Hola, ' + esc(UI.S.al.nom.split(' ')[0]) + '. En este equipo todas las consultas siguen las mismas reglas. Se revisan en cada reto y valen ' + CFG.PUNTOS_PRACTICAS + ' de cada 100 puntos.</p></div>' +
      '<div class="papel normas">' + UI.normasHtml() + '</div>' +
      '<div class="px form"><label class="fila" for="nm-chk"><input type="checkbox" id="nm-chk" style="width:22px;height:22px"> <span>Leí las normas y las voy a aplicar.</span></label>' +
      '<button class="btn" id="nm-sig" disabled>Elegir empresa</button></div></div>');
    $('#nm-chk').onchange = function () { $('#nm-sig').disabled = !this.checked; };
    $('#nm-sig').onclick = function () { UI.S.normas = true; UI.guardar(); UI.ruta(); };
  };

  /* ---------- seleccion de empresa ---------- */
  UI.empresas = function () {
    const S = UI.S, ids = SJ.ORDEN_ESCENARIOS;
    document.body.dataset.esc = '';
    const libres = ids.filter(function (id) { return !S.hechas[id]; });
    const tarjetas = ids.map(function (id) {
      const e = SJ.escenarios[id], h = S.hechas[id];
      return '<button class="empresa px" data-esc="' + id + '"' + (h ? ' disabled' : '') + '><canvas width="96" height="56"></canvas><h2>' + esc(e.nombre) + '</h2>' +
        '<p>' + esc(e.resumen) + '</p><span class="chip">' + (h ? 'COMPLETADA <b>' + h.pct + '%</b>' : esc(e.rubro)) + '</span></button>';
    }).join('');
    const listo = SJ.ascensoListo(S), aprob = ids.filter(id => S.hechas[id]).length;
    const inter = SJ.INTERMEDIO.map(function (e) {
      const h = S.hechas[e.id], disp = listo && !!SJ.escenarios[e.id], cif = !!SJ.cifrados[e.id];
      return '<button class="empresa px' + (disp || h ? '' : ' bloqueada') + '" data-int="' + e.id + '"' + (h ? ' disabled' : '') + '><canvas width="96" height="56"></canvas><h2>' + esc(e.nombre) + '</h2>' +
        '<p class="etq">' + esc(e.puesto) + '</p><p>' + esc(e.resumen) + '</p><span class="chip">' + (h ? 'COMPLETADA <b>' + h.pct + '%</b>' : !listo ? 'BLOQUEADO' : disp ? 'DISPONIBLE: 50 SOLICITUDES' : cif ? 'REQUIERE CLAVE DOCENTE' : 'PRÓXIMAMENTE') + '</span></button>';
    }).join('');
    UI.pinta('<div class="centro" style="max-width:980px"><div class="px form"><div class="fila"><h2>' + (libres.length ? 'Elige dónde vas a trabajar' : 'Completaste las tres empresas') + '</h2><span class="sep"></span>' + SJ.Son.boton() + '</div>' +
      '<p>' + (libres.length ? 'Solo puedes elegir una empresa. Para pasar a otra debes terminar la semana, presentar tu reporte al docente y superar el ' + CFG.APROBACION + '%.'
        : 'Terminaste todas las simulaciones. Buen trabajo, ' + esc(S.al.nom.split(' ')[0]) + '.') + '</p></div><div class="empresas">' + tarjetas + '</div>' +
      '<div class="px form"><div class="fila"><h2 class="oro">Mejora de contrato: nivel intermedio</h2><span class="sep"></span><span class="chip">Empresas aprobadas <b>' + aprob + ' / 3</b></span></div>' +
      '<p>Aprueba las tres empresas para recibir la oferta de ascenso: un nuevo puesto, 50 solicitudes por empresa y comandos de nivel intermedio.</p></div>' +
      '<div class="empresas">' + inter + '</div></div>');
    document.querySelectorAll('.empresa[data-int]').forEach(function (b) {
      const e = SJ.INTERMEDIO.find(x => x.id === b.dataset.int);
      if (SJ.Pix) { if (b.classList.contains('bloqueada')) SJ.Pix.bloqueada(b.querySelector('canvas'), e.id); else SJ.Pix.fachada(b.querySelector('canvas'), e.id); }
      b.onclick = function () { UI.candado(e); };
    });
    document.querySelectorAll('.empresa[data-esc]').forEach(function (b) {
      const id = b.dataset.esc, e = SJ.escenarios[id];
      if (SJ.Pix) SJ.Pix.fachada(b.querySelector('canvas'), id);
      b.onclick = function () {
        UI.confirma('Contrato con ' + e.nombre, 'Vas a trabajar esta semana en <b>' + esc(e.nombre) + '</b> (' + esc(e.rubro) + '). No podrás cambiar de empresa hasta completar los cinco días. ¿Firmas?',
          'Firmar contrato', function () { SJ.Juego.nueva(id, 1); });
      };
    });
  };

  /* ---------- candado del nivel intermedio ---------- */
  UI.candado = function (e) {
    const S = UI.S;
    if (!SJ.ascensoListo(S)) {
      SJ.Son.tocar('candado');
      const lista = SJ.ORDEN_ESCENARIOS.map(function (id) {
        const h = S.hechas[id];
        return '<tr><td>' + esc(SJ.escenarios[id].nombre) + '</td><td class="' + (h ? 'txt-ok' : 'txt-mal') + '">' + (h ? 'Superada (' + h.pct + '%)' : 'Pendiente') + '</td></tr>';
      }).join('');
      const v = UI.ventana('<div class="dialogo"><canvas id="cd-arte" width="32" height="32" style="width:96px;height:96px"></canvas><div style="display:grid;gap:10px">' +
        '<h2>Reto intermedio bloqueado</h2><p>Para desarrollar el reto intermedio en <b>' + esc(e.nombre) + '</b>, debes superar los 3 casos del nivel junior: terminar la semana, presentar el reporte a tu docente y obtener más del ' + CFG.APROBACION + '% en cada empresa.</p></div></div>' +
        '<table class="dias"><thead><tr><th>Empresa junior</th><th>Estado</th></tr></thead><tbody>' + lista + '</tbody></table>' +
        '<div class="fila"><button class="btn" id="cd-ok" data-foco>Entendido</button></div>');
      if (SJ.Pix) SJ.Pix.candado($('#cd-arte', v));
      $('#cd-ok', v).onclick = UI.cerrar;
      return;
    }
    const E2 = SJ.escenarios[e.id];
    if (E2) {
      return UI.confirma('Mejora de contrato en ' + E2.nombre, 'Te ofrecen el puesto de <b>' + esc(E2.puesto) + '</b>: dos semanas de trabajo, ' + E2.dias.reduce((a, d) => a + d.retos.length, 0) +
        ' solicitudes, una sola pista por día y comandos de nivel intermedio. No podrás cambiar de empresa hasta terminar. ¿Firmas?', 'Firmar contrato', function () { SJ.Juego.nueva(e.id, 1); });
    }
    if (SJ.cifrados[e.id]) {
      if (!SJ.Cripto.disponible()) { UI.aviso('Este navegador no puede abrir el nivel intermedio. Usa una versión reciente de Chrome, Edge o Firefox.'); return; }
      return UI.pideClave('Habilitar el nivel intermedio', 'Superaste las tres empresas del nivel junior. Tu docente confirma el ascenso con su clave.', function (cl) {
        SJ.Cripto.abrir(cl).then(function (ck) { S.llave = ck; UI.guardar(); SJ.Son.tocar('aprobado'); UI.empresas(); })
          .catch(function () { UI.aviso('No se pudo abrir el nivel intermedio en este navegador.'); });
      });
    }
    SJ.Son.tocar('aprobado');
    const v = UI.ventana('<h2>Mejora de contrato aprobada</h2><p>Superaste las tres empresas del nivel junior. Tu ascenso a <b>' + esc(e.puesto) + '</b> en ' + esc(e.nombre) +
      ' está confirmado.</p><p>Las empresas de nivel intermedio se habilitarán en la próxima actualización del simulador. Avisa a tu docente que ya estás listo.</p>' +
      '<div class="fila"><button class="btn" id="cd-ok" data-foco>Entendido</button></div>');
    $('#cd-ok', v).onclick = UI.cerrar;
  };

  /* ---------- descanso de 15 minutos ---------- */
  let relojDescanso = null;
  UI.descanso = function () {
    const g = UI.S.g;
    if (!g) return;
    if (g.desc.fin > Date.now()) return UI.muestraDescanso();
    if (g.desc.usado) return UI.aviso('Ya usaste tu descanso de esta semana.');
    UI.confirma('Descanso', 'Tienes un único descanso de ' + Math.round(CFG.DESCANSO_SEGUNDOS / 60) + ' minutos en la semana. El reloj del día se detiene mientras dura. ¿Lo tomas ahora?', 'Tomar descanso', function () {
      g.desc = { usado: true, fin: Date.now() + CFG.DESCANSO_SEGUNDOS * 1000 };
      UI.guardar(); UI.muestraDescanso();
    });
  };
  UI.muestraDescanso = function () {
    const g = UI.S.g;
    UI.enDescanso = true;
    const v = UI.ventana('<div class="descanso" style="display:grid;gap:14px"><h2>Descanso</h2><canvas id="ds-arte" width="32" height="32" style="width:128px;height:128px"></canvas>' +
      '<div class="reloj" id="ds-reloj">15:00</div><p id="ds-txt">Estira las piernas y toma agua. La base de datos te espera tal como la dejaste.</p>' +
      '<button class="btn" id="ds-fin">Volver al trabajo</button></div>');
    let cuadro = 0, sonado = false;
    const pinta = function () {
      const resta = (g.desc.fin - Date.now()) / 1000, r = $('#ds-reloj');
      if (!r) { clearInterval(relojDescanso); return; }
      r.textContent = UI.tiempo(resta);
      if (SJ.Pix) SJ.Pix.cafe($('#ds-arte'), cuadro++);
      if (resta <= 0 && !sonado) { sonado = true; SJ.Son.tocar('alarma'); }
      if (resta <= 0) { $('#ds-txt').textContent = 'Se terminó el descanso. De vuelta a tu puesto.'; r.classList.add('txt-mal'); }
    };
    clearInterval(relojDescanso);
    relojDescanso = setInterval(pinta, 500); pinta();
    $('#ds-fin', v).onclick = function () {
      clearInterval(relojDescanso);
      g.desc.fin = 0; UI.enDescanso = false;
      UI.guardar(); UI.cerrar();
      if (SJ.Juego.alVolver) SJ.Juego.alVolver();
    };
  };

  /* ---------- integridad: sin copiar, sin pegar, registro de salidas ---------- */
  UI.cuenta = function (k, n) {
    const g = UI.S && UI.S.g;
    if (g && g.fase === 'trabajo' && !UI.enDescanso) g.integ[k] = (g.integ[k] || 0) + (n || 1);
  };
  const libre = function (t) { return !!(t && t.closest && t.closest('.libre')); };
  ['copy', 'cut'].forEach(function (ev) {
    document.addEventListener(ev, function (e) { if (libre(e.target)) return; e.preventDefault(); UI.cuenta('copia'); });
  });
  document.addEventListener('paste', function (e) {
    if (libre(e.target)) return;
    e.preventDefault(); UI.cuenta('pega'); UI.aviso('Pegado bloqueado: escribe tu consulta.');
  });
  document.addEventListener('beforeinput', function (e) {
    if (libre(e.target)) return;
    if (e.inputType === 'insertFromPaste' || e.inputType === 'insertFromDrop' || e.inputType === 'insertFromYank') { e.preventDefault(); UI.cuenta('pega'); }
  });
  document.addEventListener('drop', function (e) { e.preventDefault(); UI.cuenta('pega'); });
  document.addEventListener('dragover', function (e) { e.preventDefault(); });
  document.addEventListener('dragstart', function (e) { e.preventDefault(); });
  document.addEventListener('contextmenu', function (e) { if (!libre(e.target)) e.preventDefault(); });
  let fuera = 0;
  const sale = function () { if (!fuera) fuera = Date.now(); };
  const vuelve = function () {
    if (!fuera) return;
    const s = (Date.now() - fuera) / 1000;
    fuera = 0;
    if (s >= 3) { UI.cuenta('salidas'); UI.cuenta('fuera', Math.round(s)); UI.guardar(); }
  };
  window.addEventListener('blur', sale);
  window.addEventListener('focus', vuelve);
  document.addEventListener('visibilitychange', function () { if (document.hidden) sale(); else vuelve(); });

  /* ---------- arranque ---------- */
  UI.arrancar = function () {
    UI.cargar();
    if (!window.initSqlJs) { UI.pinta('<div class="centro"><div class="px form"><h2>Falta el motor SQL</h2><p>No se cargó el archivo vendor/sql-asm.js.</p></div></div>'); return; }
    window.initSqlJs().then(function (SQL) {
      SJ.SQL = SQL;
      const sigue = function () {
        UI.inicio();
        const g = UI.S.g;
        if (g && g.desc && g.desc.fin > Date.now() && SJ.escenarios[g.esc]) { SJ.Juego.abrir(); UI.muestraDescanso(); }
      };
      if (UI.S.llave && SJ.Cripto.disponible()) SJ.Cripto.cargar(UI.S.llave).then(sigue, sigue); else sigue();
    }).catch(function (e) {
      UI.pinta('<div class="centro"><div class="px form"><h2>No se pudo iniciar el motor SQL</h2><p>' + esc(e && e.message || e) + '</p></div></div>');
    });
  };
})();

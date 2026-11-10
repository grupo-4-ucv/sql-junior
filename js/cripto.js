/* SQL Junior - contenido cifrado del nivel intermedio (AES-GCM). La llave del contenido esta protegida con la clave docente. */
(function () {
  'use strict';
  const SJ = window.SJ, C = SJ.Cripto = {};
  SJ.cifrados = SJ.cifrados || {};
  const sub = () => (window.crypto && window.crypto.subtle) || null;
  const aBytes = s => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
  const aTexto = u => { let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return btoa(s); };
  const deClave = async function (clave) {
    const base = await sub().importKey('raw', new TextEncoder().encode(String(clave).trim().toUpperCase()), 'PBKDF2', false, ['deriveKey']);
    return sub().deriveKey({ name: 'PBKDF2', salt: new TextEncoder().encode(SJ.CFG.SAL + '|intermedio'), iterations: 120000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  };
  C.disponible = () => !!sub();
  /* Recupera la llave del contenido usando la clave docente. Falla si la clave no es la correcta. */
  C.desenvolver = async function (clave) {
    const w = aBytes(SJ.CFG.LLAVE_INTERMEDIO);
    return aTexto(new Uint8Array(await sub().decrypt({ name: 'AES-GCM', iv: w.subarray(0, 12) }, await deClave(clave), w.subarray(12))));
  };
  C.envolver = async function (llave, clave) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await sub().encrypt({ name: 'AES-GCM', iv: iv }, await deClave(clave), aBytes(llave)));
    const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12);
    return aTexto(out);
  };
  /* Descifra y registra las empresas intermedias que todavia no estan abiertas. */
  C.cargar = async function (llave) {
    const key = await sub().importKey('raw', aBytes(llave), 'AES-GCM', false, ['decrypt']);
    for (const id of Object.keys(SJ.cifrados)) {
      if (SJ.escenarios[id]) continue;
      const d = aBytes(SJ.cifrados[id]);
      const fuente = new TextDecoder().decode(await sub().decrypt({ name: 'AES-GCM', iv: d.subarray(0, 12) }, key, d.subarray(12)));
      (new Function(fuente))();
    }
    return llave;
  };
  C.abrir = async function (clave) { return C.cargar(await C.desenvolver(clave)); };
})();

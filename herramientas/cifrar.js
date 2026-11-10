// Cifra las empresas intermedias de la carpeta privado/ y actualiza js/config.js.
// Uso: node herramientas/cifrar.js CLAVE_DOCENTE
const fs = require('fs'), path = require('path'), { webcrypto } = require('crypto');
const RAIZ = path.join(__dirname, '..'), sub = webcrypto.subtle, clave = process.argv[2];
if (!clave) { console.error('Indica la clave docente: node herramientas/cifrar.js CLAVE'); process.exit(1); }
global.SJ = {}; require(path.join(RAIZ, 'js', 'config.js'));
const b64 = u => Buffer.from(u).toString('base64');
(async () => {
  const fLlave = path.join(RAIZ, 'privado', 'llave_contenido.txt');
  if (!fs.existsSync(fLlave)) fs.writeFileSync(fLlave, b64(webcrypto.getRandomValues(new Uint8Array(32))));
  const llave = Buffer.from(fs.readFileSync(fLlave, 'utf8').trim(), 'base64');
  const key = await sub.importKey('raw', llave, 'AES-GCM', false, ['encrypt']);
  for (const f of fs.readdirSync(path.join(RAIZ, 'privado')).filter(x => /^esc_.*\.js$/.test(x))) {
    const id = f.slice(4, -3), iv = webcrypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await sub.encrypt({ name: 'AES-GCM', iv }, key, fs.readFileSync(path.join(RAIZ, 'privado', f))));
    fs.writeFileSync(path.join(RAIZ, 'js', 'int_' + id + '.js'), "/* SQL Junior - empresa intermedia cifrada. Se abre con la clave docente. */\n(function (r) { var SJ = r.SJ = r.SJ || {}; SJ.cifrados = SJ.cifrados || {}; SJ.cifrados['" + id + "'] = '" + b64(Buffer.concat([iv, ct])) + "'; })(window);\n");
    console.log('cifrado', id, ct.length, 'bytes');
  }
  const base = await sub.importKey('raw', new TextEncoder().encode(clave.trim().toUpperCase()), 'PBKDF2', false, ['deriveKey']);
  const kc = await sub.deriveKey({ name: 'PBKDF2', salt: new TextEncoder().encode(SJ.CFG.SAL + '|intermedio'), iterations: 120000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const iv = webcrypto.getRandomValues(new Uint8Array(12)), env = new Uint8Array(await sub.encrypt({ name: 'AES-GCM', iv }, kc, llave));
  const cfg = path.join(RAIZ, 'js', 'config.js');
  let s = fs.readFileSync(cfg, 'utf8');
  s = s.replace(/LLAVE_INTERMEDIO: '[^']*'/, "LLAVE_INTERMEDIO: '" + b64(Buffer.concat([iv, env])) + "'").replace(/HUELLA_CLAVE_DOCENTE: '[^']*'/, "HUELLA_CLAVE_DOCENTE: '" + SJ.huellaClave(clave) + "'");
  fs.writeFileSync(cfg, s);
  console.log('config.js actualizado para la clave indicada');
})();

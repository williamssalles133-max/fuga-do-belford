// Recorde só no aparelho.
// Ponte Kotlin (SharedPreferences) é a fonte da verdade no APK.
// localStorage cobre o teste no navegador e o caso de o bridge ainda não existir.
// file:// às vezes bloqueia localStorage — por isso o try/catch.

const KEY = 'fuga.recorde';

function readLocal() {
  try {
    const raw = window.localStorage && window.localStorage.getItem(KEY);
    const n = parseInt(raw || '0', 10);
    return Number.isFinite(n) ? n : 0;
  } catch (err) {
    return 0;
  }
}

function writeLocal(value) {
  try {
    if (window.localStorage) window.localStorage.setItem(KEY, String(value));
  } catch (err) {
    // WebView em file:// pode recusar. O bridge nativo ainda grava.
  }
}

function bridge() {
  const b = window.AndroidScore;
  if (!b) return null;
  return b;
}

export function loadBest() {
  const local = readLocal();
  let native = 0;
  try {
    const b = bridge();
    if (b && typeof b.getHighScore === 'function') native = b.getHighScore() | 0;
  } catch (err) {
    native = 0;
  }
  return Math.max(local, native, 0);
}

export function saveBest(value) {
  const v = Math.max(0, value | 0);
  writeLocal(v);
  try {
    const b = bridge();
    if (b && typeof b.setHighScore === 'function') b.setHighScore(v);
  } catch (err) {
    // ignora — local já foi tentado
  }
}

export function commit(score) {
  const cur = loadBest();
  const next = Math.max(cur, score | 0);
  if (next > cur) saveBest(next);
  return next;
}

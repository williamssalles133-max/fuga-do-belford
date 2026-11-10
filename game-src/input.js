// Swipe muda faixa / pula. Toque nas laterais também muda faixa; centro pula.
// Teclado existe pra testar no desktop (setas, A D, espaço).

const SWIPE = 36;
const TAP = 22;

export function attachInput(target, handlers) {
  let startX = 0;
  let startY = 0;
  let tracking = false;
  let lastTouch = 0;

  function can() {
    return handlers.canPlay ? handlers.canPlay() : true;
  }

  function finish(x, y) {
    if (!tracking) return;
    tracking = false;
    if (!can()) return;
    const dx = x - startX;
    const dy = y - startY;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    if (adx < TAP && ady < TAP) {
      const w = window.innerWidth || 1;
      const nx = x / w;
      if (nx < 0.34) handlers.lane(-1);
      else if (nx > 0.66) handlers.lane(1);
      else handlers.jump();
      return;
    }

    if (adx > ady && adx > SWIPE) {
      handlers.lane(dx > 0 ? 1 : -1);
      return;
    }

    if (dy < -SWIPE && ady > adx) handlers.jump();
  }

  target.addEventListener('touchstart', (e) => {
    if (e.target.closest && e.target.closest('button')) return;
    const t = e.changedTouches[0];
    startX = t.clientX;
    startY = t.clientY;
    tracking = true;
    lastTouch = performance.now();
  }, { passive: true });

  target.addEventListener('touchend', (e) => {
    if (e.target.closest && e.target.closest('button')) return;
    const t = e.changedTouches[0];
    lastTouch = performance.now();
    finish(t.clientX, t.clientY);
  }, { passive: true });

  target.addEventListener('touchcancel', () => {
    tracking = false;
  }, { passive: true });

  // Impede o WebView de rolar a página e "puxar" o jogo.
  target.addEventListener('touchmove', (e) => {
    if (e.cancelable) e.preventDefault();
  }, { passive: false });

  target.addEventListener('mousedown', (e) => {
    if (performance.now() - lastTouch < 600) return;
    if (e.target.closest && e.target.closest('button')) return;
    startX = e.clientX;
    startY = e.clientY;
    tracking = true;
  });

  window.addEventListener('mouseup', (e) => {
    if (performance.now() - lastTouch < 600) {
      tracking = false;
      return;
    }
    finish(e.clientX, e.clientY);
  });

  window.addEventListener('keydown', (e) => {
    if (!can()) return;
    if (e.repeat) return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      handlers.lane(-1);
      e.preventDefault();
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      handlers.lane(1);
      e.preventDefault();
    } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
      handlers.jump();
      e.preventDefault();
    }
  });
}

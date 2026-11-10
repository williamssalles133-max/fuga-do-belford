// Trava a regra de ouro: sempre dá pra sobreviver, e o buraco cabe no pulo.
import assert from 'node:assert/strict';
import {
  pickPattern,
  isSurvivable,
  holeIsJumpable,
  jumpAirTime,
  speedFor,
  holeLength,
  spawnInterval,
} from '../game-src/logic.js';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const air = jumpAirTime();
assert.ok(air > 0.45 && air < 0.8, `janela de pulo estranha: ${air}`);

for (let i = 0; i <= 20; i++) {
  const d = i / 20;
  assert.equal(holeIsJumpable(d), true, `buraco impossível em d=${d}`);
  const speed = speedFor(d);
  assert.ok(speed >= 14 && speed <= 32.01);
  const gap = spawnInterval(d, speed);
  assert.ok(gap >= 0.9, `intervalo curto demais: ${gap}`);
  assert.ok(holeLength(d) > 2 && holeLength(d) < 10);
}

for (let seed = 1; seed <= 40; seed++) {
  const rng = mulberry32(seed);
  for (let n = 0; n < 80; n++) {
    const d = rng();
    const pattern = pickPattern(rng, d);
    assert.equal(isSurvivable(pattern), true, JSON.stringify(pattern));
    const solids = pattern.filter((p) => p.type !== 'buraco');
    assert.ok(solids.length < 3);
  }
}

console.log('logic ok', { air: air.toFixed(3) });

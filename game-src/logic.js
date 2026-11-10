// Regras puras (sem Three, sem DOM) para o spawn continuar justo
// e para a gente testar a curva de dificuldade no Node.

import {
  BASE_SPEED,
  MAX_SPEED,
  JUMP_HEIGHT,
  JUMP_DURATION,
  JUMP_CLEAR_Y,
} from './config.js';

const TYPES = new Set(['moto', 'onibus', 'buraco']);

export function difficultyFromDistance(distance) {
  return Math.min(1, 1 - Math.exp(-Math.max(0, distance) / 720));
}

export function speedFor(difficulty) {
  const d = clamp01(difficulty);
  return BASE_SPEED + (MAX_SPEED - BASE_SPEED) * Math.pow(d, 0.88);
}

export function holeLength(difficulty) {
  return 3.15 + clamp01(difficulty) * 5.1;
}

// Segundos com o pé acima de JUMP_CLEAR_Y num pulo em seno.
export function jumpAirTime() {
  const s = JUMP_CLEAR_Y / JUMP_HEIGHT;
  const angle = Math.asin(Math.min(1, Math.max(0, s)));
  const span = Math.PI - 2 * angle;
  return (span / Math.PI) * JUMP_DURATION;
}

// Buraco sempre mais curto que a janela de pulo, com folga pra errar o tempo.
export function holeIsJumpable(difficulty) {
  const speed = speedFor(difficulty);
  const air = jumpAirTime();
  return holeLength(difficulty) < speed * air * 0.7;
}

export function spawnInterval(difficulty, speed) {
  const d = clamp01(difficulty);
  const timeGap = Math.max(0.95, 1.7 - d * 0.72);
  const minTime = 18 / Math.max(speed, 1);
  return Math.max(timeGap, minTime);
}

export function pickType(rng, difficulty) {
  const x = rng();
  const pBus = 0.16 + clamp01(difficulty) * 0.36;
  const pMoto = 0.36;
  if (x < pBus) return 'onibus';
  if (x < pBus + pMoto) return 'moto';
  return 'buraco';
}

/**
 * Uma "fileira" de obstáculos. Nunca fecha as 3 faixas com algo que não dá pra pular.
 * Raramente esburaca as 3 — aí o pulo salva, independente da faixa.
 */
export function pickPattern(rng, difficulty) {
  const lanes = shuffle([0, 1, 2], rng);
  const roll = rng();

  if (roll > 0.93) {
    return [0, 1, 2].map((lane) => ({ lane, type: 'buraco' }));
  }

  const pattern = [];
  const count = roll < 0.5 ? 1 : 2;
  for (let i = 0; i < count; i++) {
    const type = roll >= 0.82 && i === 0 ? 'buraco' : pickType(rng, difficulty);
    pattern.push({ lane: lanes[i], type });
  }

  if (!isSurvivable(pattern)) pattern[0].type = 'buraco';
  return pattern;
}

export function isSurvivable(pattern) {
  if (!pattern || pattern.length === 0 || pattern.length > 3) return false;
  const seen = new Set();
  const solid = new Set();
  for (const item of pattern) {
    if (!item || !TYPES.has(item.type)) return false;
    if (item.lane !== 0 && item.lane !== 1 && item.lane !== 2) return false;
    if (seen.has(item.lane)) return false;
    seen.add(item.lane);
    if (item.type !== 'buraco') solid.add(item.lane);
  }
  return solid.size < 3;
}

export function fluxoLabel(difficulty) {
  if (difficulty < 0.25) return 'de boa';
  if (difficulty < 0.5) return 'esquentou';
  if (difficulty < 0.75) return 'lotou';
  return 'caos';
}

function shuffle(list, rng) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

// Fuga do Belford — runner 3D offline.
// Loop: menu -> contagem -> corre -> colisão -> game over -> de novo.
// Pontos de extensão no window.Fuga (cor do moletom, recorde). Sem rede.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import {
  VERSION,
  LANE_X,
  BASE_SPEED,
  JUMP_HEIGHT,
  JUMP_DURATION,
  SPAWN_AHEAD,
  SCORE_STEP,
  NEAR_MISS_BONUS,
} from './config.js';
import {
  difficultyFromDistance,
  speedFor,
  spawnInterval,
  pickPattern,
  fluxoLabel,
} from './logic.js';
import * as audio from './audio.js';
import { loadBest, commit } from './storage.js';
import { attachInput } from './input.js';
import { createWorld } from './world.js';
import { createPlayer } from './player.js';
import { createTraffic } from './obstacles.js';
import { createSky } from './sky.js';
import { createRain, createBurst } from './fx.js';

const DEATH = {
  moto: 'A moto não freou',
  onibus: 'O ônibus lotado te engoliu',
  buraco: 'O buraco mordeu',
};

const $ = (id) => document.getElementById(id);

const ui = {
  loading: $('screen-loading'),
  loadMsg: $('load-msg'),
  menu: $('screen-menu'),
  menuBest: $('menu-best'),
  over: $('screen-over'),
  death: $('death-reason'),
  overScore: $('over-score'),
  overBest: $('over-best'),
  newRecord: $('new-record'),
  hud: $('hud'),
  score: $('score'),
  fluxo: $('fluxo'),
  hudBest: $('hud-best'),
  hint: $('hint'),
  countdown: $('countdown'),
  callout: $('callout'),
  flash: $('flash'),
};

const debug = /(?:\?|&)debug=1(?:&|$)/.test(location.search);

let state = 'boot';
let paused = false;
let best = 0;
let distance = 0;
let bonus = 0;
let speed = BASE_SPEED;
let difficulty = 0;
let targetLane = 1;
let playerX = LANE_X[1];
let jumping = false;
let jumpT = 0;
let jumpY = 0;
let spawnTimer = 0;
let arm = 0;
let nextMark = SCORE_STEP;
let dyingT = 0;
let countStep = 0;
let countT = 0;
let pending = null;
let shake = 0;
let camBlend = 1;
let roll = 0;
let prCap = 1.6;
let qualityDropped = false;
let fpsFrames = 0;
let fpsAccum = 0;
let useComposer = true;
let composerFailed = false;
let fluxoText = '';
let hintTimer = 0;

let renderer;
let composer;
let bloom;
let scene;
let camera;
let world;
let player;
let traffic;
let sky;
let rain;
let burst;
let clockLast = 0;

const camDesired = new THREE.Vector3();
const lookTarget = new THREE.Vector3();

function setLoad(text) {
  if (ui.loadMsg) ui.loadMsg.textContent = text;
}

function show(el) {
  if (el) el.classList.remove('hidden');
}

function hide(el) {
  if (el) el.classList.add('hidden');
}

function meters(n) {
  return Math.max(0, Math.floor(n)).toLocaleString('pt-BR') + ' m';
}

function scoreNow() {
  return Math.floor(distance + bonus);
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function boot() {
  best = loadBest();
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([
    fontsReady,
    new Promise((resolve) => setTimeout(resolve, 1200)),
  ]).then(() => {
    setLoad('Montando a avenida…');
    return nextFrame();
  }).then(() => {
    initThree();
    setLoad('Acendendo o neon…');
    return nextFrame();
  }).then(() => {
    showMenu();
    clockLast = performance.now();
    requestAnimationFrame(loop);
  }).catch((err) => {
    console.error(err);
    setLoad('Não rolou abrir o 3D. Atualiza o Android System WebView.');
  });
}

function initThree() {
  const canvas = $('gl');
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: 'high-performance',
    alpha: false,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setClearColor(0x140c18, 1);

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x160e1c, 0.0175);

  camera = new THREE.PerspectiveCamera(76, 9 / 16, 0.1, 320);
  camera.position.set(0, 5, 8);

  scene.add(new THREE.HemisphereLight(0x7d62b0, 0x3a2414, 1.45));
  scene.add(new THREE.AmbientLight(0x2c2140, 0.5));
  const moon = new THREE.DirectionalLight(0xcdd6ff, 2.6);
  moon.position.set(-14, 22, 16);
  scene.add(moon);

  try {
    scene.environment = makeEnvironment(renderer);
  } catch (err) {
    console.warn('Ambiente PBR indisponível', err);
  }

  const deck = new THREE.Mesh(
    new THREE.CircleGeometry(500, 8),
    new THREE.MeshBasicMaterial({ color: 0x100c14 })
  );
  deck.rotation.x = -Math.PI / 2;
  deck.position.y = -0.45;
  scene.add(deck);

  sky = createSky();
  scene.add(sky);

  world = createWorld();
  scene.add(world.root);

  player = createPlayer();
  scene.add(player.root);
  scene.add(player.shadow);

  traffic = createTraffic(world.root);

  rain = createRain(260);
  camera.add(rain.points);

  burst = createBurst();
  scene.add(burst.group);

  resize();
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.52, 0.4, 0.82);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  window.addEventListener('resize', resize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    setLoad('A GPU piscou. Reabre o jogo.');
    show(ui.loading);
  }, false);
}

function makeEnvironment(gl) {
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(
    new THREE.SphereGeometry(14, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x160818, side: THREE.BackSide })
  ));
  const cols = [0xff2d6a, 0x19e6ff, 0xffb000, 0x7c4dff, 0xffe14a, 0xff6a2c];
  for (let i = 0; i < cols.length; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: cols[i] });
    mat.color.multiplyScalar(5.5);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(7, 2.6), mat);
    const a = (i / cols.length) * Math.PI * 2;
    plane.position.set(Math.cos(a) * 7, (i % 2) * 2.2 - 0.4, Math.sin(a) * 7);
    plane.lookAt(0, 1, 0);
    envScene.add(plane);
  }
  const pmrem = new THREE.PMREMGenerator(gl);
  const tex = pmrem.fromScene(envScene, 0.04).texture;
  pmrem.dispose();
  return tex;
}

function resize() {
  if (!renderer || !camera) return;
  const w = Math.max(1, window.innerWidth || 1);
  const h = Math.max(1, window.innerHeight || 1);
  const dpr = Math.min(window.devicePixelRatio || 1, prCap);
  const pr = Math.max(0.7, Math.min(dpr, 900 / w));
  renderer.setPixelRatio(pr);
  renderer.setSize(w, h, false);
  if (composer) {
    composer.setPixelRatio(pr);
    composer.setSize(w, h);
  }
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function showMenu() {
  state = 'menu';
  jumping = false;
  jumpY = 0;
  if (traffic) traffic.clear();
  hide(ui.hud);
  hide(ui.over);
  hide(ui.countdown);
  hide(ui.hint);
  hide(ui.loading);
  show(ui.menu);
  ui.menuBest.textContent = meters(best);
}

function beginRun() {
  if (state === 'countdown' || state === 'playing' || state === 'dying') return;
  audio.ensure();
  traffic.clear();
  distance = 0;
  bonus = 0;
  speed = BASE_SPEED;
  difficulty = 0;
  spawnTimer = 0;
  arm = 1.15;
  nextMark = SCORE_STEP;
  jumping = false;
  jumpT = 0;
  jumpY = 0;
  dyingT = 0;
  countStep = 0;
  countT = 0;
  hintTimer = 0;
  fluxoText = '';
  targetLane = 1;
  playerX = LANE_X[1];
  state = 'countdown';
  hide(ui.menu);
  hide(ui.over);
  hide(ui.loading);
  hide(ui.hud);
  hide(ui.hint);
  show(ui.countdown);
  ui.countdown.textContent = '3';
  audio.tick();
}

function die(type) {
  if (state !== 'playing') return;
  state = 'dying';
  dyingT = 0;
  const score = scoreNow();
  const prev = best;
  const record = commit(score);
  best = record;
  const isNew = score > prev;
  pending = { score, record, isNew, type: type || 'moto' };
  if (isNew && window.Fuga && typeof window.Fuga.onRecord === 'function') {
    try { window.Fuga.onRecord(score); } catch (err) { /* hook externo */ }
  }
  audio.crash();
  burst.trigger(player.root.position);
  ui.flash.classList.remove('on');
  void ui.flash.offsetWidth;
  ui.flash.classList.add('on');
  shake = 1;
}

function openGameOver() {
  state = 'over';
  hide(ui.hud);
  hide(ui.countdown);
  hide(ui.hint);
  show(ui.over);
  const result = pending || { score: scoreNow(), record: best, isNew: false, type: 'moto' };
  ui.death.textContent = DEATH[result.type] || 'A rua venceu';
  ui.overScore.textContent = meters(result.score);
  ui.overBest.textContent = meters(result.record);
  if (result.isNew && result.score > 0) show(ui.newRecord);
  else hide(ui.newRecord);
  ui.menuBest.textContent = meters(best);
}

function hideHint() {
  hide(ui.hint);
}

function onLane(dir) {
  const next = targetLane + dir;
  if (next < 0 || next > 2) return;
  if (next === targetLane) return;
  targetLane = next;
  audio.lane();
  if (state === 'playing') hideHint();
}

function onJump() {
  if (jumping) return;
  jumping = true;
  jumpT = 0;
  audio.jump();
  if (state === 'playing') hideHint();
}

function updateHud() {
  const label = fluxoLabel(difficulty);
  ui.score.textContent = meters(scoreNow());
  ui.hudBest.textContent = 'recorde ' + meters(Math.max(best, scoreNow()));
  if (label !== fluxoText) {
    fluxoText = label;
    ui.fluxo.textContent = label;
  }
}

function callout(text) {
  ui.callout.textContent = text;
  ui.callout.classList.remove('show');
  void ui.callout.offsetWidth;
  ui.callout.classList.add('show');
}

function update(dt, realDt) {
  let simSpeed = 0;

  if (state === 'menu') simSpeed = 7;
  else if (state === 'countdown') {
    simSpeed = BASE_SPEED * 0.75;
    countT += realDt;
    if (countT >= 0.55) {
      countT = 0;
      countStep += 1;
      const labels = ['3', '2', '1', 'VAI'];
      if (countStep >= labels.length) {
        state = 'playing';
        hide(ui.countdown);
        show(ui.hud);
        show(ui.hint);
        arm = 0.4;
        updateHud();
      } else {
        ui.countdown.textContent = labels[countStep];
        if (labels[countStep] === 'VAI') audio.go();
        else audio.tick();
      }
    }
  } else if (state === 'playing') {
    difficulty = difficultyFromDistance(distance);
    const target = speedFor(difficulty);
    speed += (target - speed) * Math.min(1, dt * 1.4);
    simSpeed = speed;
    distance += simSpeed * dt;
    if (distance >= nextMark) {
      nextMark += SCORE_STEP;
      audio.milestone();
      ui.score.classList.remove('pop');
      void ui.score.offsetWidth;
      ui.score.classList.add('pop');
    }
    arm -= dt;
    if (arm <= 0) {
      spawnTimer += dt;
      const interval = spawnInterval(difficulty, simSpeed);
      if (spawnTimer >= interval) {
        spawnTimer = 0;
        const pattern = pickPattern(Math.random, difficulty);
        const scroll = world.root.position.z;
        for (let i = 0; i < pattern.length; i++) {
          traffic.spawn(pattern[i].type, pattern[i].lane, -SPAWN_AHEAD, scroll, difficulty);
        }
      }
    }
    hintTimer += dt;
    if (hintTimer > 4.2) hideHint();
    updateHud();
  } else if (state === 'dying') {
    dyingT += realDt;
    const fade = Math.max(0, 1 - dyingT / 0.5);
    simSpeed = speed * fade;
    if (dyingT > 0.72) openGameOver();
  }

  const targetX = LANE_X[targetLane];
  const prevX = playerX;
  playerX += (targetX - playerX) * (1 - Math.exp(-14 * dt));
  const lateral = (playerX - prevX) / Math.max(dt, 0.0001);

  if (jumping) {
    jumpT += dt;
    const k = jumpT / JUMP_DURATION;
    if (k >= 1) {
      jumping = false;
      jumpT = 0;
      jumpY = 0;
    } else {
      jumpY = Math.sin(k * Math.PI) * JUMP_HEIGHT;
    }
  }

  player.root.position.x = playerX;
  player.root.position.y = jumpY;
  player.root.position.z = 0;
  player.update(dt, simSpeed, jumping, lateral);

  world.root.position.z += simSpeed * dt;
  world.recycle(world.root.position.z);
  world.update(performance.now() * 0.001);

  if (state === 'playing') {
    traffic.update(dt, world.root.position.z, simSpeed, playerX, jumpY, die, () => {
      bonus += NEAR_MISS_BONUS;
      audio.near();
      callout('QUASE!');
    });
  } else if (state === 'dying') {
    traffic.update(dt, world.root.position.z, simSpeed, playerX, jumpY, () => {}, () => {});
  }

  rain.update(dt);
  burst.update(dt);
  updateCamera(dt, simSpeed);
}

function updateCamera(dt, simSpeed) {
  const menu = state === 'menu' ? 1 : 0;
  camBlend += (menu - camBlend) * (1 - Math.exp(-3.2 * dt));
  const y = lerp(6.85, 4.05, camBlend);
  const z = lerp(11.2, 7.4, camBlend);
  const lookZ = lerp(-16, -6, camBlend);
  const follow = lerp(0.45, 0.9, camBlend);
  const sway = Math.sin(performance.now() * 0.00035) * 0.35 * camBlend;

  camDesired.set(playerX * follow + sway, y + jumpY * 0.1, z);
  if (shake > 0) {
    shake = Math.max(0, shake - dt * 1.7);
    camDesired.x += (Math.random() - 0.5) * shake * 0.45;
    camDesired.y += (Math.random() - 0.5) * shake * 0.28;
  }
  camera.position.lerp(camDesired, 1 - Math.exp(-4.2 * dt));
  lookTarget.set(playerX * 0.18, 1.2 + jumpY * 0.15, lookZ);
  camera.lookAt(lookTarget);
  const rollTarget = THREE.MathUtils.clamp((camera.position.x - playerX) * 0.02, -0.08, 0.08);
  roll += (rollTarget - roll) * Math.min(1, dt * 6);
  camera.rotateZ(roll);

  const fovTarget = lerp(76, 64, camBlend) + Math.max(0, simSpeed - BASE_SPEED) * 0.16;
  if (Math.abs(camera.fov - fovTarget) > 0.04) {
    camera.fov += (fovTarget - camera.fov) * Math.min(1, dt * 2.2);
    camera.updateProjectionMatrix();
  }
  sky.position.copy(camera.position);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function maybeDropQuality(frameDt) {
  if (qualityDropped || state === 'boot') return;
  fpsAccum += frameDt;
  fpsFrames += 1;
  if (fpsAccum < 2.4) return;
  const fps = fpsFrames / fpsAccum;
  fpsAccum = 0;
  fpsFrames = 0;
  if (fps < 45) {
    qualityDropped = true;
    prCap = 1.05;
    if (bloom) bloom.strength = 0.32;
    rain.setCountActive(0);
    resize();
  }
}

function loop(now) {
  requestAnimationFrame(loop);
  const frameDt = Math.min(0.1, (now - clockLast) / 1000);
  clockLast = now;
  if (paused || document.hidden) return;
  // dt limitado pra não atravessar obstáculo num soluço.
  // A contagem usa o tempo real, senão um frame lento deixa o 3-2-1 eterno.
  const dt = Math.min(0.05, frameDt);
  const realDt = Math.min(0.25, frameDt);
  update(dt, realDt);
  maybeDropQuality(frameDt);
  if (useComposer && !composerFailed) {
    try {
      composer.render();
    } catch (err) {
      composerFailed = true;
      useComposer = false;
      renderer.render(scene, camera);
    }
  } else {
    renderer.render(scene, camera);
  }
}

function canPlay() {
  return state === 'menu' || state === 'countdown' || state === 'playing';
}

window.addEventListener('error', (e) => {
  if (state === 'boot') setLoad('Erro: ' + (e.message || 'desconhecido'));
});

document.getElementById('btn-play').addEventListener('click', beginRun);
document.getElementById('btn-retry').addEventListener('click', beginRun);
document.getElementById('btn-menu').addEventListener('click', showMenu);

attachInput(document.body, {
  canPlay,
  lane: onLane,
  jump: onJump,
});

window.fugaBack = () => {
  if (state === 'menu' || state === 'boot') {
    try {
      if (window.AndroidScore && AndroidScore.finishApp) AndroidScore.finishApp();
    } catch (err) { /* navegador */ }
    return;
  }
  showMenu();
};

window.fugaAppPause = () => {
  paused = true;
};

window.fugaAppResume = () => {
  paused = false;
  clockLast = performance.now();
};

window.Fuga = {
  version: VERSION,
  get state() { return state; },
  get score() { return scoreNow(); },
  get best() { return best; },
  // Skin local. Um ranking online futuro pode assinar onRecord.
  setJacketColor(hex) {
    if (player) player.setJacketColor(hex);
  },
  onRecord: null,
  debugHit(type) {
    if (!debug) return;
    if (state !== 'playing') state = 'playing';
    die(type || 'moto');
  },
  debugSpawn(type, lane) {
    if (!debug || !traffic || !world) return;
    traffic.spawn(type || 'onibus', lane == null ? 1 : lane, -16, world.root.position.z, 0.45);
  },
};

boot();

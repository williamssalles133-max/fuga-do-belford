// Texturas feitas na hora, em atlas, para a rua de dia.
// Sem download: concreto, reboco, asfalto, roupa e vidro saem do canvas.

import * as THREE from 'three';

export function canvasTexture(canvas, repeat) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.wrapS = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  tex.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function noiseDots(g, w, h, count, alpha) {
  for (let i = 0; i < count; i++) {
    const v = 40 + Math.random() * 80;
    g.fillStyle = `rgba(${v | 0},${(v * 0.95) | 0},${(v * 0.85) | 0},${alpha})`;
    g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
}

export function makeAsphaltTexture() {
  const w = 512;
  const h = 1024;
  const c = canvas(w, h);
  const g = c.getContext('2d');
  g.fillStyle = '#6a6e73';
  g.fillRect(0, 0, w, h);
  noiseDots(g, w, h, 9000, 0.35);
  // Remendos e manchas de óleo. Asfalto seco, não espelho.
  for (let i = 0; i < 18; i++) {
    g.fillStyle = i % 3 === 0 ? 'rgba(30,30,32,0.28)' : 'rgba(90,90,92,0.35)';
    g.beginPath();
    g.ellipse(Math.random() * w, Math.random() * h, 18 + Math.random() * 40, 8 + Math.random() * 16, Math.random(), 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = 'rgba(40,40,42,0.45)';
  g.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    g.beginPath();
    const y = Math.random() * h;
    g.moveTo(20, y);
    g.lineTo(w - 20, y + (Math.random() - 0.5) * 30);
    g.stroke();
  }
  // Faixa desgastada. O período fecha na emenda do trecho.
  g.fillStyle = 'rgba(214,208,196,0.85)';
  const marks = [w * 0.333, w * 0.666];
  for (const x of marks) {
    for (let y = 0; y < h; y += 128) g.fillRect(x - 4, y + 16, 8, 52);
  }
  g.fillStyle = 'rgba(196,168,72,0.9)';
  g.fillRect(8, 0, 7, h);
  g.fillRect(w - 15, 0, 7, h);
  return canvasTexture(c, false);
}

export function makeSidewalkTexture() {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#b7b1a6';
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(90,84,76,0.55)';
  g.lineWidth = 3;
  for (let i = 0; i <= 4; i++) {
    g.beginPath();
    g.moveTo(0, i * 64);
    g.lineTo(256, i * 64);
    g.stroke();
    g.beginPath();
    g.moveTo(i * 64, 0);
    g.lineTo(i * 64, 256);
    g.stroke();
  }
  noiseDots(g, 256, 256, 600, 0.25);
  const tex = canvasTexture(c, true);
  tex.repeat.set(2, 10);
  return tex;
}

export function makeRoofTexture() {
  const c = canvas(128, 64);
  const g = c.getContext('2d');
  g.fillStyle = '#8d4a3a';
  g.fillRect(0, 0, 128, 64);
  g.strokeStyle = 'rgba(60,24,18,0.45)';
  g.lineWidth = 2;
  for (let y = 4; y < 64; y += 8) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(128, y);
    g.stroke();
  }
  return canvasTexture(c, true);
}

export function makeAwningTexture() {
  const c = canvas(128, 64);
  const g = c.getContext('2d');
  for (let x = 0; x < 128; x += 16) {
    g.fillStyle = (x / 16) % 2 === 0 ? '#f4f1ea' : '#2f6b45';
    g.fillRect(x, 0, 16, 64);
  }
  g.fillStyle = 'rgba(0,0,0,0.15)';
  g.fillRect(0, 56, 128, 8);
  return canvasTexture(c, true);
}

export function makeFabricTexture(hex, stripe) {
  const c = canvas(64, 64);
  const g = c.getContext('2d');
  g.fillStyle = hex;
  g.fillRect(0, 0, 64, 64);
  noiseDots(g, 64, 64, 80, 0.18);
  if (stripe) {
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.fillRect(0, 26, 64, 6);
  }
  return canvasTexture(c, false);
}

export function makeFaceTexture(tone) {
  const c = canvas(64, 64);
  const g = c.getContext('2d');
  g.fillStyle = tone;
  g.fillRect(0, 0, 64, 64);
  // Sombra leve nas laterais pra não parecer um adesivo chapado.
  const shade = g.createLinearGradient(0, 0, 64, 0);
  shade.addColorStop(0, 'rgba(0,0,0,0.18)');
  shade.addColorStop(0.5, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.18)');
  g.fillStyle = shade;
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#1a120e';
  g.fillRect(14, 26, 8, 3);
  g.fillRect(42, 26, 8, 3);
  g.fillStyle = 'rgba(90,40,40,0.35)';
  g.fillRect(26, 44, 12, 3);
  return canvasTexture(c, false);
}

const FACADES = [
  { base: '#e4c3a4', trim: '#c49a78', door: '#2c241e', floors: 3, shop: false, bars: true, number: '11', graffiti: false },
  { base: '#d98b73', trim: '#b86a58', door: '#1c1a22', floors: 3, shop: false, bars: true, number: '27', graffiti: false },
  { base: '#e7b7b0', trim: '#c98e8e', door: '#3a2428', floors: 2, shop: false, bars: true, number: '12', graffiti: true },
  { base: '#e6d3a1', trim: '#c2a56a', door: '#5a3a22', floors: 2, shop: true, bars: false, number: '48', graffiti: false },
  { base: '#d5d0c4', trim: '#b3ab9c', door: '#243028', floors: 3, shop: false, bars: true, number: '103', graffiti: false },
  { base: '#c9d2c2', trim: '#8aa388', door: '#1e2a24', floors: 2, shop: true, bars: true, number: '9', graffiti: false },
  { base: '#efe6d6', trim: '#d2c3aa', door: '#16324a', floors: 3, shop: false, bars: true, number: '64', graffiti: true },
  { base: '#d8c2a4', trim: '#a89880', door: '#2a2a2a', floors: 2, shop: true, bars: false, number: '15', graffiti: false },
];

export function makeFacadeAtlas() {
  const S = 1024;
  const c = canvas(S, S);
  const g = c.getContext('2d');
  g.fillStyle = '#888';
  g.fillRect(0, 0, S, S);
  const cellW = 256;
  const cellH = 512;
  FACADES.forEach((spec, i) => {
    const col = i % 4;
    const row = (i / 4) | 0;
    paintFacade(g, col * cellW, row * cellH, cellW, cellH, spec);
  });
  return {
    texture: canvasTexture(c, false),
    cells: FACADES.map((_, i) => {
      const col = i % 4;
      const row = (i / 4) | 0;
      const u0 = col / 4;
      const u1 = (col + 1) / 4;
      // flipY: o topo da célula no canvas vira o v maior.
      const vTop = 1 - (row * cellH) / S;
      const vBottom = 1 - ((row + 1) * cellH) / S;
      return { u0, u1, vTop, vBottom };
    }),
  };
}

function paintFacade(g, x, y, w, h, spec) {
  g.fillStyle = spec.base;
  g.fillRect(x, y, w, h);
  // Sujeira embaixo e canto de umidade.
  const dirt = g.createLinearGradient(0, y, 0, y + h);
  dirt.addColorStop(0, 'rgba(0,0,0,0)');
  dirt.addColorStop(0.72, 'rgba(80,50,30,0.05)');
  dirt.addColorStop(1, 'rgba(40,28,18,0.38)');
  g.fillStyle = dirt;
  g.fillRect(x, y, w, h);
  for (let i = 0; i < 180; i++) {
    g.fillStyle = `rgba(60,40,30,${Math.random() * 0.15})`;
    g.fillRect(x + Math.random() * w, y + Math.random() * h, 2, 2);
  }

  const floors = spec.floors;
  const top = y + 28;
  const bottom = y + h - 18;
  const span = bottom - top;
  for (let f = 0; f < floors; f++) {
    const fy = top + (span / floors) * f;
    const fh = span / floors - 10;
    if (f === floors - 1 && spec.shop) {
      paintShutter(g, x + 18, fy + 8, w - 36, fh);
      g.fillStyle = '#1a1c20';
      g.font = '700 22px sans-serif';
      g.textAlign = 'center';
      g.fillText(f % 2 === 0 ? 'MERCADO' : 'LANCHES', x + w / 2, fy + 4);
    } else {
      const cols = 2;
      for (let k = 0; k < cols; k++) {
        const wx = x + 28 + k * ((w - 40) / cols);
        const ww = (w - 70) / cols;
        paintWindow(g, wx, fy + 8, ww, fh - 16, spec.bars && f < floors - 1);
      }
    }
  }

  // Porta térrea quando não é loja.
  if (!spec.shop) {
    g.fillStyle = spec.door;
    g.fillRect(x + w * 0.38, y + h - 78, w * 0.24, 70);
    g.fillStyle = 'rgba(255,220,140,0.15)';
    g.fillRect(x + w * 0.42, y + h - 68, 10, 16);
  }

  // Número da casa, como nas fachadas do beco.
  g.fillStyle = '#2a211c';
  g.font = '700 28px sans-serif';
  g.textAlign = 'left';
  g.fillText(spec.number, x + 12, y + 36);

  // Eletroduto e caixa.
  g.strokeStyle = 'rgba(40,40,42,0.7)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(x + w - 22, y + 10);
  g.lineTo(x + w - 22, y + 90);
  g.stroke();
  g.fillStyle = '#c8c4bc';
  g.fillRect(x + w - 36, y + 88, 28, 22);
  g.strokeRect(x + w - 36, y + 88, 28, 22);

  if (spec.graffiti) {
    g.strokeStyle = 'rgba(40,70,90,0.55)';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(x + 16, y + h * 0.55);
    g.bezierCurveTo(x + 40, y + h * 0.4, x + 70, y + h * 0.7, x + 110, y + h * 0.48);
    g.stroke();
  }

  // Pingadeira.
  g.fillStyle = spec.trim;
  g.fillRect(x, y + h - 8, w, 8);
}

function paintWindow(g, x, y, w, h, bars) {
  g.fillStyle = '#d9d4cc';
  g.fillRect(x - 3, y - 3, w + 6, h + 6);
  const glass = g.createLinearGradient(x, y, x + w, y + h);
  glass.addColorStop(0, '#8ea4ae');
  glass.addColorStop(1, '#5e727c');
  g.fillStyle = glass;
  g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(255,255,255,0.25)';
  g.strokeRect(x + 2, y + 2, w * 0.45, h * 0.4);
  if (bars) {
    g.strokeStyle = '#4a4e52';
    g.lineWidth = 2;
    const n = 4;
    for (let i = 1; i < n; i++) {
      const bx = x + (w / n) * i;
      g.beginPath();
      g.moveTo(bx, y);
      g.lineTo(bx, y + h);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(x, y + h * 0.55);
    g.lineTo(x + w, y + h * 0.55);
    g.stroke();
  }
}

function paintShutter(g, x, y, w, h) {
  g.fillStyle = '#8d9298';
  g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(40,42,46,0.45)';
  g.lineWidth = 2;
  for (let yy = y + 4; yy < y + h; yy += 7) {
    g.beginPath();
    g.moveTo(x, yy);
    g.lineTo(x + w, yy);
    g.stroke();
  }
  // Porta entreaberta.
  g.fillStyle = '#1c1e22';
  g.fillRect(x + 6, y + h * 0.72, w - 12, h * 0.28);
}

export function makeTaxiSignTexture() {
  const c = canvas(128, 48);
  const g = c.getContext('2d');
  g.fillStyle = '#f2f2f2';
  g.fillRect(0, 0, 128, 48);
  g.fillStyle = '#1a1a1a';
  g.font = '700 28px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('TÁXI', 64, 26);
  return canvasTexture(c, false);
}

export function makeBusDestTexture() {
  const c = canvas(256, 64);
  const g = c.getContext('2d');
  g.fillStyle = '#102018';
  g.fillRect(0, 0, 256, 64);
  g.fillStyle = '#e8f6c8';
  g.font = '700 28px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('BELFORD ROXO', 128, 34);
  return canvasTexture(c, false);
}

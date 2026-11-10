// Tudo desenhado em canvas na hora. Sem PNG, sem rede.
// As texturas de cor vão em sRGB pra o tone mapping não lavar a tinta.

import * as THREE from 'three';

export function canvasTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function makeRoadTexture() {
  const w = 512;
  const h = 1024;
  const c = canvas(w, h);
  const g = c.getContext('2d');
  g.fillStyle = '#1c1e28';
  g.fillRect(0, 0, w, h);

  // Granulado do asfalto. Bem sutil pra emenda entre trechos não gritar.
  for (let i = 0; i < 5000; i++) {
    const v = Math.random() * 40;
    g.fillStyle = `rgba(${v | 0},${v | 0},${v | 0},0.18)`;
    g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }

  // Faixas de desgaste no meio de cada pista.
  g.fillStyle = 'rgba(0,0,0,0.18)';
  const lanes = [0.2, 0.5, 0.8];
  for (const t of lanes) {
    g.fillRect(w * t - 28, 0, 56, h);
  }

  // Bordas amarelas.
  g.fillStyle = '#e2b12a';
  g.fillRect(10, 0, 12, h);
  g.fillRect(w - 22, 0, 12, h);

  // Tracejado entre as faixas. Período divide 1024, então a emenda fecha.
  g.fillStyle = '#f4f1ea';
  const marks = [w * 0.333, w * 0.666];
  const period = 128;
  for (const x of marks) {
    for (let y = 0; y < h; y += period) {
      g.fillRect(x - 5, y + 8, 10, 64);
    }
  }

  const tex = canvasTexture(c);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function makeSidewalkTexture() {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#6e675d';
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(40,32,28,0.45)';
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
  for (let i = 0; i < 800; i++) {
    g.fillStyle = 'rgba(255,255,255,0.04)';
    g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  const tex = canvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 8);
  return tex;
}

export function makeCrosswalkTexture() {
  const c = canvas(512, 128);
  const g = c.getContext('2d');
  g.clearRect(0, 0, 512, 128);
  g.fillStyle = 'rgba(244,241,234,0.92)';
  for (let i = 0; i < 8; i++) {
    g.fillRect(18 + i * 64, 16, 36, 96);
  }
  const tex = canvasTexture(c);
  return tex;
}

const PLASTER = ['#f0c2b4', '#f3e09a', '#b7e0c8', '#f4cfe0', '#c9d4f6', '#e7d3b4', '#d7c2ae', '#9fd0c8'];

export function makeFacades() {
  return PLASTER.map((base, index) => makeFacade(base, index));
}

function makeFacade(base, salt) {
  const S = 256;
  const color = canvas(S, S);
  const emissive = canvas(S, S);
  const g = color.getContext('2d');
  const e = emissive.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, S, S);
  // Sujeira leve embaixo, típica de parede de rua.
  const dirt = g.createLinearGradient(0, 0, 0, S);
  dirt.addColorStop(0, 'rgba(0,0,0,0)');
  dirt.addColorStop(1, 'rgba(40,24,16,0.28)');
  g.fillStyle = dirt;
  g.fillRect(0, 0, S, S);

  e.fillStyle = '#000';
  e.fillRect(0, 0, S, S);

  const cols = 4;
  const rows = 5;
  const marginX = 16;
  const marginY = 14;
  const gapX = 12;
  const gapY = 16;
  const cellW = (S - marginX * 2 - gapX * (cols - 1)) / cols;
  const cellH = (S - marginY * 2 - gapY * (rows - 1)) / rows;

  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const x = marginX + col * (cellW + gapX);
      const y = marginY + r * (cellH + gapY);
      const n = Math.abs(Math.sin((r + 1) * 12.3 + (col + 1) * 4.7 + salt * 3.1));
      const lit = n > 0.38;
      g.fillStyle = '#241910';
      g.fillRect(x - 2, y - 2, cellW + 4, cellH + 4);
      if (lit) {
        const warm = n > 0.55;
        const css = warm ? (n > 0.78 ? '#ffd48a' : '#ffb15e') : '#b7ddff';
        g.fillStyle = css;
        g.fillRect(x, y, cellW, cellH);
        g.fillStyle = 'rgba(90,30,50,0.28)';
        g.fillRect(x, y, cellW * 0.28, cellH);
        e.fillStyle = warm ? '#ffc56a' : '#d2ecff';
        e.fillRect(x, y, cellW, cellH);
      } else {
        g.fillStyle = '#141820';
        g.fillRect(x, y, cellW, cellH);
      }
    }
  }

  g.strokeStyle = 'rgba(50,32,32,0.35)';
  g.lineWidth = 3;
  for (let r = 0; r < rows; r++) {
    const y = marginY + r * (cellH + gapY) + cellH + 5;
    g.beginPath();
    g.moveTo(6, y);
    g.lineTo(S - 6, y);
    g.stroke();
  }

  const map = canvasTexture(color);
  const em = canvasTexture(emissive);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  em.wrapS = em.wrapT = THREE.RepeatWrapping;
  return { map, emissive: em };
}

const SIGNS = [
  ['PADARIA', 'PÃO QUENTE', '#7a1028', '#ffe28a'],
  ['AÇAÍ', 'DA ESQUINA', '#10243f', '#3df0ff'],
  ['LANCHONETE', 'DA BAIXADA', '#ff2d6a', '#fff6ea'],
  ['MERCADO', 'BOM PREÇO', '#14301f', '#d6ff6b'],
  ['SALÃO', 'BELEZA', '#3a1458', '#ffb3e0'],
  ['FARMÁCIA', '24 HORAS', '#0d3a34', '#e8fff6'],
  ['PIX', 'AQUI', '#1a1040', '#3df0ff'],
  ['OFICINA', 'DO TIÃO', '#3a220c', '#ffc400'],
  ['BAR DO ZÉ', '', '#240814', '#ffd0a8'],
  ['LAN HOUSE', '', '#101828', '#7aa2ff'],
  ['PASTEL', 'DO CHICO', '#5a220c', '#ffe7b0'],
  ['BELFORD', 'ROXO', '#14081c', '#ffc400'],
];

export function makeSignMaterials() {
  return SIGNS.map(([a, b, bg, fg]) => makeSignMaterial(a, b, bg, fg));
}

export function makeSignMaterial(line1, line2, bg, fg) {
  const c = canvas(512, 256);
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, 512, 256);
  g.strokeStyle = fg;
  g.lineWidth = 14;
  g.strokeRect(12, 12, 488, 232);
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '400 92px "Bebas Neue", Impact, sans-serif';
  if (line2) {
    g.fillText(line1, 256, 96);
    g.font = '400 78px "Bebas Neue", Impact, sans-serif';
    g.fillText(line2, 256, 170);
  } else {
    g.font = '400 108px "Bebas Neue", Impact, sans-serif';
    g.fillText(line1, 256, 132);
  }
  const mat = new THREE.MeshBasicMaterial({ map: canvasTexture(c) });
  mat.color.multiplyScalar(1.7);
  return mat;
}

export function makeGantryTexture() {
  const c = canvas(1024, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#140810';
  g.fillRect(0, 0, 1024, 256);
  g.fillStyle = '#ffc400';
  g.fillRect(0, 0, 1024, 10);
  g.fillRect(0, 246, 1024, 10);
  g.font = '400 132px "Bebas Neue", Impact, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#fff3d2';
  g.fillText('BELFORD ROXO', 512, 132);
  return canvasTexture(c);
}

export function makeGraffitiMaterials() {
  const palettes = [
    ['#ff2d6a', '#ffc400', '#3df0ff'],
    ['#7aa2ff', '#fff6ea', '#ff2d6a'],
    ['#d6ff6b', '#ff7a18', '#1a1030'],
  ];
  return palettes.map((colors) => {
    const c = canvas(256, 256);
    const g = c.getContext('2d');
    g.clearRect(0, 0, 256, 256);
    g.globalAlpha = 0.92;
    for (let i = 0; i < 7; i++) {
      g.strokeStyle = colors[i % colors.length];
      g.lineWidth = 8 + (i % 3) * 4;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(20 + i * 18, 210 - i * 12);
      g.bezierCurveTo(80, 40 + i * 20, 140, 200 - i * 15, 230, 30 + i * 22);
      g.stroke();
    }
    g.globalAlpha = 1;
    const mat = new THREE.MeshBasicMaterial({
      map: canvasTexture(c),
      transparent: true,
      depthWrite: false,
    });
    return mat;
  });
}

export function makeJacketGraphic() {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  g.clearRect(0, 0, 256, 256);
  g.fillStyle = '#ff2d6a';
  g.beginPath();
  g.moveTo(128, 28);
  g.lineTo(168, 110);
  g.lineTo(138, 110);
  g.lineTo(176, 228);
  g.lineTo(78, 128);
  g.lineTo(116, 128);
  g.closePath();
  g.fill();
  g.fillStyle = '#1a0610';
  g.font = '400 54px "Bebas Neue", Impact, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('FOGE', 128, 214);
  const mat = new THREE.MeshBasicMaterial({
    map: canvasTexture(c),
    transparent: true,
    depthWrite: false,
  });
  return mat;
}

export function makeBusWindowTexture() {
  const c = canvas(512, 180);
  const g = c.getContext('2d');
  g.fillStyle = '#123028';
  g.fillRect(0, 0, 512, 180);
  // Fluorescente de ônibus à noite.
  const glow = g.createLinearGradient(0, 0, 0, 180);
  glow.addColorStop(0, '#d9ffb0');
  glow.addColorStop(1, '#6fbf73');
  g.fillStyle = glow;
  g.fillRect(0, 0, 512, 180);
  g.fillStyle = '#102018';
  for (let i = 0; i < 9; i++) {
    const x = 18 + i * 56;
    g.beginPath();
    g.arc(x + 16, 108, 16, 0, Math.PI * 2);
    g.fill();
    g.fillRect(x + 4, 122, 24, 40);
    if (i % 2 === 0) {
      g.fillRect(x + 28, 96, 8, 28);
    }
  }
  // Divisória das janelas.
  g.fillStyle = 'rgba(12,20,16,0.55)';
  for (let i = 1; i < 8; i++) g.fillRect(i * 64, 0, 6, 180);
  return canvasTexture(c);
}

export function makeDestinationTexture(line) {
  const c = canvas(512, 128);
  const g = c.getContext('2d');
  g.fillStyle = '#061018';
  g.fillRect(0, 0, 512, 128);
  g.fillStyle = '#3df0ff';
  g.font = '400 64px "Bebas Neue", Impact, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(line, 256, 66);
  return canvasTexture(c);
}

export function makeGlowTexture() {
  const c = canvas(128, 128);
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.18, 'rgba(255,236,190,0.95)');
  grd.addColorStop(0.45, 'rgba(255,170,60,0.28)');
  grd.addColorStop(1, 'rgba(255,140,40,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const tex = canvasTexture(c);
  return tex;
}

export function makeStripeTexture() {
  const c = canvas(128, 32);
  const g = c.getContext('2d');
  for (let x = 0; x < 128; x += 16) {
    g.fillStyle = (x / 16) % 2 === 0 ? '#ffb000' : '#1a1208';
    g.fillRect(x, 0, 16, 32);
  }
  const tex = canvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

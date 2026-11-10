// Céu noturno com faixa de luz da cidade no horizonte.
// O domo acompanha a câmera; a direção vem do espaço local, senão a lua foge.

import * as THREE from 'three';

export function createSky() {
  const geo = new THREE.SphereGeometry(240, 28, 18);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      top: { value: new THREE.Color(0x070514) },
      mid: { value: new THREE.Color(0x2c1248) },
      horizon: { value: new THREE.Color(0xff6a2a) },
      glow: { value: new THREE.Color(0xff2d78) },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vDir;
      uniform vec3 top, mid, horizon, glow;
      float hash(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }
      void main() {
        vec3 dir = normalize(vDir);
        float h = dir.y;
        vec3 col = mix(horizon, mid, smoothstep(-0.04, 0.2, h));
        col = mix(col, top, smoothstep(0.1, 0.72, h));
        float band = exp(-pow(h * 8.5, 2.0));
        col += glow * band * 0.32;
        vec3 grid = dir * 520.0;
        vec3 cell = floor(grid);
        vec3 f = fract(grid) - 0.5;
        float stars = step(0.997, hash(cell));
        stars *= smoothstep(0.42, 0.05, length(f));
        stars *= smoothstep(0.12, 0.4, h);
        col += stars * 0.9;
        vec3 moon = normalize(vec3(0.48, 0.64, -0.22));
        float m = smoothstep(0.9972, 0.9994, dot(dir, moon));
        col += vec3(0.82, 0.88, 1.0) * m * 1.35;
        col += (hash(vec3(gl_FragCoord.xy, 2.0)) - 0.5) * 0.012;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const sky = new THREE.Mesh(geo, mat);
  sky.frustumCulled = false;
  sky.renderOrder = -1;

  const skylineMat = new THREE.MeshBasicMaterial({ color: 0x140818, fog: false });
  const skyline = new THREE.Group();
  for (let i = 0; i < 30; i++) {
    const h = 2.5 + Math.pow(Math.random(), 1.15) * 18;
    const w = 2.2 + Math.random() * 6;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 3), skylineMat);
    const a = -1.05 + (i / 29) * 2.1;
    const r = 100;
    b.position.set(Math.sin(a) * r, h / 2 - 10, -Math.cos(a) * Math.abs(r));
    skyline.add(b);
  }
  sky.add(skyline);
  return sky;
}

// Céu de dia encoberto e, no horizonte, o bondinho — referência de morro
// com teleférico, já que o vídeo não mostra trem.

import * as THREE from 'three';

export function createSky() {
  const geo = new THREE.SphereGeometry(240, 28, 18);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      zenith: { value: new THREE.Color(0x9eacb6) },
      horizon: { value: new THREE.Color(0xd5d8d4) },
      cloud: { value: new THREE.Color(0xe7e6e2) },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vDir;
      uniform vec3 zenith, horizon, cloud;
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      void main() {
        float h = clamp(vDir.y, 0.0, 1.0);
        vec3 col = mix(horizon, zenith, smoothstep(0.0, 0.55, h));
        float n = noise(vDir.xz * 4.5 + vec2(vDir.y * 2.0));
        n += 0.35 * noise(vDir.xz * 9.0);
        float puff = smoothstep(0.55, 0.85, n) * smoothstep(0.02, 0.28, h);
        col = mix(col, cloud, puff * 0.42);
        // Mancha mais clara onde o sol está atrás da nuvem.
        float sun = pow(max(dot(normalize(vDir), normalize(vec3(0.45, 0.55, 0.15))), 0.0), 8.0);
        col += vec3(1.0, 0.96, 0.9) * sun * 0.18;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const sky = new THREE.Mesh(geo, mat);
  sky.frustumCulled = false;
  sky.renderOrder = -1;

  const hillMat = new THREE.MeshBasicMaterial({ color: 0x8d8a82, fog: false });
  const hills = new THREE.Group();
  for (let i = 0; i < 18; i++) {
    const h = 6 + Math.random() * 16;
    const w = 10 + Math.random() * 18;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 8), hillMat);
    const a = -1.1 + (i / 17) * 2.2;
    b.position.set(Math.sin(a) * 130, h / 2 - 18, -Math.cos(a) * 120);
    hills.add(b);
  }
  sky.add(hills);
  sky.add(makeBondinho());
  return sky;
}

function makeBondinho() {
  const g = new THREE.Group();
  const cableMat = new THREE.MeshBasicMaterial({ color: 0x2a2c30, fog: false });
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0xc5382a, roughness: 0.5, metalness: 0.2 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x9eb4bc, roughness: 0.15, metalness: 0.4 });
  // Cabo alto, atrás dos morros baixos, atravessando o horizonte.
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const x = -70 + t * 140;
    const sag = Math.sin(t * Math.PI) * 6;
    pts.push(new THREE.Vector3(x, 28 - sag, -90));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.15, 4, false), cableMat);
  g.add(tube);
  for (let i = 0; i < 4; i++) {
    const p = curve.getPoint(0.18 + i * 0.2);
    const cabin = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 2.2), cabinMat);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.8, 2.25), glassMat);
    glass.position.y = 0.3;
    const hanger = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), cableMat);
    hanger.position.y = 1.6;
    cabin.add(body, glass, hanger);
    cabin.position.copy(p);
    cabin.position.y -= 1.8;
    g.add(cabin);
  }
  // Torres finas.
  const towerMat = new THREE.MeshStandardMaterial({ color: 0xb7b3aa, roughness: 0.7, metalness: 0.2 });
  for (const x of [-48, 48]) {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(1.2, 22, 1.2), towerMat);
    tower.position.set(x, 8, -90);
    g.add(tower);
  }
  return g;
}

// Chuva fina em volta da câmera e faísca na colisão.
// Poucos vértices: o bloom é que vende o brilho, não a contagem de partícula.

import * as THREE from 'three';

export function createRain(count) {
  const n = count;
  const positions = new Float32Array(n * 3);
  const lens = new Float32Array(n);
  for (let i = 0; i < n; i++) reset(positions, i, true);
  lens.fill(14);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aLen', new THREE.BufferAttribute(lens, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color(0xc9dcff) },
    },
    vertexShader: `
      attribute float aLen;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aLen * (220.0 / max(8.0, -mv.z));
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float streak = smoothstep(0.5, 0.0, abs(uv.x) * 7.0);
        streak *= smoothstep(0.5, 0.02, abs(uv.y));
        if (streak < 0.04) discard;
        gl_FragColor = vec4(uColor, streak * 0.45);
      }
    `,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;

  function update(dt) {
    const p = geo.attributes.position.array;
    for (let i = 0; i < n; i++) {
      p[i * 3 + 1] -= dt * (16 + (i % 7));
      p[i * 3 + 2] += dt * 6;
      if (p[i * 3 + 1] < -4 || p[i * 3 + 2] > 4) reset(p, i, false);
    }
    geo.attributes.position.needsUpdate = true;
  }

  function setCountActive(active) {
    points.visible = active > 0;
  }

  return { points, update, setCountActive };
}

function reset(arr, i, anywhere) {
  arr[i * 3] = (Math.random() - 0.5) * 18;
  arr[i * 3 + 1] = anywhere ? (Math.random() * 16 - 2) : 8 + Math.random() * 8;
  arr[i * 3 + 2] = -Math.random() * 28;
}

export function createBurst() {
  const n = 28;
  const geo = new THREE.BoxGeometry(0.09, 0.09, 0.09);
  const group = new THREE.Group();
  const bits = [];
  const colors = [0x8a8074, 0xc4b8a4, 0x6a6258, 0xe7e0d4];
  for (let i = 0; i < n; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length] });
    const m = new THREE.Mesh(geo, mat);
    m.visible = false;
    group.add(m);
    bits.push({
      mesh: m,
      v: new THREE.Vector3(),
      life: 0,
    });
  }

  function trigger(origin) {
    for (const bit of bits) {
      bit.mesh.visible = true;
      bit.mesh.position.copy(origin);
      bit.mesh.position.y += 1;
      bit.v.set((Math.random() - 0.5) * 7, 2 + Math.random() * 6, (Math.random() - 0.5) * 7);
      bit.life = 0.45 + Math.random() * 0.25;
      bit.mesh.material.opacity = 1;
      bit.mesh.material.transparent = true;
    }
  }

  function update(dt) {
    for (const bit of bits) {
      if (bit.life <= 0) continue;
      bit.life -= dt;
      bit.v.y -= 14 * dt;
      bit.mesh.position.addScaledVector(bit.v, dt);
      bit.mesh.rotation.x += dt * 8;
      bit.mesh.material.opacity = Math.max(0, bit.life * 2);
      if (bit.life <= 0) bit.mesh.visible = false;
    }
  }

  return { group, trigger, update };
}

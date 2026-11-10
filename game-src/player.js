// Corredor em proporção humana, visto de costas.
// Jaqueta verde, calça clara e mochila — lê na rua de dia sem virar boneco de neon.

import * as THREE from 'three';
import { makeFabricTexture } from './textures.js';

function std(hex, roughness, metalness, map) {
  return new THREE.MeshStandardMaterial({
    color: map ? 0xffffff : hex,
    map: map || null,
    roughness,
    metalness,
  });
}

function mesh(geo, mat, x, y, z, parent) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  parent.add(m);
  return m;
}

export function createPlayer() {
  const root = new THREE.Group();
  const visual = new THREE.Group();
  root.add(visual);

  const skin = std(0x8d5a3c, 0.72, 0);
  const jacketMap = makeFabricTexture('#355744', false);
  const jacket = std(0xffffff, 0.78, 0.02, jacketMap);
  const pants = std(0xe4ddd2, 0.8, 0);
  const shoe = std(0x2c2e32, 0.55, 0.15);
  const hair = std(0x1a120e, 0.8, 0);
  const pack = std(0x2a2d31, 0.7, 0.08);

  const hipY = 0.92;

  const legs = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.11, hipY, 0);
    visual.add(hip);
    mesh(new THREE.CapsuleGeometry(0.07, 0.36, 3, 6), pants, 0, -0.26, 0, hip);
    const knee = new THREE.Group();
    knee.position.set(0, -0.46, 0);
    hip.add(knee);
    mesh(new THREE.CapsuleGeometry(0.055, 0.32, 3, 6), skin, 0, -0.2, 0, knee);
    mesh(new THREE.BoxGeometry(0.1, 0.08, 0.24), shoe, 0, -0.4, -0.04, knee);
    legs.push({ hip, knee, side });
  }

  const torso = new THREE.Group();
  torso.position.set(0, hipY, 0);
  visual.add(torso);
  mesh(new THREE.BoxGeometry(0.42, 0.52, 0.22), jacket, 0, 0.32, 0, torso);
  mesh(new THREE.BoxGeometry(0.36, 0.28, 0.16), pack, 0, 0.34, 0.16, torso);

  const arms = [];
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.26, 0.5, 0);
    torso.add(shoulder);
    mesh(new THREE.CapsuleGeometry(0.05, 0.26, 3, 6), jacket, 0, -0.18, 0, shoulder);
    const elbow = new THREE.Group();
    elbow.position.set(0, -0.32, 0);
    shoulder.add(elbow);
    mesh(new THREE.CapsuleGeometry(0.04, 0.22, 3, 6), skin, 0, -0.14, 0, elbow);
    arms.push({ shoulder, elbow });
  }

  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.7, 0);
  torso.add(headPivot);
  mesh(new THREE.SphereGeometry(0.13, 14, 12), skin, 0, 0.02, 0, headPivot);
  mesh(new THREE.SphereGeometry(0.135, 12, 8), hair, 0, 0.06, 0.01, headPivot);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.38, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;

  let phase = 0;

  function update(dt, speed, airborne, lateral) {
    const pace = airborne ? 0 : 8.5 + Math.min(speed, 34) * 0.2;
    phase += dt * pace;
    const swing = airborne ? 0 : 1;
    for (const leg of legs) {
      const s = Math.sin(phase + (leg.side === 1 ? Math.PI : 0));
      leg.hip.rotation.x = s * 0.7 * swing + (airborne ? -0.7 : 0);
      leg.knee.rotation.x = airborne ? 1.15 : Math.max(0, -s) * 1.05;
    }
    for (let i = 0; i < arms.length; i++) {
      const s = Math.sin(phase + (i === 0 ? Math.PI : 0));
      arms[i].shoulder.rotation.x = airborne ? -0.5 : s * 0.55;
    }
    visual.position.y = airborne ? 0 : Math.abs(Math.sin(phase * 2)) * 0.03;
    visual.rotation.x = airborne ? -0.18 : -0.08;
    const rollTarget = THREE.MathUtils.clamp(-lateral * 0.03, -0.28, 0.28);
    visual.rotation.z += (rollTarget - visual.rotation.z) * Math.min(1, dt * 8);

    const lift = root.position.y;
    shadow.scale.setScalar((1 / (1 + lift * 0.8)) * 1.05);
    shadow.material.opacity = 0.22 * Math.max(0.2, 1 - lift * 0.3);
    shadow.position.set(root.position.x, 0.03, root.position.z);
  }

  function setJacketColor(hex) {
    jacket.color.set(hex);
    jacket.map = null;
  }

  return { root, shadow, update, setJacketColor };
}

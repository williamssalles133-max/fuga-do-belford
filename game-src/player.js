// Corredor estilizado, visto de costas (câmera atrás, como num runner).
// O moletom amarelo e o raio "FOGE" são o que se lê no celular.

import * as THREE from 'three';
import { makeJacketGraphic } from './textures.js';

function std(hex, roughness, metalness) {
  return new THREE.MeshStandardMaterial({ color: hex, roughness, metalness });
}

function basic(hex, mul) {
  const mat = new THREE.MeshBasicMaterial({ color: hex });
  if (mul && mul !== 1) mat.color.multiplyScalar(mul);
  return mat;
}

function mesh(geo, mat, x, y, z, parent) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

export function createPlayer() {
  const root = new THREE.Group();
  const visual = new THREE.Group();
  visual.scale.setScalar(1.18);
  root.add(visual);

  const skin = std(0x8d552f, 0.72, 0);
  const jacket = std(0xffc400, 0.52, 0.06);
  const jacketDark = std(0xc98a00, 0.58, 0.05);
  const shorts = std(0xff2d6a, 0.62, 0.04);
  const shoe = std(0xf6f3ee, 0.38, 0.12);
  const sole = basic(0x19e6ff, 2.6);
  const hair = std(0x1b120e, 0.85, 0);
  const shade = std(0x10141c, 0.2, 0.6);
  const graphic = makeJacketGraphic();

  const hipY = 0.98;

  // Pernas: pivô no quadril, canela no joelho.
  const legs = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.16, hipY, 0);
    visual.add(hip);
    const thigh = mesh(new THREE.CapsuleGeometry(0.09, 0.34, 4, 8), skin, 0, -0.24, 0, hip);
    const knee = new THREE.Group();
    knee.position.set(0, -0.42, 0);
    hip.add(knee);
    mesh(new THREE.CapsuleGeometry(0.075, 0.32, 4, 8), skin, 0, -0.22, 0, knee);
    const foot = mesh(new THREE.BoxGeometry(0.16, 0.1, 0.32), shoe, 0, -0.42, -0.06, knee);
    mesh(new THREE.BoxGeometry(0.17, 0.045, 0.34), sole, 0, -0.48, -0.06, knee);
    legs.push({ hip, thigh, knee, foot, side });
  }

  const torso = new THREE.Group();
  torso.position.set(0, hipY + 0.08, 0);
  visual.add(torso);
  mesh(new THREE.BoxGeometry(0.66, 0.62, 0.34), jacket, 0, 0.36, 0, torso);
  // Faixa do moletom.
  mesh(new THREE.BoxGeometry(0.68, 0.08, 0.36), shorts, 0, 0.12, 0, torso);
  mesh(new THREE.BoxGeometry(0.5, 0.16, 0.36), jacketDark, 0, 0.66, 0, torso);
  mesh(new THREE.PlaneGeometry(0.42, 0.42), graphic, 0, 0.38, 0.176, torso);

  const arms = [];
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.4, 0.58, 0);
    torso.add(shoulder);
    mesh(new THREE.CapsuleGeometry(0.075, 0.28, 3, 6), jacket, 0, -0.2, 0, shoulder);
    const elbow = new THREE.Group();
    elbow.position.set(0, -0.36, 0);
    shoulder.add(elbow);
    mesh(new THREE.CapsuleGeometry(0.06, 0.24, 3, 6), skin, 0, -0.16, 0, elbow);
    arms.push({ shoulder, elbow, side });
  }

  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.86, 0);
  torso.add(headPivot);
  // Capuz por cima, cabeça um pouco à frente pra o rosto existir de perfil.
  mesh(new THREE.SphereGeometry(0.24, 16, 14), jacket, 0, 0.08, 0.02, headPivot);
  mesh(new THREE.SphereGeometry(0.2, 16, 14), skin, 0, 0.02, -0.04, headPivot);
  mesh(new THREE.SphereGeometry(0.2, 12, 10), hair, 0, 0.1, -0.02, headPivot);
  mesh(new THREE.BoxGeometry(0.34, 0.08, 0.12), shade, 0, 0.04, -0.18, headPivot);
  // Aba do boné pra trás (virada pra câmera).
  mesh(new THREE.BoxGeometry(0.28, 0.035, 0.16), jacketDark, 0, 0.16, 0.16, headPivot);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.46, 18),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;

  const dustGeo = new THREE.SphereGeometry(0.12, 6, 6);
  const dustMat = new THREE.MeshBasicMaterial({ color: 0xc8b8a0, transparent: true, opacity: 0.0, depthWrite: false });
  const dustL = new THREE.Mesh(dustGeo, dustMat.clone());
  const dustR = new THREE.Mesh(dustGeo, dustMat.clone());
  dustL.position.y = 0.08;
  dustR.position.y = 0.08;
  root.add(dustL, dustR);

  let phase = 0;
  let stepSide = 1;

  function setJacketColor(hex) {
    jacket.color.set(hex);
    jacketDark.color.copy(jacket.color).multiplyScalar(0.72);
  }

  function update(dt, speed, airborne, lateral) {
    const pace = airborne ? 0 : 9 + Math.min(speed, 36) * 0.22;
    phase += dt * pace;
    const swing = airborne ? 0 : 1;

    for (const leg of legs) {
      const s = Math.sin(phase + (leg.side === 1 ? Math.PI : 0));
      leg.hip.rotation.x = s * 0.75 * swing + (airborne ? -0.9 : 0);
      const kneeBend = airborne ? 1.35 : Math.max(0, -s) * 1.15;
      leg.knee.rotation.x = kneeBend;
    }
    for (const arm of arms) {
      const s = Math.sin(phase + (arm.side === 1 ? 0 : Math.PI));
      arm.shoulder.rotation.x = airborne ? -0.8 : s * 0.7;
      arm.elbow.rotation.x = airborne ? -0.4 : -0.35 + Math.max(0, s) * -0.4;
    }

    const bob = airborne ? 0 : Math.abs(Math.sin(phase * 2)) * 0.045;
    visual.position.y = bob;
    // Rotação X negativa = tronco pra frente (sentido da corrida, -Z).
    visual.rotation.x = airborne ? -0.28 : -0.14;
    const rollTarget = THREE.MathUtils.clamp(-lateral * 0.035, -0.35, 0.35);
    visual.rotation.z += (rollTarget - visual.rotation.z) * Math.min(1, dt * 8);
    torso.rotation.y = Math.sin(phase) * 0.06 * swing;
    headPivot.rotation.z = Math.sin(phase * 0.5) * 0.04;

    // Poeira no pé que desce.
    if (!airborne && Math.sin(phase) > 0.92 && stepSide !== 1) {
      puff(dustL, -0.16);
      stepSide = 1;
    } else if (!airborne && Math.sin(phase) < -0.92 && stepSide !== -1) {
      puff(dustR, 0.16);
      stepSide = -1;
    }
    fadeDust(dustL, dt);
    fadeDust(dustR, dt);

    const lift = root.position.y;
    const sScale = 1 / (1 + lift * 0.85);
    shadow.scale.setScalar(sScale * 1.15);
    shadow.material.opacity = 0.45 * Math.max(0.15, 1 - lift * 0.35);
    // Sombra fica no chão, não sobe junto com o pulo.
    shadow.position.set(root.position.x, 0.03, root.position.z);
  }

  function puff(sprite, x) {
    sprite.position.set(x, 0.08, 0.1);
    sprite.scale.setScalar(0.6);
    sprite.material.opacity = 0.45;
  }

  function fadeDust(sprite, dt) {
    sprite.material.opacity = Math.max(0, sprite.material.opacity - dt * 1.6);
    sprite.scale.multiplyScalar(1 + dt * 2.2);
    sprite.position.y += dt * 0.4;
  }

  return {
    root,
    shadow,
    update,
    setJacketColor,
  };
}

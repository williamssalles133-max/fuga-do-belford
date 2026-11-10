// Avenida em trechos que reciclamos pra posição não ir pro infinito.
// Quando um pedaço passa da câmera, ele volta lá na frente com outra altura de prédio.

import * as THREE from 'three';
import { CHUNK_LEN, CHUNK_COUNT, ROAD_W, SIDE_W } from './config.js';
import {
  makeRoadTexture,
  makeSidewalkTexture,
  makeCrosswalkTexture,
  makeFacades,
  makeSignMaterials,
  makeGraffitiMaterials,
} from './textures.js';

export function createWorld() {
  const root = new THREE.Group();

  const facades = makeFacades();
  const signs = makeSignMaterials();
  const graffiti = makeGraffitiMaterials();

  const roadMat = new THREE.MeshStandardMaterial({
    map: makeRoadTexture(),
    roughness: 0.4,
    metalness: 0.58,
    envMapIntensity: 1.35,
  });
  const sideTex = makeSidewalkTexture();
  sideTex.repeat.set(2, 10);
  const sideMat = new THREE.MeshStandardMaterial({
    map: sideTex,
    roughness: 0.94,
    metalness: 0.02,
  });
  const curbMat = new THREE.MeshStandardMaterial({ color: 0xc4bbaa, roughness: 0.78, metalness: 0.04 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x3e3338, roughness: 0.9, metalness: 0.06 });
  const tankBlue = new THREE.MeshStandardMaterial({ color: 0x2a6aab, roughness: 0.42, metalness: 0.18 });
  const tankBlack = new THREE.MeshStandardMaterial({ color: 0x1b1e24, roughness: 0.5, metalness: 0.25 });
  const lidMat = new THREE.MeshStandardMaterial({ color: 0x14171c, roughness: 0.45, metalness: 0.4 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x2c2e34, roughness: 0.38, metalness: 0.72 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffc27a });
  bulbMat.color.multiplyScalar(3);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xffb15a,
    transparent: true,
    opacity: 0.055,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const puddleMat = new THREE.MeshStandardMaterial({
    color: 0x0e1016,
    metalness: 1,
    roughness: 0.045,
    transparent: true,
    opacity: 0.55,
    envMapIntensity: 2.3,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const acMat = new THREE.MeshStandardMaterial({ color: 0xd5dae0, roughness: 0.35, metalness: 0.45 });
  const crossTex = makeCrosswalkTexture();
  const crossMat = new THREE.MeshBasicMaterial({
    map: crossTex,
    transparent: true,
    depthWrite: false,
  });
  const wireMat = new THREE.LineBasicMaterial({ color: 0x2c2a38 });

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const roofGeo = new THREE.BoxGeometry(1, 0.18, 1);
  const tankGeo = new THREE.CylinderGeometry(0.4, 0.44, 0.85, 10);
  const lidGeo = new THREE.CylinderGeometry(0.46, 0.4, 0.16, 10);
  const signGeo = new THREE.PlaneGeometry(1, 1);
  const grafGeo = new THREE.PlaneGeometry(1, 1);
  const acGeo = new THREE.BoxGeometry(0.62, 0.34, 0.36);
  const antGeo = new THREE.BoxGeometry(0.025, 1.15, 0.025);
  const antBar = new THREE.BoxGeometry(0.46, 0.025, 0.025);
  const puddleGeo = new THREE.CircleGeometry(1, 14);

  const chunks = [];
  for (let i = 0; i < CHUNK_COUNT; i++) {
    const chunk = buildChunk(i);
    chunk.group.position.z = -i * CHUNK_LEN;
    root.add(chunk.group);
    chunks.push(chunk);
  }

  function buildingMaterial(facade, frontage, height) {
    const map = facade.map.clone();
    const em = facade.emissive.clone();
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    em.wrapS = em.wrapT = THREE.RepeatWrapping;
    map.repeat.set(Math.max(1, frontage / 3.4), Math.max(1, height / 3.3));
    em.repeat.copy(map.repeat);
    return new THREE.MeshStandardMaterial({
      map,
      emissiveMap: em,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 1.55,
      roughness: 0.9,
      metalness: 0.02,
    });
  }

  function makeBuilding(hand, frontage, depth, height) {
    const facade = facades[(Math.random() * facades.length) | 0];
    const mat = buildingMaterial(facade, frontage, height);
    const group = new THREE.Group();

    const body = new THREE.Mesh(boxGeo, mat);
    body.scale.set(depth, height, frontage);
    body.position.y = height / 2;
    group.add(body);

    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.scale.set(depth + 0.28, 1, frontage + 0.18);
    roof.position.y = height + 0.09;
    group.add(roof);

    // face > 0: placa na face +X (prédio da esquerda, olhando pra rua).
    const face = -hand;
    const sign = new THREE.Mesh(signGeo, signs[(Math.random() * signs.length) | 0]);
    sign.scale.set(Math.min(frontage * 0.72, 3.5), 1.22, 1);
    sign.position.set(face * (depth / 2 + 0.05), Math.min(2.7, Math.max(1.7, height * 0.28)), frontage * 0.02);
    sign.rotation.y = face > 0 ? Math.PI / 2 : -Math.PI / 2;
    sign.visible = Math.random() < 0.8;
    group.add(sign);

    const graf = new THREE.Mesh(grafGeo, graffiti[(Math.random() * graffiti.length) | 0]);
    graf.scale.set(1.35, 1.35, 1);
    graf.position.set(face * (depth / 2 + 0.045), Math.min(height - 1, 3.4), -frontage * 0.28);
    graf.rotation.y = sign.rotation.y;
    graf.visible = Math.random() < 0.4;
    group.add(graf);

    const tankMat = Math.random() < 0.45 ? tankBlack : tankBlue;
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(depth * 0.12, height + 0.52, -frontage * 0.12);
    tank.visible = Math.random() < 0.72;
    group.add(tank);
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.set(tank.position.x, height + 1.0, tank.position.z);
    lid.visible = tank.visible;
    group.add(lid);

    const antenna = new THREE.Group();
    const mast = new THREE.Mesh(antGeo, poleMat);
    const bar = new THREE.Mesh(antBar, poleMat);
    bar.position.y = 0.35;
    antenna.add(mast, bar);
    antenna.position.set(-depth * 0.15, height + 1.25, frontage * 0.15);
    antenna.visible = Math.random() < 0.55;
    group.add(antenna);

    const ac = new THREE.Mesh(acGeo, acMat);
    ac.position.set(face * (depth / 2 + 0.16), Math.min(height - 0.8, 2.4 + Math.random() * 2), frontage * 0.22);
    ac.visible = height > 6 && Math.random() < 0.65;
    group.add(ac);

    return { group, body, roof, mat, sign, graf, tank, lid, antenna, ac, frontage, depth, face };
  }

  function rerollBuilding(b) {
    const height = 5 + Math.random() ** 1.35 * 20;
    b.body.scale.y = height;
    b.body.position.y = height / 2;
    b.roof.position.y = height + 0.09;
    const repY = Math.max(1, height / 3.3);
    b.mat.map.repeat.y = repY;
    b.mat.emissiveMap.repeat.y = repY;
    b.sign.position.y = Math.min(2.9, Math.max(1.7, height * 0.27));
    b.sign.material = signs[(Math.random() * signs.length) | 0];
    b.sign.visible = Math.random() < 0.75;
    b.tank.visible = Math.random() < 0.72;
    b.tank.position.y = height + 0.52;
    b.lid.visible = b.tank.visible;
    b.lid.position.y = height + 1.0;
    b.antenna.position.y = height + 1.25;
    b.antenna.visible = Math.random() < 0.5;
    b.graf.position.y = Math.min(height - 1.1, 2.2 + Math.random() * Math.max(1, height * 0.35));
    b.ac.position.y = Math.min(height - 0.8, 2.2 + Math.random() * 2.5);
    b.ac.visible = height > 6 && Math.random() < 0.6;
  }

  function makeLamp(hand, z) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 6.3, 6), poleMat);
    pole.position.y = 3.15;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.07, 0.07), poleMat);
    arm.position.set(-hand * 0.5, 6.25, 0);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), bulbMat);
    bulb.position.set(-hand * 1.0, 6.05, 0);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.15, 4.4, 8, 1, true), coneMat);
    cone.position.set(-hand * 1.0, 3.7, 0);
    cone.rotation.x = Math.PI;
    g.add(pole, arm, bulb, cone);
    g.position.set(hand * (ROAD_W / 2 + 0.5), 0, z);
    return g;
  }

  function buildChunk(index) {
    const group = new THREE.Group();

    const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, CHUNK_LEN), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0;
    group.add(road);

    for (const hand of [-1, 1]) {
      const side = new THREE.Mesh(new THREE.BoxGeometry(SIDE_W, 0.22, CHUNK_LEN), sideMat);
      side.position.set(hand * (ROAD_W / 2 + SIDE_W / 2), 0.11, 0);
      group.add(side);
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.28, CHUNK_LEN), curbMat);
      curb.position.set(hand * (ROAD_W / 2 + 0.08), 0.1, 0);
      group.add(curb);
    }

    if (index % 2 === 0) {
      const cw = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W * 0.94, 2.3), crossMat);
      cw.rotation.x = -Math.PI / 2;
      cw.position.set(0, 0.025, CHUNK_LEN * 0.18);
      group.add(cw);
    }

    for (let p = 0; p < 3; p++) {
      const puddle = new THREE.Mesh(puddleGeo, puddleMat);
      puddle.rotation.x = -Math.PI / 2;
      const rad = 0.35 + Math.random() * 0.85;
      puddle.scale.set(rad, 0.55 + Math.random() * 0.8, 1);
      puddle.position.set((Math.random() - 0.5) * (ROAD_W - 1.4), 0.03, (Math.random() - 0.5) * (CHUNK_LEN - 6));
      group.add(puddle);
    }

    const buildings = [];
    for (const hand of [-1, 1]) {
      let cursor = -CHUNK_LEN / 2 + 3;
      const limit = CHUNK_LEN / 2 - 3;
      while (cursor < limit) {
        const frontage = 6.4 + Math.random() * 3.4;
        const depth = 6.2 + Math.random() * 2.4;
        const height = 5 + Math.random() ** 1.35 * 20;
        if (cursor + frontage > limit) break;
        const b = makeBuilding(hand, frontage, depth, height);
        b.group.position.set(hand * (ROAD_W / 2 + SIDE_W + depth / 2 + 0.15), 0, cursor + frontage / 2);
        group.add(b.group);
        buildings.push(b);
        cursor += frontage + 0.8 + Math.random() * 1.6;
      }

      const z1 = -CHUNK_LEN * 0.22;
      const z2 = CHUNK_LEN * 0.22;
      group.add(makeLamp(hand, z1));
      group.add(makeLamp(hand, z2));
      const wire = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(hand * (ROAD_W / 2 + 0.5), 6.35, z1),
        new THREE.Vector3(hand * (ROAD_W / 2 + 0.5), 6.05, (z1 + z2) / 2),
        new THREE.Vector3(hand * (ROAD_W / 2 + 0.5), 6.35, z2),
      ]);
      group.add(new THREE.Line(wire, wireMat));
    }

    return { group, buildings };
  }

  function recycle(scroll) {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const worldZ = scroll + chunk.group.position.z;
      if (worldZ > CHUNK_LEN * 0.75) {
        chunk.group.position.z -= CHUNK_LEN * CHUNK_COUNT;
        for (let b = 0; b < chunk.buildings.length; b++) rerollBuilding(chunk.buildings[b]);
      }
    }
  }

  function update(time) {
    const s = 2.55 + Math.sin(time * 2.2) * 0.28;
    bulbMat.color.setRGB(s, s * 0.7, s * 0.4);
  }

  return { root, recycle, update };
}

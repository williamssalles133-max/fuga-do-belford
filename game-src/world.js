// Rua de dia, densa: sobrados de reboco, comércio com toldo, poste e
// o emaranhado de fios. Tudo que não anima vai num mesh só por trecho.

import * as THREE from 'three';
import { CHUNK_LEN, CHUNK_COUNT, ROAD_W, SIDE_W } from './config.js';
import {
  makeAsphaltTexture,
  makeSidewalkTexture,
  makeRoofTexture,
  makeAwningTexture,
  makeFacadeAtlas,
  makeFabricTexture,
  makeFaceTexture,
} from './textures.js';

export function createWorld() {
  const root = new THREE.Group();
  const atlas = makeFacadeAtlas();
  const facadeMat = new THREE.MeshStandardMaterial({
    map: atlas.texture,
    roughness: 0.9,
    metalness: 0.02,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    map: makeRoofTexture(),
    roughness: 0.85,
    metalness: 0.05,
  });
  roofMat.map.wrapS = roofMat.map.wrapT = THREE.RepeatWrapping;
  const awningMat = new THREE.MeshStandardMaterial({
    map: makeAwningTexture(),
    roughness: 0.7,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
  const roadMat = new THREE.MeshStandardMaterial({
    map: makeAsphaltTexture(),
    roughness: 0.92,
    metalness: 0.02,
  });
  const sideMat = new THREE.MeshStandardMaterial({
    map: makeSidewalkTexture(),
    roughness: 0.95,
    metalness: 0,
  });
  const curbMat = new THREE.MeshStandardMaterial({ color: 0xc4beb2, roughness: 0.85, metalness: 0 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x9a968e, roughness: 0.75, metalness: 0.08 });
  const cableMat = new THREE.LineBasicMaterial({ color: 0x24262b });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x8e9398, roughness: 0.45, metalness: 0.6 });
  const manholeMat = new THREE.MeshStandardMaterial({ color: 0x5c6166, roughness: 0.7, metalness: 0.4 });
  const bollardMat = new THREE.MeshStandardMaterial({ color: 0xd8a12a, roughness: 0.6, metalness: 0.1 });

  const people = createPeopleMaterials();
  const chunks = [];
  const anims = [];

  for (let i = 0; i < CHUNK_COUNT; i++) {
    const chunk = buildChunk(i);
    chunk.group.position.z = -i * CHUNK_LEN;
    root.add(chunk.group);
    chunks.push(chunk);
  }

  function buildChunk(index) {
    const group = new THREE.Group();
    const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, CHUNK_LEN), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    group.add(road);

    for (const hand of [-1, 1]) {
      const side = new THREE.Mesh(new THREE.BoxGeometry(SIDE_W, 0.18, CHUNK_LEN), sideMat);
      side.position.set(hand * (ROAD_W / 2 + SIDE_W / 2), 0.1, 0);
      side.receiveShadow = true;
      group.add(side);
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, CHUNK_LEN), curbMat);
      curb.position.set(hand * (ROAD_W / 2 + 0.06), 0.12, 0);
      group.add(curb);
    }

    const buildings = new MeshBuilder();
    const roofs = new MeshBuilder();
    const awnings = new MeshBuilder();
    const poles = new MeshBuilder();
    const cablePts = [];
    const bollards = new MeshBuilder();

    for (const hand of [-1, 1]) {
      let cursor = -CHUNK_LEN / 2 + 2.5;
      const limit = CHUNK_LEN / 2 - 2.5;
      const poleZs = [];
      while (cursor < limit) {
        const frontage = 5.2 + Math.random() * 2.8;
        const depth = 6.4 + Math.random() * 2.2;
        const height = 5.5 + Math.random() * 7.5;
        if (cursor + frontage > limit) break;
        const cz = cursor + frontage / 2;
        // Fachada recuada da guia: sobra calçada pra poste, pedestre e carro parado.
        const cx = hand * (ROAD_W / 2 + 3.05 + depth / 2);
        const cell = atlas.cells[(Math.random() * atlas.cells.length) | 0];
        addBuilding(buildings, roofs, awnings, cx, cz, depth, height, frontage, hand, cell);
        if (Math.random() < 0.55) {
          // Toldo na calçada, listrado verde e branco.
          addAwning(awnings, hand, cx, cz, depth, frontage);
        }
        cursor += frontage + 0.25 + Math.random() * 0.7;
      }

      let pz = -CHUNK_LEN / 2 + 6;
      while (pz < CHUNK_LEN / 2 - 4) {
        poleZs.push(pz);
        addPole(poles, hand * (ROAD_W / 2 + 0.35), pz);
        pz += 9 + Math.random() * 3;
      }
      for (let p = 0; p < poleZs.length - 1; p++) {
        addCables(cablePts, hand * (ROAD_W / 2 + 0.35), poleZs[p], poleZs[p + 1], hand);
      }
      // Fios cruzando a rua, só de um lado pra não duplicar.
      if (hand === -1) {
        for (let p = 0; p < poleZs.length; p += 2) {
          const z = poleZs[p];
          sagLine(cablePts, -ROAD_W / 2 - 0.2, 7.1, z, ROAD_W / 2 + 0.2, 6.4, z + 1.5, 0.9);
        }
      }

      // Pedestres na calçada. Fora das faixas.
      const walkers = 2;
      for (let n = 0; n < walkers; n++) {
        const ped = makePedestrian(people, index * 4 + n + (hand > 0 ? 2 : 0));
        const z = -CHUNK_LEN / 2 + 8 + n * (CHUNK_LEN / (walkers + 0.5));
        ped.group.position.set(hand * (ROAD_W / 2 + 0.95), 0, z);
        ped.group.rotation.y = hand > 0 ? Math.PI : 0;
        group.add(ped.group);
        anims.push(ped);
      }

      // Meio-fio com baliza, também fora da pista.
      for (let b = 0; b < 3; b++) {
        const bz = -CHUNK_LEN * 0.3 + b * 12;
        addBollard(bollards, hand * (ROAD_W / 2 + 0.45), bz);
      }
    }

    group.add(meshFrom(buildings, facadeMat));
    group.add(meshFrom(roofs, roofMat));
    const awningMesh = meshFrom(awnings, awningMat);
    if (awningMesh) group.add(awningMesh);
    group.add(meshFrom(poles, poleMat));
    group.add(meshFrom(bollards, bollardMat));

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(cablePts, 3));
    group.add(new THREE.LineSegments(lineGeo, cableMat));

    // Tampas de bueiro no asfalto.
    for (let m = 0; m < 2; m++) {
      const cap = new THREE.Mesh(new THREE.CircleGeometry(0.42, 12), manholeMat);
      cap.rotation.x = -Math.PI / 2;
      cap.position.set((m === 0 ? -1.1 : 1.4), 0.025, -8 + m * 18 + index);
      group.add(cap);
    }

    // Carro estacionado na guia, só cenário.
    if (index % 2 === 0) {
      const parked = parkedCar(handColor(index));
      const side = index % 4 === 0 ? -1 : 1;
      parked.position.set(side * (ROAD_W / 2 + 2.05), 0, 6);
      parked.rotation.y = side < 0 ? 0 : Math.PI;
      group.add(parked);
    }

    return { group };
  }

  function recycle(scroll) {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const worldZ = scroll + chunk.group.position.z;
      if (worldZ > CHUNK_LEN * 0.75) {
        chunk.group.position.z -= CHUNK_LEN * CHUNK_COUNT;
      }
    }
  }

  function update(time) {
    for (let i = 0; i < anims.length; i++) {
      const ped = anims[i];
      const t = time * 3.2 + ped.phase;
      ped.legs[0].rotation.x = Math.sin(t) * 0.45;
      ped.legs[1].rotation.x = Math.sin(t + Math.PI) * 0.45;
      ped.arms[0].rotation.x = Math.sin(t + Math.PI) * 0.35;
      ped.arms[1].rotation.x = Math.sin(t) * 0.35;
    }
  }

  return { root, recycle, update };
}

function handColor(index) {
  return [0xf4f1ea, 0xb7bcc2, 0x3e4650, 0xf0c400][index % 4];
}

function parkedCar(hex) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.45, metalness: 0.3 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.7, 4), mat);
  body.position.y = 0.7;
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 2), mat);
  top.position.set(0, 1.2, -0.2);
  g.add(body, top);
  return g;
}

function addBuilding(buildings, roofs, awnings, cx, cz, depth, height, frontage, hand, cell) {
  const x0 = cx - depth / 2;
  const x1 = cx + depth / 2;
  const z0 = cz - frontage / 2;
  const z1 = cz + frontage / 2;
  const y0 = 0;
  const y1 = height;
  // Fachada que olha a rua. Prédio à esquerda (hand < 0) mostra a face +X.
  const streetX = hand < 0 ? x1 : x0;
  const n = new THREE.Vector3(hand < 0 ? 1 : -1, 0, 0);
  const vTop = height < 7 ? cell.vBottom + (cell.vTop - cell.vBottom) * 0.62 : cell.vTop;
  quad(
    buildings,
    [
      new THREE.Vector3(streetX, y0, z0),
      new THREE.Vector3(streetX, y0, z1),
      new THREE.Vector3(streetX, y1, z1),
      new THREE.Vector3(streetX, y1, z0),
    ],
    n,
    [cell.u0, cell.vBottom, cell.u1, cell.vBottom, cell.u1, vTop, cell.u0, vTop]
  );
  // Testas (empenas) com o mesmo reboco, um pouco mais estreitas na UV.
  const midU = (cell.u0 + cell.u1) * 0.5;
  const sideN0 = new THREE.Vector3(0, 0, -1);
  quad(
    buildings,
    [
      new THREE.Vector3(x0, y0, z0),
      new THREE.Vector3(x1, y0, z0),
      new THREE.Vector3(x1, y1, z0),
      new THREE.Vector3(x0, y1, z0),
    ],
    sideN0,
    [cell.u0, cell.vBottom, midU, cell.vBottom, midU, vTop, cell.u0, vTop]
  );
  quad(
    buildings,
    [
      new THREE.Vector3(x1, y0, z1),
      new THREE.Vector3(x0, y0, z1),
      new THREE.Vector3(x0, y1, z1),
      new THREE.Vector3(x1, y1, z1),
    ],
    new THREE.Vector3(0, 0, 1),
    [cell.u0, cell.vBottom, midU, cell.vBottom, midU, vTop, cell.u0, vTop]
  );
  quad(
    roofs,
    [
      new THREE.Vector3(x0, y1, z0),
      new THREE.Vector3(x1, y1, z0),
      new THREE.Vector3(x1, y1, z1),
      new THREE.Vector3(x0, y1, z1),
    ],
    new THREE.Vector3(0, 1, 0),
    [0, 0, depth / 2, 0, depth / 2, frontage / 2, 0, frontage / 2]
  );
  // Caixa d'água em parte dos telhados — comum, mas não em todo sobrado.
  if (height > 8 && Math.random() < 0.4) {
    const tx = cx + depth * 0.15;
    const tz = cz;
    const ty = y1;
    quad(
      roofs,
      [
        new THREE.Vector3(tx - 0.35, ty, tz - 0.35),
        new THREE.Vector3(tx + 0.35, ty, tz - 0.35),
        new THREE.Vector3(tx + 0.35, ty + 0.7, tz - 0.35),
        new THREE.Vector3(tx - 0.35, ty + 0.7, tz - 0.35),
      ],
      new THREE.Vector3(0, 0, -1),
      [0, 0, 1, 0, 1, 1, 0, 1]
    );
  }
  awnings;
}

function addAwning(awnings, hand, cx, cz, depth, frontage) {
  const reach = 1.35;
  const y = 3.05;
  const xWall = cx + (hand < 0 ? depth / 2 : -depth / 2);
  const xOut = xWall + (hand < 0 ? reach : -reach);
  const z0 = cz - Math.min(frontage * 0.42, 2.2);
  const z1 = cz + Math.min(frontage * 0.42, 2.2);
  const yOut = y - 0.35;
  quad(
    awnings,
    [
      new THREE.Vector3(xWall, y, z0),
      new THREE.Vector3(xWall, y, z1),
      new THREE.Vector3(xOut, yOut, z1),
      new THREE.Vector3(xOut, yOut, z0),
    ],
    new THREE.Vector3(0, 1, 0),
    [0, 0, 4, 0, 4, 1, 0, 1]
  );
}

function addPole(poles, x, z) {
  const h = 7.6;
  // Poste de concreto, seção retangular, com cruzeta.
  box(poles, x, h / 2, z, 0.18, h, 0.18);
  box(poles, x, h - 0.15, z, 1.4, 0.08, 0.08);
  box(poles, x + 0.15, 5.1, z, 0.28, 0.34, 0.22);
}

function addBollard(b, x, z) {
  box(b, x, 0.28, z, 0.12, 0.56, 0.12);
}

function addCables(pts, x, z0, z1, hand) {
  const heights = [7.35, 7.05, 6.7, 6.35, 5.9];
  for (let i = 0; i < heights.length; i++) {
    const sag = 0.35 + (i % 3) * 0.22;
    const xB = x + hand * (0.15 + (i % 2) * 0.25);
    sagLine(pts, x, heights[i], z0, xB, heights[i] - 0.05, z1, sag);
  }
}

function sagLine(pts, x0, y0, z0, x1, y1, z1, sag) {
  const steps = 6;
  for (let i = 0; i < steps; i++) {
    const a = i / steps;
    const b = (i + 1) / steps;
    pts.push(sample(a), sampleY(a), sampleZ(a), sample(b), sampleY(b), sampleZ(b));
  }
  function sample(t) { return x0 + (x1 - x0) * t; }
  function sampleZ(t) { return z0 + (z1 - z0) * t; }
  function sampleY(t) {
    const base = y0 + (y1 - y0) * t;
    return base - Math.sin(t * Math.PI) * sag;
  }
}

function box(builder, x, y, z, w, h, d) {
  const x0 = x - w / 2;
  const x1 = x + w / 2;
  const y0 = y - h / 2;
  const y1 = y + h / 2;
  const z0 = z - d / 2;
  const z1 = z + d / 2;
  quad(builder, v(x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1), new THREE.Vector3(0, 0, 1), [0, 0, 1, 0, 1, 1, 0, 1]);
  quad(builder, v(x1, y0, z0, x0, y0, z0, x0, y1, z0, x1, y1, z0), new THREE.Vector3(0, 0, -1), [0, 0, 1, 0, 1, 1, 0, 1]);
  quad(builder, v(x1, y0, z1, x1, y0, z0, x1, y1, z0, x1, y1, z1), new THREE.Vector3(1, 0, 0), [0, 0, 1, 0, 1, 1, 0, 1]);
  quad(builder, v(x0, y0, z0, x0, y0, z1, x0, y1, z1, x0, y1, z0), new THREE.Vector3(-1, 0, 0), [0, 0, 1, 0, 1, 1, 0, 1]);
}

function v(x0, y0, z0, x1, y1, z1, x2, y2, z2, x3, y3, z3) {
  return [
    new THREE.Vector3(x0, y0, z0),
    new THREE.Vector3(x1, y1, z1),
    new THREE.Vector3(x2, y2, z2),
    new THREE.Vector3(x3, y3, z3),
  ];
}

function createPeopleMaterials() {
  const skins = [0x8d5a3c, 0xc48a62, 0x5c3a28, 0xd7a57a, 0x3f291c].map(
    (hex) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.72, metalness: 0 })
  );
  const shirts = ['#f2f2f2', '#1f4f8a', '#c5363a', '#22262c', '#e7b7c8', '#2f6b45'].map(
    (hex) => new THREE.MeshStandardMaterial({ map: makeFabricTexture(hex, Math.random() < 0.4), roughness: 0.8, metalness: 0 })
  );
  const shorts = new THREE.MeshStandardMaterial({ color: 0x3a4250, roughness: 0.85, metalness: 0 });
  const pants = new THREE.MeshStandardMaterial({ color: 0xded6c8, roughness: 0.85, metalness: 0 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x1a120e, roughness: 0.8, metalness: 0 });
  const pack = new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.7, metalness: 0.05 });
  const faces = ['#c48a62', '#8d5a3c', '#d7a57a', '#5c3a28'].map((tone) => makeFaceTexture(tone));
  return { skins, shirts, shorts, pants, hair, pack, faces };
}

function makePedestrian(lib, seed) {
  const g = new THREE.Group();
  const skin = lib.skins[seed % lib.skins.length];
  const shirt = lib.shirts[seed % lib.shirts.length];
  const bottom = seed % 2 === 0 ? lib.shorts : lib.pants;
  const hip = 0.9;

  const legs = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.09, hip, 0);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.55, 3, 5), bottom);
    leg.position.y = -0.32;
    pivot.add(leg);
    g.add(pivot);
    legs.push(pivot);
  }
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.48, 0.2), shirt);
  torso.position.set(0, hip + 0.28, 0);
  g.add(torso);

  const arms = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.24, hip + 0.46, 0);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.4, 2, 5), skin);
    arm.position.y = -0.22;
    pivot.add(arm);
    g.add(pivot);
    arms.push(pivot);
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), skin);
  head.position.set(0, hip + 0.66, 0);
  g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.125, 10, 8), lib.hair);
  hair.position.set(0, hip + 0.7, 0);
  hair.scale.y = 0.75;
  g.add(hair);
  const faceMat = new THREE.MeshBasicMaterial({ map: lib.faces[seed % lib.faces.length] });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.16), faceMat);
  face.position.set(0, hip + 0.64, 0.11);
  g.add(face);

  if (seed % 3 === 0) {
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.12), lib.pack);
    backpack.position.set(0, hip + 0.32, -0.14);
    g.add(backpack);
  }

  return { group: g, legs, arms, phase: seed * 1.7 };
}

function MeshBuilder() {
  this.pos = [];
  this.nrm = [];
  this.uv = [];
  this.idx = [];
}

function quad(builder, corners, normal, uv) {
  const e1x = corners[1].x - corners[0].x;
  const e1y = corners[1].y - corners[0].y;
  const e1z = corners[1].z - corners[0].z;
  const e2x = corners[2].x - corners[0].x;
  const e2y = corners[2].y - corners[0].y;
  const e2z = corners[2].z - corners[0].z;
  const nx = e1y * e2z - e1z * e2y;
  const ny = e1z * e2x - e1x * e2z;
  const nz = e1x * e2y - e1y * e2x;
  let c = corners;
  let u = uv;
  if (nx * normal.x + ny * normal.y + nz * normal.z < 0) {
    c = [corners[0], corners[3], corners[2], corners[1]];
    u = [uv[0], uv[1], uv[6], uv[7], uv[4], uv[5], uv[2], uv[3]];
  }
  const base = builder.pos.length / 3;
  for (let i = 0; i < 4; i++) {
    builder.pos.push(c[i].x, c[i].y, c[i].z);
    builder.nrm.push(normal.x, normal.y, normal.z);
    builder.uv.push(u[i * 2], u[i * 2 + 1]);
  }
  builder.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

function meshFrom(builder, material) {
  if (!builder.pos.length) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(builder.pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(builder.nrm, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(builder.uv, 2));
  geo.setIndex(builder.idx);
  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true;
  return mesh;
}

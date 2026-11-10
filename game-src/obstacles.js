// Moto, ônibus lotado e buraco. Farol virado pra câmera de propósito:
// no nevoeiro o perigo aparece primeiro como luz, não como silhueta.

import * as THREE from 'three';
import { LANE_X, PLAYER_HW, PLAYER_HD, JUMP_CLEAR_Y } from './config.js';
import { holeLength } from './logic.js';
import { makeBusWindowTexture, makeDestinationTexture, makeGlowTexture, makeStripeTexture } from './textures.js';

export function createTraffic(parent) {
  const glowTex = makeGlowTexture();
  const windowsTex = makeBusWindowTexture();
  const destTex = makeDestinationTexture('BELFORD ROXO');
  const lotadoTex = makeDestinationTexture('LOTADO');
  const stripeTex = makeStripeTexture();

  const rubber = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.85, metalness: 0.15 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xcfd3da, roughness: 0.28, metalness: 0.85 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1c22, roughness: 0.5, metalness: 0.4 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xf3efe4, roughness: 0.38, metalness: 0.22, envMapIntensity: 0.7 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x1d4e9e, roughness: 0.4, metalness: 0.2 });
  const red = new THREE.MeshStandardMaterial({ color: 0xdc1024, roughness: 0.32, metalness: 0.55, envMapIntensity: 0.8 });
  const yellow = new THREE.MeshStandardMaterial({ color: 0xffc400, roughness: 0.45, metalness: 0.15 });
  const skin = new THREE.MeshStandardMaterial({ color: 0x8d552f, roughness: 0.7, metalness: 0 });
  const jacket = new THREE.MeshStandardMaterial({ color: 0x20242e, roughness: 0.6, metalness: 0.1 });
  const visor = new THREE.MeshBasicMaterial({ color: 0x19e6ff });
  visor.color.multiplyScalar(2.4);
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2244 });
  tailMat.color.multiplyScalar(2.2);
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff4d2 });
  headMat.color.multiplyScalar(4.5);
  const glowMat = new THREE.SpriteMaterial({
    map: glowTex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  glowMat.color.multiplyScalar(1.8);
  const splashMat = new THREE.MeshBasicMaterial({
    map: glowTex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.7,
  });
  const winMat = new THREE.MeshBasicMaterial({ map: windowsTex });
  winMat.color.multiplyScalar(1.25);
  const destMat = new THREE.MeshBasicMaterial({ map: destTex });
  destMat.color.multiplyScalar(1.8);
  const lotadoMat = new THREE.MeshBasicMaterial({ map: lotadoTex });
  lotadoMat.color.multiplyScalar(1.5);
  const glass = new THREE.MeshStandardMaterial({
    color: 0x102028,
    roughness: 0.08,
    metalness: 0.75,
    emissive: 0x163028,
    emissiveIntensity: 0.7,
  });
  const coneOrange = new THREE.MeshStandardMaterial({
    color: 0xff5a00,
    roughness: 0.45,
    metalness: 0.08,
    emissive: 0xff3b00,
    emissiveIntensity: 0.7,
  });
  const coneBand = new THREE.MeshBasicMaterial({ color: 0xfff3cc });
  const holeMat = new THREE.MeshBasicMaterial({ color: 0x05060a });
  const stripeMat = new THREE.MeshBasicMaterial({ map: stripeTex });
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffcc55 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.4, metalness: 0.7 });

  const motoWheel = new THREE.CylinderGeometry(0.34, 0.34, 0.14, 14);
  const busWheel = new THREE.CylinderGeometry(0.42, 0.42, 0.28, 16);

  const motos = [];
  const buses = [];
  const holes = [];

  for (let i = 0; i < 6; i++) motos.push(makeMoto());
  for (let i = 0; i < 4; i++) buses.push(makeBus());
  for (let i = 0; i < 6; i++) holes.push(makeHole());

  const all = motos.concat(buses, holes);
  for (const ob of all) {
    ob.visible = false;
    parent.add(ob);
  }

  function makeWheel(geo, radiusY) {
    const axle = new THREE.Group();
    axle.rotation.z = Math.PI / 2;
    const tire = new THREE.Mesh(geo, rubber);
    axle.add(tire);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(radiusY * 0.35, radiusY * 0.35, geo.parameters.height + 0.02, 8), metal);
    axle.add(hub);
    return { axle, tire };
  }

  function addHeadlight(group, x, y, z, scale) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), headMat);
    bulb.position.set(x, y, z);
    group.add(bulb);
    const sprite = new THREE.Sprite(glowMat);
    sprite.position.set(x, y, z + 0.08);
    sprite.scale.setScalar(scale);
    group.add(sprite);
    const splash = new THREE.Mesh(new THREE.CircleGeometry(0.55, 12), splashMat);
    splash.rotation.x = -Math.PI / 2;
    splash.position.set(x, 0.045, z + 1.1);
    splash.scale.set(scale * 0.55, scale * 0.9, 1);
    group.add(splash);
  }

  function makeMoto() {
    const g = new THREE.Group();
    const wheels = [];
    const front = makeWheel(motoWheel, 0.34);
    front.axle.position.set(0, 0.34, 0.85);
    const back = makeWheel(motoWheel, 0.34);
    back.axle.position.set(0, 0.34, -0.75);
    g.add(front.axle, back.axle);
    wheels.push(front.tire, back.tire);

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 1.35), red);
    body.position.set(0, 0.62, 0.05);
    g.add(body);
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.55), red);
    tank.position.set(0, 0.82, 0.25);
    tank.rotation.x = -0.3;
    g.add(tank);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.48), dark);
    seat.position.set(0, 0.78, -0.25);
    g.add(seat);

    const rider = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.48, 0.28), jacket);
    torso.position.set(0, 1.15, -0.15);
    torso.rotation.x = 0.45;
    rider.add(torso);
    const helm = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), dark);
    helm.position.set(0, 1.48, 0.02);
    rider.add(helm);
    const vis = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.06), visor);
    vis.position.set(0, 1.48, 0.16);
    rider.add(vis);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.32, 0.1), jacket);
    arm.position.set(0.18, 1.2, 0.25);
    arm.rotation.x = 1.1;
    rider.add(arm);
    g.add(rider);

    const box = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 0.42), yellow);
    box.position.set(0, 0.95, -0.85);
    g.add(box);

    addHeadlight(g, 0, 0.72, 1.15, 2.4);
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), tailMat);
    tail.position.set(0, 0.7, -1.15);
    g.add(tail);

    // Um pouco maior que a escala real: no celular a moto precisa ser lida de longe.
    g.scale.setScalar(1.2);
    g.userData = { type: 'moto', hw: 0.55, hd: 1.25, active: false, passed: false, hit: false, wheels };
    return g;
  }

  function makeBus() {
    const g = new THREE.Group();
    const wheels = [];
    const spots = [
      [-0.85, 2.35],
      [0.85, 2.35],
      [-0.85, -2.15],
      [0.85, -2.15],
    ];
    for (const [x, z] of spots) {
      const w = makeWheel(busWheel, 0.42);
      w.axle.position.set(x, 0.42, z);
      g.add(w.axle);
      wheels.push(w.tire);
    }

    const skirt = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.46, 7.5), dark);
    skirt.position.set(0, 0.7, 0);
    g.add(skirt);
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.55, 7.2), cream);
    body.position.set(0, 1.62, 0);
    g.add(body);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.22, 7.25), blue);
    stripe.position.set(0, 1.15, 0);
    g.add(stripe);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.16, 6.6), blue);
    roof.position.set(0, 2.46, 0);
    g.add(roof);

    const sideGeo = new THREE.PlaneGeometry(6.3, 0.78);
    const sideL = new THREE.Mesh(sideGeo, winMat);
    sideL.position.set(-1.01, 1.9, 0.05);
    sideL.rotation.y = -Math.PI / 2;
    const sideR = new THREE.Mesh(sideGeo, winMat);
    sideR.position.set(1.01, 1.9, 0.05);
    sideR.rotation.y = Math.PI / 2;
    g.add(sideL, sideR);

    const wind = new THREE.Mesh(new THREE.PlaneGeometry(1.72, 0.82), glass);
    wind.position.set(0, 1.95, 3.62);
    g.add(wind);
    const dest = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 0.4), destMat);
    dest.position.set(0, 2.48, 3.64);
    g.add(dest);
    const lotado = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.32), lotadoMat);
    lotado.position.set(1.02, 2.25, 2.4);
    lotado.rotation.y = Math.PI / 2;
    g.add(lotado);

    addHeadlight(g, -0.62, 0.78, 3.78, 2.8);
    addHeadlight(g, 0.62, 0.78, 3.78, 2.8);
    for (const x of [-0.7, 0.7]) {
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.06), tailMat);
      tail.position.set(x, 0.85, -3.72);
      g.add(tail);
    }

    g.userData = { type: 'onibus', hw: 0.98, hd: 3.55, active: false, passed: false, hit: false, wheels };
    return g;
  }

  function makeHole() {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4.5), stripeMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    ring.name = 'ring';
    const crater = new THREE.Mesh(new THREE.PlaneGeometry(1.65, 4), holeMat);
    crater.rotation.x = -Math.PI / 2;
    crater.position.y = 0.035;
    crater.name = 'crater';
    g.add(ring, crater);

    function cone(x, z) {
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.45, 8), coneOrange);
      c.position.set(x, 0.24, z);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.08, 8), coneBand);
      band.position.y = 0.02;
      c.add(band);
      return c;
    }
    const coneA = cone(0.95, 2);
    coneA.name = 'coneA';
    const coneB = cone(0.95, -2);
    coneB.name = 'coneB';
    const coneC = cone(-0.95, 2);
    coneC.name = 'coneC';
    const coneD = cone(-0.95, -2);
    coneD.name = 'coneD';
    g.add(coneA, coneB, coneC, coneD);

    const beaconPole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.2, 6), poleMat);
    beaconPole.name = 'beaconPole';
    beaconPole.position.set(-1.15, 0.6, 2.3);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), beaconMat);
    beacon.name = 'beacon';
    beacon.position.set(-1.15, 1.25, 2.3);
    g.add(beaconPole, beacon);

    g.userData = {
      type: 'buraco',
      hw: 0.9,
      hd: 2,
      active: false,
      passed: false,
      hit: false,
      wheels: [],
    };
    return g;
  }

  function configureHole(ob, length) {
    const half = length / 2;
    const crater = ob.getObjectByName('crater');
    const ring = ob.getObjectByName('ring');
    // Plano está no XY e deita com rotação X. Estica no Y local (= ao longo da rua).
    crater.scale.y = length / 4;
    ring.scale.y = (length + 0.55) / 4.5;
    ob.getObjectByName('coneA').position.z = half;
    ob.getObjectByName('coneC').position.z = half;
    ob.getObjectByName('coneB').position.z = -half;
    ob.getObjectByName('coneD').position.z = -half;
    ob.getObjectByName('beacon').position.z = half + 0.2;
    ob.getObjectByName('beaconPole').position.z = half + 0.2;
    ob.userData.hd = half * 0.82;
    ob.userData.hw = 0.9;
  }

  function spawn(type, lane, worldZ, scroll, difficulty) {
    const pool = type === 'moto' ? motos : type === 'onibus' ? buses : holes;
    const ob = pool.find((item) => !item.userData.active);
    if (!ob) return false;
    ob.userData.active = true;
    ob.userData.passed = false;
    ob.userData.hit = false;
    ob.visible = true;
    ob.position.x = LANE_X[lane];
    ob.position.y = 0;
    ob.position.z = worldZ - scroll;
    if (type === 'buraco') configureHole(ob, holeLength(difficulty));
    return true;
  }

  function clear() {
    for (const ob of all) {
      ob.userData.active = false;
      ob.visible = false;
    }
  }

  function update(dt, scroll, speed, playerX, playerY, onHit, onNear) {
    const blink = 1.5 + Math.sin(performance.now() * 0.012) * 1.15;
    beaconMat.color.setRGB(blink, blink * 0.58, blink * 0.1);

    for (const ob of all) {
      if (!ob.userData.active) continue;
      // Moto fecha um pouco mais rápido: parece que vem no corredor.
      if (ob.userData.type === 'moto') ob.position.z += dt * 5.4;

      const spin = dt * (speed + 8) * 0.9;
      const wheels = ob.userData.wheels;
      for (let i = 0; i < wheels.length; i++) wheels[i].rotation.y += spin;

      const worldZ = scroll + ob.position.z;
      if (worldZ > 12) {
        ob.userData.active = false;
        ob.visible = false;
        continue;
      }

      const overlapZ = Math.abs(worldZ) < ob.userData.hd + PLAYER_HD;
      const overlapX = Math.abs(ob.position.x - playerX) < ob.userData.hw + PLAYER_HW;
      if (overlapZ && overlapX && !ob.userData.hit) {
        const jumped = ob.userData.type === 'buraco' && playerY > JUMP_CLEAR_Y;
        if (!jumped) {
          ob.userData.hit = true;
          onHit(ob.userData.type);
          return;
        }
      }

      if (!ob.userData.passed && worldZ > 0.35) {
        ob.userData.passed = true;
        const gap = Math.abs(ob.position.x - playerX) - ob.userData.hw - PLAYER_HW;
        if (gap > 0 && gap < 0.6 && ob.userData.type !== 'buraco') onNear();
      }
    }
  }

  return { spawn, clear, update };
}

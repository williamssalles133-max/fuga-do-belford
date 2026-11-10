// Tráfego de dia: moto, carro, táxi amarelo, van e ônibus verde.
// Farol aceso só o bastante para ler o veículo contra o asfalto, sem bloom de noite.

import * as THREE from 'three';
import { LANE_X, PLAYER_HW, PLAYER_HD, JUMP_CLEAR_Y } from './config.js';
import { holeLength } from './logic.js';
import { makeTaxiSignTexture, makeBusDestTexture } from './textures.js';

export function createTraffic(parent) {
  const taxiSign = makeTaxiSignTexture();
  const busDest = makeBusDestTexture();

  const rubber = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9, metalness: 0.05 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xc5c8cc, roughness: 0.35, metalness: 0.75 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x8ea3ab, roughness: 0.12, metalness: 0.55 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.6, metalness: 0.3 });
  const paintWhite = paint(0xf4f1ea);
  const paintSilver = paint(0xb7bcc2);
  const paintDark = paint(0x3e4650);
  const paintYellow = paint(0xf0c400);
  const paintGreen = paint(0x1e7a3a);
  const paintRed = paint(0xb4232a);
  const skin = new THREE.MeshStandardMaterial({ color: 0x8d5a3c, roughness: 0.7, metalness: 0 });
  const cloth = new THREE.MeshStandardMaterial({ color: 0x2c3340, roughness: 0.8, metalness: 0 });
  const helmet = new THREE.MeshStandardMaterial({ color: 0x22262c, roughness: 0.4, metalness: 0.4 });
  const holeMat = new THREE.MeshStandardMaterial({ color: 0x2a2724, roughness: 1, metalness: 0 });
  const crackMat = new THREE.MeshStandardMaterial({ color: 0x8a8680, roughness: 0.95, metalness: 0 });
  const coneMat = new THREE.MeshStandardMaterial({ color: 0xd4652a, roughness: 0.7, metalness: 0.05 });
  const coneBand = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.6, metalness: 0 });

  const wheelGeo = {
    moto: new THREE.CylinderGeometry(0.32, 0.32, 0.12, 12),
    car: new THREE.CylinderGeometry(0.34, 0.34, 0.22, 14),
    bus: new THREE.CylinderGeometry(0.46, 0.46, 0.28, 14),
  };

  const motos = [];
  const cars = [];
  const taxis = [];
  const vans = [];
  const buses = [];
  const holes = [];

  for (let i = 0; i < 5; i++) motos.push(makeMoto());
  for (let i = 0; i < 4; i++) cars.push(makeCar(i % 2 === 0 ? paintWhite : paintSilver, false));
  for (let i = 0; i < 3; i++) taxis.push(makeCar(paintYellow, true));
  for (let i = 0; i < 3; i++) vans.push(makeVan());
  for (let i = 0; i < 3; i++) buses.push(makeBus());
  for (let i = 0; i < 5; i++) holes.push(makeHole());

  const all = motos.concat(cars, taxis, vans, buses, holes);
  for (const ob of all) {
    ob.visible = false;
    parent.add(ob);
  }

  function paint(hex) {
    return new THREE.MeshStandardMaterial({ color: hex, roughness: 0.42, metalness: 0.35 });
  }

  function makeWheel(geo) {
    const axle = new THREE.Group();
    axle.rotation.z = Math.PI / 2;
    const tire = new THREE.Mesh(geo, rubber);
    axle.add(tire);
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(geo.parameters.radiusTop * 0.42, geo.parameters.radiusTop * 0.42, geo.parameters.height + 0.02, 8),
      metal
    );
    axle.add(hub);
    return { axle, tire };
  }

  function addWheels(group, geo, spots, wheels) {
    for (const [x, z] of spots) {
      const w = makeWheel(geo);
      w.axle.position.set(x, geo.parameters.radiusTop, z);
      group.add(w.axle);
      wheels.push(w.tire);
    }
  }

  function makeMoto() {
    const g = new THREE.Group();
    const wheels = [];
    const front = makeWheel(wheelGeo.moto);
    front.axle.position.set(0, 0.32, 0.78);
    const back = makeWheel(wheelGeo.moto);
    back.axle.position.set(0, 0.32, -0.7);
    g.add(front.axle, back.axle);
    wheels.push(front.tire, back.tire);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 1.25), paintDark);
    frame.position.set(0, 0.58, 0.02);
    frame.castShadow = true;
    g.add(frame);
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.48), paintRed);
    tank.position.set(0, 0.74, 0.22);
    tank.castShadow = true;
    g.add(tank);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.42), dark);
    seat.position.set(0, 0.72, -0.22);
    g.add(seat);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.22), cloth);
    torso.position.set(0, 1.05, -0.12);
    torso.rotation.x = 0.35;
    torso.castShadow = true;
    g.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), helmet);
    head.position.set(0, 1.32, 0.02);
    head.castShadow = true;
    g.add(head);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.04), glass);
    visor.position.set(0, 1.32, 0.12);
    g.add(visor);

    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.08), metal);
    lamp.position.set(0, 0.62, 0.72);
    g.add(lamp);

    g.userData = { type: 'moto', hw: 0.48, hd: 1.15, active: false, passed: false, hit: false, wheels, rush: 4.2 };
    return g;
  }

  function makeCar(bodyMat, isTaxi) {
    const g = new THREE.Group();
    const wheels = [];
    addWheels(g, wheelGeo.car, [[-0.72, 1.15], [0.72, 1.15], [-0.72, -1.15], [0.72, -1.15]], wheels);
    const lower = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.48, 4.15), bodyMat);
    lower.position.set(0, 0.58, 0);
    lower.castShadow = true;
    g.add(lower);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.48, 2.15), bodyMat);
    cabin.position.set(0, 1.02, -0.15);
    cabin.castShadow = true;
    g.add(cabin);
    const wind = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.38, 0.06), glass);
    wind.position.set(0, 1.02, 0.95);
    g.add(wind);
    const rear = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.34, 0.06), glass);
    rear.position.set(0, 1.02, -1.2);
    g.add(rear);
    if (isTaxi) {
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.16, 0.16),
        new THREE.MeshStandardMaterial({ map: taxiSign, roughness: 0.5, metalness: 0.05 })
      );
      sign.position.set(0, 1.36, -0.1);
      g.add(sign);
    }
    // Placa clara na frente, ajuda a ler o carro de longe.
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.04), metal);
    plate.position.set(0, 0.48, 2.08);
    g.add(plate);
    g.userData = {
      type: isTaxi ? 'taxi' : 'carro',
      hw: 0.78,
      hd: 2.05,
      active: false,
      passed: false,
      hit: false,
      wheels,
      rush: isTaxi ? 2.4 : 1.6,
    };
    return g;
  }

  function makeVan() {
    const g = new THREE.Group();
    const wheels = [];
    addWheels(g, wheelGeo.car, [[-0.78, 1.45], [0.78, 1.45], [-0.78, -1.35], [0.78, -1.35]], wheels);
    const bodyMat = paint(0xf7f4ee);
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.78, 1.55, 4.7), bodyMat);
    body.position.set(0, 1.15, 0);
    body.castShadow = true;
    g.add(body);
    const wind = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 0.06), glass);
    wind.position.set(0, 1.45, 2.28);
    g.add(wind);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.16, 4.55), paint(0x2f6b45));
    stripe.position.set(0, 0.85, 0);
    g.add(stripe);
    g.userData = { type: 'van', hw: 0.9, hd: 2.35, active: false, passed: false, hit: false, wheels, rush: 1.1 };
    return g;
  }

  function makeBus() {
    const g = new THREE.Group();
    const wheels = [];
    addWheels(
      g,
      wheelGeo.bus,
      [[-0.95, 2.6], [0.95, 2.6], [-0.95, -2.4], [0.95, -2.4]],
      wheels
    );
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.55, 8.3), dark);
    skirt.position.set(0, 0.7, 0);
    skirt.castShadow = true;
    g.add(skirt);
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.08, 1.35, 8.05), paintGreen);
    body.position.set(0, 1.55, 0);
    body.castShadow = true;
    g.add(body);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.28, 7.6), paintWhite);
    roof.position.set(0, 2.28, 0);
    g.add(roof);
    const win = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.48, 6.4), glass);
    win.position.set(0, 1.85, -0.2);
    g.add(win);
    const dest = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 0.36),
      new THREE.MeshBasicMaterial({ map: busDest })
    );
    dest.position.set(0, 2.15, 4.05);
    g.add(dest);
    const lampL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.08), metal);
    const lampR = lampL.clone();
    lampL.position.set(-0.6, 0.72, 4.12);
    lampR.position.set(0.6, 0.72, 4.12);
    g.add(lampL, lampR);
    g.userData = { type: 'onibus', hw: 1.02, hd: 3.9, active: false, passed: false, hit: false, wheels, rush: 0 };
    return g;
  }

  function makeHole() {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.CircleGeometry(1.15, 18), crackMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    ring.name = 'ring';
    const crater = new THREE.Mesh(new THREE.CircleGeometry(0.82, 16), holeMat);
    crater.rotation.x = -Math.PI / 2;
    crater.position.y = 0.035;
    crater.name = 'crater';
    g.add(ring, crater);
    // Alongar o buraco no Z: os círculos escalam no Y local (= rua).
    function cone(x, z, name) {
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.38, 7), coneMat);
      c.position.set(x, 0.2, z);
      c.name = name;
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.07, 7), coneBand);
      band.position.y = 0.02;
      c.add(band);
      return c;
    }
    g.add(cone(0.7, 1.4, 'coneA'), cone(-0.7, -1.4, 'coneB'));
    g.userData = { type: 'buraco', hw: 0.85, hd: 1.6, active: false, passed: false, hit: false, wheels: [], rush: 0 };
    return g;
  }

  function configureHole(ob, length) {
    const s = length / 3.2;
    ob.getObjectByName('crater').scale.set(1, s, 1);
    ob.getObjectByName('ring').scale.set(1.05, s * 1.15, 1);
    ob.getObjectByName('coneA').position.z = length * 0.42;
    ob.getObjectByName('coneB').position.z = -length * 0.42;
    ob.userData.hd = length * 0.42;
    ob.userData.hw = 0.85;
  }

  function poolFor(type) {
    if (type === 'moto') return motos;
    if (type === 'carro') return cars;
    if (type === 'taxi') return taxis;
    if (type === 'van') return vans;
    if (type === 'onibus') return buses;
    return holes;
  }

  function spawn(type, lane, worldZ, scroll, difficulty) {
    const pool = poolFor(type);
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
    for (const ob of all) {
      if (!ob.userData.active) continue;
      if (ob.userData.rush) ob.position.z += dt * ob.userData.rush;
      const spin = dt * (speed + ob.userData.rush + 6) * 0.85;
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
        if (gap > 0 && gap < 0.55 && ob.userData.type !== 'buraco') onNear();
      }
    }
  }

  return { spawn, clear, update };
}

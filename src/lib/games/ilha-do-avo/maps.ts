import * as THREE from "three";
import type { SeededRng } from "./rng";
import type { MapId } from "./types";
import type { ObstacleCollider, SharedAssetLibrary } from "./models";

export interface MapLandmark {
  readonly x: number;
  readonly z: number;
  readonly label: string;
}

export interface BuiltMapScene {
  readonly mapId: MapId;
  readonly group: THREE.Group;
  readonly obstacles: ObstacleCollider[];
  readonly landmarks: MapLandmark[];
  readonly update: (visualTime: number, dt: number) => void;
  readonly disposables: Array<{ dispose: () => void }>;
}

const PLAYABLE_R = 96;
const VISUAL_R = 108;

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  return [canvas, ctx];
}

function finalizeTexture(canvas: HTMLCanvasElement, repeat = 1): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeat > 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat, repeat);
  }
  return tex;
}

/** Constrói a cena 3D completa de qualquer uma das 5 fases. */
export function buildMapScene(
  mapId: MapId,
  lib: SharedAssetLibrary,
  rng: SeededRng
): BuiltMapScene {
  switch (mapId) {
    case "ilha_avo_romeno":
      return buildIlhaAvoRomenoMap(lib, rng);
    case "coronel_fabriciano":
      return buildCoronelFabricianoMap(lib, rng);
    case "rio_de_janeiro":
      return buildRioDeJaneiroMap(lib, rng);
    case "curitiba":
      return buildCuritibaMap(lib, rng);
    case "sao_luis":
      return buildSaoLuisMap(lib, rng);
  }
}

function addPlayableBoundaryRing(
  group: THREE.Group,
  disposables: Array<{ dispose: () => void }>,
  color: number,
  opacity = 0.25
): void {
  const geo = new THREE.RingGeometry(PLAYABLE_R - 0.22, PLAYABLE_R + 0.22, 96);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(geo, mat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  group.add(ring);
  disposables.push(geo, mat);
}

// ============================================================================
// FASE 1: ILHA DO AVÔ ROMENO (Escala Grande ~200x200)
// ============================================================================

function buildIlhaAvoRomenoMap(lib: SharedAssetLibrary, rng: SeededRng): BuiltMapScene {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const obstacles: ObstacleCollider[] = [];
  const landmarks: MapLandmark[] = [];
  const flags: THREE.Mesh[] = [];

  // Oceano extenso
  const oceanGeo = new THREE.PlaneGeometry(520, 520, 16, 16);
  const oceanMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.28,
    metalness: 0.14,
  });
  const ocean = new THREE.Mesh(oceanGeo, oceanMat);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = -0.8;
  group.add(ocean);
  disposables.push(oceanGeo, oceanMat);

  // Espuma rasa na costa
  const foamGeo = new THREE.RingGeometry(VISUAL_R - 1, VISUAL_R + 4.5, 96);
  const foamMat = new THREE.MeshBasicMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
  });
  const foam = new THREE.Mesh(foamGeo, foamMat);
  foam.rotation.x = -Math.PI / 2;
  foam.position.y = -0.6;
  group.add(foam);
  disposables.push(foamGeo, foamMat);

  // Chão da ilha gigante
  const [canvas, ctx] = makeCanvas(1024, 1024);
  const cx = 512;
  const cy = 512;
  ctx.fillStyle = "#e7c98b";
  ctx.fillRect(0, 0, 1024, 1024);

  const grassGrad = ctx.createRadialGradient(cx, cy, 40, cx, cy, 445);
  grassGrad.addColorStop(0, "#4ea854");
  grassGrad.addColorStop(0.76, "#3f9347");
  grassGrad.addColorStop(0.92, "#65a34e");
  grassGrad.addColorStop(1, "#e7c98b");
  ctx.fillStyle = grassGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 448, 0, Math.PI * 2);
  ctx.fill();

  // Manchas de grama
  for (let i = 0; i < 600; i++) {
    const a = (i * 2.39996) % (Math.PI * 2);
    const r = Math.sqrt(i / 600) * 410;
    ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.04)" : "rgba(15,45,20,0.07)";
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 7 + (i % 13), 0, Math.PI * 2);
    ctx.fill();
  }

  // Estradas de terra cruzando a ilha
  ctx.fillStyle = "rgba(231, 201, 139, 0.56)";
  ctx.fillRect(cx - 16, cy - 380, 32, 780);
  ctx.fillRect(cx - 380, cy - 16, 760, 32);

  // Praça central com brasão da Romênia
  ctx.fillStyle = "#e7c98b";
  ctx.beginPath();
  ctx.arc(cx, cy, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(0, 43, 127, 0.6)";
  ctx.fillRect(cx - 24, cy - 14, 16, 28);
  ctx.fillStyle = "rgba(252, 209, 22, 0.7)";
  ctx.fillRect(cx - 8, cy - 14, 16, 28);
  ctx.fillStyle = "rgba(206, 17, 38, 0.6)";
  ctx.fillRect(cx + 8, cy - 14, 16, 28);

  // Pista de pouso nordeste
  ctx.save();
  ctx.translate(cx + 215, cy - 215);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = "rgba(100, 100, 104, 0.78)";
  ctx.fillRect(-155, -24, 310, 48);
  ctx.strokeStyle = "rgba(255,255,255,0.72)";
  ctx.setLineDash([16, 14]);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-135, 0);
  ctx.lineTo(135, 0);
  ctx.stroke();
  ctx.restore();

  const groundTex = finalizeTexture(canvas);
  const islandGeo = new THREE.CylinderGeometry(VISUAL_R, VISUAL_R + 6, 1.8, 72);
  const sideMat = new THREE.MeshStandardMaterial({ color: 0xd9b372, roughness: 0.9 });
  const topMat = new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.88 });
  const islandMesh = new THREE.Mesh(islandGeo, [sideMat, topMat, sideMat]);
  islandMesh.position.y = -0.9;
  islandMesh.receiveShadow = true;
  group.add(islandMesh);
  disposables.push(groundTex, islandGeo, sideMat, topMat);

  addPlayableBoundaryRing(group, disposables, 0xfef08a, 0.28);

  // Palmeiras tropicais
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
  disposables.push(trunkMat, leafMat);

  const addPalm = (x: number, z: number, h: number, collide: boolean) => {
    const palm = new THREE.Group();
    palm.position.set(x, 0, z);
    const trunk = new THREE.Mesh(lib.cylinderUnit, trunkMat);
    trunk.scale.set(0.6, h, 0.6);
    trunk.position.y = h / 2;
    palm.add(trunk);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const frond = new THREE.Mesh(lib.boxUnit, leafMat);
      frond.scale.set(0.6, 0.12, 3.1);
      frond.position.set(Math.sin(a) * 1.4, h - 0.1, Math.cos(a) * 1.4);
      frond.rotation.y = a;
      frond.rotation.x = 0.35;
      palm.add(frond);
    }
    group.add(palm);
    if (collide) obstacles.push({ x, z, radius: 0.9 });
  };

  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 + 0.12;
    const r = 24 + (i % 3) * 24 + rng.range(-5, 5);
    const px = Math.cos(a) * r;
    const pz = Math.sin(a) * r;
    if (Math.hypot(px - 44, pz + 44) < 18) continue; // pista livre
    if (Math.hypot(px + 52, pz + 48) < 12) continue; // farol livre
    addPalm(px, pz, rng.range(4.8, 6.8), true);
  }
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const r = VISUAL_R - 4.5;
    addPalm(Math.cos(a) * r, Math.sin(a) * r, rng.range(5.2, 7.2), false);
  }

  // Bandeiras da Romênia
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6, roughness: 0.3 });
  const flagTex = createRomaniaFlagTexture();
  const flagMat = new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide });
  const flagGeo = new THREE.PlaneGeometry(3.2, 2.0);
  disposables.push(poleMat, flagTex, flagMat, flagGeo);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.35;
    const r = PLAYABLE_R - 4;
    const pg = new THREE.Group();
    pg.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    const pole = new THREE.Mesh(lib.cylinderUnit, poleMat);
    pole.scale.set(0.18, 6.8, 0.18);
    pole.position.y = 3.4;
    pg.add(pole);
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(1.6, 5.7, 0);
    pg.add(flag);
    flags.push(flag);
    group.add(pg);
  }

  // Landmark 1: Mini-aviãozinho na pista nordeste
  const planeGroup = new THREE.Group();
  planeGroup.position.set(46, 0.9, -46);
  planeGroup.rotation.y = Math.PI * 0.75;
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x002b7f, roughness: 0.4 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfcd116, roughness: 0.4 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xce1126, roughness: 0.4 });
  disposables.push(whiteMat, blueMat, yellowMat, redMat);

  const fus = new THREE.Mesh(lib.cylinderUnit, whiteMat);
  fus.scale.set(1.3, 6.2, 1.3);
  fus.rotation.x = Math.PI / 2;
  fus.castShadow = true;
  planeGroup.add(fus);
  const wing = new THREE.Mesh(lib.boxUnit, yellowMat);
  wing.scale.set(8.2, 0.22, 1.8);
  wing.position.set(0, 0.15, 0.4);
  wing.castShadow = true;
  planeGroup.add(wing);
  const tail = new THREE.Mesh(lib.boxUnit, blueMat);
  tail.scale.set(0.22, 1.6, 1.3);
  tail.position.set(0, 0.95, -2.5);
  planeGroup.add(tail);
  group.add(planeGroup);
  obstacles.push({ x: 46, z: -46, radius: 3.4 });
  landmarks.push({ x: 46, z: -46, label: "Pista do Avião" });

  // Landmark 2: Farol do Avô no noroeste
  const lhX = -52;
  const lhZ = -48;
  const lighthouse = new THREE.Group();
  lighthouse.position.set(lhX, 0, lhZ);
  for (let s = 0; s < 4; s++) {
    const seg = new THREE.Mesh(lib.cylinderUnit, s % 2 === 0 ? whiteMat : redMat);
    seg.scale.set(3.2 - s * 0.35, 3.2, 3.2 - s * 0.35);
    seg.position.y = 1.6 + s * 3.2;
    seg.castShadow = true;
    lighthouse.add(seg);
  }
  const lantern = new THREE.Mesh(lib.cylinderUnit, yellowMat);
  lantern.scale.set(1.8, 1.8, 1.8);
  lantern.position.y = 13.7;
  lighthouse.add(lantern);
  const cap = new THREE.Mesh(lib.coneUnit, blueMat);
  cap.scale.set(2.4, 2.0, 2.4);
  cap.position.y = 15.6;
  lighthouse.add(cap);
  group.add(lighthouse);
  obstacles.push({ x: lhX, z: lhZ, radius: 2.8 });
  landmarks.push({ x: lhX, z: lhZ, label: "Farol do Avô" });

  // Landmark 3: Píer de madeira & Baús de Tesouro ao sul
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.7, roughness: 0.25 });
  disposables.push(woodMat, goldMat);

  const pier = new THREE.Mesh(lib.boxUnit, woodMat);
  pier.scale.set(6.5, 0.4, 18);
  pier.position.set(0, 0.05, VISUAL_R - 2);
  group.add(pier);

  const chest = new THREE.Mesh(lib.boxUnit, woodMat);
  chest.scale.set(2.4, 1.5, 1.6);
  chest.position.set(4.8, 0.75, PLAYABLE_R - 10);
  chest.castShadow = true;
  group.add(chest);
  const trim = new THREE.Mesh(lib.boxUnit, goldMat);
  trim.scale.set(2.5, 0.3, 1.7);
  trim.position.set(4.8, 1.05, PLAYABLE_R - 10);
  group.add(trim);
  obstacles.push({ x: 4.8, z: PLAYABLE_R - 10, radius: 1.6 });
  landmarks.push({ x: 0, z: PLAYABLE_R - 8, label: "Píer do Tesouro" });

  return {
    mapId: "ilha_avo_romeno",
    group,
    obstacles,
    landmarks,
    disposables,
    update: (t) => {
      ocean.position.y = -0.8 + Math.sin(t * 1.4) * 0.1;
      for (let i = 0; i < flags.length; i++) {
        flags[i]!.rotation.y = Math.sin(t * 3.2 + i * 1.2) * 0.25;
      }
    },
  };
}

function createRomaniaFlagTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(192, 128);
  ctx.fillStyle = "#002B7F";
  ctx.fillRect(0, 0, 64, 128);
  ctx.fillStyle = "#FCD116";
  ctx.fillRect(64, 0, 64, 128);
  ctx.fillStyle = "#CE1126";
  ctx.fillRect(128, 0, 64, 128);
  return finalizeTexture(canvas);
}

// ============================================================================
// FASE 2: CORONEL FABRICIANO (MG) — Terra Mãe do Vale do Aço
// ============================================================================

function buildCoronelFabricianoMap(lib: SharedAssetLibrary, rng: SeededRng): BuiltMapScene {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const obstacles: ObstacleCollider[] = [];
  const landmarks: MapLandmark[] = [];

  // Terreno urbano de Coronel Fabriciano (Praça da Estação no centro, avenidas e trilhos)
  const [canvas, ctx] = makeCanvas(1024, 1024);
  const cx = 512;
  const cy = 512;
  ctx.fillStyle = "#4b5563"; // asfalto urbano
  ctx.fillRect(0, 0, 1024, 1024);

  // Quarteirões com calçadas claras e áreas arborizadas mineiras
  ctx.fillStyle = "#cbd5e1";
  for (let gx = 0; gx < 4; gx++) {
    for (let gz = 0; gz < 4; gz++) {
      const bx = 56 + gx * 240;
      const bz = 56 + gz * 240;
      ctx.fillRect(bx, bz, 184, 184);
      ctx.fillStyle = (gx + gz) % 2 === 0 ? "#9ca3af" : "#78a65a";
      ctx.fillRect(bx + 14, bz + 14, 156, 156);
      ctx.fillStyle = "#cbd5e1";
    }
  }

  // Avenida Magalhães Pinto & Avenida Brasil cruzando o centro
  ctx.fillStyle = "#374151";
  ctx.fillRect(cx - 38, 0, 76, 1024);
  ctx.fillRect(0, cy - 38, 1024, 76);

  // Faixas amarelas das avenidas
  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 4;
  ctx.setLineDash([20, 16]);
  ctx.beginPath();
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, 1024);
  ctx.moveTo(0, cy);
  ctx.lineTo(1024, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  // Praça da Estação (grande calçadão central de pedra mineira + trilhos históricos)
  ctx.fillStyle = "#e2d9c8";
  ctx.beginPath();
  ctx.arc(cx, cy, 118, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#a16207";
  ctx.lineWidth = 6;
  ctx.stroke();

  // Linha férrea estilizada (antiga Estação do Calado / EFVM) ao sul da praça
  ctx.fillStyle = "#57534e";
  ctx.fillRect(0, cy + 160, 1024, 24);
  ctx.fillStyle = "#a8a29e";
  for (let x = 0; x < 1024; x += 18) {
    ctx.fillRect(x, cy + 163, 7, 18);
  }
  ctx.fillStyle = "#d4d4d8";
  ctx.fillRect(0, cy + 166, 1024, 3);
  ctx.fillRect(0, cy + 175, 1024, 3);

  const groundTex = finalizeTexture(canvas);
  const groundGeo = new THREE.PlaneGeometry(VISUAL_R * 2.2, VISUAL_R * 2.2);
  const groundMat = new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.9 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);
  disposables.push(groundTex, groundGeo, groundMat);

  addPlayableBoundaryRing(group, disposables, 0xf59e0b, 0.32);

  // Serra dos Cocais & Pedra dos Dois Irmãos cercando o horizonte (fora do limite jogável)
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.95 });
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 });
  disposables.push(hillMat, rockMat);

  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r = VISUAL_R + 28 + (i % 3) * 10;
    const hill = new THREE.Mesh(lib.coneUnit, hillMat);
    const h = 24 + (i % 4) * 10;
    hill.scale.set(42, h, 42);
    hill.position.set(Math.cos(a) * r, h / 2 - 2, Math.sin(a) * r);
    group.add(hill);
  }
  // Pedra dos Dois Irmãos no horizonte norte
  for (const ox of [-9, 9]) {
    const rock = new THREE.Mesh(lib.dodecahedron, rockMat);
    rock.scale.set(16, 26, 14);
    rock.position.set(ox, 12, -(VISUAL_R + 24));
    group.add(rock);
  }

  // Materiais arquitetônicos
  const creamWall = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8 });
  const terracotta = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 });
  const whiteConcrete = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.7, roughness: 0.25 });
  const goldAccent = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.5, roughness: 0.3 });
  const roofDark = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.8 });
  disposables.push(creamWall, terracotta, whiteConcrete, steelMat, goldAccent, roofDark);

  // 1. Co-Catedral de São Sebastião (icônica arquitetura em TENDA BÍBLICA!)
  const catX = -46;
  const catZ = -38;
  const catedral = new THREE.Group();
  catedral.position.set(catX, 0, catZ);
  const tentBase = new THREE.Mesh(lib.cylinderUnit, whiteConcrete);
  tentBase.scale.set(16, 2.2, 16);
  tentBase.position.y = 1.1;
  catedral.add(tentBase);
  const tentRoof = new THREE.Mesh(lib.coneUnit, terracotta);
  tentRoof.scale.set(15.5, 11.5, 15.5);
  tentRoof.position.y = 7.9;
  tentRoof.castShadow = true;
  catedral.add(tentRoof);
  const crossV = new THREE.Mesh(lib.boxUnit, goldAccent);
  crossV.scale.set(0.45, 3.6, 0.45);
  crossV.position.y = 15.1;
  catedral.add(crossV);
  const crossH = new THREE.Mesh(lib.boxUnit, goldAccent);
  crossH.scale.set(2.1, 0.45, 0.45);
  crossH.position.y = 15.7;
  catedral.add(crossH);
  group.add(catedral);
  obstacles.push({ x: catX, z: catZ, radius: 8.2 });
  landmarks.push({ x: catX, z: catZ, label: "Co-Catedral" });

  // 2. Igreja Matriz de São Sebastião (eclética histórica com torre de sino)
  const matX = 48;
  const matZ = -42;
  const matriz = new THREE.Group();
  matriz.position.set(matX, 0, matZ);
  const nave = new THREE.Mesh(lib.boxUnit, creamWall);
  nave.scale.set(9.5, 6.2, 14);
  nave.position.y = 3.1;
  nave.castShadow = true;
  matriz.add(nave);
  const tower = new THREE.Mesh(lib.boxUnit, creamWall);
  tower.scale.set(3.4, 12.5, 3.4);
  tower.position.set(0, 6.25, 5.8);
  tower.castShadow = true;
  matriz.add(tower);
  const spire = new THREE.Mesh(lib.coneUnit, roofDark);
  spire.scale.set(3.6, 4.2, 3.6);
  spire.position.set(0, 14.5, 5.8);
  matriz.add(spire);
  group.add(matriz);
  obstacles.push({ x: matX, z: matZ, radius: 7.4 });
  landmarks.push({ x: matX, z: matZ, label: "Igreja Matriz" });

  // 3. Sobrado dos Pereira (primeiro prédio histórico de alvenaria, anos 1920)
  const sobX = -42;
  const sobZ = 44;
  const sobrado = new THREE.Group();
  sobrado.position.set(sobX, 0, sobZ);
  const sobBody = new THREE.Mesh(lib.boxUnit, creamWall);
  sobBody.scale.set(11, 7.2, 8);
  sobBody.position.y = 3.6;
  sobBody.castShadow = true;
  sobrado.add(sobBody);
  const sobRoof = new THREE.Mesh(lib.coneUnit, roofDark);
  sobRoof.scale.set(12.5, 2.8, 9.5);
  sobRoof.position.y = 8.6;
  sobRoof.rotation.y = Math.PI / 4;
  sobrado.add(sobRoof);
  group.add(sobrado);
  obstacles.push({ x: sobX, z: sobZ, radius: 6.2 });
  landmarks.push({ x: sobX, z: sobZ, label: "Sobrado dos Pereira" });

  // 4. Monumento Terra Mãe (praça sudeste, escultura em aço/bronze)
  const tmX = 48;
  const tmZ = 46;
  const terraMae = new THREE.Group();
  terraMae.position.set(tmX, 0, tmZ);
  const pedestal = new THREE.Mesh(lib.cylinderUnit, whiteConcrete);
  pedestal.scale.set(5.2, 1.4, 5.2);
  pedestal.position.y = 0.7;
  terraMae.add(pedestal);
  const sculpture = new THREE.Mesh(lib.torusUnit, steelMat);
  sculpture.scale.set(3.4, 5.6, 1.6);
  sculpture.position.y = 4.6;
  sculpture.castShadow = true;
  terraMae.add(sculpture);
  const orb = new THREE.Mesh(lib.sphereLow, goldAccent);
  orb.scale.setScalar(1.8);
  orb.position.y = 4.8;
  terraMae.add(orb);
  group.add(terraMae);
  obstacles.push({ x: tmX, z: tmZ, radius: 3.4 });
  landmarks.push({ x: tmX, z: tmZ, label: "Monumento Terra Mãe" });

  // 5. Monumento "Os Cinco Elementos" (marco lateral da Praça da Estação, sem travar spawn central)
  const monX = 16;
  const monZ = -12;
  const cincoElem = new THREE.Group();
  cincoElem.position.set(monX, 0, monZ);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const pillar = new THREE.Mesh(lib.cylinderUnit, i % 2 === 0 ? steelMat : goldAccent);
    pillar.scale.set(0.7, 4.2 + (i % 3) * 1.1, 0.7);
    pillar.position.set(Math.cos(a) * 1.6, 2.2, Math.sin(a) * 1.6);
    pillar.castShadow = true;
    cincoElem.add(pillar);
  }
  group.add(cincoElem);
  obstacles.push({ x: monX, z: monZ, radius: 2.4 });
  landmarks.push({ x: monX, z: monZ, label: "Praça da Estação" });

  // Ipês amarelos e roxos espalhados pela cidade mineira
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x573b26, roughness: 0.9 });
  const ipeYellow = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.75 });
  const ipePurple = new THREE.MeshStandardMaterial({ color: 0xc026d3, roughness: 0.75 });
  disposables.push(trunkMat, ipeYellow, ipePurple);

  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2 + 0.2;
    const r = 30 + (i % 3) * 23;
    const tx = Math.cos(a) * r;
    const tz = Math.sin(a) * r;
    if (obstacles.some((o) => Math.hypot(o.x - tx, o.z - tz) < o.radius + 5)) continue;
    const tree = new THREE.Group();
    tree.position.set(tx, 0, tz);
    const trunk = new THREE.Mesh(lib.cylinderUnit, trunkMat);
    trunk.scale.set(0.55, 3.6, 0.55);
    trunk.position.y = 1.8;
    tree.add(trunk);
    const crown = new THREE.Mesh(lib.dodecahedron, i % 2 === 0 ? ipeYellow : ipePurple);
    crown.scale.setScalar(4.4 + rng.range(-0.5, 0.8));
    crown.position.y = 4.4;
    tree.add(crown);
    group.add(tree);
    obstacles.push({ x: tx, z: tz, radius: 1.0 });
  }

  return {
    mapId: "coronel_fabriciano",
    group,
    obstacles,
    landmarks,
    disposables,
    update: (t) => {
      orb.position.y = 4.8 + Math.sin(t * 2.2) * 0.25;
      sculpture.rotation.y = t * 0.35;
    },
  };
}

// ============================================================================
// FASE 3: RIO DE JANEIRO (RJ) — Copacabana, Arcos da Lapa, Cristo & Pão de Açúcar
// ============================================================================

function buildRioDeJaneiroMap(lib: SharedAssetLibrary, rng: SeededRng): BuiltMapScene {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const obstacles: ObstacleCollider[] = [];
  const landmarks: MapLandmark[] = [];

  // Mar de Copacabana ao sul
  const oceanGeo = new THREE.PlaneGeometry(520, 260);
  const oceanMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.25,
    metalness: 0.15,
  });
  const ocean = new THREE.Mesh(oceanGeo, oceanMat);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.set(0, -0.5, 165);
  group.add(ocean);
  disposables.push(oceanGeo, oceanMat);

  // Chão: Praia de Copacabana (sul) + Calçadão de Ondas P&B (meio) + Avenida Atlântica / Lapa (norte)
  const [canvas, ctx] = makeCanvas(1024, 1024);
  // Metade norte: asfalto / praça urbana do Rio
  ctx.fillStyle = "#3f3f46";
  ctx.fillRect(0, 0, 1024, 520);
  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 4;
  ctx.setLineDash([22, 16]);
  ctx.beginPath();
  ctx.moveTo(0, 460);
  ctx.lineTo(1024, 460);
  ctx.stroke();
  ctx.setLineDash([]);

  // Faixa do icônico Calçadão de Copacabana (ondas preto e branco!)
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 520, 1024, 150);
  ctx.strokeStyle = "#18181b";
  ctx.lineWidth = 18;
  for (let row = 0; row < 3; row++) {
    const baseY = 550 + row * 45;
    ctx.beginPath();
    for (let x = 0; x <= 1024; x += 8) {
      const y = baseY + Math.sin((x / 1024) * Math.PI * 16) * 14;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Metade sul: Areia dourada de Copacabana
  ctx.fillStyle = "#ebd094";
  ctx.fillRect(0, 670, 1024, 354);

  const groundTex = finalizeTexture(canvas);
  const groundGeo = new THREE.PlaneGeometry(VISUAL_R * 2.2, VISUAL_R * 2.2);
  const groundMat = new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.88 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);
  disposables.push(groundTex, groundGeo, groundMat);

  addPlayableBoundaryRing(group, disposables, 0x38bdf8, 0.3);

  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.75 });
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.92 });
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9 });
  const redCableMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.35 });
  disposables.push(whiteMat, stoneMat, hillMat, rockMat, redCableMat);

  // 1. Arcos da Lapa (ao norte, dentro do mapa!)
  const lapaZ = -48;
  const lapaGroup = new THREE.Group();
  lapaGroup.position.set(0, 0, lapaZ);
  const topBeam = new THREE.Mesh(lib.boxUnit, whiteMat);
  topBeam.scale.set(52, 3.2, 4.2);
  topBeam.position.y = 10.6;
  topBeam.castShadow = true;
  lapaGroup.add(topBeam);
  for (let p = -3; p <= 3; p++) {
    const px = p * 7.8;
    const pillar = new THREE.Mesh(lib.boxUnit, whiteMat);
    pillar.scale.set(2.4, 9.6, 4.0);
    pillar.position.set(px, 4.8, 0);
    pillar.castShadow = true;
    lapaGroup.add(pillar);
    obstacles.push({ x: px, z: lapaZ, radius: 2.0 });
  }
  group.add(lapaGroup);
  landmarks.push({ x: 0, z: lapaZ, label: "Arcos da Lapa" });

  // 2. Cristo Redentor no topo do Morro do Corcovado (horizonte norte-oeste)
  const cristoGroup = new THREE.Group();
  cristoGroup.position.set(-48, 0, -(VISUAL_R + 30));
  const corcovado = new THREE.Mesh(lib.coneUnit, hillMat);
  corcovado.scale.set(58, 36, 58);
  corcovado.position.y = 16;
  cristoGroup.add(corcovado);
  const ped = new THREE.Mesh(lib.boxUnit, stoneMat);
  ped.scale.set(6.5, 5.5, 6.5);
  ped.position.y = 35;
  cristoGroup.add(ped);
  const body = new THREE.Mesh(lib.boxUnit, stoneMat);
  body.scale.set(4.2, 16, 3.4);
  body.position.y = 45.5;
  cristoGroup.add(body);
  const arms = new THREE.Mesh(lib.boxUnit, stoneMat);
  arms.scale.set(20, 2.4, 2.4);
  arms.position.y = 50.5;
  cristoGroup.add(arms);
  const head = new THREE.Mesh(lib.sphereLow, stoneMat);
  head.scale.setScalar(3.4);
  head.position.y = 55;
  cristoGroup.add(head);
  group.add(cristoGroup);
  landmarks.push({ x: -42, z: -PLAYABLE_R + 12, label: "Vista Cristo" });

  // 3. Pão de Açúcar + Bondinho animado (horizonte leste)
  const paoGroup = new THREE.Group();
  paoGroup.position.set(VISUAL_R + 34, 0, 12);
  const morro1 = new THREE.Mesh(lib.coneUnit, rockMat);
  morro1.scale.set(42, 42, 42);
  morro1.position.set(0, 19, -16);
  paoGroup.add(morro1);
  const morro2 = new THREE.Mesh(lib.coneUnit, hillMat);
  morro2.scale.set(34, 28, 34);
  morro2.position.set(0, 13, 24);
  paoGroup.add(morro2);
  const bondinho = new THREE.Mesh(lib.boxUnit, redCableMat);
  bondinho.scale.set(3.2, 2.2, 4.4);
  bondinho.position.set(-4, 26, 4);
  paoGroup.add(bondinho);
  group.add(paoGroup);
  landmarks.push({ x: PLAYABLE_R - 14, z: 10, label: "Pão de Açúcar" });

  // 4. Quiosques e Guarda-sóis na praia de Copacabana
  const kioskWood = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 });
  const umbrellaColors = [0xef4444, 0x3b82f6, 0xfacc15, 0x22c55e].map(
    (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 })
  );
  disposables.push(kioskWood, ...umbrellaColors);

  const kioskCoords: Array<[number, number]> = [
    [-46, 26],
    [0, 26],
    [46, 26],
  ];
  for (const [kx, kz] of kioskCoords) {
    const k = new THREE.Group();
    k.position.set(kx, 0, kz);
    const counter = new THREE.Mesh(lib.cylinderUnit, kioskWood);
    counter.scale.set(4.8, 2.2, 4.8);
    counter.position.y = 1.1;
    counter.castShadow = true;
    k.add(counter);
    const roof = new THREE.Mesh(lib.coneUnit, kioskWood);
    roof.scale.set(6.4, 2.4, 6.4);
    roof.position.y = 3.8;
    k.add(roof);
    group.add(k);
    obstacles.push({ x: kx, z: kz, radius: 2.8 });
  }
  landmarks.push({ x: 0, z: 16, label: "Calçadão Copacabana" });

  for (let i = 0; i < 14; i++) {
    const ux = -66 + i * 10 + rng.range(-2, 2);
    const uz = 54 + (i % 2) * 18 + rng.range(-3, 3);
    if (Math.hypot(ux, uz) > PLAYABLE_R - 6) continue;
    const umb = new THREE.Group();
    umb.position.set(ux, 0, uz);
    const pole = new THREE.Mesh(lib.cylinderUnit, whiteMat);
    pole.scale.set(0.16, 3.2, 0.16);
    pole.position.y = 1.6;
    umb.add(pole);
    const top = new THREE.Mesh(lib.coneUnit, umbrellaColors[i % umbrellaColors.length]!);
    top.scale.set(3.4, 0.9, 3.4);
    top.position.y = 3.2;
    umb.add(top);
    group.add(umb);
    obstacles.push({ x: ux, z: uz, radius: 0.7 });
  }

  return {
    mapId: "rio_de_janeiro",
    group,
    obstacles,
    landmarks,
    disposables,
    update: (t) => {
      ocean.position.y = -0.5 + Math.sin(t * 1.6) * 0.1;
      bondinho.position.z = 4 + Math.sin(t * 0.55) * 16;
      bondinho.position.y = 26 + Math.sin(t * 0.55) * 4;
    },
  };
}

// ============================================================================
// FASE 4: CURITIBA (PR) — Jardim Botânico, Museu do Olho, Estação-Tubo & Araucárias
// ============================================================================

function buildCuritibaMap(lib: SharedAssetLibrary, rng: SeededRng): BuiltMapScene {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const obstacles: ObstacleCollider[] = [];
  const landmarks: MapLandmark[] = [];

  // Chão: Parque gramado de Curitiba + canaleta do Biarticulado + calçadão petit-pavé
  const [canvas, ctx] = makeCanvas(1024, 1024);
  ctx.fillStyle = "#3f7d4c";
  ctx.fillRect(0, 0, 1024, 1024);

  // Calçadões geométricos em petit-pavé paranaense
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(468, 0, 88, 1024);
  ctx.fillRect(0, 468, 1024, 88);

  // Padrão pinhão estilizado no calçadão
  ctx.fillStyle = "#334155";
  for (let i = 0; i < 1024; i += 44) {
    ctx.beginPath();
    ctx.arc(512, i, 10, 0, Math.PI * 2);
    ctx.arc(i, 512, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // Canaleta exclusiva vermelha do expresso biarticulado ao sul
  ctx.fillStyle = "#991b1b";
  ctx.fillRect(0, 720, 1024, 48);

  // Tapete de flores geométrico francês em frente à Estufa (quadrante noroeste)
  ctx.fillStyle = "#ef4444";
  ctx.fillRect(190, 260, 170, 85);
  ctx.fillStyle = "#facc15";
  ctx.fillRect(215, 275, 120, 55);
  ctx.fillStyle = "#22c55e";
  ctx.fillRect(240, 290, 70, 25);

  const groundTex = finalizeTexture(canvas);
  const groundGeo = new THREE.PlaneGeometry(VISUAL_R * 2.2, VISUAL_R * 2.2);
  const groundMat = new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.88 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);
  disposables.push(groundTex, groundGeo, groundMat);

  addPlayableBoundaryRing(group, disposables, 0x22c55e, 0.3);

  const whiteIron = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.52,
    metalness: 0.2,
    roughness: 0.15,
  });
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });
  const yellowTower = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.55 });
  const busRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35 });
  const darkWindow = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.25 });
  disposables.push(whiteIron, glassMat, concreteMat, yellowTower, busRed, darkWindow);

  // 1. Estufa de Vidro do Jardim Botânico (3 domos de vidro + armação branca)
  const jbX = -46;
  const jbZ = -42;
  const estufa = new THREE.Group();
  estufa.position.set(jbX, 0, jbZ);
  const centerDome = new THREE.Mesh(lib.sphereLow, glassMat);
  centerDome.scale.set(12, 13, 12);
  centerDome.position.y = 4.5;
  estufa.add(centerDome);
  for (const sx of [-7.5, 7.5]) {
    const sideDome = new THREE.Mesh(lib.sphereLow, glassMat);
    sideDome.scale.set(7.5, 8.2, 8.5);
    sideDome.position.set(sx, 3.0, 0);
    estufa.add(sideDome);
  }
  const baseTrim = new THREE.Mesh(lib.boxUnit, whiteIron);
  baseTrim.scale.set(22, 1.8, 11.5);
  baseTrim.position.y = 0.9;
  estufa.add(baseTrim);
  const arch = new THREE.Mesh(lib.torusUnit, whiteIron);
  arch.scale.set(6.4, 6.4, 1.4);
  arch.position.set(0, 4.5, 5.4);
  estufa.add(arch);
  group.add(estufa);
  obstacles.push({ x: jbX, z: jbZ, radius: 9.8 });
  landmarks.push({ x: jbX, z: jbZ, label: "Jardim Botânico" });

  // 2. Museu Oscar Niemeyer — Museu do Olho (MON)
  const monX = 48;
  const monZ = -36;
  const mon = new THREE.Group();
  mon.position.set(monX, 0, monZ);
  const pool = new THREE.Mesh(
    new THREE.CylinderGeometry(12, 12, 0.25, 28),
    new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.15, metalness: 0.2 })
  );
  pool.position.y = 0.12;
  mon.add(pool);
  disposables.push(pool.geometry, pool.material as THREE.Material);

  const pillar = new THREE.Mesh(lib.boxUnit, yellowTower);
  pillar.scale.set(5.4, 9.5, 5.4);
  pillar.position.y = 4.75;
  pillar.castShadow = true;
  mon.add(pillar);

  // Estrutura suspensa em formato de olho
  const eyeShell = new THREE.Mesh(lib.sphereLow, concreteMat);
  eyeShell.scale.set(22, 7.5, 9.5);
  eyeShell.position.y = 11.8;
  eyeShell.castShadow = true;
  mon.add(eyeShell);
  const eyeGlass = new THREE.Mesh(lib.boxUnit, darkWindow);
  eyeGlass.scale.set(17, 3.6, 10.0);
  eyeGlass.position.y = 11.8;
  mon.add(eyeGlass);
  group.add(mon);
  obstacles.push({ x: monX, z: monZ, radius: 6.5 });
  landmarks.push({ x: monX, z: monZ, label: "Museu do Olho" });

  // 3. Estação-Tubo + Ônibus Biarticulado Vermelho
  const tuboX = 0;
  const tuboZ = 42;
  const tubo = new THREE.Mesh(lib.cylinderUnit, glassMat);
  tubo.rotation.z = Math.PI / 2;
  tubo.scale.set(4.2, 14, 4.2);
  tubo.position.set(tuboX, 2.2, tuboZ);
  group.add(tubo);
  obstacles.push({ x: tuboX, z: tuboZ, radius: 4.5 });

  const busGroup = new THREE.Group();
  busGroup.position.set(16, 0, 50);
  for (let seg = 0; seg < 3; seg++) {
    const car = new THREE.Mesh(lib.boxUnit, busRed);
    car.scale.set(7.2, 3.2, 3.0);
    car.position.set(seg * 8.0, 1.9, 0);
    car.castShadow = true;
    busGroup.add(car);
    const win = new THREE.Mesh(lib.boxUnit, darkWindow);
    win.scale.set(6.8, 1.1, 3.1);
    win.position.set(seg * 8.0, 2.3, 0);
    busGroup.add(win);
  }
  group.add(busGroup);
  obstacles.push({ x: 24, z: 50, radius: 6.0 });
  landmarks.push({ x: tuboX, z: tuboZ, label: "Estação-Tubo" });

  // 4. Araucárias paranaenses (tronco alto + copa larga em guarda-chuva!)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.92 });
  const pineMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8 });
  disposables.push(trunkMat, pineMat);

  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 + 0.1;
    const r = 26 + (i % 3) * 24 + rng.range(-4, 4);
    const ax = Math.cos(a) * r;
    const az = Math.sin(a) * r;
    if (obstacles.some((o) => Math.hypot(o.x - ax, o.z - az) < o.radius + 5)) continue;
    if (Math.abs(az - 48) < 9) continue; // canaleta livre

    const araucaria = new THREE.Group();
    araucaria.position.set(ax, 0, az);
    const h = rng.range(7.5, 11.0);
    const trunk = new THREE.Mesh(lib.cylinderUnit, trunkMat);
    trunk.scale.set(0.55, h, 0.55);
    trunk.position.y = h / 2;
    araucaria.add(trunk);

    // Copa característica de araucária (galhos altos formando cálice/guarda-chuva)
    const canopy = new THREE.Mesh(lib.cylinderUnit, pineMat);
    canopy.scale.set(5.4, 0.9, 5.4);
    canopy.position.y = h;
    araucaria.add(canopy);
    const canopyTop = new THREE.Mesh(lib.cylinderUnit, pineMat);
    canopyTop.scale.set(3.6, 0.7, 3.6);
    canopyTop.position.y = h + 0.7;
    araucaria.add(canopyTop);

    group.add(araucaria);
    obstacles.push({ x: ax, z: az, radius: 1.0 });
  }

  return {
    mapId: "curitiba",
    group,
    obstacles,
    landmarks,
    disposables,
    update: () => {
      /* cena serena de Curitiba */
    },
  };
}

// ============================================================================
// FASE 5 (FINAL): SÃO LUÍS (MA) — Azulejos, Palácio dos Leões & Arena da Morango!
// ============================================================================

function createAzulejoFacadeTexture(baseHex: string, tileHex: string): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 256);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  // Padrão de azulejos portugueses coloniais
  ctx.strokeStyle = tileHex;
  ctx.lineWidth = 2;
  for (let x = 0; x < 256; x += 32) {
    for (let y = 0; y < 256; y += 32) {
      ctx.strokeRect(x + 2, y + 2, 28, 28);
      ctx.beginPath();
      ctx.arc(x + 16, y + 16, 7, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Janelas coloniais brancas com veneziana
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const wx = 26 + col * 78;
      const wy = 34 + row * 116;
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(wx - 4, wy - 4, 52, 74);
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(wx, wy, 44, 66);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(wx + 20, wy, 4, 66);
      ctx.fillRect(wx, wy + 31, 44, 4);
    }
  }

  return finalizeTexture(canvas);
}

function buildSaoLuisMap(lib: SharedAssetLibrary, rng: SeededRng): BuiltMapScene {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const obstacles: ObstacleCollider[] = [];
  const landmarks: MapLandmark[] = [];
  const buntingLines: THREE.Group[] = [];

  // Baía de São Marcos ao fundo (norte/oeste)
  const bayGeo = new THREE.PlaneGeometry(520, 240);
  const bayMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a,
    roughness: 0.25,
    metalness: 0.2,
  });
  const bay = new THREE.Mesh(bayGeo, bayMat);
  bay.rotation.x = -Math.PI / 2;
  bay.position.set(0, -0.6, -(VISUAL_R + 95));
  group.add(bay);
  disposables.push(bayGeo, bayMat);

  // Chão: Paralelepípedos históricos da Praia Grande / Rua Portugal + Praça central do Bumba Meu Boi
  const [canvas, ctx] = makeCanvas(1024, 1024);
  ctx.fillStyle = "#57534e";
  ctx.fillRect(0, 0, 1024, 1024);

  // Pedras de calçamento colonial
  for (let y = 0; y < 1024; y += 24) {
    const offset = (y / 24) % 2 === 0 ? 0 : 14;
    for (let x = -16; x < 1024; x += 28) {
      ctx.fillStyle = (x + y) % 5 === 0 ? "#68625c" : "#4f4a45";
      ctx.fillRect(x + offset, y, 24, 20);
    }
  }

  // Praça central com estrela colorida do Bumba Meu Boi (arena da Boss Final Morango!)
  const cx = 512;
  const cy = 512;
  ctx.fillStyle = "#d6c5a3";
  ctx.beginPath();
  ctx.arc(cx, cy, 128, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#e11d48";
  ctx.lineWidth = 8;
  ctx.stroke();

  // Faixas reggae / Jamaica brasileira discretas no anel interno da praça
  ctx.strokeStyle = "#16a34a";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, 92, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#facc15";
  ctx.beginPath();
  ctx.arc(cx, cy, 80, 0, Math.PI * 2);
  ctx.stroke();

  const groundTex = finalizeTexture(canvas);
  const groundGeo = new THREE.PlaneGeometry(VISUAL_R * 2.2, VISUAL_R * 2.2);
  const groundMat = new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.9 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);
  disposables.push(groundTex, groundGeo, groundMat);

  addPlayableBoundaryRing(group, disposables, 0xf43f5e, 0.36);

  // Texturas de casarões de azulejos portugueses (azul, amarelo ocre, verde água, rosa colonial)
  const tileBlue = createAzulejoFacadeTexture("#e0f2fe", "#1d4ed8");
  const tileYellow = createAzulejoFacadeTexture("#fef08a", "#b45309");
  const tileTeal = createAzulejoFacadeTexture("#ccfbf1", "#0f766e");
  const tileRose = createAzulejoFacadeTexture("#ffe4e6", "#be123c");
  const facadeMats = [tileBlue, tileYellow, tileTeal, tileRose].map(
    (tex) => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.65 })
  );
  const clayRoof = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.85 });
  const palaceWhite = new THREE.MeshStandardMaterial({ color: 0xfefce8, roughness: 0.6 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.65, roughness: 0.25 });
  disposables.push(tileBlue, tileYellow, tileTeal, tileRose, ...facadeMats, clayRoof, palaceWhite, goldMat);

  // 1. Palácio dos Leões (fachada neoclássica branca imponente ao norte, voltada pra Baía)
  const palX = 0;
  const palZ = -58;
  const palace = new THREE.Group();
  palace.position.set(palX, 0, palZ);
  const palBody = new THREE.Mesh(lib.boxUnit, palaceWhite);
  palBody.scale.set(28, 9.5, 11);
  palBody.position.y = 4.75;
  palBody.castShadow = true;
  palace.add(palBody);
  const palRoof = new THREE.Mesh(lib.boxUnit, clayRoof);
  palRoof.scale.set(29.2, 1.4, 12.2);
  palRoof.position.y = 10.2;
  palace.add(palRoof);
  // Colunas neoclássicas na frente
  for (let c = -3; c <= 3; c++) {
    const col = new THREE.Mesh(lib.cylinderUnit, palaceWhite);
    col.scale.set(0.85, 9.2, 0.85);
    col.position.set(c * 3.6, 4.6, 6.0);
    palace.add(col);
  }
  // Dois leões dourados estilizados na entrada
  for (const sx of [-4.5, 4.5]) {
    const lion = new THREE.Mesh(lib.boxUnit, goldMat);
    lion.scale.set(1.6, 1.8, 2.4);
    lion.position.set(sx, 0.9, 8.2);
    palace.add(lion);
  }
  group.add(palace);
  obstacles.push({ x: palX, z: palZ, radius: 13.5 });
  landmarks.push({ x: palX, z: palZ, label: "Palácio dos Leões" });

  // 2. Casarões Azulejados da Rua Portugal (leste e oeste do centro histórico)
  const casaroes: Array<[number, number, number]> = [
    [-54, -22, 0],
    [-54, 18, 1],
    [-46, 54, 2],
    [54, -22, 3],
    [54, 18, 0],
    [46, 54, 1],
  ];
  for (const [cxPos, czPos, matIdx] of casaroes) {
    const house = new THREE.Group();
    house.position.set(cxPos, 0, czPos);
    const body = new THREE.Mesh(lib.boxUnit, facadeMats[matIdx % facadeMats.length]!);
    body.scale.set(11, 8.6, 9.5);
    body.position.y = 4.3;
    body.castShadow = true;
    house.add(body);
    const roof = new THREE.Mesh(lib.coneUnit, clayRoof);
    roof.scale.set(12.8, 3.2, 11.2);
    roof.position.y = 10.2;
    roof.rotation.y = Math.PI / 4;
    house.add(roof);
    group.add(house);
    obstacles.push({ x: cxPos, z: czPos, radius: 6.4 });
  }
  landmarks.push({ x: -54, z: 0, label: "Rua Portugal" });

  // 3. Catedral da Sé (sul, duas torres coloniais)
  const seX = 0;
  const seZ = 60;
  const catedralSe = new THREE.Group();
  catedralSe.position.set(seX, 0, seZ);
  const seNave = new THREE.Mesh(lib.boxUnit, palaceWhite);
  seNave.scale.set(14, 9, 10);
  seNave.position.y = 4.5;
  seNave.castShadow = true;
  catedralSe.add(seNave);
  for (const sx of [-5.2, 5.2]) {
    const tower = new THREE.Mesh(lib.boxUnit, palaceWhite);
    tower.scale.set(3.2, 15, 3.2);
    tower.position.set(sx, 7.5, -3.5);
    catedralSe.add(tower);
    const cap = new THREE.Mesh(lib.coneUnit, clayRoof);
    cap.scale.set(3.6, 3.6, 3.6);
    cap.position.set(sx, 16.8, -3.5);
    catedralSe.add(cap);
  }
  group.add(catedralSe);
  obstacles.push({ x: seX, z: seZ, radius: 8.5 });
  landmarks.push({ x: seX, z: seZ, label: "Catedral da Sé" });

  // 4. Bandeirinhas coloridas de São João / Bumba Meu Boi suspensas sobre a praça
  const flagMats = [0xe11d48, 0xfacc15, 0x22c55e, 0x38bdf8, 0xf97316].map(
    (c) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })
  );
  disposables.push(...flagMats);

  for (let line = 0; line < 4; line++) {
    const angle = (line / 4) * Math.PI;
    const lineGroup = new THREE.Group();
    lineGroup.rotation.y = angle;
    for (let f = -7; f <= 7; f++) {
      const flag = new THREE.Mesh(lib.coneUnit, flagMats[Math.abs(f + line) % flagMats.length]!);
      flag.rotation.x = Math.PI;
      flag.scale.set(0.9, 1.1, 0.15);
      const dist = f * 3.8;
      const sag = (1 - Math.abs(f) / 7) * -1.4;
      flag.position.set(dist, 9.2 + sag, 0);
      lineGroup.add(flag);
    }
    group.add(lineGroup);
    buntingLines.push(lineGroup);
  }
  landmarks.push({ x: 0, z: 0, label: "Praça Bumba Meu Boi" });

  // Palmeiras de babaçu / coqueiros esparsos no perímetro
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.75 });
  disposables.push(trunkMat, leafMat);

  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.18;
    const r = 74 + rng.range(-5, 6);
    const px = Math.cos(a) * r;
    const pz = Math.sin(a) * r;
    if (obstacles.some((o) => Math.hypot(o.x - px, o.z - pz) < o.radius + 6)) continue;
    const palm = new THREE.Group();
    palm.position.set(px, 0, pz);
    const trunk = new THREE.Mesh(lib.cylinderUnit, trunkMat);
    trunk.scale.set(0.55, 6.2, 0.55);
    trunk.position.y = 3.1;
    palm.add(trunk);
    const crown = new THREE.Mesh(lib.dodecahedron, leafMat);
    crown.scale.set(3.8, 2.0, 3.8);
    crown.position.y = 6.4;
    palm.add(crown);
    group.add(palm);
    obstacles.push({ x: px, z: pz, radius: 1.0 });
  }

  return {
    mapId: "sao_luis",
    group,
    obstacles,
    landmarks,
    disposables,
    update: (t) => {
      bay.position.y = -0.6 + Math.sin(t * 1.3) * 0.08;
      for (let i = 0; i < buntingLines.length; i++) {
        buntingLines[i]!.position.y = Math.sin(t * 2.2 + i) * 0.16;
      }
    },
  };
}

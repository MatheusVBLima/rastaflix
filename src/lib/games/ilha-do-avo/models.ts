import * as THREE from "three";
import type { EnemyArchetypeDefinition, EnemyArchetypeId, PickupKind } from "./types";

export interface ObstacleCollider {
  readonly x: number;
  readonly z: number;
  readonly radius: number;
}

export interface PlayerRig {
  readonly root: THREE.Group;
  readonly body: THREE.Group;
  readonly leftLeg: THREE.Group;
  readonly rightLeg: THREE.Group;
  readonly leftArm: THREE.Group;
  readonly rightArm: THREE.Group;
  readonly redBullAura: THREE.Mesh;
  readonly hitMaterials: THREE.MeshStandardMaterial[];
}

export interface FlashTarget {
  readonly mesh: THREE.Mesh;
  readonly baseMaterial: THREE.Material;
}

export interface EnemyRig {
  readonly root: THREE.Group;
  readonly body: THREE.Group;
  readonly leftLeg: THREE.Object3D;
  readonly rightLeg: THREE.Object3D;
  readonly flashTargets: FlashTarget[];
  readonly bossAura?: THREE.Mesh;
}

interface SharedArchetypeMaterials {
  readonly primary: THREE.MeshStandardMaterial;
  readonly secondary: THREE.MeshStandardMaterial;
  readonly accent: THREE.MeshStandardMaterial;
}

/**
 * Pool de geometrias, texturas e materiais compartilhados por inimigos,
 * projéteis e pickups para manter 60 FPS mesmo com 200+ mobs estilo Vampire Survivors.
 */
export class SharedAssetLibrary {
  readonly boxUnit = new THREE.BoxGeometry(1, 1, 1);
  readonly sphereLow = new THREE.SphereGeometry(0.5, 10, 8);
  readonly cylinderUnit = new THREE.CylinderGeometry(0.5, 0.5, 1, 10);
  readonly coneUnit = new THREE.ConeGeometry(0.5, 1, 8);
  readonly octahedron = new THREE.OctahedronGeometry(0.32, 0);
  readonly dodecahedron = new THREE.DodecahedronGeometry(0.38, 0);
  readonly ringUnit = new THREE.RingGeometry(0.75, 1, 28);
  readonly torusUnit = new THREE.TorusGeometry(0.5, 0.14, 8, 16);
  readonly shadowCircle = new THREE.CircleGeometry(1, 14);

  readonly redBullTexture: THREE.CanvasTexture;
  readonly shirtFrontTexture: THREE.Texture;
  readonly shirtFrontBumpTexture: THREE.Texture;
  readonly shirtFabricTexture: THREE.Texture;
  readonly shortsFrontTexture: THREE.Texture;
  readonly shortsSideTexture: THREE.Texture;
  readonly shortsBumpTexture: THREE.Texture;
  readonly sneakerTexture: THREE.Texture;

  // Materiais compartilhados (nunca descartados por entidade individual!)
  readonly sharedMaterials = new Set<THREE.Material>();
  readonly shadowMat: THREE.MeshBasicMaterial;
  readonly hitFlashMat: THREE.MeshBasicMaterial;
  readonly enemySkinMat: THREE.MeshStandardMaterial;
  readonly bossHairMat: THREE.MeshStandardMaterial;
  readonly bossAuraCrimsonMat: THREE.MeshBasicMaterial;
  readonly bossAuraGoldMat: THREE.MeshBasicMaterial;
  readonly xpSmallMat: THREE.MeshStandardMaterial;
  readonly xpMediumMat: THREE.MeshStandardMaterial;
  readonly xpBigMat: THREE.MeshStandardMaterial;
  readonly redBullCanMat: THREE.MeshStandardMaterial;
  readonly redBullTopMat: THREE.MeshStandardMaterial;
  readonly redBullGlowMat: THREE.MeshBasicMaterial;
  readonly magnetMat: THREE.MeshStandardMaterial;
  readonly fecharLiveMat: THREE.MeshStandardMaterial;

  private readonly enemyMats = new Map<EnemyArchetypeId, SharedArchetypeMaterials>();

  constructor() {
    const loader = new THREE.TextureLoader();
    const loadColorTex = (url: string): THREE.Texture => {
      const tex = loader.load(url);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      return tex;
    };
    const loadDataTex = (url: string): THREE.Texture => {
      const tex = loader.load(url);
      tex.anisotropy = 4;
      return tex;
    };

    this.redBullTexture = createRedBullCanTexture();
    this.shirtFrontTexture = loadColorTex("/textures/ovelhera/shirt-front.webp");
    this.shirtFrontBumpTexture = loadDataTex("/textures/ovelhera/shirt-front-bump.webp");
    this.shirtFabricTexture = loadColorTex("/textures/ovelhera/shirt-fabric.webp");
    this.shortsFrontTexture = loadColorTex("/textures/ovelhera/shorts-front.webp");
    this.shortsSideTexture = loadColorTex("/textures/ovelhera/shorts-side.webp");
    this.shortsBumpTexture = loadDataTex("/textures/ovelhera/shorts-bump.webp");
    this.sneakerTexture = loadColorTex("/textures/ovelhera/sneaker.webp");

    this.shadowMat = this.trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
      })
    );
    this.hitFlashMat = this.trackMat(new THREE.MeshBasicMaterial({ color: 0xffffff }));
    this.enemySkinMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0xe8be9e, roughness: 0.7 })
    );
    this.bossHairMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0x2a1215, roughness: 0.8 })
    );
    this.bossAuraCrimsonMat = this.trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xf43f5e,
        transparent: true,
        opacity: 0.78,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    this.bossAuraGoldMat = this.trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 0.78,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    this.xpSmallMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.55,
        roughness: 0.2,
      })
    );
    this.xpMediumMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x22c55e,
        emissiveIntensity: 0.55,
        roughness: 0.2,
      })
    );
    this.xpBigMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xfacc15,
        emissiveIntensity: 0.65,
        roughness: 0.2,
      })
    );
    this.redBullCanMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        map: this.redBullTexture,
        metalness: 0.45,
        roughness: 0.3,
        emissive: 0x0ea5e9,
        emissiveIntensity: 0.25,
      })
    );
    this.redBullTopMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.8, roughness: 0.2 })
    );
    this.redBullGlowMat = this.trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    this.magnetMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x14b8a6,
        emissive: 0x14b8a6,
        emissiveIntensity: 0.6,
        roughness: 0.25,
      })
    );
    this.fecharLiveMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xfacc15,
        emissiveIntensity: 0.7,
        roughness: 0.2,
      })
    );
  }

  private trackMat<T extends THREE.Material>(mat: T): T {
    this.sharedMaterials.add(mat);
    return mat;
  }

  getEnemyMaterials(archetype: EnemyArchetypeDefinition): SharedArchetypeMaterials {
    let entry = this.enemyMats.get(archetype.id);
    if (!entry) {
      entry = {
        primary: this.trackMat(
          new THREE.MeshStandardMaterial({
            color: archetype.primaryColor,
            roughness: 0.55,
            emissive: archetype.isBoss ? 0x550819 : 0x111111,
            emissiveIntensity: archetype.isBoss ? 0.25 : 0.05,
          })
        ),
        secondary: this.trackMat(
          new THREE.MeshStandardMaterial({
            color: archetype.secondaryColor,
            roughness: 0.65,
          })
        ),
        accent: this.trackMat(
          new THREE.MeshStandardMaterial({
            color: archetype.accentColor,
            roughness: 0.35,
            emissive: archetype.accentColor,
            emissiveIntensity: 0.45,
          })
        ),
      };
      this.enemyMats.set(archetype.id, entry);
    }
    return entry;
  }

  isSharedGeometry(geo: THREE.BufferGeometry): boolean {
    return (
      geo === this.boxUnit ||
      geo === this.sphereLow ||
      geo === this.cylinderUnit ||
      geo === this.coneUnit ||
      geo === this.octahedron ||
      geo === this.dodecahedron ||
      geo === this.ringUnit ||
      geo === this.torusUnit ||
      geo === this.shadowCircle
    );
  }

  isSharedMaterial(mat: THREE.Material): boolean {
    return this.sharedMaterials.has(mat);
  }

  dispose(): void {
    this.boxUnit.dispose();
    this.sphereLow.dispose();
    this.cylinderUnit.dispose();
    this.coneUnit.dispose();
    this.octahedron.dispose();
    this.dodecahedron.dispose();
    this.ringUnit.dispose();
    this.torusUnit.dispose();
    this.shadowCircle.dispose();

    this.redBullTexture.dispose();
    this.shirtFrontTexture.dispose();
    this.shirtFrontBumpTexture.dispose();
    this.shirtFabricTexture.dispose();
    this.shortsFrontTexture.dispose();
    this.shortsSideTexture.dispose();
    this.shortsBumpTexture.dispose();
    this.sneakerTexture.dispose();

    for (const mat of this.sharedMaterials) {
      mat.dispose();
    }
    this.sharedMaterials.clear();
  }
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  return [canvas, ctx];
}

/** Textura da latinha de Red Bull azul e prata. */
function createRedBullCanTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(128, 128);
  ctx.fillStyle = "#1d4ed8";
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillRect(64, 64, 64, 64);

  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(64, 0, 64, 64);
  ctx.fillRect(0, 64, 64, 64);

  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.arc(64, 64, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#dc2626";
  ctx.fillRect(46, 59, 36, 10);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Cria o boneco 3D do Ovelhera:
 * - Rosto/cabelo afro volumoso + cavanhaque + argolinhas (baseado no hero.png)
 * - Roupa fotorrealista extraída da foto oficial: camiseta amarela do Bob Marley,
 *   shorts vermelho Jordan com losango lateral e tênis chunky preto.
 */
export function createOvelheraRig(lib: SharedAssetLibrary): PlayerRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const hitMaterials: THREE.MeshStandardMaterial[] = [];

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xb97c56,
    roughness: 0.72,
    emissive: 0x000000,
    emissiveIntensity: 0,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x161414,
    roughness: 0.95,
    emissive: 0x000000,
    emissiveIntensity: 0,
  });

  const shirtFrontMat = new THREE.MeshStandardMaterial({
    map: lib.shirtFrontTexture,
    bumpMap: lib.shirtFrontBumpTexture,
    bumpScale: 0.045,
    roughness: 0.88,
    metalness: 0.02,
    emissive: 0x000000,
    emissiveIntensity: 0,
  });
  const shirtFabricMat = new THREE.MeshStandardMaterial({
    map: lib.shirtFabricTexture,
    bumpMap: lib.shirtFrontBumpTexture,
    bumpScale: 0.03,
    roughness: 0.9,
    metalness: 0.02,
    emissive: 0x000000,
    emissiveIntensity: 0,
  });
  const shortsFrontMat = new THREE.MeshStandardMaterial({
    map: lib.shortsFrontTexture,
    bumpMap: lib.shortsBumpTexture,
    bumpScale: 0.038,
    roughness: 0.82,
    metalness: 0.03,
    emissive: 0x000000,
    emissiveIntensity: 0,
  });
  const shortsSideMat = new THREE.MeshStandardMaterial({
    map: lib.shortsSideTexture,
    bumpMap: lib.shortsBumpTexture,
    bumpScale: 0.03,
    roughness: 0.8,
    metalness: 0.03,
    emissive: 0x000000,
    emissiveIntensity: 0,
  });
  const shoeUpperMat = new THREE.MeshStandardMaterial({
    map: lib.sneakerTexture,
    bumpMap: lib.sneakerTexture,
    bumpScale: 0.025,
    roughness: 0.72,
    metalness: 0.08,
  });
  const shoeSoleMat = new THREE.MeshStandardMaterial({
    color: 0x101013,
    roughness: 0.88,
    metalness: 0.05,
  });
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.85,
    roughness: 0.2,
  });

  hitMaterials.push(skinMat, shirtFrontMat, shirtFabricMat, shortsFrontMat, shortsSideMat);

  const contactShadow = new THREE.Mesh(lib.shadowCircle, lib.shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.scale.setScalar(0.8);
  contactShadow.position.y = 0.03;
  root.add(contactShadow);

  const redBullAura = new THREE.Mesh(
    lib.ringUnit,
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  redBullAura.rotation.x = -Math.PI / 2;
  redBullAura.position.y = 0.06;
  redBullAura.scale.setScalar(1.25);
  redBullAura.visible = false;
  root.add(redBullAura);

  const makeLeg = (xOffset: number, isRight: boolean): THREE.Group => {
    const legGroup = new THREE.Group();
    legGroup.position.set(xOffset, 0.76, 0);

    const legShortsMaterials = isRight
      ? [shortsSideMat, shortsFrontMat, shortsFrontMat, shortsFrontMat, shortsFrontMat, shortsFrontMat]
      : [shortsFrontMat, shortsSideMat, shortsFrontMat, shortsFrontMat, shortsFrontMat, shortsFrontMat];

    const shortTube = new THREE.Mesh(lib.boxUnit, legShortsMaterials);
    shortTube.scale.set(0.38, 0.42, 0.4);
    shortTube.position.y = -0.17;
    shortTube.castShadow = true;
    legGroup.add(shortTube);

    const calf = new THREE.Mesh(lib.cylinderUnit, skinMat);
    calf.scale.set(0.21, 0.28, 0.21);
    calf.position.y = -0.49;
    calf.castShadow = true;
    legGroup.add(calf);

    const shoeGroup = new THREE.Group();
    shoeGroup.position.set(0, -0.66, 0.05);
    legGroup.add(shoeGroup);

    const sole = new THREE.Mesh(lib.boxUnit, shoeSoleMat);
    sole.scale.set(0.31, 0.09, 0.47);
    sole.position.set(0, -0.04, 0.02);
    sole.castShadow = true;
    shoeGroup.add(sole);

    const upper = new THREE.Mesh(lib.boxUnit, shoeUpperMat);
    upper.scale.set(0.27, 0.14, 0.36);
    upper.position.set(0, 0.05, -0.02);
    upper.castShadow = true;
    shoeGroup.add(upper);

    const toeBox = new THREE.Mesh(lib.sphereLow, shoeUpperMat);
    toeBox.scale.set(0.27, 0.13, 0.22);
    toeBox.position.set(0, 0.03, 0.16);
    toeBox.castShadow = true;
    shoeGroup.add(toeBox);

    const tongue = new THREE.Mesh(lib.boxUnit, shoeUpperMat);
    tongue.scale.set(0.18, 0.12, 0.08);
    tongue.position.set(0, 0.12, 0.07);
    tongue.rotation.x = -0.35;
    shoeGroup.add(tongue);

    return legGroup;
  };

  const leftLeg = makeLeg(-0.22, false);
  const rightLeg = makeLeg(0.22, true);
  body.add(leftLeg, rightLeg);

  const pelvis = new THREE.Mesh(lib.boxUnit, shortsFrontMat);
  pelvis.scale.set(0.82, 0.24, 0.44);
  pelvis.position.y = 0.82;
  pelvis.castShadow = true;
  body.add(pelvis);

  const torsoMaterials = [
    shirtFabricMat,
    shirtFabricMat,
    shirtFabricMat,
    shirtFabricMat,
    shirtFrontMat,
    shirtFabricMat,
  ];
  const torso = new THREE.Mesh(lib.boxUnit, torsoMaterials);
  torso.scale.set(0.86, 0.84, 0.48);
  torso.position.y = 1.32;
  torso.castShadow = true;
  body.add(torso);

  const collar = new THREE.Mesh(lib.torusUnit, shirtFabricMat);
  collar.rotation.x = Math.PI / 2;
  collar.scale.set(0.42, 0.38, 0.28);
  collar.position.set(0, 1.74, 0.01);
  body.add(collar);

  const makeArm = (xOffset: number): THREE.Group => {
    const armGroup = new THREE.Group();
    armGroup.position.set(xOffset, 1.62, 0);

    const sleeve = new THREE.Mesh(lib.boxUnit, shirtFabricMat);
    sleeve.scale.set(0.29, 0.36, 0.31);
    sleeve.position.y = -0.16;
    sleeve.castShadow = true;
    armGroup.add(sleeve);

    const forearm = new THREE.Mesh(lib.cylinderUnit, skinMat);
    forearm.scale.set(0.18, 0.36, 0.18);
    forearm.position.y = -0.47;
    forearm.castShadow = true;
    armGroup.add(forearm);

    const hand = new THREE.Mesh(lib.sphereLow, skinMat);
    hand.scale.setScalar(0.2);
    hand.position.y = -0.66;
    armGroup.add(hand);

    return armGroup;
  };

  const leftArm = makeArm(-0.58);
  const rightArm = makeArm(0.58);
  body.add(leftArm, rightArm);

  const neck = new THREE.Mesh(lib.cylinderUnit, skinMat);
  neck.scale.set(0.24, 0.16, 0.24);
  neck.position.set(0, 1.8, 0);
  body.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 2.06, 0);
  body.add(headGroup);

  const head = new THREE.Mesh(lib.boxUnit, skinMat);
  head.scale.set(0.54, 0.52, 0.5);
  head.castShadow = true;
  headGroup.add(head);

  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const darkFaceMat = new THREE.MeshBasicMaterial({ color: 0x181414 });

  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(lib.boxUnit, eyeWhiteMat);
    eye.scale.set(0.1, 0.08, 0.04);
    eye.position.set(sx * 0.13, 0.04, 0.255);
    headGroup.add(eye);

    const pupil = new THREE.Mesh(lib.boxUnit, darkFaceMat);
    pupil.scale.set(0.05, 0.06, 0.045);
    pupil.position.set(sx * 0.13, 0.04, 0.265);
    headGroup.add(pupil);

    const brow = new THREE.Mesh(lib.boxUnit, darkFaceMat);
    brow.scale.set(0.14, 0.04, 0.04);
    brow.position.set(sx * 0.13, 0.12, 0.26);
    headGroup.add(brow);

    const earring = new THREE.Mesh(lib.torusUnit, silverMat);
    earring.scale.setScalar(0.12);
    earring.rotation.y = Math.PI / 2;
    earring.position.set(sx * 0.29, -0.04, 0.02);
    headGroup.add(earring);
  }

  const mustache = new THREE.Mesh(lib.boxUnit, darkFaceMat);
  mustache.scale.set(0.22, 0.055, 0.04);
  mustache.position.set(0, -0.09, 0.26);
  headGroup.add(mustache);

  const chinBeard = new THREE.Mesh(lib.boxUnit, darkFaceMat);
  chinBeard.scale.set(0.16, 0.07, 0.04);
  chinBeard.position.set(0, -0.2, 0.255);
  headGroup.add(chinBeard);

  const afroOffsets: Array<[number, number, number, number]> = [
    [0, 0.32, -0.02, 0.42],
    [-0.24, 0.24, -0.02, 0.3],
    [0.24, 0.24, -0.02, 0.3],
    [0, 0.26, -0.22, 0.32],
    [-0.2, 0.14, -0.2, 0.26],
    [0.2, 0.14, -0.2, 0.26],
    [-0.14, 0.36, 0.12, 0.24],
    [0.14, 0.36, 0.12, 0.24],
  ];
  for (const [ax, ay, az, r] of afroOffsets) {
    const puff = new THREE.Mesh(lib.dodecahedron, hairMat);
    puff.position.set(ax, ay, az);
    puff.scale.setScalar(r / 0.38);
    puff.castShadow = true;
    headGroup.add(puff);
  }

  return {
    root,
    body,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    redBullAura,
    hitMaterials,
  };
}

/**
 * Cria o rig de um inimigo usando materiais compartilhados (alta performance para 200+ mobs).
 */
export function createEnemyRig(
  archetype: EnemyArchetypeDefinition,
  lib: SharedAssetLibrary,
  options?: { isStageBoss?: boolean; isFinalBoss?: boolean; scaleOverride?: number }
): EnemyRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const mats = lib.getEnemyMaterials(archetype);
  const flashTargets: FlashTarget[] = [];
  const isBoss = Boolean(archetype.isBoss || options?.isStageBoss);
  const castShadow = isBoss;

  const trackFlash = (mesh: THREE.Mesh, mat: THREE.Material) => {
    flashTargets.push({ mesh, baseMaterial: mat });
  };

  const finalScale = options?.scaleOverride ?? archetype.scale;
  const shadow = new THREE.Mesh(lib.shadowCircle, lib.shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.setScalar(archetype.radius * (finalScale / archetype.scale) * 0.95);
  shadow.position.y = 0.03;
  root.add(shadow);

  let bossAura: THREE.Mesh | undefined;

  const leftLeg = new THREE.Mesh(lib.boxUnit, mats.secondary);
  leftLeg.scale.set(0.24, 0.52, 0.24);
  leftLeg.position.set(-0.18, 0.26, 0);
  leftLeg.castShadow = castShadow;

  const rightLeg = new THREE.Mesh(lib.boxUnit, mats.secondary);
  rightLeg.scale.set(0.24, 0.52, 0.24);
  rightLeg.position.set(0.18, 0.26, 0);
  rightLeg.castShadow = castShadow;

  body.add(leftLeg, rightLeg);

  if (archetype.id === "morango") {
    const dress = new THREE.Mesh(lib.coneUnit, mats.primary);
    dress.scale.set(1.15, 1.3, 1.15);
    dress.position.y = 0.95;
    dress.castShadow = true;
    body.add(dress);
    trackFlash(dress, mats.primary);

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const seed = new THREE.Mesh(lib.sphereLow, mats.accent);
      seed.scale.setScalar(0.16);
      seed.position.set(Math.cos(angle) * 0.36, 0.78 + (i % 2) * 0.22, Math.sin(angle) * 0.36);
      body.add(seed);
    }

    const head = new THREE.Mesh(lib.sphereLow, lib.enemySkinMat);
    head.scale.setScalar(0.56);
    head.position.y = 1.72;
    head.castShadow = true;
    body.add(head);
    trackFlash(head, lib.enemySkinMat);

    const hair = new THREE.Mesh(lib.boxUnit, lib.bossHairMat);
    hair.scale.set(0.64, 0.68, 0.32);
    hair.position.set(0, 1.56, -0.18);
    body.add(hair);

    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const leaf = new THREE.Mesh(lib.coneUnit, mats.secondary);
      leaf.scale.set(0.28, 0.42, 0.14);
      leaf.position.set(Math.cos(a) * 0.22, 2.02, Math.sin(a) * 0.22);
      leaf.rotation.z = -Math.cos(a) * 0.5;
      leaf.rotation.x = Math.sin(a) * 0.5;
      body.add(leaf);
    }
  } else if (archetype.id === "evangelion") {
    const torso = new THREE.Mesh(lib.boxUnit, mats.primary);
    torso.scale.set(0.72, 0.96, 0.46);
    torso.position.y = 1.02;
    torso.castShadow = castShadow;
    body.add(torso);
    trackFlash(torso, mats.primary);

    const core = new THREE.Mesh(lib.sphereLow, mats.accent);
    core.scale.setScalar(0.28);
    core.position.set(0, 1.12, 0.24);
    body.add(core);

    for (const sx of [-1, 1]) {
      const pylon = new THREE.Mesh(lib.boxUnit, mats.secondary);
      pylon.scale.set(0.22, 0.72, 0.28);
      pylon.position.set(sx * 0.52, 1.48, 0);
      body.add(pylon);
    }

    const head = new THREE.Mesh(lib.boxUnit, mats.primary);
    head.scale.set(0.42, 0.44, 0.48);
    head.position.y = 1.72;
    body.add(head);
    trackFlash(head, mats.primary);

    const visor = new THREE.Mesh(lib.boxUnit, mats.secondary);
    visor.scale.set(0.36, 0.1, 0.08);
    visor.position.set(0, 1.74, 0.24);
    body.add(visor);
  } else if (archetype.id === "lucas_podolski") {
    const torso = new THREE.Mesh(lib.boxUnit, mats.primary);
    torso.scale.set(0.76, 0.82, 0.46);
    torso.position.y = 0.94;
    torso.castShadow = castShadow;
    body.add(torso);
    trackFlash(torso, mats.primary);

    const stripe = new THREE.Mesh(lib.boxUnit, mats.accent);
    stripe.scale.set(0.78, 0.14, 0.48);
    stripe.position.y = 1.02;
    body.add(stripe);

    const head = new THREE.Mesh(lib.sphereLow, lib.enemySkinMat);
    head.scale.setScalar(0.56);
    head.position.y = 1.62;
    body.add(head);
    trackFlash(head, lib.enemySkinMat);
  } else if (archetype.id === "zkug") {
    const torso = new THREE.Mesh(lib.coneUnit, mats.primary);
    torso.scale.set(0.84, 0.92, 0.84);
    torso.position.y = 0.94;
    torso.castShadow = castShadow;
    body.add(torso);
    trackFlash(torso, mats.primary);

    const head = new THREE.Mesh(lib.dodecahedron, mats.secondary);
    head.scale.setScalar(0.8);
    head.position.y = 1.6;
    body.add(head);

    const visor = new THREE.Mesh(lib.boxUnit, mats.accent);
    visor.scale.set(0.44, 0.12, 0.12);
    visor.position.set(0, 1.62, 0.28);
    body.add(visor);
  } else {
    const torso = new THREE.Mesh(lib.boxUnit, mats.primary);
    torso.scale.set(0.66, 0.74, 0.42);
    torso.position.y = 0.9;
    torso.castShadow = castShadow;
    body.add(torso);
    trackFlash(torso, mats.primary);

    const head = new THREE.Mesh(lib.boxUnit, mats.secondary);
    head.scale.set(0.48, 0.46, 0.48);
    head.position.y = 1.54;
    body.add(head);
    trackFlash(head, mats.secondary);

    const visor = new THREE.Mesh(lib.boxUnit, mats.accent);
    visor.scale.set(0.42, 0.12, 0.1);
    visor.position.set(0, 1.58, 0.24);
    body.add(visor);
  }

  if (isBoss) {
    bossAura = new THREE.Mesh(
      lib.ringUnit,
      options?.isFinalBoss ? lib.bossAuraCrimsonMat : lib.bossAuraGoldMat
    );
    bossAura.rotation.x = -Math.PI / 2;
    bossAura.position.y = 0.06;
    bossAura.scale.setScalar(options?.isFinalBoss ? 2.2 : 1.75);
    root.add(bossAura);
  }

  body.scale.setScalar(finalScale);

  return {
    root,
    body,
    leftLeg,
    rightLeg,
    flashTargets,
    bossAura,
  };
}

/** Cria o mesh 3D de um pickup usando materiais compartilhados. */
export function createPickupMesh(kind: PickupKind, lib: SharedAssetLibrary): THREE.Group {
  const group = new THREE.Group();

  if (kind === "redbull") {
    const can = new THREE.Mesh(lib.cylinderUnit, lib.redBullCanMat);
    can.scale.set(0.42, 0.82, 0.42);
    can.position.y = 0.55;
    group.add(can);

    const top = new THREE.Mesh(lib.cylinderUnit, lib.redBullTopMat);
    top.scale.set(0.39, 0.06, 0.39);
    top.position.y = 0.97;
    group.add(top);

    const glow = new THREE.Mesh(lib.ringUnit, lib.redBullGlowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.05;
    glow.scale.setScalar(0.8);
    group.add(glow);
    return group;
  }

  if (kind === "magnet") {
    const ring = new THREE.Mesh(lib.torusUnit, lib.magnetMat);
    ring.scale.setScalar(0.75);
    ring.position.y = 0.65;
    group.add(ring);
    return group;
  }

  if (kind === "fechar_live") {
    const orb = new THREE.Mesh(lib.dodecahedron, lib.fecharLiveMat);
    orb.scale.setScalar(1.3);
    orb.position.y = 0.7;
    group.add(orb);
    return group;
  }

  const mat =
    kind === "xp_big"
      ? lib.xpBigMat
      : kind === "xp_medium"
        ? lib.xpMediumMat
        : lib.xpSmallMat;
  const scale = kind === "xp_big" ? 1.35 : kind === "xp_medium" ? 1.05 : 0.78;
  const gem = new THREE.Mesh(lib.octahedron, mat);
  gem.scale.setScalar(scale);
  gem.position.y = 0.45;
  group.add(gem);
  return group;
}

/** Cria o portal brilhante de transição para a próxima cidade/fase. */
export function createStagePortalMesh(lib: SharedAssetLibrary): THREE.Group {
  const group = new THREE.Group();

  const floorRing = new THREE.Mesh(
    lib.ringUnit,
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  floorRing.rotation.x = -Math.PI / 2;
  floorRing.position.y = 0.08;
  floorRing.scale.setScalar(3.2);
  group.add(floorRing);

  const gateTorus = new THREE.Mesh(
    lib.torusUnit,
    new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    })
  );
  gateTorus.scale.setScalar(4.4);
  gateTorus.position.y = 2.6;
  group.add(gateTorus);

  const beam = new THREE.Mesh(
    lib.cylinderUnit,
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    })
  );
  beam.scale.set(2.4, 24, 2.4);
  beam.position.y = 12;
  group.add(beam);

  return group;
}

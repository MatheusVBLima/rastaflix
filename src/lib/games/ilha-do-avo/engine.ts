import * as THREE from "three";
import { ProceduralAudio } from "./audio";
import {
  COMMON_ENEMY_IDS,
  ENEMY_ARCHETYPES,
  MAP_DEFINITIONS,
  MAP_LIST,
  PASSIVE_DEFINITIONS,
  PASSIVE_LIST,
  PLAYER_BASE_STATS,
  WEAPON_DEFINITIONS,
  WEAPON_LIST,
  xpRequiredForLevel,
} from "./content";
import { buildMapScene, type BuiltMapScene } from "./maps";
import {
  createEnemyRig,
  createOvelheraRig,
  createPickupMesh,
  createStagePortalMesh,
  SharedAssetLibrary,
  type EnemyRig,
  type ObstacleCollider,
  type PlayerRig,
} from "./models";
import { createSeededRandom, generateRunSeed, type SeededRng } from "./rng";
import type {
  BossHudSnapshot,
  DamageNumberSnapshot,
  EnemyArchetypeId,
  EquippedSlotSnapshot,
  FloatingBanner,
  GamePhase,
  HudSnapshot,
  MapId,
  MinimapMarker,
  PassiveId,
  PickupKind,
  PortalSnapshot,
  QualityLevel,
  RunSummary,
  UpgradeChoice,
  WeaponId,
} from "./types";

interface EnemyInstance {
  readonly id: number;
  readonly archetypeId: EnemyArchetypeId;
  readonly isBoss: boolean;
  readonly isFinalBoss: boolean;
  readonly displayName: string;
  readonly displayTitle: string;
  readonly bossTier: number;
  readonly baseScale: number;
  readonly rig: EnemyRig;
  x: number;
  z: number;
  vx: number;
  vz: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  hitFlash: number;
  isFlashing: boolean;
  slowTimer: number;
  slowFactor: number;
  animPhase: number;
  squashTimer: number;
  attackCooldown: number;
  bossState: "chase" | "telegraph_dash" | "dash" | "telegraph_burst" | "recovery";
  bossStateTimer: number;
  dashDirX: number;
  dashDirZ: number;
  bossMoveToggle: boolean;
  telegraphMesh: THREE.Mesh | null;
}

interface PlayerProjectile {
  readonly kind: "pedra" | "esculacho" | "engrossar_voz";
  readonly mesh: THREE.Object3D;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  damage: number;
  radius: number;
  knockback: number;
  life: number;
  pierceLeft: number;
  bouncesLeft: number;
  hitIds: Set<number>;
  targetEnemyId: number | null;
  speed: number;
}

interface EnemyProjectile {
  readonly mesh: THREE.Mesh;
  x: number;
  z: number;
  vx: number;
  vz: number;
  damage: number;
  radius: number;
  life: number;
  sourceName: string;
}

interface HazardZone {
  readonly kind: "professor_maconha";
  readonly mesh: THREE.Group;
  x: number;
  z: number;
  radius: number;
  damagePerTick: number;
  slowFactor: number;
  tickTimer: number;
  life: number;
  maxLife: number;
}

interface MeteorStrike {
  readonly ringMesh: THREE.Mesh;
  readonly meteorMesh: THREE.Mesh;
  x: number;
  z: number;
  radius: number;
  damage: number;
  delay: number;
  elapsed: number;
}

interface ShockwaveVfx {
  readonly mesh: THREE.Mesh;
  maxRadius: number;
  elapsed: number;
  duration: number;
}

interface ParticleVfx {
  readonly mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

interface PickupInstance {
  readonly id: number;
  readonly kind: PickupKind;
  readonly mesh: THREE.Group;
  x: number;
  z: number;
  xpValue: number;
  age: number;
  magnetized: boolean;
}

interface FloatingDamageEntry {
  readonly id: number;
  worldX: number;
  worldY: number;
  worldZ: number;
  text: string;
  kind: "normal" | "crit" | "heal" | "player";
  life: number;
  maxLife: number;
}

interface ActivePortal {
  readonly mesh: THREE.Group;
  readonly x: number;
  readonly z: number;
  readonly nextMapId: MapId;
  readonly nextMapName: string;
}

const BASE_CAMERA_FOV = 47;
const MAX_PARTICLES_HIGH = 95;
const MAX_PARTICLES_LOW = 36;
const MAX_DAMAGE_NUMBERS = 22;
const SPATIAL_CELL_SIZE = 4;

function pseudoNoise(t: number, seed: number): number {
  const x = Math.sin(t * 12.9898 + seed * 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

export class IlhaDoAvoEngine {
  private readonly container: HTMLElement;
  private readonly onSnapshot: (snapshot: HudSnapshot) => void;

  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly lib: SharedAssetLibrary;
  private readonly audio: ProceduralAudio;
  private readonly playerRig: PlayerRig;
  private readonly sunLight: THREE.DirectionalLight;
  private readonly hemiLight: THREE.HemisphereLight;

  private currentMapId: MapId = "ilha_avo_romeno";
  private mapScene!: BuiltMapScene;
  private activePortal: ActivePortal | null = null;

  private rng: SeededRng;
  private rafId = 0;
  private lastFrameTime = 0;
  private hudEmitAccum = 0;
  private disposed = false;

  // Estado da run
  private phase: GamePhase = "title";
  private quality: QualityLevel = "high";
  private elapsedSeconds = 0;
  private stageElapsedSeconds = 0;
  private visualTime = 0;
  private wave = 1;
  private score = 0;
  private kills = 0;
  private bossesDefeated = 0;
  private stageBossSpawned = false;
  private endlessMode = false;
  private endlessBossTimer = 110;
  private bossTierCounter = 0;
  private nextEntityId = 1;
  private nextBannerId = 1;
  private nextDamageId = 1;
  private spawnTimer = 0.5;
  private worldRedBullTimer = 20;

  // Estado do jogador
  private playerX = 0;
  private playerZ = 0;
  private playerFacing = 0;
  private playerHp: number = PLAYER_BASE_STATS.maxHp;
  private playerMaxHp: number = PLAYER_BASE_STATS.maxHp;
  private playerXp = 0;
  private playerLevel = 1;
  private playerXpToNext = xpRequiredForLevel(1);
  private playerInvulnTimer = 0;
  private playerHitFlash = 0;
  private playerRunCycle = 0;
  private redBullBoostTimer = 0;
  private lastDamageSource = "Horda da Cidade";

  // Armas e passivas
  private weapons = new Map<WeaponId, number>();
  private passives = new Map<PassiveId, number>();
  private weaponCooldowns = new Map<WeaponId, number>();
  private upgradeChoices: UpgradeChoice[] = [];
  private summary: RunSummary | null = null;
  private banner: FloatingBanner | null = null;
  private bannerTimer = 0;

  // Entidades ativas
  private enemies: EnemyInstance[] = [];
  private playerProjectiles: PlayerProjectile[] = [];
  private enemyProjectiles: EnemyProjectile[] = [];
  private zones: HazardZone[] = [];
  private meteors: MeteorStrike[] = [];
  private shockwaves: ShockwaveVfx[] = [];
  private particles: ParticleVfx[] = [];
  private pickups: PickupInstance[] = [];
  private damageEntries: FloatingDamageEntry[] = [];

  // Spatial hash reutilizável para separação O(N) de 200+ mobs
  private readonly spatialGrid = new Map<number, EnemyInstance[]>();

  // Game feel
  private trauma = 0;
  private fovPunch = 0;
  private hitstopRemaining = 0;
  private timeScale = 1;

  // Input
  private keys = new Set<string>();
  private virtualMoveX = 0;
  private virtualMoveZ = 0;

  private readonly tmpVec = new THREE.Vector3();
  private readonly resizeObserver: ResizeObserver;

  constructor(container: HTMLElement, onSnapshot: (snapshot: HudSnapshot) => void) {
    this.container = container;
    this.onSnapshot = onSnapshot;
    this.rng = createSeededRandom(generateRunSeed());
    this.audio = new ProceduralAudio();
    this.lib = new SharedAssetLibrary();

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.touchAction = "none";
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    this.camera = new THREE.PerspectiveCamera(BASE_CAMERA_FOV, width / height, 0.5, 360);
    this.renderer.setSize(width, height, false);

    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x92400e, 0.95);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff7ed, 1.65);
    this.sunLight.position.set(24, 40, 20);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 125;
    const d = 38;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    this.playerRig = createOvelheraRig(this.lib);
    this.scene.add(this.playerRig.root);

    this.loadMap("ilha_avo_romeno");

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);

    window.addEventListener("keydown", this.handleKeyDown, { passive: false });
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.handleWindowBlur);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);

    this.initDefaultLoadout();
    this.emitSnapshot(true);

    this.lastFrameTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  // =========================================================================
  // API Pública
  // =========================================================================

  selectMap(mapId: MapId): void {
    if (this.currentMapId === mapId) return;
    this.loadMap(mapId);
    this.emitSnapshot(true);
  }

  startNewRun(mapId?: MapId, customSeed?: number): void {
    this.audio.unlock();
    this.clearDynamicEntities();

    if (mapId && mapId !== this.currentMapId) {
      this.loadMap(mapId);
    }

    const mapDef = MAP_DEFINITIONS[this.currentMapId];
    this.rng = createSeededRandom(customSeed ?? generateRunSeed());
    this.elapsedSeconds = 0;
    this.stageElapsedSeconds = 0;
    this.wave = 1;
    this.score = 0;
    this.kills = 0;
    this.bossesDefeated = 0;
    this.stageBossSpawned = false;
    this.endlessMode = false;
    this.endlessBossTimer = 110;
    this.bossTierCounter = 0;
    this.spawnTimer = 0.35;
    this.worldRedBullTimer = 18;

    this.playerX = 0;
    this.playerZ = 0;
    this.playerFacing = 0;
    this.playerMaxHp = PLAYER_BASE_STATS.maxHp;
    this.playerHp = this.playerMaxHp;
    this.playerXp = 0;
    this.playerLevel = 1;
    this.playerXpToNext = xpRequiredForLevel(1);
    this.playerInvulnTimer = 0.7;
    this.playerHitFlash = 0;
    this.redBullBoostTimer = 0;
    this.lastDamageSource = `Horda de ${mapDef.name}`;
    this.trauma = 0;
    this.fovPunch = 0;
    this.hitstopRemaining = 0;
    this.timeScale = 1;
    this.summary = null;
    this.upgradeChoices = [];
    this.playerRig.root.position.set(0, 0, 0);
    this.playerRig.body.scale.set(1, 1, 1);

    this.initDefaultLoadout();
    this.phase = "playing";
    this.showBanner(`Fase ${mapDef.order}: ${mapDef.name} — Sobreviva!`, "wave", 3.2);

    // Onda inicial imediata estilo Vampire Survivors
    for (let i = 0; i < 6; i++) {
      this.spawnCommonEnemy(20 + i * 2);
    }

    this.emitSnapshot(true);
  }

  advanceToNextMap(): void {
    const currentDef = MAP_DEFINITIONS[this.currentMapId];
    const nextId = currentDef.nextMapId;
    if (!nextId) return;

    this.audio.unlock();
    this.clearDynamicEntities();
    this.loadMap(nextId);

    const nextDef = MAP_DEFINITIONS[nextId];
    this.stageElapsedSeconds = 0;
    this.stageBossSpawned = false;
    this.spawnTimer = 0.5;
    this.worldRedBullTimer = 16;

    // Mantém nível, armas, passivas e pontuação! Recupera 40% da vida na chegada
    this.playerX = 0;
    this.playerZ = 0;
    this.playerHp = Math.min(this.playerMaxHp, this.playerHp + Math.round(this.playerMaxHp * 0.4));
    this.playerInvulnTimer = 1.4;
    this.playerRig.root.position.set(0, 0, 0);
    this.score += 500;

    this.audio.play("powerup", this.rng);
    this.punchFov(6);
    this.phase = "playing";
    this.showBanner(
      nextDef.isFinalStage
        ? `FASE FINAL: ${nextDef.name.toUpperCase()} — A MORANGO TE ESPERA!`
        : `Fase ${nextDef.order}: ${nextDef.name} (${nextDef.stateLabel})`,
      nextDef.isFinalStage ? "boss" : "wave",
      3.8
    );

    for (let i = 0; i < 8; i++) {
      this.spawnCommonEnemy(22 + i * 1.5);
    }

    this.emitSnapshot(true);
  }

  continueEndlessAfterVictory(): void {
    if (this.phase !== "victory") return;
    this.endlessMode = true;
    this.endlessBossTimer = 95;
    this.summary = null;
    this.playerHp = this.playerMaxHp;
    this.playerInvulnTimer = 1.5;
    this.phase = "playing";
    this.lastFrameTime = performance.now();
    this.showBanner("Modo Infinito liberado em São Luís!", "wave", 3.0);
    this.emitSnapshot(true);
  }

  finishRunFromVictory(): void {
    if (this.phase !== "victory") return;
    this.phase = "gameover";
    this.emitSnapshot(true);
  }

  setVirtualMove(dx: number, dz: number): void {
    const len = Math.hypot(dx, dz);
    if (len > 1) {
      this.virtualMoveX = dx / len;
      this.virtualMoveZ = dz / len;
    } else {
      this.virtualMoveX = dx;
      this.virtualMoveZ = dz;
    }
  }

  selectUpgrade(index: number): void {
    if (this.phase !== "levelup") return;
    const choice = this.upgradeChoices[index];
    if (!choice) return;

    this.audio.unlock();
    if (choice.kind === "weapon") {
      const id = choice.id as WeaponId;
      this.weapons.set(id, choice.nextLevel);
      if (!this.weaponCooldowns.has(id)) {
        this.weaponCooldowns.set(id, 0.15);
      }
    } else {
      const id = choice.id as PassiveId;
      this.passives.set(id, choice.nextLevel);
      if (id === "estoque_redbull") {
        this.playerMaxHp = PLAYER_BASE_STATS.maxHp + choice.nextLevel * 25;
        this.playerHp = Math.min(this.playerMaxHp, this.playerHp + 25);
      }
    }

    this.upgradeChoices = [];
    this.phase = "playing";
    this.audio.play("powerup", this.rng);
    this.emitSnapshot(true);
  }

  togglePause(): void {
    if (this.phase === "playing") {
      this.phase = "paused";
      this.keys.clear();
      this.emitSnapshot(true);
    } else if (this.phase === "paused") {
      this.phase = "playing";
      this.lastFrameTime = performance.now();
      this.emitSnapshot(true);
    }
  }

  toggleMute(): void {
    this.audio.unlock();
    this.audio.toggleMute();
    this.emitSnapshot(true);
  }

  setQuality(quality: QualityLevel): void {
    this.quality = quality;
    const isLow = quality === "low";
    this.renderer.setPixelRatio(isLow ? 1 : Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.shadowMap.enabled = !isLow;
    this.sunLight.castShadow = !isLow;
    this.emitSnapshot(true);
  }

  returnToTitle(): void {
    this.clearDynamicEntities();
    this.phase = "title";
    this.summary = null;
    this.upgradeChoices = [];
    this.playerX = 0;
    this.playerZ = 0;
    this.playerRig.root.position.set(0, 0, 0);
    this.emitSnapshot(true);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    this.resizeObserver.disconnect();

    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.handleWindowBlur);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);

    this.clearDynamicEntities();
    this.removeObject(this.playerRig.root);
    this.disposeCurrentMap();
    this.audio.dispose();
    this.lib.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  // =========================================================================
  // Carregamento de Mapas
  // =========================================================================

  private disposeCurrentMap(): void {
    if (!this.mapScene) return;
    this.scene.remove(this.mapScene.group);
    for (const d of this.mapScene.disposables) {
      d.dispose();
    }
  }

  private loadMap(mapId: MapId): void {
    this.disposeCurrentMap();
    this.currentMapId = mapId;
    const def = MAP_DEFINITIONS[mapId];

    this.scene.background = new THREE.Color(def.skyColor);
    this.scene.fog = new THREE.FogExp2(def.fogColor, def.fogDensity);
    this.sunLight.color.setHex(def.sunColor);
    this.sunLight.intensity = def.sunIntensity;
    this.hemiLight.color.setHex(def.hemiSkyColor);
    this.hemiLight.groundColor.setHex(def.hemiGroundColor);

    this.mapScene = buildMapScene(mapId, this.lib, createSeededRandom(42069 + def.order * 1337));
    this.scene.add(this.mapScene.group);
  }

  // =========================================================================
  // Setup & Input
  // =========================================================================

  private initDefaultLoadout(): void {
    this.weapons.clear();
    this.passives.clear();
    this.weaponCooldowns.clear();
    this.weapons.set("pedra", 1);
    this.weaponCooldowns.set("pedra", 0.45);
  }

  private handleResize(): void {
    if (this.disposed) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    const code = e.code;

    if (
      this.phase === "playing" &&
      (code === "ArrowUp" ||
        code === "ArrowDown" ||
        code === "ArrowLeft" ||
        code === "ArrowRight" ||
        code === "Space")
    ) {
      e.preventDefault();
    }

    this.audio.unlock();

    if (code === "Escape" || code === "KeyP") {
      if (this.phase === "playing" || this.phase === "paused") {
        e.preventDefault();
        this.togglePause();
      }
      return;
    }

    if (this.phase === "playing" && code === "KeyE" && this.activePortal) {
      e.preventDefault();
      this.advanceToNextMap();
      return;
    }

    if (this.phase === "levelup") {
      if (code === "Digit1" || code === "Numpad1") this.selectUpgrade(0);
      else if (code === "Digit2" || code === "Numpad2") this.selectUpgrade(1);
      else if (code === "Digit3" || code === "Numpad3") this.selectUpgrade(2);
      return;
    }

    this.keys.add(code);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private handleWindowBlur = (): void => {
    this.keys.clear();
    this.virtualMoveX = 0;
    this.virtualMoveZ = 0;
    if (this.phase === "playing") {
      this.phase = "paused";
      this.emitSnapshot(true);
    }
  };

  private handleVisibilityChange = (): void => {
    if (document.hidden && this.phase === "playing") {
      this.keys.clear();
      this.phase = "paused";
      this.emitSnapshot(true);
    }
  };

  // =========================================================================
  // Loop Principal
  // =========================================================================

  private loop = (now: number): void => {
    if (this.disposed) return;
    const rawDelta = Math.min(0.05, Math.max(0.001, (now - this.lastFrameTime) / 1000));
    this.lastFrameTime = now;

    this.visualTime += rawDelta;
    this.animateEnvironment(rawDelta);

    if (this.phase === "playing") {
      if (this.hitstopRemaining > 0) {
        this.hitstopRemaining -= rawDelta;
        if (this.hitstopRemaining <= 0) {
          this.hitstopRemaining = 0;
          this.timeScale = 1;
        }
      }
      const gameplayDelta = rawDelta * this.timeScale;
      this.updateSimulation(gameplayDelta, rawDelta);
      this.updateCameraPlaying(rawDelta);
    } else if (this.phase === "title") {
      this.updateCameraTitle(rawDelta);
    } else {
      this.updateFov(rawDelta);
    }

    this.renderer.render(this.scene, this.camera);

    this.hudEmitAccum += rawDelta;
    if (this.hudEmitAccum >= 0.065) {
      this.hudEmitAccum = 0;
      this.emitSnapshot(false);
    }

    this.rafId = requestAnimationFrame(this.loop);
  };

  private animateEnvironment(delta: number): void {
    this.mapScene.update(this.visualTime, delta);

    if (this.activePortal) {
      this.activePortal.mesh.rotation.y += delta * 1.6;
      const pulse = 1 + Math.sin(this.visualTime * 4) * 0.06;
      this.activePortal.mesh.scale.setScalar(pulse);
    }

    if (this.phase === "title") {
      this.playerRig.body.position.y = Math.sin(this.visualTime * 2.6) * 0.06;
      this.playerRig.root.rotation.y = Math.sin(this.visualTime * 0.8) * 0.35;
    } else if (this.playerRig.redBullAura.visible) {
      this.playerRig.redBullAura.rotation.z += delta * 3.5;
      const pulse = 1.15 + Math.sin(this.visualTime * 10) * 0.1;
      this.playerRig.redBullAura.scale.setScalar(pulse);
    }
  }

  private updateCameraTitle(_delta: number): void {
    const angle = Math.sin(this.visualTime * 0.35) * 0.65;
    const radius = 8.4;
    this.camera.position.set(Math.sin(angle) * radius, 3.6, Math.cos(angle) * radius);
    this.camera.lookAt(0, 0.45, 0);
  }

  private updateCameraPlaying(realDelta: number): void {
    // Câmera isométrica aberta estilo Vampire Survivors para enxergar hordas grandes
    const targetX = this.playerX;
    const targetY = 23.5;
    const targetZ = this.playerZ + 20.5;

    const lerpFactor = 1 - Math.exp(-realDelta * 7.5);
    this.camera.position.x += (targetX - this.camera.position.x) * lerpFactor;
    this.camera.position.y += (targetY - this.camera.position.y) * lerpFactor;
    this.camera.position.z += (targetZ - this.camera.position.z) * lerpFactor;

    this.trauma = Math.max(0, this.trauma - 1.65 * realDelta);
    let shakeX = 0;
    let shakeY = 0;
    if (this.trauma > 0.001) {
      const shake = this.trauma * this.trauma;
      const freq = this.visualTime * 34;
      shakeX = 0.65 * shake * pseudoNoise(freq, 1);
      shakeY = 0.45 * shake * pseudoNoise(freq, 2);
    }

    this.camera.position.x += shakeX;
    this.camera.position.y += shakeY;
    this.camera.lookAt(this.playerX, 0.8, this.playerZ);

    this.sunLight.position.set(this.playerX + 24, 38, this.playerZ + 18);
    this.sunLight.target.position.set(this.playerX, 0, this.playerZ);
    this.sunLight.target.updateMatrixWorld();

    this.updateFov(realDelta);
  }

  private updateFov(realDelta: number): void {
    if (this.fovPunch <= 0.01) return;
    this.fovPunch *= Math.exp(-realDelta / 0.28);
    if (this.fovPunch <= 0.01) this.fovPunch = 0;
    this.camera.fov = BASE_CAMERA_FOV + this.fovPunch;
    this.camera.updateProjectionMatrix();
  }

  private addTrauma(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  private triggerHitstop(durationMs: number, scale = 0.06): void {
    this.hitstopRemaining = Math.max(this.hitstopRemaining, durationMs / 1000);
    this.timeScale = scale;
  }

  private punchFov(degrees: number): void {
    this.fovPunch = Math.min(8, this.fovPunch + degrees);
  }

  // =========================================================================
  // Simulação de Gameplay
  // =========================================================================

  private updateSimulation(dt: number, realDelta: number): void {
    this.elapsedSeconds += dt;
    this.stageElapsedSeconds += dt;
    this.score += dt * 1.8;

    const newWave = Math.floor(this.elapsedSeconds / 30) + 1;
    if (newWave > this.wave) {
      this.wave = newWave;
      this.showBanner(`Onda ${this.wave} — A horda engrossou!`, "wave", 2.3);
    }

    if (this.bannerTimer > 0) {
      this.bannerTimer -= realDelta;
      if (this.bannerTimer <= 0) {
        this.banner = null;
      }
    }

    this.updatePlayer(dt, realDelta);
    this.updatePortalCheck();
    this.updateSpawning(dt);
    this.updateWeapons(dt);
    this.updatePlayerProjectiles(dt);
    this.updateZones(dt);
    this.updateMeteors(dt);
    this.updateEnemies(dt, realDelta);
    this.updateEnemyProjectiles(dt);
    this.updatePickups(dt);
    this.updateVfx(realDelta);
    this.updateDamageNumbers(realDelta);
  }

  private updatePortalCheck(): void {
    if (!this.activePortal) return;
    const dist = Math.hypot(this.playerX - this.activePortal.x, this.playerZ - this.activePortal.z);
    if (dist <= 3.1) {
      this.advanceToNextMap();
    }
  }

  private updatePlayer(dt: number, realDelta: number): void {
    const redBullLevel = this.passives.get("estoque_redbull") ?? 0;
    if (redBullLevel > 0 && this.playerHp < this.playerMaxHp) {
      this.playerHp = Math.min(this.playerMaxHp, this.playerHp + redBullLevel * 0.7 * dt);
    }

    if (this.playerInvulnTimer > 0) {
      this.playerInvulnTimer = Math.max(0, this.playerInvulnTimer - dt);
    }

    if (this.redBullBoostTimer > 0) {
      this.redBullBoostTimer = Math.max(0, this.redBullBoostTimer - dt);
    }
    this.playerRig.redBullAura.visible = this.redBullBoostTimer > 0;

    let moveX = this.virtualMoveX;
    let moveZ = this.virtualMoveZ;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) moveZ -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) moveZ += 1;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) moveX -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) moveX += 1;

    const mag = Math.hypot(moveX, moveZ);
    const speedBonus = 1 + (this.passives.get("velocidade_rasta") ?? 0) * 0.12;
    const redBullMult = this.redBullBoostTimer > 0 ? 1.28 : 1;
    const moveSpeed = PLAYER_BASE_STATS.speed * speedBonus * redBullMult;

    if (mag > 0.05) {
      const nx = moveX / Math.max(1, mag);
      const nz = moveZ / Math.max(1, mag);
      this.playerX += nx * moveSpeed * dt;
      this.playerZ += nz * moveSpeed * dt;

      const targetAngle = Math.atan2(nx, nz);
      let diff = targetAngle - this.playerFacing;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.playerFacing += diff * Math.min(1, dt * 14);

      this.playerRunCycle += dt * 13 * redBullMult;
      const swing = Math.sin(this.playerRunCycle) * 0.62;
      this.playerRig.leftLeg.rotation.x = swing;
      this.playerRig.rightLeg.rotation.x = -swing;
      this.playerRig.leftArm.rotation.x = -swing * 0.75;
      this.playerRig.rightArm.rotation.x = swing * 0.75;
      this.playerRig.body.position.y = Math.abs(Math.sin(this.playerRunCycle)) * 0.11;
    } else {
      this.playerRig.leftLeg.rotation.x *= 0.82;
      this.playerRig.rightLeg.rotation.x *= 0.82;
      this.playerRig.leftArm.rotation.x *= 0.82;
      this.playerRig.rightArm.rotation.x *= 0.82;
      this.playerRig.body.position.y = Math.sin(this.visualTime * 3) * 0.04;
    }

    const resolved = this.resolveArenaBounds(
      this.playerX,
      this.playerZ,
      PLAYER_BASE_STATS.radius,
      this.mapScene.obstacles
    );
    this.playerX = resolved.x;
    this.playerZ = resolved.z;

    this.playerRig.root.position.set(this.playerX, 0, this.playerZ);
    this.playerRig.root.rotation.y = this.playerFacing;

    if (this.playerHitFlash > 0) {
      this.playerHitFlash = Math.max(0, this.playerHitFlash - realDelta * 4.5);
      for (const mat of this.playerRig.hitMaterials) {
        mat.emissive.setHex(0xff2222);
        mat.emissiveIntensity = this.playerHitFlash * 1.4;
      }
    } else {
      for (const mat of this.playerRig.hitMaterials) {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      }
    }
  }

  private resolveArenaBounds(
    x: number,
    z: number,
    radius: number,
    obstacles: readonly ObstacleCollider[]
  ): { x: number; z: number } {
    let rx = x;
    let rz = z;
    const playableR = MAP_DEFINITIONS[this.currentMapId].playableRadius;

    for (const obs of obstacles) {
      const dx = rx - obs.x;
      const dz = rz - obs.z;
      const minDist = radius + obs.radius;
      const distSq = dx * dx + dz * dz;
      if (distSq < minDist * minDist && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const push = minDist - dist;
        rx += (dx / dist) * push;
        rz += (dz / dist) * push;
      }
    }

    const maxR = playableR - radius;
    const distFromCenter = Math.hypot(rx, rz);
    if (distFromCenter > maxR) {
      const scale = maxR / distFromCenter;
      rx *= scale;
      rz *= scale;
    }

    return { x: rx, z: rz };
  }

  // =========================================================================
  // Spawning Estilo Vampire Survivors (Hordas Grandes + Boss da Fase / Morango Final)
  // =========================================================================

  private updateSpawning(dt: number): void {
    const mapDef = MAP_DEFINITIONS[this.currentMapId];
    const maxEnemies =
      this.quality === "high"
        ? mapDef.maxEnemiesBase
        : Math.round(mapDef.maxEnemiesBase * 0.52);

    // Red Bulls espalhados pelo mapa grande para incentivar exploração
    this.worldRedBullTimer -= dt;
    if (this.worldRedBullTimer <= 0) {
      this.worldRedBullTimer = this.rng.range(18, 26);
      const activeRedBulls = this.pickups.filter((p) => p.kind === "redbull").length;
      if (activeRedBulls < 5) {
        const angle = this.rng.range(0, Math.PI * 2);
        const dist = this.rng.range(18, 42);
        const pos = this.resolveArenaBounds(
          this.playerX + Math.cos(angle) * dist,
          this.playerZ + Math.sin(angle) * dist,
          1.2,
          this.mapScene.obstacles
        );
        this.spawnPickup("redbull", pos.x, pos.z, 0);
      }
    }

    // Spawn do Boss da fase (Fases 1-4: Guardião da Fase | Fase 5 São Luís: BOSS FINAL MORANGO!)
    const hasBoss = this.enemies.some((e) => e.isBoss);
    if (!this.stageBossSpawned && !hasBoss && this.stageElapsedSeconds >= mapDef.bossSpawnSecond) {
      this.stageBossSpawned = true;
      this.bossTierCounter += 1;
      this.spawnStageBoss(this.bossTierCounter);
    } else if (this.endlessMode && !hasBoss) {
      this.endlessBossTimer -= dt;
      if (this.endlessBossTimer <= 0) {
        this.endlessBossTimer = 95;
        this.bossTierCounter += 1;
        this.spawnStageBoss(this.bossTierCounter);
      }
    }

    // Horda estilo Vampire Survivors (lotes crescentes de 2 a 6 inimigos por ciclo!)
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.enemies.length < maxEnemies) {
      const interval = Math.max(
        0.18,
        (0.95 - this.elapsedSeconds * 0.0028) / Math.sqrt(mapDef.difficultyMultiplier)
      );
      this.spawnTimer = interval;

      const batchSize =
        this.elapsedSeconds > 210
          ? 6
          : this.elapsedSeconds > 120
            ? 4
            : this.elapsedSeconds > 45
              ? 3
              : 2;

      for (let i = 0; i < batchSize; i++) {
        if (this.enemies.length >= maxEnemies) break;
        this.spawnCommonEnemy();
      }
    }
  }

  private pickEnemyArchetype(): EnemyArchetypeId {
    const mapDef = MAP_DEFINITIONS[this.currentMapId];
    // Nas fases 2+, todos os 4 tipos comuns já podem aparecer mais cedo!
    const effectiveTime = this.elapsedSeconds + (mapDef.order - 1) * 30;
    const eligible = COMMON_ENEMY_IDS.filter(
      (id) => effectiveTime >= ENEMY_ARCHETYPES[id].minSpawnSecond
    );
    let totalWeight = 0;
    for (const id of eligible) totalWeight += ENEMY_ARCHETYPES[id].spawnWeight;
    let roll = this.rng.next() * totalWeight;
    for (const id of eligible) {
      roll -= ENEMY_ARCHETYPES[id].spawnWeight;
      if (roll <= 0) return id;
    }
    return eligible[0] ?? "evostt";
  }

  private spawnCommonEnemy(fixedDist?: number): void {
    const mapDef = MAP_DEFINITIONS[this.currentMapId];
    const archetypeId = this.pickEnemyArchetype();
    const def = ENEMY_ARCHETYPES[archetypeId];
    const angle = this.rng.range(0, Math.PI * 2);
    const dist = fixedDist ?? this.rng.range(24, 34);

    let sx = this.playerX + Math.cos(angle) * dist;
    let sz = this.playerZ + Math.sin(angle) * dist;
    const clamped = this.resolveArenaBounds(sx, sz, def.radius, this.mapScene.obstacles);
    sx = clamped.x;
    sz = clamped.z;

    if (Math.hypot(sx - this.playerX, sz - this.playerZ) < 12) {
      const oppAngle = Math.atan2(-this.playerZ, -this.playerX) + this.rng.range(-0.6, 0.6);
      sx = this.playerX + Math.cos(oppAngle) * 24;
      sz = this.playerZ + Math.sin(oppAngle) * 24;
    }

    const scaleFactor = mapDef.difficultyMultiplier * (1 + this.elapsedSeconds / 150);
    const rig = createEnemyRig(def, this.lib);
    rig.root.position.set(sx, 0, sz);
    this.scene.add(rig.root);

    const hp = Math.round(def.baseHp * scaleFactor);
    this.enemies.push({
      id: this.nextEntityId++,
      archetypeId,
      isBoss: false,
      isFinalBoss: false,
      displayName: def.name,
      displayTitle: "",
      bossTier: 0,
      baseScale: def.scale,
      rig,
      x: sx,
      z: sz,
      vx: 0,
      vz: 0,
      hp,
      maxHp: hp,
      speed: def.speed * (1 + Math.min(0.45, this.elapsedSeconds / 500)),
      damage: Math.round(def.damage * (1 + this.elapsedSeconds / 240) * Math.sqrt(mapDef.difficultyMultiplier)),
      radius: def.radius,
      hitFlash: 0,
      isFlashing: false,
      slowTimer: 0,
      slowFactor: 1,
      animPhase: this.rng.range(0, Math.PI * 2),
      squashTimer: 0,
      attackCooldown: def.rangedCooldown ? this.rng.range(1.2, def.rangedCooldown) : 0,
      bossState: "chase",
      bossStateTimer: 0,
      dashDirX: 0,
      dashDirZ: 0,
      bossMoveToggle: false,
      telegraphMesh: null,
    });
  }

  private spawnStageBoss(tier: number): void {
    const mapDef = MAP_DEFINITIONS[this.currentMapId];
    const archetypeId = mapDef.bossArchetypeId;
    const def = ENEMY_ARCHETYPES[archetypeId];
    const isFinalBoss = mapDef.isFinalStage;

    const scaleOverride = isFinalBoss ? def.scale : def.scale * 1.65;
    const radius = isFinalBoss ? def.radius : def.radius * 1.55;

    const angle = this.rng.range(0, Math.PI * 2);
    const pos = this.resolveArenaBounds(
      this.playerX + Math.cos(angle) * 25,
      this.playerZ + Math.sin(angle) * 25,
      radius,
      this.mapScene.obstacles
    );

    const rig = createEnemyRig(def, this.lib, {
      isStageBoss: true,
      isFinalBoss,
      scaleOverride,
    });
    rig.root.position.set(pos.x, 0, pos.z);
    this.scene.add(rig.root);

    const baseBossHp = isFinalBoss ? def.baseHp : 520 * mapDef.difficultyMultiplier;
    const hp = Math.round(baseBossHp * (1 + (tier - 1) * 0.45));

    this.enemies.push({
      id: this.nextEntityId++,
      archetypeId,
      isBoss: true,
      isFinalBoss,
      displayName: mapDef.bossDisplayName,
      displayTitle: mapDef.bossTitle,
      bossTier: tier,
      baseScale: scaleOverride,
      rig,
      x: pos.x,
      z: pos.z,
      vx: 0,
      vz: 0,
      hp,
      maxHp: hp,
      speed: (isFinalBoss ? def.speed : def.speed * 1.05) + (tier - 1) * 0.2,
      damage: Math.round((isFinalBoss ? def.damage : 18 * mapDef.difficultyMultiplier) + (tier - 1) * 4),
      radius,
      hitFlash: 0,
      isFlashing: false,
      slowTimer: 0,
      slowFactor: 1,
      animPhase: 0,
      squashTimer: 0,
      attackCooldown: 2.4,
      bossState: "chase",
      bossStateTimer: 0,
      dashDirX: 0,
      dashDirZ: 0,
      bossMoveToggle: false,
      telegraphMesh: null,
    });

    this.audio.play("boss_warn", this.rng);
    this.addTrauma(isFinalBoss ? 0.72 : 0.5);
    this.showBanner(
      isFinalBoss
        ? `BOSS FINAL CHEGOU: MORANGO EM SÃO LUÍS!`
        : `CHEFE DA FASE: ${mapDef.bossDisplayName.toUpperCase()}!`,
      "boss",
      4.2
    );
    this.emitSnapshot(true);
  }

  private spawnStagePortal(x: number, z: number): void {
    const mapDef = MAP_DEFINITIONS[this.currentMapId];
    if (!mapDef.nextMapId) return;
    const nextDef = MAP_DEFINITIONS[mapDef.nextMapId];

    if (this.activePortal) {
      this.removeObject(this.activePortal.mesh);
      this.activePortal = null;
    }

    const pos = this.resolveArenaBounds(x, z, 2.5, this.mapScene.obstacles);
    const mesh = createStagePortalMesh(this.lib);
    mesh.position.set(pos.x, 0, pos.z);
    this.scene.add(mesh);

    this.activePortal = {
      mesh,
      x: pos.x,
      z: pos.z,
      nextMapId: nextDef.id,
      nextMapName: nextDef.name,
    };

    this.showBanner(`Portal aberto para ${nextDef.name}! Entre ou aperte E.`, "pickup", 4.5);
  }

  // =========================================================================
  // Armas da Lore
  // =========================================================================

  private getCooldownMultiplier(): number {
    const hypeLevel = this.passives.get("hype_live") ?? 0;
    return Math.max(0.55, 1 - hypeLevel * 0.09);
  }

  private updateWeapons(dt: number): void {
    const cdMult = this.getCooldownMultiplier();

    for (const [weaponId, level] of this.weapons.entries()) {
      const remaining = (this.weaponCooldowns.get(weaponId) ?? 0) - dt;
      if (remaining > 0) {
        this.weaponCooldowns.set(weaponId, remaining);
        continue;
      }

      let baseCd = 1.0;
      switch (weaponId) {
        case "pedra":
          baseCd = Math.max(0.45, 0.88 - (level - 1) * 0.09);
          this.firePedra(level);
          break;
        case "surto":
          baseCd = Math.max(1.1, 2.3 - (level - 1) * 0.25);
          this.fireSurto(level);
          break;
        case "engrossar_voz":
          baseCd = Math.max(1.2, 2.4 - (level - 1) * 0.25);
          this.fireEngrossarVoz(level);
          break;
        case "professor_maconha":
          baseCd = Math.max(2.5, 4.3 - (level - 1) * 0.35);
          this.fireProfessorMaconha(level);
          break;
        case "chuva_tempero":
          baseCd = Math.max(1.4, 2.55 - (level - 1) * 0.24);
          this.fireChuvaTempero(level);
          break;
        case "esculacho":
          baseCd = Math.max(0.95, 1.9 - (level - 1) * 0.2);
          this.fireEsculacho(level);
          break;
      }

      this.weaponCooldowns.set(weaponId, baseCd * cdMult);
    }
  }

  private findNearestEnemy(fromX: number, fromZ: number, exclude?: Set<number>): EnemyInstance | null {
    let best: EnemyInstance | null = null;
    let bestDistSq = Infinity;
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      if (exclude?.has(e.id)) continue;
      const dx = e.x - fromX;
      const dz = e.z - fromZ;
      const dSq = dx * dx + dz * dz;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        best = e;
      }
    }
    return best;
  }

  private firePedra(level: number): void {
    const target = this.findNearestEnemy(this.playerX, this.playerZ);
    const baseAngle = target
      ? Math.atan2(target.x - this.playerX, target.z - this.playerZ)
      : this.playerFacing;

    const count = level >= 5 ? 4 : level >= 4 ? 3 : level >= 2 ? 2 : 1;
    const damage = 15 + (level - 1) * 6;
    const pierce = level >= 5 ? 2 : level >= 4 ? 1 : 0;
    const scale = 0.85 + (level - 1) * 0.14;
    const speed = 19 + level * 1.2;

    for (let i = 0; i < count; i++) {
      const spread = count === 1 ? 0 : (i - (count - 1) / 2) * 0.22;
      const angle = baseAngle + spread;

      const mesh = new THREE.Mesh(
        this.lib.dodecahedron,
        new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          roughness: 0.85,
          emissive: 0x475569,
          emissiveIntensity: 0.25,
        })
      );
      mesh.scale.setScalar(scale);
      mesh.position.set(this.playerX, 1.1, this.playerZ);
      this.scene.add(mesh);

      this.playerProjectiles.push({
        kind: "pedra",
        mesh,
        x: this.playerX,
        y: 1.1,
        z: this.playerZ,
        vx: Math.sin(angle) * speed,
        vz: Math.cos(angle) * speed,
        damage,
        radius: 0.54 * scale,
        knockback: 5.8 + level * 1.1,
        life: 1.5,
        pierceLeft: pierce,
        bouncesLeft: 0,
        hitIds: new Set(),
        targetEnemyId: null,
        speed,
      });
    }

    this.audio.play("pedra", this.rng);
  }

  private fireSurto(level: number): void {
    const radius = 5.0 + (level - 1) * 1.2;
    const damage = 19 + (level - 1) * 9;
    const knockback = 7.2 + level * 1.3;

    this.spawnShockwave(this.playerX, this.playerZ, radius, 0xf97316, 0.34);
    this.spawnBurstParticles(this.playerX, 0.9, this.playerZ, 0xfb923c, 10);
    this.addTrauma(0.16);
    this.audio.play("surto", this.rng);

    for (const enemy of this.enemies) {
      const dx = enemy.x - this.playerX;
      const dz = enemy.z - this.playerZ;
      const dist = Math.hypot(dx, dz);
      if (dist <= radius + enemy.radius) {
        const nx = dist > 0.01 ? dx / dist : 1;
        const nz = dist > 0.01 ? dz / dist : 0;
        this.damageEnemy(enemy, damage, nx * knockback, nz * knockback, level >= 4 && this.rng.chance(0.25));
      }
    }
  }

  private fireEngrossarVoz(level: number): void {
    const target = this.findNearestEnemy(this.playerX, this.playerZ);
    const baseAngle = target
      ? Math.atan2(target.x - this.playerX, target.z - this.playerZ)
      : this.playerFacing;

    const directions = level >= 4 ? [baseAngle, baseAngle + Math.PI] : [baseAngle];
    const damage = 22 + (level - 1) * 9;
    const radius = 1.7 + (level - 1) * 0.35;
    const speed = 16;

    for (const angle of directions) {
      const waveMesh = new THREE.Mesh(
        this.lib.torusUnit,
        new THREE.MeshBasicMaterial({
          color: 0xc084fc,
          transparent: true,
          opacity: 0.92,
        })
      );
      waveMesh.scale.set(radius * 1.35, radius * 0.65, 1);
      waveMesh.rotation.x = Math.PI / 2;
      waveMesh.rotation.z = -angle;
      waveMesh.position.set(this.playerX, 0.85, this.playerZ);
      this.scene.add(waveMesh);

      this.playerProjectiles.push({
        kind: "engrossar_voz",
        mesh: waveMesh,
        x: this.playerX,
        y: 0.85,
        z: this.playerZ,
        vx: Math.sin(angle) * speed,
        vz: Math.cos(angle) * speed,
        damage,
        radius,
        knockback: 11.5 + level * 1.8,
        life: 0.85 + level * 0.08,
        pierceLeft: 99,
        bouncesLeft: 0,
        hitIds: new Set(),
        targetEnemyId: null,
        speed,
      });
    }

    this.addTrauma(0.2);
    this.audio.play("engrossar_voz", this.rng);
  }

  private fireProfessorMaconha(level: number): void {
    const count = level >= 5 ? 3 : level >= 3 ? 2 : 1;
    const radius = 3.5 + (level - 1) * 0.6;
    const duration = 4.8 + (level - 1) * 0.7;
    const damagePerTick = 8 + (level - 1) * 3.8;
    const slowFactor = level >= 4 ? 0.45 : 0.6;

    for (let i = 0; i < count; i++) {
      let cx = this.playerX + this.rng.range(-7, 7);
      let cz = this.playerZ + this.rng.range(-7, 7);
      if (i === 0 && this.enemies.length > 0) {
        const pick = this.enemies[Math.floor(this.rng.next() * this.enemies.length)]!;
        cx = pick.x;
        cz = pick.z;
      }

      const cloudGroup = new THREE.Group();
      cloudGroup.position.set(cx, 0.08, cz);

      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(radius, 22),
        new THREE.MeshBasicMaterial({
          color: 0x22c55e,
          transparent: true,
          opacity: 0.28,
          depthWrite: false,
        })
      );
      disc.rotation.x = -Math.PI / 2;
      cloudGroup.add(disc);

      const border = new THREE.Mesh(
        this.lib.ringUnit,
        new THREE.MeshBasicMaterial({
          color: 0x4ade80,
          transparent: true,
          opacity: 0.65,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      border.rotation.x = -Math.PI / 2;
      border.scale.setScalar(radius);
      cloudGroup.add(border);

      const puffMat = new THREE.MeshStandardMaterial({
        color: 0x4ade80,
        transparent: true,
        opacity: 0.42,
        roughness: 1,
        depthWrite: false,
      });
      for (let p = 0; p < 5; p++) {
        const pa = (p / 5) * Math.PI * 2;
        const puff = new THREE.Mesh(this.lib.sphereLow, puffMat);
        puff.scale.setScalar(radius * 0.42);
        puff.position.set(
          Math.cos(pa) * radius * 0.45,
          0.55 + (p % 2) * 0.25,
          Math.sin(pa) * radius * 0.45
        );
        cloudGroup.add(puff);
      }

      this.scene.add(cloudGroup);

      this.zones.push({
        kind: "professor_maconha",
        mesh: cloudGroup,
        x: cx,
        z: cz,
        radius,
        damagePerTick,
        slowFactor,
        tickTimer: 0.1,
        life: duration,
        maxLife: duration,
      });
    }

    this.audio.play("professor_maconha", this.rng);
  }

  private fireChuvaTempero(level: number): void {
    const count = level >= 5 ? 6 : level >= 4 ? 4 : level >= 2 ? 3 : 2;
    const radius = 2.8 + (level - 1) * 0.4;
    const damage = 28 + (level - 1) * 12;

    for (let i = 0; i < count; i++) {
      let tx = this.playerX + this.rng.range(-12, 12);
      let tz = this.playerZ + this.rng.range(-12, 12);
      if (this.enemies.length > 0 && i < this.enemies.length && this.rng.chance(0.75)) {
        const target = this.enemies[Math.floor(this.rng.next() * this.enemies.length)]!;
        tx = target.x + this.rng.range(-1.4, 1.4);
        tz = target.z + this.rng.range(-1.4, 1.4);
      }

      const ringMesh = new THREE.Mesh(
        this.lib.ringUnit,
        new THREE.MeshBasicMaterial({
          color: 0xfacc15,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.set(tx, 0.06, tz);
      ringMesh.scale.setScalar(radius);
      this.scene.add(ringMesh);

      const meteorMesh = new THREE.Mesh(
        this.lib.dodecahedron,
        new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xfacc15,
          emissiveIntensity: 0.8,
          roughness: 0.3,
        })
      );
      meteorMesh.scale.setScalar(1.3);
      meteorMesh.position.set(tx, 16 + i * 2.5, tz);
      this.scene.add(meteorMesh);

      this.meteors.push({
        ringMesh,
        meteorMesh,
        x: tx,
        z: tz,
        radius,
        damage,
        delay: 0.48 + i * 0.09,
        elapsed: 0,
      });
    }
  }

  private fireEsculacho(level: number): void {
    const count = level >= 5 ? 4 : level >= 4 ? 3 : level >= 2 ? 2 : 1;
    const bounces = level >= 5 ? 4 : level >= 3 ? 3 : 1;
    const damage = 16 + (level - 1) * 7;
    const speed = 17 + level * 1.4;

    const picked = new Set<number>();
    for (let i = 0; i < count; i++) {
      const target = this.findNearestEnemy(this.playerX, this.playerZ, picked);
      if (target) picked.add(target.id);

      const angle = target
        ? Math.atan2(target.x - this.playerX, target.z - this.playerZ)
        : this.playerFacing + (i - (count - 1) / 2) * 0.4;

      const orb = new THREE.Mesh(
        this.lib.octahedron,
        new THREE.MeshStandardMaterial({
          color: 0xef4444,
          emissive: 0xf43f5e,
          emissiveIntensity: 0.9,
          roughness: 0.2,
        })
      );
      orb.scale.setScalar(1.1);
      orb.position.set(this.playerX, 1.15, this.playerZ);
      this.scene.add(orb);

      this.playerProjectiles.push({
        kind: "esculacho",
        mesh: orb,
        x: this.playerX,
        y: 1.15,
        z: this.playerZ,
        vx: Math.sin(angle) * speed,
        vz: Math.cos(angle) * speed,
        damage,
        radius: 0.65,
        knockback: 3.5,
        life: 2.3,
        pierceLeft: 0,
        bouncesLeft: bounces,
        hitIds: new Set(),
        targetEnemyId: target?.id ?? null,
        speed,
      });
    }

    this.audio.play("esculacho", this.rng);
  }

  // =========================================================================
  // Updates de Projéteis, Zonas, Meteoros
  // =========================================================================

  private updatePlayerProjectiles(dt: number): void {
    for (let i = this.playerProjectiles.length - 1; i >= 0; i--) {
      const p = this.playerProjectiles[i]!;
      p.life -= dt;
      if (p.life <= 0) {
        this.removeObject(p.mesh);
        this.playerProjectiles.splice(i, 1);
        continue;
      }

      if (p.kind === "esculacho") {
        let target = this.enemies.find((e) => e.id === p.targetEnemyId && e.hp > 0);
        if (!target) {
          target = this.findNearestEnemy(p.x, p.z, p.hitIds) ?? undefined;
          p.targetEnemyId = target?.id ?? null;
        }
        if (target) {
          const dx = target.x - p.x;
          const dz = target.z - p.z;
          const d = Math.hypot(dx, dz) || 1;
          const desiredVx = (dx / d) * p.speed;
          const desiredVz = (dz / d) * p.speed;
          const steer = Math.min(1, dt * 11);
          p.vx += (desiredVx - p.vx) * steer;
          p.vz += (desiredVz - p.vz) * steer;
        }
        p.mesh.rotation.y += dt * 10;
        p.mesh.rotation.x += dt * 7;
      } else if (p.kind === "pedra") {
        p.mesh.rotation.x += dt * 9;
        p.mesh.rotation.z += dt * 7;
      } else if (p.kind === "engrossar_voz") {
        p.mesh.scale.x += dt * 3.4;
        p.radius += dt * 1.4;
      }

      p.x += p.vx * dt;
      p.z += p.vz * dt;
      p.mesh.position.set(p.x, p.y, p.z);

      let destroyed = false;
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0 || p.hitIds.has(enemy.id)) continue;
        const dx = enemy.x - p.x;
        const dz = enemy.z - p.z;
        const hitDist = p.radius + enemy.radius;
        if (dx * dx + dz * dz <= hitDist * hitDist) {
          p.hitIds.add(enemy.id);
          const vLen = Math.hypot(p.vx, p.vz) || 1;
          this.damageEnemy(
            enemy,
            p.damage,
            (p.vx / vLen) * p.knockback,
            (p.vz / vLen) * p.knockback,
            false
          );

          if (p.bouncesLeft > 0) {
            p.bouncesLeft -= 1;
            const next = this.findNearestEnemy(p.x, p.z, p.hitIds);
            if (next) {
              p.targetEnemyId = next.id;
              const ndx = next.x - p.x;
              const ndz = next.z - p.z;
              const nd = Math.hypot(ndx, ndz) || 1;
              p.vx = (ndx / nd) * p.speed;
              p.vz = (ndz / nd) * p.speed;
              this.spawnBurstParticles(p.x, 1.0, p.z, 0xf43f5e, 4);
              continue;
            }
          }

          if (p.pierceLeft > 0) {
            p.pierceLeft -= 1;
          } else {
            destroyed = true;
            break;
          }
        }
      }

      if (destroyed) {
        this.removeObject(p.mesh);
        this.playerProjectiles.splice(i, 1);
      }
    }
  }

  private updateZones(dt: number): void {
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const zone = this.zones[i]!;
      zone.life -= dt;
      if (zone.life <= 0) {
        this.removeObject(zone.mesh);
        this.zones.splice(i, 1);
        continue;
      }

      zone.mesh.rotation.y += dt * 0.6;
      const fadeScale = zone.life < 0.5 ? zone.life / 0.5 : 1;
      zone.mesh.scale.setScalar(0.92 + Math.sin(this.visualTime * 4 + i) * 0.06 * fadeScale);

      zone.tickTimer -= dt;
      const shouldTick = zone.tickTimer <= 0;
      if (shouldTick) zone.tickTimer = 0.42;

      for (const enemy of this.enemies) {
        if (enemy.hp <= 0) continue;
        const dx = enemy.x - zone.x;
        const dz = enemy.z - zone.z;
        const r = zone.radius + enemy.radius;
        if (dx * dx + dz * dz <= r * r) {
          enemy.slowTimer = Math.max(enemy.slowTimer, 0.5);
          enemy.slowFactor = Math.min(enemy.slowFactor, zone.slowFactor);
          if (shouldTick) {
            this.damageEnemy(enemy, zone.damagePerTick, 0, 0, false);
          }
        }
      }
    }
  }

  private updateMeteors(dt: number): void {
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i]!;
      m.elapsed += dt;
      const progress = Math.min(1, m.elapsed / m.delay);
      m.meteorMesh.position.y = 16 * (1 - progress) + 0.5;
      m.meteorMesh.rotation.x += dt * 8;
      m.meteorMesh.rotation.z += dt * 6;
      m.ringMesh.scale.setScalar(m.radius * (0.8 + progress * 0.25));

      if (m.elapsed >= m.delay) {
        this.spawnShockwave(m.x, m.z, m.radius, 0xfacc15, 0.28);
        this.spawnBurstParticles(m.x, 0.6, m.z, 0xfacc15, 9);
        this.audio.play("chuva_tempero", this.rng);
        this.addTrauma(0.14);

        for (const enemy of this.enemies) {
          if (enemy.hp <= 0) continue;
          const dx = enemy.x - m.x;
          const dz = enemy.z - m.z;
          const dist = Math.hypot(dx, dz);
          if (dist <= m.radius + enemy.radius) {
            const nx = dist > 0.01 ? dx / dist : 1;
            const nz = dist > 0.01 ? dz / dist : 0;
            this.damageEnemy(enemy, m.damage, nx * 5, nz * 5, true);
          }
        }

        this.removeObject(m.ringMesh);
        this.removeObject(m.meteorMesh);
        this.meteors.splice(i, 1);
      }
    }
  }

  // =========================================================================
  // IA dos Inimigos + Spatial Hash O(N) + Bosses
  // =========================================================================

  private gridKey(cx: number, cz: number): number {
    return ((cx + 256) << 10) | (cz + 256);
  }

  private updateEnemies(dt: number, realDelta: number): void {
    // 1. Limpa mortos e monta spatial hash grid O(N)
    this.spatialGrid.clear();
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]!;
      if (e.hp <= 0) {
        this.cleanupEnemy(e);
        this.enemies.splice(i, 1);
        continue;
      }
      const cx = Math.floor(e.x / SPATIAL_CELL_SIZE);
      const cz = Math.floor(e.z / SPATIAL_CELL_SIZE);
      const key = this.gridKey(cx, cz);
      let bucket = this.spatialGrid.get(key);
      if (!bucket) {
        bucket = [];
        this.spatialGrid.set(key, bucket);
      }
      bucket.push(e);
    }

    // 2. Atualiza movimento, separação local, animações e colisões
    for (const e of this.enemies) {
      if (e.slowTimer > 0) {
        e.slowTimer -= dt;
        if (e.slowTimer <= 0) e.slowFactor = 1;
      }

      const dx = this.playerX - e.x;
      const dz = this.playerZ - e.z;
      const dist = Math.hypot(dx, dz) || 0.001;

      // Reposicionamento estilo Vampire Survivors quando um mob comum fica longe demais no mapa grande
      if (!e.isBoss && dist > 56) {
        const a = this.rng.range(0, Math.PI * 2);
        const r = this.rng.range(26, 36);
        const pos = this.resolveArenaBounds(
          this.playerX + Math.cos(a) * r,
          this.playerZ + Math.sin(a) * r,
          e.radius,
          this.mapScene.obstacles
        );
        e.x = pos.x;
        e.z = pos.z;
        e.rig.root.position.set(e.x, 0, e.z);
        continue;
      }

      const dirX = dx / dist;
      const dirZ = dz / dist;
      const effectiveSpeed = e.speed * (e.isBoss ? Math.max(0.75, e.slowFactor) : e.slowFactor);

      if (e.isBoss) {
        this.updateBossAI(e, dt, dirX, dirZ, effectiveSpeed);
      } else {
        const def = ENEMY_ARCHETYPES[e.archetypeId];
        if (def.role === "skirmisher" && def.rangedDistance && dist < def.rangedDistance) {
          const strafeSign = e.id % 2 === 0 ? 1 : -1;
          e.x += -dirZ * strafeSign * effectiveSpeed * 0.6 * dt;
          e.z += dirX * strafeSign * effectiveSpeed * 0.6 * dt;

          e.attackCooldown -= dt;
          if (e.attackCooldown <= 0) {
            e.attackCooldown = def.rangedCooldown ?? 3.1;
            this.fireEnemyBolt(e.x, e.z, dirX, dirZ, 12, e.damage, 0x38bdf8, e.displayName);
          }
        } else {
          e.x += dirX * effectiveSpeed * dt;
          e.z += dirZ * effectiveSpeed * dt;
        }
      }

      if (Math.abs(e.vx) > 0.05 || Math.abs(e.vz) > 0.05) {
        e.x += e.vx * dt;
        e.z += e.vz * dt;
        const drag = Math.exp(-dt * 9);
        e.vx *= drag;
        e.vz *= drag;
      }

      // Separação O(1) via vizinhos nas 9 células do spatial hash
      if (!e.isBoss) {
        const cx = Math.floor(e.x / SPATIAL_CELL_SIZE);
        const cz = Math.floor(e.z / SPATIAL_CELL_SIZE);
        for (let ox = -1; ox <= 1; ox++) {
          for (let oz = -1; oz <= 1; oz++) {
            const bucket = this.spatialGrid.get(this.gridKey(cx + ox, cz + oz));
            if (!bucket) continue;
            for (const other of bucket) {
              if (other.id <= e.id) continue;
              const sdx = e.x - other.x;
              const sdz = e.z - other.z;
              const minSep = (e.radius + other.radius) * 0.8;
              const dSq = sdx * sdx + sdz * sdz;
              if (dSq < minSep * minSep && dSq > 0.0001) {
                const d = Math.sqrt(dSq);
                const push = (minSep - d) * 0.35;
                const px = (sdx / d) * push;
                const pz = (sdz / d) * push;
                e.x += px;
                e.z += pz;
                if (!other.isBoss) {
                  other.x -= px;
                  other.z -= pz;
                }
              }
            }
          }
        }
      }

      const clamped = this.resolveArenaBounds(e.x, e.z, e.radius, this.mapScene.obstacles);
      e.x = clamped.x;
      e.z = clamped.z;

      e.rig.root.position.set(e.x, 0, e.z);
      e.rig.root.rotation.y = Math.atan2(dirX, dirZ);

      e.animPhase += dt * (e.bossState === "dash" ? 18 : 9);
      const legSwing = Math.sin(e.animPhase) * 0.45;
      e.rig.leftLeg.rotation.x = legSwing;
      e.rig.rightLeg.rotation.x = -legSwing;

      // Hit-flash leve via swap para hitFlashMat compartilhado (zero clonagem de material!)
      if (e.hitFlash > 0) {
        e.hitFlash = Math.max(0, e.hitFlash - realDelta * 8.5);
        if (!e.isFlashing) {
          e.isFlashing = true;
          for (const t of e.rig.flashTargets) {
            t.mesh.material = this.lib.hitFlashMat;
          }
        }
      } else if (e.isFlashing) {
        e.isFlashing = false;
        for (const t of e.rig.flashTargets) {
          t.mesh.material = t.baseMaterial;
        }
      }

      if (e.squashTimer > 0) {
        e.squashTimer = Math.max(0, e.squashTimer - realDelta * 7);
        const s = 1 - e.squashTimer * 0.2;
        const xz = 1 / Math.sqrt(s);
        e.rig.body.scale.set(e.baseScale * xz, e.baseScale * s, e.baseScale * xz);
      }

      if (e.rig.bossAura) {
        e.rig.bossAura.rotation.z += realDelta * 1.8;
      }

      const pDist = Math.hypot(this.playerX - e.x, this.playerZ - e.z);
      if (pDist < e.radius + PLAYER_BASE_STATS.radius) {
        this.damagePlayer(e.damage, e.displayName);
      }
    }
  }

  private updateBossAI(
    boss: EnemyInstance,
    dt: number,
    dirX: number,
    dirZ: number,
    speed: number
  ): void {
    const telegraphColor = boss.isFinalBoss ? 0xf43f5e : 0xfacc15;

    if (boss.bossState === "chase") {
      boss.x += dirX * speed * dt;
      boss.z += dirZ * speed * dt;
      boss.attackCooldown -= dt;

      if (boss.attackCooldown <= 0) {
        boss.bossMoveToggle = !boss.bossMoveToggle;
        if (boss.bossMoveToggle) {
          boss.bossState = "telegraph_dash";
          boss.bossStateTimer = 0.85;
          boss.dashDirX = dirX;
          boss.dashDirZ = dirZ;

          const dashBar = new THREE.Mesh(
            new THREE.PlaneGeometry(2.6, 17),
            new THREE.MeshBasicMaterial({
              color: telegraphColor,
              transparent: true,
              opacity: 0.45,
              side: THREE.DoubleSide,
              depthWrite: false,
            })
          );
          dashBar.rotation.x = -Math.PI / 2;
          dashBar.rotation.z = -Math.atan2(dirX, dirZ);
          dashBar.position.set(boss.x + dirX * 8.5, 0.08, boss.z + dirZ * 8.5);
          this.scene.add(dashBar);
          boss.telegraphMesh = dashBar;
        } else {
          boss.bossState = "telegraph_burst";
          boss.bossStateTimer = 0.9;

          const burstRing = new THREE.Mesh(
            this.lib.ringUnit,
            new THREE.MeshBasicMaterial({
              color: telegraphColor,
              transparent: true,
              opacity: 0.65,
              side: THREE.DoubleSide,
              depthWrite: false,
            })
          );
          burstRing.rotation.x = -Math.PI / 2;
          burstRing.position.set(boss.x, 0.09, boss.z);
          burstRing.scale.setScalar(3.8);
          this.scene.add(burstRing);
          boss.telegraphMesh = burstRing;
        }
      }
    } else if (boss.bossState === "telegraph_dash") {
      boss.bossStateTimer -= dt;
      if (boss.telegraphMesh) {
        (boss.telegraphMesh.material as THREE.MeshBasicMaterial).opacity =
          0.35 + Math.sin(this.visualTime * 22) * 0.25;
      }
      if (boss.bossStateTimer <= 0) {
        if (boss.telegraphMesh) {
          this.removeObject(boss.telegraphMesh);
          boss.telegraphMesh = null;
        }
        boss.bossState = "dash";
        boss.bossStateTimer = 0.58;
        this.audio.play("boss_dash", this.rng);
        this.addTrauma(0.28);
      }
    } else if (boss.bossState === "dash") {
      boss.bossStateTimer -= dt;
      const dashSpeed = (boss.isFinalBoss ? 27 : 23) + boss.bossTier * 1.8;
      boss.x += boss.dashDirX * dashSpeed * dt;
      boss.z += boss.dashDirZ * dashSpeed * dt;
      if (this.rng.chance(0.45)) {
        this.spawnBurstParticles(boss.x, 0.5, boss.z, telegraphColor, 1);
      }
      if (boss.bossStateTimer <= 0) {
        boss.bossState = "recovery";
        boss.bossStateTimer = 0.68;
      }
    } else if (boss.bossState === "telegraph_burst") {
      boss.bossStateTimer -= dt;
      if (boss.telegraphMesh) {
        boss.telegraphMesh.position.set(boss.x, 0.09, boss.z);
        const s = 2.8 + (1 - boss.bossStateTimer / 0.9) * 2.8;
        boss.telegraphMesh.scale.setScalar(s);
      }
      if (boss.bossStateTimer <= 0) {
        if (boss.telegraphMesh) {
          this.removeObject(boss.telegraphMesh);
          boss.telegraphMesh = null;
        }
        const boltCount = (boss.isFinalBoss ? 12 : 8) + Math.min(6, (boss.bossTier - 1) * 2);
        for (let b = 0; b < boltCount; b++) {
          const a = (b / boltCount) * Math.PI * 2 + this.visualTime * 0.4;
          this.fireEnemyBolt(
            boss.x,
            boss.z,
            Math.sin(a),
            Math.cos(a),
            11 + boss.bossTier * 0.8,
            Math.round(boss.damage * 0.75),
            telegraphColor,
            boss.displayName
          );
        }
        this.spawnShockwave(boss.x, boss.z, 5.2, telegraphColor, 0.35);
        this.audio.play("boss_dash", this.rng);
        this.addTrauma(0.25);
        boss.bossState = "recovery";
        boss.bossStateTimer = 0.82;
      }
    } else if (boss.bossState === "recovery") {
      boss.bossStateTimer -= dt;
      if (boss.bossStateTimer <= 0) {
        boss.bossState = "chase";
        boss.attackCooldown = Math.max(2.0, (boss.isFinalBoss ? 2.9 : 3.5) - boss.bossTier * 0.2);
      }
    }
  }

  private fireEnemyBolt(
    x: number,
    z: number,
    dirX: number,
    dirZ: number,
    speed: number,
    damage: number,
    color: number,
    sourceName: string
  ): void {
    const mesh = new THREE.Mesh(
      this.lib.sphereLow,
      new THREE.MeshBasicMaterial({ color })
    );
    mesh.scale.setScalar(0.65);
    mesh.position.set(x, 1.0, z);
    this.scene.add(mesh);

    this.enemyProjectiles.push({
      mesh,
      x,
      z,
      vx: dirX * speed,
      vz: dirZ * speed,
      damage,
      radius: 0.42,
      life: 3.6,
      sourceName,
    });
  }

  private updateEnemyProjectiles(dt: number): void {
    const playableR = MAP_DEFINITIONS[this.currentMapId].playableRadius;
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const p = this.enemyProjectiles[i]!;
      p.life -= dt;
      p.x += p.vx * dt;
      p.z += p.vz * dt;
      p.mesh.position.set(p.x, 1.0, p.z);

      const distToPlayer = Math.hypot(this.playerX - p.x, this.playerZ - p.z);
      if (distToPlayer <= p.radius + PLAYER_BASE_STATS.radius) {
        this.damagePlayer(p.damage, p.sourceName);
        this.removeObject(p.mesh);
        this.enemyProjectiles.splice(i, 1);
        continue;
      }

      if (p.life <= 0 || Math.hypot(p.x, p.z) > playableR + 6) {
        this.removeObject(p.mesh);
        this.enemyProjectiles.splice(i, 1);
      }
    }
  }

  // =========================================================================
  // Combate, Dano, Drops, Portal e Vitória em São Luís
  // =========================================================================

  private damageEnemy(
    enemy: EnemyInstance,
    rawDamage: number,
    kbX: number,
    kbZ: number,
    isCrit: boolean
  ): void {
    if (enemy.hp <= 0) return;

    const damage = Math.round(rawDamage * (isCrit ? 1.5 : 1));
    enemy.hp -= damage;
    enemy.hitFlash = 1;
    enemy.squashTimer = 1;

    const kbResist = enemy.isBoss ? 0.1 : 1;
    enemy.vx += kbX * kbResist;
    enemy.vz += kbZ * kbResist;

    this.pushDamageNumber(
      enemy.x,
      enemy.isBoss ? 3.2 : 1.7,
      enemy.z,
      `${damage}`,
      isCrit ? "crit" : "normal"
    );

    if (enemy.hp <= 0) {
      this.onEnemyKilled(enemy);
    } else {
      this.audio.play("hit", this.rng);
    }
  }

  private onEnemyKilled(enemy: EnemyInstance): void {
    const def = ENEMY_ARCHETYPES[enemy.archetypeId];
    const mapDef = MAP_DEFINITIONS[this.currentMapId];
    this.kills += 1;
    this.score += enemy.isFinalBoss
      ? 5000
      : enemy.isBoss
        ? 1200 * mapDef.order
        : def.scoreValue;

    this.spawnBurstParticles(enemy.x, 1.0, enemy.z, def.primaryColor, enemy.isBoss ? 26 : 5);

    if (enemy.isBoss) {
      this.bossesDefeated += 1;
      this.triggerHitstop(90, 0.05);
      this.addTrauma(0.8);
      this.punchFov(7);
      this.audio.play("boss_down", this.rng);
      this.spawnShockwave(enemy.x, enemy.z, 12, enemy.isFinalBoss ? 0xf43f5e : 0xfacc15, 0.55);

      // Recompensas garantidas
      this.spawnPickup("redbull", enemy.x + 1.4, enemy.z, 0);
      for (let g = 0; g < 6; g++) {
        const a = (g / 6) * Math.PI * 2;
        this.spawnPickup("xp_big", enemy.x + Math.cos(a) * 2.0, enemy.z + Math.sin(a) * 2.0, 14);
      }

      if (enemy.isFinalBoss && !this.endlessMode) {
        this.triggerCampaignVictory();
      } else if (mapDef.nextMapId) {
        this.spawnStagePortal(enemy.x, enemy.z);
      } else {
        this.showBanner(`MORANGO DERROTADA NOVAMENTE! (+5.000 pts)`, "pickup", 3.5);
      }
      this.emitSnapshot(true);
    } else {
      this.audio.play("kill", this.rng);
      const xpKind: PickupKind =
        def.xpValue >= 6 ? "xp_big" : def.xpValue >= 3 ? "xp_medium" : "xp_small";
      this.spawnPickup(xpKind, enemy.x, enemy.z, def.xpValue);

      const roll = this.rng.next();
      if (roll < 0.042) {
        this.spawnPickup("redbull", enemy.x + 0.6, enemy.z - 0.5, 0);
      } else if (roll < 0.054) {
        this.spawnPickup("magnet", enemy.x - 0.5, enemy.z + 0.5, 0);
      } else if (roll < 0.06 && this.elapsedSeconds > 35) {
        this.spawnPickup("fechar_live", enemy.x, enemy.z + 0.6, 0);
      }
    }
  }

  private damagePlayer(amount: number, sourceName: string): void {
    if (this.playerInvulnTimer > 0 || this.phase !== "playing") return;

    this.playerHp = Math.max(0, this.playerHp - amount);
    this.playerInvulnTimer = PLAYER_BASE_STATS.invulnerabilitySec;
    this.playerHitFlash = 1;
    this.lastDamageSource = sourceName;

    this.addTrauma(0.45);
    this.triggerHitstop(55, 0.08);
    this.audio.play("player_hit", this.rng);
    this.pushDamageNumber(this.playerX, 2.4, this.playerZ, `-${amount}`, "player");

    if (this.playerHp <= 0) {
      this.triggerGameOver();
    } else {
      this.emitSnapshot(true);
    }
  }

  private spawnPickup(kind: PickupKind, x: number, z: number, xpValue: number): void {
    if (this.pickups.length > 170 && kind.startsWith("xp_")) {
      const oldestXp = this.pickups.findIndex((p) => p.kind === "xp_small");
      if (oldestXp !== -1) {
        const old = this.pickups[oldestXp]!;
        this.removeObject(old.mesh);
        this.pickups.splice(oldestXp, 1);
      }
    }

    const mesh = createPickupMesh(kind, this.lib);
    mesh.position.set(x, 0, z);
    this.scene.add(mesh);

    this.pickups.push({
      id: this.nextEntityId++,
      kind,
      mesh,
      x,
      z,
      xpValue,
      age: 0,
      magnetized: false,
    });
  }

  private updatePickups(dt: number): void {
    const magnetLevel = this.passives.get("ima_xp") ?? 0;
    const pickupRadius = PLAYER_BASE_STATS.pickupRadius * (1 + magnetLevel * 0.35);

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i]!;
      p.age += dt;
      p.mesh.rotation.y += dt * (p.kind === "redbull" ? 2.4 : 3.2);
      p.mesh.position.y = Math.sin(p.age * 4.5 + p.id) * 0.14;

      const dx = this.playerX - p.x;
      const dz = this.playerZ - p.z;
      const dist = Math.hypot(dx, dz);

      if (dist <= pickupRadius) {
        p.magnetized = true;
      }

      if (p.magnetized && dist > 0.01) {
        const pullSpeed = p.kind.startsWith("xp_") ? 19.5 : 15;
        p.x += (dx / dist) * pullSpeed * dt;
        p.z += (dz / dist) * pullSpeed * dt;
        p.mesh.position.x = p.x;
        p.mesh.position.z = p.z;
      }

      if (dist <= 1.15) {
        this.collectPickup(p);
        this.removeObject(p.mesh);
        this.pickups.splice(i, 1);
      }
    }
  }

  private collectPickup(p: PickupInstance): void {
    if (p.kind === "redbull") {
      const heal = Math.min(38, this.playerMaxHp - this.playerHp);
      this.playerHp = Math.min(this.playerMaxHp, this.playerHp + 38);
      this.redBullBoostTimer = Math.max(this.redBullBoostTimer, 5.2);
      this.punchFov(5);
      this.addTrauma(0.15);
      this.audio.play("redbull", this.rng);
      this.pushDamageNumber(
        this.playerX,
        2.5,
        this.playerZ,
        heal > 0 ? `+${Math.round(heal)} HP` : "RED BULL!",
        "heal"
      );
      this.showBanner("Red Bull gelado! +HP e Velocidade!", "pickup", 2.0);
      this.emitSnapshot(true);
      return;
    }

    if (p.kind === "magnet") {
      for (const item of this.pickups) {
        if (item.kind.startsWith("xp_")) item.magnetized = true;
      }
      this.audio.play("powerup", this.rng);
      this.spawnShockwave(this.playerX, this.playerZ, 9, 0x14b8a6, 0.35);
      this.showBanner("Ímã da Live ativado!", "pickup", 2.0);
      return;
    }

    if (p.kind === "fechar_live") {
      this.spawnShockwave(this.playerX, this.playerZ, 26, 0xf43f5e, 0.55);
      this.triggerHitstop(85, 0.05);
      this.addTrauma(0.7);
      this.punchFov(7);
      this.audio.play("boss_down", this.rng);
      this.showBanner("VOU FECHAR A LIVE! (Tela limpa!)", "boss", 2.5);
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0) continue;
        const dmg = enemy.isBoss ? 180 : 9999;
        this.damageEnemy(enemy, dmg, 0, 0, true);
      }
      return;
    }

    this.playerXp += p.xpValue;
    this.score += p.xpValue * 3;
    this.audio.play("xp", this.rng);

    if (this.playerXp >= this.playerXpToNext) {
      this.playerXp -= this.playerXpToNext;
      this.playerLevel += 1;
      this.playerXpToNext = xpRequiredForLevel(this.playerLevel);
      this.triggerLevelUp();
    }
  }

  private triggerLevelUp(): void {
    const choices = this.rollUpgradeChoices();
    if (choices.length === 0) {
      this.playerHp = Math.min(this.playerMaxHp, this.playerHp + 25);
      this.score += 250;
      this.audio.play("levelup", this.rng);
      this.showBanner(`Nível ${this.playerLevel} — Build Máxima (+250 pts)!`, "pickup", 2.0);
      this.emitSnapshot(true);
      return;
    }

    this.upgradeChoices = choices;
    this.phase = "levelup";
    this.keys.clear();
    this.audio.play("levelup", this.rng);
    this.spawnShockwave(this.playerX, this.playerZ, 6, 0xfacc15, 0.4);
    this.emitSnapshot(true);
  }

  private rollUpgradeChoices(): UpgradeChoice[] {
    const pool: UpgradeChoice[] = [];

    for (const w of WEAPON_LIST) {
      const current = this.weapons.get(w.id) ?? 0;
      if (current < w.maxLevel) {
        const nextLevel = current + 1;
        pool.push({
          kind: "weapon",
          id: w.id,
          name: w.name,
          tagline: w.tagline,
          description: w.levelDescriptions[nextLevel - 1] ?? w.tagline,
          color: w.color,
          currentLevel: current,
          nextLevel,
          maxLevel: w.maxLevel,
          isNew: current === 0,
        });
      }
    }

    for (const p of PASSIVE_LIST) {
      const current = this.passives.get(p.id) ?? 0;
      if (current < p.maxLevel) {
        const nextLevel = current + 1;
        pool.push({
          kind: "passive",
          id: p.id,
          name: p.name,
          tagline: p.tagline,
          description: p.levelDescriptions[nextLevel - 1] ?? p.tagline,
          color: p.color,
          currentLevel: current,
          nextLevel,
          maxLevel: p.maxLevel,
          isNew: current === 0,
        });
      }
    }

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng.next() * (i + 1));
      const tmp = pool[i]!;
      pool[i] = pool[j]!;
      pool[j] = tmp;
    }

    if (this.playerLevel <= 4) {
      const weaponsOnly = pool.filter((c) => c.kind === "weapon");
      const passivesOnly = pool.filter((c) => c.kind === "passive");
      const selected: UpgradeChoice[] = [];
      selected.push(...weaponsOnly.slice(0, 2));
      if (passivesOnly.length > 0 && selected.length < 3) {
        selected.push(passivesOnly[0]!);
      }
      for (const item of pool) {
        if (selected.length >= 3) break;
        if (!selected.includes(item)) selected.push(item);
      }
      return selected.slice(0, 3);
    }

    return pool.slice(0, 3);
  }

  private buildSummary(victory: boolean): RunSummary {
    const weaponsUsed = Array.from(this.weapons.entries()).map(
      ([id, lvl]) => `${WEAPON_DEFINITIONS[id].shortName} Nv.${lvl}`
    );
    return {
      score: Math.round(this.score),
      kills: this.kills,
      level: this.playerLevel,
      survivalSeconds: Math.floor(this.elapsedSeconds),
      bossesDefeated: this.bossesDefeated,
      weaponsUsed,
      defeatedBy: victory ? "Vitória em São Luís!" : this.lastDamageSource,
      mapName: MAP_DEFINITIONS[this.currentMapId].name,
      victory,
      seed: this.rng.seed,
    };
  }

  private triggerCampaignVictory(): void {
    this.phase = "victory";
    this.keys.clear();
    this.summary = this.buildSummary(true);
    this.emitSnapshot(true);
  }

  private triggerGameOver(): void {
    this.phase = "gameover";
    this.keys.clear();
    this.audio.play("gameover", this.rng);
    this.addTrauma(0.8);
    this.summary = this.buildSummary(false);
    this.emitSnapshot(true);
  }

  // =========================================================================
  // VFX & Floating Damage Numbers
  // =========================================================================

  private spawnShockwave(
    x: number,
    z: number,
    maxRadius: number,
    color: number,
    duration: number
  ): void {
    const mesh = new THREE.Mesh(
      this.lib.ringUnit,
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.12, z);
    mesh.scale.setScalar(0.3);
    this.scene.add(mesh);

    this.shockwaves.push({
      mesh,
      maxRadius,
      elapsed: 0,
      duration,
    });
  }

  private spawnBurstParticles(
    x: number,
    y: number,
    z: number,
    color: number,
    count: number
  ): void {
    const cap = this.quality === "high" ? MAX_PARTICLES_HIGH : MAX_PARTICLES_LOW;
    const toSpawn = this.quality === "low" ? Math.ceil(count * 0.5) : count;

    for (let i = 0; i < toSpawn; i++) {
      if (this.particles.length >= cap) break;
      const mesh = new THREE.Mesh(
        this.lib.boxUnit,
        new THREE.MeshBasicMaterial({ color })
      );
      mesh.scale.setScalar(this.rng.range(0.14, 0.28));
      mesh.position.set(x, y, z);
      this.scene.add(mesh);

      const angle = this.rng.range(0, Math.PI * 2);
      const spd = this.rng.range(2.5, 7.5);
      const maxLife = this.rng.range(0.24, 0.48);

      this.particles.push({
        mesh,
        vx: Math.cos(angle) * spd,
        vy: this.rng.range(3.5, 7.5),
        vz: Math.sin(angle) * spd,
        life: maxLife,
        maxLife,
      });
    }
  }

  private updateVfx(realDelta: number): void {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i]!;
      sw.elapsed += realDelta;
      const t = Math.min(1, sw.elapsed / sw.duration);
      const eased = 1 - Math.pow(1 - t, 3);
      sw.mesh.scale.setScalar(0.4 + sw.maxRadius * eased);
      (sw.mesh.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - t);
      if (t >= 1) {
        this.removeObject(sw.mesh);
        this.shockwaves.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i]!;
      pt.life -= realDelta;
      if (pt.life <= 0) {
        this.removeObject(pt.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      pt.vy -= 18 * realDelta;
      pt.mesh.position.x += pt.vx * realDelta;
      pt.mesh.position.y = Math.max(0.05, pt.mesh.position.y + pt.vy * realDelta);
      pt.mesh.position.z += pt.vz * realDelta;
      const k = pt.life / pt.maxLife;
      pt.mesh.scale.setScalar(0.24 * k);
    }
  }

  private pushDamageNumber(
    worldX: number,
    worldY: number,
    worldZ: number,
    text: string,
    kind: "normal" | "crit" | "heal" | "player"
  ): void {
    if (this.damageEntries.length >= MAX_DAMAGE_NUMBERS) {
      this.damageEntries.shift();
    }
    this.damageEntries.push({
      id: this.nextDamageId++,
      worldX: worldX + this.rng.range(-0.35, 0.35),
      worldY,
      worldZ: worldZ + this.rng.range(-0.35, 0.35),
      text,
      kind,
      life: 0.65,
      maxLife: 0.65,
    });
  }

  private updateDamageNumbers(realDelta: number): void {
    for (let i = this.damageEntries.length - 1; i >= 0; i--) {
      const entry = this.damageEntries[i]!;
      entry.life -= realDelta;
      entry.worldY += realDelta * 1.9;
      if (entry.life <= 0) {
        this.damageEntries.splice(i, 1);
      }
    }
  }

  private showBanner(text: string, tone: FloatingBanner["tone"], durationSec: number): void {
    this.banner = { id: this.nextBannerId++, text, tone };
    this.bannerTimer = durationSec;
  }

  // =========================================================================
  // Cleanup & Snapshots para UI
  // =========================================================================

  private cleanupEnemy(enemy: EnemyInstance): void {
    if (enemy.telegraphMesh) {
      this.removeObject(enemy.telegraphMesh);
      enemy.telegraphMesh = null;
    }
    this.removeObject(enemy.rig.root);
  }

  private clearDynamicEntities(): void {
    for (const e of this.enemies) this.cleanupEnemy(e);
    this.enemies = [];

    for (const p of this.playerProjectiles) this.removeObject(p.mesh);
    this.playerProjectiles = [];

    for (const p of this.enemyProjectiles) this.removeObject(p.mesh);
    this.enemyProjectiles = [];

    for (const z of this.zones) this.removeObject(z.mesh);
    this.zones = [];

    for (const m of this.meteors) {
      this.removeObject(m.ringMesh);
      this.removeObject(m.meteorMesh);
    }
    this.meteors = [];

    for (const sw of this.shockwaves) this.removeObject(sw.mesh);
    this.shockwaves = [];

    for (const pt of this.particles) this.removeObject(pt.mesh);
    this.particles = [];

    for (const pk of this.pickups) this.removeObject(pk.mesh);
    this.pickups = [];

    if (this.activePortal) {
      this.removeObject(this.activePortal.mesh);
      this.activePortal = null;
    }

    this.damageEntries = [];
    this.banner = null;
    this.bannerTimer = 0;
  }

  private removeObject(obj: THREE.Object3D): void {
    this.scene.remove(obj);
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (!this.lib.isSharedGeometry(child.geometry)) {
          child.geometry.dispose();
        }
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => {
            if (!this.lib.isSharedMaterial(m)) m.dispose();
          });
        } else if (child.material && !this.lib.isSharedMaterial(child.material)) {
          child.material.dispose();
        }
      }
    });
  }

  private emitSnapshot(_immediate: boolean): void {
    const mapDef = MAP_DEFINITIONS[this.currentMapId];
    const activeBoss = this.enemies.find((e) => e.isBoss && e.hp > 0);
    const bossSnapshot: BossHudSnapshot | null = activeBoss
      ? {
          id: activeBoss.archetypeId,
          name: activeBoss.displayName,
          title: activeBoss.displayTitle,
          hp: Math.max(0, Math.ceil(activeBoss.hp)),
          maxHp: activeBoss.maxHp,
          tier: activeBoss.bossTier,
          isFinalBoss: activeBoss.isFinalBoss,
        }
      : null;

    const portalSnapshot: PortalSnapshot | null = this.activePortal
      ? {
          active: true,
          targetMapName: this.activePortal.nextMapName,
          distance: Math.round(
            Math.hypot(this.playerX - this.activePortal.x, this.playerZ - this.activePortal.z)
          ),
        }
      : null;

    const bossCountdownSeconds =
      !this.stageBossSpawned && !activeBoss
        ? Math.max(0, Math.ceil(mapDef.bossSpawnSecond - this.stageElapsedSeconds))
        : null;

    // Minimapa radar (jogador + marcos da cidade + Red Bulls + Boss + Portal)
    const invR = 1 / mapDef.playableRadius;
    const markers: MinimapMarker[] = this.mapScene.landmarks.map((lm) => ({
      nx: Math.max(-1, Math.min(1, lm.x * invR)),
      nz: Math.max(-1, Math.min(1, lm.z * invR)),
      kind: "landmark",
      label: lm.label,
    }));
    for (const pk of this.pickups) {
      if (pk.kind === "redbull") {
        markers.push({
          nx: Math.max(-1, Math.min(1, pk.x * invR)),
          nz: Math.max(-1, Math.min(1, pk.z * invR)),
          kind: "redbull",
        });
      }
    }
    if (activeBoss) {
      markers.push({
        nx: Math.max(-1, Math.min(1, activeBoss.x * invR)),
        nz: Math.max(-1, Math.min(1, activeBoss.z * invR)),
        kind: "boss",
      });
    }
    if (this.activePortal) {
      markers.push({
        nx: Math.max(-1, Math.min(1, this.activePortal.x * invR)),
        nz: Math.max(-1, Math.min(1, this.activePortal.z * invR)),
        kind: "portal",
      });
    }

    const weaponsSnap: EquippedSlotSnapshot[] = Array.from(this.weapons.entries()).map(
      ([id, level]) => {
        const def = WEAPON_DEFINITIONS[id];
        return {
          id,
          name: def.name,
          shortName: def.shortName,
          level,
          maxLevel: def.maxLevel,
          color: def.color,
          kind: "weapon",
        };
      }
    );

    const passivesSnap: EquippedSlotSnapshot[] = Array.from(this.passives.entries()).map(
      ([id, level]) => {
        const def = PASSIVE_DEFINITIONS[id];
        return {
          id,
          name: def.name,
          shortName: def.shortName,
          level,
          maxLevel: def.maxLevel,
          color: def.color,
          kind: "passive",
        };
      }
    );

    const damageNumbers: DamageNumberSnapshot[] = [];
    if (this.phase === "playing") {
      for (const d of this.damageEntries) {
        this.tmpVec.set(d.worldX, d.worldY, d.worldZ).project(this.camera);
        if (this.tmpVec.z > 1) continue;
        const sx = (this.tmpVec.x * 0.5 + 0.5) * 100;
        const sy = (-this.tmpVec.y * 0.5 + 0.5) * 100;
        if (sx < -5 || sx > 105 || sy < -5 || sy > 105) continue;
        damageNumbers.push({
          id: d.id,
          x: sx,
          y: sy,
          text: d.text,
          kind: d.kind,
          alpha: Math.min(1, d.life / (d.maxLife * 0.6)),
        });
      }
    }

    this.onSnapshot({
      phase: this.phase,
      mapId: this.currentMapId,
      mapName: mapDef.name,
      mapOrder: mapDef.order,
      totalMaps: MAP_LIST.length,
      stageElapsedSeconds: Math.floor(this.stageElapsedSeconds),
      bossCountdownSeconds,
      hp: Math.ceil(this.playerHp),
      maxHp: this.playerMaxHp,
      xp: this.playerXp,
      xpToNext: this.playerXpToNext,
      level: this.playerLevel,
      score: Math.round(this.score),
      kills: this.kills,
      wave: this.wave,
      elapsedSeconds: Math.floor(this.elapsedSeconds),
      bossesDefeated: this.bossesDefeated,
      redBullBoostRemaining: Math.max(0, Number(this.redBullBoostTimer.toFixed(1))),
      weapons: weaponsSnap,
      passives: passivesSnap,
      upgradeChoices: this.upgradeChoices,
      boss: bossSnapshot,
      portal: portalSnapshot,
      minimap: {
        playerNx: Math.max(-1, Math.min(1, this.playerX * invR)),
        playerNz: Math.max(-1, Math.min(1, this.playerZ * invR)),
        markers,
      },
      banner: this.banner,
      damageNumbers,
      summary: this.summary,
      seed: this.rng.seed,
      enemyCount: this.enemies.length,
      quality: this.quality,
      muted: this.audio.isMuted(),
    });
  }
}

export type GamePhase = "title" | "playing" | "levelup" | "paused" | "victory" | "gameover";

export type QualityLevel = "high" | "low";

export type MapId =
  | "ilha_avo_romeno"
  | "coronel_fabriciano"
  | "rio_de_janeiro"
  | "curitiba"
  | "sao_luis";

export type WeaponId =
  | "pedra"
  | "surto"
  | "engrossar_voz"
  | "professor_maconha"
  | "chuva_tempero"
  | "esculacho";

export type PassiveId =
  | "velocidade_rasta"
  | "estoque_redbull"
  | "ima_xp"
  | "hype_live";

export type EnemyArchetypeId =
  | "evostt"
  | "lucas_podolski"
  | "evangelion"
  | "zkug"
  | "morango";

export type PickupKind = "xp_small" | "xp_medium" | "xp_big" | "redbull" | "magnet" | "fechar_live";

export interface MapDefinition {
  readonly id: MapId;
  readonly order: number;
  readonly name: string;
  readonly subtitle: string;
  readonly stateLabel: string;
  readonly description: string;
  readonly landmarks: readonly string[];
  readonly playableRadius: number;
  readonly difficultyMultiplier: number;
  readonly maxEnemiesBase: number;
  readonly bossSpawnSecond: number;
  readonly bossArchetypeId: EnemyArchetypeId;
  readonly bossDisplayName: string;
  readonly bossTitle: string;
  readonly isFinalStage: boolean;
  readonly nextMapId: MapId | null;
  readonly skyColor: number;
  readonly fogColor: number;
  readonly fogDensity: number;
  readonly sunColor: number;
  readonly sunIntensity: number;
  readonly hemiSkyColor: number;
  readonly hemiGroundColor: number;
  readonly accentColor: string;
}

export interface WeaponDefinition {
  readonly id: WeaponId;
  readonly name: string;
  readonly shortName: string;
  readonly tagline: string;
  readonly color: string;
  readonly accentHex: number;
  readonly maxLevel: number;
  readonly levelDescriptions: readonly string[];
}

export interface PassiveDefinition {
  readonly id: PassiveId;
  readonly name: string;
  readonly shortName: string;
  readonly tagline: string;
  readonly color: string;
  readonly maxLevel: number;
  readonly levelDescriptions: readonly string[];
}

export interface EnemyArchetypeDefinition {
  readonly id: EnemyArchetypeId;
  readonly name: string;
  readonly title?: string;
  readonly isBoss: boolean;
  readonly role: "chaser" | "bruiser" | "tank" | "skirmisher" | "boss";
  readonly baseHp: number;
  readonly speed: number;
  readonly damage: number;
  readonly radius: number;
  readonly xpValue: number;
  readonly scoreValue: number;
  readonly primaryColor: number;
  readonly secondaryColor: number;
  readonly accentColor: number;
  readonly scale: number;
  readonly minSpawnSecond: number;
  readonly spawnWeight: number;
  readonly rangedCooldown?: number;
  readonly rangedDistance?: number;
}

export interface UpgradeChoice {
  readonly kind: "weapon" | "passive";
  readonly id: WeaponId | PassiveId;
  readonly name: string;
  readonly tagline: string;
  readonly description: string;
  readonly color: string;
  readonly currentLevel: number;
  readonly nextLevel: number;
  readonly maxLevel: number;
  readonly isNew: boolean;
}

export interface EquippedSlotSnapshot {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly level: number;
  readonly maxLevel: number;
  readonly color: string;
  readonly kind: "weapon" | "passive";
}

export interface BossHudSnapshot {
  readonly id: EnemyArchetypeId;
  readonly name: string;
  readonly title: string;
  readonly hp: number;
  readonly maxHp: number;
  readonly tier: number;
  readonly isFinalBoss: boolean;
}

export interface FloatingBanner {
  readonly id: number;
  readonly text: string;
  readonly tone: "boss" | "pickup" | "wave" | "info";
}

export interface DamageNumberSnapshot {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly kind: "normal" | "crit" | "heal" | "player";
  readonly alpha: number;
}

export interface MinimapMarker {
  readonly nx: number; // -1..1 relativo ao mapa
  readonly nz: number; // -1..1 relativo ao mapa
  readonly kind: "landmark" | "redbull" | "boss" | "portal";
  readonly label?: string;
}

export interface MinimapSnapshot {
  readonly playerNx: number;
  readonly playerNz: number;
  readonly markers: MinimapMarker[];
}

export interface PortalSnapshot {
  readonly active: boolean;
  readonly targetMapName: string;
  readonly distance: number;
}

export interface RunSummary {
  readonly score: number;
  readonly kills: number;
  readonly level: number;
  readonly survivalSeconds: number;
  readonly bossesDefeated: number;
  readonly weaponsUsed: string[];
  readonly defeatedBy: string;
  readonly mapName: string;
  readonly victory: boolean;
  readonly seed: number;
}

export interface HudSnapshot {
  readonly phase: GamePhase;
  readonly mapId: MapId;
  readonly mapName: string;
  readonly mapOrder: number;
  readonly totalMaps: number;
  readonly stageElapsedSeconds: number;
  readonly bossCountdownSeconds: number | null;
  readonly hp: number;
  readonly maxHp: number;
  readonly xp: number;
  readonly xpToNext: number;
  readonly level: number;
  readonly score: number;
  readonly kills: number;
  readonly wave: number;
  readonly elapsedSeconds: number;
  readonly bossesDefeated: number;
  readonly redBullBoostRemaining: number;
  readonly weapons: EquippedSlotSnapshot[];
  readonly passives: EquippedSlotSnapshot[];
  readonly upgradeChoices: UpgradeChoice[];
  readonly boss: BossHudSnapshot | null;
  readonly portal: PortalSnapshot | null;
  readonly minimap: MinimapSnapshot;
  readonly banner: FloatingBanner | null;
  readonly damageNumbers: DamageNumberSnapshot[];
  readonly summary: RunSummary | null;
  readonly seed: number;
  readonly enemyCount: number;
  readonly quality: QualityLevel;
  readonly muted: boolean;
}

export const GAME_SLUG = "ilha-do-avo-romeno";
export const ARENA_PLAYABLE_RADIUS = 96;
export const ISLAND_VISUAL_RADIUS = 108;

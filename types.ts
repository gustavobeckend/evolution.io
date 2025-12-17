
export enum GamePhase {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  EVOLUTION_CHOICE = 'EVOLUTION_CHOICE',
  GAME_OVER = 'GAME_OVER'
}

export enum EvolutionStage {
  ATOM = 'Partícula Atômica',
  MOLECULE = 'Molécula Estável',
  BACTERIA = 'Bactéria',
  VIRUS = 'Vírus',
  // Lvl 20 Bacteria
  BACTERIA_TANK = 'Bactéria Tank',
  BACTERIA_COLONIZER = 'Bactéria Colonizadora',
  BACTERIA_TOXIC = 'Bactéria Tóxica',
  // Lvl 20 Virus
  VIRUS_STALKER = 'Vírus Stalker',
  VIRUS_MIMIC = 'Vírus da Cópia',
  VIRUS_ZOMBIE = 'Vírus Zumbi'
}

export enum MimicPassive {
  NONE = 'Nenhuma',
  INVISIBLE = 'Camuflagem Óptica (Stalker)',
  TOXIC_TRAIL = 'Rastro Tóxico (Toxic)',
  DAMAGE_REFLECT = 'Carapaça Espinhosa (Tank)',
  MAGNET = 'Atração Magnética (Colonizer/Virus)',
  SPEED_BOOST = 'Frenzy Metabólico (Zombie)'
}

export enum BotStatus {
  HEALTHY = 'HEALTHY',
  SICK = 'SICK',
  ZOMBIE = 'ZOMBIE'
}

export interface Point {
  x: number;
  y: number;
}

export interface Minion {
  angle: number;
  radius: number;
  distance: number;
  xp: number;
  // Optimization: Persist target so we don't calculate every frame
  targetX?: number;
  targetY?: number;
  hasTarget?: boolean;
}

export interface Player {
  name: string;
  x: number;
  y: number;
  radius: number;
  speed: number;
  level: number;
  xp: number;
  maxXp: number;
  stage: EvolutionStage;
  score: number;
  color: string;
  angle: number; // Current movement angle
  
  // Abilities
  abilityCooldown: number;
  abilityActiveUntil: number; // For timed abilities (Colonizer, Toxic)
  
  // Class Specifics
  minions: Minion[];
  isShielding: boolean; 
  shieldHp: number;
  
  // Tank Specific
  lastHitTankedAt: number; // For passive block
  
  // Toxic Specific
  lastResinDroppedAt: number;

  // Stalker Specific
  attachedTargetId: string | null; // ID of the bot we are attached to
  attachedAt: number; // Timestamp when attachment started

  // Mimic Specific
  disguiseStage: EvolutionStage | null; // What we currently look/act like
  mimicPassive: MimicPassive;
  lastPassiveSwitch: number;
}

export interface Bot {
  id: string;
  name: string; // Added Name
  x: number;
  y: number;
  radius: number;
  color: string;
  speed: number;
  targetX: number;
  targetY: number;
  
  level: number;
  xp: number;
  maxXp: number;
  stage: EvolutionStage;
  angle: number;
  score: number; // Added Score for leaderboard

  // Zombie Virus Props
  status: BotStatus;
  sickUntil: number; // Timestamp when they turn zombie if not cured
  ownerId: string | null; // If Zombie, who owns it
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  damage: number;
  owner: 'player' | 'bot';
  type: 'atom' | 'needle'; 
  createdAt: number;
}

export interface Food {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  xpValue: number;
}

export interface Carbohydrate {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  xpValue: number;
  hp: number;
  maxHp: number;
}

export interface Resin {
  id: string;
  x: number;
  y: number;
  radius: number;
  createdAt: number;
  damage: number;
}

export interface GameSettings {
  mapSize: number;
  foodCount: number;
}

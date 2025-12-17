
import { EvolutionStage } from './types';

export const MAP_SIZE = 6000; // Increased Map Size
export const GATE_SIZE = 600; // Size of the portal on the wall
export const INITIAL_FOOD_COUNT = 3000; // Increased food significantly for testing
export const INITIAL_BOT_COUNT = 30;

// CARBOHYDRATES SETTINGS
export const CARB_COUNT = 60; // Rare compared to food
export const CARB_XP_VALUE = 150; // Base XP
export const CARB_HP_BASE = 60; // Base HP
export const CARB_RADIUS_BASE = 25; // Base Radius

export const BASE_SPEED = 6;
export const MIN_SPEED = 2;
export const BOT_SPEED_FACTOR = 0.6; // Bots are slower than players

export const XP_MULTIPLIER = 1.2; 
export const BASE_XP_REQ = 50;

export const MOLECULE_LEVEL = 10;
export const BRANCH_LEVEL_1 = 15; // Virus or Bacteria
export const BRANCH_LEVEL_2 = 20; // Bacteria Subclasses

// Ability Constants
export const SHIELD_COOLDOWN_MS = 60000; 
export const TANK_PASSIVE_COOLDOWN_MS = 120000; // 2 minutes
export const COLONIZER_ABILITY_DURATION_MS = 10000; // 10 seconds
export const COLONIZER_COOLDOWN_MS = 45000;
export const TOXIC_ABILITY_DURATION_MS = 8000;
export const TOXIC_COOLDOWN_MS = 40000;

export const STALKER_ATTACH_RANGE = 250; // Increased significantly to make attaching easier
export const STALKER_COOLDOWN_MS = 5000; 
export const STALKER_BASE_DRAIN_RATE = 5; // XP per second base

export const MIMIC_TRANSFORM_RANGE = 300;
export const MIMIC_PASSIVE_INTERVAL_MS = 90000; // 1.5 minutes
export const MIMIC_COOLDOWN_MS = 10000;
export const MIMIC_TOXIC_INTERVAL_MS = 10000; // 10 seconds per drop
export const MIMIC_SPEED_MULTI = 1.5;

export const ZOMBIE_INFECTION_DURATION_MS = 120000; // 2 minutes to cure or turn
export const ZOMBIE_COOLDOWN_MS = 90000; // 1.5 minutes cooldown (Updated)
export const ZOMBIE_SPEED_MULTIPLIER = 2.0;
export const ZOMBIE_FRENZY_DETECTION_RANGE = 200; // Reduced from 400 (Updated)

export const NEEDLE_COOLDOWN_MS = 1000;
export const MOLECULE_THROW_COOLDOWN_MS = 500;
export const VIRUS_MAGNET_RADIUS_BASE = 150;
export const VIRUS_NEEDLE_DAMAGE_BASE = 30;

export const COLORS = {
  background: '#0f172a',
  grid: '#1e293b',
  food: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'],
  carb: '#f1f5f9', // Slate-100 (White/Greyish)
  atom: '#38bdf8',
  molecule: '#a855f7',
  bacteria: '#22c55e',
  virus: '#ef4444',
  bot: ['#f472b6', '#c084fc', '#818cf8', '#fb7185'],
  // Level 20 Colors
  bacteriaTank: '#15803d', // Dark Green
  bacteriaColonizer: '#eab308', // Yellow/Gold
  bacteriaToxic: '#9333ea', // Purple
  virusStalker: '#be123c', // Dark Crimson/Pink
  virusMimic: '#06b6d4', // Cyan/Teal
  virusZombie: '#84cc16', // Lime Green/Rotten
  zombieBot: '#4b5563', // Grey
};

export const BOT_NAMES = [
    'BioBlob', 'CellMate', 'MicrobeX', 'Prokaryote', 'AmoebaKing', 
    'TinyTerror', 'GermZ', 'Nucleus', 'MitoPower', 'Ribosome', 
    'Cytoplasm', 'VirusV', 'BactiBoy', 'Spore', 'FungiFun',
    'Cellfie', 'DivideEtImpera', 'AgarKing', 'Blobby', 'Gooey',
    'ToxicAvenger', 'PlagueRat', 'Corona', 'FluFighter', 'Bacterio'
];

export const getRadiusForLevel = (level: number) => {
  return 15 + (level * 2.5);
};

export const getSpeedForSize = (radius: number) => {
  const speed = BASE_SPEED - (radius * 0.05);
  return Math.max(speed, MIN_SPEED);
};

export const generateFood = (count: number, mapSize: number): any[] => {
  const foods = [];
  for (let i = 0; i < count; i++) {
    foods.push({
      id: Math.random().toString(36).substr(2, 9),
      x: Math.random() * mapSize,
      y: Math.random() * mapSize,
      radius: 4 + Math.random() * 4,
      color: COLORS.food[Math.floor(Math.random() * COLORS.food.length)],
      xpValue: 5 + Math.floor(Math.random() * 5)
    });
  }
  return foods;
};

export const generateCarbs = (count: number, mapSize: number): any[] => {
    const carbs = [];
    for (let i = 0; i < count; i++) {
        const rand = Math.random();
        let radius = CARB_RADIUS_BASE;
        let hp = CARB_HP_BASE;
        let xp = CARB_XP_VALUE;

        // Size variations
        if (rand > 0.9) {
            // Massive Carb (10% chance)
            radius = CARB_RADIUS_BASE * 2; // Double size
            hp = CARB_HP_BASE * 3; // Very hard to break
            xp = CARB_XP_VALUE * 4; // 4x XP
        } else if (rand > 0.6) {
            // Big Carb (30% chance)
            radius = CARB_RADIUS_BASE * 1.5;
            hp = CARB_HP_BASE * 1.8;
            xp = CARB_XP_VALUE * 2;
        }

        carbs.push({
            id: Math.random().toString(36).substr(2, 9),
            x: Math.random() * mapSize,
            y: Math.random() * mapSize,
            radius: radius,
            color: COLORS.carb,
            xpValue: Math.floor(xp),
            hp: Math.floor(hp),
            maxHp: Math.floor(hp)
        });
    }
    return carbs;
}

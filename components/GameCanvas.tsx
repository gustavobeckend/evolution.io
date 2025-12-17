
import React, { useEffect, useRef } from 'react';
import { onPlayerUpdate, onPlayerJoined, onPlayerLeft } from '../services/socket';
import { Player, Food, GamePhase, EvolutionStage, Bot, Projectile, Resin, Minion, MimicPassive, BotStatus, Carbohydrate } from '../types';
import { 
    MAP_SIZE, GATE_SIZE, COLORS, getRadiusForLevel, getSpeedForSize, generateFood, 
    MOLECULE_LEVEL, BRANCH_LEVEL_1, BRANCH_LEVEL_2, XP_MULTIPLIER, INITIAL_BOT_COUNT,
    SHIELD_COOLDOWN_MS, NEEDLE_COOLDOWN_MS, MOLECULE_THROW_COOLDOWN_MS,
    VIRUS_MAGNET_RADIUS_BASE, VIRUS_NEEDLE_DAMAGE_BASE,
    TANK_PASSIVE_COOLDOWN_MS, COLONIZER_ABILITY_DURATION_MS, COLONIZER_COOLDOWN_MS,
    TOXIC_ABILITY_DURATION_MS, TOXIC_COOLDOWN_MS, BOT_SPEED_FACTOR, BASE_XP_REQ,
    INITIAL_FOOD_COUNT, STALKER_ATTACH_RANGE, STALKER_COOLDOWN_MS, STALKER_BASE_DRAIN_RATE,
    MIMIC_TRANSFORM_RANGE, MIMIC_PASSIVE_INTERVAL_MS, MIMIC_COOLDOWN_MS, MIMIC_TOXIC_INTERVAL_MS, MIMIC_SPEED_MULTI,
    ZOMBIE_INFECTION_DURATION_MS, ZOMBIE_COOLDOWN_MS, ZOMBIE_SPEED_MULTIPLIER, ZOMBIE_FRENZY_DETECTION_RANGE,
    BOT_NAMES, CARB_COUNT, generateCarbs, CARB_HP_BASE, CARB_XP_VALUE, CARB_RADIUS_BASE
} from '../constants';

interface GameCanvasProps {
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;
  playerRef: React.MutableRefObject<Player>;
  botsRef: React.MutableRefObject<Bot[]>;
  foodsRef: React.MutableRefObject<Food[]>;
  carbohydratesRef: React.MutableRefObject<Carbohydrate[]>;
  onUpdate: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ phase, setPhase, playerRef, botsRef, foodsRef, carbohydratesRef, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);
  const frameCountRef = useRef<number>(0); 
  const projectilesRef = useRef<Projectile[]>([]);
  const resinRef = useRef<Resin[]>([]); 
  const mouseRef = useRef({ x: 0, y: 0 });
  const spacePressedRef = useRef(false);
    // Remote players map for multiplayer prototype
    interface RemotePlayer {
        id: string;
        x: number;
        y: number;
        prevX: number;
        prevY: number;
        targetX: number;
        targetY: number;
        radius: number;
        color: string;
        lastUpdate: number;
    }
    const remotePlayersRef = useRef<Record<string, RemotePlayer>>({});

  // Initialize foods and bots
  useEffect(() => {
    if (foodsRef.current.length === 0) {
      foodsRef.current = generateFood(INITIAL_FOOD_COUNT, MAP_SIZE);
    }
    if (botsRef.current.length === 0) {
        populateBots(INITIAL_BOT_COUNT);
    }
    if (carbohydratesRef.current.length === 0) {
        carbohydratesRef.current = generateCarbs(CARB_COUNT, MAP_SIZE);
    }
  }, []);

    // Socket listeners for remote players (join/leave/update)
    useEffect(() => {
        const handleUpdate = (data: any) => {
            const now = Date.now();
            const id = data.playerId;
            if (!id) return;
            const existing = remotePlayersRef.current[id];
            const radius = 18;
            if (existing) {
                existing.prevX = existing.x;
                existing.prevY = existing.y;
                existing.targetX = data.x;
                existing.targetY = data.y;
                existing.lastUpdate = now;
                existing.x = existing.x; // keep current for interpolation
                existing.y = existing.y;
            } else {
                remotePlayersRef.current[id] = {
                    id,
                    x: data.x || 0,
                    y: data.y || 0,
                    prevX: data.x || 0,
                    prevY: data.y || 0,
                    targetX: data.x || 0,
                    targetY: data.y || 0,
                    radius,
                    color: '#60a5fa',
                    lastUpdate: now
                };
            }
        };

        const handleJoin = (data: any) => {
            if (!data?.playerId) return;
            const id = data.playerId;
            if (!remotePlayersRef.current[id]) {
                remotePlayersRef.current[id] = {
                    id,
                    x: 0,
                    y: 0,
                    prevX: 0,
                    prevY: 0,
                    targetX: 0,
                    targetY: 0,
                    radius: 18,
                    color: '#60a5fa',
                    lastUpdate: Date.now()
                };
            }
        };

        const handleLeave = (data: any) => {
            if (!data?.playerId) return;
            delete remotePlayersRef.current[data.playerId];
        };

        onPlayerUpdate(handleUpdate);
        onPlayerJoined(handleJoin);
        onPlayerLeft(handleLeave);

        return () => {
            // no-op: services/socket does not expose off() so we rely on page reload to clear
        };
    }, []);

  const populateBots = (count: number) => {
      for(let i=0; i<count; i++) {
            botsRef.current.push(createBot());
        }
  };

  const createBot = (): Bot => {
      const level = 1; 
      const radius = getRadiusForLevel(level);
      return {
          id: Math.random().toString(36).substr(2, 9),
          name: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
          x: Math.random() * MAP_SIZE,
          y: Math.random() * MAP_SIZE,
          radius: radius,
          color: COLORS.bot[Math.floor(Math.random() * COLORS.bot.length)],
          speed: getSpeedForSize(radius) * BOT_SPEED_FACTOR,
          targetX: Math.random() * MAP_SIZE,
          targetY: Math.random() * MAP_SIZE,
          level: level,
          xp: 0,
          maxXp: BASE_XP_REQ,
          stage: EvolutionStage.ATOM,
          score: 0,
          angle: 0,
          status: BotStatus.HEALTHY,
          sickUntil: 0,
          ownerId: null
      };
  };

  const respawnCarb = () => {
        const rand = Math.random();
        let radius = CARB_RADIUS_BASE;
        let hp = CARB_HP_BASE;
        let xp = CARB_XP_VALUE;

        if (rand > 0.9) {
            radius = CARB_RADIUS_BASE * 2;
            hp = CARB_HP_BASE * 3;
            xp = CARB_XP_VALUE * 4;
        } else if (rand > 0.6) {
            radius = CARB_RADIUS_BASE * 1.5;
            hp = CARB_HP_BASE * 1.8;
            xp = CARB_XP_VALUE * 2;
        }

        return {
            id: Math.random().toString(36).substr(2, 9),
            x: Math.random() * MAP_SIZE,
            y: Math.random() * MAP_SIZE,
            radius: radius,
            color: COLORS.carb,
            xpValue: Math.floor(xp),
            hp: Math.floor(hp),
            maxHp: Math.floor(hp)
        };
  };

  const resetPlayer = () => {
      const p = playerRef.current;
      p.level = 1;
      p.xp = 0;
      p.maxXp = BASE_XP_REQ; 
      p.radius = getRadiusForLevel(1);
      p.stage = EvolutionStage.ATOM;
      p.color = COLORS.atom;
      p.score = 0;
      p.minions = [];
      p.isShielding = false;
      p.shieldHp = 0;
      p.attachedTargetId = null;
      p.disguiseStage = null;
      p.mimicPassive = MimicPassive.NONE;
      p.x = Math.random() * MAP_SIZE;
      p.y = Math.random() * MAP_SIZE;
      p.speed = getSpeedForSize(p.radius);
  };

  // Handle Input
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            if (!spacePressedRef.current) {
                spacePressedRef.current = true;
                handleAbilityTrigger();
            }
        }
        if (e.code === 'KeyX') {
             if (playerRef.current.stage === EvolutionStage.VIRUS_MIMIC && playerRef.current.disguiseStage) {
                 playerRef.current.disguiseStage = null;
                 playerRef.current.minions = [];
                 playerRef.current.isShielding = false;
                 playerRef.current.attachedTargetId = null;
             }
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            spacePressedRef.current = false;
        }
    };

    const handleResize = () => {
        if(canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
        }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    handleResize();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [phase]);

  const handleAbilityTrigger = () => {
      const player = playerRef.current;
      const now = Date.now();

      if (phase !== GamePhase.PLAYING) return;
      if (player.abilityCooldown > now) return;

      const effectiveStage = player.disguiseStage || player.stage;

      // --- MIMIC TRANSFORMATION LOGIC ---
      if (player.stage === EvolutionStage.VIRUS_MIMIC && !player.disguiseStage) {
          let targetBot: Bot | null = null;
          let minDist = MIMIC_TRANSFORM_RANGE;
          
          for (const bot of botsRef.current) {
              const dist = Math.hypot(player.x - bot.x, player.y - bot.y);
              if (dist < minDist + bot.radius) {
                  minDist = dist;
                  targetBot = bot;
              }
          }

          if (targetBot) {
              player.disguiseStage = targetBot.stage;
              player.abilityCooldown = now + 1000;
              if (targetBot.stage.startsWith('Bactéria')) {
                   for(let i=0; i<6; i++) {
                    const randomAngle = Math.random() * Math.PI * 2;
                    const randomDistOffset = Math.random() * 40; 
                    player.minions.push({
                        angle: randomAngle,
                        radius: 8,
                        distance: player.radius + 30 + randomDistOffset,
                        xp: 0
                    });
                }
              }
          }
          return; 
      }

      if (effectiveStage === EvolutionStage.MOLECULE) {
          const centerX = window.innerWidth / 2;
          const centerY = window.innerHeight / 2;
          const angle = Math.atan2(mouseRef.current.y - centerY, mouseRef.current.x - centerX);
          
          projectilesRef.current.push({
              id: Math.random().toString(),
              x: player.x + Math.cos(angle) * (player.radius + 10),
              y: player.y + Math.sin(angle) * (player.radius + 10),
              vx: Math.cos(angle) * 15,
              vy: Math.sin(angle) * 15,
              radius: 8,
              color: '#60a5fa',
              damage: 20 + (player.level * 2),
              owner: 'player',
              type: 'atom',
              createdAt: now
          });
          player.abilityCooldown = now + MOLECULE_THROW_COOLDOWN_MS;
      } 
      else if (effectiveStage === EvolutionStage.VIRUS) {
          const centerX = window.innerWidth / 2;
          const centerY = window.innerHeight / 2;
          const angle = Math.atan2(mouseRef.current.y - centerY, mouseRef.current.x - centerX);

          projectilesRef.current.push({
              id: Math.random().toString(),
              x: player.x + Math.cos(angle) * (player.radius + 5),
              y: player.y + Math.sin(angle) * (player.radius + 5),
              vx: Math.cos(angle) * 20,
              vy: Math.sin(angle) * 20,
              radius: 4,
              color: '#ef4444',
              damage: VIRUS_NEEDLE_DAMAGE_BASE + (player.level * 5),
              owner: 'player',
              type: 'needle',
              createdAt: now
          });
          player.abilityCooldown = now + NEEDLE_COOLDOWN_MS;
      }
      else if (effectiveStage === EvolutionStage.VIRUS_STALKER) {
          if (!player.attachedTargetId) {
              let closestBot: Bot | null = null;
              let minEffectiveDist = STALKER_ATTACH_RANGE; 

              for (const bot of botsRef.current) {
                  const dist = Math.hypot(player.x - bot.x, player.y - bot.y);
                  const rangeCheck = STALKER_ATTACH_RANGE + bot.radius; 
                  
                  if (dist < rangeCheck) {
                      if (dist < minEffectiveDist + bot.radius) {
                          minEffectiveDist = dist;
                          closestBot = bot;
                      }
                  }
              }

              if (closestBot) {
                  player.attachedTargetId = closestBot.id;
                  player.attachedAt = now;
              }
          }
      }
      else if (effectiveStage === EvolutionStage.VIRUS_ZOMBIE) {
          let closestBot: Bot | null = null;
          let minDist = VIRUS_MAGNET_RADIUS_BASE + 50; 

          for (const bot of botsRef.current) {
              if (bot.status !== BotStatus.HEALTHY) continue; 
              const dist = Math.hypot(player.x - bot.x, player.y - bot.y);
              if (dist < minDist + bot.radius) {
                  minDist = dist;
                  closestBot = bot;
              }
          }

          if (closestBot) {
              closestBot.status = BotStatus.SICK;
              closestBot.sickUntil = now + ZOMBIE_INFECTION_DURATION_MS;
              player.abilityCooldown = now + ZOMBIE_COOLDOWN_MS;
          }
      }
      else if (effectiveStage === EvolutionStage.BACTERIA || effectiveStage === EvolutionStage.BACTERIA_TANK) {
          if (!player.isShielding) {
              player.isShielding = true;
              const duration = effectiveStage === EvolutionStage.BACTERIA_TANK ? 6000 : 10000;
              if (effectiveStage === EvolutionStage.BACTERIA) {
                  player.shieldHp = 100 + (player.level * 10);
              }
              player.abilityCooldown = now + SHIELD_COOLDOWN_MS;
              setTimeout(() => {
                  if (playerRef.current.isShielding) playerRef.current.isShielding = false;
              }, duration);
          }
      }
      else if (effectiveStage === EvolutionStage.BACTERIA_COLONIZER) {
          player.abilityActiveUntil = now + COLONIZER_ABILITY_DURATION_MS;
          player.abilityCooldown = now + COLONIZER_COOLDOWN_MS;
      }
      else if (effectiveStage === EvolutionStage.BACTERIA_TOXIC) {
           player.minions.forEach(m => {
                 const mx = player.x + Math.cos(m.angle) * m.distance;
                 const my = player.y + Math.sin(m.angle) * m.distance;
                 resinRef.current.push({
                     id: Math.random().toString(),
                     x: mx, y: my, radius: 10 + player.level, 
                     createdAt: now, 
                     damage: Math.max(20, m.xp) 
                 });
           });
           player.abilityActiveUntil = now + TOXIC_ABILITY_DURATION_MS;
           player.abilityCooldown = now + TOXIC_COOLDOWN_MS;
      }
  };

  const regenerateMap = () => {
      // Regenerate food and bots to simulate a new "area"
      foodsRef.current = generateFood(INITIAL_FOOD_COUNT, MAP_SIZE);
      carbohydratesRef.current = generateCarbs(CARB_COUNT, MAP_SIZE);
      botsRef.current = [];
      populateBots(INITIAL_BOT_COUNT);
      // Clean projectiles and resin
      projectilesRef.current = [];
      resinRef.current = [];
      // Clean attached status if any
      playerRef.current.attachedTargetId = null;
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameCountRef.current += 1;
    const player = playerRef.current;
    const now = Date.now();

    // --- LOGIC ---
    if (phase === GamePhase.PLAYING) {
        
        // --- MAP TRANSITION GATES ---
        const gateHalfSize = GATE_SIZE / 2;
        const midY = MAP_SIZE / 2;
        
        const inGateY = player.y > midY - gateHalfSize && player.y < midY + gateHalfSize;
        
        if (inGateY) {
            if (player.x < 0) {
                regenerateMap();
                player.x = MAP_SIZE - player.radius - 50; 
            }
            else if (player.x > MAP_SIZE) {
                regenerateMap();
                player.x = player.radius + 50; 
            }
        }

        // --- MIMIC PASSIVE RANDOMIZER ---
        if (player.stage === EvolutionStage.VIRUS_MIMIC) {
            if (now - player.lastPassiveSwitch > MIMIC_PASSIVE_INTERVAL_MS) {
                const options = [
                    MimicPassive.INVISIBLE,
                    MimicPassive.TOXIC_TRAIL,
                    MimicPassive.DAMAGE_REFLECT,
                    MimicPassive.MAGNET,
                    MimicPassive.SPEED_BOOST // Added Speed Boost
                ];
                const next = options[Math.floor(Math.random() * options.length)];
                player.mimicPassive = next;
                player.lastPassiveSwitch = now;
            }
        }
        
        // --- STALKER ATTACHMENT LOGIC ---
        let hostBot: Bot | null = null;
        if (player.attachedTargetId) {
             hostBot = botsRef.current.find(b => b.id === player.attachedTargetId) || null;
             
             if (!hostBot) {
                 player.attachedTargetId = null;
             } else {
                 player.x = hostBot.x;
                 player.y = hostBot.y;
                 player.angle = hostBot.angle; 

                 const attachedSeconds = (now - player.attachedAt) / 1000;
                 const multiplier = Math.pow(2, Math.floor(attachedSeconds / 2));
                 const framesPerSec = 60;
                 const drainPerFrame = (STALKER_BASE_DRAIN_RATE * multiplier) / framesPerSec;

                 if (hostBot.xp > 0) {
                     hostBot.xp -= drainPerFrame;
                     player.xp += drainPerFrame; 
                     player.score += drainPerFrame;
                     if(hostBot.xp < 0) hostBot.xp = 0;
                 } else {
                     hostBot.radius -= (0.05 * multiplier);
                     if (hostBot.radius < 5) {
                         player.attachedTargetId = null;
                         Object.assign(hostBot, createBot()); 
                     }
                 }
             }
        } 
        
        // 1. Player Movement (Only if NOT attached)
        if (!player.attachedTargetId) {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const mouseAngle = Math.atan2(mouseRef.current.y - centerY, mouseRef.current.x - centerX);
            player.angle = mouseAngle;

            const distToMouse = Math.hypot(mouseRef.current.x - centerX, mouseRef.current.y - centerY);
            const speedMultiplier = Math.min(distToMouse / 100, 1);
            let effectiveSpeed = player.speed;

            // Zombie Speed
            if (player.stage === EvolutionStage.VIRUS_ZOMBIE) {
                let enemyNearby = false;
                for (const b of botsRef.current) {
                    if (b.status === BotStatus.ZOMBIE && b.ownerId === 'player') continue;
                    
                    const dist = Math.hypot(player.x - b.x, player.y - b.y);
                    if (dist < ZOMBIE_FRENZY_DETECTION_RANGE + b.radius) {
                        enemyNearby = true;
                        break;
                    }
                }
                if (!enemyNearby) {
                    effectiveSpeed *= ZOMBIE_SPEED_MULTIPLIER;
                }
            }

            // Mimic Speed Passive
            if (player.stage === EvolutionStage.VIRUS_MIMIC && player.mimicPassive === MimicPassive.SPEED_BOOST) {
                effectiveSpeed *= MIMIC_SPEED_MULTI;
            }

            const velocity = effectiveSpeed * speedMultiplier;
            
            player.x += Math.cos(mouseAngle) * velocity;
            player.y += Math.sin(mouseAngle) * velocity;
            
            if (!inGateY) {
                player.x = Math.max(player.radius, Math.min(MAP_SIZE - player.radius, player.x));
            }
            player.y = Math.max(player.radius, Math.min(MAP_SIZE - player.radius, player.y));
        }

        const effectiveStage = player.disguiseStage || player.stage;

        // 2. Class Passives & Minion Logic

        // --- MIMIC PASSIVES ---
        if (player.stage === EvolutionStage.VIRUS_MIMIC && player.mimicPassive === MimicPassive.TOXIC_TRAIL) {
             if (now - player.lastResinDroppedAt > MIMIC_TOXIC_INTERVAL_MS) { 
                 player.lastResinDroppedAt = now;
                 resinRef.current.push({
                     id: Math.random().toString(),
                     x: player.x, y: player.y, radius: 30, 
                     createdAt: now, 
                     damage: 20 + player.level 
                 });
            }
        }
        if (player.stage === EvolutionStage.VIRUS_MIMIC && player.mimicPassive === MimicPassive.MAGNET) {
             const magnetRange = VIRUS_MAGNET_RADIUS_BASE + (player.level * 5);
             for (let f of foodsRef.current) {
                if (Math.abs(player.x - f.x) > magnetRange) continue;
                if (Math.abs(player.y - f.y) > magnetRange) continue;
                const dist = Math.hypot(player.x - f.x, player.y - f.y);
                if (dist < magnetRange) {
                    const pullAngle = Math.atan2(player.y - f.y, player.x - f.x);
                    f.x += Math.cos(pullAngle) * 4;
                    f.y += Math.sin(pullAngle) * 4;
                }
            }
        }
        
        // --- TOXIC PASSIVE ---
        if (effectiveStage === EvolutionStage.BACTERIA_TOXIC) {
            if (player.abilityActiveUntil > now) {
                const mistRadius = (player.radius + 40) * 2.5;
                const dps = 2 + (player.level * 0.5); 
                
                // Damage Bots
                botsRef.current.forEach(bot => {
                    const dist = Math.hypot(player.x - bot.x, player.y - bot.y);
                    if (dist < mistRadius + bot.radius) {
                        if (bot.xp > 0) {
                            bot.xp -= dps;
                            if (bot.xp < 0) bot.xp = 0;
                        } else {
                            bot.radius -= 0.1;
                            if (bot.radius < 5) Object.assign(bot, createBot());
                        }
                    }
                });

                // Damage Carbohydrates
                for (let k = carbohydratesRef.current.length - 1; k >= 0; k--) {
                    const c = carbohydratesRef.current[k];
                    const dist = Math.hypot(player.x - c.x, player.y - c.y);
                    if (dist < mistRadius + c.radius) {
                        c.hp -= dps;
                        if (c.hp <= 0) {
                            player.xp += c.xpValue;
                            player.score += c.xpValue;
                            carbohydratesRef.current.splice(k, 1);
                            carbohydratesRef.current.push(respawnCarb());
                        }
                    }
                }
            }

            if (now - player.lastResinDroppedAt > 180000) {
                 player.lastResinDroppedAt = now;
                 player.minions.forEach(m => {
                     const mx = player.x + Math.cos(m.angle) * m.distance;
                     const my = player.y + Math.sin(m.angle) * m.distance;
                     resinRef.current.push({
                         id: Math.random().toString(),
                         x: mx, y: my, radius: 15, 
                         createdAt: now, 
                         damage: Math.max(20, m.xp)
                     });
                 });
            }
        }

        // --- VIRUS MAGNET ---
        if (effectiveStage === EvolutionStage.VIRUS) {
            const magnetRange = VIRUS_MAGNET_RADIUS_BASE + (player.level * 5);
            for (let f of foodsRef.current) {
                if (Math.abs(player.x - f.x) > magnetRange) continue;
                if (Math.abs(player.y - f.y) > magnetRange) continue;
                const dist = Math.hypot(player.x - f.x, player.y - f.y);
                if (dist < magnetRange) {
                    const pullAngle = Math.atan2(player.y - f.y, player.x - f.x);
                    f.x += Math.cos(pullAngle) * 4;
                    f.y += Math.sin(pullAngle) * 4;
                }
            }
        }
        
        // --- BACTERIA MINIONS ---
        const isBacteria = effectiveStage.startsWith('Bactéria');
        if (isBacteria) {
            const minionCount = 6;
            
            if (player.minions.length === 0) {
                for(let i=0; i<minionCount; i++) {
                    const randomAngle = Math.random() * Math.PI * 2;
                    const randomDistOffset = Math.random() * 40; 
                    player.minions.push({
                        angle: randomAngle,
                        radius: 8,
                        distance: player.radius + 30 + randomDistOffset,
                        xp: 0
                    });
                }
            }

            const colonizerActive = effectiveStage === EvolutionStage.BACTERIA_COLONIZER && player.abilityActiveUntil > now;
            const tankActive = effectiveStage === EvolutionStage.BACTERIA_TANK && player.isShielding;

            player.minions.forEach((m, idx) => {
                const minionLevel = Math.floor(m.xp / 20) + 1;
                m.radius = Math.min(8 + minionLevel, player.radius * 0.5);
                const orbitSpeed = 0.005 + (0.002 * (idx % 2 === 0 ? 1 : -1)); 
                let targetAngle = m.angle + orbitSpeed;
                let targetDist = m.distance;
                let lerpFactor = 0.02; 
                let chasing = false;

                if (effectiveStage === EvolutionStage.BACTERIA && player.isShielding) {
                    targetDist = player.radius + m.radius;
                    targetAngle = m.angle + 0.1;
                    lerpFactor = 0.2; 
                }
                else if (tankActive) {
                    targetDist = player.radius + m.radius - 5;
                    targetAngle = m.angle + 0.15; 
                    lerpFactor = 0.2;
                }
                else if (colonizerActive) {
                    if ((frameCountRef.current % 15) === (idx % 15)) {
                        const scanRadius = player.radius * 3.5;
                        const minionWorldX = player.x + Math.cos(m.angle) * m.distance;
                        const minionWorldY = player.y + Math.sin(m.angle) * m.distance;
                        let bestTarget = null;
                        let minTargetDist = scanRadius;
                        for (const f of foodsRef.current) {
                             if (Math.abs(minionWorldX - f.x) > minTargetDist) continue;
                             if (Math.abs(minionWorldY - f.y) > minTargetDist) continue;
                             const dist = Math.hypot(minionWorldX - f.x, minionWorldY - f.y);
                             if(dist < minTargetDist) {
                                 minTargetDist = dist;
                                 bestTarget = f;
                             }
                        }
                        if (bestTarget) {
                            m.targetX = bestTarget.x;
                            m.targetY = bestTarget.y;
                            m.hasTarget = true;
                        } else {
                            m.hasTarget = false;
                        }
                    }
                    lerpFactor = 0.08; 
                } 
                else {
                    const idealOrbit = player.radius + 40 + (Math.sin(now/1000 + idx) * 20); 
                    targetDist = idealOrbit;
                    m.hasTarget = false;
                }

                if (colonizerActive && m.hasTarget && m.targetX !== undefined) {
                     const dx = m.targetX - player.x;
                     const dy = m.targetY - player.y;
                     targetDist = Math.hypot(dx, dy); 
                     targetAngle = Math.atan2(dy, dx); 
                     chasing = true;
                }

                if (chasing) {
                    let diff = targetAngle - m.angle;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    m.angle += diff * lerpFactor;
                    m.distance += (targetDist - m.distance) * lerpFactor;
                } else {
                    m.angle = targetAngle; 
                    m.distance = m.distance * (1 - lerpFactor) + targetDist * lerpFactor;
                }

                const finalX = player.x + Math.cos(m.angle) * m.distance;
                const finalY = player.y + Math.sin(m.angle) * m.distance;

                // Minion Food Collision
                for (let i = foodsRef.current.length - 1; i >= 0; i--) {
                    const f = foodsRef.current[i];
                    const combinedRadius = m.radius + f.radius; 
                    if (Math.abs(finalX - f.x) > combinedRadius) continue;
                    if (Math.abs(finalY - f.y) > combinedRadius) continue;
                    const dist = Math.hypot(finalX - f.x, finalY - f.y);
                    if (dist < combinedRadius) {
                        m.xp += f.xpValue; 
                        player.xp += f.xpValue * 0.5;
                        player.score += f.xpValue;
                        foodsRef.current.splice(i, 1);
                        foodsRef.current.push(createNewFood());
                        if (m.hasTarget) m.hasTarget = false; 
                    }
                }

                // NEW: Minion vs Carbohydrates
                for (let k = carbohydratesRef.current.length - 1; k >= 0; k--) {
                    const c = carbohydratesRef.current[k];
                    const combinedRadius = m.radius + c.radius;
                    if (Math.abs(finalX - c.x) > combinedRadius) continue;
                    if (Math.abs(finalY - c.y) > combinedRadius) continue;
                    const dist = Math.hypot(finalX - c.x, finalY - c.y);
                    if (dist < combinedRadius) {
                        c.hp -= 2; 
                        if (c.hp <= 0) {
                             let xpGain = c.xpValue;
                             // Double XP if Colonizer Ability is active
                             if (colonizerActive) {
                                 xpGain *= 2;
                             }
                             m.xp += xpGain; 
                             player.xp += xpGain;
                             player.score += xpGain;
                             carbohydratesRef.current.splice(k, 1);
                             carbohydratesRef.current.push(respawnCarb());
                        }
                    }
                }

                // Minion vs Bot
                if (colonizerActive) {
                    for (let j = botsRef.current.length - 1; j >= 0; j--) {
                        const b = botsRef.current[j];
                        if (b.level < minionLevel) {
                            const combinedRadius = m.radius + b.radius;
                            if (Math.abs(finalX - b.x) > combinedRadius) continue;
                            if (Math.abs(finalY - b.y) > combinedRadius) continue;
                            const dist = Math.hypot(finalX - b.x, finalY - b.y);
                            if (dist < combinedRadius) {
                                // DOUBLE XP BUFF FOR COLONIZER
                                const xpGain = b.radius * 10;
                                player.xp += xpGain;
                                player.score += xpGain;
                                Object.assign(b, createBot());
                                m.hasTarget = false;
                            }
                        }
                    }
                }
            });
        }

        // 3. Collision: Player vs Food
        for (let i = foodsRef.current.length - 1; i >= 0; i--) {
            const f = foodsRef.current[i];
            const combinedRadius = player.radius + f.radius;
            if (Math.abs(player.x - f.x) > combinedRadius) continue;
            if (Math.abs(player.y - f.y) > combinedRadius) continue;
            const dist = Math.hypot(player.x - f.x, player.y - f.y);
            if (dist < combinedRadius) {
                player.xp += f.xpValue;
                player.score += f.xpValue;
                foodsRef.current.splice(i, 1);
                foodsRef.current.push(createNewFood());
            }
        }

        // 3.5 Collision: Player vs Carbohydrates (Sustained eating)
        for (let i = carbohydratesRef.current.length - 1; i >= 0; i--) {
            const c = carbohydratesRef.current[i];
            const combinedRadius = player.radius + c.radius;
            
            // Optimization
            if (Math.abs(player.x - c.x) > combinedRadius) continue;
            if (Math.abs(player.y - c.y) > combinedRadius) continue;

            const dist = Math.hypot(player.x - c.x, player.y - c.y);
            if (dist < combinedRadius) {
                // Drain HP
                c.hp -= 1;
                if (c.hp <= 0) {
                    player.xp += c.xpValue;
                    player.score += c.xpValue;
                    carbohydratesRef.current.splice(i, 1);
                    carbohydratesRef.current.push(respawnCarb());
                }
            }
        }

        // 4. Projectiles
        for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
            const p = projectilesRef.current[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > MAP_SIZE || p.y < 0 || p.y > MAP_SIZE || now - p.createdAt > 5000) {
                projectilesRef.current.splice(i, 1);
                continue;
            }

            // Hit Carbs
            for (let k = carbohydratesRef.current.length - 1; k >= 0; k--) {
                const c = carbohydratesRef.current[k];
                const combinedRadius = c.radius + p.radius;
                if (Math.abs(p.x - c.x) > combinedRadius) continue;
                if (Math.abs(p.y - c.y) > combinedRadius) continue;
                const dist = Math.hypot(p.x - c.x, p.y - c.y);
                if (dist < combinedRadius) {
                    c.hp -= p.damage;
                    projectilesRef.current.splice(i, 1); // remove projectile
                    if (c.hp <= 0) {
                        if (p.owner === 'player') {
                            player.xp += c.xpValue;
                            player.score += c.xpValue;
                        }
                        carbohydratesRef.current.splice(k, 1);
                        carbohydratesRef.current.push(respawnCarb());
                    }
                    break; 
                }
            }
            if (projectilesRef.current[i] !== p) continue; // If projectile died hitting carb, skip

            // Hit Bots
            for (let j = botsRef.current.length - 1; j >= 0; j--) {
                const b = botsRef.current[j];
                const combinedRadius = b.radius + p.radius;
                if (Math.abs(p.x - b.x) > combinedRadius) continue;
                if (Math.abs(p.y - b.y) > combinedRadius) continue;
                const dist = Math.hypot(p.x - b.x, p.y - b.y);
                if (dist < combinedRadius) {
                    projectilesRef.current.splice(i, 1);
                    b.radius = Math.max(10, b.radius - (p.damage / 10)); 
                    break; 
                }
            }

            // Shield Collision & Player Collision
            if (player.attachedTargetId) continue;

            if (isBacteria && player.isShielding && p.owner !== 'player') {
                 let blocked = false;
                 if (effectiveStage === EvolutionStage.BACTERIA_TANK) {
                     if (Math.hypot(p.x - player.x, p.y - player.y) < player.radius + p.radius + 15) blocked = true;
                 } else {
                    if (Math.hypot(p.x - player.x, p.y - player.y) < player.radius + p.radius + 10) blocked = true;
                    if (!blocked) {
                        player.minions.forEach(m => {
                            const mx = player.x + Math.cos(m.angle) * m.distance;
                            const my = player.y + Math.sin(m.angle) * m.distance;
                            if (Math.hypot(p.x - mx, p.y - my) < m.radius + p.radius + 10) blocked = true;
                        });
                    }
                 }

                 if (blocked) {
                     projectilesRef.current.splice(i, 1);
                     if (effectiveStage !== EvolutionStage.BACTERIA_TANK) {
                        player.shieldHp -= p.damage;
                        if (player.shieldHp <= 0) player.isShielding = false;
                     }
                     continue;
                 }
            }
        }

        // 5. Resin (Toxic) Logic
        for (let i = resinRef.current.length - 1; i >= 0; i--) {
            const r = resinRef.current[i];
            if (now - r.createdAt > 20000) { 
                 resinRef.current.splice(i, 1);
                 continue;
            }

            // Resin Damage Carbs
            for (let k = carbohydratesRef.current.length - 1; k >= 0; k--) {
                const c = carbohydratesRef.current[k];
                if (Math.abs(r.x - c.x) > r.radius + c.radius) continue; 
                const dist = Math.hypot(r.x - c.x, r.y - c.y);
                if (dist < r.radius + c.radius) {
                    c.hp -= r.damage;
                    if (c.hp <= 0) {
                         // Assume Player created resin for simplicity in MVP
                        player.xp += c.xpValue;
                        player.score += c.xpValue;
                        carbohydratesRef.current.splice(k, 1);
                        carbohydratesRef.current.push(respawnCarb());
                    }
                    resinRef.current.splice(i, 1);
                    break;
                }
            }
            if (resinRef.current[i] !== r) continue;

             for (let j = botsRef.current.length - 1; j >= 0; j--) {
                const b = botsRef.current[j];
                if (Math.abs(r.x - b.x) > r.radius + b.radius) continue; 
                const dist = Math.hypot(r.x - b.x, r.y - b.y);
                if (dist < r.radius + b.radius) {
                    if (b.xp > 0) {
                        b.xp -= r.damage;
                        if (b.xp < 0) b.xp = 0;
                    } else {
                        b.radius -= 5;
                        if(b.radius < 5) Object.assign(b, createBot());
                    }
                    resinRef.current.splice(i, 1);
                    break;
                }
            }
        }

        // 6. Bots Logic (Evolving AI)
        botsRef.current.forEach(bot => {
            // Update Score for Leaderboard
            bot.score = Math.floor(bot.xp + (bot.radius * 10));

            const dx = bot.targetX - bot.x;
            const dy = bot.targetY - bot.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist < 10 || Math.random() < 0.005) {
                bot.targetX = Math.random() * MAP_SIZE;
                bot.targetY = Math.random() * MAP_SIZE;
            }
            
            const angle = Math.atan2(dy, dx);
            bot.angle = angle; 
            bot.x += Math.cos(angle) * bot.speed;
            bot.y += Math.sin(angle) * bot.speed;
            
            // Bot Eat Food
             for (let i = foodsRef.current.length - 1; i >= 0; i--) {
                const f = foodsRef.current[i];
                if (Math.abs(bot.x - f.x) > bot.radius + f.radius) continue;
                if (Math.hypot(bot.x - f.x, bot.y - f.y) < bot.radius + f.radius) {
                    foodsRef.current.splice(i, 1);
                    foodsRef.current.push(createNewFood());
                    
                    if (bot.status === BotStatus.SICK) {
                        bot.xp += f.xpValue * 0.5;
                    } else if (bot.status === BotStatus.ZOMBIE) {
                        bot.xp += f.xpValue;
                        if (bot.ownerId === 'player') {
                            player.xp += f.xpValue * 0.5;
                        }
                    } else {
                        bot.xp += f.xpValue;
                    }
                }
            }

            // Bot Eat Carbs (Sustained)
             for (let i = carbohydratesRef.current.length - 1; i >= 0; i--) {
                const c = carbohydratesRef.current[i];
                if (Math.abs(bot.x - c.x) > bot.radius + c.radius) continue;
                if (Math.hypot(bot.x - c.x, bot.y - c.y) < bot.radius + c.radius) {
                    c.hp -= 1;
                    if (c.hp <= 0) {
                        bot.xp += c.xpValue;
                        carbohydratesRef.current.splice(i, 1);
                        carbohydratesRef.current.push(respawnCarb());
                    }
                }
            }

            // CHECK SICK STATUS EXPIRATION
            if (bot.status === BotStatus.SICK) {
                if (now > bot.sickUntil) {
                    bot.status = BotStatus.ZOMBIE;
                    bot.ownerId = 'player'; 
                    bot.color = COLORS.zombieBot; 
                }
            }

            // Bot Evolution
            if (bot.xp >= bot.maxXp) {
                bot.level += 1;
                bot.xp = 0;
                bot.maxXp = Math.floor(bot.maxXp * XP_MULTIPLIER);
                bot.radius = getRadiusForLevel(bot.level);
                
                if (bot.level === MOLECULE_LEVEL) {
                    bot.stage = EvolutionStage.MOLECULE;
                    if(bot.status !== BotStatus.ZOMBIE) bot.color = COLORS.molecule;
                }
                if (bot.level === BRANCH_LEVEL_1) {
                    if (Math.random() > 0.5) {
                         bot.stage = EvolutionStage.VIRUS;
                         if(bot.status !== BotStatus.ZOMBIE) bot.color = COLORS.virus;
                    } else {
                         bot.stage = EvolutionStage.BACTERIA;
                         if(bot.status !== BotStatus.ZOMBIE) bot.color = COLORS.bacteria;
                    }
                }
            }

            // Player Interaction
            {
                
                // STALKER EJECTION LOGIC
                if (player.attachedTargetId === bot.id) {
                    if (Math.random() < 0.008) { 
                        player.attachedTargetId = null;
                        player.abilityCooldown = now + STALKER_COOLDOWN_MS;
                        
                        const ejectAngle = Math.random() * Math.PI * 2;
                        player.x += Math.cos(ejectAngle) * 150;
                        player.y += Math.sin(ejectAngle) * 150;
                    }
                }

                const distToPlayer = Math.hypot(player.x - bot.x, player.y - bot.y);
                
                // --- BOT EATS PLAYER MINIONS ---
                if (effectiveStage.startsWith('Bactéria')) {
                    const isColonizer = effectiveStage === EvolutionStage.BACTERIA_COLONIZER;
                    const colonizerActive = player.abilityActiveUntil > now;
                    if (isColonizer && colonizerActive) {
                        player.minions.forEach(minion => {
                            const mx = player.x + Math.cos(minion.angle) * minion.distance;
                            const my = player.y + Math.sin(minion.angle) * minion.distance;
                            if (Math.abs(bot.x - mx) > bot.radius + minion.radius) return;
                            const distToMinion = Math.hypot(bot.x - mx, bot.y - my);
                            if (distToMinion < bot.radius + minion.radius) {
                                if (bot.radius > minion.radius * 1.2) {
                                    let xpGain = 20 + (minion.xp * 0.1);
                                    if(bot.status === BotStatus.SICK) xpGain *= 0.5;
                                    
                                    bot.xp += xpGain;
                                    if(bot.status === BotStatus.ZOMBIE && bot.ownerId === 'player') player.xp += xpGain * 0.5;

                                    minion.xp = 0;
                                    minion.distance = player.radius + 10;
                                }
                            }
                        });
                    }
                }

                if (player.attachedTargetId) return;

                // Player eats Bot
                if (distToPlayer < player.radius - (bot.radius * 0.2) && player.radius > bot.radius * 1.2) {
                    player.xp += bot.radius * 10;
                    player.score += bot.radius * 10;
                    
                    // --- ZOMBIE INFECTION LOGIC (Eating Sick Bot) ---
                    if (bot.status === BotStatus.SICK || bot.status === BotStatus.ZOMBIE) {
                         player.xp -= 50; // Penalty for eating rotten food
                    }

                    Object.assign(bot, createBot());
                }
                
                // Bot hits Player
                if (distToPlayer < bot.radius + player.radius) {
                     if (bot.status === BotStatus.ZOMBIE && bot.ownerId === 'player') return;

                     const hasTankPassive = effectiveStage === EvolutionStage.BACTERIA_TANK || (player.stage === EvolutionStage.VIRUS_MIMIC && player.mimicPassive === MimicPassive.DAMAGE_REFLECT);
                     
                     if (hasTankPassive) {
                         if (now - player.lastHitTankedAt > TANK_PASSIVE_COOLDOWN_MS) {
                             player.lastHitTankedAt = now;
                             return; 
                         }
                     }

                     if (effectiveStage === EvolutionStage.BACTERIA_TANK && player.isShielding) {
                         const pushAngle = Math.atan2(bot.y - player.y, bot.x - player.x);
                         bot.x += Math.cos(pushAngle) * 20; 
                         bot.y += Math.sin(pushAngle) * 20;
                         bot.radius -= 5; 
                         if(bot.radius < 5) Object.assign(bot, createBot()); 
                         return; 
                     }

                     if (bot.radius > player.radius * 1.2) {
                         if (player.isShielding && effectiveStage === EvolutionStage.BACTERIA) {
                             const pushAngle = Math.atan2(bot.y - player.y, bot.x - player.x);
                             bot.x += Math.cos(pushAngle) * 30;
                             bot.y += Math.sin(pushAngle) * 30;
                             player.shieldHp -= 20;
                             if(player.shieldHp <= 0) player.isShielding = false;
                         } else {
                             resetPlayer();
                         }
                     }
                }
            }

            // BOT vs BOT (Infection Spread Logic)
             for (let k = botsRef.current.length - 1; k >= 0; k--) {
                 if (botsRef.current[k] === bot) continue;
                 const other = botsRef.current[k];
                 
                 const dist = Math.hypot(bot.x - other.x, bot.y - other.y);
                 if (dist < bot.radius && bot.radius > other.radius * 1.2) {
                     // Bot (Predator) eats Other (Prey)
                     let xpGain = other.radius * 10;
                     
                     // ZOMBIE SPREAD LOGIC
                     if (other.status === BotStatus.SICK || other.status === BotStatus.ZOMBIE) {
                         if (bot.status === BotStatus.HEALTHY) {
                             bot.status = BotStatus.SICK;
                             bot.sickUntil = now + ZOMBIE_INFECTION_DURATION_MS;
                         }
                         xpGain = 0; 
                     }

                     if(bot.status === BotStatus.SICK) {
                         xpGain *= 0.5;
                     }
                     
                     bot.xp += xpGain;
                     if(bot.status === BotStatus.ZOMBIE && bot.ownerId === 'player') player.xp += xpGain * 0.5;

                     Object.assign(other, createBot());
                 }
             }

        });

        if (player.xp >= player.maxXp) {
            player.level += 1;
            player.xp = player.xp - player.maxXp;
            player.maxXp = Math.floor(player.maxXp * XP_MULTIPLIER);
            player.radius = getRadiusForLevel(player.level);
            player.speed = getSpeedForSize(player.radius);

            if (player.level === MOLECULE_LEVEL) {
                player.stage = EvolutionStage.MOLECULE;
                player.color = COLORS.molecule;
            }
            if (player.level === BRANCH_LEVEL_1 || player.level === BRANCH_LEVEL_2) {
                setPhase(GamePhase.EVOLUTION_CHOICE);
            }
        }

        onUpdate();
    }

    // --- RENDERING ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    // --- CAMERA ZOOM OPTIMIZED ---
    const zoom = Math.max(0.7, 1 - (player.level * 0.01)); 
    const camX = (canvas.width / zoom / 2) - player.x;
    const camY = (canvas.height / zoom / 2) - player.y;

    ctx.scale(zoom, zoom);
    ctx.translate(camX, camY);

    // Map & Grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, MAP_SIZE, MAP_SIZE);
    
    // Gates Rendering
    const midY = MAP_SIZE / 2;
    const gateHalfSize = GATE_SIZE / 2;
    // Left Gate
    const gradientLeft = ctx.createLinearGradient(0, midY - gateHalfSize, 50, midY + gateHalfSize);
    gradientLeft.addColorStop(0, '#3b82f6');
    gradientLeft.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = gradientLeft;
    ctx.fillRect(-20, midY - gateHalfSize, 30, GATE_SIZE);
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#3b82f6';
    ctx.fillRect(-20, midY - gateHalfSize, 30, GATE_SIZE);
    ctx.shadowBlur = 0;

    // Right Gate
    const gradientRight = ctx.createLinearGradient(MAP_SIZE - 50, midY - gateHalfSize, MAP_SIZE, midY + gateHalfSize);
    gradientRight.addColorStop(0, '#8b5cf6');
    gradientRight.addColorStop(1, '#3b82f6');
    ctx.fillStyle = gradientRight;
    ctx.fillRect(MAP_SIZE - 10, midY - gateHalfSize, 30, GATE_SIZE);
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#8b5cf6';
    ctx.fillRect(MAP_SIZE - 10, midY - gateHalfSize, 30, GATE_SIZE);
    ctx.shadowBlur = 0;


    ctx.beginPath();
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    const gridSize = 100;
    const startX = Math.floor((player.x - (canvas.width / zoom)) / gridSize) * gridSize;
    const endX = Math.floor((player.x + (canvas.width / zoom)) / gridSize) * gridSize;
    const startY = Math.floor((player.y - (canvas.height / zoom)) / gridSize) * gridSize;
    const endY = Math.floor((player.y + (canvas.height / zoom)) / gridSize) * gridSize;

    for (let x = startX; x <= endX; x += gridSize) {
        if (x < 0 || x > MAP_SIZE) continue;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, MAP_SIZE);
    }
    for (let y = startY; y <= endY; y += gridSize) {
        if (y < 0 || y > MAP_SIZE) continue;
        ctx.moveTo(0, y);
        ctx.lineTo(MAP_SIZE, y);
    }
    ctx.stroke();

    // Resin (Draw First)
    resinRef.current.forEach(r => {
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(147, 51, 234, 0.4)'; // Purple
        ctx.fill();
    });

    // Toxic Mist
    const currentEffectiveStage = player.disguiseStage || player.stage;
    if (currentEffectiveStage === EvolutionStage.BACTERIA_TOXIC && player.abilityActiveUntil > now) {
        const mistRadius = (player.radius + 40) * 2.5;
        ctx.beginPath();
        ctx.arc(player.x, player.y, mistRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 51, 234, ${0.1 + Math.sin(now/100)*0.05})`;
        ctx.fill();
    }

    // Carbohydrates Rendering (Hexagons)
    carbohydratesRef.current.forEach(c => {
        const margin = 50;
        if (c.x + c.radius < player.x - (canvas.width/zoom/2) - margin ||
            c.x - c.radius > player.x + (canvas.width/zoom/2) + margin ||
            c.y + c.radius < player.y - (canvas.height/zoom/2) - margin ||
            c.y - c.radius > player.y + (canvas.height/zoom/2) + margin) return;

        ctx.beginPath();
        const sides = 6;
        const r = c.radius;
        // Make it pulsate if taking damage
        const scale = c.hp < c.maxHp ? 0.9 + Math.sin(now/50)*0.1 : 1; 

        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const px = c.x + Math.cos(angle) * r * scale;
            const py = c.y + Math.sin(angle) * r * scale;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        
        ctx.fillStyle = c.color;
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw HP bar for Carb if damaged
        if (c.hp < c.maxHp) {
             const hpPct = c.hp / c.maxHp;
             ctx.fillStyle = '#ef4444';
             ctx.fillRect(c.x - 15, c.y - c.radius - 10, 30, 4);
             ctx.fillStyle = '#22c55e';
             ctx.fillRect(c.x - 15, c.y - c.radius - 10, 30 * hpPct, 4);
        }
    });

    // Food
    foodsRef.current.forEach(f => {
        const margin = 50;
        if (f.x + f.radius < player.x - (canvas.width/zoom/2) - margin ||
            f.x - f.radius > player.x + (canvas.width/zoom/2) + margin ||
            f.y + f.radius < player.y - (canvas.height/zoom/2) - margin ||
            f.y - f.radius > player.y + (canvas.height/zoom/2) + margin) return;

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fillStyle = f.color;
        ctx.fill();
    });

    // Projectiles
    projectilesRef.current.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
    });

    // Bots
    botsRef.current.forEach(b => {
        const margin = b.radius + 100;
        if (b.x + b.radius < player.x - (canvas.width/zoom/2) - margin ||
            b.x - b.radius > player.x + (canvas.width/zoom/2) + margin ||
            b.y + b.radius < player.y - (canvas.height/zoom/2) - margin ||
            b.y - b.radius > player.y + (canvas.height/zoom/2) + margin) return;
        
        drawEntity(ctx, {
            x: b.x, y: b.y, radius: b.radius, color: b.color, stage: b.stage, angle: b.angle, level: b.level,
            minions: [], isShielding: false, botStatus: b.status, name: b.name
        });
    });

    // Remote players (from socket) - render with interpolation
    const interpWindow = 200; // ms
    Object.values(remotePlayersRef.current).forEach((rp) => {
        const dt = Math.max(0, now - rp.lastUpdate);
        const t = Math.min(dt / interpWindow, 1);
        const drawX = rp.prevX + (rp.targetX - rp.prevX) * t;
        const drawY = rp.prevY + (rp.targetY - rp.prevY) * t;

        // simple visibility cull similar to bots
        const margin = rp.radius + 100;
        if (drawX + rp.radius < player.x - (canvas.width/zoom/2) - margin ||
            drawX - rp.radius > player.x + (canvas.width/zoom/2) + margin ||
            drawY + rp.radius < player.y - (canvas.height/zoom/2) - margin ||
            drawY - rp.radius > player.y + (canvas.height/zoom/2) + margin) return;

        // draw a circle and name
        ctx.beginPath();
        ctx.arc(drawX, drawY, rp.radius, 0, Math.PI * 2);
        ctx.fillStyle = rp.color;
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(rp.id, drawX, drawY - rp.radius - 6);
    });

    // Player Rendering
    let playerAlpha = 1;
    if (currentEffectiveStage === EvolutionStage.VIRUS_STALKER) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const distToMouse = Math.hypot(mouseRef.current.x - centerX, mouseRef.current.y - centerY);
        const isSlow = distToMouse < 150; 

        if (player.attachedTargetId || isSlow) {
            playerAlpha = 0.25; 
        }
    }
    if (player.stage === EvolutionStage.VIRUS_MIMIC && player.mimicPassive === MimicPassive.INVISIBLE) {
        playerAlpha = 0.4;
    }

    ctx.globalAlpha = playerAlpha;
    drawEntity(ctx, {
        x: player.x, y: player.y, radius: player.radius, color: player.color, stage: currentEffectiveStage, angle: player.angle, level: player.level,
        minions: player.minions, isShielding: player.isShielding, shieldHp: player.shieldHp, isStalkerAttached: !!player.attachedTargetId,
        isMimicOriginal: player.stage === EvolutionStage.VIRUS_MIMIC && !player.disguiseStage,
        isPlayer: true, name: player.name
    });
    ctx.globalAlpha = 1;

    ctx.restore();
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const drawEntity = (ctx: CanvasRenderingContext2D, entity: any) => {
    ctx.save();
    ctx.translate(entity.x, entity.y);
    // Draw Name Above
    if (entity.name) {
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(entity.name, 0, -entity.radius - 15);
        ctx.restore();
    }

    ctx.rotate(entity.angle); 

    // Glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = entity.color;

    const stage = entity.stage;
    const isTankSpike = stage === EvolutionStage.BACTERIA_TANK && entity.isShielding;

    // TANK SPIKE VISUALS
    if (isTankSpike) {
        ctx.beginPath();
        const spikes = 16;
        const outerR = entity.radius + 10;
        const innerR = entity.radius;
        for (let i = 0; i < spikes; i++) {
            const a = (i / spikes) * Math.PI * 2 + (Date.now()/200);
            const x = Math.cos(a) * outerR;
            const y = Math.sin(a) * outerR;
            ctx.lineTo(x, y);
            const a2 = ((i + 0.5) / spikes) * Math.PI * 2 + (Date.now()/200);
            const x2 = Math.cos(a2) * innerR;
            const y2 = Math.sin(a2) * innerR;
            ctx.lineTo(x2, y2);
        }
        ctx.closePath();
        ctx.fillStyle = '#166534'; // Darker green spikes
        ctx.fill();
    }

    // STALKER VISUALS (If attached)
    if (entity.isStalkerAttached) {
        // Draw some tentacles holding on
         ctx.beginPath();
         for(let i=0; i<4; i++) {
             const a = (i/4)*Math.PI*2;
             const tx = Math.cos(a) * (entity.radius + 10);
             const ty = Math.sin(a) * (entity.radius + 10);
             ctx.moveTo(0,0);
             ctx.lineTo(tx, ty);
         }
         ctx.strokeStyle = '#881337'; // Dark red
         ctx.lineWidth = 4;
         ctx.stroke();
    }

    if (stage === EvolutionStage.ATOM) {
        ctx.beginPath();
        ctx.arc(0, 0, entity.radius, 0, Math.PI * 2);
        ctx.fillStyle = entity.color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, entity.radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fill();

    } else if (stage === EvolutionStage.MOLECULE) {
        ctx.beginPath();
        ctx.arc(0, 0, entity.radius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = entity.color;
        ctx.fill();
        
        const satellites = 3;
        const orbitRadius = entity.radius * 0.8;
        const time = Date.now() / 500;
        for(let i=0; i<satellites; i++) {
            const angle = (Math.PI * 2 / satellites) * i + time;
            const sx = Math.cos(angle) * orbitRadius;
            const sy = Math.sin(angle) * orbitRadius;
            
            ctx.beginPath();
            ctx.moveTo(0,0);
            ctx.lineTo(sx, sy);
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(sx, sy, entity.radius * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = '#60a5fa'; 
            ctx.fill();
        }

    } else if (stage.startsWith('Bactéria')) {
        // Flagella / Tail
        ctx.beginPath();
        ctx.moveTo(-entity.radius, 0);
        const wiggle = Math.sin(Date.now()/150) * 15;
        ctx.quadraticCurveTo(-entity.radius * 2, wiggle, -entity.radius * 2.5, 0);
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.strokeStyle = `rgba(${stage === EvolutionStage.BACTERIA_TOXIC ? '147, 51, 234' : '74, 222, 128'}, 0.8)`;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(0, 0, entity.radius * 1.2, entity.radius * 0.8, 0, 0, Math.PI * 2); 
        ctx.fillStyle = entity.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

    } else if (stage.startsWith('Vírus')) { 
        const spikes = 12;
        const outerRadius = entity.radius;
        const innerRadius = entity.radius * 0.7;
        
        ctx.beginPath();
        for (let i = 0; i < spikes; i++) {
            let a = (i / spikes) * Math.PI * 2;
            let x = Math.cos(a) * outerRadius;
            let y = Math.sin(a) * outerRadius;
            ctx.lineTo(x, y);
            
            a = ((i + 0.5) / spikes) * Math.PI * 2;
            x = Math.cos(a) * innerRadius;
            y = Math.sin(a) * innerRadius;
            ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = entity.color;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(0, 0, innerRadius * 0.5, 0, Math.PI * 2);
        
        // Inner Color logic
        let innerColor = '#7f1d1d';
        if (stage === EvolutionStage.VIRUS_STALKER) innerColor = '#881337';
        else if (stage === EvolutionStage.VIRUS_MIMIC) innerColor = '#0891b2'; 
        else if (stage === EvolutionStage.VIRUS_ZOMBIE) innerColor = '#365314'; 

        ctx.fillStyle = innerColor;
        ctx.fill();

        // Special visual for Undisguised Mimic
        if (entity.isMimicOriginal) {
             ctx.beginPath();
             ctx.arc(0,0, innerRadius * 0.3, 0, Math.PI*2);
             ctx.fillStyle = '#fff';
             ctx.fill();
             ctx.font = 'bold 20px Fredoka';
             ctx.fillStyle = '#000';
             ctx.fillText('?', 0, 1);
        }

        if (stage === EvolutionStage.VIRUS_ZOMBIE) {
             ctx.beginPath();
             ctx.moveTo(0, -innerRadius*0.5);
             ctx.lineTo(0, innerRadius*0.5);
             ctx.moveTo(-innerRadius*0.5, 0);
             ctx.lineTo(innerRadius*0.5, 0);
             ctx.lineWidth = 3;
             ctx.strokeStyle = '#a3e635';
             ctx.stroke();
        }
    }

    if (!entity.isPlayer) {
        if (entity.botStatus === BotStatus.SICK) {
             ctx.beginPath();
             ctx.arc(0, 0, entity.radius + 10, 0, Math.PI * 2);
             ctx.strokeStyle = `rgba(132, 204, 22, ${0.5 + Math.sin(Date.now()/200)*0.5})`;
             ctx.lineWidth = 4;
             ctx.stroke();
        } else if (entity.botStatus === BotStatus.ZOMBIE) {
             ctx.fillStyle = '#ef4444';
             ctx.beginPath();
             ctx.arc(-entity.radius*0.3, -entity.radius*0.2, entity.radius*0.15, 0, Math.PI*2);
             ctx.arc(entity.radius*0.3, -entity.radius*0.2, entity.radius*0.15, 0, Math.PI*2);
             ctx.fill();
        }
    }

    // Un-rotate for text to be readable
    ctx.rotate(-entity.angle);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Lvl ${entity.level}`, 0, 0);

    ctx.restore();
    
    // --- DRAW MINIONS ---
    if (entity.minions && entity.minions.length > 0) {
        ctx.save();
        ctx.translate(entity.x, entity.y);
        ctx.rotate(entity.angle); 

        entity.minions.forEach((m: Minion) => {
            const relAngle = m.angle - entity.angle;
            const mx = Math.cos(relAngle) * m.distance;
            const my = Math.sin(relAngle) * m.distance;

            // Draw Tank Spikes on Minions
            if (isTankSpike) {
                ctx.save();
                ctx.translate(mx, my);
                ctx.beginPath();
                const spikes = 8;
                const outerR = m.radius + 6;
                const innerR = m.radius;
                for (let i = 0; i < spikes; i++) {
                    const a = (i / spikes) * Math.PI * 2 + (Date.now()/200);
                    const x = Math.cos(a) * outerR;
                    const y = Math.sin(a) * outerR;
                    ctx.lineTo(x, y);
                    const a2 = ((i + 0.5) / spikes) * Math.PI * 2 + (Date.now()/200);
                    const x2 = Math.cos(a2) * innerR;
                    const y2 = Math.sin(a2) * innerR;
                    ctx.lineTo(x2, y2);
                }
                ctx.closePath();
                ctx.fillStyle = '#166534';
                ctx.fill();
                ctx.restore();
            }

            // Draw Minion
            ctx.beginPath();
            ctx.arc(mx, my, m.radius, 0, Math.PI * 2);
            
            if (stage === EvolutionStage.BACTERIA_TOXIC) ctx.fillStyle = '#d8b4fe'; 
            else if (stage === EvolutionStage.BACTERIA_COLONIZER) ctx.fillStyle = '#fde047';
            else if (stage === EvolutionStage.BACTERIA_TANK) ctx.fillStyle = '#4ade80';
            else ctx.fillStyle = '#86efac';
            
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Shield connection
            if (entity.isShielding) {
                 ctx.beginPath();
                 ctx.moveTo(0,0);
                 ctx.lineTo(mx, my);
                 ctx.strokeStyle = isTankSpike ? 'rgba(255, 255, 255, 0.6)' : `rgba(255, 255, 255, 0.3)`;
                 ctx.lineWidth = isTankSpike ? 3 : 2;
                 ctx.stroke();
                 
                 if (!isTankSpike) {
                    ctx.beginPath();
                    ctx.arc(mx, my, m.radius + 4, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.stroke();
                 }
            }
        });
        ctx.restore();
    }
  };

  const createNewFood = (): Food => {
      return {
          id: Math.random().toString(),
          x: Math.random() * MAP_SIZE,
          y: Math.random() * MAP_SIZE,
          radius: 4 + Math.random() * 4,
          color: COLORS.food[Math.floor(Math.random() * COLORS.food.length)],
          xpValue: 5 + Math.floor(Math.random() * 5)
      };
  }

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [phase]);

  return (
    <canvas
      ref={canvasRef}
      className="block bg-slate-900 touch-none cursor-crosshair"
    />
  );
};

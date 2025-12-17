
import React, { useState, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { MainMenu } from './components/MainMenu';
import { GameHUD } from './components/GameHUD';
import { EvolutionChoice } from './components/EvolutionChoice';
import { GamePhase, Player, EvolutionStage, MimicPassive, Bot, Food, Carbohydrate } from './types';
import { MAP_SIZE, COLORS, getRadiusForLevel, getSpeedForSize, BASE_XP_REQ } from './constants';

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.MENU);
  
  // Hoist Refs here so we can pass data to HUD without massive re-renders
  const botsRef = useRef<Bot[]>([]);
  const foodsRef = useRef<Food[]>([]);
  const carbohydratesRef = useRef<Carbohydrate[]>([]);

  const playerRef = useRef<Player>({
    name: 'Você',
    x: MAP_SIZE / 2,
    y: MAP_SIZE / 2,
    radius: getRadiusForLevel(1),
    speed: getSpeedForSize(getRadiusForLevel(1)),
    level: 1,
    xp: 0,
    maxXp: BASE_XP_REQ,
    stage: EvolutionStage.ATOM,
    score: 0,
    color: COLORS.atom,
    angle: 0,
    abilityCooldown: 0,
    abilityActiveUntil: 0,
    isShielding: false,
    shieldHp: 0,
    minions: [],
    lastHitTankedAt: 0,
    lastResinDroppedAt: 0,
    attachedTargetId: null,
    attachedAt: 0,
    disguiseStage: null,
    mimicPassive: MimicPassive.NONE,
    lastPassiveSwitch: 0
  });

  const [, setTick] = useState(0);

  const startGame = (nickname: string) => {
    playerRef.current = {
      name: nickname,
      x: MAP_SIZE / 2,
      y: MAP_SIZE / 2,
      radius: getRadiusForLevel(1),
      speed: getSpeedForSize(getRadiusForLevel(1)),
      level: 1,
      xp: 0,
      maxXp: BASE_XP_REQ,
      stage: EvolutionStage.ATOM,
      score: 0,
      color: COLORS.atom,
      angle: 0,
      abilityCooldown: 0,
      abilityActiveUntil: 0,
      isShielding: false,
      shieldHp: 0,
      minions: [],
      lastHitTankedAt: 0,
      lastResinDroppedAt: 0,
      attachedTargetId: null,
      attachedAt: 0,
      disguiseStage: null,
      mimicPassive: MimicPassive.NONE,
      lastPassiveSwitch: 0
    };
    // Clear old state
    botsRef.current = [];
    foodsRef.current = [];
    carbohydratesRef.current = [];
    setPhase(GamePhase.PLAYING);
  };

  const handleEvolutionChoice = (choice: EvolutionStage) => {
    playerRef.current.stage = choice;
    
    // Set colors
    if (choice === EvolutionStage.BACTERIA) playerRef.current.color = COLORS.bacteria;
    else if (choice === EvolutionStage.VIRUS) playerRef.current.color = COLORS.virus;
    else if (choice === EvolutionStage.BACTERIA_TANK) playerRef.current.color = COLORS.bacteriaTank;
    else if (choice === EvolutionStage.BACTERIA_COLONIZER) playerRef.current.color = COLORS.bacteriaColonizer;
    else if (choice === EvolutionStage.BACTERIA_TOXIC) playerRef.current.color = COLORS.bacteriaToxic;
    else if (choice === EvolutionStage.VIRUS_STALKER) playerRef.current.color = COLORS.virusStalker;
    else if (choice === EvolutionStage.VIRUS_MIMIC) {
        playerRef.current.color = COLORS.virusMimic;
        playerRef.current.lastPassiveSwitch = Date.now();
        playerRef.current.mimicPassive = MimicPassive.MAGNET; 
    }
    else if (choice === EvolutionStage.VIRUS_ZOMBIE) playerRef.current.color = COLORS.virusZombie;

    playerRef.current.radius *= 1.2; 
    setPhase(GamePhase.PLAYING);
  };

  const handleDebugLevelChange = (level: number) => {
      if (isNaN(level) || level < 1) return;
      playerRef.current.level = level;
      playerRef.current.radius = getRadiusForLevel(level);
      
      // Auto-evolve for testing
      if (level >= 20) {
          playerRef.current.stage = EvolutionStage.VIRUS_ZOMBIE; 
          playerRef.current.color = COLORS.virusZombie;
      } else if (level >= 15) {
          playerRef.current.stage = EvolutionStage.VIRUS;
          playerRef.current.color = COLORS.virus;
      } else if (level >= 10) {
          playerRef.current.stage = EvolutionStage.MOLECULE;
          playerRef.current.color = COLORS.molecule;
      } else {
          playerRef.current.stage = EvolutionStage.ATOM;
          playerRef.current.color = COLORS.atom;
      }
      setTick(t => t + 1);
  };

  const forceUpdate = () => {
    setTick(t => t + 1);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900">
      
      <GameCanvas 
        phase={phase} 
        setPhase={setPhase} 
        playerRef={playerRef} 
        botsRef={botsRef}
        foodsRef={foodsRef}
        carbohydratesRef={carbohydratesRef}
        onUpdate={forceUpdate} 
      />

      {phase === GamePhase.MENU && (
        <MainMenu onStart={startGame} />
      )}

      {phase === GamePhase.PLAYING && (
        <GameHUD 
          player={playerRef.current} 
          bots={botsRef.current}
          onDebugLevelChange={handleDebugLevelChange} 
        />
      )}

      {phase === GamePhase.EVOLUTION_CHOICE && (
        <EvolutionChoice 
          currentLevel={playerRef.current.level} 
          currentStage={playerRef.current.stage}
          onChoose={handleEvolutionChoice} 
        />
      )}

    </div>
  );
};

export default App;

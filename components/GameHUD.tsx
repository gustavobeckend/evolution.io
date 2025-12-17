
import React from 'react';
import { Player, EvolutionStage, Bot } from '../types';
import { Activity, Shield, Crosshair, Zap, Droplets, Ghost, Dna, Biohazard, Trophy, Map as MapIcon } from 'lucide-react';
import { SHIELD_COOLDOWN_MS, COLONIZER_COOLDOWN_MS, TOXIC_COOLDOWN_MS, STALKER_COOLDOWN_MS, MIMIC_COOLDOWN_MS, MIMIC_PASSIVE_INTERVAL_MS, ZOMBIE_COOLDOWN_MS, MAP_SIZE } from '../constants';

interface GameHUDProps {
  player: Player;
  bots: Bot[];
  onDebugLevelChange: (level: number) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({ player, bots, onDebugLevelChange }) => {
  const xpPercentage = (player.xp / player.maxXp) * 100;

  const now = Date.now();
  let cooldownPct = 0;
  let onCooldown = false;
  
  if (player.abilityCooldown > now) {
    onCooldown = true;
    let totalDuration = 1000;
    
    // Check DISGUISE first
    const effectiveStage = player.disguiseStage || player.stage;

    if (effectiveStage === EvolutionStage.BACTERIA || effectiveStage === EvolutionStage.BACTERIA_TANK) totalDuration = SHIELD_COOLDOWN_MS;
    else if (effectiveStage === EvolutionStage.BACTERIA_COLONIZER) totalDuration = COLONIZER_COOLDOWN_MS;
    else if (effectiveStage === EvolutionStage.BACTERIA_TOXIC) totalDuration = TOXIC_COOLDOWN_MS;
    else if (effectiveStage === EvolutionStage.VIRUS_STALKER) totalDuration = STALKER_COOLDOWN_MS;
    else if (effectiveStage === EvolutionStage.VIRUS_MIMIC) totalDuration = MIMIC_COOLDOWN_MS;
    else if (effectiveStage === EvolutionStage.VIRUS_ZOMBIE) totalDuration = ZOMBIE_COOLDOWN_MS;
    
    const remaining = player.abilityCooldown - now;
    cooldownPct = (remaining / totalDuration) * 100;
  }

  const getAbilityIcon = () => {
    const effectiveStage = player.disguiseStage || player.stage;
    switch (effectiveStage) {
        case EvolutionStage.MOLECULE: return <Zap size={16} className="text-yellow-400" />;
        case EvolutionStage.BACTERIA: return <Shield size={16} className="text-blue-400" />;
        case EvolutionStage.BACTERIA_TANK: return <Shield size={16} className="text-emerald-400" />;
        case EvolutionStage.BACTERIA_COLONIZER: return <Zap size={16} className="text-yellow-400" />;
        case EvolutionStage.BACTERIA_TOXIC: return <Droplets size={16} className="text-purple-400" />;
        case EvolutionStage.VIRUS: return <Crosshair size={16} className="text-red-400" />;
        case EvolutionStage.VIRUS_STALKER: return <Ghost size={16} className="text-pink-400" />;
        case EvolutionStage.VIRUS_MIMIC: return <Dna size={16} className="text-cyan-400" />;
        case EvolutionStage.VIRUS_ZOMBIE: return <Biohazard size={16} className="text-lime-400" />;
        default: return null;
    }
  };

  const getAbilityName = () => {
     const effectiveStage = player.disguiseStage || player.stage;
     switch (effectiveStage) {
        case EvolutionStage.MOLECULE: return "Arremessar";
        case EvolutionStage.BACTERIA: return "Escudo Colonial";
        case EvolutionStage.BACTERIA_TANK: return "Armadura de Espinhos";
        case EvolutionStage.BACTERIA_COLONIZER: return "Caçada Expansiva";
        case EvolutionStage.BACTERIA_TOXIC: return "Névoa Tóxica";
        case EvolutionStage.VIRUS: return "Agulha Viral";
        case EvolutionStage.VIRUS_STALKER: return "Hospedar Parasita";
        case EvolutionStage.VIRUS_MIMIC: return "Copiar Inimigo";
        case EvolutionStage.VIRUS_ZOMBIE: return "Infecção Viral";
        default: return "";
    }
  };

  // Mimic Passive Timer
  let passiveTimerPct = 0;
  if (player.stage === EvolutionStage.VIRUS_MIMIC) {
      const elapsed = now - player.lastPassiveSwitch;
      passiveTimerPct = (elapsed / MIMIC_PASSIVE_INTERVAL_MS) * 100;
  }

  // LEADERBOARD CALCULATION
  const leaderboard = [
      { name: player.name, score: player.score, isMe: true },
      ...bots.map(b => ({ name: b.name, score: b.score, isMe: false }))
  ].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      
      {/* TOP RIGHT: LEADERBOARD */}
      <div className="absolute top-4 right-4 bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-lg p-3 text-white min-w-[200px] shadow-lg pointer-events-auto">
          <h3 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2 border-b border-slate-700/50 pb-1">
              <Trophy size={14} className="text-yellow-400" /> Leaderboard
          </h3>
          <ul className="space-y-1">
              {leaderboard.map((entry, idx) => (
                  <li key={idx} className={`flex justify-between text-xs ${entry.isMe ? 'text-yellow-400 font-bold' : 'text-slate-300'}`}>
                      <span>{idx + 1}. {entry.name}</span>
                      <span>{Math.floor(entry.score)}</span>
                  </li>
              ))}
          </ul>
      </div>

      {/* TOP LEFT: MINIMAP */}
      <div className="absolute top-4 left-4 pointer-events-auto opacity-70 hover:opacity-100 transition-opacity">
           <div className="w-32 h-32 bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-lg relative overflow-hidden shadow-lg">
                {/* Grid Lines for reference */}
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                    <div className="border-r border-b border-slate-700/20"></div>
                    <div className="border-b border-slate-700/20"></div>
                    <div className="border-r border-slate-700/20"></div>
                    <div></div>
                </div>
                
                {/* Player Dot */}
                <div 
                    className="absolute w-2 h-2 bg-green-400 rounded-full border border-white shadow-[0_0_8px_rgba(74,222,128,0.8)] transform -translate-x-1/2 -translate-y-1/2 z-10"
                    style={{ 
                        left: `${(player.x / MAP_SIZE) * 100}%`, 
                        top: `${(player.y / MAP_SIZE) * 100}%` 
                    }} 
                />
                
                {/* Gate Indicators */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3 bg-purple-500/80"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-3 bg-purple-500/80"></div>

                <div className="absolute bottom-1 right-1 text-[8px] text-slate-500 flex items-center gap-1">
                    <MapIcon size={8}/> MAPA
                </div>
           </div>
      </div>

      {/* BOTTOM LEFT: PLAYER STATS (Transparent & Smaller) */}
      <div className="absolute bottom-4 left-4 pointer-events-auto">
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3 text-white min-w-[240px] shadow-lg transform scale-90 origin-bottom-left hover:scale-100 transition-transform duration-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Lvl {player.level}</span>
            <h2 className="text-sm font-bold flex items-center gap-2">
                {player.disguiseStage ? (
                    <span className="flex items-center gap-1 text-cyan-400">
                        <Dna size={12}/> {player.disguiseStage}
                    </span>
                ) : (
                    player.stage
                )}
            </h2>
          </div>

          <div className="space-y-2">
            {/* XP Bar */}
            <div>
                <div className="h-2 bg-slate-800/60 rounded-full overflow-hidden border border-slate-700/50">
                <div 
                    className="h-full bg-gradient-to-r from-blue-500/80 to-green-400/80 transition-all duration-300 ease-out"
                    style={{ width: `${xpPercentage}%` }}
                ></div>
                </div>
            </div>

            {/* Ability Cooldown Bar (Only if specialized) */}
            {player.stage !== EvolutionStage.ATOM && (
                 <div className="pt-1 border-t border-slate-700/30 mt-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-300 mb-0.5">
                        <span className="flex items-center gap-1 font-bold text-yellow-500/90">
                            {getAbilityIcon()}
                            {getAbilityName()}
                        </span>
                        {onCooldown ? <span className="text-red-400">...</span> : <span className="text-green-400">READY</span>}
                    </div>
                    <div className="h-1 bg-slate-800/60 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-100 ease-linear ${onCooldown ? 'bg-red-500/80' : 'bg-yellow-400/80'}`}
                            style={{ width: onCooldown ? `${100 - cooldownPct}%` : '100%' }}
                        ></div>
                    </div>
                 </div>
            )}
            
            {/* Passive Indicators */}
            {player.stage === EvolutionStage.BACTERIA_TANK && (
                <div className="text-[10px] text-emerald-400/80 mt-1">
                    Bloqueio: {Date.now() - player.lastHitTankedAt > 120000 ? 'Pronto' : 'Recarregando'}
                </div>
            )}
             {player.stage === EvolutionStage.VIRUS_STALKER && player.attachedTargetId && (
                <div className="text-[10px] text-pink-400/80 mt-1 flex items-center gap-1 animate-pulse">
                    <Ghost size={10} /> Drenando XP
                </div>
            )}
            
            {/* MIMIC HUD SECTION */}
            {player.stage === EvolutionStage.VIRUS_MIMIC && (
                <div className="mt-1 pt-1 border-t border-slate-700/30">
                     <div className="text-[10px] text-cyan-300/80 font-bold mb-0.5 flex items-center gap-1">
                         <Dna size={10}/> {player.mimicPassive}
                     </div>
                     <div className="h-0.5 bg-slate-800/50 rounded-full overflow-hidden mb-1">
                        <div className="h-full bg-cyan-600/80 transition-all duration-1000 linear" style={{ width: `${100 - passiveTimerPct}%`}}></div>
                     </div>
                     {player.disguiseStage && (
                         <div className="text-[9px] text-yellow-400/90 animate-pulse text-center">
                             [X] Reverter
                         </div>
                     )}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

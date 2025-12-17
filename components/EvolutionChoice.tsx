
import React from 'react';
import { Bug, Skull, Shield, Zap, Droplets, Ghost, Dna, Biohazard } from 'lucide-react';
import { EvolutionStage } from '../types';

interface EvolutionChoiceProps {
  currentLevel: number;
  currentStage: EvolutionStage;
  onChoose: (choice: EvolutionStage) => void;
}

export const EvolutionChoice: React.FC<EvolutionChoiceProps> = ({ currentLevel, currentStage, onChoose }) => {
  
  // Level 15 Choice: Virus vs Bacteria
  if (currentLevel === 15) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 z-50 backdrop-blur-sm">
        <div className="max-w-4xl w-full p-8 text-center animate-fade-in-up">
          <h2 className="text-4xl font-bold text-white mb-2">Ponto de Mutação Atingido!</h2>
          <p className="text-slate-300 text-xl mb-12">Seu código genético está instável. Escolha seu caminho.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bacteria Choice */}
            <button
              onClick={() => onChoose(EvolutionStage.BACTERIA)}
              className="group relative bg-slate-800 hover:bg-green-900/30 border-2 border-slate-700 hover:border-green-500 rounded-3xl p-8 transition-all duration-300 hover:scale-105"
            >
              <div className="absolute top-4 right-4 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase">
                Sobrevivência
              </div>
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <Bug size={64} className="text-green-400" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-green-400">Bactéria</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Organismo complexo. Minions orbitais, escudos e crescimento constante.
              </p>
            </button>

            {/* Virus Choice */}
            <button
               onClick={() => onChoose(EvolutionStage.VIRUS)}
               className="group relative bg-slate-800 hover:bg-red-900/30 border-2 border-slate-700 hover:border-red-500 rounded-3xl p-8 transition-all duration-300 hover:scale-105"
            >
              <div className="absolute top-4 right-4 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold uppercase">
                Dominação
              </div>
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 rounded-full bg-red-500/20 flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
                  <Skull size={64} className="text-red-400" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-red-400">Vírus</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Agente infeccioso. Atrai comida, dispara espinhos e drena inimigos.
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Determine path based on current stage
  const isBacteriaPath = currentStage === EvolutionStage.BACTERIA || currentStage.startsWith('Bactéria');
  const isVirusPath = currentStage === EvolutionStage.VIRUS || currentStage.startsWith('Vírus');

  // Level 20 Choice
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 z-50 backdrop-blur-sm">
      <div className="max-w-7xl w-full p-6 text-center animate-fade-in-up">
        <h2 className="text-4xl font-bold text-white mb-2">Evolução Suprema!</h2>
        <p className="text-slate-300 text-xl mb-8">
          {isBacteriaPath ? 'Especialize sua colônia bacteriana.' : 'Escolha a forma final do vírus.'}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          {/* BACTERIA PATH OPTIONS */}
          {isBacteriaPath && (
            <>
              {/* Tank */}
              <button
                onClick={() => onChoose(EvolutionStage.BACTERIA_TANK)}
                className="group relative bg-slate-800 hover:bg-emerald-900/30 border-2 border-slate-700 hover:border-emerald-500 rounded-2xl p-6 transition-all duration-300 hover:scale-105"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Shield size={40} className="text-emerald-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Bactéria Tank</h3>
                <p className="text-emerald-400 text-xs uppercase font-bold mb-3">Defesa & Resistência</p>
                <ul className="text-left text-sm text-slate-300 space-y-2">
                  <li className="flex gap-2"><span className="text-emerald-500">•</span> Passiva: Filhas ganham espinhos.</li>
                  <li className="flex gap-2"><span className="text-emerald-500">•</span> Ativa: Reflete dano de contato.</li>
                  <li className="flex gap-2"><span className="text-emerald-500">•</span> Bonus: Ignora 1 hit a cada 2min.</li>
                </ul>
              </button>

              {/* Colonizer */}
              <button
                onClick={() => onChoose(EvolutionStage.BACTERIA_COLONIZER)}
                className="group relative bg-slate-800 hover:bg-yellow-900/30 border-2 border-slate-700 hover:border-yellow-500 rounded-2xl p-6 transition-all duration-300 hover:scale-105"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Zap size={40} className="text-yellow-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Colonizadora</h3>
                <p className="text-yellow-400 text-xs uppercase font-bold mb-3">Expansão & Coleta</p>
                <ul className="text-left text-sm text-slate-300 space-y-2">
                  <li className="flex gap-2"><span className="text-yellow-500">•</span> Passiva: Filhas coletam comida auto.</li>
                  <li className="flex gap-2"><span className="text-yellow-500">•</span> Ativa: Filhas caçam bots menores.</li>
                </ul>
              </button>

              {/* Toxic */}
              <button
                onClick={() => onChoose(EvolutionStage.BACTERIA_TOXIC)}
                className="group relative bg-slate-800 hover:bg-purple-900/30 border-2 border-slate-700 hover:border-purple-500 rounded-2xl p-6 transition-all duration-300 hover:scale-105"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Droplets size={40} className="text-purple-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Bactéria Tóxica</h3>
                <p className="text-purple-400 text-xs uppercase font-bold mb-3">Área & Controle</p>
                <ul className="text-left text-sm text-slate-300 space-y-2">
                  <li className="flex gap-2"><span className="text-purple-500">•</span> Passiva: Deixa rastro de veneno.</li>
                  <li className="flex gap-2"><span className="text-purple-500">•</span> Ativa: Aura corrosiva em área.</li>
                </ul>
              </button>
            </>
          )}

          {/* VIRUS PATH OPTIONS */}
          {isVirusPath && (
            <>
              {/* Stalker Virus */}
              <button
                onClick={() => onChoose(EvolutionStage.VIRUS_STALKER)}
                className="group relative bg-slate-800 hover:bg-pink-900/30 border-2 border-slate-700 hover:border-pink-500 rounded-2xl p-6 transition-all duration-300 hover:scale-105"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <Ghost size={40} className="text-pink-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Vírus Stalker</h3>
                <p className="text-pink-400 text-xs uppercase font-bold mb-3">Furtividade & Dreno</p>
                <ul className="text-left text-sm text-slate-300 space-y-2">
                  <li className="flex gap-2"><span className="text-pink-500">•</span> Passiva: Invisível quando parado/lento.</li>
                  <li className="flex gap-2"><span className="text-pink-500">•</span> Ativa: Hospeda em inimigos e drena XP.</li>
                </ul>
              </button>

              {/* Mimic Virus */}
              <button
                onClick={() => onChoose(EvolutionStage.VIRUS_MIMIC)}
                className="group relative bg-slate-800 hover:bg-cyan-900/30 border-2 border-slate-700 hover:border-cyan-500 rounded-2xl p-6 transition-all duration-300 hover:scale-105"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Dna size={40} className="text-cyan-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Vírus da Cópia</h3>
                <p className="text-cyan-400 text-xs uppercase font-bold mb-3">Mimetismo & Versatilidade</p>
                <ul className="text-left text-sm text-slate-300 space-y-2">
                  <li className="flex gap-2"><span className="text-cyan-500">•</span> Passiva: Ganha hab. aleatórias (Veneno, etc).</li>
                  <li className="flex gap-2"><span className="text-cyan-500">•</span> Ativa: Rouba a forma de inimigos.</li>
                </ul>
              </button>
              
              {/* Zombie Virus */}
              <button
                onClick={() => onChoose(EvolutionStage.VIRUS_ZOMBIE)}
                className="group relative bg-slate-800 hover:bg-lime-900/30 border-2 border-slate-700 hover:border-lime-500 rounded-2xl p-6 transition-all duration-300 hover:scale-105"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-lime-500/20 flex items-center justify-center">
                    <Biohazard size={40} className="text-lime-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Vírus Zumbi</h3>
                <p className="text-lime-400 text-xs uppercase font-bold mb-3">Horda & Velocidade</p>
                <ul className="text-left text-sm text-slate-300 space-y-2">
                  <li className="flex gap-2"><span className="text-lime-500">•</span> Passiva: Frenesi (Velocidade 2x).</li>
                  <li className="flex gap-2"><span className="text-lime-500">•</span> Ativa: Infecta e cria servos Zumbis.</li>
                </ul>
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

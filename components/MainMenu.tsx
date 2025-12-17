
import React, { useState } from 'react';
import { Play, Atom } from 'lucide-react';

interface MainMenuProps {
  onStart: (nickname: string) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStart }) => {
  const [nickname, setNickname] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(nickname.trim() || 'Célula Desconhecida');
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 z-50 text-white">
      <div className="max-w-md w-full p-8 bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 text-center relative overflow-hidden">
        
        {/* Decorative background elements */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="bg-slate-700 p-4 rounded-full ring-4 ring-blue-500/30">
              <Atom size={64} className="text-blue-400 animate-spin-slow" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            BioEvolve.io
          </h1>
          <p className="text-slate-400 mb-8 text-lg">
            Coma, cresça e evolua para dominar o microcosmo.
          </p>

          <form onSubmit={handleSubmit} className="mb-6">
             <div className="mb-6">
               <label className="block text-slate-300 text-sm font-bold mb-2 text-left" htmlFor="nickname">
                 Nome do Organismo
               </label>
               <input
                 id="nickname"
                 type="text"
                 maxLength={15}
                 placeholder="Digite seu nick..."
                 value={nickname}
                 onChange={(e) => setNickname(e.target.value)}
                 className="w-full bg-slate-700 text-white border-2 border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-center font-bold text-lg placeholder-slate-500"
                 autoFocus
               />
             </div>

             <button
                type="submit"
                className="w-full group bg-blue-600 hover:bg-blue-500 transition-all duration-300 py-4 px-6 rounded-xl font-bold text-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!nickname.trim()}
              >
                <Play className="fill-current" />
                COMEÇAR EVOLUÇÃO
              </button>
          </form>

          <div className="space-y-4 mb-4 text-left bg-slate-700/50 p-4 rounded-xl">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Jornada Evolutiva:</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">1</span>
                <span>Partícula Atômica (Início)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs">10</span>
                <span>Molécula Estável</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-xs">15</span>
                <span>Escolha: <span className="text-green-400">Bactéria</span> ou <span className="text-red-400">Vírus</span></span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

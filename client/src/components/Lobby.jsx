import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { 
  Users, 
  Sparkles, 
  Play, 
  Dices, 
  ShieldCheck, 
  Layers, 
  Clock, 
  Paintbrush, 
  ExternalLink,
  Crown,
  Info
} from "lucide-react";
import { TeamSidebar } from "./TeamSidebar";

const FUN_NAMES = [
  "PixelPainter", "DoodleKing", "SketchFox", "NeonViper", "InkMaster",
  "WordWizard", "SpeedyBrush", "ChalkTitan", "ArtVoyager", "QuickDraw"
];

export const Lobby = () => {
  const {
    roomData,
    roomId,
    joinRoom,
    isHost,
    startGame,
  } = useGame();

  const [inputRoom, setInputRoom] = useState(roomId || "WORDY1");
  const [inputName, setInputName] = useState("");

  const handleRandomize = () => {
    const randomName = FUN_NAMES[Math.floor(Math.random() * FUN_NAMES.length)];
    setInputName(randomName);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!inputRoom.trim()) return;
    const finalName = inputName.trim() || `Player${Math.floor(Math.random() * 900 + 100)}`;
    joinRoom(inputRoom, finalName);
  };

  const openSecondTab = () => {
    const targetRoom = roomData ? roomData.roomId : inputRoom;
    const url = `${window.location.origin}?room=${targetRoom}`;
    window.open(url, "_blank", "width=800,height=750");
  };

  const totalPlayers = (roomData?.teams.teamA.length || 0) + (roomData?.teams.teamB.length || 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
      
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-time Multiplayer Drawing Game</span>
        </div>
        <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl tracking-tight text-white">
          Welcome to <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-rose-400 bg-clip-text text-transparent">Wordy</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          Team A vs Team B. 10 fast-paced rounds of cross-team word submission, rapid whiteboard sketching, and letter-by-letter deduction.
        </p>
      </div>

      {/* Main Interactive Lobby Section */}
      {!roomData ? (
        /* Join / Create Form */
        <div className="max-w-md mx-auto w-full glass-panel-elevated rounded-3xl p-6 md:p-8 border-slate-700 shadow-2xl">
          <h2 className="font-display font-bold text-xl text-white mb-5 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Join or Create Room</span>
          </h2>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Room Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputRoom}
                  onChange={(e) => setInputRoom(e.target.value.toUpperCase())}
                  placeholder="e.g. ROOM123"
                  maxLength={10}
                  required
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-white uppercase placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setInputRoom(`ROOM${Math.floor(Math.random() * 900 + 100)}`)}
                  title="Generate Random Room"
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  <Dices className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Display Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="Pick a nickname"
                  maxLength={16}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleRandomize}
                  title="Randomize Name"
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  <Dices className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-indigo-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>Enter Room</span>
              <Play className="w-4 h-4 fill-white" />
            </button>
          </form>

          {/* Quick 2-player testing note */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Testing locally? You can open another browser tab or incognito window to join the same room.
            </p>
          </div>
        </div>
      ) : (
        /* Joined Room Lobby Waiting Area */
        <div className="glass-panel-elevated rounded-3xl p-6 md:p-8 border-slate-700 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">
                  Room Lobby
                </span>
                <span className="text-xs font-mono font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-white">
                  {roomData.roomId}
                </span>
              </div>
              <h2 className="font-display font-extrabold text-2xl text-white mt-1">
                Waiting for Players to Ready Up
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                The server auto-balances new joiners into Team A and Team B.
              </p>
            </div>

            {/* Host Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Test Helper button */}
              <button
                onClick={openSecondTab}
                title="Launch a 2nd player window to test multiplayer locally"
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all active:scale-95 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                <span>Open 2nd Player Window</span>
              </button>

              {isHost ? (
                <button
                  onClick={startGame}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all active:scale-95 animate-pulse"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Game Now</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Waiting for Host to start</span>
                </div>
              )}
            </div>
          </div>

          {/* Roster & Balance Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <TeamSidebar />
            
            {/* Quick How to Play Summary */}
            <div className="glass-panel rounded-2xl p-5 border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-white mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-400" />
                  <span>How This Match Works</span>
                </h3>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span><strong>10 Rounds Total:</strong> Team A and Team B alternate between providing words and drawing clues.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span><strong>Secret Reveal:</strong> Word Provider picks a word, which is revealed strictly to the opposing Drawer for 10 seconds.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span><strong>Live Guessing:</strong> Teammates guess in chat. Correct letter guesses uncover blanks (e.g. <code>_ _ _ E</code>) for all teammates!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
                    <span><strong>Scoring:</strong> Guess within 60s for +1 point, or opposing team scores +1 point if time expires!</span>
                  </li>
                </ul>
              </div>

              {totalPlayers < 2 && (
                <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <Crown className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Tip: Click "Open 2nd Player Window" above to test multiplayer across two windows right now!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rules & Mechanics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 select-none">
        
        <div className="glass-panel rounded-2xl p-4 border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-3">
            <Layers className="w-4 h-4" />
          </div>
          <h4 className="font-display font-bold text-sm text-white mb-1">
            Phase 1: Word Submit
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Active team provider submits any English word within 10 seconds.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3">
            <Clock className="w-4 h-4" />
          </div>
          <h4 className="font-display font-bold text-sm text-white mb-1">
            Phase 2: Secret Reveal
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Word is shown exclusively to the opposing drawer for 10s to prepare.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-3">
            <Paintbrush className="w-4 h-4" />
          </div>
          <h4 className="font-display font-bold text-sm text-white mb-1">
            Phase 3: Draw & Guess
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Drawer illustrates clues on the whiteboard while teammates guess in 60s.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="font-display font-bold text-sm text-white mb-1">
            Phase 4: Round Scoring
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            1 pt for drawing team on correct guess; 1 pt for opponents if time expires!
          </p>
        </div>

      </div>

    </div>
  );
};

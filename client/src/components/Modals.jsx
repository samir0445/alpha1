import React, { useState, useEffect } from "react";
import { useGame } from "../context/GameContext";
import { 
  PenTool, 
  Eye, 
  Trophy, 
  Clock, 
  Sparkles, 
  RotateCcw,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import confetti from "canvas-confetti";

export const Modals = () => {
  const {
    roomData,
    isWordProvider,
    isDrawer,
    secretWordToDraw,
    wordPromptData,
    submitSecretWord,
    roundResultModal,
    setRoundResultModal,
    timer,
    isHost,
    resetGame,
    startGame,
  } = useGame();

  const [customWord, setCustomWord] = useState("");

  const status = roomData?.status;

  // Auto trigger celebratory confetti on GAME_OVER
  useEffect(() => {
    if (status === "GAME_OVER") {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
      });
    }
  }, [status]);

  // Handle word submit
  const handleWordSubmit = (word) => {
    const chosen = word || customWord;
    if (!chosen.trim()) return;
    submitSecretWord(chosen);
    setCustomWord("");
  };

  return (
    <>
      {/* 1. Phase 1: Word Submission Modal (Exclusively for Word Provider) */}
      {status === "WORD_INPUT" && isWordProvider && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md glass-panel-elevated rounded-3xl p-6 border-indigo-500/30 shadow-2xl animate-scale-up">
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <PenTool className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-black text-xl text-white">
                  Provide Secret Word
                </h3>
                <p className="text-xs text-slate-400">
                  You are the Word Provider! Opposing drawer will illustrate this.
                </p>
              </div>
            </div>

            {/* Timer Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-5">
              <div
                className="bg-indigo-500 h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${Math.min(100, (timer / 10) * 100)}%` }}
              />
            </div>

            {/* Quick Suggestions Chips */}
            {wordPromptData?.suggestions && (
              <div className="mb-4">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Quick Pick Suggestions:
                </label>
                <div className="flex flex-wrap gap-2">
                  {wordPromptData.suggestions.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => handleWordSubmit(w)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-400 text-xs font-mono font-bold text-slate-200 hover:text-white transition-all active:scale-95 shadow-sm"
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Word Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleWordSubmit(customWord);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Or Type Any English Word:
                </label>
                <input
                  type="text"
                  autoFocus
                  value={customWord}
                  onChange={(e) => setCustomWord(e.target.value.toUpperCase())}
                  placeholder="e.g. SUBMARINE, PIZZA, SUNFLOWER"
                  maxLength={16}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-white uppercase placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Time remaining: <strong className="text-indigo-400 font-mono">{timer}s</strong></span>
                <span className="italic text-[11px]">Auto-selects if time runs out</span>
              </div>

              <button
                type="submit"
                disabled={!customWord.trim()}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-98"
              >
                Submit Secret Word
              </button>
            </form>

          </div>
        </div>
      )}

      {/* 2. Phase 2: Secret Reveal Modal (Exclusively for Designated Drawer) */}
      {status === "REVEAL" && isDrawer && secretWordToDraw && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md glass-panel-elevated rounded-3xl p-7 border-amber-500/40 shadow-2xl text-center animate-scale-up">
            
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto mb-4 shadow-lg shadow-amber-500/20">
              <Eye className="w-8 h-8 animate-pulse" />
            </div>

            <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
              Secret Word Reveal
            </span>

            <h3 className="font-display font-extrabold text-2xl text-white mt-1 mb-2">
              You Are The Drawer!
            </h3>

            <p className="text-xs text-slate-300 mb-6">
              Keep this secret from the guessers. Drawing starts shortly!
            </p>

            {/* Secret Word Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-600/20 to-amber-700/10 border-2 border-amber-500/60 shadow-xl mb-6">
              <span className="text-3xl md:text-4xl font-mono font-black tracking-widest text-amber-300 drop-shadow-md">
                {secretWordToDraw}
              </span>
            </div>

            {/* Countdown notice */}
            <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold text-slate-300 bg-slate-900/80 border border-slate-800 py-2 px-4 rounded-xl">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Whiteboard opens in {timer}s</span>
            </div>

          </div>
        </div>
      )}

      {/* 3. Phase 4: Round End Recap Modal (3-4s) */}
      {status === "ROUND_END" && roundResultModal && (
        <div className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md glass-panel-elevated rounded-3xl p-6 border-slate-700/80 shadow-2xl text-center animate-scale-up">
            
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto mb-3 shadow-lg">
              <Trophy className="w-7 h-7" />
            </div>

            <h3 className="font-display font-extrabold text-2xl text-white mb-1">
              Round {roundResultModal.round} Over!
            </h3>

            <div className="text-sm font-semibold mb-4">
              {roundResultModal.winnerTeam ? (
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  roundResultModal.winnerTeam === "teamA"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                }`}>
                  {roundResultModal.winnerTeam === "teamA" ? "Team A" : "Team B"} Scored +1 Point!
                </span>
              ) : (
                <span className="text-slate-400">Round Tied</span>
              )}
            </div>

            {/* Secret Word Revealed */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 mb-4">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                The Secret Word Was:
              </div>
              <div className="text-2xl font-mono font-black text-indigo-300 tracking-widest">
                {roundResultModal.secretWord}
              </div>
            </div>

            <p className="text-xs text-slate-400 italic">
              Next round begins in {timer}s...
            </p>

          </div>
        </div>
      )}

      {/* 4. Game Over Modal */}
      {status === "GAME_OVER" && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg glass-panel-elevated rounded-3xl p-8 border-slate-700 shadow-2xl text-center animate-scale-up">
            
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 mx-auto mb-4 shadow-xl shadow-amber-500/30">
              <Trophy className="w-10 h-10" />
            </div>

            <h2 className="font-display font-black text-3xl md:text-4xl text-white mb-2">
              Match Finished!
            </h2>

            {/* Winner Announcement */}
            <div className="mb-6">
              {roomData.scores.teamA > roomData.scores.teamB ? (
                <div className="text-2xl font-extrabold text-blue-400 drop-shadow">
                  🎉 TEAM A IS VICTORIOUS!
                </div>
              ) : roomData.scores.teamB > roomData.scores.teamA ? (
                <div className="text-2xl font-extrabold text-rose-400 drop-shadow">
                  🎉 TEAM B IS VICTORIOUS!
                </div>
              ) : (
                <div className="text-2xl font-extrabold text-amber-300 drop-shadow">
                  🤝 IT'S AN EPIC TIE!
                </div>
              )}
            </div>

            {/* Final Scores Breakdown */}
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-8">
              <div className="p-4 rounded-2xl bg-blue-950/50 border border-blue-500/40">
                <span className="text-xs font-bold text-blue-300 block mb-1">TEAM A</span>
                <span className="text-3xl font-mono font-extrabold text-white">
                  {roomData.scores.teamA}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/40">
                <span className="text-xs font-bold text-rose-300 block mb-1">TEAM B</span>
                <span className="text-3xl font-mono font-extrabold text-white">
                  {roomData.scores.teamB}
                </span>
              </div>
            </div>

            {/* Host Controls */}
            {isHost ? (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={startGame}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
                >
                  Play Again (Same Room)
                </button>
                <button
                  onClick={resetGame}
                  className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-sm border border-slate-700 transition-all active:scale-95"
                >
                  Back to Lobby
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Waiting for room host to start the next match or return to lobby...
              </p>
            )}

          </div>
        </div>
      )}
    </>
  );
};

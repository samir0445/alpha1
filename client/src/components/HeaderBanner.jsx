import React from "react";
import { useGame } from "../context/GameContext";
import { Volume2, VolumeX, Clock, Trophy, Copy, Check, Users } from "lucide-react";
import { useState } from "react";

export const HeaderBanner = () => {
  const {
    roomId,
    roomData,
    timer,
    revealedWord,
    soundEnabled,
    toggleSound,
    isDrawer,
    secretWordToDraw,
  } = useGame();

  const [copied, setCopied] = useState(false);

  if (!roomData) return null;

  const currentRound = roomData.currentRound || 1;
  const totalRounds = roomData.totalRounds || 10;
  const scores = roomData.scores || { teamA: 0, teamB: 0 };
  const status = roomData.status;

  const copyInviteLink = () => {
    const url = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUrgent = timer <= 10 && timer > 0;

  return (
    <header className="w-full glass-panel-elevated border-b border-slate-800/80 px-4 py-2.5 shadow-xl select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand & Room Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl filter drop-shadow">🎨</span>
            <span className="font-display font-extrabold text-2xl tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-rose-400 bg-clip-text text-transparent">
              Wordy
            </span>
          </div>

          {/* Room Code Badge */}
          <button
            onClick={copyInviteLink}
            title="Click to copy room link"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700/80 text-xs font-mono font-semibold text-slate-300 border border-slate-700/60 transition-all active:scale-95 group"
          >
            <span>ROOM:</span>
            <span className="text-indigo-400 font-bold">{roomId}</span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
            )}
          </button>
        </div>

        {/* Word Blank Slots / Secret Word */}
        <div className="order-3 md:order-2 flex-1 flex flex-col items-center justify-center min-w-[240px]">
          {status === "DRAWING" ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                {revealedWord.map((letter, idx) => (
                  <div
                    key={idx}
                    className={`w-8 h-10 md:w-9 md:h-11 rounded-lg flex items-center justify-center text-lg md:text-xl font-mono font-bold transition-all transform ${
                      letter !== "_"
                        ? "bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105 border-b-2 border-indigo-300"
                        : "bg-slate-800/90 text-slate-500 border border-slate-700/70"
                    }`}
                  >
                    {letter !== "_" ? letter : ""}
                  </div>
                ))}
              </div>
              {isDrawer && secretWordToDraw && (
                <div className="text-xs font-medium text-amber-300/90 bg-amber-950/40 border border-amber-500/30 px-3 py-0.5 rounded-full mt-1 animate-pulse">
                  You are drawing: <span className="font-bold underline tracking-wider">{secretWordToDraw}</span>
                </div>
              )}
            </div>
          ) : status === "WORD_INPUT" ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300 text-xs md:text-sm font-medium animate-pulse">
              <span>✍️ Phase 1: Word Submission in progress...</span>
            </div>
          ) : status === "REVEAL" ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 text-xs md:text-sm font-medium animate-pulse">
              <span>👀 Phase 2: Drawer is preparing...</span>
            </div>
          ) : status === "ROUND_END" ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-300 text-xs md:text-sm font-medium">
              <span>🏆 Round Completed!</span>
            </div>
          ) : (
            <div className="text-xs text-slate-400 font-medium">
              Waiting in Lobby...
            </div>
          )}
        </div>

        {/* Round, Timer, Scoreboard & Settings */}
        <div className="order-2 md:order-3 flex items-center gap-3">
          
          {/* Round Pill */}
          <div className="hidden sm:flex flex-col items-center px-3 py-1 bg-slate-800/80 rounded-lg border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Round</span>
            <span className="text-sm font-bold font-mono text-slate-100">
              {currentRound} <span className="text-slate-500 font-normal">/ {totalRounds}</span>
            </span>
          </div>

          {/* Timer Countdown */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono font-bold text-base transition-all ${
              isUrgent
                ? "bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse-fast shadow-lg shadow-rose-500/20"
                : "bg-slate-800/90 border-slate-700/60 text-slate-200"
            }`}
          >
            <Clock className={`w-4 h-4 ${isUrgent ? "text-rose-400 animate-spin" : "text-slate-400"}`} />
            <span>{timer}s</span>
          </div>

          {/* Scores Pill */}
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/90 rounded-lg border border-slate-800 shadow-inner">
            {/* Team A */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500"></span>
              <span className="text-xs font-bold text-blue-400">Team A</span>
              <span className="text-sm font-extrabold font-mono text-white ml-0.5">{scores.teamA}</span>
            </div>
            
            <span className="text-slate-600 font-bold text-xs">:</span>

            {/* Team B */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold font-mono text-white mr-0.5">{scores.teamB}</span>
              <span className="text-xs font-bold text-rose-400">Team B</span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500"></span>
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? "Mute Sound" : "Enable Sound"}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>

      </div>
    </header>
  );
};

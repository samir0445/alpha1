import React from "react";
import { useGame } from "../context/GameContext";
import { Crown, UserX, Shield, ArrowLeftRight, Paintbrush, PenTool, Sparkles } from "lucide-react";

export const TeamSidebar = () => {
  const {
    roomData,
    socket,
    isHost,
    switchTeam,
    kickPlayer,
  } = useGame();

  if (!roomData) return null;

  const { teams, gameState, status } = roomData;
  const wordProviderId = gameState?.wordProviderId;
  const drawerId = gameState?.drawerId;
  const drawerTeam = gameState?.drawerTeam;
  const providerTeam = gameState?.providerTeam;

  const renderPlayerCard = (player, teamKey) => {
    const isMe = player.id === socket?.id;
    const isCurrentHost = player.isHost;
    const isCurrentProvider = player.id === wordProviderId;
    const isCurrentDrawer = player.id === drawerId;

    return (
      <div
        key={player.id}
        className={`flex items-center justify-between p-2 rounded-xl border transition-all duration-200 ${
          isMe
            ? teamKey === "teamA"
              ? "bg-blue-950/60 border-blue-500/50 shadow-md shadow-blue-500/10"
              : "bg-rose-950/60 border-rose-500/50 shadow-md shadow-rose-500/10"
            : "bg-slate-900/60 hover:bg-slate-800/60 border-slate-800/80"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Avatar circle */}
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-display ${
              teamKey === "teamA"
                ? "bg-gradient-to-tr from-blue-600 to-indigo-500 text-white"
                : "bg-gradient-to-tr from-rose-600 to-pink-500 text-white"
            }`}
          >
            {player.name.slice(0, 2).toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-semibold truncate ${isMe ? "text-white font-bold" : "text-slate-200"}`}>
                {player.name}
              </span>
              {isMe && (
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-medium border border-slate-700">
                  You
                </span>
              )}
            </div>

            {/* Role Pills */}
            <div className="flex items-center gap-1 mt-0.5">
              {isCurrentHost && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-400 bg-amber-950/70 border border-amber-600/40 px-1.5 py-0.5 rounded">
                  <Crown className="w-2.5 h-2.5" /> Host
                </span>
              )}
              {isCurrentDrawer && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-600/40 px-1.5 py-0.5 rounded animate-pulse">
                  <Paintbrush className="w-2.5 h-2.5" /> Drawer
                </span>
              )}
              {isCurrentProvider && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-purple-400 bg-purple-950/70 border border-purple-600/40 px-1.5 py-0.5 rounded animate-pulse">
                  <PenTool className="w-2.5 h-2.5" /> Provider
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Kick button (only for host, cannot kick self) */}
        {isHost && !isMe && (
          <button
            onClick={() => kickPlayer(player.id)}
            title={`Kick ${player.name}`}
            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 rounded-lg transition-colors"
          >
            <UserX className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <aside className="w-full lg:w-64 flex flex-col gap-4 select-none">
      
      {/* Team A Roster Card */}
      <div className="glass-panel rounded-2xl p-3.5 flex flex-col gap-3 border-blue-500/20 shadow-lg shadow-blue-500/5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-blue-500 shadow-sm shadow-blue-500"></span>
            <h3 className="font-display font-bold text-sm text-blue-400 tracking-wide">
              TEAM A
            </h3>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded-full border border-slate-700/60">
              {teams.teamA.length}
            </span>
          </div>

          {/* Current Turn Badge for Team A */}
          {status !== "LOBBY" && (
            <div>
              {providerTeam === "teamA" && status === "WORD_INPUT" && (
                <span className="text-[10px] font-bold text-purple-300 bg-purple-950/80 border border-purple-500/40 px-2 py-0.5 rounded-full">
                  Providing
                </span>
              )}
              {drawerTeam === "teamA" && (status === "REVEAL" || status === "DRAWING") && (
                <span className="text-[10px] font-bold text-blue-300 bg-blue-950/80 border border-blue-500/40 px-2 py-0.5 rounded-full animate-pulse">
                  Drawing & Guessing
                </span>
              )}
            </div>
          )}
        </div>

        {/* Players List */}
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
          {teams.teamA.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2 text-center">No players yet</p>
          ) : (
            teams.teamA.map((p) => renderPlayerCard(p, "teamA"))
          )}
        </div>
      </div>

      {/* Team B Roster Card */}
      <div className="glass-panel rounded-2xl p-3.5 flex flex-col gap-3 border-rose-500/20 shadow-lg shadow-rose-500/5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-rose-500 shadow-sm shadow-rose-500"></span>
            <h3 className="font-display font-bold text-sm text-rose-400 tracking-wide">
              TEAM B
            </h3>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded-full border border-slate-700/60">
              {teams.teamB.length}
            </span>
          </div>

          {/* Current Turn Badge for Team B */}
          {status !== "LOBBY" && (
            <div>
              {providerTeam === "teamB" && status === "WORD_INPUT" && (
                <span className="text-[10px] font-bold text-purple-300 bg-purple-950/80 border border-purple-500/40 px-2 py-0.5 rounded-full">
                  Providing
                </span>
              )}
              {drawerTeam === "teamB" && (status === "REVEAL" || status === "DRAWING") && (
                <span className="text-[10px] font-bold text-rose-300 bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded-full animate-pulse">
                  Drawing & Guessing
                </span>
              )}
            </div>
          )}
        </div>

        {/* Players List */}
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
          {teams.teamB.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2 text-center">No players yet</p>
          ) : (
            teams.teamB.map((p) => renderPlayerCard(p, "teamB"))
          )}
        </div>
      </div>

      {/* Switch Team button (available in Lobby) */}
      {status === "LOBBY" && (
        <button
          onClick={switchTeam}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 text-xs font-semibold border border-slate-700/70 transition-all active:scale-95 shadow-sm"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
          <span>Switch Team</span>
        </button>
      )}

    </aside>
  );
};

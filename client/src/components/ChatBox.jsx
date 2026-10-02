import React, { useState, useRef, useEffect } from "react";
import { useGame } from "../context/GameContext";
import { Send, MessageSquare, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

export const ChatBox = () => {
  const {
    roomData,
    chatMessages,
    submitGuess,
    isDrawer,
    myPlayer,
  } = useGame();

  const [inputVal, setInputVal] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    submitGuess(inputVal);
    setInputVal("");
  };

  const isDrawingPhase = roomData?.status === "DRAWING";
  const myTeam = myPlayer?.team;
  const isMyTeamDrawing = roomData?.gameState?.drawerTeam === myTeam;
  const canGuess = isDrawingPhase && isMyTeamDrawing && !isDrawer;

  return (
    <div className="w-full lg:w-80 flex flex-col glass-panel rounded-2xl border-slate-800 shadow-xl overflow-hidden min-h-[380px] lg:min-h-0">
      
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <h3 className="font-display font-bold text-sm text-slate-200">
            Live Chat & Guesses
          </h3>
        </div>

        {/* Status Indicator */}
        {isDrawingPhase ? (
          canGuess ? (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded-full animate-pulse">
              You Can Guess!
            </span>
          ) : isDrawer ? (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-950/70 border border-amber-500/40 px-2 py-0.5 rounded-full">
              You are Drawing
            </span>
          ) : (
            <span className="text-[10px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
              Opponent Drawing
            </span>
          )
        ) : (
          <span className="text-[10px] font-medium text-slate-500">
            Chat Active
          </span>
        )}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 max-h-[460px] text-xs">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 select-none">
            <MessageSquare className="w-8 h-8 text-slate-700 mb-2" />
            <p>No messages yet.</p>
            <p className="text-[11px] text-slate-600 mt-0.5">Send a message or type your guesses during drawing rounds!</p>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isSystem = msg.type === "system";
            const isCorrectWord = msg.type === "correct-word";
            const isCorrectLetter = msg.type === "correct-letter";

            if (isSystem) {
              return (
                <div
                  key={msg.id}
                  className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 text-center font-medium leading-relaxed"
                >
                  {msg.text}
                </div>
              );
            }

            if (isCorrectWord) {
              return (
                <div
                  key={msg.id}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-500/50 text-emerald-200 shadow-md shadow-emerald-950/50 animate-scale-up"
                >
                  <div className="flex items-center gap-1.5 font-bold text-emerald-300 mb-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{msg.senderName}</span>
                    <span className="text-[10px] font-mono opacity-60 ml-auto">{msg.timestamp}</span>
                  </div>
                  <div className="font-mono font-extrabold text-sm text-white tracking-wide">
                    🎉 {msg.text} (CORRECT WORD!)
                  </div>
                </div>
              );
            }

            if (isCorrectLetter) {
              return (
                <div
                  key={msg.id}
                  className="p-2 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-200"
                >
                  <div className="flex items-center gap-1.5 font-semibold text-indigo-300">
                    <span>{msg.senderName}</span>
                    <span className="text-[10px] font-mono opacity-60 ml-auto">{msg.timestamp}</span>
                  </div>
                  <div className="font-mono font-bold text-white mt-0.5">
                    💡 Letter Match: "{msg.text}"
                  </div>
                </div>
              );
            }

            // Normal message / guess
            const isTeamA = msg.team === "teamA";
            return (
              <div
                key={msg.id}
                className="p-2 rounded-xl bg-slate-900/50 border border-slate-800/80"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isTeamA ? "bg-blue-400" : "bg-rose-400"
                    }`}
                  />
                  <span
                    className={`font-semibold text-[11px] ${
                      isTeamA ? "text-blue-300" : "text-rose-300"
                    }`}
                  >
                    {msg.senderName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 ml-auto">
                    {msg.timestamp}
                  </span>
                </div>
                <div className="text-slate-200 font-medium break-words pl-3.5">
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-slate-800 bg-slate-900/40 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={
            canGuess
              ? "Type your guess or letter here..."
              : isDrawer
              ? "You are drawing (no guessing)"
              : "Chat with teammates..."
          }
          disabled={isDrawer && isDrawingPhase}
          maxLength={40}
          className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <button
          type="submit"
          disabled={!inputVal.trim() || (isDrawer && isDrawingPhase)}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 transition-all active:scale-95 shadow-md shadow-indigo-600/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};

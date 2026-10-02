import React from "react";
import { GameProvider, useGame } from "./context/GameContext";
import { GameWorkspace } from "./components/GameWorkspace";
import { WifiOff } from "lucide-react";

function AppContent() {
  const { connected } = useGame();

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Offline Alert if server not reachable */}
      {!connected && (
        <div className="bg-amber-600 text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-md">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>Connecting to Wordy game server... Please ensure the backend is running.</span>
        </div>
      )}

      <GameWorkspace />
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

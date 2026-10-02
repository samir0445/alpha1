import React from "react";
import { useGame } from "../context/GameContext";
import { HeaderBanner } from "./HeaderBanner";
import { TeamSidebar } from "./TeamSidebar";
import { CanvasBoard } from "./CanvasBoard";
import { ChatBox } from "./ChatBox";
import { Modals } from "./Modals";
import { Lobby } from "./Lobby";

export const GameWorkspace = () => {
  const { roomData } = useGame();

  // If no room joined or in Lobby, show Lobby view
  if (!roomData || roomData.status === "LOBBY") {
    return <Lobby />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Banner */}
      <HeaderBanner />

      {/* Main Game Layout */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-3 md:p-4 flex flex-col lg:flex-row gap-4 items-stretch overflow-hidden">
        {/* Left: Team Rosters */}
        <TeamSidebar />

        {/* Center: Canvas Whiteboard */}
        <CanvasBoard />

        {/* Right: Live Chat & Guesses */}
        <ChatBox />
      </main>

      {/* Active Phase Modals & Overlays */}
      <Modals />
    </div>
  );
};

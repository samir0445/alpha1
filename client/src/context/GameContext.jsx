import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import confetti from "canvas-confetti";
import { soundEffects } from "../utils/soundEffects";

const GameContext = createContext(null);

export const GameProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [roomData, setRoomData] = useState(null);
  const [timer, setTimer] = useState(0);
  const [revealedWord, setRevealedWord] = useState([]);
  const [secretWordToDraw, setSecretWordToDraw] = useState("");
  const [wordPromptData, setWordPromptData] = useState(null);
  const [roundResultModal, setRoundResultModal] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Read URL query params for easy room join / testing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");
    if (roomParam) {
      setRoomId(roomParam.toUpperCase());
    }
  }, []);

  // Initialize Socket.io client
  useEffect(() => {
    // Read backend URL from environment variable, or fallback to localhost in development
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const serverUrl = backendUrl || (window.location.hostname === "localhost" 
      ? "http://localhost:3001" 
      : window.location.origin);

    const newSocket = io(serverUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
    });

    newSocket.on("connect", () => {
      console.log("[Socket] Connected with ID:", newSocket.id);
      setConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("[Socket] Disconnected");
      setConnected(false);
    });

    newSocket.on("room-state-update", ({ roomData: updatedRoom }) => {
      setRoomData(updatedRoom);
      if (updatedRoom.gameState) {
        setRevealedWord(updatedRoom.gameState.revealedWord || []);
        setTimer(updatedRoom.gameState.timer || 0);

        // Clear secret word reveal when moving away from REVEAL/DRAWING
        if (updatedRoom.status !== "REVEAL" && updatedRoom.status !== "DRAWING") {
          setSecretWordToDraw("");
        }
      }
    });

    newSocket.on("timer-tick", ({ secondsRemaining }) => {
      setTimer(secondsRemaining);
      if (secondsRemaining <= 5 && secondsRemaining > 0 && soundEnabled) {
        soundEffects.playTick();
      }
    });

    newSocket.on("prompt-word-input", (data) => {
      setWordPromptData(data);
      if (soundEnabled) soundEffects.playChime();
    });

    newSocket.on("secret-word-reveal", ({ secretWord }) => {
      setSecretWordToDraw(secretWord);
      if (soundEnabled) soundEffects.playChime();
    });

    newSocket.on("word-progress-update", ({ revealedWord: updatedWord }) => {
      setRevealedWord(updatedWord);
      if (soundEnabled) soundEffects.playCorrectLetter();
    });

    newSocket.on("round-result", (result) => {
      setRoundResultModal(result);
      if (soundEnabled) {
        if (result.winnerTeam) {
          soundEffects.playCorrectWord();
        } else {
          soundEffects.playRoundLoss();
        }
      }
      // Trigger confetti if my team won
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    });

    newSocket.on("chat-message", (msg) => {
      setChatMessages((prev) => [...prev, msg]);
      if (msg.type === "correct-word") {
        if (soundEnabled) soundEffects.playCorrectWord();
      } else if (msg.type === "correct-letter") {
        if (soundEnabled) soundEffects.playCorrectLetter();
      }
    });

    newSocket.on("kicked-from-room", ({ message }) => {
      alert(message || "You were removed from the room.");
      setRoomData(null);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const myPlayer = roomData
    ? roomData.teams.teamA.find((p) => p.id === socket?.id) ||
      roomData.teams.teamB.find((p) => p.id === socket?.id) ||
      null
    : null;

  const isHost = roomData?.hostId === socket?.id;
  const isWordProvider = roomData?.gameState?.wordProviderId === socket?.id;
  const isDrawer = roomData?.gameState?.drawerId === socket?.id;
  const myTeam = myPlayer?.team;
  const isMyTeamDrawing = roomData?.gameState?.drawerTeam === myTeam;

  const joinRoom = (rId, uName) => {
    const finalRoomId = (rId || "ROOM1").toUpperCase().trim();
    const finalUsername = (uName || `Player${Math.floor(Math.random() * 900 + 100)}`).trim();
    setRoomId(finalRoomId);
    setUsername(finalUsername);
    socket?.emit("join-room", { roomId: finalRoomId, username: finalUsername });
    if (soundEnabled) soundEffects.playPop();
  };

  const switchTeam = () => {
    if (!roomId) return;
    socket?.emit("switch-team", { roomId });
    if (soundEnabled) soundEffects.playPop();
  };

  const kickPlayer = (targetSocketId) => {
    if (!roomId) return;
    socket?.emit("kick-player", { roomId, targetSocketId });
  };

  const startGame = () => {
    if (!roomId) return;
    socket?.emit("start-game", { roomId });
    if (soundEnabled) soundEffects.playChime();
  };

  const resetGame = () => {
    if (!roomId) return;
    socket?.emit("reset-game", { roomId });
  };

  const submitSecretWord = (word) => {
    if (!roomId) return;
    socket?.emit("submit-secret-word", { roomId, word });
    setWordPromptData(null);
  };

  const submitGuess = (guess) => {
    if (!roomId || !guess.trim()) return;
    socket?.emit("submit-guess", { roomId, guess: guess.trim() });
  };

  const drawStroke = (strokeData) => {
    if (!roomId) return;
    socket?.emit("draw-stroke", { roomId, strokeData });
  };

  const clearCanvas = () => {
    if (!roomId) return;
    socket?.emit("clear-canvas", { roomId });
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };

  return (
    <GameContext.Provider
      value={{
        socket,
        connected,
        roomId,
        username,
        roomData,
        myPlayer,
        myTeam,
        isHost,
        isWordProvider,
        isDrawer,
        isMyTeamDrawing,
        timer,
        revealedWord,
        secretWordToDraw,
        wordPromptData,
        roundResultModal,
        setRoundResultModal,
        chatMessages,
        soundEnabled,
        toggleSound,
        joinRoom,
        switchTeam,
        kickPlayer,
        startGame,
        resetGame,
        submitSecretWord,
        submitGuess,
        drawStroke,
        clearCanvas,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);

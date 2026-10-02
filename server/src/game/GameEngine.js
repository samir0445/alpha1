import { getRandomWord, getRandomWordSuggestions } from "./wordList.js";

export class GameEngine {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
    this.timers = new Map(); // roomId -> intervalId
  }

  getRoom(roomId) {
    return this.rooms.get(roomId?.toUpperCase());
  }

  createOrJoinRoom(rawRoomId, username, socket) {
    const roomId = (rawRoomId || "ROOM1").toUpperCase().trim();
    const cleanName = (username || "Player").trim().slice(0, 16);

    let room = this.rooms.get(roomId);

    if (!room) {
      room = {
        roomId,
        hostId: socket.id,
        status: "LOBBY",
        currentRound: 0,
        totalRounds: 10,
        teams: {
          teamA: [],
          teamB: [],
        },
        scores: { teamA: 0, teamB: 0 },
        gameState: {
          wordProviderId: null,
          drawerId: null,
          secretWord: "",
          revealedWord: [],
          timer: 0,
          strokes: [],
          lastWinner: null,
          lastWinReason: null,
        },
        chatHistory: [],
      };
      this.rooms.set(roomId, room);
    }

    // Check if player already exists in the room
    const existingPlayer = this.findPlayerInRoom(room, socket.id);
    if (!existingPlayer) {
      // Auto-balancing: assign to team with fewer players
      const countA = room.teams.teamA.length;
      const countB = room.teams.teamB.length;
      const targetTeam = countA <= countB ? "teamA" : "teamB";

      room.teams[targetTeam].push({
        id: socket.id,
        name: cleanName,
        team: targetTeam,
        isHost: room.hostId === socket.id,
      });
    }

    socket.join(roomId);
    this.addSystemMessage(room, `${cleanName} joined the game.`);
    this.syncRoomState(roomId);
    return room;
  }

  switchTeam(roomId, socketId) {
    const room = this.getRoom(roomId);
    if (!room || room.status !== "LOBBY") return;

    let player = null;
    let fromTeam = null;

    if (room.teams.teamA.some((p) => p.id === socketId)) {
      fromTeam = "teamA";
      const idx = room.teams.teamA.findIndex((p) => p.id === socketId);
      player = room.teams.teamA.splice(idx, 1)[0];
      player.team = "teamB";
      room.teams.teamB.push(player);
    } else if (room.teams.teamB.some((p) => p.id === socketId)) {
      fromTeam = "teamB";
      const idx = room.teams.teamB.findIndex((p) => p.id === socketId);
      player = room.teams.teamB.splice(idx, 1)[0];
      player.team = "teamA";
      room.teams.teamA.push(player);
    }

    if (player) {
      this.addSystemMessage(room, `${player.name} switched to ${player.team === "teamA" ? "Team A" : "Team B"}.`);
      this.syncRoomState(roomId);
    }
  }

  kickPlayer(roomId, requesterId, targetSocketId) {
    const room = this.getRoom(roomId);
    if (!room || room.hostId !== requesterId) return;
    if (requesterId === targetSocketId) return; // Cannot kick host

    const target = this.findPlayerInRoom(room, targetSocketId);
    if (!target) return;

    this.removePlayerFromTeams(room, targetSocketId);

    const targetSocket = this.io.sockets.sockets.get(targetSocketId);
    if (targetSocket) {
      targetSocket.leave(roomId);
      targetSocket.emit("kicked-from-room", { message: "You were kicked by the host." });
    }

    this.addSystemMessage(room, `${target.name} was removed from the room.`);
    this.syncRoomState(roomId);
  }

  handleDisconnect(socketId) {
    for (const [roomId, room] of this.rooms.entries()) {
      const player = this.findPlayerInRoom(room, socketId);
      if (player) {
        this.removePlayerFromTeams(room, socketId);
        this.addSystemMessage(room, `${player.name} disconnected.`);

        // Reassign host if host left
        const allPlayers = [...room.teams.teamA, ...room.teams.teamB];
        if (allPlayers.length === 0) {
          this.clearTimer(roomId);
          this.rooms.delete(roomId);
          console.log(`Room ${roomId} purged from RAM.`);
          return;
        }

        if (room.hostId === socketId) {
          room.hostId = allPlayers[0].id;
          allPlayers[0].isHost = true;
          this.addSystemMessage(room, `${allPlayers[0].name} is now the host.`);
        }

        // If game is active and the disconnected player was Word Provider or Drawer
        if (room.status === "WORD_INPUT" && room.gameState.wordProviderId === socketId) {
          this.addSystemMessage(room, `Word Provider disconnected. Auto-selecting a secret word...`);
          this.submitSecretWord(roomId, socketId, getRandomWord(), true);
        } else if ((room.status === "REVEAL" || room.status === "DRAWING") && room.gameState.drawerId === socketId) {
          this.addSystemMessage(room, `Drawer disconnected! Ending round early.`);
          this.endRound(roomId, null, "drawer_disconnect");
        } else {
          this.syncRoomState(roomId);
        }
      }
    }
  }

  startGame(roomId, requesterId) {
    const room = this.getRoom(roomId);
    if (!room || room.hostId !== requesterId) return;

    const totalPlayers = room.teams.teamA.length + room.teams.teamB.length;
    if (totalPlayers < 2) {
      // In development or solo testing, let's warn but still allow if only 1 player for testing
      // but let's notify
    }

    room.scores = { teamA: 0, teamB: 0 };
    room.currentRound = 1;
    this.addSystemMessage(room, `Game started! Round 1 of ${room.totalRounds}.`);
    this.startRound(roomId);
  }

  resetGame(roomId, requesterId) {
    const room = this.getRoom(roomId);
    if (!room || room.hostId !== requesterId) return;

    this.clearTimer(roomId);
    room.status = "LOBBY";
    room.currentRound = 0;
    room.scores = { teamA: 0, teamB: 0 };
    room.gameState = {
      wordProviderId: null,
      drawerId: null,
      secretWord: "",
      revealedWord: [],
      timer: 0,
      strokes: [],
      lastWinner: null,
      lastWinReason: null,
    };
    this.addSystemMessage(room, "Game reset back to Lobby.");
    this.syncRoomState(roomId);
  }

  startRound(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return;

    this.clearTimer(roomId);
    room.status = "WORD_INPUT";
    room.gameState.strokes = [];
    room.gameState.secretWord = "";
    room.gameState.revealedWord = [];
    room.gameState.lastWinner = null;
    room.gameState.lastWinReason = null;

    // Alternating roles:
    // Round 1, 3, 5, 7, 9 (Odd): Team A provides word, Team B draws
    // Round 2, 4, 6, 8, 10 (Even): Team B provides word, Team A draws
    const isOddRound = room.currentRound % 2 === 1;
    const providerTeam = isOddRound ? "teamA" : "teamB";
    const drawerTeam = isOddRound ? "teamB" : "teamA";

    const providerCandidates = room.teams[providerTeam].length > 0
      ? room.teams[providerTeam]
      : [...room.teams.teamA, ...room.teams.teamB];

    const drawerCandidates = room.teams[drawerTeam].length > 0
      ? room.teams[drawerTeam]
      : [...room.teams.teamA, ...room.teams.teamB];

    // Pick random players for the roles
    const provider = providerCandidates[Math.floor(Math.random() * providerCandidates.length)];
    const drawer = drawerCandidates[Math.floor(Math.random() * drawerCandidates.length)];

    room.gameState.wordProviderId = provider ? provider.id : null;
    room.gameState.drawerId = drawer ? drawer.id : null;
    room.gameState.providerTeam = providerTeam;
    room.gameState.drawerTeam = drawerTeam;

    const providerName = provider ? provider.name : "Someone";
    const drawerName = drawer ? drawer.name : "Someone";

    this.addSystemMessage(
      room,
      `--- Round ${room.currentRound}/${room.totalRounds} ---`
    );
    this.addSystemMessage(
      room,
      `${providerName} (${providerTeam === "teamA" ? "Team A" : "Team B"}) is choosing a word. ${drawerName} (${drawerTeam === "teamA" ? "Team A" : "Team B"}) will draw.`
    );

    // Prompt word input to provider
    if (provider) {
      const suggestions = getRandomWordSuggestions(3);
      this.io.to(provider.id).emit("prompt-word-input", {
        providerId: provider.id,
        suggestions,
        timeoutSeconds: 10,
      });
    }

    // Phase 1 timer (10s)
    this.startPhaseTimer(roomId, 10, () => {
      // If no word was submitted, auto pick
      if (!room.gameState.secretWord) {
        const autoWord = getRandomWord();
        this.submitSecretWord(roomId, room.gameState.wordProviderId, autoWord, true);
      }
    });

    this.syncRoomState(roomId);
  }

  submitSecretWord(roomId, socketId, word, isAuto = false) {
    const room = this.getRoom(roomId);
    if (!room || room.status !== "WORD_INPUT") return;
    if (!isAuto && socketId !== room.gameState.wordProviderId) return;

    const cleanWord = (word || getRandomWord()).trim().toUpperCase().replace(/[^A-Z]/g, "");
    if (cleanWord.length < 2) return;

    room.gameState.secretWord = cleanWord;
    room.gameState.revealedWord = Array(cleanWord.length).fill("_");

    this.clearTimer(roomId);
    this.startRevealPhase(roomId);
  }

  startRevealPhase(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return;

    room.status = "REVEAL";
    const drawerId = room.gameState.drawerId;
    const drawer = this.findPlayerInRoom(room, drawerId);
    const drawerName = drawer ? drawer.name : "Drawer";

    this.addSystemMessage(room, `Secret word chosen! ${drawerName} is memorizing the word (10s)...`);

    // Strictly reveal secret word ONLY to the Drawer
    if (drawerId) {
      this.io.to(drawerId).emit("secret-word-reveal", {
        secretWord: room.gameState.secretWord,
      });
    }

    this.syncRoomState(roomId);

    // Phase 2: Secret Reveal Phase (10s)
    this.startPhaseTimer(roomId, 10, () => {
      this.startDrawingPhase(roomId);
    });
  }

  startDrawingPhase(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return;

    room.status = "DRAWING";
    const drawer = this.findPlayerInRoom(room, room.gameState.drawerId);
    const drawerTeamName = room.gameState.drawerTeam === "teamA" ? "Team A" : "Team B";

    this.addSystemMessage(
      room,
      `Drawing phase started! ${drawer ? drawer.name : "Drawer"} is drawing. ${drawerTeamName} teammates: start guessing in the chat!`
    );

    this.syncRoomState(roomId);

    // Phase 3: Drawing & Guessing Phase (60s)
    this.startPhaseTimer(roomId, 60, () => {
      // 60s expired without full word guess -> Opposing team wins 1 point!
      const opposingTeam = room.gameState.drawerTeam === "teamA" ? "teamB" : "teamA";
      this.endRound(roomId, opposingTeam, "timeout");
    });
  }

  submitGuess(roomId, socketId, rawGuess) {
    const room = this.getRoom(roomId);
    if (!room || room.status !== "DRAWING") return;

    const player = this.findPlayerInRoom(room, socketId);
    if (!player) return;

    const guess = (rawGuess || "").trim().toUpperCase();
    if (!guess) return;

    // Check if guesser is on the drawing team and not the drawer themselves
    const isDrawer = socketId === room.gameState.drawerId;
    const isDrawingTeam = player.team === room.gameState.drawerTeam;

    if (isDrawer) {
      // Drawer cannot guess
      return;
    }

    if (!isDrawingTeam) {
      // Opponents can chat, but their messages don't reveal letters
      this.addChatMessage(room, player, guess, "normal");
      this.syncRoomState(roomId);
      return;
    }

    const secretWord = room.gameState.secretWord;
    let newlyRevealed = false;

    // Exact full word match!
    if (guess === secretWord) {
      room.gameState.revealedWord = secretWord.split("");
      this.addChatMessage(room, player, guess, "correct-word");
      this.addSystemMessage(room, `🎉 ${player.name} guessed the correct word "${secretWord}"!`);
      this.io.to(roomId).emit("word-progress-update", {
        revealedWord: room.gameState.revealedWord,
      });

      // Drawing team scores 1 point!
      this.endRound(roomId, room.gameState.drawerTeam, "guessed");
      return;
    }

    // Letter reveal logic:
    // 1. Single letter: reveals occurrences of that letter in the secret word
    // 2. Word / multi-character guess: ONLY reveals characters if character and position match exactly!
    const revealedArr = [...room.gameState.revealedWord];
    let matchedCount = 0;

    if (guess.length === 1) {
      const char = guess;
      for (let i = 0; i < secretWord.length; i++) {
        if (secretWord[i] === char && revealedArr[i] === "_") {
          revealedArr[i] = char;
          newlyRevealed = true;
          matchedCount++;
        }
      }
    } else {
      const checkLength = Math.min(guess.length, secretWord.length);
      for (let i = 0; i < checkLength; i++) {
        if (guess[i] === secretWord[i] && revealedArr[i] === "_") {
          revealedArr[i] = secretWord[i];
          newlyRevealed = true;
          matchedCount++;
        }
      }
    }

    if (newlyRevealed) {
      room.gameState.revealedWord = revealedArr;
      this.addChatMessage(room, player, guess, "correct-letter");
      this.addSystemMessage(
        room,
        `💡 ${player.name}'s guess revealed ${matchedCount} letter(s)!`
      );
      this.io.to(roomId).emit("word-progress-update", {
        revealedWord: room.gameState.revealedWord,
      });

      // Check if all letters are now revealed
      if (!revealedArr.includes("_")) {
        this.addSystemMessage(room, `🎉 All letters revealed! Word was "${secretWord}"!`);
        this.endRound(roomId, room.gameState.drawerTeam, "all_letters_revealed");
        return;
      }
    } else {
      this.addChatMessage(room, player, guess, "normal");
    }

    this.syncRoomState(roomId);
  }

  endRound(roomId, winnerTeam, reason) {
    const room = this.getRoom(roomId);
    if (!room) return;

    this.clearTimer(roomId);
    room.status = "ROUND_END";

    if (winnerTeam) {
      room.scores[winnerTeam] = (room.scores[winnerTeam] || 0) + 1;
    }

    room.gameState.lastWinner = winnerTeam;
    room.gameState.lastWinReason = reason;

    const winnerName = winnerTeam === "teamA" ? "Team A" : winnerTeam === "teamB" ? "Team B" : "Neither";
    const reasonText = reason === "guessed"
      ? "Word was guessed correctly!"
      : reason === "timeout"
      ? "Time ran out!"
      : reason === "drawer_disconnect"
      ? "Drawer disconnected."
      : "Round ended.";

    this.addSystemMessage(
      room,
      `Round ${room.currentRound} Over! ${winnerName} won +1 point. (${reasonText}) Word was: "${room.gameState.secretWord}".`
    );

    this.io.to(roomId).emit("round-result", {
      winnerTeam,
      scores: room.scores,
      secretWord: room.gameState.secretWord,
      reason,
      round: room.currentRound,
    });

    this.syncRoomState(roomId);

    // Phase 4: Round End (4 seconds) before next round or game over
    this.startPhaseTimer(roomId, 4, () => {
      if (room.currentRound >= room.totalRounds) {
        this.endGame(roomId);
      } else {
        room.currentRound += 1;
        this.startRound(roomId);
      }
    });
  }

  endGame(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return;

    this.clearTimer(roomId);
    room.status = "GAME_OVER";

    let winner = "tie";
    if (room.scores.teamA > room.scores.teamB) {
      winner = "teamA";
    } else if (room.scores.teamB > room.scores.teamA) {
      winner = "teamB";
    }

    this.addSystemMessage(
      room,
      `🏆 Game Over! Final Score: Team A: ${room.scores.teamA} | Team B: ${room.scores.teamB}. Winner: ${
        winner === "tie" ? "It's a Tie!" : winner === "teamA" ? "Team A Wins!" : "Team B Wins!"
      }`
    );

    this.syncRoomState(roomId);
  }

  handleDrawStroke(roomId, socketId, strokeData) {
    const room = this.getRoom(roomId);
    if (!room || room.status !== "DRAWING") return;
    if (socketId !== room.gameState.drawerId) return;

    room.gameState.strokes.push(strokeData);
    // Broadcast stroke to non-drawing clients
    this.io.to(roomId).emit("canvas-stroke", { strokeData });
  }

  handleClearCanvas(roomId, socketId) {
    const room = this.getRoom(roomId);
    if (!room || room.status !== "DRAWING") return;
    if (socketId !== room.gameState.drawerId) return;

    room.gameState.strokes = [];
    this.io.to(roomId).emit("clear-canvas");
  }

  startPhaseTimer(roomId, duration, onComplete) {
    this.clearTimer(roomId);
    const room = this.getRoom(roomId);
    if (!room) return;

    room.gameState.timer = duration;
    this.io.to(roomId).emit("timer-tick", { secondsRemaining: duration });

    const intervalId = setInterval(() => {
      const currentRoom = this.getRoom(roomId);
      if (!currentRoom) {
        clearInterval(intervalId);
        this.timers.delete(roomId);
        return;
      }

      currentRoom.gameState.timer -= 1;
      this.io.to(roomId).emit("timer-tick", {
        secondsRemaining: Math.max(0, currentRoom.gameState.timer),
      });

      if (currentRoom.gameState.timer <= 0) {
        clearInterval(intervalId);
        this.timers.delete(roomId);
        if (typeof onComplete === "function") {
          onComplete();
        }
      }
    }, 1000);

    this.timers.set(roomId, intervalId);
  }

  clearTimer(roomId) {
    if (this.timers.has(roomId)) {
      clearInterval(this.timers.get(roomId));
      this.timers.delete(roomId);
    }
  }

  addChatMessage(room, player, text, type = "normal") {
    const msg = {
      id: Date.now() + Math.random().toString(36).substr(2, 4),
      senderId: player.id,
      senderName: player.name,
      team: player.team,
      text,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
    room.chatHistory.push(msg);
    if (room.chatHistory.length > 100) room.chatHistory.shift();
    this.io.to(room.roomId).emit("chat-message", msg);
  }

  addSystemMessage(room, text) {
    const msg = {
      id: Date.now() + Math.random().toString(36).substr(2, 4),
      senderName: "SYSTEM",
      team: null,
      text,
      type: "system",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
    room.chatHistory.push(msg);
    if (room.chatHistory.length > 100) room.chatHistory.shift();
    this.io.to(room.roomId).emit("chat-message", msg);
  }

  findPlayerInRoom(room, socketId) {
    return (
      room.teams.teamA.find((p) => p.id === socketId) ||
      room.teams.teamB.find((p) => p.id === socketId) ||
      null
    );
  }

  removePlayerFromTeams(room, socketId) {
    room.teams.teamA = room.teams.teamA.filter((p) => p.id !== socketId);
    room.teams.teamB = room.teams.teamB.filter((p) => p.id !== socketId);
  }

  syncRoomState(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return;

    // Sanitize state: secretWord is hidden unless ROUND_END or GAME_OVER
    const sanitizedGameState = {
      ...room.gameState,
      secretWord:
        room.status === "ROUND_END" || room.status === "GAME_OVER"
          ? room.gameState.secretWord
          : "", // hidden from client state inspection
    };

    const payload = {
      roomId: room.roomId,
      hostId: room.hostId,
      status: room.status,
      currentRound: room.currentRound,
      totalRounds: room.totalRounds,
      teams: room.teams,
      scores: room.scores,
      gameState: sanitizedGameState,
    };

    this.io.to(roomId).emit("room-state-update", { roomData: payload });
  }
}

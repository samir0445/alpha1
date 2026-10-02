import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { GameEngine } from "./game/GameEngine.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure allowed CORS origins
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim())
  : ["http://localhost:5173", "http://localhost:3000"];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    // Allow wildcard or explicit match
    if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow all vercel preview and production deployments automatically
    if (/^https:\/\/.*\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  methods: ["GET", "POST"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    activeRooms: gameEngine.rooms.size,
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions,
});

const gameEngine = new GameEngine(io);

io.on("connection", (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // Client -> Server: join-room
  socket.on("join-room", ({ roomId, username }) => {
    gameEngine.createOrJoinRoom(roomId, username, socket);
  });

  // Client -> Server: switch-team
  socket.on("switch-team", ({ roomId }) => {
    gameEngine.switchTeam(roomId, socket.id);
  });

  // Client -> Server: kick-player
  socket.on("kick-player", ({ roomId, targetSocketId }) => {
    gameEngine.kickPlayer(roomId, socket.id, targetSocketId);
  });

  // Client -> Server: start-game
  socket.on("start-game", ({ roomId }) => {
    gameEngine.startGame(roomId, socket.id);
  });

  // Client -> Server: reset-game
  socket.on("reset-game", ({ roomId }) => {
    gameEngine.resetGame(roomId, socket.id);
  });

  // Client -> Server: submit-secret-word
  socket.on("submit-secret-word", ({ roomId, word }) => {
    gameEngine.submitSecretWord(roomId, socket.id, word);
  });

  // Client -> Server: draw-stroke
  socket.on("draw-stroke", ({ roomId, strokeData }) => {
    gameEngine.handleDrawStroke(roomId, socket.id, strokeData);
  });

  // Client -> Server: clear-canvas
  socket.on("clear-canvas", ({ roomId }) => {
    gameEngine.handleClearCanvas(roomId, socket.id);
  });

  // Client -> Server: submit-guess
  socket.on("submit-guess", ({ roomId, guess }) => {
    gameEngine.submitGuess(roomId, socket.id, guess);
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    gameEngine.handleDisconnect(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Wordy server running on http://localhost:${PORT}`);
});

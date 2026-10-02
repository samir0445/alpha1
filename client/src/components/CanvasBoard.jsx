import React, { useRef, useEffect, useState, useCallback } from "react";
import { useGame } from "../context/GameContext";
import { 
  Paintbrush, 
  Eraser, 
  Trash2, 
  Palette, 
  CircleDot, 
  Lock, 
  Sparkles,
  Maximize2
} from "lucide-react";

const COLORS = [
  "#ffffff", // White
  "#000000", // Black
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Yellow
  "#f97316", // Orange
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#78350f", // Brown
];

const BRUSH_SIZES = [
  { label: "S", size: 3 },
  { label: "M", size: 6 },
  { label: "L", size: 12 },
  { label: "XL", size: 22 },
];

export const CanvasBoard = () => {
  const {
    socket,
    roomData,
    isDrawer,
    drawStroke,
    clearCanvas: sendClearCanvas,
    secretWordToDraw,
  } = useGame();

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const [color, setColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);

  const canDraw = roomData?.status === "DRAWING" && isDrawer;

  // Draw stroke on local canvas
  const drawSegment = useCallback((prevX, prevY, currX, currY, strokeColor, strokeWidth, eraser) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const width = canvas.width;
    const height = canvas.height;

    // Denormalize coordinates
    const pX = prevX * width;
    const pY = prevY * height;
    const cX = currX * width;
    const cY = currY * height;

    if (eraser) {
      ctx.strokeStyle = "#131b2e"; // Canvas background color
      ctx.lineWidth = strokeWidth * 2;
    } else {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
    }

    ctx.beginPath();
    ctx.moveTo(pX, pY);
    ctx.lineTo(cX, cY);
    ctx.stroke();
    ctx.restore();
  }, []);

  const clearLocalCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#131b2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Listen to server canvas events
  useEffect(() => {
    if (!socket) return;

    const handleCanvasStroke = ({ strokeData }) => {
      const { prevX, prevY, currX, currY, color, size, isEraser } = strokeData;
      drawSegment(prevX, prevY, currX, currY, color, size, isEraser);
    };

    const handleClear = () => {
      clearLocalCanvas();
    };

    socket.on("canvas-stroke", handleCanvasStroke);
    socket.on("clear-canvas", handleClear);

    return () => {
      socket.off("canvas-stroke", handleCanvasStroke);
      socket.off("clear-canvas", handleClear);
    };
  }, [socket, drawSegment, clearLocalCanvas]);

  // Redraw strokes from roomData if joining / round starting
  useEffect(() => {
    clearLocalCanvas();
    if (roomData?.gameState?.strokes) {
      roomData.gameState.strokes.forEach((stroke) => {
        drawSegment(
          stroke.prevX,
          stroke.prevY,
          stroke.currX,
          stroke.currY,
          stroke.color,
          stroke.size,
          stroke.isEraser
        );
      });
    }
  }, [roomData?.currentRound, roomData?.status]);

  // Adjust canvas resolution to avoid blur
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx.drawImage(canvas, 0, 0);

      canvas.width = rect.width * 2; // high-DPI
      canvas.height = rect.height * 2;
      clearLocalCanvas();

      // restore drawing
      const ctx = canvas.getContext("2d");
      ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [clearLocalCanvas]);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const normX = (clientX - rect.left) / rect.width;
    const normY = (clientY - rect.top) / rect.height;

    return {
      x: Math.max(0, Math.min(1, normX)),
      y: Math.max(0, Math.min(1, normY)),
    };
  };

  const handlePointerDown = (e) => {
    if (!canDraw) return;
    isDrawingRef.current = true;
    const coords = getCanvasCoords(e);
    lastPosRef.current = coords;
  };

  const handlePointerMove = (e) => {
    if (!canDraw || !isDrawingRef.current) return;
    const coords = getCanvasCoords(e);
    const prev = lastPosRef.current;

    const strokeData = {
      prevX: prev.x,
      prevY: prev.y,
      currX: coords.x,
      currY: coords.y,
      color,
      size: brushSize,
      isEraser,
    };

    // Draw locally immediately
    drawSegment(prev.x, prev.y, coords.x, coords.y, color, brushSize, isEraser);
    // Send to server
    drawStroke(strokeData);

    lastPosRef.current = coords;
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
  };

  const handleClear = () => {
    if (!canDraw) return;
    clearLocalCanvas();
    sendClearCanvas();
  };

  const currentDrawer = roomData?.teams.teamA
    .concat(roomData.teams.teamB)
    .find((p) => p.id === roomData?.gameState?.drawerId);

  return (
    <div className="flex-1 flex flex-col gap-3 min-w-0">
      
      {/* Canvas Header / Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 glass-panel rounded-xl border-slate-800">
        <div className="flex items-center gap-2">
          {canDraw ? (
            <span className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-amber-400">
              <Sparkles className="w-4 h-4 animate-bounce-subtle" />
              <span>You are the Drawer! Sketch clues for your team.</span>
            </span>
          ) : roomData?.status === "DRAWING" ? (
            <span className="flex items-center gap-1.5 text-xs md:text-sm font-medium text-slate-300">
              <Paintbrush className="w-4 h-4 text-emerald-400" />
              <span>
                <strong className="text-white">{currentDrawer?.name || "Drawer"}</strong> is sketching... Guess in the chat!
              </span>
            </span>
          ) : (
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Whiteboard locked until Phase 3 (Drawing & Guessing)
            </span>
          )}
        </div>

        {canDraw && secretWordToDraw && (
          <div className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold">
            Target: {secretWordToDraw}
          </div>
        )}
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative flex-1 w-full min-h-[380px] md:min-h-[440px] rounded-2xl overflow-hidden glass-panel border border-slate-800 shadow-2xl bg-[#131b2e] cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className="w-full h-full block touch-none"
        />

        {/* Lock Overlay when not Drawing Phase */}
        {!canDraw && roomData?.status !== "DRAWING" && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-3 shadow-lg">
              <Lock className="w-7 h-7 text-indigo-400" />
            </div>
            <h4 className="font-display font-bold text-lg text-white mb-1">
              Whiteboard Inactive
            </h4>
            <p className="text-xs text-slate-400 max-w-xs">
              Drawing opens when the word has been revealed to the assigned Drawer.
            </p>
          </div>
        )}
      </div>

      {/* Drawer Toolbar (Only visible & enabled when Drawer is active) */}
      {canDraw && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 glass-panel-elevated rounded-2xl border-slate-800 animate-fade-in shadow-xl select-none">
          
          {/* Color Palette */}
          <div className="flex items-center gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setIsEraser(false);
                }}
                className={`w-7 h-7 rounded-lg transition-transform transform active:scale-90 ${
                  color === c && !isEraser
                    ? "scale-110 ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900"
                    : "hover:scale-105 opacity-90"
                }`}
                style={{ backgroundColor: c, border: c === "#ffffff" ? "1px solid #64748b" : "none" }}
                title={c}
              />
            ))}
          </div>

          {/* Brush Sizes */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {BRUSH_SIZES.map((b) => (
              <button
                key={b.size}
                onClick={() => {
                  setBrushSize(b.size);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  brushSize === b.size && !isEraser
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Tools: Eraser & Clear Board */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEraser(!isEraser)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isEraser
                  ? "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30"
                  : "bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 border-slate-700/80"
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Eraser</span>
            </button>

            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 transition-all active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

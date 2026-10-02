# Technical Stack Specification — Wordy

## 1. System Architecture
Wordy uses an **In-Memory MERN Stack Architecture** stripped of long-term database storage (MongoDB omitted). All real-time synchronization, room lifecycles, and game state transitions are handled entirely in Node.js server RAM using **Socket.io**.

```
┌───────────────────────────────┐               WebSocket                ┌───────────────────────────────┐
│         React Client          │ <===================================>  │     Node.js / Express Server  │
│  (Vite + Tailwind + Canvas)   │           (Socket.io Events)           │    (In-Memory Game Engine)    │
└───────────────────────────────┘                                        └───────────────────────────────┘
```

---

## 2. Technology Choices

### Frontend
* **Framework:** React.js (initialized via Vite for rapid development and lightweight builds)
* **Styling:** Tailwind CSS (utility classes for clean, responsive game UI)
* **State Management:** React `useState` & `useContext` (local component state and socket instance context)
* **WebSocket Client:** `socket.io-client`
* **Canvas Renderer:** Native HTML5 Canvas API via React `useRef`

### Backend
* **Runtime:** Node.js
* **Framework:** Express.js (serving static files and health routes)
* **WebSocket Server:** `socket.io` (handles real-time socket events, rooms, and timer ticks)
* **In-Memory Store:** Native JavaScript `Map()` objects storing room metadata in RAM

---

## 3. In-Memory Data Structures

Rooms are managed directly in Node.js memory without external database calls:

```javascript
// Server-side In-Memory Storage Structure
const rooms = new Map();

/**
 * Example Room Object Structure:
 * {
 *   roomId: "ROOM123",
 *   status: "LOBBY" | "WORD_INPUT" | "REVEAL" | "DRAWING" | "ROUND_END",
 *   currentRound: 1,
 *   totalRounds: 10,
 *   teams: {
 *     teamA: [{ id: "socket_id_1", name: "Alice" }],
 *     teamB: [{ id: "socket_id_2", name: "Bob" }]
 *   },
 *   scores: { teamA: 0, teamB: 0 },
 *   gameState: {
 *     wordProviderId: "socket_id_1",
 *     drawerId: "socket_id_2",
 *     secretWord: "TREE",
 *     revealedWord: ["_", "_", "_", "_"],
 *     timer: 60
 *   }
 * }
 */
```

---

## 4. Socket.io Event Dictionary

### Client -> Server Events
| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `join-room` | `{ roomId, username }` | Joins a room and triggers auto-team balancing. |
| `submit-secret-word` | `{ roomId, word }` | Sent by the Word Provider during Phase 1. |
| `draw-stroke` | `{ roomId, strokeData }` | Transmits coordinate vector data from the active Drawer. |
| `clear-canvas` | `{ roomId }` | Emitted when the Drawer clears the whiteboard. |
| `submit-guess` | `{ roomId, guess }` | Submits a character or word guess from a teammate. |

### Server -> Client Events
| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `room-state-update` | `{ roomData }` | Syncs updated roster, team assignments, and scores. |
| `prompt-word-input` | `{ providerId }` | Triggers the word input modal for the chosen Word Provider. |
| `secret-word-reveal` | `{ secretWord }` | Sent **exclusively** to the assigned Drawer's socket ID. |
| `canvas-stroke` | `{ strokeData }` | Broadcasts stroke vector data to all non-drawing clients. |
| `word-progress-update` | `{ revealedWord }` | Updates array of revealed letters (e.g., `["_", "_", "_", "E"]`). |
| `timer-tick` | `{ secondsRemaining }` | Syncs current round timer countdown. |
| `round-result` | `{ winnerTeam, score }` | Broadcasts outcome at the end of each round. |

---

## 5. Deployment & Hosting Strategy
* **Frontend:** Deployed on **Vercel** or **Netlify** (Static SPA hosting).
* **Backend:** Deployed on **Render**, **Railway**, or **Fly.io** (Node.js runtime with WebSockets support enabled).
* **Database Infrastructure:** None required. Zero persistent storage costs or maintenance.
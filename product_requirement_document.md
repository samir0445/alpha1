# Product Requirement Document (PRD) — Wordy

## 1. Executive Summary
**Wordy** is a lightweight, real-time multiplayer web game where players join a room, get auto-balanced into two competing teams (Team A and Team B), and play through 10 rounds of drawing and word guessing. 

The primary mechanics feature a cross-team dynamic: a player on Team A submits a secret word, which is revealed strictly to a designated "Drawer" on Team B for 10 seconds. The Drawer then has 60 seconds to illustrate the word on a shared whiteboard while Team B teammates attempt to guess the word letter-by-letter or in full.

Wordy requires zero persistent database overhead, relying entirely on ephemeral in-memory game state management for maximum speed and simplicity.

---

## 2. Core Game Loop & Rules

### 2.1 Room Joining & Team Balancing
* Players enter via a **Room Code** and a chosen **Display Name**.
* As players join, the server auto-balances them into **Team A** or **Team B**.
* New joiners are placed into whichever team has fewer players to maintain numerical balance.

### 2.2 Round Flow (10 Rounds Total)
Each round alternates roles between Team A and Team B.

```
[Phase 1: Word Submission] ---> [Phase 2: Secret Reveal] ---> [Phase 3: Drawing & Guessing] ---> [Phase 4: Round End & Scoring]
      (10 Seconds)                  (10 Seconds)                     (60 Seconds)                      (3 Seconds)
```

1. **Word Submission Phase (10s):**
   * Server randomly selects a "Word Provider" from the active team (e.g., Team A in Round 1).
   * The Word Provider submits any English word.
2. **Secret Reveal Phase (10s):**
   * Server randomly selects a "Drawer" from the opposing team (e.g., Team B).
   * A pop-up notification displays the secret word **only** to the chosen Drawer for 10 seconds.
3. **Drawing & Guessing Phase (60s):**
   * The top of the screen displays character slots matching the word length (e.g., `_ _ _ _` for "TREE").
   * The Drawer uses a digital whiteboard to sketch clues.
   * Teammates on the Drawer's team type guesses into the chat.
4. **Letter Reveal Logic:**
   * If a guesser submits a correct letter or word fragment that contains a correct letter position, that specific character fixes into position for all teammates (e.g., guessing 'E' updates the display to `_ _ _ E`).
5. **Scoring & Round End:**
   * **Success:** If the Drawer's team guesses the full word before the 60-second timer expires, they win the round and score **1 point**.
   * **Failure:** If the 60-second timer reaches zero without a full correct guess, the opposing team scores **1 point**.
   * Game ends after 10 rounds, and the team with the highest score wins.

---

## 3. Detailed Functional Requirements

### 3.1 Lobby & Room Management
* **Create/Join Room:** Input field for Room Code and Username.
* **Auto-balancing Engine:** Dynamically assigns incoming players to the smaller team.
* **Host Controls:** Room creator can kick inactive players or manually trigger "Start Game" when ready.

### 3.2 Digital Whiteboard (Canvas)
* **Active Drawing Control:** Canvas drawing tools (brush size, color picker, eraser, clear board) are enabled **only** for the designated Drawer during Phase 3.
* **Real-time Canvas Sync:** Drawing strokes are streamed immediately to all other participants in the room.

### 3.3 Chat & Guess System
* **Team Chat Filtering:** Guesses made by the drawing team are processed by the game engine for exact letter matching and full word correctness.
* **Word Slot Tracker:** Dynamic letter slot UI (e.g., `_ _ _ _`) updating in real-time as correct characters are identified.

### 3.4 Non-Persistent Session State
* Rooms, scores, teams, canvas strokes, and secret words must be retained **only in memory** on the server.
* Once a room empties or the 10 rounds complete, room memory is purged.

---

## 4. Key User Interfaces

1. **Lobby Screen:** Simple form with Room Code, Display Name, and "Join / Create Room" buttons.
2. **Game Workspace:**
   * **Header Banner:** Displays Round Number (e.g., Round 3/10), Remaining Time, Current Scores (Team A vs. Team B), and Word Blank Slots (`_ _ _ E`).
   * **Left Sidebar:** Roster list divided into Team A and Team B with active roles highlighted (Word Provider, Drawer).
   * **Center Area:** Interactive HTML5 Canvas Board.
   * **Right Sidebar:** Live Chat & Guess input box.
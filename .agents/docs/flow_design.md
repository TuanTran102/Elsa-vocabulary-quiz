# Flow Design: Slido-Like Real-Time Quiz

## Overview

The game follows a **Slido-style host-and-join model**: a **Master** creates a quiz room and receives a 6-digit PIN, **Players** join by entering that PIN and choosing a nickname, then wait in a lobby until the master starts the game. The entire experience is real-time via WebSocket.

---

## 1. User Roles

### 1.1 Master
- Creates a quiz session from an existing quiz template.
- Receives a **6-digit PIN** to share with players.
- Has a **Host Dashboard** to:
  - View the live player list in the waiting room.
  - Control game flow: start, (optionally) advance questions, end early.
  - See per-question answer distribution after time runs out.
- **Only the master can trigger `start_quiz`.**

### 1.2 Player
- Receives the PIN from the master (out-of-band: Slack, chat, screen, etc.).
- Navigates to the join page, enters PIN + a display **nickname**.
- Waits in the **Lobby Screen** until the master starts.
- Answers questions within the time limit.
- Sees real-time score feedback and leaderboard.

---

## 2. Full Game Flow

```mermaid
flowchart TD
    A[Master opens app] --> B[Select quiz template]
    B --> C[System generates 6-digit PIN]
    C --> D[Master shares PIN with players]
    D --> E[Master enters Host Dashboard - waiting room]

    F[Player opens app] --> G[Enter PIN]
    G --> H{PIN valid?}
    H -- No --> I[Show error message]
    H -- Yes --> J[Enter nickname]
    J --> K[Enter Lobby - waiting for master]
    K --> E

    E --> L{Master clicks Start Quiz}
    L --> M[Server broadcasts: quiz_started]

    M --> N[Question 1 begins - countdown starts]
    N --> O[Players submit answers]
    O --> P[Server validates - speed-based scoring]
    P --> Q[Leaderboard updates in real-time]
    Q --> R{Time expired?}
    R -- No --> O
    R -- Yes --> S[Show correct answer + stats]
    S --> T{More questions?}
    T -- Yes --> N
    T -- No --> U[Quiz ends]
    U --> V[Display final leaderboard]
    V --> W[Save results to DB]
```

---

## 3. Screen States

### 3.1 Master Flow
```
[Home] → [Create — Select Quiz] → [Host Dashboard — Waiting Room]
       → [Host Dashboard — In-Game Controls] → [Post-Game Results]
```

### 3.2 Player Flow
```
[Home] → [Join — Enter PIN] → [Join — Enter Nickname] → [Lobby — Waiting]
       → [Play — Question Screen] → [Play — Post-Answer Feedback]
       → [Play — Leaderboard] → [Results — Final Standings]
```

---

## 4. WebSocket Events

### 4.1 Client → Server

| Event | Sender | Payload | Description |
|-------|--------|---------|-------------|
| `create_quiz_session` | Master | `{ quiz_id }` | Master creates a new game room |
| `join_quiz` | Player | `{ pin, nickname }` | Player joins using PIN |
| `start_quiz` | Master | `{ pin }` | Begins the quiz for all players |
| `next_question` | Master | `{ pin }` | Manually advance (if auto-advance disabled) |
| `submit_answer` | Player | `{ pin, question_id, answer }` | Player submits answer |
| `end_quiz` | Master | `{ pin }` | Master ends quiz early |

### 4.2 Server → Client

| Event | Recipients | Payload | Description |
|-------|-----------|---------|-------------|
| `session_created` | Master | `{ pin, game_room_id, quiz_title }` | Confirms room creation |
| `player_joined` | Master + All Players | `{ nickname, player_count, players[] }` | A new player joined |
| `player_left` | Master + All Players | `{ nickname, player_count }` | A player disconnected |
| `quiz_started` | All | `{ total_questions }` | Quiz has begun |
| `question_started` | All | `{ question_id, text, options[], time_limit, question_number, total }` | New question starts |
| `answer_result` | Player (individual) | `{ is_correct, points_awarded, correct_answer }` | Personal answer feedback |
| `question_ended` | All | `{ correct_answer, answer_distribution }` | Question time-up + stats |
| `leaderboard_update` | All | `{ top_10: [{ rank, nickname, score }] }` | Real-time leaderboard |
| `quiz_completed` | All | `{ final_leaderboard[] }` | Quiz finished |
| `host_disconnected` | All Players | `{}` | Master went offline |
| `error` | Requester | `{ code, message }` | Error response |

---

## 5. Session State Machine

```mermaid
stateDiagram-v2
    [*] --> CREATED : Master creates session
    CREATED --> WAITING : Session ready, accepting players
    WAITING --> IN_PROGRESS : Master triggers start_quiz
    IN_PROGRESS --> QUESTION_ACTIVE : question_started fired
    QUESTION_ACTIVE --> QUESTION_ENDED : Timer expires
    QUESTION_ENDED --> QUESTION_ACTIVE : Next question available
    QUESTION_ENDED --> COMPLETED : Last question finished
    IN_PROGRESS --> COMPLETED : Master ends early
    COMPLETED --> [*] : Results saved to DB
```

---

## 6. Runtime Data Models

### 6.1 GameSession (Redis — ephemeral)
```typescript
interface GameSession {
  id: string;               // UUID (maps to GameRoom.id in DB)
  pin: string;              // 6-digit PIN
  quizId: string;           // FK to Quiz template
  gameRoomId: string;       // FK to GameRoom (DB record)
  status: 'waiting' | 'in_progress' | 'completed';
  currentQuestionIndex: number;
  questionStartedAt: number; // Unix ms timestamp — for speed scoring
  players: Record<string, PlayerSession>; // key: socketId
}
```

### 6.2 PlayerSession (Redis — ephemeral)
```typescript
interface PlayerSession {
  playerId: string;     // UUID generated at join time
  socketId: string;
  nickname: string;
  score: number;
  joinedAt: number;     // Unix ms timestamp
}
```

### 6.3 GameRoom (PostgreSQL — persistent)
Lives in DB for record-keeping; created when master creates session, status updated throughout game. See `db_design.md` for full schema.

---

## 7. PIN Generation & Session Lifecycle

- **PIN format**: 6 digits (`000000`–`999999`), checked for uniqueness among active Redis sessions.
- **Collision handling**: If PIN collides, regenerate (max 5 attempts).
- **Redis TTL**: All session keys expire after **2 hours** of inactivity.
- **Player reconnect**: Player can re-enter PIN + same nickname to rejoin an in-progress game.
- **Master reconnect**: A `masterToken` (short-lived JWT) is stored in `localStorage` and used to reclaim host privileges on page reload.

```
Redis Key Namespace (by PIN):
  session:{pin}                              → GameSession JSON        (TTL: 2h)
  session:{pin}:scores                       → ZSET leaderboard        (TTL: 2h)
  session:{pin}:q:{question_id}:dist         → HASH answer distribution (TTL: 1h)
  session:{pin}:answered:{q_id}:{player_id}  → "1" idempotency flag    (TTL: 1h)
```

---

## 8. Permission Model

| Action | Master | Player | Server Validation |
|--------|--------|--------|-------------------|
| Create session | ✅ | ❌ | No auth required (any client can be master) |
| Start quiz | ✅ | ❌ | `socket.data.masterSocketId === socket.id` |
| Advance question | ✅ | ❌ | Same — master socket check |
| End quiz early | ✅ | ❌ | Same — master socket check |
| Submit answer | ❌ | ✅ | `socket.data.role === 'player'` + session `in_progress` |
| View leaderboard | ✅ | ✅ | Public within the room |

---

## 9. Frontend Routes

```
/                   → HomePage       (choose: Host or Join)
/create             → CreatePage     (Master: pick quiz, create session)
/host/:pin          → HostDashboard  (Master: waiting room + in-game controls)
/join               → JoinPage       (Player: enter PIN)
/lobby/:pin         → LobbyPage      (Player: waiting for master)
/play/:pin          → PlayPage       (Player: answer questions)
/results/:pin       → ResultsPage    (All: final leaderboard)
```

---

## 10. Detailed Sequence: Join & Start Flow

```mermaid
sequenceDiagram
    participant M as Master Client
    participant S as WebSocket Server
    participant R as Redis
    participant DB as PostgreSQL
    participant P1 as Player 1 (Alice)
    participant P2 as Player 2 (Bob)

    M->>S: create_quiz_session { quiz_id }
    S->>DB: INSERT INTO game_rooms (pin, quiz_id, status=WAITING)
    S->>R: SET session:{pin} = GameSession JSON
    S-->>M: session_created { pin: "483921", game_room_id }

    P1->>S: join_quiz { pin: "483921", nickname: "Alice" }
    S->>R: Add Alice to session.players
    S-->>P1: join_confirmed { playerId, players[] }
    S-->>M: player_joined { nickname: "Alice", player_count: 1 }

    P2->>S: join_quiz { pin: "483921", nickname: "Bob" }
    S->>R: Add Bob to session.players
    S-->>P2: join_confirmed { playerId, players[] }
    S-->>M: player_joined { nickname: "Bob", player_count: 2 }
    S-->>P1: player_joined { nickname: "Bob", player_count: 2 }

    M->>S: start_quiz { pin: "483921" }
    S->>R: Update session.status = in_progress
    S->>DB: UPDATE game_rooms SET status=IN_PROGRESS, started_at=now()
    S-->>M: quiz_started { total_questions: 5 }
    S-->>P1: quiz_started { total_questions: 5 }
    S-->>P2: quiz_started { total_questions: 5 }

    S->>R: Set questionStartedAt = Date.now()
    S-->>M: question_started { q_id, text, options, time_limit: 30, question_number: 1, total: 5 }
    S-->>P1: question_started { ... }
    S-->>P2: question_started { ... }

    P1->>S: submit_answer { pin, question_id, answer: "cat" }
    S->>R: SETNX idempotency key → 1 (new)
    S->>R: ZINCRBY session:{pin}:scores 850 {alice_player_id}
    S-->>P1: answer_result { is_correct: true, points_awarded: 850 }
    S-->>M: leaderboard_update { top_10 }
    S-->>P1: leaderboard_update { top_10 }
    S-->>P2: leaderboard_update { top_10 }
```

---

## 11. Changes from Previous Design

| Aspect | Old Design | New Design (Slido-like) |
|--------|-----------|------------------------|
| Join flow | Player browses quiz list from DB | Player enters 6-digit PIN |
| Player identity | `User` record in PostgreSQL | Ephemeral nickname (no account) |
| Quiz start | Auto-starts on page load | Master clicks "Start Quiz" |
| Waiting room | Not present | Lobby screen with live player list |
| Roles | No differentiation | Master vs Player |
| Session concept | `QuizSession` (user + quiz join record) | `GameRoom` (live room) + `PlayerResult` (post-game) |
| Host controls | Not present | Full host dashboard |
| PIN | Not present | 6-digit PIN |
| Player reconnect | Not supported | Supported via PIN + nickname |
| DB for users | Required (`users` table) | Not required (guests only) |

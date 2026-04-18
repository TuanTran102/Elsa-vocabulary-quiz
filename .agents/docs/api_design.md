# API Documentation: Real-Time Quiz Feature

The Quiz API consists of two distinct layers. A traditional **RESTful HTTP API** manages stateless fetching of pre-quiz and historical data, while a persistent **WebSocket Interface** handles the high-frequency interactive features of an active quiz session.

---

## 1. REST API (HTTP)

Used for actions that do not require real-time streaming, such as authentication, browsing available quizzes, and viewing historical results.

### 1.1 `GET /api/v1/quizzes`
Retrieves a paginated list of quizzes available to the user.

**Response** (200 OK)
```json
{
  "data": [
    {
      "id": "q-1234",
      "title": "Beginner Vocabulary Mix",
      "status": "ACTIVE",
      "started_at": "2026-04-17T12:00:00Z"
    }
  ],
  "meta": { "total": 1, "page": 1 }
}
```

### 1.2 `GET /api/v1/quizzes/:id`
Retrieves detailed metadata about a specific quiz before joining.

**Response** (200 OK)
```json
{
  "id": "q-1234",
  "title": "Beginner Vocabulary Mix",
  "status": "ACTIVE",
  "questions_count": 10
}
```

### 1.3 `GET /api/v1/quizzes/:id/leaderboard`
Fetches the historical, finalized leaderboard of a quiz that has ended (fetched from PostgreSQL instead of Redis).

**Response** (200 OK)
```json
{
  "quiz_id": "q-1234",
  "leaderboard": [
    {
      "rank": 1,
      "user_id": "u-987",
      "username": "vocab_master",
      "total_score": 1400
    }
  ]
}
```

---

## 2. WebSocket Interface (Socket.io)

For real-time functionality during an active `status: ACTIVE` quiz session. All connections happen over a namespace (e.g., `/live-quiz`).

### 2.1 Client $\to$ Server Events (Requests)

#### `join_quiz`
Sent by the client when they explicitly enter the quiz lobby or start participating.
* **Payload**:
  ```json
  {
    "quiz_id": "q-1234"
  }
  ```
  *(Note: Authentication token is typically validated during the initial hardware handshake, so user_id is inferred by the server, securely).*

#### `submit_answer`
Sent immediately when a participant taps or clicks an option for a question.
* **Payload**:
  ```json
  {
    "quiz_id": "q-1234",
    "question_id": "ques-555",
    "answer": "B"
  }
  ```

---

### 2.2 Server $\to$ Client Events (Broadcasting)

#### `quiz_joined` (Direct to Client)
Sent back specifically to the client who initiated `join_quiz` to acknowledge successful entrance.
* **Payload**:
  ```json
  {
    "status": "success",
    "current_score": 0,
    "room": "quiz_q-1234"
  }
  ```

#### `participant_joined` (Broadcasted to Room)
Fired when any new user connects to the room, so UI headers showing "Total Players" updates instantly.
* **Payload**:
  ```json
  {
    "user_id": "u-111",
    "username": "new_player",
    "total_participants": 42
  }
  ```

#### `question_started` (Broadcasted to Room)
Sent by the server when the timer ticks over to a new question. This is how clients sync up without hitting refresh.
* **Payload**:
  ```json
  {
    "question_id": "ques-555",
    "content": "What is the synonym of 'Ephemeral'?",
    "options": ["A. Permanent", "B. Temporary", "C. Strong", "D. Beautiful"],
    "time_limit_seconds": 15,
    "ends_at": "2026-04-17T12:05:15Z"
  }
  ```

#### `leaderboard_update` (Broadcasted to Room)
The core feature event. Pushed synchronously from the Redis aggregate pipeline every time scores shift meaningfully, or at a fixed interval (e.g. 500ms) over rolling submissions to avoid UI flickering.
* **Payload**:
  ```json
  {
    "rankings": [
      { "rank": 1, "username": "player_one", "score": 1050 },
      { "rank": 2, "username": "the_challenger", "score": 900 }
    ]
  }
  ```

#### `quiz_ended` (Broadcasted to Room)
Indicates the quiz master or internal cron has closed the quiz. Clients push rendering to a final summary screen.
* **Payload**:
  ```json
  {
    "message": "Quiz has concluded. Evaluating final results."
  }
  ```

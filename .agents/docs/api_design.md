# API Documentation: Slido-Like Real-Time Quiz

The Quiz API consists of two layers: a **RESTful HTTP API** for session lifecycle (creation, validation) and metadata, and a **WebSocket Interface** for real-time game flow and live leaderboard updates.

---

## 1. REST API (HTTP)

### 1.1 `GET /api/v1/quizzes`
Retrieves quiz templates available for a Master to host.

**Response** (200 OK)
```json
{
  "data": [
    {
      "id": "q-1234",
      "title": "Beginner Vocabulary Mix",
      "questions_count": 10
    }
  ]
}
```

### 1.2 Session Management

#### `POST /api/v1/sessions`
Creates a new `GameRoom` (Master action). Generates a unique 6-digit PIN and initializes state in Redis.

**Request Body**
```json
{
  "quiz_id": "q-1234"
}
```

**Response** (201 Created)
```json
{
  "session_id": "uuid",
  "game_room_id": "uuid",
  "pin": "483921",
  "quiz_title": "Beginner Vocabulary Mix"
}
```

#### `GET /api/v1/sessions/:pin`
Validates a PIN before a player joins. Returns basic room info.

**Response** (200 OK)
```json
{
  "game_room_id": "uuid",
  "quiz_title": "Beginner Vocabulary Mix",
  "status": "WAITING",
  "player_count": 12
}
```

### 1.3 `GET /api/v1/quizzes/:id/leaderboard`
Fetches historical results for a quiz template from PostgreSQL.

---

## 2. WebSocket Interface (Socket.io)

### 2.1 Client → Server Events

#### `join_quiz` (Player)
Sent when a player joins a room with a PIN and nickname.
* **Payload**: `{ "pin": "483921", "nickname": "Alice" }`

#### `start_quiz` (Master)
Triggers the transition from `WAITING` to `IN_PROGRESS`.
* **Payload**: `{ "pin": "483921" }`

#### `submit_answer` (Player)
Sent when a participant selects an option.
* **Payload**: `{ "pin": "483921", "question_id": "q-1", "answer": "B" }`

#### `next_question` (Master)
Manually advances the quiz to the next question.
* **Payload**: `{ "pin": "483921" }`

---

## 2.2 Server → Client Events (Broadcasting)

#### `player_joined`
Broadcasted to all room members when a new player enters the lobby.
* **Payload**: `{ "nickname": "Alice", "player_count": 13, "players": ["Alice", "Bob", ...] }`

#### `quiz_started`
Fired when the master starts the game.
* **Payload**: `{ "total_questions": 10 }`

#### `question_started`
Pushed when a new question becomes active.
* **Payload**:
  ```json
  {
    "question_id": "q-1",
    "text": "Correct translation for 'Apple'?",
    "options": ["A. Quả táo", "B. Quả lê"],
    "time_limit": 15,
    "question_number": 1,
    "total": 10
  }
  ```

#### `answer_result` (Individual)
Direct feedback to the player after submitting an answer.
* **Payload**: `{ "is_correct": true, "points_awarded": 850 }`

#### `leaderboard_update` (Broadcast)
Live standings pushed frequently during the game.
* **Payload**:
  ```json
  {
    "rankings": [
      { "rank": 1, "nickname": "Alice", "score": 2400 },
      { "rank": 2, "nickname": "Bob", "score": 1950 }
    ]
  }
  ```

#### `quiz_completed`
Final event when all questions are answered.
* **Payload**: `{ "final_leaderboard": [...] }`

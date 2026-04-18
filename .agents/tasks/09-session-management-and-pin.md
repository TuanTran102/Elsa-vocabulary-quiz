# Task 09: Session Management & PIN System

## Context
The new Slido-like flow requires a `GameRoom` entity that is distinct from the `Quiz` template. A game room has a 6-digit PIN, tracks live session state in Redis, and is persisted to PostgreSQL for record-keeping. This task implements the backend service and REST endpoints to create and retrieve game rooms.

## Objective
Build the `SessionService` and REST controller to create game rooms with unique PINs, persist them to PostgreSQL, and manage their live state in Redis.

## Acceptance Criteria

### REST Endpoints
- [ ] `POST /api/v1/sessions` — body: `{ quiz_id }`, response: `{ session_id, game_room_id, pin, quiz_title }`
  - Validates that `quiz_id` exists in DB
  - Generates a unique 6-digit PIN (retry up to 5 times on collision)
  - Inserts a `GameRoom` record into PostgreSQL with `status = WAITING`
  - Initializes the Redis `session:{pin}` key with the full `GameSession` JSON (TTL: 2h)
  - Returns the PIN and IDs to the master client
- [ ] `GET /api/v1/sessions/:pin` — response: `{ game_room_id, quiz_title, status, player_count }`
  - Reads from Redis (fast path); falls back to DB if cache miss
  - Returns `404` if PIN not found or session is `COMPLETED`
  - Used by the frontend to validate a PIN before showing the nickname input

### SessionService
- [ ] `createSession(quizId: string): Promise<{ pin, gameRoomId, sessionId }>`
- [ ] `getSession(pin: string): Promise<GameSession | null>`
- [ ] `addPlayer(pin: string, player: PlayerSession): Promise<void>`
- [ ] `removePlayer(pin: string, socketId: string): Promise<void>`
- [ ] `updateStatus(pin: string, status: SessionStatus): Promise<void>`
- [ ] `generatePin(): string` — generates a 6-digit numeric string, checks uniqueness in Redis

### Redis Schema (implemented in this task)
```
session:{pin}          → JSON GameSession object  (TTL: 7200s)
session:{pin}:scores   → ZSET leaderboard         (TTL: 7200s)
```

### TDD Requirements
- 100% unit test coverage for `SessionService` with mocked Redis and Prisma
- Integration/controller tests for both REST endpoints
- Test PIN collision handling (mock Redis to simulate collision on first attempt)
- Test 404 response for completed or missing sessions

## Files to Create
- `src/modules/session/session.service.ts`
- `src/modules/session/session.controller.ts`
- `src/modules/session/session.module.ts`
- `src/modules/session/session.types.ts` (interfaces: `GameSession`, `PlayerSession`)
- `src/__tests__/modules/session/session.service.test.ts`
- `src/__tests__/modules/session/session.controller.test.ts`

## Dependencies
- Task 01 (Redis setup) ✅
- Task 15 (DB schema migration — `game_rooms` table must exist) ✅

## Estimated Effort: Medium (3–4h)

# Plan: 09 Session Management & PIN System

## Objective
Build the `SessionService` and `SessionController` to manage game rooms with unique 6-digit PINs, using Redis for real-time state and PostgreSQL for persistence, following TDD.

## Overview
This task shifts the application from a single-player quiz to a room-based multiplayer experience. It introduces the `GameRoom` entity and a 6-digit PIN system. The system will use Redis as a high-performance "hot" storage for active sessions (with TTL) and PostgreSQL as the "cold" storage for persistent records.

## Implementation Steps

### Step 1: Session Types and Redis Schema
1. **Goal**: Define consistent data structures for sessions and players.
2. **Logic**:
   - Create `src/modules/session/session.types.ts`.
   - Define `SessionStatus` enum: `WAITING`, `IN_PROGRESS`, `COMPLETED`.
   - Define `PlayerSession` interface: `{ nickname: string, socketId: string, score: number, lastActive: number }`.
   - Define `GameSession` interface: `{ id: string, pin: string, quizId: string, quizTitle: string, status: SessionStatus, playerCount: number }`.
3. **Tests**: Verify types are correctly exported and compatible with current Prisma types.

### Step 2: Session Service Implementation (TDD)
1. **Goal**: Implement core logic for PIN generation, session creation, and state management.
2. **Logic**:
   - `generatePin()`: Generate a random 6-digit numeric string. Use a while loop (max 5 attempts) to check `EXISTS session:{pin}` in Redis to ensure uniqueness.
   - `createSession(quizId: string)`:
     - Check if `quizId` exists in PostgreSQL via `PrismaService`.
     - Generate a unique PIN using `generatePin()`.
     - Create a `GameRoom` record in PostgreSQL with `status: WAITING`.
     - Create a `GameSession` object and save it to Redis at `session:{pin}` using `JSON.stringify` or RedisJSON if available (standard Redis string `SET` with TTL 2h is preferred for simplicity here).
     - Return `{ pin, gameRoomId, quizTitle }`.
   - `getSession(pin: string)`:
     - Retrieve from Redis.
     - Fallback: If not in Redis, check PostgreSQL `GameRoom` table. If found and not `COMPLETED`, re-populate Redis.
     - Return `null` if expired or status is `COMPLETED`.
   - `updateStatus(pin: string, status: SessionStatus)`: Update both Redis and PostgreSQL.
2. **Tests**:
   - Create `src/__tests__/modules/session/session.service.test.ts`.
   - **TDD Requirement**: Mock `PrismaService` and `RedisService`.
   - **Test Case**: Verify `createSession` fails if `quizId` is invalid.
   - **Test Case**: Verify PIN collision by mocking `redis.exists` to return `true` then `false`.
   - **Test Case**: Verify TTL is set correctly (7200s).
   - **Test Case**: Verify `getSession` recovery from DB on cache miss.

### Step 3: Session Controller and REST API (TDD)
1. **Goal**: Expose the session management via REST endpoints.
2. **Logic**:
   - Implement `SessionController` with:
     - `POST /api/v1/sessions`: Body `{ quiz_id }`. Calls `sessionService.createSession`.
     - `GET /api/v1/sessions/:pin`: Calls `sessionService.getSession`.
   - Ensure response formats match acceptance criteria:
     - `POST` response: `{ session_id, game_room_id, pin, quiz_title }`
     - `GET` response: `{ game_room_id, quiz_title, status, player_count }`
3. **Tests**:
   - Create `src/__tests__/modules/session/session.controller.test.ts`.
   - Use `supertest` to mock HTTP requests to the controller.
   - Verify `404` for missing PINs or completed sessions.

### Step 4: Module Integration
1. **Goal**: Wire the new components into the NestJS-like architecture.
2. **Logic**:
   - Create `src/modules/session/session.module.ts`.
   - Provide `SessionService` and `SessionController`.
   - Import `RedisModule` and `PrismaModule` (or equivalent core modules).
   - Register the module in `app.ts` or the main module.
3. **Tests**: Smoke test the container initialization.

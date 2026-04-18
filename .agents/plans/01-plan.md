# Implementation Plan: 01-setup-infrastructure

## Goal
Establish the foundational environments for the Real-Time Vocabulary Quiz system, including containerized infrastructure, a structured Node.js/Express backend, and a Vue.js/PrimeVue frontend.

## TDD Approach
- **Infrastructure**: Verified via manual connectivity checks and backend startup integration tests.
- **Backend**: 
  - Integration tests for Express server reachability (Health check).
  - Database connection connectivity tests using Prisma and IORedis.
- **Frontend**:
  - Smoke tests to ensure the application mounts correctly.
  - Snapshot/Component tests for PrimeVue integration.

## Implementation Steps

### 1. External Infrastructure (`/infra`)
- Create standard `docker-compose.yml` in an `infra/` directory.
- Define services:
  - `postgres`: Version 15+, exposed on `5432`.
    - **Healthcheck**: Verify `pg_isready`.
  - `redis`: Latest version, exposed on `6379`.
    - **Healthcheck**: Verify `redis-cli ping`.
- **Validation**:
  - `docker-compose up -d`
  - verify connectivity via local clients (pgAdmin/TablePlus/redis-cli).

### 2. Backend Foundation (`/backend`)
- **Initialization**:
  - Node.js project setup (`npm init -y`).
  - TypeScript initialization (`npx tsc --init`).
  - Configure `package.json` scripts: `dev`, `build`, `start`, `test`.
- **Dependency Management**:
  - Main: `express`, `cors`, `dotenv`, `socket.io`, `@socket.io/redis-adapter`, `ioredis`, `@prisma/client`.
  - Dev: `typescript`, `ts-node-dev`, `jest`, `supertest`, `ts-jest`, `@types/express`, `@types/node`, `prisma`, `jest-mock-extended`.
- **Structure Setup**:
  - Create directory skeleton as per `detail_design.md`:
    - `src/config/`, `src/core/`, `src/modules/auth/`, `src/modules/quiz/`, `src/modules/realtime/`, `src/modules/leaderboard/`.
- **Test Phase (Red)**:
  - Create `src/__tests__/health.test.ts` to expect status `200` from `GET /health` and `{ status: 'UP' }`.
  - Create `src/__tests__/db.test.ts` to verify Prisma client can query the database version.
  - Create `src/__tests__/socket.test.ts` to verify client-server Socket.io basic handshake.
- **Implementation Phase (Green)**:
  - Setup `src/app.ts` with minimal middleware (CORS, JSON).
  - Setup `src/server.ts` to initialize Socket.io with Redis Adapter.
  - Implement `/health` route.
  - Initialize Prisma (`npx prisma init`) and configure connection string.
  - Define `User` and `Quiz` models in `schema.prisma` and run initial migration.

### 3. Frontend Foundation (`/frontend`)
- **Initialization**:
  - Vite Vue-TS template scaffold.
  - Install dependencies: `primevue`, `primeicons`, `pinia`, `vue-router`, `socket.io-client`.
  - Configure `vitest` for unit testing.
- **Structure Setup**:
  - Create directory skeleton:
    - `src/views/`, `src/components/`, `src/composables/`, `src/store/`, `src/services/`.
- **Test Phase (Red)**:
  - Create `src/__tests__/App.spec.ts` to ensure the root component renders a PrimeVue element (e.g., a Button).
- **Implementation Phase (Green)**:
  - Configure `main.ts` to register global components (PrimeVue) and plugins (Pinia, Router).
  - Setup a "Lobby" view as the default route.
  - Create a basic "Hello World" component using PrimeVue buttons/cards.

---

## Clarification Questions
1. Should I include a specific set of database migrations for a `User` or `Quiz` model in this phase, or keep it purely empty config?
   - **Answer**: Yes, include `User` and `Quiz` models.
2. For the Docker setup, should I use healthchecks in `docker-compose.yml` to ensure services are ready before backend starts?
   - **Answer**: Yes, include healthchecks for Postgres and Redis.
3. Should I add an Example test case for Socket.io connectivity in this task?
   - **Answer**: Yes, add a basic Socket.io handshake test.

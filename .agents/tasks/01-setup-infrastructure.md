# Task 1: Setup Infrastructure and Base Architecture

**Relevant Docs:**
- `system_design.md`: Architecture context & Tech Stack choices.
- `detail_design.md`: Backend/Frontend folder structures (Domain-Driven Design).

## Objective
Establish the foundational environments for both backend (Node.js/Express) and frontend (Vue.js/PrimeVue). Provision local development databases (Redis, PostgreSQL) via Docker.

## Detailed Steps

1. **Dockerized Environment (`infra/`)**:
   - Create a `docker-compose.yml` defining two services:
     - `postgres`: Version 15+, port 5432, specific user/password setup.
     - `redis`: Latest version, port 6379.
   - Run `docker-compose up -d` to verify connectivity.

2. **Backend Foundation (`backend/`)**:
   - Run `npm init -y` and initialize a TypeScript project (`npx tsc --init`).
   - Modify `package.json` with scripts for `dev` (using ts-node-dev or nodemon) and `build`.
   - Install core dependencies: `express`, `cors`, `dotenv`, `socket.io`, `@socket.io/redis-adapter`, `ioredis`, `@prisma/client`.
   - Install dev dependencies: `typescript`, `@types/express`, `@types/node`.
   - Create the exact Domain-Driven Folder structure defined in `detail_design.md`:
     - `src/config/`, `src/core/`, `src/modules/auth/`, `src/modules/quiz/`, `src/modules/realtime/`, `src/modules/leaderboard/`.
   - Setup basic Express entry point in `src/app.ts` with CORS and JSON middleware.

3. **Frontend Foundation (`frontend/`)**:
   - Initialize Vite project: `npm create vite@latest . -- --template vue-ts`.
   - Install dependencies: `primevue`, `primeicons`, `pinia`, `vue-router`, `socket.io-client`.
   - (Optional) Install `TailwindCSS` for utility classes to aid PrimeVue.
   - Setup folder structure: `src/views/`, `src/components/`, `src/composables/`, `src/store/`.
   - Mount PrimeVue, Pinia, and Router inside `main.ts`.

## Acceptance Criteria
- [ ] Docker containers are up and running smoothly.
- [ ] Backend Express server successfully spins up `Hello World` on port 3000.
- [ ] Frontend Vite server is accessible on port 5173 with a visible PrimeVue component (e.g. a sample Button).

# Implementation Plan - Fix Quiz Loading and Session Creation

The user is unable to load the quiz list in the `CreatePage`. This is due to a mismatch between the backend API response format and the frontend's expectations. Additionally, session creation is likely broken due to mismatched field names and role management (masterToken).

## Proposed Changes

### Frontend

#### 1. Fix `CreatePage.vue`
- Update `fetchQuizzes` to extract `data` from the response.
- Update `quizzes` assignment to handle the `questions_count` provided by the backend or adjust the backend to provide the expected structure.
- Update `createSession` to use `quiz_id` (snake_case) in the request body.
- Update `createSession` to correctly handle the `{ data: { ... } }` response format and map fields (`pin`, `game_room_id`).

#### 2. Update `CreatePage.spec.ts`
- Update mocks to match the `{ data: ... }` response format.

### Backend

#### 3. Align `QuizService` with Frontend expectations
- Adjust `getQuizzes` to return `_count: { questions: number }` to match the frontend's PrimeVue-heavy type definitions and simplify data fetching.
- *Rationale*: Frontend components often rely on nested objects from Prisma-like responses.

## Verification Plan

### Automated Tests
- Run `npm run test` in `frontend` to verify `CreatePage.spec.ts` passes.
- Run `node --experimental-vm-modules node_modules/jest/bin/jest.js` in `backend` to ensure no regressions.

### Manual Verification
- Verify that quizzes now load in the `/create` page.
- Verify that starting a quiz successfully navigates to the host dashboard.

# Plan: Task 3 - Discovery REST APIs

This plan outlines the implementation of the core REST endpoints for fetching available quizzes and detailed quiz configurations, following a Test-Driven Development (TDD) approach and Domain-Driven Design (DDD) principles.

## 1. Objectives
- Implement `QuizRepository` for data access.
- Implement `QuizService` for business logic.
- Implement `QuizController` to handle REST requests.
- Create `DummyAuthMiddleware` for simulated authentication.
- Integrate routes into the main application.

## 2. Proposed Changes

### 2.1 Backend: Quiz Module (`src/modules/quiz/`)
We will organize the quiz module into nested directories as per `detail_design.md`.

- `src/modules/quiz/repositories/quiz.repository.ts`
- `src/modules/quiz/services/quiz.service.ts`
- `src/modules/quiz/controllers/quiz.controller.ts`
- `src/modules/quiz/quiz.routes.ts`

### 2.2 Backend: Core (`src/core/`)
- `src/core/middlewares/dummy-auth.middleware.ts`: Simulates authentication by injecting a mock user into the request context.

### 2.3 Integration
- `src/app.ts`: Register the quiz routes.

## 3. Implementation Steps

### Phase 1: Infrastructure & Middleware (TDD)
1. **Test**: Create `src/__tests__/core/middlewares/dummy-auth.middleware.test.ts`.
   - Verify it adds `user_id` to `req` object.
2. **Implement**: Create `src/core/middlewares/dummy-auth.middleware.ts`.

### Phase 2: Repository Layer (TDD)
1. **Test**: Create `src/__tests__/modules/quiz/repositories/quiz.repository.test.ts`.
   - Mock Prisma client.
   - Test `findAll()`: Should return a list of quizzes.
   - Test `findById(id)`: Should return a specific quiz with its questions.
2. **Implement**: Create `src/modules/quiz/repositories/quiz.repository.ts`.

### Phase 3: Service Layer (TDD)
1. **Test**: Create `src/__tests__/modules/quiz/services/quiz.service.test.ts`.
   - Mock `QuizRepository`.
   - Test `getQuizzes()`: Should call repository and return data.
   - Test `getQuizById(id)`: Should call repository and return data.
2. **Implement**: Create `src/modules/quiz/services/quiz.service.ts`.

### Phase 4: Controller Layer (TDD)
1. **Test**: Create `src/__tests__/modules/quiz/controllers/quiz.controller.test.ts`.
   - Mock `QuizService`.
   - Test `index()`: Should return 200 and formatted list.
   - Test `show()`: Should return 200 and formatted quiz details.
2. **Implement**: Create `src/modules/quiz/controllers/quiz.controller.ts`.

### Phase 5: Routing & Integration (Integration Tests)
1. **Test**: Create `src/__tests__/app-integration.test.ts`.
   - Test `GET /api/v1/quizzes`: End-to-end check with database.
   - Test `GET /api/v1/quizzes/:id`: End-to-end check with database.
2. **Implement**:
   - Create `src/modules/quiz/quiz.routes.ts`.
   - Update `src/app.ts` to include `/api/v1/quizzes` routes.

## 4. Acceptance Criteria Verification
- [ ] `GET /api/v1/quizzes` returns seeded quizzes in the specified format.
- [ ] `GET /api/v1/quizzes/:id` returns quiz metadata and nested questions.
- [ ] 100% test coverage for new components.

## 5. Clarification Needed
- **Question Details**: For `GET /api/v1/quizzes/:id`, should we exclude `correctAnswer` from the returned questions to prevent cheating before the real-time session starts?
- **Response Format**: `api_design.md` shows `questions_count` in the detail response but doesn't show the `questions` array. The task description says "including its nested questions". I will proceed with including the questions but excluding `correctAnswer` unless instructed otherwise.

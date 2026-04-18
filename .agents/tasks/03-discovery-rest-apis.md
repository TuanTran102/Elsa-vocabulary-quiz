# Task 3: Discovery REST APIs

**Relevant Docs:**
- `api_design.md`: Section 1 (REST Endpoints).
- `detail_design.md`: Section 4 (Implementation Detail).

## Objective
Implement core REST endpoints for global quiz discovery and fetching detailed quiz configurations.

## Detailed Steps

1. **Quiz Repository (`src/modules/quiz/quiz.repository.ts`)**:
   - Create a repository class that uses the Prisma Client to:
     - `findAll()`: Fetch all available quizzes.
     - `findById(id)`: Fetch a specific quiz including its nested questions.

2. **Quiz Service & Controller (`src/modules/quiz/`)**:
   - Implement `QuizService` to handle any business logic.
   - Implement `QuizController` with methods for:
     - `GET /api/v1/quizzes`: Returns a list of quizzes.
     - `GET /api/v1/quizzes/:id`: Returns quiz metadata and questions.

3. **Dummy Auth Middleware**:
   - Set up a placeholder middleware to inject a `user_id` into the request context (simulating a logged-in user) for testing the quiz flow.

4. **Routes Integration**:
   - Wire up the new controllers into the main Express application in `app.ts`.

## Acceptance Criteria
- [ ] `GET /api/v1/quizzes` returns a list of seeded quizzes.
- [ ] `GET /api/v1/quizzes/:id` returns the quiz with all its questions.
- [ ] API responses follow the format defined in `api_design.md`.

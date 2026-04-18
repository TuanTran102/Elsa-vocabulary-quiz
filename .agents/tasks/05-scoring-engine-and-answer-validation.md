# Task 5: Scoring Engine & Answer Validation

**Relevant Docs:**
- `detail_design.md`: Section 3 (Scoring Algorithm).
- `api_design.md`: Event `submit_answer`.

## Objective
Implement the "brain" of the quiz: validating answers, calculating scores, and preventing duplicate submissions.

## Detailed Steps

1. **Answer Submission Listener**:
   - Add a listener for the `submit_answer` event in the Quiz Gateway.
   - Payload: `{ quiz_id, question_id, selected_option }`.

2. **Idempotency Check (Redis)**:
   - Use Redis `SETNX` with a key format `quiz:{quiz_id}:user:{user_id}:question:{question_id}`.
   - If the key already exists, reject the submission to prevent double-scoring.

3. **Validation & Scoring Logic**:
   - Fetch the question from the database/cache and compare with the submitted option.
   - If correct, apply the scoring algorithm: `BasePoints + SpeedBonus`.
   - `SpeedBonus` is calculated based on the timestamp difference between question push and answer submission.

4. **Persistence**:
   - Asynchronously save the user's answer and calculated score to the PostgreSQL `Answer` table for historical tracking.

## Acceptance Criteria
- [ ] Submitting the correct answer increments the score correctly.
- [ ] Users cannot submit multiple answers for the same question (Idempotency check works).
- [ ] Answers are successfully saved to PostgreSQL.

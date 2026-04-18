# Task 8: Frontend Quiz Experience & UI

**Relevant Docs:**
- `detail_design.md`: Section 2 (Vue Components).
- `api_design.md`: WebSocket Events.

## Objective
Implement the interactive quiz interface and real-time leaderboard visualization.

## Detailed Steps

1. **Quiz Room Arena (`src/views/QuizRoom.vue`)**:
   - Display the current question and active timer.
   - Render multiple-choice buttons for options using PrimeVue.

2. **Answer Interaction**:
   - When an option is clicked:
     - Emit `submit_answer` via Socket.
     - Disable buttons to prevent double-clicks.
     - Show a loading/feedback state.

3. **Real-time Leaderboard UI**:
   - Use PrimeVue `DataTable` to display the `leaderboard` array from Pinia.
   - Add simple CSS transitions for rank changes to make it look "live".

4. **Polishing & UX**:
   - Use PrimeVue `Toast` to show points earned or error messages.
   - Add a "Play Again" or "Finish" screen when the quiz concludes.

## Acceptance Criteria
- [ ] User can walk through a full quiz cycle: Join -> Answer -> See Score.
- [ ] Leaderboard updates visually in the UI without page refreshes.
- [ ] UI is responsive and follows the premium aesthetic requirements.

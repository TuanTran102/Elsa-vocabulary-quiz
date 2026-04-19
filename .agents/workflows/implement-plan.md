---
description: Implement a detailed plan using TDD principles
---

# Workflow: Implement Plan

// turbo-all

## 1. Preparation
1. Read the task file in `.agents/tasks/` to understand the goal.
2. Read the corresponding plan file in `.agents/plans/`.
3. Verify all necessary context (documentation, existing code) is understood.
4. If anything is unclear, **ask the user** for clarification before starting.

## 2. Execution (TDD Cycle)
Follow the phases defined in the code plan. For each phase:

### Phase: [Phase Name]
1. **RED (Test First)**: 
   - Create or update test files as specified in the plan.
   - Run the tests and confirm they **FAIL** (as expected).
2. **GREEN (Implementation)**:
   - Implement the minimal amount of code to make the tests **PASS**.
   - Run the tests again to verify success.
3. **REFACTOR**:
   - Clean up the code, improve structure, and ensure adherence to project standards.
   - Run tests again to ensure no regressions.

## 3. Quality Assurance
1. **Full Test Suite**: Run all related tests in the module to ensure no side effects.
2. **Coverage**: Ensure unit test coverage meets the requirement for the new code.
3. **Static Analysis**:
   - Ensure no TypeScript errors: `npx tsc --noEmit`.
   - Ensure no Linting errors.
4. **Manual Verification**: If there's a UI component, perform a brief manual check or use a screenshot to verify layout.

## 4. Documentation & Cleanup
1. Update docs in `.agents/docs/` if the implementation changed the design or API.
2. Update the task file in `.agents/tasks/` to reflect completion.
3. Remove any temporary files or debug artifacts.

## 5. Final Report
- Summarize the changes made.
- List passing tests.
- Ask the user for feedback or approval.
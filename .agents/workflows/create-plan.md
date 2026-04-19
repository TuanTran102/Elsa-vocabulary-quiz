---
description: Create plan
---

# Workflow: Create Plan
## 1. Analysis
1. Read the task file in `.agents/tasks/`.
2. Analyze existing implementation and documentation in `.agents/docs/` to identify constraints.
3. Identify all affected files and potential side effects.
## 2. Planning (The Plan File)
Create a plan file in `.agents/plans/[TASK_KEY]-plan.md` with the following sections:
### Section 1: Objectives & Scope
- Briefly summarize what is being built.
- List specific goals and out-of-scope items.
### Section 2: Technical Approach
- Describe the logic, data flow, or UI changes.
- Reference relevant design documents (e.g., `api_design.md`, `db_design.md`).
### Section 3: Implementation Phases (TDD Focused)
Break the work into logical phases. For each phase:
- **Phase Name**: A clear title.
- **Test (RED)**: Specific test cases, files to create/update, and key assertions (include edge cases).
- **Implement (GREEN)**: High-level implementation steps (No actual code blocks).
### Section 4: Acceptance Criteria Verification
- A checklist mapping implementation phases back to the task's acceptance criteria.
### Section 5: Clarifications Needed
- List any assumptions made or questions for the user.
## 3. Finalization
1. Ensure the plan is written in **ENGLISH**.
2. Avoid including large code blocks; focus on logic and testing strategy.
3. Present the plan to the user for review and wait for approval before moving to implementation.
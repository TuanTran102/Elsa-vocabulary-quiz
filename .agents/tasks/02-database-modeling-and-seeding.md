# Task 2: Database Modeling & Seeding

**Relevant Docs:**
- `db_design.md`: ER Diagram and Table mapping.
- `detail_design.md`: Section 1 (Domain Model).

## Objective
Establish the relational data structure using Prisma ORM and populate it with initial vocabulary quiz data for development.

## Detailed Steps

1. **Prisma Initialization**:
   - Run `npx prisma init` in the backend directory.
   - Configure the `.env` file with the `DATABASE_URL` pointing to the PostgreSQL container started in Task 1.

2. **Schema Definition (`prisma/schema.prisma`)**:
   - Implement the models: `User`, `Quiz`, `Question`, and `Answer`.
   - Ensure proper relational mapping (e.g., `Question` relates to `Quiz`).
   - Add indexes on `quiz_id` in the `Question` table for performance.

3. **Database Migration**:
   - Run `npx prisma migrate dev --name init_schema` to generate the SQL and update the database.

4. **Seeding Script (`prisma/seed.ts`)**:
   - Create a seeding script that inserts:
     - 1 sample User.
     - 1 Vocabulary Quiz (e.g., "English Essentials").
     - At least 10 vocabulary questions with 4 options and 1 correct answer each.
   - Run the seeder using `npx prisma db seed`.

## Acceptance Criteria
- [ ] `prisma/schema.prisma` is valid and reflects the `db_design.md`.
- [ ] Database contains the seeded quiz and questions.
- [ ] Prisma Client is generated and accessible within the backend code.

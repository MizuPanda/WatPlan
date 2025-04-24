# WatPlan Project Status Summary

---

## Project Context

The **WatPlan** app helps University of Waterloo students manage courses, schedules, degree requirements, and view transcripts. It targets Android, iOS, and Web platforms using **Expo and React Native** for the frontend, with **Supabase** as the backend.

### Key Technical Decisions

- **React Native & Expo:** Cross-platform frontend.
- **Supabase:** Backend, authentication (Google OAuth), and PostgreSQL database.
- **University of Waterloo Open Data API:** Real-time course data.
- **Database Schema Simplification:** Abandoned complex parsing of course requirements. Added a `requirementsDescription` column to store plain-text descriptions directly in the `course_catalog`.
- **JSON-based Degree Requirements:** Storing structured degree requirements as JSON in PostgreSQL for flexibility and maintainability.
- **Concurrency & Batching:** Efficiently seeds over 6000 courses.

### Tools and Libraries Used

- React Native / Expo
- Supabase (PostgreSQL, Auth, Storage)
- Node.js & TypeScript
- University of Waterloo Open Data API
- Jest (Testing)
- node-fetch, dotenv

---

## Implemented Files and Structures

### `/scripts`

#### `seedCourseCatalog.ts`
Seeds UW course catalog.

- `limitConcurrency()` (controls parallelism for database inserts)

#### `seedDegreeProgram.ts`
Upserts degree program details into the database from JSON files.

- `seedDegreeProgram()` (parses JSON and upserts data into `degree_programs` and `degree_requirements` tables)

### `/degrees/math/`

- `cs_bsc_reg_2023.json` (structured JSON for CS Regular 2023)
- `cs_bsc_reg_2024.json` (structured JSON for CS Regular 2024)

### Database Schema

#### `degree_programs`
- `degree_id` (TEXT, PK)
- `plan_year` (INT, PK)
- `coop` (BOOLEAN, PK)
- Other metadata fields (name, short_name, faculty, min_terms, min_major_avg, min_cumul_avg, units_rules JSONB)

#### `degree_requirements`
- `degree_id` (TEXT, FK to degree_programs)
- `plan_year` (INT, FK to degree_programs)
- `coop` (BOOLEAN, FK to degree_programs)
- `spec` (JSONB, entire JSON requirements spec)

---

## Known Issues & Edge Cases

- **Supabase UI Bug:** Boolean fields (`coop`) occasionally displayed incorrectly (text vs boolean issue), purely visual and doesn't impact database integrity.

---

## Remaining TODOs (Actionable LLM Prompts)

### Task 1: Complete User Authentication

**Prompt:**
"Complete the Supabase user authentication setup in React Native. Ensure Google OAuth login/logout functionality works seamlessly."

### Task 2: Setup User Database Schema

**Prompt:**
"Design and implement the Supabase database schema for user profiles, including fields for degree plan association (degree_id, plan_year, coop), completed courses, and other user-specific data."

### Task 3: Build Login UI

**Prompt:**
"Implement a polished login screen in React Native using Expo, supporting Google OAuth via Supabase authentication."

### Task 4: Degree Program Parser (Roadmap Builder)

**Prompt:**
"Write a TypeScript parser to interpret structured JSON degree requirements stored in the database. This parser should extract the requirements and verify if the user's course selections satisfy these requirements."

### Task 5: Roadmap Builder UI

**Prompt:**
"Create the frontend UI components for the Roadmap Builder feature, allowing users to visualize and adjust their academic course plans according to parsed degree requirements."

### Task 6: Integrate User Course Selections

**Prompt:**
"Develop functionality for users to mark courses as completed or planned, integrating these selections into the roadmap builder to display progress towards degree completion."

---

## Current Status and Next Steps

### Current Status

The UW course catalog (~6000 courses) is seeded into Supabase, and the structured JSON-based degree requirements for two CS Regular programs (2023 and 2024) are successfully stored in the database. The previous complex parsing approach has been abandoned in favor of directly storing plain-text course requirement descriptions and structured JSON-based degree requirements.

### Immediate Next Steps

- **User Authentication:** Finish user authentication with Google OAuth.
- **User Schema:** Design and implement the user database schema.
- **Login Page UI:** Create a smooth login experience.
- **Roadmap Builder Preparation:** Develop the parser for JSON degree requirements and start integrating it into a user-friendly roadmap builder UI.

---

## Important Best Practices (Updated)

- **JSON-based Requirements:** Maintain structured, versioned JSON files for each degree program, providing flexibility and ease of updates.
- **Minimal Schema Complexity:** Keep the database schema straightforward, leveraging JSONB for complex nested structures.
- **Clear Separation of Concerns:** Keep the logic of parsing degree requirements distinct from frontend UI implementation.
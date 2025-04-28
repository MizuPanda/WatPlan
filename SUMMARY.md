# WatPlan Project Status Summary

---

## Project Context

The **WatPlan** app helps University of Waterloo students manage courses, schedules, degree requirements, and view transcripts. It targets Android, iOS, and Web platforms using **Expo and React Native** for the frontend, with **Supabase** as the backend.

### Key Technical Decisions

- **React Native & Expo:** Cross-platform frontend.
- **Supabase:** Backend, authentication (email-based), and PostgreSQL database.
- **University of Waterloo Open Data API:** Real-time course data.
- **Database Schema Simplification:** Abandoned complex parsing of course requirements; added a `requirementsDescription` column to store plain-text descriptions directly in the `course_catalog`.
- **JSON-based Degree Requirements:** Storing structured degree requirements as JSON in PostgreSQL for flexibility and maintainability.
- **Modal-based Dropdowns:** Used React Native Modal to resolve cross-platform dropdown visibility and scrolling issues.

### Tools and Libraries Used

- React Native / Expo
- Supabase (PostgreSQL, Auth, Storage)
- Node.js & TypeScript
- University of Waterloo Open Data API
- Jest (Testing)
- node-fetch, dotenv
- React Navigation

---

## Implemented Files and Structures

### `/scripts`

#### `seedCourseCatalog.ts`
- Seeds UW course catalog.
- `limitConcurrency()` (controls parallelism for database inserts)

#### `seedDegreeProgram.ts`
- Upserts degree program details from JSON files into the database.
- `seedDegreeProgram()` (parses JSON and upserts data into `degree_programs` and `degree_requirements` tables)

### `/degrees/math/`

- `cs_bsc_reg_2023.json`
- `cs_bsc_reg_2024.json`

### Database Schema

#### `degree_programs`
- `degree_id` (TEXT, PK)
- `plan_year` (INT, PK)
- `coop` (BOOLEAN, PK)
- Additional metadata fields (name, short_name, faculty, min_terms, min_major_avg, min_cumul_avg, units_rules JSONB)

#### `degree_requirements`
- `degree_id` (TEXT, FK to degree_programs)
- `plan_year` (INT, FK to degree_programs)
- `coop` (BOOLEAN, FK to degree_programs)
- `spec` (JSONB, structured JSON requirements)

#### `profiles`
- `id` (TEXT, PK)
- `email` (TEXT, UNIQUE)
- `username` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `current_degree_id` (TEXT)
- `current_plan_year` (INT)
- `current_coop` (BOOLEAN)

#### `user_courses`
- `user_id` (TEXT, FK to profiles)
- `course_code` (TEXT, FK to course_catalog)
- `term` (TEXT, FK to terms)
- `completed` (BOOLEAN)

---

## Known Issues & Edge Cases

- **Supabase UI Bug:** Boolean fields (`coop`) occasionally displayed incorrectly (visual only, doesn't impact data).
- **Dropdown UI on Mobile vs Web:** Previously had issues with dropdown rendering differences across platforms, now resolved with Modals.

---

## Remaining TODOs (Actionable LLM Prompts)

### Task 1: User Authentication Enhancements
**Prompt:** "Enhance the existing email-based Supabase authentication in React Native. Implement password reset and email verification flows."

### Task 2: Degree Requirements Parser
**Prompt:** "Write a TypeScript parser that can interpret JSON-based degree requirements from the database and verify user course selections against these requirements."

### Task 3: Roadmap Builder Frontend
**Prompt:** "Develop React Native components for the Roadmap Builder, allowing users to create, view, and edit academic plans according to their parsed degree requirements."

### Task 4: Course Completion Integration
**Prompt:** "Implement functionality to let users mark courses as completed. Integrate this status into the roadmap builder to visually display user progress."

### Task 5: Grades and GPA Tracker
**Prompt:** "Create a Grades Tracker component allowing users to input course grades, calculate GPA dynamically, and visualize performance trends over terms."

### Task 6: Transcript Viewer
**Prompt:** "Build a UI component to display an unofficial transcript based on the user's completed courses, integrating seamlessly with the existing Supabase data."

---

## Current Status and Next Steps

### Current Status

- The UW course catalog (~6000 courses) is seeded successfully.
- Structured JSON-based degree requirements for two CS Regular programs (2023, 2024) are stored.
- Implemented a robust cross-platform dropdown solution using Modal components.
- Basic user authentication via email (no Google OAuth).

### Immediate Next Steps

- Implement advanced authentication features (password reset, verification).
- Develop a robust JSON-based degree requirement parser.
- Complete UI integration for roadmap building and course selection.

---

## Important Best Practices

- **Maintain JSON-based Requirements:** Store degree details in structured, versioned JSON files.
- **Simple Schema Design:** Prefer JSONB fields for complex nested structures.
- **Platform-specific UI Testing:** Continuously test across Android, iOS, and Web to ensure UI consistency.
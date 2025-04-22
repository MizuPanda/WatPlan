# WatPlan Project Status Summary

---

## Project Context

The WatPlan app aims to help University of Waterloo students plan their courses, manage schedules, track degree requirements, and view transcripts and grades. The app targets cross-platform compatibility (Android, iOS, Web) using **Expo and React Native** for frontend development and **Supabase** as the backend.

### Key Technical Decisions

- **React Native & Expo** for frontend compatibility across web and mobile platforms.
- **Supabase** for backend functionality, user authentication (Google OAuth), and PostgreSQL database.
- **University of Waterloo Open Data API** for real-time course and scheduling information.
- **Parser implementation** for extracting structured course requirements from natural language text.
- **Concurrency and batching strategies** for efficient database seeding of over 6000 courses.

### Tools and Libraries Used

- React Native / Expo
- Supabase (PostgreSQL backend, auth, storage)
- Node.js & TypeScript
- Open Data API from the University of Waterloo
- node-fetch
- dotenv

---

## Implemented Files and Structures

### `/scripts`

#### `seedCourseCatalog.ts`

- Seeds the course catalog from UW API.
- Implements concurrency batching for efficient upserting (chunk size: 500).
- Defines:
  - `limitConcurrency()` for controlling parallelism.

#### `seedRequirements.ts`

- Seeds course prerequisites, corequisites, antirequisites, program restrictions, level restrictions, and unit requirements.
- Implements concurrency batching and deduplication strategies.
- Functions:
  - `limitConcurrency()` (similar implementation as above)
  - `dedupe()` (removes duplicate rows based on composite keys)

### `/src/utils`

#### `prereqParser.ts`

- Parses strings describing course prerequisites into structured ASTs.
- Exports:
  - `PrereqNode` type
  - `parsePrereqExpression(input: string): PrereqNode`
  - Utility functions: `parseOr`, `parseAnd`, `parseTerm`, `splitTopLevel`

#### `requirementsParser.ts`

- Parses the `requirementsDescription` field from UW API into structured JSON.
- Interfaces:
  - `PrereqItem`
  - `GradeReqItem`
  - `CoreqItem`
  - `AntireqItem`
  - `ProgramRestriction`
  - `LevelRestriction`
  - `UnitRequirement`
  - `Requirements` (aggregates all requirement types)
- Functions:
  - `parseRequirements(input: string): Requirements`
  - `flattenPrereqAST()`
  - `splitCodes()`

---

## Known Issues, Limitations, and Edge Cases

- **Prerequisite Parsing**:
  - The parser currently encounters issues handling nested AND/OR logic accurately, potentially misassigning group IDs.
  - Some courses with complex natural language descriptions (e.g., multiple nested conditions, unusual phrasing) may not be parsed correctly yet.
  
- **Upsert Operations**:
  - Without deduplication, multiple identical composite keys can cause PostgreSQL upsert errors ("ON CONFLICT DO UPDATE command cannot affect row a second time").

- **Performance Considerations**:
  - Current batch processing might need optimization or smaller chunk sizes if scaling further.

---

## Remaining TODOs (Actionable Prompts for LLMs)

### Task 1: Debug and Refine Requirements Parser
- **Prompt**:
  - "Analyze and debug the `flattenPrereqAST()` function in `requirementsParser.ts`. Ensure it handles complex nested prerequisite logic (mixed AND/OR clauses) accurately, with consistent group IDs."

### Task 2: Enhance Parsing Robustness
- **Prompt**:
  - "Implement additional regex patterns and parsing rules in `requirementsParser.ts` and `prereqParser.ts` to handle more variations of course descriptions and edge cases. Ensure comprehensive coverage by testing with diverse real-world examples."

### Task 3: Database Integrity Checks
- **Prompt**:
  - "Develop a script or SQL queries to cross-reference `course_prereqs` and related tables against `course_catalog` to identify missing or inconsistent course references. Report discrepancies clearly."

### Task 4: Performance Optimization
- **Prompt**:
  - "Profile and optimize the database seeding scripts (`seedCourseCatalog.ts`, `seedRequirements.ts`). Suggest improved batching strategies or alternative approaches to further reduce execution time."

### Task 5: Comprehensive Error Handling
- **Prompt**:
  - "Implement detailed logging and error handling mechanisms within all seeding and parsing scripts. Include explicit error messages, row identifiers, and actionable debugging information."

---

## Current Status and Next Steps

Currently, the course catalog has been successfully seeded with over 6000 courses. However, the requirements parser remains problematic. The immediate next step is **refining the parser implementation** (`requirementsParser.ts` and `prereqParser.ts`) to handle complex course descriptions robustly and accurately assign prerequisite groups.

Once the parser accurately captures all variations and edge cases:

- Re-run requirement seeding to ensure database consistency.
- Perform comprehensive database integrity checks to validate references.
- Optimize performance and enhance error handling and logging.

Address these parser issues first, as they form the backbone for correctly managing degree roadmaps and course eligibility logic moving forward.
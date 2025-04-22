// scripts/seedRequirements.ts

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { parseRequirements, Requirements } from '../src/utils/requirementsParser';

dotenv.config();

const SUPABASE = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
const UW_API = process.env.UW_API_KEY!;
const TERM   = process.env.SPRING_2025_TERM_CODE!;

/** Minimal concurrency limiter */
function limitConcurrency<T>(max: number, tasks: (() => Promise<T>)[]): Promise<T[]> {
  const results: T[] = [];
  let idx = 0;
  const workers = Array.from({ length: max }, async () => {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  });
  return Promise.all(workers).then(() => results);
}

async function seedRequirements() {
  // 1️⃣ Fetch all course descriptors again
  const apiCourses: any[] = await fetch(
    `https://openapi.data.uwaterloo.ca/v3/Courses/${TERM}`,
    { headers: { 'x-api-key': UW_API } }
  ).then(r => r.json());

  console.log(`📑 Processing requirements for ${apiCourses.length} courses`);

  // 2️⃣ Build flat arrays for each table
  const prereqRows: any[] = [];
  const gradeRows: any[] = [];
  const coreqRows: any[] = [];
  const antireqRows: any[] = [];
  const progRows: any[] = [];
  const levelRows: any[] = [];
  const unitRows: any[] = [];

  for (const c of apiCourses) {
    const courseId = c.courseId;
    const req: Requirements = parseRequirements(c.requirementsDescription || '');

    prereqRows.push(
      ...req.prereqs.map(p => ({
        course_code:  courseId,
        term:         TERM,
        prereq_code:  p.code,
        prereq_name:  p.name,
        group_id:     p.group,
        relation:     p.relation
      }))
    );

    gradeRows.push(
      ...req.gradeReqs.map(g => ({
        course_code:  courseId,
        term:         TERM,
        prereq_code:  g.code,
        prereq_name:  g.name,
        min_percent:  g.minPercent,
        group_id:     g.group
      }))
    );

    coreqRows.push(
      ...req.coreqs.map(co => ({
        course_code: courseId,
        term:        TERM,
        coreq_code:  co.code,
        coreq_name:  co.name
      }))
    );

    antireqRows.push(
      ...req.antireqs.map(ar => ({
        course_code:   courseId,
        term:          TERM,
        antireq_code:  ar.code,
        antireq_name:  ar.name
      }))
    );

    progRows.push(
      ...req.programRestrictions.map(pr => ({
        course_code:  courseId,
        term:         TERM,
        program_code: pr.programCode,
        restriction:  pr.restriction
      }))
    );

    levelRows.push(
      ...req.levelRestrictions.map(lr => ({
        course_code: courseId,
        term:        TERM,
        comparator:  lr.comparator,
        level:       lr.level
      }))
    );

    unitRows.push(
      ...req.unitRequirements.map(u => ({
        course_code:  courseId,
        term:         TERM,
        subject_code: u.subject,
        min_units:    u.minUnits
      }))
    );
  }

  // 3️⃣ Batch‑upsert helper
  async function batchUpsert(table: string, rows: any[], conflict: string) {
    const CHUNK = 500;
    const tasks: Array<() => Promise<void>> = [];

    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const start = i + 1;
      const end   = i + chunk.length;
      tasks.push(async () => {
        const { error } = await SUPABASE.from(table).upsert(chunk, { onConflict: conflict });
        if (error) {
          console.error(`❌ ${table} rows ${start}–${end}:`, error.message);
        } else {
          console.log(`✅ ${table} rows ${start}–${end}`);
        }
      });
    }

    await limitConcurrency(3, tasks);
  }

  // 4️⃣ Execute for each requirement table
  await batchUpsert('course_prereqs',              prereqRows, 'course_code,term,group_id,prereq_code');
  await batchUpsert('course_grade_requirements',   gradeRows,  'course_code,term,group_id,prereq_code');
  await batchUpsert('course_coreqs',               coreqRows,  'course_code,term,coreq_code');
  await batchUpsert('course_antireqs',             antireqRows,'course_code,term,antireq_code');
  await batchUpsert('course_program_restrictions', progRows,   'course_code,term,program_code,restriction');
  await batchUpsert('course_level_restrictions',   levelRows,  'course_code,term,comparator,level');
  await batchUpsert('course_unit_requirements',    unitRows,   'course_code,term,subject_code');

  console.log('🎉 All requirement tables seeded');
}

seedRequirements().catch(err => {
  console.error('❌ seedRequirements failed:', err);
  process.exit(1);
});

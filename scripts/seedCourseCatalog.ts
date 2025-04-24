// scripts/seedCourseCatalog.ts
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
const UW_API = process.env.UW_API_KEY!;
const TERM   = process.env.FALL_2024_TERM_CODE!;

async function seedCourseCatalog() {
  // 1️⃣ Upsert term
  // Fetch term info from the API
  const termRes = await fetch(
    `https://openapi.data.uwaterloo.ca/v3/Terms/${TERM}`, {
      headers: { 'x-api-key': UW_API }
    }
  )

  const termData = await termRes.json()

  const { 
    termCode,
    name,
    nameShort,
    termBeginDate,
    termEndDate,
    associatedAcademicYear 
  } = termData

  const { error: termError } = await SUPABASE
  .from('terms')
  .upsert({
    id: termCode,
    name: name,
    name_short: nameShort,
    start_date: termBeginDate,
    end_date: termEndDate,
    academic_year: associatedAcademicYear
  })

  if (termError) console.error('❌ Term upsert error:', termError)
  
  // 1️⃣ Fetch
  const courses: any[] = await fetch(
    `https://openapi.data.uwaterloo.ca/v3/Courses/${TERM}`,
    { headers: { 'x-api-key': UW_API } }
  ).then(r => r.json());

  console.log(`📦 Fetched ${courses.length} courses`);

  // 2️⃣ Transform
  const allRecords = courses.map(c => ({
    course_code: c.courseId,
    term:        TERM,
    course_name: `${c.subjectCode} ${c.catalogNumber}`,
    course_title: c.title,
    credits:      ((c.courseComponentCode||'').toUpperCase() === 'LAB') ? 0.25 : 0.5,
    course_component_code: c.courseComponentCode,
    associated_academic_career:     c.associatedAcademicCareer,
    associated_academic_group_code: c.associatedAcademicGroupCode,
    associated_academic_org_code:   c.associatedAcademicOrgCode,
    description_abbreviated: c.descriptionAbbreviated,
    description:              c.description,
    requirements:  c.requirementsDescription,
    grading_basis:            c.gradingBasis
  }));

  // 2a️⃣ Deduplicate
  const seen = new Set<string>();
  const records = allRecords.filter(r => {
    const key = `${r.course_code}:${r.term}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`🔎 Deduped to ${records.length} unique records`);

  // 3️⃣ Batch & upsert
  const CHUNK = 500;
  const tasks: Array<() => Promise<void>> = [];

  for (let i = 0; i < records.length; i += CHUNK) {
    const chunk = records.slice(i, i + CHUNK);
    const start = i + 1;
    const end   = i + chunk.length;

    tasks.push(async () => {
      const { error } = await SUPABASE
        .from('course_catalog')
        .upsert(chunk, { onConflict: 'course_code,term' });
      if (error) {
        console.error(`❌ rows ${start}–${end}:`, error.message);
      } else {
        console.log(`✅ rows ${start}–${end}`);
      }
    });
  }

  // 4️⃣ Run with 3 concurrent workers
  await limitConcurrency(3, tasks);

  console.log('🎉 course_catalog seeding complete');
}

// Tiny 3‑worker limiter
function limitConcurrency<T>(
  max: number,
  tasks: (() => Promise<T>)[]
): Promise<T[]> {
  const results: T[] = [];
  let idx = 0;
  const workers = Array
    .from({ length: max }, async () => {
      while (idx < tasks.length) {
        const i = idx++;
        results[i] = await tasks[i]();
      }
    });
  return Promise.all(workers).then(() => results);
}

seedCourseCatalog().catch(err => {
  console.error('❌ seedCourseCatalog failed:', err);
  process.exit(1);
});

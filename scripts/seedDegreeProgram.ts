// scripts/seedDegreeProgram.ts
import { promises as fs } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function seedDegreeProgram() {
  // 1️⃣ Load & parse the JSON file
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('❌ Usage: ts-node seedDegreeProgram.ts <path-to-json>');
    process.exit(1);
  }
  const filePath = path.isAbsolute(fileArg)
    ? fileArg
    : path.join(process.cwd(), fileArg);

  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    console.error('❌ Failed to read file:', filePath, err);
    process.exit(1);
  }

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error('❌ Invalid JSON:', err);
    process.exit(1);
  }

  const {
    id,
    name,
    short_name,
    faculty,
    plan_year,
    coop,
    min_terms,
    min_major_avg,
    min_cumul_avg,
    units_rules
  } = data;

  // 2️⃣ Upsert into degree_programs
  const program = {
    degree_id:      id,
    name,
    short_name,
    faculty,
    plan_year,
    coop,
    min_terms,
    min_major_avg,
    min_cumul_avg,
    units_rules
  };

  const { error: progErr } = await SUPABASE
    .from('degree_programs')
    .upsert(program, { onConflict: 'degree_id,plan_year,coop' });

  if (progErr) {
    console.error('❌ degree_programs upsert error:', progErr);
    process.exit(1);
  }
  console.log('✅ degree_programs upserted:', id, plan_year, coop);

  // 3️⃣ Upsert into degree_requirements
  const specRecord = {
    degree_id: id,
    plan_year,
    coop: coop,
    spec: data
  };

  const { error: specErr } = await SUPABASE
    .from('degree_requirements')
    .upsert(specRecord, { onConflict: 'degree_id,plan_year,coop' });

  if (specErr) {
    console.error('❌ degree_requirements upsert error:', specErr);
    process.exit(1);
  }
  console.log('✅ degree_requirements upserted for:', id, plan_year, coop);
}

seedDegreeProgram().catch(err => {
  console.error('❌ seedDegreeProgram failed:', err);
  process.exit(1);
});

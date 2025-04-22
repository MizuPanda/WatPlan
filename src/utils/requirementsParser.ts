// src/utils/requirementsParser.ts

import { parsePrereqExpression, PrereqNode } from './prereqParser';

/** Represents a COURSE prereq (no minimum grade) */
export interface PrereqItem {
  code: string;
  name: string;
  group: number;
  relation: 'AND' | 'OR';
}

/** Represents a grade‑based prereq (e.g. “60% in CS 138”) */
export interface GradeReqItem {
  code: string;
  name: string;
  minPercent: number;
  group: number;
}

/** Represents a coreq (must take alongside) */
export interface CoreqItem {
  code: string;
  name: string;
}

/** Represents an antireq (cannot take alongside) */
export interface AntireqItem {
  code: string;
  name: string;
}

/** Represents a program restriction (e.g. “Math students only”) */
export interface ProgramRestriction {
  programCode: string;
  restriction: string;
}

/** Represents a level restriction (e.g. “Level ≥ 2A”) */
export interface LevelRestriction {
  comparator: string;
  level: string;
}

/** Represents a unit‑based prereq (e.g. “0.50 unit in HIST”) */
export interface UnitRequirement {
  subject: string;
  minUnits: number;
}

/** Aggregates all requirement types for one course */
export interface Requirements {
  prereqs: PrereqItem[];
  gradeReqs: GradeReqItem[];
  coreqs: CoreqItem[];
  antireqs: AntireqItem[];
  programRestrictions: ProgramRestriction[];
  levelRestrictions: LevelRestriction[];
  unitRequirements: UnitRequirement[];
}

/**
 * Parses a full requirementsDescription string into structured arrays.
 */
export function parseRequirements(input: string): Requirements {
  const raw = input.trim();

  const prereqMatch  = raw.match(/Prereq:\s*([^;]+)/i);
  const coreqMatch   = raw.match(/Coreq:\s*([^;]+)/i);
  const antireqMatch = raw.match(/Antireq:\s*([^;]+)/i);

  const prereqText  = prereqMatch  ? prereqMatch[1].trim() : '';
  const coreqText   = coreqMatch   ? coreqMatch[1].trim() : '';
  const antireqText = antireqMatch ? antireqMatch[1].trim() : '';

  // Strip out those clauses to leave “rest” for program/level/unit
  let rest = raw
    .replace(prereqMatch?.[0]  ?? '', '')
    .replace(coreqMatch?.[0]   ?? '', '')
    .replace(antireqMatch?.[0] ?? '', '')
    .replace(/;+/g, ';')
    .trim();

  // PROGRAM restrictions
  const programRestrictions: ProgramRestriction[] = [];
  for (const m of rest.matchAll(/([A-Za-z &\/]+) students only/gi)) {
    programRestrictions.push({
      programCode: m[1].trim(),
      restriction: 'Students Only'
    });
  }

  // LEVEL restrictions
  const levelRestrictions: LevelRestriction[] = [];
  for (const m of rest.matchAll(/Level at least\s+(\d+[AB])/gi)) {
    levelRestrictions.push({
      comparator: '>=',
      level: m[1]
    });
  }

  // UNIT requirements
  const unitRequirements: UnitRequirement[] = [];
  for (const m of rest.matchAll(/At least\s+([0-9.]+)\s+unit in\s+([A-Za-z]+)/gi)) {
    unitRequirements.push({
      subject: m[2].trim(),
      minUnits: parseFloat(m[1])
    });
  }

  // PREREQ AST → flat arrays
  const prereqs: PrereqItem[] = [];
  const gradeReqs: GradeReqItem[] = [];
  if (prereqText) {
    const ast = parsePrereqExpression(prereqText);
    flattenPrereqAST(ast, prereqs, gradeReqs);
  }

  // COREQs & ANTIREQs via simple split
  const coreqs: CoreqItem[] = coreqText
    ? splitCodes(coreqText)
    : [];
  const antireqs: AntireqItem[] = antireqText
    ? splitCodes(antireqText)
    : [];

  return {
    prereqs,
    gradeReqs,
    coreqs,
    antireqs,
    programRestrictions,
    levelRestrictions,
    unitRequirements
  };
}

/**
 * Recursively walks the PrereqNode AST and populates the flat arrays.
 * OR‑nodes share one groupId; AND‑nodes increment groupId per child.
 */
function flattenPrereqAST(
  node: PrereqNode,
  prereqs: PrereqItem[],
  gradeReqs: GradeReqItem[],
  groupId = 1
): number {
  if (node.type === 'AND') {
    for (const child of node.children) {
      groupId = flattenPrereqAST(child, prereqs, gradeReqs, groupId);
      groupId++;
    }
    return groupId;
  } else if (node.type === 'OR') {
    for (const child of node.children) {
      flattenPrereqAST(child, prereqs, gradeReqs, groupId);
    }
    return groupId;
  } else if (node.type === 'COURSE') {
    prereqs.push({
      code: node.code,
      name: node.code,
      group: groupId,
      relation: 'OR'
    });
    return groupId;
  } else if (node.type === 'GRADE') {
    gradeReqs.push({
      code: node.code,
      name: node.code,
      minPercent: node.minPercent,
      group: groupId
    });
    return groupId;
  }
  return groupId;
}

/** Splits comma/or lists of codes into {code,name} pairs */
function splitCodes(text: string): { code: string; name: string }[] {
  return text
    .split(/,|\bor\b/gi)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(code => ({ code, name: code }));
}

// /src/parse/index.ts

import { parseExpression }          from './exprParser';
import { scanRestrictions }         from './restrictionScanner';
import { Requirements, CourseRef, AST } from './types';

/** Word→number for “One of…”, etc. */
const WORD2NUM: Record<string, number> = {
  one:1, two:2, three:3, four:4, five:5,
  six:6, seven:7, eight:8, nine:9
};

/**
 * Turn a comma/semicolon/slash list into CourseRef[].
 * Expands "SDS/SWREN250R" → SDS250R + SWREN250R,
 *         "SOC/LS280"       → SOC280   + LS280.
 */
function parseCourseRefs(text: string): CourseRef[] {
  const courses: CourseRef[] = [];
  let lastSubj: string | null = null;

  // collapse "SUBJ 123" → "SUBJ123"
  const norm = text.replace(/([A-Za-z]+)\s+(\d{3}[A-Za-z]?)/g, '$1$2');

  // split on commas or semis
  const chunks = norm.split(/[,;]/).map(s => s.trim()).filter(Boolean);

  for (const chunk of chunks) {
    // split on slash
    const parts = chunk.split('/').map(s => s.trim()).filter(Boolean);

    // collect numeric parts and letter parts
    type NumPart = { subj: string | null; cat: string };
    const numParts: NumPart[] = [];
    const letterParts: string[] = [];

    for (const p of parts) {
      const up = p.toUpperCase();
      const m = /^([A-Z]+)?(\d{3}[A-Z]?)$/.exec(up);
      if (m) {
        // m[1] might be undefined if p is just "250R"
        const subj = m[1] ?? null;
        numParts.push({ subj, cat: m[2] });
      } else if (/^[A-Z]+$/.test(up)) {
        letterParts.push(up);
      }
    }

    // if we saw any numeric parts, expand them
    if (numParts.length > 0) {
      for (const np of numParts) {
        // generate for the part itself if it had a subject
        if (np.subj) {
          courses.push({ subject: np.subj, catalog: np.cat });
          lastSubj = np.subj;
        }
        // also generate for each letter-only part
        for (const lp of letterParts) {
          courses.push({ subject: lp, catalog: np.cat });
          // we could set lastSubj = lp, but it's not needed for antireq
        }
      }

    // no numeric parts, but letterParts exist: attach to lastSubj
    } else if (letterParts.length > 0 && lastSubj) {
      for (const lp of letterParts) {
        courses.push({ subject: lp, catalog: lastSubj });
      }
    }
  }

  return courses;
}

export function parseRequirementsString(desc: string | null): Requirements {
  if (!desc) return {};
  const req: Requirements = {};

  const segments = desc.split(/(?=(?:Prereq|Coreq|Antireq):)/i);
  for (const seg of segments) {
    const m = /^((?:Prereq|Coreq|Antireq)):\s*(.+)$/i.exec(seg.trim());
    if (!m) {
      // trailing restrictions
      scanRestrictions(seg, req);
      continue;
    }

    const tag  = m[1].toLowerCase();
    const body = m[2].trim();

    // ─── Prereq ───
    if (tag === 'prereq') {
      // pure "XYZ students only"
      if (/^[A-Za-z/&\s-]+students only\.?$/i.test(body)) {
        req.studentGroup = body.replace(/students only\.?/i, '').trim();
        continue;
      }

      // One of / Two of groups
      const nof = /^(One|Two|Three|Four|Five|Six|Seven|Eight|Nine) of\s+(.+?)(?:[.;]|$)/i.exec(body);
      if (nof) {
        const count = WORD2NUM[nof[1].toLowerCase()] || 1;
        const listText = nof[2];
        const nodes = parseCourseRefs(listText);
        req.prereq = { op: 'N_OF', n: count, nodes };

        // scan any restrictions after the first period/semicolon
        const rest = body.slice(nof[0].length);
        if (rest.trim()) scanRestrictions(rest, req);
        continue;
      }

      // fallback: generic expr + restrictions
      const [exprPart, ...rest] = body.split(';');
      const ast = parseExpression(exprPart.trim());
      if (ast) req.prereq = ast;
      if (rest.length) scanRestrictions(rest.join(';'), req);

    // ─── Coreq ───
    } else if (tag === 'coreq') {
      if (/^[A-Za-z/&\s-]+students only\.?$/i.test(body)) {
        req.studentGroup = body.replace(/students only\.?/i, '').trim();
        continue;
      }
      const [exprPart, ...rest] = body.split(';');
      const ast = parseExpression(exprPart.trim());
      if (ast) req.coreq = ast;
      if (rest.length) scanRestrictions(rest.join(';'), req);

    // ─── Antireq ───
    } else if (tag === 'antireq') {
      const courses = parseCourseRefs(body);
      if (courses.length) req.antireq = courses;
    }
  }

  return req;
}

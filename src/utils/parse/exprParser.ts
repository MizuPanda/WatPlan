// /src/parse/exprParser.ts

import { AST, CourseRef, Logic } from './types';

/** e.g. "CS138>=60" **/
const GRADE_COURSE_RE = /^([A-Z]+)(\d{3}[A-Z]?)>=(\d{1,3})$/;
/** e.g. "AFM102", "CS330E", "JAPAN201R" **/
const COURSE_RE       = /^([A-Z]+)(\d{3}[A-Z]?)$/;
/** Word→num for “One of”, etc. **/
const WORD2NUM = new Map<string,number>([
  ['one',1],['two',2],['three',3],['four',4],['five',5],
  ['six',6],['seven',7],['eight',8],['nine',9]
]);

export type Tok =
  | { kind:'COURSE'; value: CourseRef }
  | { kind:'N_OF';   n: number }
  | { kind:'AND'|'OR'|'LP'|'RP' };

/** Pulls out grade clauses into a single “CS138>=60” style token */
function encodeGradeClauses(txt:string):string {
  const gradeRE   = /(?:a\s+)?grade\s+of\s+(\d{1,3})%\s+(?:or\s+higher\s+)?in\s+([A-Za-z]+)\s+(\d{3}[A-Za-z]?)/gi;
  const atLeastRE = /at\s+least\s+(\d{1,3})%\s+in\s+([A-Za-z]+)\s+(\d{3}[A-Za-z]?)/gi;
  return txt
    .replace(gradeRE,   (_m,pct,subj,cat) => `${subj}${cat}>=${pct}`)
    .replace(atLeastRE, (_m,pct,subj,cat) => `${subj}${cat}>=${pct}`);
}

export function tokenize(rawText:string):Tok[] {
  // 1) encode grade clauses
  let text = encodeGradeClauses(rawText);

  // 2) isolate parentheses
  text = text.replace(/([\(\)])/g,' $1 ');

  // 3) collapse “SUBJ 123”→“SUBJ123”
  text = text.replace(/([A-Za-z]+)\s+(\d{3}[A-Za-z]?)/g,'$1$2');

  // 4) hyphens→spaces, split
  const words = text.replace(/-/g,' ').split(/\s+/).filter(Boolean);

  const toks:Tok[] = [];
  let lastSubj:string|null = null;

  for (let i=0; i<words.length; i++){
    let w = words[i];

    // parens
    if (w==='('){ toks.push({kind:'LP'}); continue; }
    if (w===')'){ toks.push({kind:'RP'}); continue; }

    // strip commas/semis/periods
    w = w.replace(/^[,;.]+|[,;.]+$/g,'');

    const low = w.toLowerCase();
    if (WORD2NUM.has(low) && words[i+1]?.toLowerCase()==='of') {
      toks.push({kind:'N_OF',n:WORD2NUM.get(low)!});
      i++; continue;
    }
    if (low==='and' || w===';'){ toks.push({kind:'AND'}); continue; }
    if (low==='or')           { toks.push({kind:'OR'});  continue; }

    const up = w.toUpperCase();

    // GRADED COURSE first
    const gm = GRADE_COURSE_RE.exec(up);
    if (gm) {
      const [, subj, cat, pct] = gm;
      toks.push({
        kind:'COURSE',
        value:{ subject: subj, catalog: cat, minGrade: +pct }
      });
      lastSubj = subj;
      continue;
    }

    // NORMAL COURSE
    const cm = COURSE_RE.exec(up);
    if (cm) {
      const [, subj, cat] = cm;
      toks.push({
        kind:'COURSE',
        value:{ subject: subj, catalog: cat }
      });
      lastSubj = subj;
      continue;
    }

    // BARE NUMBER → reattach lastSubj
    const dm = /^(\d{3}[A-Z]?)$/.exec(up);
    if (dm && lastSubj) {
      toks.push({
        kind:'COURSE',
        value:{ subject: lastSubj, catalog: dm[1] }
      });
      continue;
    }
  }

  return toks;
}

/** Precedence */
const PREC:Record<Logic,number> = { N_OF:3, AND:2, OR:1 };

/** Shunting‑yard → AST; wraps a single course into AND([...]) */
export function parseExpression(txt:string):AST|undefined {
  const tokens = tokenize(txt);
  const output:(AST|CourseRef)[] = [];
  const ops:Tok[] = [];

  const popOp = () => {
    const o = ops.pop()!;
    const r = output.pop()!, l = output.pop()!;
    output.push({
      op:   o.kind==='N_OF'?'N_OF': o.kind==='OR'?'OR':'AND',
      n:    o.kind==='N_OF'?(o as any).n:undefined,
      nodes:[l,r]
    });
  };

  for (const t of tokens) {
    if (t.kind==='COURSE') {
      output.push(t.value);
    }
    else if (t.kind==='N_OF' || t.kind==='AND' || t.kind==='OR') {
      const tp = PREC[t.kind==='N_OF'?'N_OF':t.kind];
      while (ops.length) {
        const top = ops[ops.length-1];
        if ((top.kind==='N_OF'||top.kind==='AND'||top.kind==='OR')
            && PREC[(top.kind==='N_OF'?'N_OF':top.kind)] >= tp) {
          popOp(); continue;
        }
        break;
      }
      ops.push(t);
    }
    else if (t.kind==='LP') {
      ops.push(t);
    }
    else {
      // RP
      while (ops.length && ops[ops.length-1].kind!=='LP') popOp();
      ops.pop();
    }
  }
  while (ops.length) popOp();

  if (output.length===1 && !('op' in output[0])) {
    return { op:'AND', nodes:[ output[0] as CourseRef ] };
  }
  return output[0] as AST | undefined;
}

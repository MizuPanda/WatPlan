// src/utils/prereqParser.ts

/** AST node types for prerequisite expressions */
export type PrereqNode =
  | { type: 'AND'; children: PrereqNode[] }
  | { type: 'OR';  children: PrereqNode[] }
  | { type: 'COURSE'; code: string }
  | { type: 'GRADE';  code: string; minPercent: number }
  | { type: 'PROGRAM'; program: string }

/**
 * Parses a string like
 *   "(CS 146 and CS 136L) or (grade of 60% or higher in CS 138)"
 * into a nested AST of PrereqNode.
 */
export function parsePrereqExpression(input: string): PrereqNode {
  const s0 = input.trim()
  if (!s0) return { type: 'AND', children: [] }
  return parseOr(s0)
}

function parseOr(s: string): PrereqNode {
  const parts = splitTopLevel(s, /^ or\s+/i)
  if (parts.length > 1) {
    return { type: 'OR', children: parts.map(p => parseAnd(p)) }
  }
  return parseAnd(s)
}

function parseAnd(s: string): PrereqNode {
  const parts = splitTopLevel(s, /^ and\s+/i)
  if (parts.length > 1) {
    return { type: 'AND', children: parts.map(p => parseTerm(p)) }
  }
  return parseTerm(s)
}

function parseTerm(s: string): PrereqNode {
  let str = s.trim()

  // Parenthesized group
  if (str.startsWith('(') && str.endsWith(')')) {
    return parseOr(str.slice(1, -1))
  }

  // GRADE nodes: "grade of 60% or higher in CS 138"
  const g = str.match(/grade of\s+(\d+)%\s+or higher in\s+([A-Za-z0-9 ]+\d+[A-Za-z]?)/i)
  if (g) {
    return { type:'GRADE', code:g[2].trim(), minPercent: parseInt(g[1],10) }
  }

  // COURSE nodes: look for e.g. "CS 246", "STAT 202"
  const c = str.match(/([A-Za-z0-9\/ ]+\d+[A-Za-z]?)/)
  if (c) {
    return { type:'COURSE', code: c[1].trim() }
  }

  // PROGRAM nodes: "Honours Mathematics students only"
  const p = str.match(/([A-Za-z &\/]+ students only)/i)
  if (p) {
    return { type:'PROGRAM', program: p[1].trim() }
  }

  // Fallback: treat entire segment as a PROGRAM restriction
  return { type:'PROGRAM', program: str }
}

/**
 * Splits `s` on `sep` regex only at depth‑0 (i.e. not inside parentheses).
 * `sep` must be anchored (e.g. /^ or\s+/i or /^ and\s+/i).
 */
function splitTopLevel(s: string, sep: RegExp): string[] {
  const parts: string[] = []
  let depth = 0, last = 0
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++
    else if (s[i] === ')') depth--
    else if (depth === 0) {
      const substr = s.slice(i)
      const m = sep.exec(substr)
      if (m && m.index === 0) {
        parts.push(s.slice(last, i))
        i += m[0].length - 1
        last = i + 1
      }
    }
  }
  parts.push(s.slice(last))
  return parts.map(p => p.trim()).filter(p => p.length > 0)
}

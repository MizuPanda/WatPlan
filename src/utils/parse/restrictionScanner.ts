import { Requirements } from './types';

/** split comma‑or‑and lists into array */
const planSplit = (s: string) => s.split(/,\s*| and /).map(x => x.trim());

export function scanRestrictions(tail: string, req: Requirements) {
  // break on semicolon or period to isolate clauses
  const parts = tail.split(/[;\.]/).map(p => p.trim()).filter(Boolean);

  for (const part of parts) {
    // Level at least 2A or 3B
    const lvl = /Level at least (\d)([AB])/i.exec(part);
    if (lvl) {
      req.minLevel = { year: +lvl[1], term: lvl[2] as 'A' | 'B' };
    }

    // Units
    const unit = /([0-9]+\.[0-9]{2}) unit/i.exec(part);
    if (unit) {
      req.minUnits = +unit[1];
    }

    // Milestones
    const ms = part.match(/([A-Za-z ]+? Milestone)/g);
    if (ms) {
      req.milestones = (req.milestones || []).concat(ms.map(m => m.trim()));
    }

    // “X students only”
    const stu = /(.+?) students only/i.exec(part);
    if (stu) {
      req.studentGroup = stu[1].trim();
    }

    // “Not open to ... students”
    const ban = /Not open to (.+?) students/i.exec(part);
    if (ban) {
      req.bannedPlans = (req.bannedPlans || []).concat(planSplit(ban[1]));
    }

    // Inline whitelist example (extend with your other programs)
    const whitelistRe = /(?:Accounting and Financial Management|Computing and Financial Management|Mathematics\/Chartered Professional Accountancy|Biotechnology\/Chartered Professional Accountancy)/gi;
    const wit = [...(part.matchAll(whitelistRe))].map(m => m[0].trim());
    if (wit.length) {
      req.requiredPlans = (req.requiredPlans || []).concat(wit);
    }
  }
}

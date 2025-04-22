export interface CourseRef {
    subject:   string;   // e.g. "CS"
    catalog:   string;   // e.g. "138" or "246E"
    minGrade?: number;   // e.g. 60 if “≥ 60% in CS 138”
  }
  
  export type Logic = 'AND' | 'OR' | 'N_OF';
  
  export interface AST {
    op: Logic;
    n?: number;
    nodes: (AST | CourseRef)[];
  }
  
  export interface Level { year: number; term: 'A' | 'B' }
  
  export interface Requirements {
    prereq?:        AST;
    coreq?:         AST;
    antireq?:       CourseRef[];
    minUnits?:      number;
    minLevel?:      Level;
    requiredPlans?: string[];
    bannedPlans?:   string[];
    studentGroup?:  string;
    milestones?:    string[];
    unparsedTail?:  string;
  }
  
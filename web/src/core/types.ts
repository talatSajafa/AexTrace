export enum MemRegion {
  Stack = 0,
  Heap = 1,
  Static = 2,
  Register = 3,
}

export enum BloomLevel {
  REMEMBER = 1,
  UNDERSTAND = 2,
  APPLY = 3,
  ANALYZE = 4,
  EVALUATE = 5,
  CREATE = 6,
}

export interface MemoryCell {
  address: number;
  region: MemRegion;
  varName: string;
  typeName: string;
  rawValue: string;
  isPointer: boolean;
  pointsTo: number;
  isLive: boolean;
}

export interface TraceFrame {
  frameId: number;
  lineNumber: number;
  functionName: string;
  stepNote: string;    // short explanation of what just happened
  stackCells: MemoryCell[];
  heapCells: MemoryCell[];
  registers: MemoryCell[];
}
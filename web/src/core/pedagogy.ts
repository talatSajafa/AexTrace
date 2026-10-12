export enum BloomLevel {
  REMEMBER = 1,
  UNDERSTAND = 2,
  APPLY = 3,
  ANALYZE = 4,
  EVALUATE = 5,
  CREATE = 6,
}

export const BLOOM_LABELS: Record<BloomLevel, string> = {
  [BloomLevel.REMEMBER]:   'Remember',
  [BloomLevel.UNDERSTAND]: 'Understand',
  [BloomLevel.APPLY]:      'Apply',
  [BloomLevel.ANALYZE]:    'Analyze',
  [BloomLevel.EVALUATE]:   'Evaluate',
  [BloomLevel.CREATE]:     'Create',
};

export interface BloomQuestion {
  id: string;
  level: BloomLevel;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface BloomState {
  currentLevel: BloomLevel;
  streak: number;
  asked: string[];
  correct: number;
  total: number;
}
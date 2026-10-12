// ============================================================
// AexTrace — Practice Questions + Check Logic
// ============================================================

import type { TraceFrame, MemoryCell } from './types.js';

export interface ExpectedVariable {
  name: string;
  type?: string;
  value?: string;
  isPointer?: boolean;
  pointsToVar?: string;
}

export interface CommonMistake {
  pattern: RegExp;
  message: string;
  hint?: string;
}

export interface PracticeQuestion {
  id: string;
  concept: string;
  difficulty: 1 | 2 | 3;
  title: string;
  prompt: string;
  starterCode: string;
  expected: { variables: ExpectedVariable[] };
  commonMistakes: CommonMistake[];
  solution: string;
}

export interface PracticeResult {
  correct: boolean;
  message: string;
  hint?: string;
  isMistake?: boolean;
}

export const PRACTICE_QUESTIONS: PracticeQuestion[] = [
  {
    id: 'q1-int',
    concept: 'Variable declare',
    difficulty: 1,
    title: 'Ek integer declare karein',
    prompt: 'Ek `int` variable banao jiska naam `score` ho aur value `100` ho.',
    starterCode: '// Yahan apna code likhein\n',
    expected: {
      variables: [
        { name: 'score', type: 'int', value: '100', isPointer: false },
      ],
    },
    commonMistakes: [
      {
        pattern: /int\s+score\s*;/,
        message: 'Variable declare kiya lekin value assign nahi ki. `int score = 100;` likhein (equal sign ke saath).',
        hint: 'Value assign karne ke liye `=` use hota hai.',
      },
    ],
    solution: 'int score = 100;',
  },
  {
    id: 'q2-nullptr',
    concept: 'nullptr',
    difficulty: 1,
    title: 'Ek khaali pointer banayein',
    prompt: 'Ek `int` pointer banao jiska naam `ptr` ho, aur use `nullptr` pe set karo. Ye batata hai ke ye pointer abhi kisi cheez ki taraf point nahi kar raha.',
    starterCode: '// int* ptr = ?\n',
    expected: {
      variables: [
        { name: 'ptr', type: 'int*', isPointer: true },
      ],
    },
    commonMistakes: [
      {
        pattern: /int\s*\*\s*ptr\s*=\s*0\s*;/,
        message: '`0` purana C-style hai. Modern C++ mein `nullptr` use karte hain.',
        hint: '`nullptr` ek special keyword hai jo "koi address nahi" dikhata hai.',
      },
      {
        pattern: /int\s+ptr\s*=/,
        message: '`ptr` ko pointer banane ke liye `int*` likhna chahiye (star ke saath).',
      },
    ],
    solution: 'int* ptr = nullptr;',
  },
  {
    id: 'q3-address-of',
    concept: 'Address-of (&)',
    difficulty: 1,
    title: 'Kisi variable ka address lein',
    prompt: 'Ek `int score = 50;` banao. Phir `int* ptr` banao jo `score` ka address hold kare. Iska matlab hai ke `ptr` `score` ki taraf point karega.',
    starterCode: 'int score = 50;\nint* ptr = \n',
    expected: {
      variables: [
        { name: 'score', type: 'int', value: '50', isPointer: false },
        { name: 'ptr', type: 'int*', isPointer: true, pointsToVar: 'score' },
      ],
    },
    commonMistakes: [
      {
        pattern: /int\s*\*\s*ptr\s*=\s*score\s*;/,
        message: '`ptr` ko value `50` nahi, `score` ka **address** chahiye. `&score` likhein (ampersand ke saath).',
        hint: 'Ampersand `&` operator kisi variable ka address deta hai.',
      },
      {
        pattern: /int\s*\*\s*ptr\s*;/,
        message: 'Pointer declare kiya lekin `score` ka address assign nahi kiya.',
      },
    ],
    solution: 'int score = 50;\nint* ptr = &score;',
  },
  {
    id: 'q4-deref-write',
    concept: 'Dereference (*)',
    difficulty: 2,
    title: 'Pointer ke through value badlein',
    prompt: 'Ek `int score = 10;` aur `int* ptr = &score;` banao. Phir pointer ke through `score` ki value `99` karo. Ye `*` operator (dereference) ke through hota hai.',
    starterCode: 'int score = 10;\nint* ptr = &score;\n// Ab score ki value 99 karo (ptr ke through)\n',
    expected: {
      variables: [
        { name: 'score', type: 'int', value: '99', isPointer: false },
        { name: 'ptr', type: 'int*', isPointer: true, pointsToVar: 'score' },
      ],
    },
    commonMistakes: [
      {
        pattern: /ptr\s*=\s*99\s*;/,
        message: '`ptr` pointer hai. Usme value `99` daalne se `ptr` ka address badal jayega, lekin `score` waisa hi rahega. Value badalne ke liye `*ptr = 99;` likhein (star ke saath).',
        hint: 'Star `*` pointer ke through uski value tak pahunchta hai.',
      },
      {
        pattern: /score\s*=\s*99\s*;/,
        message: 'Aap ne direct `score` badal diya. Requirement hai ke pointer ke through badlein: `*ptr = 99;`',
      },
    ],
    solution: 'int score = 10;\nint* ptr = &score;\n*ptr = 99;',
  },
  {
    id: 'q5-pointer-choice',
    concept: 'Address-of - kaunsa',
    difficulty: 2,
    title: 'Sahi variable ka address lein',
    prompt: 'Do variables banao: `int a = 1;` aur `int b = 2;`. Phir ek `int* p` banao jo `b` ki taraf point kare (a ki taraf nahi).',
    starterCode: 'int a = 1;\nint b = 2;\nint* p = \n',
    expected: {
      variables: [
        { name: 'a', type: 'int', value: '1', isPointer: false },
        { name: 'b', type: 'int', value: '2', isPointer: false },
        { name: 'p', type: 'int*', isPointer: true, pointsToVar: 'b' },
      ],
    },
    commonMistakes: [
      {
        pattern: /int\s*\*\s*p\s*=\s*&?\s*a\s*;/,
        message: '`p` `a` ki taraf point kar raha hai, `b` ki taraf nahi. `&b` likhein.',
        hint: 'Ampersand `&` ke baad jo variable likhoge, uska address milega.',
      },
      {
        pattern: /int\s*\*\s*p\s*=\s*2\s*;/,
        message: '`p` pointer hai — ise value `2` nahi, `b` ka **address** chahiye. `&b` likhein.',
      },
    ],
    solution: 'int a = 1;\nint b = 2;\nint* p = &b;',
  },
];

// ============================================================
// CHECK LOGIC
// ============================================================
export function checkPracticeAnswer(
  code: string,
  frames: TraceFrame[],
  question: PracticeQuestion
): PracticeResult {
  if (frames.length === 0) {
    return { correct: false, message: 'Code nahi chala. Syntax error check karein.' };
  }

  const lastFrame = frames[frames.length - 1];
  const varMap = new Map<string, MemoryCell>();
  for (const cell of lastFrame.stackCells) {
    varMap.set(cell.varName, cell);
  }

  const failures: string[] = [];

  for (const expected of question.expected.variables) {
    const actual = varMap.get(expected.name);
    if (!actual) {
      failures.push(`Variable \`${expected.name}\` declare nahi hua.`);
      continue;
    }
    if (expected.isPointer === true && !actual.isPointer) {
      failures.push(`\`${expected.name}\` pointer hona chahiye tha (jaise \`int* ${expected.name}\`).`);
    }
    if (expected.isPointer === false && actual.isPointer) {
      failures.push(`\`${expected.name}\` simple variable hona chahiye tha, pointer nahi.`);
    }
    if (expected.value !== undefined && actual.rawValue !== expected.value) {
      failures.push(`\`${expected.name}\` ki value \`${expected.value}\` honi chahiye thi, lekin \`${actual.rawValue}\` hai.`);
    }
    if (expected.pointsToVar) {
      const target = varMap.get(expected.pointsToVar);
      if (!target) {
        failures.push(`Target variable \`${expected.pointsToVar}\` nahi mila.`);
      } else if (actual.pointsTo !== target.address) {
        failures.push(`\`${expected.name}\` \`${expected.pointsToVar}\` ki taraf point nahi kar raha.`);
      }
    }
  }

  if (failures.length === 0) {
    return { correct: true, message: '🎉 Bilkul sahi! Shabash.' };
  }

  for (const mistake of question.commonMistakes) {
    if (mistake.pattern.test(code)) {
      return {
        correct: false,
        message: mistake.message,
        hint: mistake.hint,
        isMistake: true,
      };
    }
  }

  return { correct: false, message: failures[0] };
}
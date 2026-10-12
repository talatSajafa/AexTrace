import { BloomLevel, type BloomQuestion } from './pedagogy.js';

export const POINTER_QUESTIONS: BloomQuestion[] = [
  // ===== REMEMBER (5) =====
  {
    id: 'r1', level: BloomLevel.REMEMBER,
    question: 'What does the `&` operator do in C++?',
    options: ['Multiplies two numbers', 'Returns the memory address of a variable', 'Dereferences a pointer', 'Declares a new variable'],
    correctIndex: 1,
    explanation: '`&x` returns the address of variable `x`.',
  },
  {
    id: 'r2', level: BloomLevel.REMEMBER,
    question: 'What does a pointer store?',
    options: ['A value', 'A memory address', 'A type', 'A function'],
    correctIndex: 1,
    explanation: 'A pointer stores the memory address of another variable.',
  },
  {
    id: 'r3', level: BloomLevel.REMEMBER,
    question: 'Which symbol is used to dereference a pointer?',
    options: ['`&`', '`*`', '`->`', '`.`'],
    correctIndex: 1,
    explanation: '`*p` dereferences pointer `p`.',
  },
  {
    id: 'r4', level: BloomLevel.REMEMBER,
    question: 'What does `int* p` declare?',
    options: ['An int named p', 'A pointer to int named p', 'A function named p', 'An array named p'],
    correctIndex: 1,
    explanation: '`int* p` means: p is a pointer to an `int`.',
  },
  {
    id: 'r5', level: BloomLevel.REMEMBER,
    question: 'Which value represents a pointer that points to nothing?',
    options: ['`0` is not valid', '`nullptr`', '`void`', '`null`'],
    correctIndex: 1,
    explanation: '`nullptr` (C++11+) is the correct way to represent a null pointer.',
  },

  // ===== UNDERSTAND (5) =====
  {
    id: 'u1', level: BloomLevel.UNDERSTAND,
    question: 'If `int x = 5; int* p = &x;`, what is `*p`?',
    options: ['The address of p', 'The address of x', 'The value 5', 'Undefined'],
    correctIndex: 2,
    explanation: '`*p` gives the value at the address p holds, which is `x` (5).',
  },
  {
    id: 'u2', level: BloomLevel.UNDERSTAND,
    question: 'Why do we declare `int* p` instead of `int p`?',
    options: ['To make it faster', 'To tell the compiler that p holds an address', 'To save memory', 'There is no difference'],
    correctIndex: 1,
    explanation: 'The `*` in the type tells the compiler that p is a pointer.',
  },
  {
    id: 'u3', level: BloomLevel.UNDERSTAND,
    question: 'What is the difference between `p` and `*p`?',
    options: ['They are the same', '`p` is the address, `*p` is the value at that address', '`p` is the value, `*p` is the address', 'Both are addresses'],
    correctIndex: 1,
    explanation: '`p` holds an address. `*p` gives the value stored there.',
  },
  {
    id: 'u4', level: BloomLevel.UNDERSTAND,
    question: 'What does `*p = 42;` do?',
    options: ['Makes p point to 42', 'Writes 42 to the memory p points to', 'Deletes p', 'Reads the value at p'],
    correctIndex: 1,
    explanation: '`*p = 42` writes 42 into the target memory.',
  },
  {
    id: 'u5', level: BloomLevel.UNDERSTAND,
    question: 'Why can a pointer be null?',
    options: ['To make it faster', 'To indicate it currently points to nothing', 'To save memory', 'Because ints can be null'],
    correctIndex: 1,
    explanation: 'A null pointer explicitly means "points to nothing".',
  },

  // ===== APPLY (5) =====
  {
    id: 'a1', level: BloomLevel.APPLY,
    question: 'What does this program print?\n\n`int x = 10; int* p = &x; *p = 20; cout << x;`',
    options: ['10', '20', 'Address of x', 'Compiler error'],
    correctIndex: 1,
    explanation: '`*p = 20` writes 20 into x. So x becomes 20.',
  },
  {
    id: 'a2', level: BloomLevel.APPLY,
    question: 'Given this code:\n\n`int a = 1; int b = 2; int* p = &a;`\n\nHow do you make `p` point to `b`?',
    options: ['`p = b;`', '`p = &b;`', '`*p = &b;`', '`&p = b;`'],
    correctIndex: 1,
    explanation: '`p = &b;` assigns the address of b to p.',
  },
  {
    id: 'a3', level: BloomLevel.APPLY,
    question: 'Given `int x = 5; int* p = &x;`, what does `p` contain?',
    options: ['`5`', 'The address of `x`', 'The address of `p`', '`nullptr`'],
    correctIndex: 1,
    explanation: '`p` stores the address of x.',
  },
  {
    id: 'a4', level: BloomLevel.APPLY,
    question: 'What is `*&x` equivalent to?\n\n`int x = 7;`',
    options: ['Address of x', '`7`', 'Undefined', 'Compiler error'],
    correctIndex: 1,
    explanation: '`&x` gives address, then `*` dereferences it back to the value: 7.',
  },
  {
    id: 'a5', level: BloomLevel.APPLY,
    question: 'After this code runs, what is x?\n\n`int x = 3; int* p = &x; *p = *p + 1;`',
    options: ['3', '4', '5', 'Undefined'],
    correctIndex: 1,
    explanation: '`*p + 1` reads x (3), adds 1 (4), then writes back into x.',
  },

  // ===== ANALYZE (5) =====
  {
    id: 'an1', level: BloomLevel.ANALYZE,
    question: 'What is wrong with this code?\n\n`int* p; *p = 5;`',
    options: ['Nothing is wrong', '`p` is uninitialized, writing to `*p` is undefined behavior', 'Missing semicolon', 'Wrong type'],
    correctIndex: 1,
    explanation: '`p` points to garbage. Dereferencing it corrupts memory.',
  },
  {
    id: 'an2', level: BloomLevel.ANALYZE,
    question: 'Compare these two:\n\n`int* a = nullptr;`\n`int* b;`\n\nWhich is safer?',
    options: ['Both are equal', '`a` is safer (crash is predictable); `b` corrupts silently', '`b` is safer', 'Neither is safe'],
    correctIndex: 1,
    explanation: '`nullptr` makes bugs visible immediately.',
  },
  {
    id: 'an3', level: BloomLevel.ANALYZE,
    question: 'What is wrong here?\n\n`int* p = &x; int x = 5;`',
    options: ['Nothing', '`x` is used before it is declared', 'Missing semicolon', 'Wrong type'],
    correctIndex: 1,
    explanation: 'You must declare x before taking its address.',
  },
  {
    id: 'an4', level: BloomLevel.ANALYZE,
    question: 'Why does `int* p = 5;` fail to compile (or crash)?',
    options: ['5 is not an int', 'You cannot assign an int value directly to a pointer', 'Missing semicolon', 'Wrong type'],
    correctIndex: 1,
    explanation: 'A pointer needs an address, not a value. Use `int* p = &x;`.',
  },
  {
    id: 'an5', level: BloomLevel.ANALYZE,
    question: 'What is the difference between `p = &x;` and `*p = x;`?',
    options: ['Same thing', 'First changes what p points to; second writes into p\'s target', 'Both change p', 'Neither works'],
    correctIndex: 1,
    explanation: '`p = &x` reassigns the pointer. `*p = x` writes to the target.',
  },

  // ===== EVALUATE (5) =====
  {
    id: 'e1', level: BloomLevel.EVALUATE,
    question: 'Two swap functions:\n\n`void swap1(int a, int b);`\n`void swap2(int* a, int* b);`\n\nWhich actually swaps the caller\'s variables?',
    options: ['`swap1` is simpler', '`swap2` because it receives addresses', 'Both work', 'Neither works'],
    correctIndex: 1,
    explanation: '`swap1` gets copies. `swap2` gets addresses, so it can modify originals.',
  },
  {
    id: 'e2', level: BloomLevel.EVALUATE,
    question: 'Student writes:\n\n`int* p = &x; int x = 5;`\n\nWhat is the problem?',
    options: ['Nothing, it works', '`x` is used before it is declared', 'Missing semicolon', 'Wrong type'],
    correctIndex: 1,
    explanation: 'You must declare x before taking its address.',
  },
  {
    id: 'e3', level: BloomLevel.EVALUATE,
    question: 'Which approach is clearer for modifying a variable in a function?',
    options: ['Pass by pointer `(int* p)`', 'Pass by reference `(int& r)`', 'Both are equally clear', 'Neither works'],
    correctIndex: 1,
    explanation: 'References hide the address operation, making call-sites cleaner.',
  },
  {
    id: 'e4', level: BloomLevel.EVALUATE,
    question: 'Which is preferable for a small function that just reads a value?',
    options: ['`void f(int* p)`', '`void f(const int* p)`', 'Both same', 'Neither'],
    correctIndex: 1,
    explanation: '`const int*` communicates "I will not modify what you point to".',
  },
  {
    id: 'e5', level: BloomLevel.EVALUATE,
    question: 'Which code is safer?\n\n`A: int* p = nullptr;`\n`B: int* p;`\n`C: int* p = 0;`',
    options: ['Only A', 'A and C are both safe; B is not', 'Only B', 'All are equally safe'],
    correctIndex: 1,
    explanation: 'A and C both set p to null safely. B leaves it uninitialized.',
  },

  // ===== CREATE (5) =====
  {
    id: 'c1', level: BloomLevel.CREATE,
    question: 'Write a function that takes a pointer to int and doubles the value it points to. What is the correct signature?',
    options: ['`int double(int x);`', '`void double(int* p);`', '`int* double(int p);`', '`void double(int p);`'],
    correctIndex: 1,
    explanation: 'A pointer parameter allows modification, `void` return is enough.',
  },
  {
    id: 'c2', level: BloomLevel.CREATE,
    question: 'You want a function that resets an int to 0 from outside. Which parameter type works?',
    options: ['`int x`', '`int* x`', '`int& x`', 'Both `int*` and `int&` work'],
    correctIndex: 3,
    explanation: 'Both pointer and reference can modify the caller\'s variable.',
  },
  {
    id: 'c3', level: BloomLevel.CREATE,
    question: 'Design a signature that returns a pointer to the larger of two ints. What is best?',
    options: ['`int larger(int a, int b);`', '`int* larger(int* a, int* b);`', '`void larger(int a, int b);`', '`int& larger(int a, int b);`'],
    correctIndex: 1,
    explanation: 'Returning a pointer lets the caller see which one was larger and modify it.',
  },
  {
    id: 'c4', level: BloomLevel.CREATE,
    question: 'You want to pass an array to a function. Which parameter works?',
    options: ['`void f(int arr);`', '`void f(int* arr);`', '`void f(int& arr);`', '`void f(int arr[]);` and `void f(int* arr);` are both valid'],
    correctIndex: 3,
    explanation: 'Array syntax and pointer syntax both decay to pointer parameters.',
  },
  {
    id: 'c5', level: BloomLevel.CREATE,
    question: 'You want a function that swaps two ints. Which signature?',
    options: ['`void swap(int a, int b);`', '`void swap(int* a, int* b);`', '`int swap(int a, int b);`', '`void swap(int& a, int b);`'],
    correctIndex: 1,
    explanation: 'Pointer (or reference for both) is needed to swap the caller\'s values.',
  },
];
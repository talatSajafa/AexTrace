import type { TraceFrame } from '../core/types.js';

// Emscripten module type (loose)
interface EmscriptenModule {
  add(a: number, b: number): number;
  runCode(source: string): TraceFrame[];
}

export class WasmMemorySource {
  private module: EmscriptenModule | null = null;

  async init(): Promise<void> {
    // @ts-ignore - generated file, no types
    const createModule = (await import('../../dist/aextrace.js')).default;
    this.module = await createModule() as EmscriptenModule;
  }

  isReady(): boolean {
    return this.module !== null;
  }

  add(a: number, b: number): number {
    if (!this.module) throw new Error('WASM not initialized');
    return this.module.add(a, b);
  }

  runCode(source: string): TraceFrame[] {
    if (!this.module) throw new Error('WASM not initialized');
    return this.module.runCode(source);
  }
}
import { ThemeSwitcher } from './components/ThemeSwitcher.js';
import { WasmMemorySource } from '../adapters/WasmMemorySource.js';
import { Visualizer } from './components/Visualizer.js';
import { Editor } from './components/Editor.js';
import { Controls } from './components/Controls.js';
import { ExampleLoader } from './components/ExampleLoader.js';
import { BloomPanel } from './components/BloomPanel.js';
import { StepNote } from './components/StepNote.js';
import { LessonPanel } from './components/LessonPanel.js';
import { PracticePanel } from './components/PracticePanel.js';
import { StorageEngine } from '../adapters/StorageEngine.js';
import { AppState } from '../core/state.js';
import { log } from '../utils/logger.js';
import { checkPracticeAnswer, type PracticeQuestion } from '../core/practiceQuestions.js';
import type { TraceFrame } from '../core/types.js';
import type { Template } from '../templates/schema.js';

let frames: TraceFrame[] = [];
let currentIndex = 0;
let playTimer: number | null = null;

type AppMode = 'guided' | 'sandbox' | 'practice';

async function loadTemplate(): Promise<Template | null> {
  try {
    const res = await fetch('./src/templates/built-in/pointers.json');
    if (!res.ok) return null;
    return await res.json() as Template;
  } catch {
    return null;
  }
}

async function init(): Promise<void> {
  if (!document.getElementById('app')) return;

  const storage = new StorageEngine();
  await storage.init();
  const appState = new AppState(storage);

  const switcherMount = document.getElementById('theme-switcher');
  if (switcherMount) new ThemeSwitcher(switcherMount);

  const memory = new WasmMemorySource();
  await memory.init();
  log.info('WASM loaded');

  const template = await loadTemplate();
  log.info('Template loaded:', template?.name ?? 'none');

  // ---- Visualizer panel ----
  const vizMount = document.getElementById('visualizer-panel');
  if (!vizMount) return;
  vizMount.innerHTML = '';
  vizMount.style.display = 'flex';
  vizMount.style.flexDirection = 'column';
  vizMount.style.minHeight = '0';

  const stepNoteMount = document.createElement('div');
  vizMount.appendChild(stepNoteMount);
  const stepNote = new StepNote(stepNoteMount);

  const canvasWrap = document.createElement('div');
  canvasWrap.style.cssText = 'flex: 1 1 0; position: relative; overflow: hidden; min-height: 0;';
  vizMount.appendChild(canvasWrap);
  const visualizer = new Visualizer(canvasWrap);

  // ---- Editor panel ----
  const editorMount = document.getElementById('editor-panel');
  if (!editorMount) return;
  editorMount.innerHTML = '';
  editorMount.style.padding = '0';
  editorMount.style.display = 'flex';
  editorMount.style.flexDirection = 'column';
  editorMount.style.height = '100%';
  editorMount.style.minHeight = '0';
  editorMount.style.overflow = 'hidden';

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex; flex-direction:column; height:100%; min-height:0; overflow:hidden;';
  editorMount.appendChild(wrapper);

  // Mode bar
  const modeBar = document.createElement('div');
  modeBar.style.cssText = `
    display:flex; gap:8px; align-items:center;
    padding:8px 12px;
    border-bottom:1px solid var(--border);
    background: var(--panel-bg);
    flex-shrink: 0;
  `;
  wrapper.appendChild(modeBar);

  let mode = 'guided' as AppMode;

  const guidedBtn = createModeButton('Guided', () => setMode('guided'));
  const sandboxBtn = createModeButton('Sandbox', () => setMode('sandbox'));
  const practiceBtn = createModeButton('Practice', () => setMode('practice'));
  modeBar.appendChild(guidedBtn);
  modeBar.appendChild(sandboxBtn);
  modeBar.appendChild(practiceBtn);

  function createModeButton(label: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText = `
      background: var(--panel-bg-2);
      color: var(--fg-dim);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 5px 14px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s ease;
    `;
    btn.onclick = onClick;
    return btn;
  }

  function refreshModeButtons(): void {
    const map: [HTMLButtonElement, AppMode][] = [
      [guidedBtn, 'guided'],
      [sandboxBtn, 'sandbox'],
      [practiceBtn, 'practice'],
    ];
    for (const [btn, m] of map) {
      const isActive = mode === m;
      btn.style.background = isActive ? 'var(--accent)' : 'var(--panel-bg-2)';
      btn.style.color = isActive ? 'var(--bg)' : 'var(--fg-dim)';
      btn.style.borderColor = isActive ? 'var(--accent)' : 'var(--border)';
    }
  }

  // Controls bar (sandbox only)
  const controlsBar = document.createElement('div');
  controlsBar.style.cssText = `
    display:flex; gap:8px; align-items:center;
    padding:8px 12px;
    border-bottom:1px solid var(--border);
    background: var(--panel-bg);
    flex-wrap: wrap;
    flex-shrink: 0;
  `;
  wrapper.appendChild(controlsBar);

  // Content area
  const contentArea = document.createElement('div');
  contentArea.style.cssText = 'flex: 1 1 0; min-height: 0; overflow: hidden; display: flex; flex-direction: column;';
  wrapper.appendChild(contentArea);

  // Lesson container
  const lessonContainer = document.createElement('div');
  lessonContainer.style.cssText = 'flex: 1 1 0; min-height: 0; overflow: hidden; display: none; flex-direction: column;';
  contentArea.appendChild(lessonContainer);

  // Editor container (sandbox)
  const editorContainer = document.createElement('div');
  editorContainer.style.cssText = 'flex: 1 1 0; min-height: 0; overflow: hidden; display: none;';
  contentArea.appendChild(editorContainer);

  // Practice container
  const practiceContainer = document.createElement('div');
  practiceContainer.style.cssText = 'flex: 1 1 0; min-height: 0; overflow: hidden; display: none; flex-direction: column;';
  contentArea.appendChild(practiceContainer);

  const saved = await appState.loadEditor();

  const editor = new Editor(editorContainer, () => {
    if (mode !== 'sandbox') return;
    if (playTimer !== null) clearTimeout(playTimer);
    playTimer = window.setTimeout(() => runCode(), 300);
  });

  // Lesson panel
  let lessonPanel: LessonPanel | null = null;
  if (template) {
    lessonPanel = new LessonPanel(
      lessonContainer,
      template,
      (lesson) => {
        editor.setValue(lesson.code);
        runCode();
      },
      () => setMode('sandbox')
    );
  }

  // Practice panel
  const practicePanel = new PracticePanel(
    practiceContainer,
    (code: string, question: PracticeQuestion) => {
      try {
        const practiceFrames = memory.runCode(code);
        if (practiceFrames.length > 0) {
          const lastFrame = practiceFrames[practiceFrames.length - 1];
          visualizer.setFrame(lastFrame, lastFrame.lineNumber);
          stepNote.update(lastFrame, practiceFrames.length - 1, practiceFrames.length);
        } else {
          visualizer.setFrame(null, 0);
          stepNote.update(null, 0, 0);
        }
        return checkPracticeAnswer(code, practiceFrames, question);
      } catch (err) {
        return { correct: false, message: 'Code mein error: ' + (err as Error).message };
      }
    }
  );

  const setMode = (newMode: AppMode): void => {
    mode = newMode;
    refreshModeButtons();

    if (mode === 'guided' && template) {
      lessonContainer.style.display = 'flex';
      editorContainer.style.display = 'none';
      practiceContainer.style.display = 'none';
      controlsBar.style.display = 'none';

      if (lessonPanel) {
        const lesson = lessonPanel.getCurrentLesson();
        if (lesson) {
          editor.setValue(lesson.code);
          runCode();
        }
      }
    } else if (mode === 'practice') {
      lessonContainer.style.display = 'none';
      editorContainer.style.display = 'none';
      practiceContainer.style.display = 'flex';
      controlsBar.style.display = 'none';
      practicePanel.reset();
    } else {
      lessonContainer.style.display = 'none';
      editorContainer.style.display = 'flex';
      practiceContainer.style.display = 'none';
      controlsBar.style.display = 'flex';

      const sandboxCode = saved ?? 'int x = 5;\nint* p = &x;\n*p = 10;';
      editor.setValue(sandboxCode);
      runCode();
    }

    updateBloomVisibility();
  };

  new Controls(controlsBar, {
    onStepForward: () => { if (currentIndex < frames.length - 1) { currentIndex++; updateView(); } },
    onStepBack:    () => { if (currentIndex > 0) { currentIndex--; updateView(); } },
    onRun: () => {
      if (playTimer !== null) clearInterval(playTimer);
      playTimer = window.setInterval(() => {
        if (currentIndex < frames.length - 1) { currentIndex++; updateView(); }
        else { if (playTimer !== null) clearInterval(playTimer); playTimer = null; }
      }, 700);
    },
    onPause: () => { if (playTimer !== null) { clearInterval(playTimer); playTimer = null; } },
    onReset: () => { currentIndex = 0; updateView(); },
  });

  const exMount = document.createElement('div');
  controlsBar.appendChild(exMount);
  new ExampleLoader(exMount, (code) => editor.setValue(code));

  function runCode(): void {
    try {
      const code = editor.getValue();
      if (mode === 'sandbox') void appState.saveEditor(code);
      frames = memory.runCode(code);
      currentIndex = 0;
      updateView();
    } catch (err) {
      log.error('runCode failed:', err);
    }
  }

  function updateView(): void {
    if (frames.length === 0) {
      visualizer.setFrame(null, 0);
      stepNote.update(null, 0, 0);
      return;
    }
    const frame = frames[currentIndex];
    visualizer.setFrame(frame, frame.lineNumber);
    stepNote.update(frame, currentIndex, frames.length);
  }

  // Bloom
  const bloomContent = document.getElementById('bloom-content');
  const bloomPanel = document.getElementById('bloom-panel');

  function updateBloomVisibility(): void {
    if (bloomPanel) {
      bloomPanel.style.display = mode === 'sandbox' ? 'block' : 'none';
    }
  }

  if (bloomContent) new BloomPanel(bloomContent);

  refreshModeButtons();
  if (mode === 'guided' && template) {
    setMode('guided');
  } else {
    setMode('sandbox');
  }

  // Bloom resizer
  const resizeHandle = document.getElementById('bloom-resize-handle');
  if (bloomPanel && resizeHandle) {
    let startY = 0;
    let startHeight = 0;
    let dragging = false;
    let pendingHeight = 0;
    let rafScheduled = false;

    const flushHeight = (): void => {
      rafScheduled = false;
      if (pendingHeight > 0) bloomPanel.style.height = pendingHeight + 'px';
    };

    resizeHandle.addEventListener('mousedown', (e) => {
      dragging = true;
      startY = e.clientY;
      startHeight = bloomPanel.getBoundingClientRect().height;
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const delta = startY - e.clientY;
      pendingHeight = Math.max(120, Math.min(window.innerHeight * 0.7, startHeight + delta));
      if (!rafScheduled) { rafScheduled = true; requestAnimationFrame(flushHeight); }
    });

    window.addEventListener('mouseup', () => {
      if (dragging) {
        dragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        if (pendingHeight > 0) bloomPanel.style.height = pendingHeight + 'px';
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void init());
} else {
  void init();
}
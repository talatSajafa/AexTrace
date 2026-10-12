// ============================================================
// AexTrace — Practice Panel Component
// ============================================================

import { Editor } from './Editor.js';
import {
  PRACTICE_QUESTIONS,
  type PracticeQuestion,
  type PracticeResult,
} from '../../core/practiceQuestions.js';

export class PracticePanel {
  private mount: HTMLElement;
  private onCheck: (code: string, question: PracticeQuestion) => PracticeResult;
  private questions: PracticeQuestion[];
  private currentIndex = 0;
  private editor: Editor;
  private editorMount: HTMLDivElement;
  private headerEl: HTMLDivElement;
  private promptEl: HTMLDivElement;
  private feedbackEl: HTMLDivElement;
  private actionsEl: HTMLDivElement;
  private hintEl: HTMLDivElement;
  private solved = false;

  constructor(
    mount: HTMLElement,
    onCheck: (code: string, question: PracticeQuestion) => PracticeResult
  ) {
    this.mount = mount;
    this.onCheck = onCheck;
    this.questions = PRACTICE_QUESTIONS;

    this.mount.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      overflow-y: auto;
      background: var(--panel-bg);
      color: var(--fg);
      font-family: 'Inter', system-ui, sans-serif;
    `;

    this.headerEl = document.createElement('div');
    this.headerEl.style.cssText = 'padding: 14px 18px; border-bottom: 1px solid var(--border); flex-shrink: 0;';
    this.mount.appendChild(this.headerEl);

    this.promptEl = document.createElement('div');
    this.promptEl.style.cssText = 'padding: 14px 18px 8px 18px; font-size: 13px; line-height: 1.55; flex-shrink: 0;';
    this.mount.appendChild(this.promptEl);

    this.hintEl = document.createElement('div');
    this.hintEl.style.cssText = `
      display: none;
      margin: 0 18px 8px 18px;
      padding: 10px 12px;
      background: rgba(232,154,184,0.08);
      border-left: 3px solid var(--accent);
      border-radius: 4px;
      font-size: 12px;
      color: var(--fg);
      flex-shrink: 0;
    `;
    this.mount.appendChild(this.hintEl);

    this.editorMount = document.createElement('div');
    this.editorMount.style.cssText = `
      margin: 0 18px 12px 18px;
      height: 140px;
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
      background: var(--bg);
    `;
    this.mount.appendChild(this.editorMount);

    this.editor = new Editor(this.editorMount, () => { /* no-op */ });

    this.actionsEl = document.createElement('div');
    this.actionsEl.style.cssText = 'padding: 0 18px 12px 18px; display: flex; gap: 8px; flex-wrap: wrap; flex-shrink: 0;';
    this.mount.appendChild(this.actionsEl);

    this.feedbackEl = document.createElement('div');
    this.feedbackEl.style.cssText = 'padding: 0 18px 18px 18px; font-size: 13px; line-height: 1.55;';
    this.mount.appendChild(this.feedbackEl);

    this.renderQuestion();
  }

  private renderQuestion(): void {
    const q = this.questions[this.currentIndex];
    if (!q) {
      this.renderDone();
      return;
    }

    const diffStars = '★'.repeat(q.difficulty) + '☆'.repeat(3 - q.difficulty);

    this.headerEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <span style="font-weight:700; color:var(--accent); font-size:13px;">Practice · ${this.currentIndex + 1} / ${this.questions.length}</span>
          <span style="font-size:11px; color:var(--fg-dim); padding:3px 8px; background:var(--panel-bg-2); border-radius:10px;">${q.concept}</span>
          <span style="font-size:11px; color:var(--accent); letter-spacing:1px;">${diffStars}</span>
        </div>
      </div>
    `;

    this.promptEl.innerHTML = `
      <div style="font-weight:700; color:var(--fg); margin-bottom:6px;">${q.title}</div>
      <div style="color:var(--fg); opacity:0.92;">${this.formatPrompt(q.prompt)}</div>
    `;

    this.hintEl.style.display = 'none';
    this.hintEl.textContent = '';

    this.editorMount.style.display = 'block';
    this.editor.setValue(q.starterCode);

    this.renderActions();
    this.feedbackEl.innerHTML = '';
    this.solved = false;
  }

  private renderActions(): void {
    this.actionsEl.innerHTML = '';

    const hintBtn = document.createElement('button');
    hintBtn.textContent = '💡 Hint';
    this.styleButton(hintBtn, 'secondary');
    hintBtn.onclick = () => this.showHint();
    this.actionsEl.appendChild(hintBtn);

    const checkBtn = document.createElement('button');
    checkBtn.textContent = '✓ Check';
    this.styleButton(checkBtn, 'primary');
    checkBtn.onclick = () => this.handleCheck();
    this.actionsEl.appendChild(checkBtn);

    const solutionBtn = document.createElement('button');
    solutionBtn.textContent = 'Show Solution';
    this.styleButton(solutionBtn, 'ghost');
    solutionBtn.onclick = () => this.showSolution();
    this.actionsEl.appendChild(solutionBtn);
  }

  private styleButton(btn: HTMLButtonElement, kind: 'primary' | 'secondary' | 'ghost'): void {
    const base = `
      border-radius: 6px;
      padding: 7px 14px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s ease;
      border: 1px solid transparent;
    `;
    if (kind === 'primary') {
      btn.style.cssText = base + 'background: linear-gradient(135deg, var(--accent) 0%, var(--pointer-glow) 100%); color: var(--bg);';
    } else if (kind === 'secondary') {
      btn.style.cssText = base + 'background: var(--panel-bg-2); color: var(--fg); border-color: var(--border);';
    } else {
      btn.style.cssText = base + 'background: transparent; color: var(--fg-dim);';
    }
  }

  private handleCheck(): void {
    if (this.solved) return;
    const q = this.questions[this.currentIndex];
    if (!q) return;
    const code = this.editor.getValue();

    if (!code.trim()) {
      this.showFeedback({ correct: false, message: 'Pehle code likhein, phir check karein.' });
      return;
    }

    const result = this.onCheck(code, q);
    this.showFeedback(result);

    if (result.correct) {
      this.solved = true;
      this.actionsEl.innerHTML = '';
      const nextBtn = document.createElement('button');
      const isLast = this.currentIndex === this.questions.length - 1;
      nextBtn.textContent = isLast ? '🎉 Finish' : 'Next Question →';
      this.styleButton(nextBtn, 'primary');
      nextBtn.onclick = () => {
        this.currentIndex++;
        this.renderQuestion();
      };
      this.actionsEl.appendChild(nextBtn);
    }
  }

  private showFeedback(result: PracticeResult): void {
    if (result.correct) {
      this.feedbackEl.innerHTML = `
        <div style="
          padding: 12px 14px;
          background: rgba(63,185,80,0.12);
          border-left: 3px solid var(--success);
          border-radius: 6px;
          color: var(--success);
          font-weight: 600;
        ">${result.message}</div>
      `;
    } else {
      const isMistake = result.isMistake;
      this.feedbackEl.innerHTML = `
        <div style="
          padding: 12px 14px;
          background: ${isMistake ? 'rgba(232,154,184,0.10)' : 'rgba(248,81,73,0.10)'};
          border-left: 3px solid ${isMistake ? 'var(--accent)' : 'var(--error)'};
          border-radius: 6px;
          color: var(--fg);
        ">
          <div style="
            font-weight: 700;
            color: ${isMistake ? 'var(--accent)' : 'var(--error)'};
            margin-bottom: 4px;
            font-size: 12px;
          ">${isMistake ? 'Ek common ghalti' : 'Ghalat'}</div>
          <div style="font-size: 12.5px; line-height: 1.5;">${this.escape(result.message)}</div>
        </div>
      `;
    }
  }

  private showHint(): void {
    const q = this.questions[this.currentIndex];
    if (!q) return;
    this.hintEl.style.display = 'block';
    const hint = q.commonMistakes[0]?.hint || this.defaultHint(q);
    this.hintEl.innerHTML = `<strong style="color:var(--accent);">💡 Hint:</strong> ${this.escape(hint)}`;
  }

  private defaultHint(q: PracticeQuestion): string {
    if (q.concept.includes('Address-of')) return 'Ampersand `&` kisi variable ka address deta hai.';
    if (q.concept.includes('Dereference')) return 'Star `*` pointer ke through uski value tak pahunchta hai.';
    if (q.concept === 'nullptr') return '`nullptr` ek special keyword hai jo khaali pointer dikhata hai.';
    if (q.concept === 'Variable declare') return 'Sahi tareeqa: `int name = value;`';
    return 'Dhyaan se dekhein ke aap kaise syntax use kar rahe hain.';
  }

  private showSolution(): void {
    const q = this.questions[this.currentIndex];
    if (!q) return;
    this.solved = true;
    this.feedbackEl.innerHTML = `
      <div style="
        padding: 12px 14px;
        background: rgba(232,154,184,0.08);
        border-left: 3px solid var(--accent);
        border-radius: 6px;
      ">
        <div style="font-weight:700; color:var(--accent); font-size:12px; margin-bottom:6px;">Solution</div>
        <pre style="
          background: var(--bg);
          padding: 10px 12px;
          border-radius: 5px;
          font-family: 'Consolas', monospace;
          font-size: 12px;
          color: var(--fg);
          margin: 0;
          overflow-x: auto;
        ">${this.escape(q.solution)}</pre>
      </div>
    `;
    this.actionsEl.innerHTML = '';
    const nextBtn = document.createElement('button');
    const isLast = this.currentIndex === this.questions.length - 1;
    nextBtn.textContent = isLast ? '🎉 Finish' : 'Next Question →';
    this.styleButton(nextBtn, 'primary');
    nextBtn.onclick = () => {
      this.currentIndex++;
      this.renderQuestion();
    };
    this.actionsEl.appendChild(nextBtn);
  }

  private renderDone(): void {
    this.headerEl.innerHTML = '';
    this.promptEl.innerHTML = '';
    this.hintEl.style.display = 'none';
    this.editorMount.style.display = 'none';
    this.actionsEl.innerHTML = '';
    this.feedbackEl.innerHTML = `
      <div style="padding: 30px 20px; text-align: center;">
        <div style="font-size: 40px; margin-bottom: 12px;">🎉</div>
        <div style="font-size: 18px; font-weight: 700; color: var(--accent); margin-bottom: 8px;">Sab Questions Complete!</div>
        <div style="font-size: 13px; color: var(--fg-dim); margin-bottom: 20px;">Aap ne saare practice questions solve kar liye.</div>
      </div>
    `;
  }

  private formatPrompt(text: string): string {
    return text.replace(/`([^`]+)`/g, (_: string, code: string) => {
      return `<code style="
        background: var(--panel-bg-2);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Consolas', monospace;
        font-size: 12px;
        color: var(--accent);
      ">${this.escape(code)}</code>`;
    });
  }

  private escape(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  public reset(): void {
    this.editorMount.style.display = 'block';
    this.renderQuestion();
  }
}
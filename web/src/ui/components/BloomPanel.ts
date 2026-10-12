import { BloomLevel, BLOOM_LABELS, type BloomQuestion, type BloomState } from '../../core/pedagogy.js';
import { POINTER_QUESTIONS } from '../../core/bloomQuestions.js';

const STORAGE_KEY = 'aextrace-bloom';
const REPEAT_GAP = 5;

interface RecentFeedback {
  isCorrect: boolean;
  question: BloomQuestion;
  chosenIndex: number;
}

export class BloomPanel {
  private mount: HTMLElement;
  private state: BloomState;
  private currentQuestion: BloomQuestion | null = null;
  private recentIds: string[] = [];
  private feedback: RecentFeedback | null = null;
  private answered = false;

  // ---- Drag state ----
  private isResizing = false;
  private startY = 0;
  private startHeight = 0;

  constructor(mount: HTMLElement) {
    this.mount = mount;
    this.state = this.loadState();
    this.render();
    this.setupResizeHandle();   // <-- Drag handle setup
  }

  // ============================================================
  // DRAG LOGIC (Panel ko upar-neeche karne ke liye)
  // ============================================================
  private setupResizeHandle(): void {
    const handle = document.getElementById('bloom-resize-handle');
    if (!handle) {
      console.warn('BloomPanel: #bloom-resize-handle nahi mila.');
      return;
    }

    // Mouse Down: Drag shuru
    handle.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();
      this.isResizing = true;
      this.startY = e.clientY;
      this.startHeight = this.mount.offsetHeight;
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    });

    // Mouse Move: Drag chal raha hai
    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.isResizing) return;

      // Upar drag = positive delta, neeche drag = negative delta
      const deltaY = this.startY - e.clientY;
      const newHeight = this.startHeight + deltaY;

      const minHeight = 120;
      const maxHeight = window.innerHeight * 0.8;
      const clampedHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);

      this.mount.style.height = clampedHeight + 'px';
    });

    // Mouse Up: Drag khatam
    document.addEventListener('mouseup', () => {
      if (this.isResizing) {
        this.isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });

    // Touch support (mobile/tablet)
    handle.addEventListener('touchstart', (e: TouchEvent) => {
      this.isResizing = true;
      this.startY = e.touches[0].clientY;
      this.startHeight = this.mount.offsetHeight;
    }, { passive: true });

    document.addEventListener('touchmove', (e: TouchEvent) => {
      if (!this.isResizing) return;
      const deltaY = this.startY - e.touches[0].clientY;
      const newHeight = this.startHeight + deltaY;
      const minHeight = 120;
      const maxHeight = window.innerHeight * 0.8;
      const clampedHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);
      this.mount.style.height = clampedHeight + 'px';
    }, { passive: true });

    document.addEventListener('touchend', () => {
      this.isResizing = false;
    });
  }

  // ============================================================
  // STATE MANAGEMENT (Quiz ka logic — bilkul original)
  // ============================================================
  private loadState(): BloomState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as BloomState;
    } catch { /* ignore */ }
    return {
      currentLevel: BloomLevel.REMEMBER,
      streak: 0,
      asked: [],
      correct: 0,
      total: 0,
    };
  }

  private saveState(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  private pickQuestion(): BloomQuestion | null {
    let pool = POINTER_QUESTIONS.filter(
      q => q.level === this.state.currentLevel && !this.recentIds.includes(q.id)
    );
    if (pool.length === 0) {
      this.recentIds = [];
      pool = POINTER_QUESTIONS.filter(q => q.level === this.state.currentLevel);
    }
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private pushRecent(id: string): void {
    this.recentIds.push(id);
    if (this.recentIds.length > REPEAT_GAP) this.recentIds.shift();
  }

  private answer(question: BloomQuestion, choiceIndex: number): void {
    this.state.total++;
    const isCorrect = choiceIndex === question.correctIndex;

    if (isCorrect) {
      this.state.correct++;
      this.state.streak++;
    } else {
      this.state.streak = 0;
    }

    if (this.state.streak >= 2 && this.state.currentLevel < BloomLevel.CREATE) {
      this.state.currentLevel = (this.state.currentLevel + 1) as BloomLevel;
      this.state.streak = 0;
    }

    this.pushRecent(question.id);
    this.saveState();

    this.feedback = { isCorrect, question, chosenIndex: choiceIndex };
    this.answered = true;
    this.render();
  }

  private nextQuestion(): void {
    this.feedback = null;
    this.answered = false;
    this.currentQuestion = null;
    this.render();
  }

  private escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ============================================================
  // RENDER (UI — bilkul original)
  // ============================================================
  private render(): void {
    this.mount.innerHTML = '';

    // ---- Header ----
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      gap: 12px;
    `;
    header.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
        <span style="color: var(--accent); font-weight: 700; font-size: 14px;">Bloom: ${BLOOM_LABELS[this.state.currentLevel]}</span>
        <span style="color: var(--fg-dim); font-size: 12px;">Level ${this.state.currentLevel}/6</span>
        <span style="color: var(--fg-dim); font-size: 12px; padding: 3px 9px; background: var(--panel-bg); border-radius: 10px;">
          ${this.state.correct}/${this.state.total} correct
        </span>
      </div>
      <div style="color: var(--fg-dim); font-size: 11px; font-family: monospace; white-space: nowrap;">
        Pool: ${POINTER_QUESTIONS.filter(q => q.level === this.state.currentLevel).length} questions
      </div>
    `;
    this.mount.appendChild(header);

    // ---- Progress bar ----
    const bar = document.createElement('div');
    bar.style.cssText = `
      height: 4px;
      background: var(--border);
      border-radius: 2px;
      margin-bottom: 14px;
      overflow: hidden;
    `;
    const fill = document.createElement('div');
    fill.style.cssText = `
      width: ${(this.state.currentLevel / 6) * 100}%;
      height: 100%;
      background: linear-gradient(90deg, var(--accent) 0%, var(--pointer-glow) 100%);
      transition: width 0.4s ease;
    `;
    bar.appendChild(fill);
    this.mount.appendChild(bar);

    // ---- Feedback banner ----
    if (this.feedback) {
      const banner = document.createElement('div');
      const fb = this.feedback;
      banner.style.cssText = `
        padding: 10px 14px;
        border-radius: 8px;
        margin-bottom: 12px;
        background: ${fb.isCorrect ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)'};
        border-left: 3px solid ${fb.isCorrect ? 'var(--success)' : 'var(--error)'};
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
      `;

      const left = document.createElement('div');
      left.style.cssText = 'flex: 1; min-width: 200px;';
      if (fb.isCorrect) {
        left.innerHTML = `
          <span style="color: var(--success); font-weight: 700; font-size: 13px;">Correct</span>
          <span style="color: var(--fg-dim); font-size: 12px; margin-left: 10px;">${this.escapeHtml(fb.question.explanation)}</span>
        `;
      } else {
        const correctText = fb.question.options[fb.question.correctIndex];
        left.innerHTML = `
          <div style="color: var(--error); font-weight: 700; font-size: 13px; margin-bottom: 4px;">Not quite</div>
          <div style="font-size: 12px; color: var(--fg);">
            <span style="color: var(--fg-dim);">Correct answer:</span>
            <span style="color: var(--success); font-weight: 600; margin-left: 6px;">${this.escapeHtml(correctText)}</span>
          </div>
          <div style="font-size: 12px; color: var(--fg-dim); margin-top: 4px;">${this.escapeHtml(fb.question.explanation)}</div>
        `;
      }
      banner.appendChild(left);

      const nextBtn = document.createElement('button');
      nextBtn.textContent = fb.isCorrect ? 'Next' : 'Try another';
      nextBtn.style.cssText = `
        background: linear-gradient(135deg, var(--accent) 0%, var(--pointer-glow) 100%);
        color: var(--bg);
        border: none;
        border-radius: 6px;
        padding: 8px 18px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        white-space: nowrap;
        transition: all 0.2s ease;
      `;
      nextBtn.onmouseenter = () => { nextBtn.style.transform = 'translateY(-1px)'; };
      nextBtn.onmouseleave = () => { nextBtn.style.transform = 'translateY(0)'; };
      nextBtn.onclick = () => this.nextQuestion();
      banner.appendChild(nextBtn);

      this.mount.appendChild(banner);
    }

    // ---- Question ----
    if (!this.currentQuestion) {
      this.currentQuestion = this.pickQuestion();
    }
    if (!this.currentQuestion) {
      this.mount.innerHTML += '<div style="color: var(--fg-dim);">No questions available.</div>';
      return;
    }

    const q = document.createElement('div');
    q.style.cssText = `
      color: var(--fg);
      font-size: 14px;
      margin-bottom: 12px;
      line-height: 1.6;
    `;
    q.innerHTML = this.formatQuestion(this.currentQuestion.question);
    this.mount.appendChild(q);

    // ---- Options ----
    const opts = document.createElement('div');
    opts.style.cssText = 'display: grid; gap: 6px;';

    this.currentQuestion.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.textContent = `${String.fromCharCode(65 + i)}. ${opt}`;
      btn.disabled = this.answered;

      const isThisCorrect = this.feedback && i === this.feedback.question.correctIndex;
      const isThisChosen = this.feedback && i === this.feedback.chosenIndex;
      const showCorrect = this.feedback && !this.feedback.isCorrect && isThisCorrect;
      const showWrong = this.feedback && !this.feedback.isCorrect && isThisChosen && !isThisCorrect;

      let bg = 'var(--panel-bg)';
      let borderColor = 'var(--border)';
      let color = 'var(--fg)';

      if (showCorrect) {
        bg = 'rgba(63,185,80,0.12)';
        borderColor = 'var(--success)';
        color = 'var(--success)';
      } else if (showWrong) {
        bg = 'rgba(248,81,73,0.12)';
        borderColor = 'var(--error)';
        color = 'var(--error)';
      }

      btn.style.cssText = `
        background: ${bg};
        color: ${color};
        border: 1px solid ${borderColor};
        border-radius: 6px;
        padding: 10px 14px;
        text-align: left;
        font-size: 12.5px;
        cursor: ${this.answered ? 'default' : 'pointer'};
        font-family: inherit;
        transition: all 0.15s ease;
        line-height: 1.5;
        opacity: ${this.answered && !isThisCorrect && !isThisChosen ? '0.5' : '1'};
      `;

      if (!this.answered) {
        btn.onmouseenter = () => {
          btn.style.borderColor = 'var(--accent)';
          btn.style.background = 'var(--panel-bg-2)';
        };
        btn.onmouseleave = () => {
          btn.style.borderColor = 'var(--border)';
          btn.style.background = 'var(--panel-bg)';
        };
        btn.onclick = () => this.answer(this.currentQuestion!, i);
      }
      opts.appendChild(btn);
    });
    this.mount.appendChild(opts);
  }

  private formatQuestion(text: string): string {
    const parts = text.split(/(`[^`]+`)/g);
    let html = '';
    for (const part of parts) {
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        const code = part.slice(1, -1);
        const isMultiStatement = code.includes(';') || code.includes('\n');
        if (isMultiStatement) {
          html += `<pre style="
            background: var(--bg);
            padding: 10px 14px;
            border-radius: 6px;
            border: 1px solid var(--border);
            margin: 8px 0;
            font-family: 'Consolas', monospace;
            font-size: 12px;
            color: var(--accent);
            overflow-x: auto;
            line-height: 1.6;
            white-space: pre;
          ">${this.escapeHtml(code)}</pre>`;
        } else {
          html += `<code style="
            background: var(--panel-bg-2);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Consolas', monospace;
            font-size: 12px;
            color: var(--accent);
          ">${this.escapeHtml(code)}</code>`;
        }
      } else {
        html += this.escapeHtml(part).replace(/\n/g, '<br>');
      }
    }
    return html;
  }
}
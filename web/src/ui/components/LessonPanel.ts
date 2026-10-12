import type { Template, TemplateLesson } from '../../templates/schema.js';

const STORAGE_KEY = 'aextrace-lesson-progress';

interface LessonProgress {
  completed: string[];       // lesson ids completed
  currentLessonId: string;
}

export class LessonPanel {
  private mount: HTMLElement;
  private template: Template;
  private onLoadLesson: (lesson: TemplateLesson) => void;
  private onExit: () => void;
  private progress: LessonProgress;

  constructor(
    mount: HTMLElement,
    template: Template,
    onLoadLesson: (lesson: TemplateLesson) => void,
    onExit: () => void
  ) {
    this.mount = mount;
    this.template = template;
    this.onLoadLesson = onLoadLesson;
    this.onExit = onExit;
    this.progress = this.loadProgress();

    this.render();
  }

  private loadProgress(): LessonProgress {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as LessonProgress;
    } catch { /* ignore */ }
    return {
      completed: [],
      currentLessonId: this.template.lessons[0]?.id ?? '',
    };
  }

  private saveProgress(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
  }

  getCurrentLesson(): TemplateLesson | null {
    return this.template.lessons.find(l => l.id === this.progress.currentLessonId) ?? null;
  }

  markCompleted(lessonId: string): void {
    if (!this.progress.completed.includes(lessonId)) {
      this.progress.completed.push(lessonId);
      this.saveProgress();
    }
    this.render();
  }

  goToNext(): TemplateLesson | null {
    const idx = this.template.lessons.findIndex(l => l.id === this.progress.currentLessonId);
    if (idx < 0 || idx >= this.template.lessons.length - 1) return null;
    this.progress.currentLessonId = this.template.lessons[idx + 1].id;
    this.saveProgress();
    this.render();
    return this.getCurrentLesson();
  }

  goToLesson(lessonId: string): TemplateLesson | null {
    const lesson = this.template.lessons.find(l => l.id === lessonId);
    if (!lesson) return null;
    this.progress.currentLessonId = lessonId;
    this.saveProgress();
    this.render();
    return lesson;
  }

  private escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  render(): void {
    this.mount.innerHTML = '';
    this.mount.style.display = 'flex';
    this.mount.style.flexDirection = 'column';
    this.mount.style.height = '100%';
    this.mount.style.overflow = 'hidden';

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      background: var(--panel-bg);
      flex-shrink: 0;
    `;

    const title = document.createElement('div');
    const idx = this.template.lessons.findIndex(l => l.id === this.progress.currentLessonId);
    title.innerHTML = `
      <div style="color: var(--accent); font-size: 11px; font-weight: 700; letter-spacing: 1px;">GUIDED MODE</div>
      <div style="color: var(--fg); font-size: 13px; margin-top: 2px;">
        Lesson ${idx + 1} of ${this.template.lessons.length}: <span style="color: var(--accent); font-weight: 600;">${this.escapeHtml(this.getCurrentLesson()?.title ?? '')}</span>
      </div>
    `;
    header.appendChild(title);

    const exitBtn = document.createElement('button');
    exitBtn.textContent = 'Exit to sandbox';
    exitBtn.style.cssText = `
      background: transparent;
      color: var(--fg-dim);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 12px;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s ease;
    `;
    exitBtn.onmouseenter = () => {
      exitBtn.style.borderColor = 'var(--accent)';
      exitBtn.style.color = 'var(--accent)';
    };
    exitBtn.onmouseleave = () => {
      exitBtn.style.borderColor = 'var(--border)';
      exitBtn.style.color = 'var(--fg-dim)';
    };
    exitBtn.onclick = () => this.onExit();
    header.appendChild(exitBtn);

    this.mount.appendChild(header);

    // Lesson sidebar (list)
    const sidebar = document.createElement('div');
    sidebar.style.cssText = `
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
      background: var(--bg);
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      flex-shrink: 0;
      overflow-x: auto;
    `;

    this.template.lessons.forEach((lesson, i) => {
      const isCurrent = lesson.id === this.progress.currentLessonId;
      const isDone = this.progress.completed.includes(lesson.id);

      const chip = document.createElement('button');
      chip.style.cssText = `
        background: ${isCurrent ? 'var(--accent)' : 'var(--panel-bg)'};
        color: ${isCurrent ? 'var(--bg)' : isDone ? 'var(--success)' : 'var(--fg-dim)'};
        border: 1px solid ${isCurrent ? 'var(--accent)' : isDone ? 'var(--success)' : 'var(--border)'};
        border-radius: 14px;
        padding: 4px 11px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        white-space: nowrap;
        transition: all 0.15s ease;
      `;
      chip.textContent = `${isDone ? '✓ ' : ''}${i + 1}. ${lesson.title}`;
      chip.onclick = () => {
        const l = this.goToLesson(lesson.id);
        if (l) this.onLoadLesson(l);
      };
      sidebar.appendChild(chip);
    });

    this.mount.appendChild(sidebar);

    // Content area
    const content = document.createElement('div');
    content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 18px 20px;
    `;

    const lesson = this.getCurrentLesson();
    if (!lesson) {
      content.innerHTML = '<div style="color: var(--fg-dim);">No lesson found.</div>';
      this.mount.appendChild(content);
      return;
    }

    // Explanation
    const expl = document.createElement('div');
    expl.style.cssText = `
      color: var(--fg);
      font-size: 14px;
      line-height: 1.7;
      margin-bottom: 16px;
    `;
    expl.innerHTML = this.formatText(lesson.explanation);
    content.appendChild(expl);

    // Key points
    if (lesson.keyPoints && lesson.keyPoints.length > 0) {
      const kpTitle = document.createElement('div');
      kpTitle.style.cssText = `
        color: var(--accent);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      `;
      kpTitle.textContent = 'KEY POINTS';
      content.appendChild(kpTitle);

      const ul = document.createElement('ul');
      ul.style.cssText = `
        list-style: none;
        padding: 0;
        margin: 0 0 18px 0;
      `;

      lesson.keyPoints.forEach(pt => {
        const li = document.createElement('li');
        li.style.cssText = `
          padding: 6px 0 6px 20px;
          position: relative;
          color: var(--fg);
          font-size: 13px;
          line-height: 1.5;
        `;
        li.innerHTML = `<span style="position:absolute; left:0; color: var(--accent);">•</span>${this.formatText(pt)}`;
        ul.appendChild(li);
      });
      content.appendChild(ul);
    }

    // Navigation
    const nav = document.createElement('div');
    nav.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      margin-top: 8px;
      border-top: 1px solid var(--border);
    `;

    const idx2 = this.template.lessons.findIndex(l => l.id === this.progress.currentLessonId);
    const isFirst = idx2 === 0;
    const isLast = idx2 === this.template.lessons.length - 1;
    const isDone = this.progress.completed.includes(lesson.id);

    if (!isFirst) {
      const prevBtn = document.createElement('button');
      prevBtn.textContent = 'Previous';
      prevBtn.style.cssText = `
        background: var(--panel-bg);
        color: var(--fg);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 8px 16px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
      `;
      prevBtn.onclick = () => {
        const prev = this.template.lessons[idx2 - 1];
        const l = this.goToLesson(prev.id);
        if (l) this.onLoadLesson(l);
      };
      nav.appendChild(prevBtn);
    } else {
      nav.appendChild(document.createElement('div'));
    }

    // Mark complete + next
    const rightSide = document.createElement('div');
    rightSide.style.cssText = 'display: flex; gap: 8px; align-items: center;';

    if (!isDone) {
      const doneBtn = document.createElement('button');
      doneBtn.textContent = 'Mark as read';
      doneBtn.style.cssText = `
        background: transparent;
        color: var(--fg-dim);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 8px 14px;
        font-size: 12px;
        cursor: pointer;
        font-family: inherit;
      `;
      doneBtn.onclick = () => this.markCompleted(lesson.id);
      rightSide.appendChild(doneBtn);
    }

    if (!isLast) {
      const nextBtn = document.createElement('button');
      nextBtn.textContent = 'Next lesson →';
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
        transition: all 0.15s ease;
      `;
      nextBtn.onmouseenter = () => { nextBtn.style.transform = 'translateY(-1px)'; };
      nextBtn.onmouseleave = () => { nextBtn.style.transform = 'translateY(0)'; };
      nextBtn.onclick = () => {
        this.markCompleted(lesson.id);
        const next = this.goToNext();
        if (next) this.onLoadLesson(next);
      };
      rightSide.appendChild(nextBtn);
    } else {
      const finish = document.createElement('button');
      finish.textContent = 'Finish course ✓';
      finish.style.cssText = `
        background: linear-gradient(135deg, var(--success) 0%, var(--accent) 100%);
        color: var(--bg);
        border: none;
        border-radius: 6px;
        padding: 8px 18px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
      `;
      finish.onclick = () => {
        this.markCompleted(lesson.id);
        this.onExit();
      };
      rightSide.appendChild(finish);
    }

    nav.appendChild(rightSide);
    content.appendChild(nav);

    this.mount.appendChild(content);
  }

  private formatText(text: string): string {
    const parts = text.split(/(`[^`]+`)/g);
    let html = '';
    for (const part of parts) {
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        const code = part.slice(1, -1);
        html += `<code style="background: var(--panel-bg-2); padding: 2px 6px; border-radius: 4px; font-family: 'Consolas', monospace; font-size: 12px; color: var(--accent);">${this.escapeHtml(code)}</code>`;
      } else {
        html += this.escapeHtml(part);
      }
    }
    return html;
  }
}
import type { TraceFrame } from '../../core/types.js';

export class StepNote {
  private mount: HTMLElement;

  constructor(mount: HTMLElement) {
    this.mount = mount;
    this.mount.style.cssText = `
      padding: 12px 16px;
      background: var(--panel-bg-2);
      border-bottom: 1px solid var(--border);
      font-size: 13px;
      color: var(--fg);
      display: flex;
      align-items: flex-start;
      gap: 10px;
      min-height: 44px;
      line-height: 1.5;
      flex-shrink: 0;
    `;
  }

  update(frame: TraceFrame | null, index: number, total: number): void {
    this.mount.innerHTML = '';

    const badge = document.createElement('div');
    badge.style.cssText = `
      background: var(--accent);
      color: var(--bg);
      font-family: 'Consolas', monospace;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      flex-shrink: 0;
      margin-top: 1px;
    `;

    if (!frame) {
      badge.textContent = 'STEP 0';
      const text = document.createElement('div');
      text.style.cssText = 'color: var(--fg-dim); font-style: italic;';
      text.textContent = 'Run code to start tracing.';
      this.mount.appendChild(badge);
      this.mount.appendChild(text);
      return;
    }

    badge.textContent = `STEP ${index + 1}/${total}`;

    const text = document.createElement('div');
    text.style.cssText = 'flex: 1; color: var(--fg);';
    text.textContent = frame.stepNote || 'Executed.';

    this.mount.appendChild(badge);
    this.mount.appendChild(text);
  }
}
export interface ControlCallbacks {
  onStepForward: () => void;
  onStepBack: () => void;
  onRun: () => void;
  onPause: () => void;
  onReset: () => void;
}

export class Controls {
  private mount: HTMLElement;
  private callbacks: ControlCallbacks;
  private isPlaying = false;
  private playBtn!: HTMLButtonElement;

  constructor(mount: HTMLElement, callbacks: ControlCallbacks) {
    this.mount = mount;
    this.callbacks = callbacks;

    this.createButton('⏮', 'Back', () => this.callbacks.onStepBack());
    this.createButton('▶', 'Step', () => this.callbacks.onStepForward());
    this.playBtn = this.createButton('▶', 'Run', () => this.togglePlay(), true);
    this.createButton('■', 'Reset', () => {
      this.setPlaying(false);
      this.callbacks.onReset();
    });
  }

  private createButton(icon: string, label: string, onClick: () => void, primary = false): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.innerHTML = `<span style="font-size:11px; opacity:0.85;">${icon}</span> <span>${label}</span>`;
    btn.style.cssText = `
      background: ${primary ? 'linear-gradient(135deg, var(--accent) 0%, var(--pointer-glow) 100%)' : 'var(--panel-bg-2)'};
      color: ${primary ? 'var(--bg)' : 'var(--fg)'};
      border: 1px solid ${primary ? 'transparent' : 'var(--border)'};
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.18s ease;
      font-family: inherit;
    `;
    btn.addEventListener('click', onClick);
    btn.addEventListener('mouseenter', () => {
      if (!primary) {
        btn.style.borderColor = 'var(--accent)';
        btn.style.color = 'var(--accent)';
      }
      btn.style.transform = 'translateY(-1px)';
    });
    btn.addEventListener('mouseleave', () => {
      if (!primary) {
        btn.style.borderColor = 'var(--border)';
        btn.style.color = 'var(--fg)';
      }
      btn.style.transform = 'translateY(0)';
    });
    this.mount.appendChild(btn);
    return btn;
  }

  private togglePlay(): void {
    this.setPlaying(!this.isPlaying);
    if (this.isPlaying) this.callbacks.onRun();
    else this.callbacks.onPause();
  }

  private setPlaying(playing: boolean): void {
    this.isPlaying = playing;
    this.playBtn.innerHTML = playing
      ? '<span style="font-size:11px;">⏸</span> <span>Pause</span>'
      : '<span style="font-size:11px;">▶</span> <span>Run</span>';
  }
}
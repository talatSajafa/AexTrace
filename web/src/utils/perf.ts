export class FpsCounter {
  private frames = 0;
  private last = performance.now();
  private mount: HTMLElement;

  constructor(mount: HTMLElement) {
    this.mount = mount;
    this.mount.style.cssText = `
      position: fixed;
      bottom: 4px;
      right: 4px;
      font-size: 11px;
      color: var(--fg-dim);
      font-family: monospace;
      pointer-events: none;
      opacity: 0.6;
    `;
    this.tick();
  }

  private tick = (): void => {
    this.frames++;
    const now = performance.now();
    if (now - this.last >= 1000) {
      this.mount.textContent = `${this.frames} fps`;
      this.frames = 0;
      this.last = now;
    }
    requestAnimationFrame(this.tick);
  };
}
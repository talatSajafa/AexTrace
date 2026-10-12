import { CanvasRenderer } from '../renderers/CanvasRenderer.js';
import type { TraceFrame } from '../../core/types.js';

export class Visualizer {
  private mount: HTMLElement;
  private scrollWrap: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private renderer: CanvasRenderer;
  private currentFrame: TraceFrame | null = null;
  private rafId = 0;
  private dirty = true;
  private resizeObserver: ResizeObserver | null = null;
  private lastDpr = 1;
  private lastW = 0;
  private animateUntil = 0;

  constructor(mount: HTMLElement) {
    this.mount = mount;
    this.mount.style.padding = '0';
    this.mount.style.position = 'relative';
    this.mount.style.overflow = 'hidden';
    this.mount.style.background = 'var(--panel-bg)';

    // Scrollable wrapper (parent jaisa hi background)
    this.scrollWrap = document.createElement('div');
    this.scrollWrap.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      background: var(--panel-bg);
    `;
    this.mount.appendChild(this.scrollWrap);

    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      display: block;
      width: 100%;
    `;
    this.scrollWrap.appendChild(this.canvas);

    this.renderer = new CanvasRenderer(this.canvas);
    this.lastDpr = window.devicePixelRatio || 1;

    const rect = this.mount.getBoundingClientRect();
    this.lastW = rect.width;

    // Only resize on WIDTH change
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        const w = entry.contentRect.width;
        if (Math.abs(w - this.lastW) > 1) {
          this.lastW = w;
          this.renderer.resize();
          this.dirty = true;
        }
      });
      this.resizeObserver.observe(this.mount);
    }

    window.addEventListener('resize', () => {
      const dpr = window.devicePixelRatio || 1;
      if (dpr !== this.lastDpr) {
        this.lastDpr = dpr;
        this.renderer.resize();
        this.dirty = true;
      }
    });

    const loop = (): void => {
      const now = performance.now();
      if (this.animateUntil > now) this.dirty = true;

      if (this.dirty) {
        if (this.currentFrame) {
          this.renderer.render(this.currentFrame, now);
        } else {
          this.renderer.render(null, now);
        }
        this.dirty = false;
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);

    window.addEventListener('aextrace:theme-change', () => {
      this.dirty = true;
    });
  }

  setFrame(frame: TraceFrame | null, _line: number): void {
    this.currentFrame = frame;
    this.animateUntil = performance.now() + 1600;
    this.dirty = true;
  }

  dispose(): void {
    cancelAnimationFrame(this.rafId);
    if (this.resizeObserver) this.resizeObserver.disconnect();
  }
}
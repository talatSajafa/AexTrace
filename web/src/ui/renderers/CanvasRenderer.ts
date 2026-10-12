// ============================================================
// AexTrace — Canvas Renderer (Transparent BG + Fixed Boxes + Scroll)
// ============================================================

import type { TraceFrame, MemoryCell } from '../../core/types.js';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private contentHeight = 0;
  private lastDpr = 0;

  private prevValues = new Map<number, string>();
  private changeTimes = new Map<number, number>();

  // FIXED sizes
  private static readonly BOX_W = 210;
  private static readonly BOX_H = 62;
  private static readonly BOX_R = 10;
  private static readonly BOX_GAP = 10;
  private static readonly PAD = 16;
  private static readonly HEADER_H = 24;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D not supported');
    this.ctx = ctx;
    this.resize();
  }

  public resize(): void {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const newW = Math.floor(rect.width);

    if (newW === this.width && dpr === this.lastDpr) return;

    this.width = newW;
    this.lastDpr = dpr;

    this.canvas.style.width = this.width + 'px';
    this.ctx.textBaseline = 'middle';
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.textRendering = 'geometricPrecision';
  }

  public getContentHeight(): number {
    return this.contentHeight;
  }

  private readColors() {
    const get = (n: string, f: string): string => {
      const v = getComputedStyle(document.documentElement).getPropertyValue(n).trim();
      return v.length > 0 ? v : f;
    };
    return {
      panelBg:  get('--panel-bg', '#241e29'),
      fg:       get('--fg', '#ede8f0'),
      fgDim:    get('--fg-dim', '#9a8fa3'),
      accent:   get('--accent', '#e89ab8'),
      pointer:  get('--pointer-glow', '#c084fc'),
      success:  get('--success', '#3fb950'),
    };
  }

  public clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  public render(frame: TraceFrame | null, now: number = performance.now()): void {
    const c = this.readColors();

    // Content height calculate
    if (frame) {
      const maxCells = Math.max(frame.stackCells.length, frame.heapCells.length);
      this.contentHeight = CanvasRenderer.PAD * 2 + CanvasRenderer.HEADER_H +
        maxCells * (CanvasRenderer.BOX_H + CanvasRenderer.BOX_GAP) - CanvasRenderer.BOX_GAP;
    } else {
      this.contentHeight = 200;
    }

    const dpr = this.lastDpr || 1;
    const neededH = Math.max(this.contentHeight, 100);
    if (this.height !== neededH) {
      this.height = neededH;
      this.canvas.width = Math.floor(this.width * dpr);
      this.canvas.height = Math.floor(this.height * dpr);
      this.canvas.style.height = this.height + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ---- SIRF CLEAR, KOI BG FILL NAHI (transparent canvas) ----
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (!frame) return;

    const allCells = [...frame.stackCells, ...frame.heapCells];

    // Change detection
    const currentValues = new Map<number, string>();
    for (const cell of allCells) currentValues.set(cell.address, cell.rawValue);
    for (const [addr, val] of currentValues) {
      const prev = this.prevValues.get(addr);
      if (prev !== undefined && prev !== val) this.changeTimes.set(addr, now);
    }

    // Alias map
    const aliasMap = new Map<number, string[]>();
    for (const cell of allCells) {
      if (cell.isPointer && cell.pointsTo !== 0) {
        const list = aliasMap.get(cell.pointsTo) ?? [];
        list.push('*' + cell.varName);
        aliasMap.set(cell.pointsTo, list);
      }
    }

    const stackX = CanvasRenderer.PAD;
    const heapX = Math.floor(this.width / 2) + 8;
    this.sectionHeader('STACK', 'local variables', stackX, CanvasRenderer.PAD, c);
    this.sectionHeader('HEAP', 'dynamic memory', heapX, CanvasRenderer.PAD, c);

    const startY = CanvasRenderer.PAD + CanvasRenderer.HEADER_H;
    const stackPos = this.drawCells(frame.stackCells, stackX, startY, c, aliasMap, now);
    const heapPos  = this.drawCells(frame.heapCells,  heapX,  startY, c, aliasMap, now);

    if (frame.heapCells.length === 0) {
      this.ctx.font = 'italic 11px Inter, system-ui, sans-serif';
      this.ctx.fillStyle = c.fgDim;
      this.ctx.fillText('(no dynamic memory yet)', heapX, startY + 6);
      this.ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      this.ctx.fillStyle = c.fg;
      this.ctx.fillText('Heap fills when you use new:', heapX, startY + 26);
      this.ctx.font = 'italic 11px Inter, system-ui, sans-serif';
      this.ctx.fillStyle = c.fgDim;
      this.ctx.fillText('(coming soon)', heapX, startY + 44);
    }

    // Arrows
    const routeLimit = heapX - 10;
    for (const cell of allCells) {
      if (!cell.isPointer) continue;
      const target = allCells.find(c2 => c2.address === cell.pointsTo);
      if (!target) continue;
      const srcPos = stackPos.get(cell.address) ?? heapPos.get(cell.address);
      const dstPos = stackPos.get(target.address) ?? heapPos.get(target.address);
      if (!srcPos || !dstPos) continue;
      this.drawArrow(srcPos, dstPos, routeLimit, c);
    }

    this.prevValues = currentValues;
  }

  private sectionHeader(label: string, subtitle: string, x: number, y: number,
    c: ReturnType<CanvasRenderer['readColors']>): void {
    this.ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    this.ctx.fillStyle = c.accent;
    this.ctx.fillText(label, x, y + 8);
    const w = this.ctx.measureText(label).width;
    this.ctx.font = 'italic 10px Inter, system-ui, sans-serif';
    this.ctx.fillStyle = c.fgDim;
    this.ctx.fillText(subtitle, x + w + 6, y + 9);
  }

  private drawCells(cells: MemoryCell[], x: number, startY: number,
    c: ReturnType<CanvasRenderer['readColors']>,
    aliasMap: Map<number, string[]>, now: number): Map<number, { x: number; y: number }> {
    const positions = new Map<number, { x: number; y: number }>();
    let y = startY;
    for (const cell of cells) {
      this.drawBox(x, y, cell, c, aliasMap.get(cell.address) ?? [], now);
      positions.set(cell.address, { x, y });
      y += CanvasRenderer.BOX_H + CanvasRenderer.BOX_GAP;
    }
    return positions;
  }

  private drawBox(x: number, y: number, cell: MemoryCell,
    c: ReturnType<CanvasRenderer['readColors']>,
    aliases: string[], now: number): void {
    const w = CanvasRenderer.BOX_W;
    const h = CanvasRenderer.BOX_H;
    const r = CanvasRenderer.BOX_R;
    const isPtr = cell.isPointer;

    const changeTime = this.changeTimes.get(cell.address);
    const elapsed = changeTime !== undefined ? now - changeTime : Infinity;
    const pulse = elapsed < 1500 ? (1 - elapsed / 1500) : 0;
    const isChanged = pulse > 0;

    // Background (gradient from panel-bg lighter)
    this.ctx.save();
    const grad = this.ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, this.lighten(c.panelBg, 8));
    grad.addColorStop(1, c.panelBg);
    this.roundRect(x, y, w, h, r);
    this.ctx.fillStyle = grad;
    this.ctx.fill();
    this.ctx.restore();

    // Shadow
    this.ctx.save();
    this.ctx.shadowColor = 'rgba(0,0,0,0.4)';
    this.ctx.shadowBlur = 6;
    this.ctx.shadowOffsetY = 2;
    this.roundRect(x, y, w, h, r);
    this.ctx.fillStyle = 'rgba(0,0,0,0.001)';
    this.ctx.fill();
    this.ctx.restore();

    // Border
    this.roundRect(x, y, w, h, r);
    if (isChanged) {
      this.ctx.strokeStyle = c.success;
      this.ctx.globalAlpha = 0.4 + 0.4 * pulse;
      this.ctx.lineWidth = 1.2;
    } else {
      this.ctx.strokeStyle = isPtr ? c.pointer : c.accent;
      this.ctx.globalAlpha = 0.55;
      this.ctx.lineWidth = 1;
    }
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;

    // Left stripe
    this.ctx.beginPath();
    this.roundRect(x, y + 6, 3, h - 12, 1.5);
    this.ctx.fillStyle = isPtr ? c.pointer : c.accent;
    this.ctx.globalAlpha = isChanged ? 0.5 : 0.7;
    this.ctx.fill();
    this.ctx.globalAlpha = 1;

    // Row 1: type + name
    this.ctx.textBaseline = 'middle';
    this.ctx.font = 'bold 12px "Consolas", "Courier New", monospace';
    this.ctx.fillStyle = c.fg;
    this.ctx.fillText(cell.typeName + ' ' + cell.varName, x + 14, y + 16);

    // Alias pill
    if (aliases.length > 0) {
      const aliasText = aliases.join(' ');
      this.ctx.font = 'bold 9px "Consolas", "Courier New", monospace';
      const tw = this.ctx.measureText(aliasText).width;
      const pillW = tw + 12;
      const pillH = 15;
      const pillX = x + w - pillW - 12;
      const pillY = y + 16 - pillH / 2;

      this.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
      this.ctx.fillStyle = 'rgba(192,132,252,0.15)';
      this.ctx.fill();
      this.ctx.strokeStyle = c.pointer;
      this.ctx.globalAlpha = 0.6;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      this.ctx.globalAlpha = 1;

      this.ctx.fillStyle = c.pointer;
      this.ctx.fillText(aliasText, pillX + 6, y + 16);
    }

    // Row 2: address
    this.ctx.font = '10px "Consolas", "Courier New", monospace';
    this.ctx.fillStyle = c.fgDim;
    this.ctx.globalAlpha = 0.7;
    this.ctx.fillText('0x' + cell.address.toString(16).padStart(4, '0'), x + 14, y + 34);
    this.ctx.globalAlpha = 1;

    // Row 3: value
    const displayValue = this.formatValue(cell);
    const prevValue = this.prevValues.get(cell.address);
    const hasChanged = prevValue !== undefined && prevValue !== cell.rawValue;

    this.ctx.font = 'bold 14px "Consolas", "Courier New", monospace';
    this.ctx.fillStyle = (isPtr && (cell.rawValue === 'nullptr' || cell.pointsTo === 0))
      ? c.fgDim : (isPtr ? c.pointer : c.accent);
    this.ctx.fillText(displayValue, x + 14, y + 52);

    if (hasChanged && prevValue !== undefined) {
      const vw = this.ctx.measureText(displayValue).width;
      const oldX = x + 14 + vw + 8;
      const oldText = this.formatValueRaw(cell, prevValue);
      this.ctx.font = 'italic 10px "Consolas", "Courier New", monospace';
      this.ctx.fillStyle = c.fgDim;
      this.ctx.globalAlpha = 0.6;
      this.ctx.fillText(oldText, oldX, y + 52);
      const otw = this.ctx.measureText(oldText).width;
      this.ctx.beginPath();
      this.ctx.strokeStyle = c.fgDim;
      this.ctx.lineWidth = 1;
      this.ctx.moveTo(oldX, y + 52);
      this.ctx.lineTo(oldX + otw, y + 52);
      this.ctx.stroke();
      this.ctx.globalAlpha = 1;
    }

    // Pointer dot
    if (isPtr) {
      this.ctx.beginPath();
      this.ctx.arc(x + w - 10, y + 10, 2.5, 0, Math.PI * 2);
      this.ctx.fillStyle = c.pointer;
      this.ctx.globalAlpha = 0.8;
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
    }
  }

  private lighten(hex: string, amt: number): string {
    const m = hex.match(/^#([0-9a-f]{6})$/i);
    if (!m) return hex;
    const num = parseInt(m[1], 16);
    let r = (num >> 16) + amt;
    let g = ((num >> 8) & 0xff) + amt;
    let b = (num & 0xff) + amt;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  private formatValue(cell: MemoryCell): string {
    if (cell.isPointer) {
      if (cell.rawValue === 'nullptr' || cell.rawValue === 'null' || cell.pointsTo === 0) return 'nullptr';
      return '0x' + cell.pointsTo.toString(16).padStart(4, '0');
    }
    return cell.rawValue;
  }

  private formatValueRaw(cell: MemoryCell, raw: string): string {
    if (cell.isPointer) {
      if (raw === 'nullptr' || raw === 'null') return 'nullptr';
      const n = parseInt(raw, 10);
      if (!isNaN(n) && n > 0) return '0x' + n.toString(16).padStart(4, '0');
      return raw;
    }
    return raw;
  }

  private drawArrow(
    srcPos: { x: number; y: number }, dstPos: { x: number; y: number },
    routeLimit: number, c: ReturnType<CanvasRenderer['readColors']>): void {
    const BOX_W = CanvasRenderer.BOX_W;
    const BOX_H = CanvasRenderer.BOX_H;
    const srcRightX = srcPos.x + BOX_W;
    const srcMidY = srcPos.y + BOX_H / 2;
    const dstMidY = dstPos.y + BOX_H / 2;
    const sameColumn = srcPos.x === dstPos.x;

    this.ctx.save();
    this.ctx.strokeStyle = c.pointer;
    this.ctx.lineWidth = 1.4;
    this.ctx.globalAlpha = 0.75;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    let tipX: number, tipY: number, angle: number;

    if (sameColumn) {
      const routeX = Math.min(srcRightX + 28, routeLimit);
      this.ctx.beginPath();
      this.ctx.moveTo(srcRightX, srcMidY);
      this.ctx.lineTo(routeX, srcMidY);
      this.ctx.lineTo(routeX, dstMidY);
      this.ctx.lineTo(srcRightX + 4, dstMidY);
      this.ctx.stroke();
      tipX = srcRightX + 4; tipY = dstMidY; angle = Math.PI;
    } else {
      const fromX = srcRightX, fromY = srcMidY;
      const toX = dstPos.x - 4, toY = dstMidY;
      const midX = Math.min((fromX + toX) / 2 + 15, routeLimit);
      const midY = (fromY + toY) / 2;
      this.ctx.beginPath();
      this.ctx.moveTo(fromX, fromY);
      this.ctx.quadraticCurveTo(midX, midY, toX, toY);
      this.ctx.stroke();
      tipX = toX; tipY = toY;
      angle = Math.atan2(toY - midY, toX - midX);
    }

    this.ctx.globalAlpha = 0.9;
    const headLen = 8;
    this.ctx.beginPath();
    this.ctx.moveTo(tipX, tipY);
    this.ctx.lineTo(tipX - headLen * Math.cos(angle - Math.PI / 7), tipY - headLen * Math.sin(angle - Math.PI / 7));
    this.ctx.moveTo(tipX, tipY);
    this.ctx.lineTo(tipX - headLen * Math.cos(angle + Math.PI / 7), tipY - headLen * Math.sin(angle + Math.PI / 7));
    this.ctx.stroke();
    this.ctx.restore();
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }
}
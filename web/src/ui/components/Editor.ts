export class Editor {
  private mount: HTMLElement;
  private textarea: HTMLTextAreaElement;
  private lineNumbers: HTMLDivElement;
  private onChange: (code: string) => void;
  private history: string[] = [];
  private historyIndex = -1;

  private static readonly LINE_HEIGHT = 21;
  private static readonly PADDING_TOP = 14;

  constructor(mount: HTMLElement, onChange: (code: string) => void) {
    this.mount = mount;
    this.onChange = onChange;

    // Parent ko saaf karein
    this.mount.innerHTML = '';
    this.mount.style.cssText = `
      display: flex;
      height: 100%;
      width: 100%;
      min-height: 200px;
      background: var(--bg);
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 14px;
      overflow: hidden;
      position: relative;
    `;

    // Line Numbers
    this.lineNumbers = document.createElement('div');
    this.lineNumbers.style.cssText = `
      padding: ${Editor.PADDING_TOP}px 10px;
      text-align: right;
      color: var(--fg-dim);
      background: var(--panel-bg);
      border-right: 1px solid var(--border);
      user-select: none;
      font-size: 14px;
      line-height: ${Editor.LINE_HEIGHT}px;
      min-width: 48px;
      font-family: 'Consolas', monospace;
      overflow: hidden;
      flex-shrink: 0;
      box-sizing: border-box;
      height: 100%;
    `;
    this.mount.appendChild(this.lineNumbers);

    // Textarea
    this.textarea = document.createElement('textarea');
    this.textarea.spellcheck = false;
    this.textarea.style.cssText = `
      flex: 1;
      padding: ${Editor.PADDING_TOP}px 16px;
      background: var(--bg);
      color: var(--fg);
      border: none;
      outline: none;
      resize: none;
      font-family: inherit;
      font-size: 14px;
      line-height: ${Editor.LINE_HEIGHT}px;
      tab-size: 2;
      caret-color: var(--accent);
      white-space: pre;
      overflow-y: auto;
      overflow-x: auto;
      box-sizing: border-box;
      height: 100%;
      min-height: 0;
      display: block;
    `;

    // Default code
    this.textarea.value = `int x = 5;\nint* p = &x;\n*p = 10;`;

    this.textarea.addEventListener('input', () => {
      this.updateLineNumbers();
      this.pushHistory();
      this.onChange(this.textarea.value);
    });

    this.textarea.addEventListener('scroll', () => {
      this.lineNumbers.scrollTop = this.textarea.scrollTop;
    });

    this.textarea.addEventListener('keydown', (e) => this.handleKeyDown(e));

    this.mount.appendChild(this.textarea);
    this.updateLineNumbers();
    this.pushHistory();
    this.onChange(this.textarea.value);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const ta = this.textarea;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const value = ta.value;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) this.redo(); else this.undo();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      this.redo();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      this.insertAtCursor('  ');
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const currentLine = value.substring(lineStart, start);
      const indent = currentLine.match(/^\s*/)?.[0] ?? '';
      const trimmed = currentLine.trimEnd();
      const extraIndent = trimmed.endsWith('{') ? '  ' : '';
      const nextChar = value.charAt(end);
      if (trimmed.endsWith('{') && nextChar === '}') {
        const insertion = '\n' + indent + extraIndent + '\n' + indent;
        const newValue = value.substring(0, start) + insertion + value.substring(end);
        this.setValueAndCursor(newValue, start + 1 + indent.length + extraIndent.length);
        return;
      }
      this.insertAtCursor('\n' + indent + extraIndent);
      return;
    }
    const pairs: Record<string, string> = {
      '(': ')', '[': ']', '{': '}', '"': '"', "'": "'",
    };
    if (pairs[e.key]) {
      const closeChar = pairs[e.key];
      if (start !== end) {
        e.preventDefault();
        const selected = value.substring(start, end);
        const newValue = value.substring(0, start) + e.key + selected + closeChar + value.substring(end);
        this.setValueAndCursor(newValue, start + 1 + selected.length + 1);
        return;
      }
      if (value.charAt(start) === closeChar) {
        e.preventDefault();
        ta.selectionStart = ta.selectionEnd = start + 1;
        return;
      }
      e.preventDefault();
      const newValue = value.substring(0, start) + e.key + closeChar + value.substring(end);
      this.setValueAndCursor(newValue, start + 1);
      return;
    }
    if (e.key === 'Backspace' && start === end && start > 0) {
      const before = value.charAt(start - 1);
      const after = value.charAt(start);
      if ((before === '(' && after === ')') ||
          (before === '[' && after === ']') ||
          (before === '{' && after === '}') ||
          (before === '"' && after === '"') ||
          (before === "'" && after === "'")) {
        e.preventDefault();
        const newValue = value.substring(0, start - 1) + value.substring(start + 1);
        this.setValueAndCursor(newValue, start - 1);
      }
    }
  }

  private insertAtCursor(text: string): void {
    const ta = this.textarea;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const value = ta.value;
    const newValue = value.substring(0, start) + text + value.substring(end);
    this.setValueAndCursor(newValue, start + text.length);
  }

  private setValueAndCursor(newValue: string, cursorPos: number): void {
    this.textarea.value = newValue;
    this.textarea.selectionStart = this.textarea.selectionEnd = cursorPos;
    this.updateLineNumbers();
    this.pushHistory();
    this.onChange(newValue);
  }

  private pushHistory(): void {
    const current = this.textarea.value;
    if (this.history[this.historyIndex] === current) return;
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(current);
    if (this.history.length > 200) this.history.shift();
    this.historyIndex = this.history.length - 1;
  }

  private undo(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.textarea.value = this.history[this.historyIndex];
      this.updateLineNumbers();
      this.onChange(this.textarea.value);
    }
  }

  private redo(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.textarea.value = this.history[this.historyIndex];
      this.updateLineNumbers();
      this.onChange(this.textarea.value);
    }
  }

  private updateLineNumbers(): void {
    const lines = this.textarea.value.split('\n').length;
    let html = '';
    for (let i = 1; i <= lines; i++) {
      html += `<div style="height: ${Editor.LINE_HEIGHT}px; line-height: ${Editor.LINE_HEIGHT}px;">${i}</div>`;
    }
    this.lineNumbers.innerHTML = html;
  }

  getValue(): string { return this.textarea.value; }

  setValue(code: string): void {
    this.textarea.value = code;
    this.updateLineNumbers();
    this.pushHistory();
    this.onChange(code);
  }
}
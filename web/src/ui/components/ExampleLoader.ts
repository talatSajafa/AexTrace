const EXAMPLES: Record<string, string> = {
  'Basic pointer': `int x = 5;
int* p = &x;`,

  'Dereference': `int x = 5;
int* p = &x;
*p = 10;`,

  'Multiple vars': `int a = 1;
int b = 2;
int* p = &a;
*p = 99;`,

  'Null pointer': `int* p = nullptr;`,

  'Reassign pointer': `int a = 1;
int b = 2;
int* p = &a;
p = &b;`,
};

export class ExampleLoader {
  private mount: HTMLElement;

  constructor(mount: HTMLElement, onLoad: (code: string) => void) {
    this.mount = mount;

    const select = document.createElement('select');
    select.style.cssText = `
      background: var(--panel-bg-2);
      color: var(--fg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 12px;
      cursor: pointer;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s ease;
    `;

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '📚 Load example…';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    for (const name of Object.keys(EXAMPLES)) {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    }

    select.addEventListener('change', () => {
      const code = EXAMPLES[select.value];
      if (code) onLoad(code);
      select.selectedIndex = 0;
    });

    select.addEventListener('mouseenter', () => {
      select.style.borderColor = 'var(--accent)';
    });
    select.addEventListener('mouseleave', () => {
      select.style.borderColor = 'var(--border)';
    });

    this.mount.appendChild(select);
  }
}
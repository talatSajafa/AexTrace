const THEMES = [
  { id: 'obsidian',  label: 'Obsidian' },
  { id: 'midnight',  label: 'Midnight' },
  { id: 'solarized', label: 'Solarized' },
  { id: 'contrast',  label: 'High Contrast' },
  { id: 'monokai',   label: 'Monokai' },
  { id: 'sakura',    label: 'Sakura' },
] as const;

type ThemeId = typeof THEMES[number]['id'];

const STORAGE_KEY = 'aextrace-theme';

export class ThemeSwitcher {
  private mount: HTMLElement;
  private select: HTMLSelectElement;

  constructor(mount: HTMLElement) {
    this.mount = mount;

    this.select = document.createElement('select');
    this.select.style.cssText = `
      background: var(--panel-bg-2);
      color: var(--fg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 13px;
      cursor: pointer;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    `;

    for (const theme of THEMES) {
      const opt = document.createElement('option');
      opt.value = theme.id;
      opt.textContent = theme.label;
      this.select.appendChild(opt);
    }

    const saved = this.loadTheme();
    this.apply(saved);
    this.select.value = saved;

    this.select.addEventListener('change', () => {
      const id = this.select.value as ThemeId;
      this.apply(id);
      this.saveTheme(id);
    });

    this.select.addEventListener('mouseenter', () => {
      this.select.style.borderColor = 'var(--accent)';
      this.select.style.boxShadow = '0 0 12px var(--accent-glow)';
    });
    this.select.addEventListener('mouseleave', () => {
      this.select.style.borderColor = 'var(--border)';
      this.select.style.boxShadow = 'none';
    });

    this.mount.appendChild(this.select);
  }

  private apply(id: ThemeId): void {
    document.documentElement.setAttribute('data-theme', id);
    // Notify canvas renderers to redraw with new colors
    window.dispatchEvent(new CustomEvent('aextrace:theme-change'));
  }

  private loadTheme(): ThemeId {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && THEMES.some(t => t.id === saved)) {
      return saved as ThemeId;
    }
    return 'sakura';
  }

  private saveTheme(id: ThemeId): void {
    localStorage.setItem(STORAGE_KEY, id);
  }
}
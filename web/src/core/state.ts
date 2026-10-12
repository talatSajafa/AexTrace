import { StorageEngine } from '../adapters/StorageEngine.js';

const KEY_EDITOR = 'editor-content';
const KEY_THEME  = 'theme';

export class AppState {
  private storage: StorageEngine;

  constructor(storage: StorageEngine) {
    this.storage = storage;
  }

  async saveEditor(code: string): Promise<void> {
    await this.storage.set(KEY_EDITOR, code);
  }

  async loadEditor(): Promise<string | null> {
    return this.storage.get<string>(KEY_EDITOR);
  }

  async saveTheme(theme: string): Promise<void> {
    await this.storage.set(KEY_THEME, theme);
  }

  async loadTheme(): Promise<string | null> {
    return this.storage.get<string>(KEY_THEME);
  }
}
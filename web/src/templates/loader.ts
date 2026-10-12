import type { Template } from './schema.js';

export async function loadTemplate(url: string): Promise<Template> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Template load failed: ${res.status}`);
  const data = (await res.json()) as Template;
  validate(data);
  return data;
}

function validate(t: Template): void {
  if (!t.id || !t.name || !Array.isArray(t.lessons)) {
    throw new Error('Invalid template structure');
  }
}
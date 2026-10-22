import { readFile } from 'node:fs/promises';

export const root = new URL('../', import.meta.url);

export function validateRegistry(entries) {
  if (!Array.isArray(entries) || !entries.length) throw new Error('Registry must contain demos');
  const seen = new Set();
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object'
      || typeof entry.id !== 'string' || !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(entry.id)
      || typeof entry.version !== 'string' || !/^v[1-9][0-9]*$/.test(entry.version)
      || entry.directory !== `examples/${entry.id}/${entry.version}`
      || typeof entry.title !== 'string' || !entry.title.trim()
      || typeof entry.description !== 'string' || !entry.description.trim()
      || !Array.isArray(entry.frameworks) || !entry.frameworks.length
      || entry.frameworks.some(value => typeof value !== 'string' || !value.trim())) {
      throw new Error('Invalid demo registry entry');
    }
    if (entry.docsUrl && !entry.docsUrl.startsWith('https://')) throw new Error('docsUrl must be HTTPS');
    const key = `${entry.id}/${entry.version}`;
    if (seen.has(key)) throw new Error(`Duplicate demo: ${key}`);
    seen.add(key);
  }
  return entries;
}
export async function loadRegistry() {
  return validateRegistry(JSON.parse(await readFile(new URL('registry.json', root), 'utf8')));
}

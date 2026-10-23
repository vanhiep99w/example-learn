import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRegistry, validateRegistry } from '../scripts/registry.mjs';
test('registry has independently built React/Vue and vanilla demos', async () => {
  const registry = await loadRegistry();
  assert.equal(registry.length, 9);
  assert.deepEqual(registry[0].frameworks, ['React', 'Vue']);
  for (const entry of registry) assert(entry.directory.startsWith('examples/'));
});
test('rejects duplicate IDs, traversal and malformed versions', async () => {
  const [entry] = await loadRegistry();
  for (const entries of [[entry, entry], [{...entry,id:'../escape'}], [{...entry,directory:'../escape'}], [{...entry,version:'v0'}], [{...entry,docsUrl:'javascript:alert(1)'}]]) {
    assert.throws(() => validateRegistry(entries));
  }
});

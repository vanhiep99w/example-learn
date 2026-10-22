import test from 'node:test';
import assert from 'node:assert/strict';
import { readDemoMode } from '../examples/micro-frontend/communication/v1/src/modes.ts';
test('only a known controlled teaching variant changes consumer behavior', () => {
  assert.equal(readDemoMode('?mode=events-only'),'events-only');
  for(const search of ['', '?mode=snapshot', '?mode=typo', '?src=https://evil.test', '?mode=https://evil.test']) assert.equal(readDemoMode(search),'snapshot');
});

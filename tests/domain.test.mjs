import test from 'node:test';
import assert from 'node:assert/strict';
import { createCartOwner, createBus, CART_UPDATED } from '../examples/micro-frontend/communication/v1/src/domain.ts';

test('command commits immutable snapshot before event; quantity is not number of lines', async () => {
  const owner = createCartOwner(undefined, 0);
  const seen = [];
  owner.port.subscribe(() => seen.push(owner.port.getSnapshot()));
  assert.equal(owner.port.getSnapshot().itemCount, 2);
  assert.deepEqual(await owner.port.addItem({productId:'mug',quantity:1}), {ok:true});
  assert.equal(seen[0].itemCount, 3);
  assert.equal(seen[0].lines.length, 2);
  assert.equal(seen[0].revision, 1);
  assert(Object.isFrozen(seen[0]));
  assert(Object.isFrozen(seen[0].lines[0]));
});
test('late mount reads current snapshot; unsubscribe cleans up without deleting owner state', async () => {
  const owner = createCartOwner(undefined, 0);
  await owner.port.addItem({productId:'mug',quantity:1});
  let deliveries = 0;
  const off = owner.port.subscribe(() => deliveries++);
  assert.equal(deliveries, 0);
  assert.equal(owner.port.getSnapshot().itemCount, 3);
  assert.equal(owner.bus.size, 1);
  off(); off();
  assert.equal(owner.bus.size, 0);
  await owner.port.addItem({productId:'mug',quantity:1});
  assert.equal(deliveries, 0);
  assert.equal(owner.port.getSnapshot().itemCount, 4);
});
test('rejected command and invalid event do not commit; replay does not double apply', async () => {
  const owner = createCartOwner(undefined, 0);
  let updates = 0;
  owner.port.subscribe(() => updates++);
  owner.rejectNext();
  const result = await owner.port.addItem({productId:'mug',quantity:1});
  assert.equal(result.ok, false);
  assert.equal(owner.port.getSnapshot().revision, 0);
  assert.equal(updates, 0);
  assert.equal(owner.bus.publish({type:CART_UPDATED,payload:{itemCount:'invalid'}}), false);
  await owner.port.addItem({productId:'mug',quantity:1});
  owner.bus.replay();
  assert.equal(updates, 1);
  assert.equal(owner.port.getSnapshot().itemCount, 3);
});
test('concurrent commands serialize and inputs are captured before awaiting', async () => {
  const owner = createCartOwner(undefined, 0);
  const input = { productId:'mug',quantity:1 };
  const first = owner.port.addItem(input);
  input.quantity = 9;
  await Promise.all([first, owner.port.addItem({productId:'shirt',quantity:2})]);
  assert.equal(owner.port.getSnapshot().itemCount, 5);
  assert.equal(owner.port.getSnapshot().revision, 2);
  assert.equal((await owner.port.addItem({productId:'mug',quantity:0})).ok, false);
});
test('bad listeners are isolated from other listeners and mutation success', async () => {
  const trace = [];
  const bus = createBus((kind,message) => trace.push([kind,message]));
  let seen = 0;
  bus.subscribe(() => {throw new Error('sync');});
  bus.subscribe(async () => {throw new Error('async');});
  bus.subscribe(event => { seen++; assert(Object.isFrozen(event.payload)); });
  assert.equal(bus.publish({type:CART_UPDATED,source:'cart',eventId:'1',payload:{cartId:'demo-cart',revision:1,itemCount:3}}), true);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(seen, 1);
  assert.equal(trace.filter(([kind]) => kind === 'ERROR').length, 2);
});

test('Vue quantity commands share the owner queue, notify once and support removing every line', async () => {
  const owner = createCartOwner(undefined, 0);
  let changes = 0;
  owner.port.subscribe(() => changes++);
  await Promise.all([
    owner.port.addItem({productId:'mug',quantity:2}),
    owner.port.setQuantity({productId:'shirt',quantity:3}),
  ]);
  assert.equal(owner.port.getSnapshot().itemCount, 5);
  assert.equal(owner.port.getSnapshot().revision, 2);
  assert.equal(changes, 2);
  await owner.port.setQuantity({productId:'mug',quantity:0});
  await owner.port.setQuantity({productId:'shirt',quantity:0});
  assert.equal(owner.port.getSnapshot().itemCount, 0);
  assert.deepEqual(owner.port.getSnapshot().lines, []);
  assert.equal(changes, 4);
  await owner.port.setQuantity({productId:'shirt',quantity:0}); // Idempotent no-op.
  assert.equal(changes, 4);
  assert.equal((await owner.port.setQuantity({productId:'shirt',quantity:-1})).ok, false);
});
test('rejected quantity changes preserve snapshot identity and later commands still succeed', async () => {
  const owner = createCartOwner(undefined, 0);
  const initial = owner.port.getSnapshot();
  owner.rejectNext();
  assert.equal((await owner.port.setQuantity({productId:'shirt',quantity:3})).ok, false);
  assert.equal(owner.port.getSnapshot(), initial);
  assert.equal((await owner.port.setQuantity({productId:'shirt',quantity:3})).ok, true);
  assert.equal(owner.port.getSnapshot().itemCount, 3);
});

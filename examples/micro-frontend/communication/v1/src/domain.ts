// This browser-only lab simulates an API. Nothing is persisted or sent to a server.
export const CART_UPDATED = 'shop.cart.updated.v1' as const;
export type ProductId = 'shirt' | 'mug';
export type Line = Readonly<{ productId: ProductId; name: string; quantity: number }>;
export type Snapshot = Readonly<{ cartId: string; revision: number; itemCount: number; lines: readonly Line[] }>;
export type CartEvent = Readonly<{
  type: typeof CART_UPDATED; eventId: string; source: 'cart'; payload: Readonly<{
    cartId: string; revision: number; itemCount: number;
  }>;
}>;
export type Trace = (kind: string, message: string) => void;
export type AddResult = Readonly<{ ok: true } | { ok: false; reason: string }>;
export type CartPort = Readonly<{
  addItem(input: { productId: ProductId; quantity: number }): Promise<AddResult>;
  getSnapshot(): Snapshot;
  subscribe(handler: () => void): () => void;
}>;

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const count = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
export function isCartEvent(value: unknown): value is CartEvent {
  return record(value) && value.type === CART_UPDATED && value.source === 'cart'
    && typeof value.eventId === 'string' && value.eventId.length > 0 && value.eventId.length <= 100
    && record(value.payload) && value.payload.cartId === 'demo-cart'
    && count(value.payload.revision) && count(value.payload.itemCount);
}

export function createBus(trace: Trace = () => {}) {
  const handlers = new Set<(event: CartEvent) => void | Promise<void>>();
  let last: CartEvent | undefined;
  return {
    publish(input: unknown): boolean {
      if (!isCartEvent(input)) {
        trace('REJECT', 'Event sai schema: không dispatch, state không đổi.');
        return false;
      }
      const event: CartEvent = Object.freeze({
        type: CART_UPDATED, source: 'cart', eventId: input.eventId,
        payload: Object.freeze({ ...input.payload }),
      });
      last = event;
      trace('EVENT', `${event.type} · revision ${event.payload.revision} · ${handlers.size} listener`);
      // Snapshot the set: a handler added during delivery does not receive an old event.
      for (const handler of [...handlers]) {
        try {
          void Promise.resolve(handler(event)).catch(() => trace('ERROR', 'Listener bị lỗi; mutation vẫn thành công.'));
        } catch {
          trace('ERROR', 'Listener bị lỗi; mutation vẫn thành công.');
        }
      }
      return true;
    },
    subscribe(handler: (event: CartEvent) => void | Promise<void>) {
      handlers.add(handler);
      let active = true;
      return () => { if (active) { active = false; handlers.delete(handler); } };
    },
    replay() {
      if (last) this.publish(last);
      else trace('INFO', 'Chưa có event để phát lại. Hãy thêm sản phẩm trước.');
    },
    get size() { return handlers.size; },
  };
}

export function createCartOwner(trace: Trace = () => {}, delayMs = 350) {
  const bus = createBus(trace);
  const makeSnapshot = (revision: number, lines: readonly Line[]): Snapshot => Object.freeze({
    cartId: 'demo-cart', revision,
    itemCount: lines.reduce((total, line) => total + line.quantity, 0),
    lines: Object.freeze(lines.map(line => Object.freeze({ ...line }))),
  });
  let snapshot = makeSnapshot(0, [{ productId: 'shirt', name: 'Áo', quantity: 2 }]);
  let rejectNext = false;
  let queue = Promise.resolve<unknown>(undefined);
  const commit = (lines: readonly Line[]) => {
    snapshot = makeSnapshot(snapshot.revision + 1, lines);
    trace('COMMIT', `Cart owner ghi snapshot: ${snapshot.itemCount} sản phẩm · revision ${snapshot.revision}`);
    bus.publish({
      type: CART_UPDATED, source: 'cart', eventId: `cart-${snapshot.revision}`,
      payload: { cartId: snapshot.cartId, revision: snapshot.revision, itemCount: snapshot.itemCount },
    });
  };
  const port: CartPort = Object.freeze({
    getSnapshot() {
      trace('QUERY', `Đọc snapshot revision ${snapshot.revision} · ${snapshot.itemCount} sản phẩm`);
      return snapshot;
    },
    addItem(input: { productId: ProductId; quantity: number }) {
      // Capture primitives at the command boundary, so callers cannot mutate queued work.
      const { productId, quantity } = input;
      trace('COMMAND', `catalog → addItem(${productId}, ${quantity})`);
      if (!['shirt', 'mug'].includes(productId) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10) {
        return Promise.resolve({ ok: false, reason: 'Sản phẩm hoặc số lượng không hợp lệ.' } as const);
      }
      const rejected = rejectNext;
      rejectNext = false;
      const result = queue.then(async (): Promise<AddResult> => {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        if (rejected) {
          trace('REJECT', 'API giả lập từ chối command: không commit, không phát cart.updated.');
          return { ok: false, reason: 'API giả lập từ chối. Giỏ chưa thay đổi.' };
        }
        const existing = snapshot.lines.find(line => line.productId === productId);
        const lines = existing
          ? snapshot.lines.map(line => line.productId === productId ? { ...line, quantity: line.quantity + quantity } : line)
          : [...snapshot.lines, { productId, name: productId === 'mug' ? 'Cốc' : 'Áo', quantity }];
        commit(lines);
        return { ok: true };
      });
      queue = result;
      return result;
    },
    subscribe(handler: () => void) {
      // A subscription is not replay. Consumers subscribe, then read the current snapshot.
      let revision = snapshot.revision;
      trace('MOUNT', `Đăng ký listener từ revision ${revision}`);
      const off = bus.subscribe(event => {
        if (event.payload.revision <= revision) {
          trace('IGNORE', `Bỏ event lặp/cũ revision ${event.payload.revision}; không cộng quantity lần nữa.`);
          return;
        }
        revision = snapshot.revision;
        handler();
      });
      return () => { off(); trace('CLEANUP', 'Gỡ listener; snapshot vẫn thuộc cart owner.'); };
    },
  });
  return {
    port, bus,
    rejectNext() { rejectNext = true; trace('API', 'Command hợp lệ tiếp theo sẽ bị từ chối.'); },
  };
}

import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { createApp } from 'vue';
import { Catalog } from './Catalog';
import Cart from './Cart.vue';
import { createCartOwner, type Trace } from './domain';
import './style.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<main>
  <header class="intro"><p class="eyebrow">MICRO-FRONTEND / COMMUNICATION LAB · V1</p>
    <h1>Một giỏ hàng. Một nơi được ghi.</h1>
    <p>Catalog React và Cart Vue dùng cùng một contract nhỏ. Thêm cốc rồi thử tháo một consumer ra khỏi trang.</p>
  </header>
  <div class="shell-bar"><div><span class="eyebrow">SHELL / SNAPSHOT CONSUMER</span><div id="badge"></div></div>
    <p><strong id="listener-count">0</strong> listener đang hoạt động</p></div>
  <div class="controls" aria-label="Điều khiển lifecycle">
    <button id="toggle-header" type="button" aria-pressed="true">Ẩn Header</button>
    <button id="toggle-cart" type="button" aria-pressed="true">Ẩn Cart Vue</button>
    <button id="reject-next" type="button">Từ chối lần thêm tiếp theo</button>
  </div>
  <div class="domains"><div id="catalog"></div><div id="cart"></div></div>
  <section class="inspector" aria-labelledby="trace-title">
    <div class="trace-heading"><div><p class="eyebrow">ĐƯỜNG ĐI THẬT TRONG DEMO</p><h2 id="trace-title">Command → snapshot → event</h2></div>
      <div class="controls"><button id="replay" type="button">Phát lại event cuối</button><button id="invalid" type="button">Gửi event sai schema</button><button id="clear-log" type="button">Xóa log</button></div></div>
    <ol id="trace" aria-label="Nhật ký giao tiếp"></ol>
  </section>
  <footer>API được giả lập trong memory, chờ 350 ms; không có request backend. Không dùng Module Federation trong lab này: React và Vue được build cùng một demo. Iframe chỉ ngăn CSS/runtime đụng với trang docs. Reload để đặt lại toàn bộ state.</footer>
</main>`;

const list = document.querySelector<HTMLOListElement>('#trace')!;
const listenerCount = document.querySelector<HTMLElement>('#listener-count')!;
let sequence = 0;
const trace: Trace = (kind, message) => {
  const row = document.createElement('li');
  const tag = document.createElement('span');
  tag.className = 'trace-kind'; tag.textContent = `${String(++sequence).padStart(2, '0')} ${kind}`;
  const detail = document.createElement('span'); detail.textContent = message;
  row.append(tag, detail); list.prepend(row);
  while (list.children.length > 40) list.lastElementChild?.remove();
};
const owner = createCartOwner(trace);
const updateListeners = () => { listenerCount.textContent = String(owner.bus.size); };
createRoot(document.querySelector('#catalog')!).render(createElement(Catalog, { cart: owner.port }));

const badge = document.querySelector<HTMLElement>('#badge')!;
let headerOff: (() => void) | undefined;
function mountHeader() {
  const render = () => {
    const snapshot = owner.port.getSnapshot();
    badge.textContent = `Giỏ: ${snapshot.itemCount} · revision ${snapshot.revision}`;
    badge.dataset.testid = 'header-count';
  };
  headerOff = owner.port.subscribe(render);
  render();
}
mountHeader();

let cartApp: ReturnType<typeof createApp> | undefined;
function mountCart() {
  cartApp = createApp(Cart, { cart: owner.port });
  cartApp.mount('#cart');
}
mountCart();
updateListeners();

const headerButton = document.querySelector<HTMLButtonElement>('#toggle-header')!;
headerButton.onclick = () => {
  if (headerOff) {
    headerOff(); headerOff = undefined;
    badge.textContent = 'Header đã unmount'; delete badge.dataset.testid;
  } else mountHeader();
  headerButton.textContent = headerOff ? 'Ẩn Header' : 'Mount Header';
  headerButton.setAttribute('aria-pressed', String(Boolean(headerOff)));
  updateListeners();
};
const cartButton = document.querySelector<HTMLButtonElement>('#toggle-cart')!;
cartButton.onclick = () => {
  if (cartApp) {
    cartApp.unmount(); cartApp = undefined;
    document.querySelector('#cart')!.textContent = 'Cart Vue đã unmount. Cart owner vẫn nhận command.';
  } else mountCart();
  cartButton.textContent = cartApp ? 'Ẩn Cart Vue' : 'Mount Cart Vue';
  cartButton.setAttribute('aria-pressed', String(Boolean(cartApp)));
  updateListeners();
};
document.querySelector<HTMLButtonElement>('#reject-next')!.onclick = () => owner.rejectNext();
document.querySelector<HTMLButtonElement>('#replay')!.onclick = () => owner.bus.replay();
document.querySelector<HTMLButtonElement>('#invalid')!.onclick = () => {
  owner.bus.publish({ type: 'shop.cart.updated.v1', source: 'cart', eventId: 'invalid', payload: { cartId: 'demo-cart', revision: 99, itemCount: 'sai kiểu' } });
};
document.querySelector<HTMLButtonElement>('#clear-log')!.onclick = () => { list.replaceChildren(); sequence = 0; };

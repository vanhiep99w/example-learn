import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { createApp } from 'vue';
import { Catalog } from './Catalog';
import Cart from './Cart.vue';
import { createCartOwner, type Trace } from './domain';
import './style.css';

const bagIcon = '<svg width="20" height="22" viewBox="0 0 24 28" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 8h16l1 17H3L4 8Z"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/></svg>';
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<div class="demo-ribbon">Một cửa hàng mô phỏng để học micro-frontend. Không có thanh toán thật.</div>
<div class="storefront">
  <header class="store-header">
    <a class="wordmark" href="#catalog" aria-label="Nếp — về sản phẩm">nếp<span>.</span></a>
    <span class="brand-caption">NHỮNG MÓN ĐỒ QUEN</span>
    <a id="header-cart" class="header-cart" href="#cart" aria-label="Xem giỏ hàng ở header">
      ${bagIcon}<span>Giỏ hàng</span><span id="badge" class="cart-badge" aria-live="polite" aria-atomic="true"></span>
    </a>
    <span id="header-paused" class="header-paused" hidden>Header đang tạm ẩn</span>
  </header>
  <main>
    <div class="shop-intro"><div><p class="eyebrow">ÍT MÓN HƠN, DỄ CHỌN HƠN</p><h1>Một chút cho mỗi ngày.</h1></div><p>Hai món đồ quen thuộc.<br>Chọn món bạn thích, thử thêm vào giỏ.</p></div>
    <aside class="lesson-note" aria-label="Bài tập tương tác"><span class="lesson-label">THỬ NGAY</span><p>Giỏ đã có <strong>2 chiếc áo</strong>. Thêm <strong>1 chiếc cốc</strong> và nhìn số trên header cùng giỏ hàng đổi thành <strong>3</strong>.</p></aside>
    <div class="shop-layout"><div id="catalog"></div><div id="cart"></div></div>
    <details class="inspector">
      <summary><span class="inspector-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m8 7-5 5 5 5m8-10 5 5-5 5M14 4l-4 16"/></svg>Xem luồng giao tiếp</span><span class="inspector-caption">React · Cart owner · Vue</span><span class="disclosure-icon" aria-hidden="true">+</span></summary>
      <div class="inspector-body">
        <div class="inspector-intro"><div><h2>Điều gì xảy ra sau nút “Thêm vào giỏ”?</h2><p>Catalog gửi command. Cart owner chờ API giả lập, ghi snapshot rồi phát event để header và Cart đọc lại.</p></div><p class="listener-stat"><strong id="listener-count">0</strong> listener đang hoạt động</p></div>
        <div class="lab-controls"><div><span class="control-label">THỬ VÒNG ĐỜI COMPONENT</span><div class="controls" aria-label="Điều khiển lifecycle"><button id="toggle-header" type="button" aria-pressed="true">Ẩn Header</button><button id="toggle-cart" type="button" aria-pressed="true">Ẩn Cart Vue</button></div><p>Ẩn cả hai rồi thêm hàng: owner vẫn giữ giỏ. Mount lại để đọc snapshot mới.</p></div>
        <div><span class="control-label">THỬ TÌNH HUỐNG LỖI</span><div class="controls"><button id="reject-next" type="button">Từ chối lần thêm tiếp theo</button><button id="replay" type="button">Phát lại event cuối</button><button id="invalid" type="button">Gửi event sai schema</button></div><p>Command lỗi không đổi giỏ; event lặp không cộng quantity lần nữa.</p></div></div>
        <p id="lab-notice" class="lab-notice" role="status" aria-live="polite"></p>
        <div class="log-heading"><h3>Nhật ký thực thi</h3><button id="clear-log" type="button" class="text-button">Xóa log</button></div>
        <ol id="trace" aria-label="Nhật ký giao tiếp"></ol>
        <p class="lab-footnote">API mô phỏng trong memory, chờ 350 ms; không có request backend. Log QUERY là đọc snapshot, không phải HTTP. Xóa log không xóa giỏ.</p>
      </div>
    </details>
    <footer class="store-footer"><span><strong>nếp.</strong> Một shop nhỏ, nhiều điều để quan sát.</span><span>Catalog React · Giỏ hàng Vue · Shell JavaScript</span><p>Demo được build chung, không dùng Module Federation. Giá và thông tin sản phẩm chỉ để minh họa. Reload để trở về giỏ có hai chiếc áo.</p></footer>
  </main>
</div>`;

const list = document.querySelector<HTMLOListElement>('#trace')!;
const listenerCount = document.querySelector<HTMLElement>('#listener-count')!;
const labNotice = document.querySelector<HTMLElement>('#lab-notice')!;
let sequence = 0;
const trace: Trace = (kind, message) => {
  const row = document.createElement('li');
  row.dataset.kind = kind;
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
const headerCart = document.querySelector<HTMLElement>('#header-cart')!;
const headerPaused = document.querySelector<HTMLElement>('#header-paused')!;
let headerOff: (() => void) | undefined;
function mountHeader() {
  const render = () => {
    const snapshot = owner.port.getSnapshot();
    badge.textContent = String(snapshot.itemCount);
    badge.dataset.revision = String(snapshot.revision);
    badge.dataset.testid = 'header-count';
  };
  headerCart.hidden = false;
  headerPaused.hidden = true;
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
    headerCart.hidden = true;
    headerPaused.hidden = false;
    delete badge.dataset.testid;
  } else mountHeader();
  headerButton.textContent = headerOff ? 'Ẩn Header' : 'Mount Header';
  headerButton.setAttribute('aria-pressed', String(Boolean(headerOff)));
  updateListeners();
};
const cartButton = document.querySelector<HTMLButtonElement>('#toggle-cart')!;
function toggleCart() {
  if (cartApp) {
    cartApp.unmount(); cartApp = undefined;
    document.querySelector('#cart')!.innerHTML = `<section class="cart-paused"><span class="framework-label">Cart · Vue</span>${bagIcon}<h2>Giỏ đang tạm ẩn.</h2><p>Dữ liệu vẫn ở cart owner. Bạn cứ thêm hàng, rồi mở lại giỏ để thấy snapshot mới.</p><button type="button" id="restore-cart">Mở lại giỏ hàng</button></section>`;
    document.querySelector<HTMLButtonElement>('#restore-cart')!.onclick = toggleCart;
  } else mountCart();
  cartButton.textContent = cartApp ? 'Ẩn Cart Vue' : 'Mount Cart Vue';
  cartButton.setAttribute('aria-pressed', String(Boolean(cartApp)));
  updateListeners();
}
cartButton.onclick = toggleCart;
document.querySelector<HTMLButtonElement>('#reject-next')!.onclick = () => {
  owner.rejectNext();
  labNotice.textContent = 'Đã bật lỗi API cho command tiếp theo. Thử thêm sản phẩm hoặc sửa số lượng trong giỏ.';
};
document.querySelector<HTMLButtonElement>('#replay')!.onclick = () => owner.bus.replay();
document.querySelector<HTMLButtonElement>('#invalid')!.onclick = () => {
  owner.bus.publish({ type: 'shop.cart.updated.v1', source: 'cart', eventId: 'invalid', payload: { cartId: 'demo-cart', revision: 99, itemCount: 'sai kiểu' } });
};
document.querySelector<HTMLButtonElement>('#clear-log')!.onclick = () => { list.replaceChildren(); sequence = 0; };

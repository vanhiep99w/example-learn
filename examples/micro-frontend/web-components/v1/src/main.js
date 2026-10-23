import { setupLab } from '../../../../../shared/lab.js';
import './element.js';
import './host.css';
const log=setupLab({
 title:'Một product card sau Shadow DOM',
 intro:'Shell truyền capability thêm giỏ cho custom element. Attributes điều khiển UI; component phát notification qua shadow boundary sau command thành công.',
 body:`<div class="controls"><button id="toggle">Unmount card</button><label><input id="disabled" type="checkbox"> Disabled</label><label>Ngôn ngữ <select id="locale"><option value="vi">Tiếng Việt</option><option value="en">English</option></select></label><label><input id="part" type="checkbox"> Style ::part(action)</label></div>
 <div class="modules"><section class="module" data-module="catalog"><span class="module-label">CATALOG · CUSTOM ELEMENT</span><div id="slot"></div><p class="hint">Nút nằm trong shadow root. Shell chỉ style part đã được công khai.</p></section>
 <aside class="module" data-module="cart"><span class="module-label">SHELL · CART OWNER</span><h2>Giỏ hàng</h2><p class="result"><span id="count">2</span> sản phẩm</p><p>Command đã gọi: <strong id="commands">0</strong></p><p>Notification nhận: <strong id="events">0</strong></p></aside></div>`,
 note:'Đây là native Web Component, không phải iframe hay framework remote. Function addItem chỉ dùng trong cùng JS realm. API được mô phỏng chờ 150 ms. Disconnect gỡ listener và bỏ callback UI muộn; mutation đã gửi không được coi là rollback.',
});
let count=2,commands=0,events=0,mounted=true;
const slot=document.querySelector('#slot');
const element=document.createElement('shop-product-card');
element.addItem=async()=>{
 commands++;document.querySelector('#commands').textContent=commands;
 await new Promise(resolve=>setTimeout(resolve,150));
 count++;document.querySelector('#count').textContent=count;log('COMMIT','Cart owner: '+count);
 return {ok:true};
};
slot.addEventListener('catalog-added',event=>{
 if(event.detail?.productId!=='mug'||event.detail.quantity!==1)return;
 events++;document.querySelector('#events').textContent=events;
 log('EVENT','catalog-added vượt shadow boundary qua bubbles + composed; không mutation giỏ lần nữa.');
});
slot.append(element);
document.querySelector('#toggle').onclick=event=>{
 mounted=!mounted;
 if(mounted)slot.append(element);else element.remove();
 event.target.textContent=mounted?'Unmount card':'Mount card';
 log('LIFECYCLE',mounted?'connectedCallback':'disconnectedCallback');
};
document.querySelector('#disabled').onchange=event=>element.toggleAttribute('disabled',event.target.checked);
document.querySelector('#locale').onchange=event=>element.setAttribute('locale',event.target.value);
document.querySelector('#part').onchange=event=>{document.querySelector('.lab').dataset.partStyle=event.target.checked?'on':'off';};

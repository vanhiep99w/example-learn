import { setupLab, modeFrom, selectorOptions, changeMode, mugPhoto, money } from '../../../../../shared/lab.js';
import globalStyle from './global.css?url';
import scopedStyle from './scoped.css?url';
import shadowBase from './shadow-base.css?url';

const mode = modeFrom(location.search, ['global','scoped','shadow'], 'scoped');
const log = setupLab({
 title: 'CSS nào đang làm đổi nút?',
 intro: 'Catalog muốn đổi nút mua sang màu đỏ. Giỏ hàng có bị đổi theo không? Bật/tắt stylesheet và so sánh boundary thật.',
 body: `<div class="controls"><label>Boundary <select id="mode">${selectorOptions([['global','Global (bản lỗi)'],['scoped','Root namespace'],['shadow','Shadow DOM']],mode)}</select></label><label><input id="enable" type="checkbox" checked> Bật CSS của Catalog</label></div>
 <div class="modules"><section class="module catalog-sample" data-module="catalog"><span class="module-label">CATALOG · ${mode === 'shadow' ? 'SHADOW ROOT' : 'LIGHT DOM'}</span><h2>Cốc gốm buổi sáng</h2><img class="product-photo" src="${mugPhoto}" alt="Cốc trắng"><p class="price">${money(129000)}</p><div id="catalog-action"></div></section>
 <section class="module" data-module="cart"><span class="module-label">CART · LIGHT DOM</span><h2>Giỏ của bạn</h2><p>2 chiếc áo · 498.000 ₫</p><div class="controls"><button class="buy-button primary" id="cart-action">Xem giỏ</button></div><p id="cart-feedback" class="hint">Nút giỏ phải giữ màu xanh và góc bo nhỏ.</p></section></div>
 <p id="result" class="notice" role="status"></p>`,
 note: 'Đây là CSS thật trong cùng document. Root namespace chỉ giới hạn selector mình viết, không chặn mọi CSS bên ngoài. Shadow DOM không phải security boundary; font và CSS variables vẫn có thể kế thừa. Không dùng Module Federation.',
});
const target=document.querySelector('#catalog-action');
let styleRoot=document.head;
if(mode==='shadow') {
 styleRoot=target.attachShadow({mode:'open'});
 const base=document.createElement('link');base.rel='stylesheet';base.href=shadowBase;styleRoot.append(base);
}
const buy=document.createElement('button');buy.className='buy-button primary';buy.textContent='Thêm vào giỏ';styleRoot===document.head?target.append(buy):styleRoot.append(buy);
buy.onclick=()=>log('COMMAND','Catalog yêu cầu thêm cốc; lab CSS không thực hiện mutation giỏ.');
document.querySelector('#cart-action').onclick=()=>{document.querySelector('#cart-feedback').textContent='Giỏ vẫn dùng nút của chính module Cart.';};
let link;
function apply(){
 link?.remove();link=undefined;
 if(document.querySelector('#enable').checked){
  link=document.createElement('link');link.rel='stylesheet';link.href=mode==='scoped'?scopedStyle:globalStyle;styleRoot.append(link);
 }
 const message=mode==='global'?'Global selector .buy-button đi vào cả nút Cart: style leakage.':mode==='scoped'?'Selector .catalog-sample .buy-button chỉ đổi nút bên trong Catalog.':'Stylesheet nằm trong shadow root: nút Cart ở ngoài không bị đổi.';
 document.querySelector('#result').textContent=document.querySelector('#enable').checked?message:'CSS Catalog đã được tháo; các nút dùng style nền.';
 log('CSS',document.querySelector('#result').textContent);
}
document.querySelector('#enable').onchange=apply;
document.querySelector('#mode').onchange=event=>changeMode(event.target.value);
apply();

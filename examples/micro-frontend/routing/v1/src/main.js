import { setupLab, modeFrom, selectorOptions, changeMode } from '../../../../../shared/lab.js';
import { createNavigation, destinationURL, readLocation } from './navigation.js';
import { renderCatalog } from './catalog.js';
const mode=modeFrom(location.search,['coordinated','conflict'],'coordinated');
const log=setupLab({
 title:'Một URL, một nơi điều phối',
 intro:'Mở chi tiết, thêm hàng rồi chuyển giỏ. Shell giữ history; Catalog chỉ gửi yêu cầu điều hướng qua navigation port.',
 body:`<div class="controls"><label>Chế độ <select id="mode">${selectorOptions([['coordinated','Shell điều phối'],['conflict','Remote tự đổi URL (bản lỗi)']],mode)}</select></label></div>
 <section class="module" data-module="shell"><span class="module-label">SHELL · HISTORY OWNER</span><nav class="controls" aria-label="Điều hướng shop"><a id="to-catalog">Sản phẩm</a><a id="to-cart">Giỏ hàng</a><button id="back">Back</button><button id="forward">Forward</button></nav><code id="url" class="url-readout"></code><p id="view" class="hint"></p></section>
 <form id="filter" class="controls"><label>Lọc sản phẩm <input id="q" name="q" placeholder="Cốc hoặc áo"></label><button>Áp dụng</button></form>
 <div class="modules"><section class="module" data-module="catalog"><span class="module-label">OUTLET · CATALOG HOẶC CART</span><div id="outlet"></div></section><aside class="module" data-module="cart"><span class="module-label">CART OWNER · MEMORY</span><h2>Giỏ trong session này</h2><p class="result"><span id="count">2</span> sản phẩm</p><p class="hint">Chuyển route không tạo lại owner. Reload reset về 2.</p></aside></div>`,
 note:'Lab dùng query route để mở trực tiếp/reload được trên static Pages mà không cần catch-all fallback. Đây là navigation port thuần JS, không phải React/Vue Router, Federation hoặc HTTP route rewrite. URL trong iframe độc lập với URL bài docs.',
});
let count=2;
const outlet=document.querySelector('#outlet');
function render(snapshot){
 document.querySelector('#url').textContent=location.pathname+location.search;
 document.querySelector('#view').textContent='Màn hình đang render: '+snapshot.route;
 document.querySelector('#q').value=snapshot.q;
 if(snapshot.route==='cart'){
  outlet.innerHTML='<h2>Giỏ hàng</h2><p id="cart-view" class="result"></p><p>State không mất khi rời Catalog.</p>';
  document.querySelector('#cart-view').textContent=count+' sản phẩm';
 }else if(snapshot.route==='not-found'){outlet.textContent='Không có route này. Dùng link Sản phẩm để phục hồi.';}
 else renderCatalog(outlet,snapshot,{
  href:route=>destinationURL(new URL(location.href),route).href,
  navigate:route=>{
   if(mode==='conflict'){history.pushState(history.state,'',destinationURL(new URL(location.href),route));document.querySelector('#url').textContent=location.pathname+location.search;log('LỖI','Remote gọi pushState nhưng không báo shell; URL đổi, outlet vẫn cũ.');}
   else navigation.navigate(route);
  },
 },()=>{count++;document.querySelector('#count').textContent=count;log('CART','Thêm hàng: '+count);});
 log('RENDER',snapshot.route);
}
const navigation=createNavigation({
 getURL:()=>new URL(location.href),
 push:url=>history.pushState(history.state,'',url),
 listen:handler=>{addEventListener('popstate',handler);return()=>removeEventListener('popstate',handler);},
 onChange:render,
});
for(const [id,route] of [['to-catalog','catalog'],['to-cart','cart']]){
 const anchor=document.querySelector('#'+id);anchor.href=destinationURL(new URL(location.href),route).href;
 anchor.onclick=event=>{if(event.button===0&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){event.preventDefault();navigation.navigate(route);}};
}
document.querySelector('#filter').onsubmit=event=>{event.preventDefault();navigation.navigate('catalog',document.querySelector('#q').value.trim());};
document.querySelector('#back').onclick=()=>history.back();
document.querySelector('#forward').onclick=()=>history.forward();
document.querySelector('#mode').onchange=event=>changeMode(event.target.value);
render(readLocation(new URL(location.href)));

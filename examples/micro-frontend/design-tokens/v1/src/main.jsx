import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createApp, h, ref, onUnmounted } from 'vue';
import { setupLab, modeFrom, selectorOptions, changeMode, mugPhoto, money } from '../../../../../shared/lab.js';
import './tokens.css';
const mode=modeFrom(location.search,['shared','drift'],'shared');
const log=setupLab({
 title:'Đổi theme một lần cho React và Vue',
 intro:'Hai runtime riêng dùng cùng contract CSS tokens của shell. Đổi màu, theme và density mà không remount app; so sánh một consumer tự hardcode màu.',
 body:`<div class="controls"><label>Policy <select id="mode">${selectorOptions([['shared','Cùng token contract'],['drift','Vue override token (bản lệch)']],mode)}</select></label><label>Theme <select id="theme" aria-label="Theme"><option value="light">Light</option><option value="dark">Dark</option></select></label><label>Màu nút <select id="accent"><option value="blue">Blue</option><option value="green">Green</option></select></label><label>Density <select id="density"><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label></div>
 <div class="token-scope" data-ds-contract="shop-v1" data-theme="light" data-accent="blue" data-density="comfortable"><div class="modules"><section class="module" data-module="catalog"><span class="module-label">CATALOG · REACT</span><div id="react"></div></section><section class="module" data-module="cart"><span class="module-label">CART · VUE</span><div id="vue" data-token-policy="${mode==='drift'?'local':'shared'}"></div></section></div></div>`,
 note:'React và Vue thật, build cùng một app. Đây là token contract CSS có namespace shop-v1, không phải chia sẻ React component sang Vue hoặc chứng minh package/release compatibility. Nút chỉ chạy mutation memory, không checkout.',
});
let count=2;
const listeners=new Set();
function add(){count++;for(const listener of listeners)listener(count);log('CART','Memory cart: '+count);}
function ReactCatalog(){
 const [added,setAdded]=useState(0);
 return <><h2>Cốc gốm buổi sáng</h2><img className="product-photo" src={mugPhoto} alt="Cốc trắng"/><p className="price">{money(129000)}</p><button className="ds-button" id="react-action" onClick={()=>{add();setAdded(value=>value+1);}}>Thêm cốc</button><p className="hint">Local React state: đã thêm <span id="react-added">{added}</span> lần.</p></>;
}
createRoot(document.querySelector('#react')).render(<ReactCatalog/>);
createApp({
 setup(){
  const items=ref(count);
  const listener=value=>{items.value=value;};listeners.add(listener);
  onUnmounted(()=>listeners.delete(listener));
  return ()=>h('div',[
   h('h2','Giỏ hàng của bạn'),h('p',{class:'result'},[h('span',{id:'vue-count'},items.value),' sản phẩm']),
   h('button',{class:'ds-button',id:'vue-action',onClick:add},'Thêm áo'),
   h('p',{class:'hint'},'Nút Vue đọc cùng --shop-action, trừ bản cố ý override token.'),
  ]);
 },
}).mount('#vue');
for(const key of ['theme','accent','density'])document.querySelector('#'+key).onchange=event=>{
 document.querySelector('.token-scope').dataset[key]=event.target.value;log('TOKEN',key+' = '+event.target.value+'; không remount consumer.');
};
document.querySelector('#mode').onchange=event=>changeMode(event.target.value);

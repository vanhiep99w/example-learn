import '../../../../../shared/lab.css';
import './child.css';
import { acceptsMessage,envelope } from './protocol.js';
const session=new URL(location.href).searchParams.get('session')||'';
const parentOrigin=location.origin; // Controlled lab: parent and child deploy to the same origin.
let tall=false;
document.querySelector('#app').innerHTML='<section class="child-catalog"><span class="module-label">CATALOG · IFRAME WINDOW</span><h1>Cốc gốm buổi sáng</h1><p id="theme" role="status">Chờ INIT từ shell…</p><button id="resize" type="button">Đổi chiều cao nội dung</button><div id="more" hidden><p>Thông tin sản phẩm</p><ul><li>Men trắng ngà</li><li>350 ml</li><li>Giá và sản phẩm chỉ minh họa</li></ul></div></section>';
addEventListener('message',event=>{
 if(!acceptsMessage(event,{origin:parentOrigin,source:parent,session,direction:'child'})){
  if(event.origin===parentOrigin&&event.source===parent)parent.postMessage(envelope(session,'REJECT'),parentOrigin);
  return;
 }
 document.body.dataset.childTheme=event.data.theme;
 document.querySelector('#theme').textContent='Theme nhận từ shell: '+event.data.theme;
 if(event.data.type==='INIT')parent.postMessage(envelope(session,'READY'),parentOrigin);
});
document.querySelector('#resize').onclick=()=>{
 tall=!tall;document.querySelector('#more').hidden=!tall;
 parent.postMessage(envelope(session,'RESIZE',{height:tall?420:260}),parentOrigin);
};

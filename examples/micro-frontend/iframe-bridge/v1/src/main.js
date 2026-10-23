import { setupLab } from '../../../../../shared/lab.js';
import { acceptsMessage,envelope } from './protocol.js';
const log=setupLab({
 title:'Hai window trao đổi dữ liệu thế nào?',
 intro:'Shell và iframe không truyền function trực tiếp. Thử INIT, đổi theme, resize và message sai; receiver kiểm tra origin, source, session và schema.',
 body:`<section class="module" data-module="shell"><span class="module-label">SHELL · PARENT WINDOW</span><div class="controls"><label>Theme gửi xuống <select id="theme"><option value="light">Light</option><option value="dark">Dark</option></select></label><button id="invalid">Gửi sai schema</button><button id="wrong-source">Giả READY từ window shell</button><button id="reload">Reload iframe</button></div><p role="status" id="status">Chờ child READY…</p><p class="hint">Message hợp lệ: <strong id="accepted">0</strong> · bị từ chối: <strong id="rejected">0</strong></p></section>
 <div class="controls"><code id="origin"></code></div><iframe id="child" class="lab-child" title="Catalog nhận postMessage" sandbox="allow-scripts allow-same-origin" height="260"></iframe>`,
 note:'Parent và child là hai browsing context thật nhưng cùng origin trên Pages, không phải kiểm chứng một deployment cross-origin. Validator vẫn so origin chính xác và event.source đúng contentWindow. TargetOrigin luôn cụ thể. Child là code tin cậy; allow-scripts + allow-same-origin không bảo vệ khỏi code độc hại cùng origin. Không truyền token hoặc dữ liệu riêng.',
});
const iframe=document.querySelector('#child');
let session='',accepted=0,rejected=0;
const origin=location.origin;
document.querySelector('#origin').textContent='Expected origin: '+origin;
function stats(){document.querySelector('#accepted').textContent=accepted;document.querySelector('#rejected').textContent=rejected;}
function send(type,extra={}){iframe.contentWindow.postMessage(envelope(session,type,{theme:document.querySelector('#theme').value,locale:'vi-VN',...extra}),origin);log('SEND',type);}
function load(){
 session=crypto.randomUUID();iframe.height='260';
 const url=new URL(import.meta.env.BASE_URL+'child.html',location.origin);url.searchParams.set('session',session);
 iframe.src=url.href;document.querySelector('#status').textContent='Chờ child READY…';
}
iframe.onload=()=>send('INIT');
addEventListener('message',event=>{
 if(!acceptsMessage(event,{origin,source:iframe.contentWindow,session,direction:'parent'})){
  rejected++;log('REJECT','Bỏ message sai origin/source/session/schema.');stats();return;
 }
 if(event.data.type==='REJECT'){rejected++;document.querySelector('#status').textContent='Child đã từ chối message sai schema.';log('REJECT','Child không đổi theme từ payload sai.');}
 else{
  accepted++;
  if(event.data.type==='READY')document.querySelector('#status').textContent='Child READY · session hiện tại';
  if(event.data.type==='RESIZE'){iframe.height=String(event.data.height);document.querySelector('#status').textContent='Đã nhận RESIZE: '+event.data.height+' px';}
  log('RECEIVE',event.data.type);
 }
 stats();
});
document.querySelector('#theme').onchange=()=>send('THEME');
document.querySelector('#invalid').onclick=()=>send('THEME',{theme:'not-a-theme'});
document.querySelector('#wrong-source').onclick=()=>window.postMessage(envelope(session,'READY'),origin);
document.querySelector('#reload').onclick=load;
load();

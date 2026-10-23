import { setupLab, modeFrom, selectorOptions, changeMode } from '../../../../../shared/lab.js';
import { createCacheLab } from './runtime.js';
const mode=modeFrom(location.search,['shared','separate'],'shared');
const log=setupLab({
 title:'Hai consumer, bao nhiêu request?',
 intro:'Header và Cart cùng hỏi giỏ hiện tại. Tự quyết định lúc API trả response để thấy request deduplication và race, không cần đoán theo animation.',
 body:`<div class="controls"><label>Cache scope <select id="mode">${selectorOptions([['shared','Cùng QueryClient'],['separate','Hai QueryClient riêng']],mode)}</select></label><button id="release" class="primary">Trả response đang chờ</button><button id="invalidate">Thêm hàng và invalidate</button><button id="race">Mutation khi GET đang chờ</button><button id="toggle">Ẩn Header</button></div>
 <p class="notice">Query function đã chạy: <strong id="requests">0</strong> lần · response chờ: <strong id="pending">0</strong>. Đây là lời gọi API memory, không phải HTTP request.</p>
 <div class="modules"><section class="module" data-module="shell"><span class="module-label">HEADER OBSERVER</span><h2>Giỏ trên header</h2><output class="result" id="header">Chưa có dữ liệu</output></section><section class="module" data-module="cart"><span class="module-label">CART OBSERVER</span><h2>Giỏ hàng</h2><output class="result" id="cart">Chưa có dữ liệu</output></section></div><p class="notice" role="status" id="status">Bấm trả response để kết thúc query.</p>`,
 note:'Dùng TanStack Query Core thật (QueryClient + QueryObserver). Transport là Promise được điều khiển bằng nút; không gọi backend. staleTime=Infinity, retry=false để tránh refetch ngoài bài tập. Cache memory không chia sẻ tự động giữa iframe/tab.',
});
function stats(){document.querySelector('#requests').textContent=runtime.requests;document.querySelector('#pending').textContent=runtime.pending;}
const runtime=createCacheLab(mode,(kind,message)=>{log(kind,message);queueMicrotask(stats);});
let visible=true;
function mount(id){runtime.mount(id,result=>{
 const output=document.querySelector('#'+id);
 output.textContent=result.data?result.data.itemCount+' sản phẩm · revision '+result.data.revision:'Chưa có dữ liệu';
 output.dataset.fetching=String(result.isFetching);
 queueMicrotask(stats);
});}
mount('header');mount('cart');stats();
document.querySelector('#release').onclick=()=>{runtime.release();stats();};
document.querySelector('#invalidate').onclick=()=>{void runtime.invalidate();stats();};
document.querySelector('#race').onclick=async()=>{await runtime.commitDuringFetch();stats();document.querySelector('#status').textContent='Cache đã commit revision mới. Trả response GET cũ: dữ liệu không được lùi lại.';};
document.querySelector('#toggle').onclick=event=>{
 visible=!visible;
 if(visible)mount('header');else{runtime.unmount('header');document.querySelector('#header').textContent='Header đã unmount';}
 event.target.textContent=visible?'Ẩn Header':'Mount Header';stats();
};
document.querySelector('#mode').onchange=event=>changeMode(event.target.value);

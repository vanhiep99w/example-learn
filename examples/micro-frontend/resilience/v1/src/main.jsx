import React, { Component, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { setupLab, modeFrom, selectorOptions, changeMode } from '../../../../../shared/lab.js';
import { LabFailure, withDeadline, assertContract } from './loader.js';
const mode=modeFrom(location.search,['success','transient','missing','contract','render','timeout'],'success');
const log=setupLab({
 title:'Catalog lỗi, shop còn dùng được không?',
 intro:'Chỉ slot Catalog bị lỗi. Header và giỏ vẫn dùng được. So sánh lỗi load, contract, render và timeout trước khi quyết định retry.',
 body:`<div class="controls"><label>Tình huống <select id="mode">${selectorOptions([['success','Bình thường'],['transient','Transient fixture · retry 1 lần'],['missing','Asset 404 thật'],['contract','Sai contract'],['render','Lỗi React render'],['timeout','Quá deadline · kết quả đến muộn']],mode)}</select></label></div><div id="react-root"></div>`,
 note:'React Error Boundary và dynamic import chunk là thật. Transient, contract, render và delay là fault injection có chủ đích. Mục Asset 404 fetch một URL không tồn tại thật. Lab không có remote Federation hay backend. Timeout không hủy import; generation và deadline ngăn commit muộn. Chỉ transient fixture cho phép một lần retry.',
});
class Boundary extends Component{
 state={error:null};
 static getDerivedStateFromError(error){return {error};}
 componentDidCatch(){log('RENDER','Boundary cô lập lỗi render của Catalog.');}
 render(){return this.state.error?<div role="alert"><h2>Catalog render lỗi</h2><p className="error">Không retry mù lỗi render. Chọn tình huống khác để thử lại.</p></div>:this.props.children;}
}
function App(){
 const [count,setCount]=useState(2);
 const [attempt,setAttempt]=useState(0);
 const [state,setState]=useState({status:'loading'});
 useEffect(()=>{
  let active=true;
  setState({status:'loading'});
  async function load(){
   log('LOAD','Attempt '+attempt+' · '+mode);
   if(mode==='transient'&&attempt===0)throw new LabFailure('transient','Kết nối giả lập bị gián đoạn trước import.');
   if(mode==='missing'){
    const response=await fetch(import.meta.env.BASE_URL+'missing-remote.js');
    if(!response.ok)throw new LabFailure('asset','Asset trả HTTP '+response.status+'. Kiểm tra URL/deploy, không tự retry.');
   }
   const pending=mode==='timeout'?new Promise(resolve=>setTimeout(()=>resolve(import('./remote.jsx')),800)):import('./remote.jsx');
   const module=await withDeadline(pending,mode==='timeout'?150:2000,()=>log('LATE','Module đến sau deadline, không mount vào slot.'));
   return assertContract(mode==='contract'?{protocolVersion:9}:module);
  }
  void load().then(module=>{if(active)setState({status:'ready',module});},error=>{if(active){setState({status:'error',error});log('ERROR',error.message);}});
  return()=>{active=false;};
 },[attempt]);
 return <><section className="module" data-module="shell"><span className="module-label">SHELL · KHÔNG NẰM TRONG BOUNDARY CATALOG</span><h2>Shop vẫn hoạt động</h2><p className="result">Giỏ: <span id="count">{count}</span></p><button onClick={()=>setCount(value=>value+1)}>Thêm áo từ shell</button></section>
 <div className="modules"><section className="module" data-module="catalog"><span className="module-label">CATALOG · FAILURE BOUNDARY</span>
 {state.status==='loading'?<p role="status">Đang tải Catalog…</p>:state.status==='error'?<div role="alert"><h2>Chưa mở được Catalog</h2><p className="error">{state.error.message}</p>{state.error.kind==='transient'&&attempt===0&&<button onClick={()=>setAttempt(1)}>Thử lại một lần</button>}</div>:<Boundary key={attempt}><state.module.Catalog crash={mode==='render'} onAdd={()=>setCount(value=>value+1)}/></Boundary>}
 </section><aside className="module" data-module="cart"><span className="module-label">CART · ĐỘC LẬP VỚI CATALOG SLOT</span><h2>Giỏ hiện tại</h2><p className="result">{count} sản phẩm</p><p>Fallback của Catalog không reset owner giỏ.</p></aside></div></>;
}
document.querySelector('#mode').onchange=event=>changeMode(event.target.value);
createRoot(document.querySelector('#react-root')).render(<App/>);

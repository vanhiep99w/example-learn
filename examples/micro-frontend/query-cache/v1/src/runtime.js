import { QueryClient, QueryObserver } from '@tanstack/query-core';
export function createCacheLab(mode,notify=()=>{}) {
 const pending=new Map();
 const observers=new Map();
 const shared=new QueryClient({defaultOptions:{queries:{retry:false,staleTime:Infinity,gcTime:Infinity,refetchOnWindowFocus:false}}});
 const clients=mode==='separate'?{header:shared,cart:new QueryClient({defaultOptions:shared.getDefaultOptions()})}:{header:shared,cart:shared};
 const key=['cart','demo-user'];
 let requests=0;
 let backend={revision:0,itemCount:2};
 function request(signal){
  const id=++requests;
  const snapshot={...backend};
  notify('GET','#'+id+' chụp revision '+snapshot.revision+' (API memory, chưa trả response).');
  // Consume the signal. The simulated server may still finish; Query's cancelled attempt must not commit.
  signal.addEventListener('abort',()=>notify('ABORT','#'+id+' bị cancel ở client; không có nghĩa backend rollback.'),{once:true});
  return new Promise(resolve=>pending.set(id,{resolve,snapshot,signal}));
 }
 function mount(id,render){
  if(observers.has(id))return;
  const observer=new QueryObserver(clients[id],{queryKey:key,queryFn:({signal})=>request(signal)});
  const off=observer.subscribe(result=>render(result));
  observers.set(id,()=>{off();observer.destroy();});
  render(observer.getCurrentResult());
 }
 function unmount(id){observers.get(id)?.();observers.delete(id);}
 function release(){
  for(const [id,entry] of [...pending]){
   pending.delete(id);entry.resolve(entry.snapshot);
   notify('RESPONSE','#'+id+' revision '+entry.snapshot.revision+(entry.signal.aborted?' · attempt đã cancel, không commit':''));
  }
 }
 async function invalidate(){
  backend={revision:backend.revision+1,itemCount:backend.itemCount+1};
  for(const client of new Set(Object.values(clients)))void client.invalidateQueries({queryKey:key});
  notify('INVALIDATE','API memory có '+backend.itemCount+' sản phẩm. Observer active revalidate.');
 }
 async function commitDuringFetch(){
  for(const client of new Set(Object.values(clients)))await client.cancelQueries({queryKey:key});
  backend={revision:backend.revision+1,itemCount:backend.itemCount+1};
  for(const client of new Set(Object.values(clients)))client.setQueryData(key,{...backend});
  notify('COMMIT','Mutation memory revision '+backend.revision+'; GET cũ bị cancel trước khi ghi cache.');
 }
 return {mount,unmount,release,invalidate,commitDuringFetch,get requests(){return requests;},get pending(){return pending.size;},dispose(){for(const id of [...observers.keys()])unmount(id);for(const client of new Set(Object.values(clients)))client.clear();pending.clear();}};
}

export class LabFailure extends Error {
 constructor(kind,message){super(message);this.kind=kind;}
}
export function withDeadline(promise,ms,onLate=()=>{}){
 let expired=false;
 let timer;
 const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{expired=true;reject(new LabFailure('timeout','Đã quá deadline. Công việc cũ có thể vẫn đang chạy.'));},ms);});
 void promise.then(()=>{if(expired)onLate();},()=>{});
 return Promise.race([promise,timeout]).finally(()=>clearTimeout(timer));
}
export function assertContract(module){
 if(!module||module.protocolVersion!==1||typeof module.Catalog!=='function')throw new LabFailure('contract','Remote không có contract version 1 hợp lệ.');
 return module;
}

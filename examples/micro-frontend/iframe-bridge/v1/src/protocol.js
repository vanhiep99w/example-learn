const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
export function acceptsMessage(event,{origin,source,session,direction}){
 if(event.origin!==origin||event.source!==source)return false;
 const data=event.data;
 if(!record(data)||data.channel!=='shop.catalog'||data.version!==1||data.session!==session)return false;
 if(direction==='child')return (data.type==='INIT'||data.type==='THEME')&&['light','dark'].includes(data.theme)&&data.locale==='vi-VN';
 return data.type==='READY'||data.type==='REJECT'||(data.type==='RESIZE'&&Number.isSafeInteger(data.height)&&data.height>=180&&data.height<=700);
}
export const envelope=(session,type,extra={})=>({channel:'shop.catalog',version:1,session,type,...extra});

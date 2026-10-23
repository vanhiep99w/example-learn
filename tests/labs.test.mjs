import test from 'node:test';
import assert from 'node:assert/strict';
import { destinationURL,readLocation,createNavigation } from '../examples/micro-frontend/routing/v1/src/navigation.js';
import { withDeadline,assertContract } from '../examples/micro-frontend/resilience/v1/src/loader.js';
import { acceptsMessage,envelope } from '../examples/micro-frontend/iframe-bridge/v1/src/protocol.js';
import { createCacheLab } from '../examples/micro-frontend/query-cache/v1/src/runtime.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('navigation port preserves unrelated URL data and notifies its subscribers after push/pop',()=>{
 let current=new URL('https://example.test/lab/?mode=coordinated#anchor');
 let listener,disposed=false;
 const seen=[];
 const port=createNavigation({getURL:()=>current,push:url=>{current=url;},listen:fn=>{listener=fn;return()=>{disposed=true;};},onChange:value=>seen.push(value)});
 port.navigate('product/mug');
 assert.equal(current.searchParams.get('mode'),'coordinated');
 assert.equal(current.hash,'#anchor');
 assert.deepEqual(port.getSnapshot(),{route:'product/mug',q:''});
 current=destinationURL(current,'catalog','áo');listener();
 assert.deepEqual(seen.at(-1),{route:'catalog',q:'áo'});
 assert.equal(readLocation(new URL('https://example.test/?route=javascript:evil')).route,'not-found');
 assert.throws(()=>port.navigate('https://evil.test'));
 port.dispose();assert(disposed);
});
test('deadline rejects a late loader but never claims to cancel it, and contract validation rejects unsupported exports',async()=>{
 let resolve,late=0;
 const pending=new Promise(done=>{resolve=done;});
 await assert.rejects(withDeadline(pending,1,()=>late++),error=>error.kind==='timeout');
 resolve({});await tick();assert.equal(late,1);
 const module={protocolVersion:1,Catalog(){}};
 assert.equal(assertContract(module),module);
 assert.throws(()=>assertContract({protocolVersion:2,Catalog(){}}),error=>error.kind==='contract');
});
test('iframe decoder rejects wrong origins, source windows, stale sessions and malformed dimensions',()=>{
 const source={},origin='https://example.test',session='fixture';
 const expected={source,origin,session,direction:'parent'};
 const event={source,origin,data:envelope(session,'READY')};
 assert(acceptsMessage(event,expected));
 for(const invalid of [{...event,origin:'https://example.test.evil'},{...event,source:{}},{...event,data:envelope('old','READY')},{...event,data:envelope(session,'RESIZE',{height:99999})},{...event,data:{...event.data,version:9}}])assert(!acceptsMessage(invalid,expected));
 assert(acceptsMessage({...event,data:envelope(session,'RESIZE',{height:420})},expected));
 assert(!acceptsMessage({...event,data:envelope(session,'THEME',{theme:'bad',locale:'vi-VN'})},{...expected,direction:'child'}));
});
test('TanStack scope controls request sharing; unmount one shared observer does not cancel the other',async()=>{
 for(const mode of ['shared','separate']){
  const lab=createCacheLab(mode);
  let header,cart;
  lab.mount('header',result=>{header=result.data;});
  lab.mount('cart',result=>{cart=result.data;});
  assert.equal(lab.requests,mode==='shared'?1:2);
  lab.release();await tick();
  assert.equal(header.itemCount,2);assert.equal(cart.itemCount,2);
  lab.dispose();
 }
 const lab=createCacheLab('shared');let cart;
 lab.mount('header',()=>{});lab.mount('cart',result=>{cart=result.data;});
 lab.unmount('header');lab.release();await tick();assert.equal(cart.itemCount,2);
 lab.invalidate();await tick();
 await lab.commitDuringFetch();assert.equal(cart.itemCount,4);
 lab.release();await tick();assert.equal(cart.revision,2);assert.equal(cart.itemCount,4);
 lab.dispose();
});

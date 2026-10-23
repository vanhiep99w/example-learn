const allowed = new Set(['catalog','product/mug','product/shirt','cart']);
export function readLocation(url) {
 const route=url.searchParams.get('route') || 'catalog';
 return {route:allowed.has(route)?route:'not-found',q:url.searchParams.get('q')||''};
}
export function destinationURL(current,route,q='') {
 if(!allowed.has(route))throw new Error('Unknown destination');
 const url=new URL(current);url.searchParams.set('route',route);
 if(q)url.searchParams.set('q',q);else url.searchParams.delete('q');
 return url;
}
export function createNavigation({getURL,push,listen,onChange}) {
 const notify=()=>onChange(readLocation(getURL()));
 const unlisten=listen(notify);
 return { navigate(route,q=''){push(destinationURL(getURL(),route,q));notify();},getSnapshot(){return readLocation(getURL());},dispose:unlisten };
}

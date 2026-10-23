import { mugPhoto, shirtPhoto, money } from '../../../../../shared/lab.js';
export function renderCatalog(root,location,navigation,addItem){
 root.replaceChildren();
 const title=document.createElement('h2');title.textContent=location.route==='catalog'?'Chọn đồ cho mỗi ngày':'Chi tiết sản phẩm';root.append(title);
 const products=[{id:'mug',name:'Cốc gốm',price:129000,image:mugPhoto},{id:'shirt',name:'Áo cotton',price:249000,image:shirtPhoto}];
 const shown=products.filter(product=>location.route==='catalog'?product.name.toLocaleLowerCase('vi').includes(location.q.toLocaleLowerCase('vi')):location.route==='product/'+product.id);
 for(const product of shown){
  const article=document.createElement('article');
  const image=document.createElement('img');image.src=product.image;image.alt=product.name;image.className='product-photo';
  const name=document.createElement('h3');name.textContent=product.name;
  const price=document.createElement('p');price.className='price';price.textContent=money(product.price);
  const view=document.createElement('a');view.href=navigation.href('product/'+product.id);view.textContent='Xem chi tiết';
  view.onclick=event=>{if(event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){event.preventDefault();navigation.navigate('product/'+product.id);}};
  const add=document.createElement('button');add.textContent='Thêm '+product.name.toLowerCase();add.onclick=()=>addItem(product.id);
  const controls=document.createElement('div');controls.className='controls';controls.append(view,add);
  article.append(image,name,price,controls);root.append(article);
 }
 if(!shown.length){const empty=document.createElement('p');empty.textContent='Không có sản phẩm phù hợp.';root.append(empty);}
}

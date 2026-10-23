import cardCSS from './card.css?url';
export class ShopProductCard extends HTMLElement {
 static observedAttributes=['disabled','locale'];
 #off;
 #generation=0;
 #pending=false;
 #addItem;
 constructor(){
  super();
  const root=this.attachShadow({mode:'open'});
  const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href=cardCSS;
  const article=document.createElement('article');
  article.innerHTML='<h3>Cốc gốm buổi sáng</h3><p>129.000 ₫ · quantity 1</p><button type="button" part="action">Thêm cốc</button><p role="status">Chưa gửi command.</p>';
  root.append(stylesheet,article);
 }
 set addItem(value){this.#addItem=typeof value==='function'?value:undefined;this.#render();}
 connectedCallback(){
  const button=this.shadowRoot.querySelector('button');
  const click=()=>void this.#submit();
  button.addEventListener('click',click);
  this.#off=()=>button.removeEventListener('click',click);
  this.#render();
 }
 disconnectedCallback(){
  this.#off?.();this.#off=undefined;this.#generation++;this.#pending=false;
 }
 attributeChangedCallback(){this.#render();}
 #render(){
  const button=this.shadowRoot?.querySelector('button');
  if(!button)return;
  button.disabled=this.hasAttribute('disabled')||this.#pending||!this.#addItem;
  button.textContent=this.#pending?'Đang thêm…':this.getAttribute('locale')==='en'?'Add mug':'Thêm cốc';
 }
 async #submit(){
  if(!this.#addItem||this.#pending||this.hasAttribute('disabled'))return;
  const generation=this.#generation;
  this.#pending=true;this.#render();
  try{
   const result=await this.#addItem({productId:'mug',quantity:1});
   if(!this.isConnected||generation!==this.#generation)return;
   this.shadowRoot.querySelector('[role=status]').textContent=result.ok?'Đã thêm cốc.':'Command bị từ chối.';
   if(result.ok)this.shadowRoot.querySelector('article').dispatchEvent(new CustomEvent('catalog-added',{bubbles:true,composed:true,detail:{productId:'mug',quantity:1}}));
  }catch{
   if(this.isConnected&&generation===this.#generation)this.shadowRoot.querySelector('[role=status]').textContent='Chưa thể thêm sản phẩm.';
  }finally{
   if(generation===this.#generation){this.#pending=false;this.#render();}
  }
 }
}
if(!customElements.get('shop-product-card'))customElements.define('shop-product-card',ShopProductCard);

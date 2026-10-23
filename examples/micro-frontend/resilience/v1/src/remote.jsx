import { mugPhoto, money } from '../../../../../shared/lab.js';
export const protocolVersion=1;
export function Catalog({crash,onAdd}){
 if(crash)throw new Error('Lỗi render có chủ đích trong Catalog fixture');
 return <div><h2>Cốc gốm buổi sáng</h2><img className="product-photo" src={mugPhoto} alt="Cốc trắng"/><p className="price">{money(129000)}</p><button className="primary" onClick={onAdd}>Thêm cốc</button></div>;
}

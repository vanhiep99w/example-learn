import { useState } from 'react';
import type { CartPort, ProductId } from './domain';

export function Catalog({ cart }: { cart: CartPort }) {
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('Quantity là local state của Catalog, chưa phải dữ liệu giỏ.');
  async function add(productId: ProductId) {
    setPending(true);
    setMessage('Đang chờ API giả lập xác nhận…');
    try {
      const result = await cart.addItem({ productId, quantity });
      setMessage(result.ok ? 'Command thành công. Catalog không sửa badge hoặc store của Cart.' : result.reason);
    } catch {
      setMessage('Command gặp lỗi ngoài dự kiến. Thử tải lại demo.');
    } finally {
      setPending(false);
    }
  }
  return <section aria-labelledby="catalog-title" className="domain">
    <p className="eyebrow">REACT / COMMAND CONSUMER</p>
    <h2 id="catalog-title">Catalog</h2>
    <label className="quantity">Số lượng mỗi lần thêm
      <select aria-label="Số lượng" value={quantity} onChange={event => setQuantity(Number(event.target.value))}>
        {[1, 2, 3].map(value => <option key={value} value={value}>{value}</option>)}
      </select>
    </label>
    <ul className="products">
      <li><div><strong>Cốc</strong><span>productId: mug</span></div><button disabled={pending} onClick={() => void add('mug')}>Thêm cốc</button></li>
      <li><div><strong>Áo</strong><span>productId: shirt</span></div><button disabled={pending} onClick={() => void add('shirt')}>Thêm áo</button></li>
    </ul>
    <p className="hint" role="status">{message}</p>
  </section>;
}

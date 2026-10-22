import { useState } from 'react';
import type { CartPort, ProductId } from './domain';
import { money, products, productById } from './products';

export function Catalog({ cart }: { cart: CartPort }) {
  const [quantities, setQuantities] = useState<Record<ProductId, number>>({ mug: 1, shirt: 1 });
  const [pending, setPending] = useState<ProductId | null>(null);
  const [feedback, setFeedback] = useState({ text: '', error: false });
  function adjust(id: ProductId, delta: number) {
    setQuantities(previous => ({ ...previous, [id]: Math.max(1, Math.min(10, previous[id] + delta)) }));
  }
  async function add(productId: ProductId) {
    const quantity = quantities[productId];
    setPending(productId);
    setFeedback({ text: 'Đang thêm vào giỏ…', error: false });
    try {
      const result = await cart.addItem({ productId, quantity });
      setFeedback({
        text: result.ok ? `Đã thêm ${quantity} ${productById(productId).shortName.toLowerCase()} vào giỏ. Header và giỏ hàng đã cùng cập nhật.` : result.reason,
        error: !result.ok,
      });
    } catch {
      setFeedback({ text: 'Chưa thể cập nhật giỏ. Bạn thử lại nhé.', error: true });
    } finally {
      setPending(null);
    }
  }
  return <section aria-labelledby="catalog-title" className="catalog module-region" data-module="catalog">
    <div className="section-heading">
      <div><span className="eyebrow">BỘ SƯU TẬP NHỎ</span><h2 id="catalog-title">Đồ dùng mỗi ngày</h2></div>
      <span className="framework-label module-tag">Catalog · React</span>
    </div>
    <ul className="products">
      {products.map(product => <li key={product.id} className="product" data-product={product.id}>
        <div className="product-photo">
          <img src={product.image} alt={product.alt} width={product.id === 'mug' ? 960 : 720} height={product.id === 'mug' ? 640 : 800} fetchPriority="high" />
          <span className="photo-index">{product.id === 'mug' ? '01' : '02'}</span>
        </div>
        <div className="product-info">
          <h3>{product.name}</h3>
          <p className="product-detail">{product.detail}</p>
          <p className="product-price">{money(product.price)}</p>
          <div className="product-actions">
            <div className="quantity-stepper" role="group" aria-label={`Số lượng ${product.shortName}`}>
              <button type="button" aria-label={`Giảm số lượng ${product.shortName}`} disabled={quantities[product.id] === 1 || pending !== null} onClick={() => adjust(product.id, -1)}>−</button>
              <output aria-label={`Số lượng chọn ${product.shortName}`}>{quantities[product.id]}</output>
              <button type="button" aria-label={`Tăng số lượng ${product.shortName}`} disabled={quantities[product.id] === 10 || pending !== null} onClick={() => adjust(product.id, 1)}>+</button>
            </div>
            <button className="add-button" type="button" disabled={pending !== null} aria-label={`Thêm ${product.shortName.toLowerCase()}`} onClick={() => void add(product.id)}>
              {pending === product.id ? 'Đang thêm…' : 'Thêm vào giỏ'}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>
        </div>
      </li>)}
    </ul>
    <div className="catalog-feedback" data-error={feedback.error || undefined} role="status" aria-atomic="true">
      {feedback.text && <><span className="feedback-mark" aria-hidden="true">{feedback.error ? '!' : pending ? '…' : '✓'}</span><span>{feedback.text} {!feedback.error && !pending && <a href="#cart">Xem giỏ hàng</a>}</span></>}
    </div>
  </section>;
}

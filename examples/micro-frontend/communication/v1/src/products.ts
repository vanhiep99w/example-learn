import type { ProductId } from './domain';

export const products = [
  {
    id: 'mug', name: 'Cốc gốm buổi sáng', shortName: 'Cốc', detail: 'Men trắng ngà · 350 ml',
    price: 129_000, image: new URL('./assets/mug.jpg', import.meta.url).href,
    alt: 'Cốc màu trắng có quai, đặt trên mặt bàn sáng',
  },
  {
    id: 'shirt', name: 'Áo cotton hằng ngày', shortName: 'Áo', detail: 'Trắng · Size M',
    price: 249_000, image: new URL('./assets/shirt.jpg', import.meta.url).href,
    alt: 'Áo thun trắng cổ tròn mặc trên người',
  },
] as const;
export const productById = (id: ProductId) => products.find(product => product.id === id)!;
const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
export const money = (value: number) => currency.format(value);

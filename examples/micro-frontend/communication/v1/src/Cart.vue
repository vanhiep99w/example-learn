<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import type { CartPort, ProductId, Snapshot } from './domain';
import { money, productById } from './products';
const props = defineProps<{ cart: CartPort; eventsOnly?: boolean }>();
const snapshot = shallowRef<Snapshot>();
const pending = ref(false);
const feedback = ref('');
let unsubscribe: (() => void) | undefined;
onMounted(() => {
  unsubscribe = props.cart.subscribe(() => { snapshot.value = props.cart.getSnapshot(); });
  if (!props.eventsOnly) snapshot.value = props.cart.getSnapshot();
});
onUnmounted(() => unsubscribe?.());
const count = computed(() => snapshot.value?.itemCount ?? 0);
const total = computed(() => snapshot.value?.lines.reduce((sum, line) => sum + productById(line.productId).price * line.quantity, 0) ?? 0);
async function changeQuantity(productId: ProductId, quantity: number) {
  pending.value = true;
  feedback.value = '';
  try {
    const result = await props.cart.setQuantity({ productId, quantity });
    if (!result.ok) feedback.value = result.reason;
  } catch {
    feedback.value = 'Chưa thể cập nhật giỏ. Bạn thử lại nhé.';
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <section class="cart-panel" aria-labelledby="cart-title" :aria-busy="pending">
    <div class="section-heading">
      <h2 id="cart-title">Giỏ hàng của bạn</h2>
      <span class="framework-label">Cart · Vue</span>
    </div>
    <div class="cart-meta"><p><strong data-testid="vue-count">{{ snapshot ? count : '—' }}</strong> sản phẩm</p><span class="sync-state"><span aria-hidden="true"></span>Cùng dữ liệu với header</span></div>
    <template v-if="snapshot && count > 0">
      <ul class="cart-lines">
        <li v-for="line in snapshot?.lines" :key="line.productId" :data-cart-product="line.productId">
          <img :src="productById(line.productId).image" :alt="productById(line.productId).alt" width="64" height="76" />
          <div class="cart-line-info">
            <h3>{{ productById(line.productId).name }}</h3>
            <p class="product-detail">{{ productById(line.productId).detail }}</p>
            <p class="cart-unit-price">{{ money(productById(line.productId).price) }}</p>
            <div class="cart-line-controls">
              <div class="quantity-stepper" role="group" :aria-label="'Số lượng trong giỏ ' + line.name">
                <button type="button" :disabled="pending" :aria-label="'Giảm trong giỏ ' + line.name" @click="changeQuantity(line.productId, line.quantity - 1)">−</button>
                <output :aria-label="'Số lượng trong giỏ ' + line.name">{{ line.quantity }}</output>
                <button type="button" :disabled="pending" :aria-label="'Tăng trong giỏ ' + line.name" @click="changeQuantity(line.productId, line.quantity + 1)">+</button>
              </div>
              <button class="remove-button" type="button" :disabled="pending" :aria-label="'Xóa ' + line.name + ' khỏi giỏ'" @click="changeQuantity(line.productId, 0)">Xóa</button>
            </div>
          </div>
        </li>
      </ul>
      <div class="cart-total"><span>Tạm tính</span><strong data-testid="cart-total">{{ money(total) }}</strong></div>
      <p class="cart-disclaimer">Giá minh họa. Demo không có đặt hàng hoặc thanh toán thật.</p>
      <a class="continue-shopping" href="#catalog">Tiếp tục chọn đồ <span aria-hidden="true">↗</span></a>
    </template>
    <div v-else-if="!snapshot" class="empty-cart">
      <h3>Chưa đọc snapshot</h3>
      <p>Bản lỗi này chỉ chờ event mới. Giỏ đã có dữ liệu, nhưng consumer chưa biết. Thử thêm một sản phẩm.</p>
    </div>
    <div v-else class="empty-cart">
      <svg width="36" height="40" viewBox="0 0 24 28" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M4 8h16l1 17H3L4 8Z"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/></svg>
      <h3>Giỏ đang trống</h3>
      <p>Chọn một món bên Catalog để bắt đầu.</p>
      <a href="#catalog">Khám phá sản phẩm</a>
    </div>
    <p v-if="feedback" class="cart-error" role="alert">{{ feedback }}</p>
  </section>
</template>

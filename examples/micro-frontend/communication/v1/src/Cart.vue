<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef } from 'vue';
import type { CartPort, Snapshot } from './domain';
const props = defineProps<{ cart: CartPort }>();
const snapshot = shallowRef<Snapshot>();
let unsubscribe: (() => void) | undefined;
onMounted(() => {
  unsubscribe = props.cart.subscribe(() => { snapshot.value = props.cart.getSnapshot(); });
  snapshot.value = props.cart.getSnapshot();
});
onUnmounted(() => unsubscribe?.());
const count = computed(() => snapshot.value?.itemCount ?? 0);
</script>

<template>
  <section class="domain" aria-labelledby="cart-title">
    <p class="eyebrow">VUE / SNAPSHOT CONSUMER</p>
    <h2 id="cart-title">Giỏ hàng</h2>
    <p class="summary"><strong data-testid="vue-count">{{ count }}</strong> sản phẩm <span>· revision {{ snapshot?.revision }}</span></p>
    <ul class="cart-lines">
      <li v-for="line in snapshot?.lines" :key="line.productId"><span>{{ line.name }}</span><strong>× {{ line.quantity }}</strong></li>
    </ul>
    <p class="hint">Component chỉ đọc snapshot và subscribe. Unmount không xóa dữ liệu của cart owner.</p>
  </section>
</template>

import { test, expect } from '@playwright/test';
const demo = '/micro-frontend/communication/v1/';

test('shop photos, local quantity, cart edits, totals and empty state work without a debug panel', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(demo);
  await expect(page.locator('.inspector')).not.toHaveAttribute('open');
  await expect(page.getByTestId('cart-total')).toHaveText('498.000 ₫');
  if (page.viewportSize().width >= 820) {
    for (const button of await page.locator('.add-button').all()) {
      const box = await button.boundingBox();
      expect(box.y + box.height).toBeLessThanOrEqual(760); // Default docs-kit iframe viewport.
    }
  }
  const photos = page.locator('.product-photo img');
  await expect(photos).toHaveCount(2);
  for (const photo of await photos.all()) {
    await expect(photo).toHaveJSProperty('complete',true);
    expect(await photo.evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
    expect(new URL(await photo.getAttribute('src'), page.url()).origin).toBe(new URL(page.url()).origin);
  }
  await page.getByRole('button',{name:'Tăng số lượng Cốc',exact:true}).click();
  await expect(page.getByLabel('Số lượng chọn Cốc',{exact:true})).toHaveText('2');
  await expect(page.getByTestId('header-count')).toHaveText('2'); // Unsubmitted selection is local React state.
  await expect(page.getByTestId('cart-total')).toHaveText('498.000 ₫');
  await page.getByRole('button',{name:'Thêm cốc',exact:true}).click();
  await expect(page.getByTestId('vue-count')).toHaveText('4');
  await expect(page.getByTestId('header-count')).toHaveText('4');
  await expect(page.getByTestId('cart-total')).toHaveText('756.000 ₫');
  await expect(page.locator('.catalog-feedback')).toContainText('Đã thêm 2 cốc');
  await page.getByRole('button',{name:'Tăng trong giỏ Áo',exact:true}).click();
  await expect(page.getByTestId('header-count')).toHaveText('5');
  await expect(page.getByTestId('vue-count')).toHaveText('5');
  await expect(page.getByTestId('cart-total')).toHaveText('1.005.000 ₫');
  await page.getByRole('button',{name:'Xóa Cốc khỏi giỏ',exact:true}).click();
  await expect(page.getByTestId('header-count')).toHaveText('3');
  await expect(page.getByTestId('cart-total')).toHaveText('747.000 ₫');
  await page.getByRole('button',{name:'Giảm trong giỏ Áo',exact:true}).click();
  await expect(page.getByTestId('cart-total')).toHaveText('498.000 ₫');
  await expect(page.getByTestId('header-count')).toHaveText('2');
  await page.getByRole('button',{name:'Xóa Áo khỏi giỏ',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Giỏ đang trống',exact:true})).toBeVisible();
  await expect(page.getByTestId('header-count')).toHaveText('0');
  await expect(page.getByTestId('vue-count')).toHaveText('0');
  await page.getByRole('link',{name:'Khám phá sản phẩm',exact:true}).click();
  await expect(page).toHaveURL(/#catalog$/);
  await expect(page.locator('.inspector')).not.toHaveAttribute('open');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('debug tools are keyboard-discoverable; failed Vue command does not change cart', async ({page}) => {
  await page.goto(demo);
  await page.locator('.inspector > summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.inspector')).toHaveAttribute('open','');
  await page.getByRole('button',{name:'Từ chối lần thêm tiếp theo',exact:true}).click();
  await expect(page.locator('#lab-notice')).toContainText('Đã bật lỗi API');
  await page.getByRole('button',{name:'Tăng trong giỏ Áo',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('API giả lập từ chối');
  await expect(page.getByTestId('header-count')).toHaveText('2');
  await expect(page.getByTestId('cart-total')).toHaveText('498.000 ₫');
  await page.getByRole('button',{name:'Tăng trong giỏ Áo',exact:true}).click();
  await expect(page.getByTestId('header-count')).toHaveText('3');
  await expect(page.getByTestId('cart-total')).toHaveText('747.000 ₫');
});

test('docs-sized iframe shows the cart next to products instead of pushing it below the fold', async ({page}) => {
  await page.setViewportSize({width:783,height:760});
  await page.goto(demo);
  const catalog = await page.locator('#catalog').boundingBox();
  const cart = await page.locator('.cart-panel').boundingBox();
  expect(cart.x).toBeGreaterThan(catalog.x + catalog.width);
  expect(cart.y).toBeLessThanOrEqual(catalog.y + 2);
  for (const button of await page.locator('.add-button').all()) {
    const box = await button.boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(760);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('event-only teaching version reproduces missed initial snapshots without pretending unknown means zero', async ({page}) => {
  await page.goto(demo+'?mode=events-only');
  await expect(page.getByTestId('header-count')).toHaveText('—');
  await expect(page.getByTestId('vue-count')).toHaveText('—');
  await expect(page.getByRole('heading',{name:'Chưa đọc snapshot',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Thêm cốc',exact:true}).click();
  await expect(page.getByTestId('vue-count')).toHaveText('3');
  await expect(page.getByTestId('header-count')).toHaveText('3');
  await page.locator('.inspector > summary').click();
  await page.getByRole('button',{name:'Ẩn Header',exact:true}).click();
  await page.getByRole('button',{name:'Ẩn Cart Vue',exact:true}).click();
  await page.getByRole('button',{name:'Thêm cốc',exact:true}).click();
  await expect(page.locator('.catalog-feedback')).toContainText('Đã thêm 1 cốc');
  await page.getByRole('button',{name:'Mount Header',exact:true}).click();
  await page.getByRole('button',{name:'Mount Cart Vue',exact:true}).click();
  await expect(page.getByTestId('header-count')).toHaveText('—');
  await expect(page.getByTestId('vue-count')).toHaveText('—');
  await page.getByRole('button',{name:'Thêm áo',exact:true}).click();
  await expect(page.getByTestId('vue-count')).toHaveText('5');
  await expect(page.getByTestId('header-count')).toHaveText('5');
  await page.goto(demo);
  await expect(page.getByTestId('vue-count')).toHaveText('2');
});

test('module boundaries stay labeled and distinct in both themes and after Vue remount', async ({page}) => {
  await page.goto(demo);
  const labels = {shell:'Shell · JavaScript',catalog:'Catalog · React',cart:'Cart · Vue'};
  for (const theme of ['light','dark']) {
    await page.emulateMedia({colorScheme:theme});
    const colors=[];
    for (const [id,label] of Object.entries(labels)) {
      const module=page.locator(`[data-module="${id}"]`);
      await expect(module).toHaveCount(1);
      await expect(module.locator('.module-tag')).toHaveText(label);
      const style=await module.evaluate(element=>{
        const css=getComputedStyle(element);
        return {outline:css.outlineStyle,width:css.outlineWidth,bg:css.backgroundColor,color:css.outlineColor};
      });
      expect(style.outline).toBe('solid');
      expect(style.width).toBe('1px');
      expect(style.bg).not.toBe('rgba(0, 0, 0, 0)');
      colors.push(style.color);
    }
    expect(new Set(colors).size).toBe(3);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.locator('.inspector > summary').click();
  await page.getByRole('button',{name:'Ẩn Cart Vue',exact:true}).click();
  await expect(page.locator('[data-module="cart"] .module-tag')).toHaveText('Cart · Vue · tạm ẩn');
  await page.getByRole('button',{name:'Mount Cart Vue',exact:true}).click();
  await expect(page.locator('[data-module="cart"] .module-tag')).toHaveText('Cart · Vue');
  await page.getByRole('button',{name:'Thêm cốc',exact:true}).click();
  await expect(page.getByTestId('header-count')).toHaveText('3');
  await expect(page.getByTestId('vue-count')).toHaveText('3');
});

import { test, expect } from '@playwright/test';
const path=slug=>'/micro-frontend/'+slug+'/v1/';
const color=locator=>locator.evaluate(element=>getComputedStyle(element).backgroundColor);

test('CSS modes use actual selector/shadow boundaries and removing stylesheet restores the cart',async({page})=>{
 for(const mode of ['global','scoped','shadow']){
  await page.goto(path('css-isolation')+'?mode='+mode);
  const cart=page.locator('#cart-action');
  const catalog=page.locator('#catalog-action').getByRole('button',{name:'Thêm vào giỏ'});
  const initial=await color(cart);
  await expect(catalog).toHaveCSS('background-color','rgb(155, 51, 40)');
  if(mode==='global')await expect(cart).toHaveCSS('background-color','rgb(155, 51, 40)');
  else expect(initial).not.toBe('rgb(155, 51, 40)');
  await page.getByLabel('Bật CSS của Catalog').uncheck();
  await expect(catalog).not.toHaveCSS('background-color','rgb(155, 51, 40)');
  await expect(cart).not.toHaveCSS('background-color','rgb(155, 51, 40)');
  await page.getByLabel('Bật CSS của Catalog').check();
  await expect(catalog).toHaveCSS('background-color','rgb(155, 51, 40)');
  if(mode==='shadow')expect(await page.locator('#catalog-action').evaluate(element=>!!element.shadowRoot)).toBe(true);
 }
});

test('shell navigation handles deep links, filter, Back/Forward and reload without resetting state on route changes',async({page})=>{
 await page.goto(path('routing'));
 await page.getByRole('link',{name:'Xem chi tiết',exact:true}).first().click();
 await expect(page).toHaveURL(/route=product%2Fmug/);
 await expect(page.getByRole('heading',{name:'Chi tiết sản phẩm',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Thêm cốc gốm',exact:true}).click();
 await expect(page.locator('#count')).toHaveText('3');
 await page.getByRole('link',{name:'Giỏ hàng',exact:true}).click();
 await expect(page.locator('#cart-view')).toHaveText('3 sản phẩm');
 await page.goBack();
 await expect(page.getByRole('heading',{name:'Chi tiết sản phẩm',exact:true})).toBeVisible();
 await page.goForward();
 await expect(page.locator('#cart-view')).toHaveText('3 sản phẩm');
 await page.getByRole('link',{name:'Sản phẩm',exact:true}).click();
 await page.getByLabel('Lọc sản phẩm').fill('áo');
 await page.getByRole('button',{name:'Áp dụng',exact:true}).click();
 await expect(page.locator('#outlet h3')).toHaveText('Áo cotton');
 await page.reload();
 await expect(page.locator('#outlet h3')).toHaveText('Áo cotton');
 await expect(page.locator('#count')).toHaveText('2'); // Reload is a new memory owner.
 await page.goto(path('routing')+'?route=product%2Fmug');
 await expect(page.getByRole('heading',{name:'Chi tiết sản phẩm',exact:true})).toBeVisible();
});
test('conflicting remote changes URL without rendering until history owner resynchronizes',async({page})=>{
 await page.goto(path('routing')+'?mode=conflict');
 await page.getByRole('link',{name:'Xem chi tiết',exact:true}).first().click();
 await expect(page).toHaveURL(/route=product%2Fmug/);
 await expect(page.getByRole('heading',{name:'Chọn đồ cho mỗi ngày',exact:true})).toBeVisible();
 await expect(page.locator('#view')).toContainText('catalog');
 await page.reload();
 await expect(page.getByRole('heading',{name:'Chi tiết sản phẩm',exact:true})).toBeVisible();
});

test('TanStack cache scope deduplicates actual query functions and cancel blocks stale completion',async({page})=>{
 for(const mode of ['shared','separate']){
  await page.goto(path('query-cache')+'?mode='+mode);
  await expect(page.locator('#requests')).toHaveText(mode==='shared'?'1':'2');
  await expect(page.locator('#cart')).toHaveText('Chưa có dữ liệu');
  await page.getByRole('button',{name:'Trả response đang chờ',exact:true}).click();
  await expect(page.locator('#header')).toContainText('2 sản phẩm');
  await expect(page.locator('#cart')).toContainText('2 sản phẩm');
  await page.getByRole('button',{name:'Thêm hàng và invalidate',exact:true}).click();
  await expect(page.locator('#requests')).toHaveText(mode==='shared'?'2':'4');
  await page.getByRole('button',{name:'Trả response đang chờ',exact:true}).click();
  await expect(page.locator('#cart')).toContainText('3 sản phẩm');
 }
 await page.goto(path('query-cache'));
 await expect(page.locator('#requests')).toHaveText('1');
 await page.getByRole('button',{name:'Ẩn Header',exact:true}).click();
 await page.getByRole('button',{name:'Trả response đang chờ',exact:true}).click();
 await expect(page.locator('#cart')).toContainText('2 sản phẩm');
 await page.getByRole('button',{name:'Mount Header',exact:true}).click();
 await expect(page.locator('#header')).toContainText('2 sản phẩm');
 await expect(page.locator('#requests')).toHaveText('1');
 await page.getByRole('button',{name:'Thêm hàng và invalidate',exact:true}).click(); // Captures rev1.
 await page.getByRole('button',{name:'Mutation khi GET đang chờ',exact:true}).click(); // Commits rev2.
 await expect(page.locator('#cart')).toContainText('4 sản phẩm · revision 2');
 await page.getByRole('button',{name:'Trả response đang chờ',exact:true}).click();
 await expect(page.locator('#cart')).toContainText('4 sản phẩm · revision 2');
 await expect(page.locator('#header')).toContainText('4 sản phẩm · revision 2');
});

test('resilience isolates real React errors and limits retry to the explicit transient fixture',async({page})=>{
 for(const mode of ['success','transient','missing','contract','render','timeout']){
  await page.goto(path('resilience')+'?mode='+mode);
  if(mode==='success')await expect(page.getByRole('button',{name:'Thêm cốc',exact:true})).toBeVisible();
  else{
   await expect(page.getByRole('alert')).toBeVisible();
   if(mode==='transient'){
    await page.getByRole('button',{name:'Thử lại một lần',exact:true}).click();
    await expect(page.getByRole('button',{name:'Thêm cốc',exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:'Thử lại một lần',exact:true})).toHaveCount(0);
   }else await expect(page.getByRole('button',{name:'Thử lại một lần',exact:true})).toHaveCount(0);
  }
  await page.getByRole('button',{name:'Thêm áo từ shell',exact:true}).click();
  await expect(page.locator('#count')).toHaveText('3');
  if(mode==='timeout'){
   await page.locator('.lab-inspector > summary').click();
   await expect(page.locator('#lab-log')).toContainText('Module đến sau deadline');
   await expect(page.getByRole('button',{name:'Thêm cốc',exact:true})).toHaveCount(0);
  }
 }
});
test('Web Component supports attributes, part styling and repeated connect/disconnect without duplicate commands',async({page})=>{
 await page.goto(path('web-components'));
 const card=page.locator('shop-product-card');
 await card.getByRole('button',{name:'Thêm cốc',exact:true}).click();
 await expect(page.locator('#count')).toHaveText('3');
 await expect(page.locator('#events')).toHaveText('1');
 for(let i=0;i<3;i++){
  await page.getByRole('button',{name:'Unmount card',exact:true}).click();
  await expect(card).toHaveCount(0);
  await page.getByRole('button',{name:'Mount card',exact:true}).click();
 }
 await card.getByRole('button',{name:'Thêm cốc',exact:true}).click();
 await expect(page.locator('#commands')).toHaveText('2');
 await expect(page.locator('#events')).toHaveText('2');
 await page.getByLabel('Disabled',{exact:true}).check();
 await expect(card.getByRole('button')).toBeDisabled();
 await page.getByLabel('Disabled',{exact:true}).uncheck();
 await page.getByLabel('Ngôn ngữ').selectOption('en');
 await expect(card.getByRole('button',{name:'Add mug',exact:true})).toBeEnabled();
 await page.getByLabel('Style ::part(action)').check();
 await expect(card.getByRole('button')).toHaveCSS('border-radius','24px');
});

test('real iframe messages enforce source/session/schema and resize only after validation',async({page})=>{
 await page.goto(path('iframe-bridge'));
 const child=page.frameLocator('#child');
 await expect(page.locator('#status')).toHaveText('Child READY · session hiện tại');
 await expect(child.getByRole('status')).toHaveText('Theme nhận từ shell: light');
 await page.getByLabel('Theme gửi xuống').selectOption('dark');
 await expect(child.getByRole('status')).toHaveText('Theme nhận từ shell: dark');
 await page.getByRole('button',{name:'Gửi sai schema',exact:true}).click();
 await expect(page.locator('#rejected')).toHaveText('1');
 await expect(child.getByRole('status')).toHaveText('Theme nhận từ shell: dark');
 await page.getByRole('button',{name:'Giả READY từ window shell',exact:true}).click();
 await expect(page.locator('#rejected')).toHaveText('2');
 await child.getByRole('button',{name:'Đổi chiều cao nội dung',exact:true}).click();
 await expect(page.locator('#child')).toHaveAttribute('height','420');
 const previous=await page.locator('#child').getAttribute('src');
 await page.getByRole('button',{name:'Reload iframe',exact:true}).click();
 await expect(page.locator('#status')).toHaveText('Child READY · session hiện tại');
 expect(await page.locator('#child').getAttribute('src')).not.toBe(previous);
 await expect(child.getByRole('status')).toHaveText('Theme nhận từ shell: dark');
});

test('React and Vue read shared design tokens without remounting; drift variant really overrides Vue',async({page})=>{
 await page.goto(path('design-tokens'));
 const react=page.locator('#react-action'),vue=page.locator('#vue-action');
 await expect(react).toBeVisible();await expect(vue).toBeVisible();
 expect(await color(react)).toBe(await color(vue));
 const before=await color(react);
 await react.click();
 await expect(page.locator('#vue-count')).toHaveText('3');
 await page.getByLabel('Màu nút').selectOption('green');
 expect(await color(react)).not.toBe(before);
 expect(await color(react)).toBe(await color(vue));
 await page.getByLabel('Theme',{exact:true}).selectOption('dark');
 expect(await color(react)).toBe(await color(vue));
 await expect(page.locator('#react-added')).toHaveText('1');
 await expect(page.locator('#vue-count')).toHaveText('3');
 const height=(await react.boundingBox()).height;
 await page.getByLabel('Density').selectOption('compact');
 expect((await react.boundingBox()).height).toBeLessThan(height);
 await page.goto(path('design-tokens')+'?mode=drift');
 await expect(page.locator('#react-action')).toBeVisible();
 expect(await color(page.locator('#react-action'))).not.toBe(await color(page.locator('#vue-action')));
});

test('every new lab is responsive in dark mode with no accidental runtime or CSP errors',async({page})=>{
 for(const slug of ['css-isolation','routing','resilience','query-cache','web-components','iframe-bridge','design-tokens']){
  const errors=[];
  const handler=error=>errors.push(error.message);page.on('pageerror',handler);
  const consoleHandler=message=>{if(message.type()==='error'&&/content security|refused to|blocked by|unsafe-inline/i.test(message.text()))errors.push(message.text());};
  page.on('console',consoleHandler);
  await page.emulateMedia({colorScheme:'dark'});
  await page.goto(path(slug));
  await expect(page.locator('h1').first()).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),slug).toBe(true);
  expect(errors,slug).toEqual([]);
  page.off('pageerror',handler);page.off('console',consoleHandler);
 }
});

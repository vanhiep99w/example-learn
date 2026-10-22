# Example Learn

Repo tập trung các app minh họa chạy thật cho bộ tài liệu kỹ thuật. Mỗi demo khai báo dependencies và build riêng; một build tổng gom static output để deploy **một Cloudflare Pages project**. Trang docs nhúng URL qua LiveDemo của docs-kit, không cài dependencies của demo.

## Chạy và kiểm tra

Yêu cầu Node >=22.12 (khuyến nghị Node 22 LTS theo .nvmrc).

```bash
npm ci
npm test
npm run typecheck
npm run build
npm run preview
# http://127.0.0.1:4175
npx playwright install chromium
npm run test:e2e
npm run test:pages # kiểm tra lại qua local Pages, gồm CSP và 404
```

Local Pages dùng Wrangler đã pin trong devDependencies; không cần đăng nhập Cloudflare và không deploy. Có thể chạy riêng bằng `npm run preview:pages`.

Máy có Chrome sẵn: CHROME_PATH=/usr/bin/google-chrome npm run test:e2e.

Chạy riêng lab React/Vue khi phát triển:

```bash
npm run dev --workspace @example-learn/mfe-communication-v1
```

## Các demo hiện có

| URL sau deploy | Source | Nội dung |
| --- | --- | --- |
| /micro-frontend/communication/v1/ | examples/micro-frontend/communication/v1 | Catalog React, Cart Vue, shell JS; command, snapshot, event, cleanup và event lặp |
| /browser/event-target/v1/ | examples/browser/event-target/v1 | JavaScript thuần, EventTarget và unsubscribe |

Lab React/Vue build chung để tập trung vào giao tiếp qua contract, **không phải Module Federation hoặc independent deployment**. API là mô phỏng bất đồng bộ trong memory; không có backend, database, auth hoặc persistence. Event schema trong lab được rút gọn cho các tình huống thực hành; không thay thế toàn bộ contract trong bài. Reload khởi tạo lại state.

## Deploy Cloudflare Pages qua GitHub

**Chưa deploy hoặc kiểm chứng URL production trong lần triển khai source này.** Domain dự kiến là https://example-learn.pages.dev; chỉ dùng sau khi dashboard xác nhận project/domain đó thuộc tài khoản của bạn.

1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
2. Chọn repo vanhiep99w/example-learn, production branch main.
3. Framework preset: **None**; root directory: root repo.
4. Build command: **npm run build**.
5. Build output directory: **dist**.
6. Chọn Node 22.12+ trong build environment; có thể đặt NODE_VERSION=22. Build phải cài devDependencies (Vite và compiler ở devDependencies); không đặt NODE_ENV=production cho bước install.
7. Tạo project tên example-learn nếu khả dụng, deploy, rồi xác nhận domain được cấp. Git integration tự rebuild khi push main.

File wrangler.jsonc đã khai báo output. Nếu dùng CLI thay vì Git integration:

```bash
npm ci
npm run build
npx wrangler login
npx wrangler pages project create example-learn --production-branch main
npx wrangler pages deploy dist --project-name example-learn
```

Lệnh create chỉ dùng khi project chưa tồn tại; deploy là thao tác publish thật, không phải kiểm tra local.

**Sau deploy**, mở trực tiếp hai URL demo, reload, thêm sản phẩm, unmount/remount, phát lại event và kiểm tra mobile. Mở trang docs rồi bấm Chạy thử để xác nhận iframe không bị chặn. Kiểm tra một file JS không tồn tại trả 404, không trả trang catalog.

Nếu domain thực tế khác example-learn.pages.dev, sửa src trong bài micro-frontend-learn/content/docs/giao-tiep-va-trang-thai/index.mdx rồi build/deploy lại docs. Không phải sửa hay phát hành lại docs-kit.

## Headers và routing

public/_headers cho phép iframe từ các site HTTPS *.pages.dev và localhost để phát triển. Nếu dùng custom domain cho docs, thêm origin đó vào frame-ancestors, rebuild/deploy. Nếu trang docs có CSP riêng, frame-src của docs cũng phải cho phép origin demo.

Không thêm X-Frame-Options: DENY/SAMEORIGIN vì các site docs ở origin khác. _headers áp dụng static assets, không tự áp dụng Pages Functions.

Có top-level 404.html để Pages không tự fallback tất cả URL sang root SPA. Mỗi demo hiện chỉ có trang index; asset URL được build theo base path riêng. Demo có client router sau này phải có strategy deep-link riêng, được kiểm tra reload và missing asset; không đặt catch-all /* /index.html 200 toàn site.

Theme demo đi theo hệ điều hành (prefers-color-scheme), độc lập với theme toggle riêng của docs. Không có postMessage bridge hoặc đồng bộ auth/storage với trang cha.

## Thêm framework hoặc demo mới

1. Tạo examples/<nhóm>/<demo>/v1 với package.json có name duy nhất và script build. Root dùng npm workspaces để cài một lần, không bắt mọi demo dùng cùng framework/version. Dependencies chỉ phục vụ demo được khai báo tại workspace đó.
2. Build của demo phải đọc DEMO_BASE_PATH, xuất dist/index.html cùng assets trong dist/. Vite là adapter hiện có; framework khác có thể dùng script/config riêng để tuân cùng hợp đồng output, không bắt buộc dùng Vite.
3. Thêm entry vào registry.json: id, version, title, description, frameworks và directory phải khớp examples/<id>/<version>.
4. Chạy npm install để cập nhật lockfile; thêm focused unit/browser tests; chạy npm run check.
5. Push repo này. Sau Pages deploy, nhúng URL đã xác nhận vào bài docs bằng LiveDemo.

Chỉ gom app xuất tĩnh: React, Vue, Angular, Svelte, Solid, HTML/JS hoặc static export của meta-framework. SSR/API/backend cần runtime/deployment riêng. Một demo build lỗi làm fail deployment tổng, không publish bản thiếu demo.

## Version và nguồn code

Đường dẫn v1 là cam kết với bài học, không phải content-addressed snapshot bất biến. Chỉ sửa lỗi/tương thích trong v1; đổi hành vi hoặc contract làm bài cũ sai thì thêm v2 và giữ v1. Commit Git + lockfile cho phép dựng lại source; không hứa rebuild cũ bit-for-bit hoặc tự triển khai đồng thời docs và demo.

Source trong repo này là nguồn chuẩn của các demo runnable mới. Không copy chúng vào docs-kit hay repo docs. Source Explorer hiện có trong các bài vẫn phục vụ những ví dụ tĩnh độc lập của bài.

Không đưa secrets hoặc dữ liệu người dùng vào demo; mọi source và static output đều công khai. Chỉ chạy code do người bảo trì tin cậy; đây không phải sandbox cho code người đọc nhập vào.

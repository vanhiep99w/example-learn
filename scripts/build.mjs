import { spawnSync } from 'node:child_process';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadRegistry, root } from './registry.mjs';

const entries = await loadRegistry();
const out = new URL('dist/', root);
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
const published = [];
for (const entry of entries) {
  const directory = new URL(entry.directory + '/', root);
  const manifest = JSON.parse(await readFile(new URL('package.json', directory), 'utf8'));
  if (!manifest.scripts?.build) throw new Error(`Missing build script: ${entry.directory}`);
  const base = `/${entry.id}/${entry.version}/`;
  // Each workspace owns its framework and build command. Only this environment contract is shared.
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build', '--workspace', entry.directory], {
    cwd: root, stdio: 'inherit', env: { ...process.env, DEMO_BASE_PATH: base },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Build failed: ${entry.directory}`);
  await readFile(new URL('dist/index.html', directory)); // Fail rather than silently publish an empty demo.
  await cp(new URL('dist/', directory), new URL(base.slice(1), out), { recursive: true });
  published.push({
    id: entry.id, version: entry.version, title: entry.title, description: entry.description,
    frameworks: entry.frameworks, path: base,
    sourceUrl: `https://github.com/vanhiep99w/example-learn/tree/main/${entry.directory}`,
    ...(entry.docsUrl ? { docsUrl: entry.docsUrl } : {}),
  });
}
await cp(new URL('public/', root), out, { recursive: true });
await writeFile(new URL('registry.json', out), JSON.stringify(published, null, 2) + '\n');
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark"><title>Example Learn — ví dụ chạy thật</title><link rel="stylesheet" href="/catalog.css"></head>
<body><main><p class="eyebrow">EXAMPLE LEARN / THƯ VIỆN THỰC HÀNH</p><h1>Đọc ý tưởng.<br>Thử hành vi thật.</h1>
<p class="intro">Các ví dụ nhỏ cho bộ tài liệu kỹ thuật. Chọn một demo, thao tác và đối chiếu source — không có backend production hay dữ liệu cá nhân.</p>
<ul class="demos">${published.map(entry => `<li><div class="meta">${entry.frameworks.map(escape).join(' + ')} · ${escape(entry.version)}</div><h2><a href="${escape(entry.path)}">${escape(entry.title)}</a></h2><p>${escape(entry.description)}</p><nav><a href="${escape(entry.path)}">Chạy thử →</a><a href="${escape(entry.sourceUrl)}">Source GitHub ↗</a>${entry.docsUrl ? `<a href="${escape(entry.docsUrl)}">Đọc bài ↗</a>` : ''}</nav></li>`).join('')}</ul>
<footer>Source là dữ liệu chuẩn. Demo chạy trong trình duyệt; reload sẽ khởi tạo lại state.</footer></main></body></html>`;
await writeFile(new URL('index.html', out), html);
console.log(`Published ${published.length} demos into ${fileURLToPath(out)}`);

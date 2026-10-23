import './lab.css';

export function setupLab({ title, intro, body, note = 'Demo browser-only. Không có dữ liệu hoặc giao dịch production.' }) {
  document.title = title;
  document.querySelector('#app').innerHTML = `<main class="lab">
    <header class="lab-heading"><a class="lab-brand" href="${import.meta.env.BASE_URL}">nếp<span>.</span> <small>LAB</small></a>
    <h1>${title}</h1><p>${intro}</p></header>
    ${body}
    <details class="lab-inspector"><summary>Xem nhật ký và giới hạn demo</summary><ol id="lab-log" aria-label="Nhật ký"></ol><p class="lab-note">${note}</p></details>
  </main>`;
  return createLog(document.querySelector('#lab-log'));
}
export function createLog(list) {
  let count = 0;
  return (kind, message) => {
    const row = document.createElement('li');
    const label = document.createElement('strong');
    label.textContent = `${++count}. ${kind}`;
    const text = document.createElement('span');
    text.textContent = message;
    row.append(label, text);
    list.prepend(row);
    while (list.children.length > 35) list.lastElementChild.remove();
  };
}
export function modeFrom(search, allowed, fallback) {
  const value = new URLSearchParams(search).get('mode');
  return allowed.includes(value) ? value : fallback;
}
export function selectorOptions(options, selected) {
  return options.map(([value, label]) => `<option value="${value}" ${selected === value ? 'selected' : ''}>${label}</option>`).join('');
}
export function changeMode(value) {
  const url = new URL(location.href);
  url.searchParams.set('mode', value);
  location.assign(url);
}
export const money = value => new Intl.NumberFormat('vi-VN', {style:'currency',currency:'VND'}).format(value);
export const mugPhoto = new URL('../examples/micro-frontend/communication/v1/src/assets/mug.jpg', import.meta.url).href;
export const shirtPhoto = new URL('../examples/micro-frontend/communication/v1/src/assets/shirt.jpg', import.meta.url).href;

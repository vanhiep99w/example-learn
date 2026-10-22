import './style.css';
const bus = new EventTarget();
const toggle = document.querySelector('#toggle');
const status = document.querySelector('#status');
let subscribed = false;
let received = 0;
const update = () => {
  toggle.textContent = subscribed ? 'Unsubscribe' : 'Subscribe';
  toggle.setAttribute('aria-pressed', String(subscribed));
  status.textContent = `${subscribed ? 'Đang subscribe' : 'Chưa subscribe'} · đã nhận ${received} event`;
};
const handler = () => {
  received++;
  const row = document.createElement('li');
  row.textContent = `Nhận event thứ ${received}`;
  const log = document.querySelector('#log');
  log.prepend(row);
  while (log.children.length > 30) log.lastElementChild.remove();
  update();
};
toggle.onclick = () => {
  subscribed = !subscribed;
  if (subscribed) bus.addEventListener('demo.ping.v1', handler);
  else bus.removeEventListener('demo.ping.v1', handler);
  update();
};
document.querySelector('#publish').onclick = () => bus.dispatchEvent(new Event('demo.ping.v1'));

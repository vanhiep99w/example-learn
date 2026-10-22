import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const portIndex = process.argv.indexOf('--port');
const port = Number(portIndex === -1 ? 4175 : process.argv[portIndex + 1]);
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let target = resolve(root, '.' + pathname);
    if (target !== root && !target.startsWith(root + sep)) throw new Error('Unsafe path');
    if ((await stat(target)).isDirectory()) target = resolve(target, 'index.html');
    const body = await readFile(target);
    res.writeHead(200, {'content-type': types[extname(target)] || 'application/octet-stream', 'x-content-type-options':'nosniff'});
    res.end(body);
  } catch {
    res.writeHead(404, {'content-type':'text/html; charset=utf-8'});
    res.end(await readFile(resolve(root, '404.html')));
  }
}).listen(port, '127.0.0.1', () => console.log(`Preview http://127.0.0.1:${port}`));

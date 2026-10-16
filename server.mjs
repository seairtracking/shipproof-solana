import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';

const root = resolve(process.argv[2] || '.');
const port = Number(process.env.PORT || 5173);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, `http://localhost:${port}`).pathname);
    const target = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (target !== root && !target.startsWith(root + sep)) throw new Error('Path outside root');
    const details = await stat(target);
    if (!details.isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'content-type': `${types[extname(target)] || 'application/octet-stream'}; charset=utf-8`, 'cache-control': 'no-store' });
    response.end(await readFile(target));
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`ShipProof: http://127.0.0.1:${port}/`));

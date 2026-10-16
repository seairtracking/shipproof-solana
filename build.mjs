import { cp, mkdir } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await cp('index.html', 'dist/index.html');
await cp('main.js', 'dist/main.js');
await cp('proof.js', 'dist/proof.js');
await cp('style.css', 'dist/style.css');
console.log('Built static app in dist/');

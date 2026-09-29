import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const root = new URL('../src/main/resources/public/', import.meta.url);
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/rankings.js', ['rankings.js', 'text/javascript; charset=utf-8']],
  ['/data/stats.json', ['data/stats.json', 'application/json; charset=utf-8']],
  ['/favicon.svg', ['favicon.svg', 'image/svg+xml']]
]);
export function createServer() {
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' https://a.espncdn.com https://origins-sportlab-payload-s3.origins-digital.com; base-uri 'none'; frame-ancestors 'none'");
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
    let pathname;
    try { pathname = new URL(req.url, 'http://localhost').pathname; }
    catch { res.writeHead(400); return res.end(); }
    const asset = assets.get(pathname);
    if (!asset) { res.writeHead(404); return res.end('Nicht gefunden'); }
    try {
      const bytes = await readFile(new URL(asset[0], root));
      res.writeHead(200, { 'Content-Type': asset[1], 'Content-Length': bytes.length });
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch { res.writeHead(404); res.end('Datei nicht vorhanden'); }
  });
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const port = Number(process.env.PORT || 8080);
  createServer().listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Stats läuft auf http://localhost:${port}`));
}

// Turns the demo build (dist-demo/) into one self-contained page: dist-demo/clinic-demo.html.
// Styles and app code are inlined; pdf.js (used to show PDFs inside the page) loads from cdnjs.
// The page has no <html>/<head>/<body> tags: the host that publishes it adds them.
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('dist-demo');
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const asset = (pattern) => {
  const match = html.match(pattern);
  if (!match) throw new Error(`Could not find ${pattern} in dist-demo/index.html`);
  return fs.readFileSync(path.join(dir, match[1]), 'utf8');
};
const css = asset(/<link rel="stylesheet"[^>]*href="\/?([^"]+\.css)"/);
// "</script" inside the code would end the inline <script> early.
const js = asset(/<script type="module"[^>]*src="\/?([^"]+\.js)"/).replace(/<\/script/gi, '<\\/script');

const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174';
const page = `<title>Clinic Patient Files</title>
<meta name="theme-color" content="#12584f">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap">
<style>${css}</style>
<script src="${PDFJS}/pdf.min.js"></script>
<script src="${PDFJS}/pdf.worker.min.js"></script>
<div id="root"></div>
<script type="module">${js}</script>
`;
fs.writeFileSync(path.join(dir, 'clinic-demo.html'), page);
console.log(`Wrote dist-demo/clinic-demo.html (${Math.round(page.length / 1024)} KB)`);

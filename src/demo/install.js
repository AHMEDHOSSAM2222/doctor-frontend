// Demo build only (VITE_DEMO=true): answers /api calls in the browser and swaps browser features
// the published demo page cannot use (new tabs, downloads, printing, confirm dialogs) for in-page
// equivalents. The app code itself runs unchanged.
import { documentBlob, handleRequest, patientIdFromToken, publicDocument } from './mockServer.js';

/** Events the demo overlay listens to: 'pdf' { blob, title } and 'notice' { text, openPdf? }. */
export const demoEvents = new EventTarget();
const emit = (type, detail) => demoEvents.dispatchEvent(new CustomEvent(type, { detail }));

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---- real downloads where the page that hosts the demo allows them ----
// When the demo is published with the `downloads` capability, files are saved through it
// (the viewer confirms each one). Elsewhere, a notice explains what the live system does.
let downloads = null;
if (window.claude?.use) {
  window.claude
    .use('downloads')
    .then((namespace) => {
      downloads = namespace;
    })
    .catch(() => {});
}

function dataUrlToBlob(dataUrl) {
  const [header, payload] = dataUrl.split(',');
  const type = header.match(/^data:([^;]+)/)?.[1] || 'application/octet-stream';
  const bytes = header.includes(';base64')
    ? Uint8Array.from(atob(payload), (c) => c.charCodeAt(0))
    : new TextEncoder().encode(decodeURIComponent(payload));
  return new Blob([bytes], { type });
}

/** Saves the file if this view allows downloads; otherwise shows `fallback` as a notice. */
function offerDownload(filename, blob, fallback) {
  if (!downloads || !blob) {
    emit('notice', fallback);
    return;
  }
  downloads.save({ filename, data: blob }).catch((err) => {
    if (err?.code === 'declined') return;
    if (err?.code === 'rate_limited') {
      emit('notice', { text: 'Another download is waiting for your answer. Try again in a moment.' });
      return;
    }
    downloads = null;
    emit('notice', fallback);
  });
}

// ---- API calls ----
const realFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input.url;
  if (!url.startsWith('/api/')) return realFetch(input, init);

  const parsed = new URL(url, 'https://demo.invalid');
  let { body } = init;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      // leave as text
    }
  }
  const headers = new Headers(init.headers || {});
  await wait(150); // feel like a real network call

  const result = await handleRequest({
    method: (init.method || 'GET').toUpperCase(),
    path: parsed.pathname,
    query: parsed.searchParams,
    body,
    authorization: headers.get('authorization'),
  });
  if (result.blob) return new Response(result.blob, { status: 200, headers: { 'content-type': 'application/pdf' } });
  if (result.status === 204) return new Response(null, { status: 204 });
  return new Response(JSON.stringify(result.data), {
    status: result.status,
    headers: { 'content-type': 'application/json' },
  });
};

// ---- PDFs opened by staff (the app opens a tab, then points it at a blob: URL) ----
const blobsByUrl = new Map();
const realCreateObjectURL = URL.createObjectURL.bind(URL);
URL.createObjectURL = (blob) => {
  const url = realCreateObjectURL(blob);
  blobsByUrl.set(url, blob);
  return url;
};

let lastDocumentTitle = 'PDF';
document.addEventListener(
  'click',
  (event) => {
    const button = event.target.closest?.('.doc-title-button');
    if (button) lastDocumentTitle = button.textContent.trim();
  },
  true,
);

window.open = () => ({
  closed: false,
  close() {},
  location: {
    set href(url) {
      const blob = blobsByUrl.get(url);
      if (blob) emit('pdf', { blob, title: lastDocumentTitle });
    },
  },
});

// ---- links: patient PDF links and file downloads ----
document.addEventListener(
  'click',
  (event) => {
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');

    if (href.startsWith('/api/public/documents/')) {
      event.preventDefault();
      const url = new URL(href, 'https://demo.invalid');
      const token = url.searchParams.get('token');
      // An expired session is handled by the patient page itself (it closes the file).
      if (!patientIdFromToken(token)) return;
      const doc = publicDocument(url.pathname.split('/').pop(), token);
      if (!doc) return;
      const openPdf = () => emit('pdf', { blob: documentBlob(doc), title: doc.title });
      if (url.searchParams.get('download') === '1') {
        offerDownload(`${doc.title}.pdf`, documentBlob(doc), {
          text: `Downloads are turned off in this demo. In the live system, Download saves “${doc.title}.pdf” on the phone.`,
          openPdf,
        });
      } else {
        openPdf();
      }
      return;
    }

    if (link.hasAttribute('download') && /^(blob:|data:)/.test(href)) {
      event.preventDefault();
      const filename = link.getAttribute('download');
      const blob = href.startsWith('data:') ? dataUrlToBlob(href) : blobsByUrl.get(href);
      offerDownload(filename, blob, {
        text: `Downloads are turned off in this demo. In the live system, this saves “${filename}”.`,
      });
    }
  },
  true,
);

// ---- printing and confirmations ----
window.print = () =>
  emit('notice', { text: 'Printing is turned off in this demo. In the live system, this prints the QR code poster.' });

window.confirm = (message) => {
  emit('notice', { text: `In the live system you confirm this first: “${message}”` });
  return true;
};

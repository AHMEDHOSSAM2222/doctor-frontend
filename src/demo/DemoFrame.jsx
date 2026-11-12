import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { demoEvents } from './install.js';
import { DEMO_LOGIN, DEMO_PATIENT, resetDemo } from './mockServer.js';
import './demo.css';

/** Demo bar with the sample logins, plus the in-page PDF viewer and notices. */
export default function DemoFrame() {
  return (
    <>
      <DemoBar />
      <DemoOverlay />
    </>
  );
}

function DemoBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [confirmReset, setConfirmReset] = useState(false);
  const onPatientPage = location.pathname === '/patient';

  useEffect(() => {
    if (!confirmReset) return undefined;
    const id = setTimeout(() => setConfirmReset(false), 4000);
    return () => clearTimeout(id);
  }, [confirmReset]);

  const reset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    resetDemo();
    window.location.reload();
  };

  return (
    <div className="demo-bar" role="region" aria-label="About this demo">
      <div className="demo-bar-inner">
        <p className="demo-intro">
          <span className="demo-pill" lang="en">
            Demo <span lang="ar">تجريبي</span>
          </span>
          <span>Sample data only. Changes stay in this browser.</span>
        </p>
        <dl className="demo-hints">
          <div>
            <dt>Staff login</dt>
            <dd>
              <code>{DEMO_LOGIN.username}</code> / <code>{DEMO_LOGIN.password}</code>
            </dd>
          </div>
          <div>
            <dt>Sample patient</dt>
            <dd>
              file <code>{DEMO_PATIENT.fileNumber}</code>, phone <code>{DEMO_PATIENT.phone}</code>
            </dd>
          </div>
        </dl>
        <nav className="demo-nav" aria-label="Demo views">
          <button
            type="button"
            className={onPatientPage ? '' : 'is-current'}
            aria-current={onPatientPage ? undefined : 'page'}
            onClick={() => navigate('/admin')}
          >
            Staff dashboard
          </button>
          <button
            type="button"
            className={onPatientPage ? 'is-current' : ''}
            aria-current={onPatientPage ? 'page' : undefined}
            onClick={() => navigate('/patient')}
          >
            Patient page (QR code)
          </button>
          <button type="button" className="demo-reset" onClick={reset}>
            {confirmReset ? 'Click again to reset' : 'Reset demo'}
          </button>
        </nav>
      </div>
    </div>
  );
}

let noticeId = 0;

function DemoOverlay() {
  const [pdf, setPdf] = useState(null); // { blob, title }
  const [notices, setNotices] = useState([]);

  const dismiss = useCallback((id) => setNotices((list) => list.filter((n) => n.id !== id)), []);

  useEffect(() => {
    const onPdf = (event) => setPdf(event.detail);
    const onNotice = (event) => {
      const id = (noticeId += 1);
      setNotices((list) => [...list.slice(-2), { id, ...event.detail }]);
      setTimeout(() => dismiss(id), 8000);
    };
    demoEvents.addEventListener('pdf', onPdf);
    demoEvents.addEventListener('notice', onNotice);
    return () => {
      demoEvents.removeEventListener('pdf', onPdf);
      demoEvents.removeEventListener('notice', onNotice);
    };
  }, [dismiss]);

  return (
    <>
      {notices.length > 0 && (
        <div className="demo-notices" role="status">
          {notices.map((notice) => (
            <div key={notice.id} className="demo-notice">
              <p>{notice.text}</p>
              <div className="demo-notice-actions">
                {notice.openPdf && (
                  <button
                    type="button"
                    onClick={() => {
                      notice.openPdf();
                      dismiss(notice.id);
                    }}
                  >
                    Open the PDF instead
                  </button>
                )}
                <button type="button" onClick={() => dismiss(notice.id)} aria-label="Close message">
                  Close
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {pdf && <PdfViewer blob={pdf.blob} title={pdf.title} onClose={() => setPdf(null)} />}
    </>
  );
}

/** Shows a PDF inside the page with pdf.js (loaded by the demo page from cdnjs). */
function PdfViewer({ blob, title, onClose }) {
  const pagesRef = useRef(null);
  const closeRef = useRef(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const lib = window.pdfjsLib;
      if (!lib) throw new Error('pdf.js not loaded');
      const pdfDoc = await lib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()), isEvalSupported: false })
        .promise;
      const container = pagesRef.current;
      if (cancelled || !container) return;
      container.replaceChildren();
      const width = container.clientWidth;
      const ratio = window.devicePixelRatio || 1;
      for (let number = 1; number <= pdfDoc.numPages; number += 1) {
        const page = await pdfDoc.getPage(number);
        const scale = width / page.getViewport({ scale: 1 }).width;
        const viewport = page.getViewport({ scale: scale * ratio });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.setAttribute('aria-label', `${title}, page ${number}`);
        canvas.setAttribute('role', 'img');
        container.append(canvas);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        if (cancelled) return;
      }
      setStatus('ready');
    })().catch(() => !cancelled && setStatus('error'));
    return () => {
      cancelled = true;
    };
  }, [blob, title]);

  return (
    <div className="demo-viewer" role="dialog" aria-modal="true" aria-labelledby="demo-viewer-title">
      <div className="demo-viewer-head">
        <h2 id="demo-viewer-title" dir="auto">
          {title}
        </h2>
        <button ref={closeRef} type="button" onClick={onClose}>
          Close PDF
        </button>
      </div>
      <p className="demo-viewer-note">In the live system, this opens in the phone’s or computer’s PDF viewer.</p>
      <div className="demo-viewer-body">
        {status === 'loading' && <p className="demo-viewer-status">Opening PDF…</p>}
        {status === 'error' && (
          <p className="demo-viewer-status">
            This PDF cannot be shown in the demo. In the live system it opens in the device’s PDF viewer.
          </p>
        )}
        <div ref={pagesRef} className="demo-viewer-pages" />
      </div>
    </div>
  );
}

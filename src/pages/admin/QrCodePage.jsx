import QRCode from 'qrcode';
import { useEffect, useMemo, useState } from 'react';
import { CLINIC_NAME } from '../../api.js';
import { Field } from '../../components/Field.jsx';

const PATIENT_PAGE_PATH = '/patient';
const QR_COLORS = { dark: '#18231f', light: '#ffffff' };

// VITE_QR_LINK sets the exact link (used by the demo); otherwise <site address>/patient.
const defaultLink = () =>
  import.meta.env.VITE_QR_LINK ||
  `${(import.meta.env.VITE_PUBLIC_URL || window.location.origin).replace(/\/+$/, '')}${PATIENT_PAGE_PATH}`;

// Saved poster settings belong to one site address: when the address changes
// (or the patient page moves), the poster starts again from the new defaults.
const SETTINGS_KEY = `qr-poster-settings-v2:${defaultLink()}`;

const defaults = () => ({
  link: defaultLink(),
  clinicName: CLINIC_NAME,
  heading: 'Scan to open your medical file',
  subheading: 'امسح الكود لفتح ملفك الطبي',
});

function loadSettings() {
  try {
    return { ...defaults(), ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return defaults();
  }
}

const isValidUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const download = (href, filename) => {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

/** Generates the QR code patients scan to open the file lookup page. */
export default function QrCodePage() {
  const [settings, setSettings] = useState(loadSettings);
  const [svg, setSvg] = useState('');
  const { link, clinicName, heading, subheading } = settings;
  const validLink = isValidUrl(link);
  const isLocal = useMemo(
    () => validLink && /^(localhost|127\.|\[::1\]|0\.0\.0\.0)/.test(new URL(link).hostname),
    [link, validLink],
  );

  useEffect(() => {
    document.title = `QR code – ${CLINIC_NAME}`;
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore unavailable storage
    }
  }, [settings]);

  useEffect(() => {
    if (!validLink) {
      setSvg('');
      return;
    }
    let cancelled = false;
    QRCode.toString(link, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: QR_COLORS }).then(
      (markup) => !cancelled && setSvg(markup),
    );
    return () => {
      cancelled = true;
    };
  }, [link, validLink]);

  const update = (key) => (event) => setSettings((prev) => ({ ...prev, [key]: event.target.value }));

  const downloadPng = async () => {
    const dataUrl = await QRCode.toDataURL(link, {
      width: 1024,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: QR_COLORS,
    });
    download(dataUrl, 'patient-file-qr-code.png');
  };

  const downloadSvg = () => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    download(url, 'patient-file-qr-code.svg');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>QR code</h1>
          <p className="muted">
            Print this poster for your waiting room or reception. Patients scan it with their phone camera, then enter
            their file number and phone number to open their file.
          </p>
        </div>
      </div>

      <div className="qr-layout">
        <div className="poster" id="qr-poster">
          <p className="poster-clinic">{clinicName}</p>
          {svg ? (
            <div
              className="poster-qr"
              role="img"
              aria-label={`QR code linking to ${link}`}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <div className="poster-qr poster-qr-empty">Enter a valid link to generate the code</div>
          )}
          {heading && <p className="poster-heading">{heading}</p>}
          {subheading && (
            <p className="poster-sub" dir="auto">
              {subheading}
            </p>
          )}
          {validLink && (
            <p className="poster-url" dir="ltr">
              {link}
            </p>
          )}
        </div>

        <div className="qr-controls">
          <Field label="Link the code opens" hint="The address of the patient page on your live website.">
            <input className="input" type="url" dir="ltr" value={link} onChange={update('link')} />
          </Field>
          {!validLink && (
            <p className="form-error" role="alert">
              Enter a full link starting with https://
            </p>
          )}
          {isLocal && (
            <p className="warn" role="status">
              Phones cannot open “{new URL(link).hostname}”. Use your live website address, or for testing on the same
              Wi-Fi, your computer’s network address (for example http://192.168.1.10:5173/patient).
            </p>
          )}
          <label className="field">
            <span className="field-label">Clinic name</span>
            <input className="input" value={clinicName} onChange={update('clinicName')} />
          </label>
          <label className="field">
            <span className="field-label">Heading</span>
            <input className="input" value={heading} onChange={update('heading')} />
          </label>
          <label className="field">
            <span className="field-label">Second line</span>
            <input className="input" dir="auto" value={subheading} onChange={update('subheading')} />
          </label>

          <div className="button-row">
            <button type="button" className="btn btn-primary" onClick={() => window.print()} disabled={!svg}>
              Print poster
            </button>
            <button type="button" className="btn btn-secondary" onClick={downloadPng} disabled={!svg}>
              Download PNG
            </button>
            <button type="button" className="btn btn-secondary" onClick={downloadSvg} disabled={!svg}>
              Download SVG
            </button>
          </div>
          <button type="button" className="btn-link reset-link" onClick={() => setSettings(defaults())}>
            Reset to defaults
          </button>
        </div>
      </div>
    </>
  );
}

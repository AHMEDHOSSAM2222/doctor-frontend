import { useEffect, useRef, useState } from 'react';
import { api, CLINIC_NAME, publicDocumentUrl } from '../api.js';
import { DocumentList, PdfPicker } from '../components/Documents.jsx';
import { Folder, PatientSummary, VisitTimeline } from '../components/PatientFile.jsx';
import { normalizeDigits } from '../format.js';
import { initialLang, saveLang, strings } from '../i18n.js';

/** Public page opened by scanning the clinic QR code. */
export default function PatientLookup() {
  const [lang, setLang] = useState(initialLang);
  const t = strings[lang];
  const [fileNumber, setFileNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState('');
  const [file, setFile] = useState(null);
  const [pendingPdfs, setPendingPdfs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null); // { type: 'success' | 'error', text }
  const fileInputRef = useRef(null);

  useEffect(() => {
    document.title = `${t.title} – ${CLINIC_NAME}`;
  }, [t]);

  const switchLang = () => {
    setLang(t.switchToLang);
    saveLang(t.switchToLang);
  };

  const submit = async (event) => {
    event.preventDefault();
    const cleanFile = normalizeDigits(fileNumber).trim();
    const cleanPhone = normalizeDigits(phone).trim();
    if (!cleanFile || !cleanPhone) {
      setErrorKey('required');
      return;
    }
    setLoading(true);
    setErrorKey('');
    try {
      const data = await api.lookupFile(cleanFile, cleanPhone);
      setFile(data);
      setPhone('');
      window.scrollTo({ top: 0 });
    } catch (err) {
      if (err.status === 404) setErrorKey('noMatch');
      else if (err.status === 429) setErrorKey('tooMany');
      else if (err.status === 0) setErrorKey('offline');
      else setErrorKey('genericError');
    } finally {
      setLoading(false);
    }
  };

  const closeFile = (reason = '') => {
    setFile(null);
    setPendingPdfs([]);
    setUploadMessage(null);
    setFileNumber('');
    setPhone('');
    setErrorKey(reason);
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => fileInputRef.current?.focus());
  };

  // The access token from the lookup opens, adds and removes PDFs for a limited time.
  const accessExpired = () => Date.parse(file.access.expiresAt) <= Date.now();

  // Close the file instead of opening a dead PDF link.
  const checkAccess = (event) => {
    if (accessExpired()) {
      event.preventDefault();
      closeFile('expired');
    }
  };

  // Shows an upload/delete error in the patient's language; an ended session closes the file.
  const showUploadError = (err) => {
    if (err.status === 401) return closeFile('expired');
    const text = err.status === 0 ? t.offline : t.uploadErrors[err.code] || t.uploadErrors.default;
    return setUploadMessage({ type: 'error', text });
  };

  const uploadPdfs = async () => {
    if (accessExpired()) return closeFile('expired');
    setUploading(true);
    setUploadMessage(null);
    try {
      const { documents } = await api.patientUploadDocuments(file.access.token, pendingPdfs);
      setFile((prev) => ({ ...prev, documents }));
      setUploadMessage({ type: 'success', text: t.uploaded(pendingPdfs.length) });
      setPendingPdfs([]);
    } catch (err) {
      showUploadError(err);
    } finally {
      setUploading(false);
    }
    return undefined;
  };

  const deleteOwnDocument = async (doc) => {
    if (accessExpired()) return closeFile('expired');
    if (!window.confirm(t.confirmDelete(doc.title))) return undefined;
    setUploadMessage(null);
    try {
      const { documents } = await api.patientDeleteDocument(file.access.token, doc.id);
      setFile((prev) => ({ ...prev, documents }));
    } catch (err) {
      showUploadError(err);
    }
    return undefined;
  };

  return (
    <div className="patient-page" dir={t.dir} lang={lang}>
      <header className="patient-header">
        <span className="clinic-name">{CLINIC_NAME}</span>
        <button type="button" className="lang-switch" onClick={switchLang} lang={t.switchToLang}>
          {t.switchTo}
        </button>
      </header>

      <main className="patient-main">
        {!file ? (
          <>
            <h1 className="patient-title">{t.title}</h1>
            <p className="lede">{t.intro}</p>

            <Folder label={t.fileNo} number={normalizeDigits(fileNumber).trim()}>
              <form className="lookup-form" onSubmit={submit} noValidate>
                <label className="field">
                  <span className="field-label">{t.fileNumber}</span>
                  <input
                    ref={fileInputRef}
                    className="input input-large"
                    dir="ltr"
                    name="fileNumber"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck="false"
                    maxLength={50}
                    value={fileNumber}
                    onChange={(e) => setFileNumber(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field-label">{t.phone}</span>
                  <input
                    className="input input-large"
                    dir="ltr"
                    type="tel"
                    name="phone"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={30}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
                {errorKey && (
                  <p className="form-error" role="alert">
                    {t[errorKey]}
                  </p>
                )}
                <button type="submit" className="btn btn-primary btn-block btn-large" disabled={loading}>
                  {loading ? t.opening : t.openFile}
                </button>
              </form>
            </Folder>
          </>
        ) : (
          <>
            <Folder label={t.fileNo} number={file.patient.fileNumber} className="folder-open">
              <PatientSummary patient={file.patient} t={t} />
            </Folder>

            <section className="documents patient-documents" aria-labelledby="documents-heading">
              <div>
                <h2 id="documents-heading" className="section-title">
                  {t.documents}
                </h2>
                <p className="muted">{file.documents.length > 0 ? t.documentsHint : t.noDocuments}</p>
              </div>
              {file.documents.length > 0 && (
                <DocumentList
                  documents={file.documents}
                  locale={t.locale}
                  getHref={(doc) => publicDocumentUrl(doc.id, file.access.token)}
                  onLinkClick={checkAccess}
                  tagFor={(doc) => (doc.uploadedBy === 'patient' ? t.addedByYou : null)}
                  renderActions={(doc) =>
                    doc.uploadedBy === 'patient' && (
                      <button
                        type="button"
                        className="btn btn-danger btn-small"
                        onClick={() => deleteOwnDocument(doc)}
                        aria-label={t.deleteDocNamed(doc.title)}
                      >
                        {t.deleteDoc}
                      </button>
                    )
                  }
                />
              )}

              <div className="patient-upload">
                <PdfPicker
                  items={pendingPdfs}
                  onChange={(items) => {
                    setPendingPdfs(items);
                    setUploadMessage(null);
                  }}
                  disabled={uploading}
                  labels={t.upload}
                  locale={t.locale}
                />
                {pendingPdfs.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-primary btn-block btn-large"
                    onClick={uploadPdfs}
                    disabled={uploading}
                  >
                    {uploading ? t.uploading : t.uploadButton(pendingPdfs.length)}
                  </button>
                )}
                {uploadMessage && (
                  <p
                    className={uploadMessage.type === 'success' ? 'form-success' : 'form-error'}
                    role={uploadMessage.type === 'success' ? 'status' : 'alert'}
                  >
                    {uploadMessage.text}
                  </p>
                )}
              </div>
            </section>

            <section className="visits" aria-labelledby="visits-heading">
              <h2 id="visits-heading" className="section-title">
                {t.visits}
              </h2>
              <VisitTimeline visits={file.visits} t={t} />
            </section>

            <div className="close-area">
              <p className="privacy-note">{t.privacy}</p>
              <button type="button" className="btn btn-secondary btn-block btn-large" onClick={() => closeFile()}>
                {t.closeFile}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

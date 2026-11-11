import { useEffect, useRef, useState } from 'react';
import { api, CLINIC_NAME } from '../api.js';
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

  const closeFile = () => {
    setFile(null);
    setFileNumber('');
    setPhone('');
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => fileInputRef.current?.focus());
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

            <section className="visits" aria-labelledby="visits-heading">
              <h2 id="visits-heading" className="section-title">
                {t.visits}
              </h2>
              <VisitTimeline visits={file.visits} t={t} />
            </section>

            <div className="close-area">
              <p className="privacy-note">{t.privacy}</p>
              <button type="button" className="btn btn-secondary btn-block btn-large" onClick={closeFile}>
                {t.closeFile}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

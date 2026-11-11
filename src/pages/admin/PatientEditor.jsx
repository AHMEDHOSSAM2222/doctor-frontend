import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, CLINIC_NAME } from '../../api.js';
import { PdfPicker } from '../../components/Documents.jsx';
import { Field } from '../../components/Field.jsx';

const EMPTY = {
  fileNumber: '',
  fullName: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  bloodType: '',
  allergies: '',
  chronicConditions: '',
  notes: '',
};

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const toForm = (patient) => Object.fromEntries(Object.keys(EMPTY).map((key) => [key, patient[key] ?? '']));

/** Create a new patient file, or edit an existing one at /admin/patients/:id/edit. */
export default function PatientEditor() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [nextNumber, setNextNumber] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [pdfs, setPdfs] = useState([]);

  useEffect(() => {
    document.title = `${isEdit ? 'Edit file' : 'New file'} – ${CLINIC_NAME}`;
    if (isEdit) {
      api
        .getPatient(id)
        .then(({ patient }) => setForm(toForm(patient)))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      api
        .nextFileNumber()
        .then(({ fileNumber }) => setNextNumber(fileNumber))
        .catch(() => {});
    }
  }, [id, isEdit]);

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving('Saving…');
    setError('');
    let patient;
    try {
      ({ patient } = isEdit ? await api.updatePatient(id, form) : await api.createPatient(form));
    } catch (err) {
      setError(err.message);
      setSaving('');
      return;
    }

    // The file is saved; now attach the PDFs. If that fails, the file page shows the error and the
    // PDFs can be added again there.
    let uploadError = '';
    if (pdfs.length) {
      setSaving(`Uploading ${pdfs.length === 1 ? 'PDF' : `${pdfs.length} PDFs`}…`);
      try {
        await api.uploadDocuments(patient.id, pdfs);
      } catch (err) {
        uploadError = `The file was saved, but the PDFs were not uploaded: ${err.message}`;
      }
    }
    navigate(`/admin/patients/${patient.id}`, { replace: isEdit, state: { uploadError } });
  };

  if (loading) return <p className="muted">Loading file…</p>;

  return (
    <>
      <Link to={isEdit ? `/admin/patients/${id}` : '/admin'} className="back-link">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        {isEdit ? 'Back to file' : 'Patient files'}
      </Link>
      <div className="page-head">
        <h1>{isEdit ? `Edit file ${form.fileNumber}` : 'New patient file'}</h1>
      </div>

      <form className="form-card" onSubmit={submit}>
        <p className="notice">
          Patients see everything in this file, including the PDFs, except the phone number when they open it from the
          QR code. They need the file number and this phone number to open it.
        </p>

        <div className="form-grid">
          <Field
            label="File number"
            hint={!isEdit ? `Leave empty to use the next number${nextNumber ? ` (${nextNumber})` : ''}.` : undefined}
          >
            <input
              className="input"
              value={form.fileNumber}
              onChange={update('fileNumber')}
              placeholder={!isEdit && nextNumber ? nextNumber : undefined}
              maxLength={50}
              dir="ltr"
            />
          </Field>

          <Field label="Full name">
            <input className="input" value={form.fullName} onChange={update('fullName')} required maxLength={200} />
          </Field>

          <Field label="Phone number" hint="The patient types this number to open their file.">
            <input
              className="input"
              type="tel"
              dir="ltr"
              value={form.phone}
              onChange={update('phone')}
              required
              maxLength={30}
            />
          </Field>

          <Field label="Date of birth">
            <input className="input" type="date" value={form.dateOfBirth} onChange={update('dateOfBirth')} />
          </Field>

          <Field label="Gender">
            <select className="input" value={form.gender} onChange={update('gender')}>
              <option value="">Not set</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </Field>

          <Field label="Blood type">
            <select className="input" value={form.bloodType} onChange={update('bloodType')}>
              <option value="">Not set</option>
              {BLOOD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Allergies" className="span-2" hint="Shown highlighted at the top of the patient’s file.">
            <textarea className="input" rows={2} value={form.allergies} onChange={update('allergies')} />
          </Field>

          <Field label="Chronic conditions" className="span-2">
            <textarea
              className="input"
              rows={2}
              value={form.chronicConditions}
              onChange={update('chronicConditions')}
            />
          </Field>

          <Field label="Doctor’s notes" className="span-2">
            <textarea className="input" rows={4} value={form.notes} onChange={update('notes')} />
          </Field>
        </div>

        <section className="form-section" aria-labelledby="pdf-section-title">
          <h2 id="pdf-section-title" className="form-section-title">
            {isEdit ? 'Add PDF files' : 'PDF files'}
          </h2>
          <p className="muted form-section-hint">
            Lab results, reports, scans or prescriptions. Patients can open them from their phone.
          </p>
          <PdfPicker items={pdfs} onChange={setPdfs} disabled={Boolean(saving)} />
        </section>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={Boolean(saving)}>
            {saving || (isEdit ? 'Save changes' : 'Create file')}
          </button>
          <Link to={isEdit ? `/admin/patients/${id}` : '/admin'} className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}

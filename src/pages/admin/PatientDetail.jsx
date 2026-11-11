import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, CLINIC_NAME } from '../../api.js';
import { Folder, PatientSummary, VisitTimeline } from '../../components/PatientFile.jsx';
import { todayIso } from '../../format.js';
import { strings } from '../../i18n.js';

const t = strings.en;

function VisitForm({ initial, onSave, onCancel }) {
  const [visit, setVisit] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const update = (key) => (event) => setVisit((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(visit);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form className="visit-form" onSubmit={submit}>
      <h3>{initial.id ? 'Edit visit' : 'New visit'}</h3>
      <div className="form-grid">
        <label className="field">
          <span className="field-label">Visit date</span>
          <input className="input" type="date" required value={visit.visitDate} onChange={update('visitDate')} />
        </label>
        <label className="field">
          <span className="field-label">Diagnosis</span>
          <input className="input" value={visit.diagnosis} onChange={update('diagnosis')} />
        </label>
        <label className="field span-2">
          <span className="field-label">Prescription</span>
          <textarea className="input" rows={3} value={visit.prescription} onChange={update('prescription')} />
        </label>
        <label className="field span-2">
          <span className="field-label">Notes</span>
          <textarea className="input" rows={2} value={visit.notes} onChange={update('notes')} />
        </label>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="button-row">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save visit'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState('');
  const [visitForm, setVisitForm] = useState(null);

  useEffect(() => {
    api
      .getPatient(id)
      .then(({ patient: p }) => setPatient(p))
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    if (patient) document.title = `${patient.fullName} (file ${patient.fileNumber}) – ${CLINIC_NAME}`;
  }, [patient]);

  if (error && !patient) {
    return (
      <div className="empty">
        <h2>{error}</h2>
        <Link to="/admin" className="btn btn-secondary">
          Back to patient files
        </Link>
      </div>
    );
  }
  if (!patient) return <p className="muted">Loading file…</p>;

  const deletePatient = async () => {
    const ok = window.confirm(
      `Delete file ${patient.fileNumber} for ${patient.fullName}? All visits in this file are deleted too. This cannot be undone.`,
    );
    if (!ok) return;
    try {
      await api.deletePatient(patient.id);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  const saveVisit = async (visit) => {
    const { patient: updated } = visit.id
      ? await api.updateVisit(patient.id, visit.id, visit)
      : await api.addVisit(patient.id, visit);
    setPatient(updated);
    setVisitForm(null);
  };

  const deleteVisit = async (visit) => {
    if (!window.confirm(`Delete the visit on ${visit.visitDate}? This cannot be undone.`)) return;
    try {
      const { patient: updated } = await api.deleteVisit(patient.id, visit.id);
      setPatient(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const visitActions = (visit) =>
    visitForm?.id === visit.id ? null : (
      <div className="timeline-actions">
        <button
          type="button"
          className="btn btn-secondary btn-small"
          onClick={() =>
            setVisitForm({
              id: visit.id,
              visitDate: visit.visitDate,
              diagnosis: visit.diagnosis ?? '',
              prescription: visit.prescription ?? '',
              notes: visit.notes ?? '',
            })
          }
        >
          Edit
        </button>
        <button type="button" className="btn btn-danger btn-small" onClick={() => deleteVisit(visit)}>
          Delete
        </button>
      </div>
    );

  return (
    <>
      <Link to="/admin" className="back-link">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        Patient files
      </Link>

      <div className="page-head">
        <div>
          <h1>{patient.fullName}</h1>
          <p className="muted">
            Registered phone <span dir="ltr">{patient.phone}</span>
          </p>
        </div>
        <div className="button-row">
          <Link to={`/admin/patients/${patient.id}/edit`} className="btn btn-secondary">
            Edit file
          </Link>
          <button type="button" className="btn btn-danger" onClick={deletePatient}>
            Delete file
          </button>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="detail-grid">
        <div>
          <p className="preview-note">This is what the patient sees after scanning the QR code.</p>
          <Folder label={t.fileNo} number={patient.fileNumber}>
            <PatientSummary patient={patient} t={t} />
          </Folder>
        </div>

        <section className="visits" aria-labelledby="visits-heading">
          <div className="visits-head">
            <h2 id="visits-heading" className="section-title">
              Visits
            </h2>
            {!visitForm && (
              <button
                type="button"
                className="btn btn-primary btn-small"
                onClick={() => setVisitForm({ visitDate: todayIso(), diagnosis: '', prescription: '', notes: '' })}
              >
                Add visit
              </button>
            )}
          </div>

          {visitForm && !visitForm.id && (
            <VisitForm initial={visitForm} onSave={saveVisit} onCancel={() => setVisitForm(null)} />
          )}

          {visitForm?.id ? (
            <>
              <VisitForm
                key={visitForm.id}
                initial={visitForm}
                onSave={saveVisit}
                onCancel={() => setVisitForm(null)}
              />
              <VisitTimeline
                visits={patient.visits.filter((v) => v.id !== visitForm.id)}
                t={t}
                renderActions={visitActions}
              />
            </>
          ) : (
            <VisitTimeline visits={patient.visits} t={t} renderActions={visitActions} />
          )}
        </section>
      </div>
    </>
  );
}

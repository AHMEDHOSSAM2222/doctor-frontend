import { ageFrom, formatDate } from '../format.js';

/**
 * A patient file folder: a card with a tab carrying the file number.
 * Pass `number=""` to show an empty number slot, or leave it undefined to hide it.
 */
export function Folder({ label, number, className = '', children }) {
  return (
    <section className={`folder ${className}`}>
      <div className="folder-tab">
        <span className="folder-tab-label">{label}</span>
        {number !== undefined && (
          <span className="folder-tab-number" dir="ltr">
            {number || <span className="folder-tab-empty" aria-hidden="true" />}
          </span>
        )}
      </div>
      <div className="folder-body">{children}</div>
    </section>
  );
}

function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M10 2.5 18.5 17h-17z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 8v4.2M10 14.4v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Patient details as shown to the patient (also used as the admin preview). */
export function PatientSummary({ patient, t }) {
  const age = ageFrom(patient.dateOfBirth);
  const facts = [
    age !== null && {
      label: t.age,
      value: t.years(age),
      sub: formatDate(patient.dateOfBirth, t.locale),
    },
    patient.gender && { label: t.gender, value: t[patient.gender] },
    patient.bloodType && { label: t.bloodType, value: patient.bloodType, ltr: true },
  ].filter(Boolean);

  return (
    <>
      <div>
        <h2 className="patient-name" dir="auto">
          {patient.fullName}
        </h2>
        {patient.updatedAt && (
          <p className="patient-updated">{t.lastUpdated(formatDate(patient.updatedAt, t.locale))}</p>
        )}
      </div>

      {facts.length > 0 && (
        <dl className="facts">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>
                <span dir={fact.ltr ? 'ltr' : undefined}>{fact.value}</span>
                {fact.sub && <span className="fact-sub">{fact.sub}</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {patient.allergies && (
        <div className="allergy" role="note">
          <h3>
            <AlertIcon />
            {t.allergies}
          </h3>
          <p className="prewrap" dir="auto">
            {patient.allergies}
          </p>
        </div>
      )}

      {patient.chronicConditions && (
        <div className="file-section">
          <h3>{t.chronicConditions}</h3>
          <p className="prewrap" dir="auto">
            {patient.chronicConditions}
          </p>
        </div>
      )}

      {patient.notes && (
        <div className="file-section">
          <h3>{t.notes}</h3>
          <p className="prewrap" dir="auto">
            {patient.notes}
          </p>
        </div>
      )}
    </>
  );
}

/** Visits, newest first. `renderActions(visit)` adds admin buttons under each visit. */
export function VisitTimeline({ visits, t, renderActions }) {
  if (!visits.length) return <p className="empty-note">{t.noVisits}</p>;
  return (
    <ol className="timeline">
      {visits.map((visit, index) => (
        <li key={visit.id ?? `${visit.visitDate}-${index}`} className="timeline-item">
          <time className="timeline-date" dateTime={visit.visitDate}>
            {formatDate(visit.visitDate, t.locale)}
          </time>
          <div className="timeline-body">
            {visit.diagnosis && (
              <p className="visit-diagnosis">
                <span className="visually-hidden">{t.diagnosis}: </span>
                <span dir="auto">{visit.diagnosis}</span>
              </p>
            )}
            {visit.prescription && (
              <div className="visit-field">
                <h4>{t.prescription}</h4>
                <p className="prewrap" dir="auto">
                  {visit.prescription}
                </p>
              </div>
            )}
            {visit.notes && (
              <div className="visit-field">
                <h4>{t.visitNotes}</h4>
                <p className="prewrap" dir="auto">
                  {visit.notes}
                </p>
              </div>
            )}
            {renderActions?.(visit)}
          </div>
        </li>
      ))}
    </ol>
  );
}

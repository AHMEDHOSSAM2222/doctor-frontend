import { useEffect, useState } from 'react';
import { MAX_FILES_PER_UPLOAD, MAX_UPLOAD_MB } from '../api.js';
import { formatDate, formatSize } from '../format.js';

export function PdfIcon() {
  return (
    <svg className="pdf-icon" width="28" height="34" viewBox="0 0 28 34" aria-hidden="true" focusable="false">
      <path d="M3 1h15l9 9v20a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V4a3 3 0 0 1 3-3z" fill="#fcebe9" />
      <path d="M18 1v6a3 3 0 0 0 3 3h6" fill="none" stroke="#b42318" strokeWidth="1.4" />
      <path
        d="M3 1h15l9 9v20a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V4a3 3 0 0 1 3-3z"
        fill="none"
        stroke="#b42318"
        strokeWidth="1.4"
      />
      <text
        x="13.5"
        y="25"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="700"
        fill="#b42318"
        fontFamily="system-ui, sans-serif"
      >
        PDF
      </text>
    </svg>
  );
}

/**
 * PDFs in a patient's file. Pass `getHref(doc)` for plain links (patient page)
 * or `onOpen(doc)` for a button (admin, which needs to send its login token).
 * `tagFor(doc)` can return a short label shown under the title, e.g. who added it.
 */
export function DocumentList({ documents, locale = 'en-GB', getHref, onOpen, onLinkClick, renderActions, tagFor }) {
  return (
    <ul className="doc-list">
      {documents.map((doc) => (
        <li key={doc.id} className="doc-item">
          <PdfIcon />
          <div className="doc-text">
            {getHref ? (
              <a
                className="doc-title"
                href={getHref(doc)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => onLinkClick?.(event, doc)}
              >
                <span dir="auto">{doc.title}</span>
              </a>
            ) : (
              <button type="button" className="doc-title doc-title-button" onClick={() => onOpen(doc)}>
                <span dir="auto">{doc.title}</span>
              </button>
            )}
            <span className="doc-meta">
              <time dateTime={doc.createdAt}>{formatDate(doc.createdAt, locale)}</time>
              <span>{formatSize(doc.size, locale)}</span>
              {tagFor?.(doc) && <span className="doc-tag">{tagFor(doc)}</span>}
            </span>
          </div>
          {renderActions?.(doc)}
        </li>
      ))}
    </ul>
  );
}

const isPdfFile = (file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
let nextKey = 0;

/** Labels for the staff dashboard; the patient page passes its own (Arabic or English). */
export const STAFF_PICKER_LABELS = {
  choose: 'Choose PDF files',
  hint: (mb) => `or drag them here. Up to ${mb} MB each.`,
  title: 'Title patients see',
  remove: 'Remove',
  removeFile: (name) => `Remove ${name}`,
  queue: 'PDFs ready to upload',
  notPdf: (name) => `“${name}” is not a PDF.`,
  tooLarge: (name, mb) => `“${name}” is larger than ${mb} MB.`,
  tooMany: (max) => `Add up to ${max} PDFs at a time. Upload these, then add the rest.`,
};

/**
 * Lets the user pick PDFs (button or drag and drop) and give each one a title.
 * `items` is [{ key, file, title }].
 */
export function PdfPicker({ items, onChange, disabled = false, labels = STAFF_PICKER_LABELS, locale = 'en-GB' }) {
  const [problems, setProblems] = useState([]);
  const [dragging, setDragging] = useState(false);

  // Once the queue is emptied (uploaded or removed), earlier warnings no longer apply.
  useEffect(() => {
    if (items.length === 0) setProblems([]);
  }, [items.length]);

  const addFiles = (fileList) => {
    const issues = [];
    let accepted = [];
    for (const file of Array.from(fileList)) {
      if (!isPdfFile(file)) issues.push(labels.notPdf(file.name));
      else if (file.size > MAX_UPLOAD_MB * 1024 * 1024) issues.push(labels.tooLarge(file.name, MAX_UPLOAD_MB));
      else accepted.push({ key: `pdf-${(nextKey += 1)}`, file, title: file.name.replace(/\.pdf$/i, '') });
    }
    const room = MAX_FILES_PER_UPLOAD - items.length;
    if (accepted.length > room) {
      issues.push(labels.tooMany(MAX_FILES_PER_UPLOAD));
      accepted = accepted.slice(0, Math.max(room, 0));
    }
    setProblems(issues);
    if (accepted.length) onChange([...items, ...accepted]);
  };

  const updateTitle = (key, title) => onChange(items.map((item) => (item.key === key ? { ...item, title } : item)));
  const remove = (key) => onChange(items.filter((item) => item.key !== key));

  return (
    <div className="pdf-picker">
      <label
        className={`dropzone${dragging ? ' is-dragging' : ''}${disabled ? ' is-disabled' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) addFiles(event.dataTransfer.files);
        }}
      >
        <input
          type="file"
          className="visually-hidden"
          accept="application/pdf,.pdf"
          multiple
          disabled={disabled}
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = '';
          }}
        />
        <PdfIcon />
        <span className="dropzone-text">
          <span className="dropzone-title">{labels.choose}</span>
          <span className="dropzone-hint">{labels.hint(MAX_UPLOAD_MB)}</span>
        </span>
      </label>

      {problems.length > 0 && (
        <div className="form-error" role="alert">
          {problems.map((problem) => (
            <p key={problem}>{problem}</p>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <ul className="pdf-queue" aria-label={labels.queue}>
          {items.map((item) => (
            <li key={item.key} className="pdf-queue-item">
              <div className="field pdf-queue-field">
                <label className="field-label" htmlFor={item.key}>
                  {labels.title}
                </label>
                <input
                  id={item.key}
                  className="input"
                  dir="auto"
                  maxLength={200}
                  value={item.title}
                  disabled={disabled}
                  onChange={(event) => updateTitle(item.key, event.target.value)}
                />
                <span className="field-hint">
                  <span dir="auto">{item.file.name}</span>, {formatSize(item.file.size, locale)}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-danger btn-small"
                onClick={() => remove(item.key)}
                disabled={disabled}
                aria-label={labels.removeFile(item.file.name)}
              >
                {labels.remove}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

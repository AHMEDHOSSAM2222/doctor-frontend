import { useEffect, useState } from 'react';
import { api, CLINIC_NAME } from '../../api.js';
import { Field } from '../../components/Field.jsx';

export default function Account() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = `Account – ${CLINIC_NAME}`;
  }, []);

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (form.next !== form.confirm) {
      setStatus({ type: 'error', message: 'The new passwords do not match.' });
      return;
    }
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      await api.changePassword(form.current, form.next);
      setForm({ current: '', next: '', confirm: '' });
      setStatus({ type: 'success', message: 'Password changed.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>Account</h1>
      </div>
      <form className="form-card form-narrow" onSubmit={submit}>
        <h2 className="section-title">Change password</h2>
        <Field label="Current password">
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            required
            value={form.current}
            onChange={update('current')}
          />
        </Field>
        <Field label="New password" hint="At least 8 characters.">
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={form.next}
            onChange={update('next')}
          />
        </Field>
        <Field label="Repeat new password">
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            required
            value={form.confirm}
            onChange={update('confirm')}
          />
        </Field>
        {status.message && (
          <p className={status.type === 'error' ? 'form-error' : 'form-success'} role="status">
            {status.message}
          </p>
        )}
        <div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Changing…' : 'Change password'}
          </button>
        </div>
      </form>
    </>
  );
}

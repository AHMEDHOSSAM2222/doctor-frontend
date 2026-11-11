import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api, CLINIC_NAME, getToken, setToken } from '../../api.js';
import { Folder } from '../../components/PatientFile.jsx';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = `Staff login – ${CLINIC_NAME}`;
  }, []);

  if (getToken()) return <Navigate to="/admin" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { token } = await api.login(username.trim(), password);
      setToken(token);
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <Folder label={CLINIC_NAME}>
          <div>
            <h1 className="login-title">Staff login</h1>
            <p className="muted">Log in to manage patient files and print the QR code.</p>
          </div>
          <form className="stack" onSubmit={submit}>
            <label className="field">
              <span className="field-label">Username</span>
              <input
                className="input"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">Password</span>
              <input
                className="input"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        </Folder>
      </div>
    </div>
  );
}

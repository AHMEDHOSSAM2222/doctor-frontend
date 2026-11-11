const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const TOKEN_KEY = 'doctor-admin-token';

export const CLINIC_NAME = import.meta.env.VITE_CLINIC_NAME || 'Clinic';

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage unavailable (private mode): the session lasts until the page is closed.
  }
}

/** Calls the backend API and returns the parsed JSON body, or throws an ApiError. */
export async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  const token = auth ? getToken() : null;
  if (token) headers.authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check the connection and try again.', 0, 'OFFLINE');
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (res.status === 401 && auth) {
    setToken(null);
    window.dispatchEvent(new Event('admin:logout'));
  }
  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status, data?.code);
  }
  return data;
}

export const api = {
  login: (username, password) =>
    request('/api/auth/login', { method: 'POST', body: { username, password }, auth: false }),
  me: () => request('/api/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    request('/api/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } }),

  listPatients: ({ search = '', offset = 0, limit = 50 } = {}) =>
    request(`/api/patients?${new URLSearchParams({ search, offset, limit })}`),
  nextFileNumber: () => request('/api/patients/next-file-number'),
  getPatient: (id) => request(`/api/patients/${id}`),
  createPatient: (patient) => request('/api/patients', { method: 'POST', body: patient }),
  updatePatient: (id, patient) => request(`/api/patients/${id}`, { method: 'PUT', body: patient }),
  deletePatient: (id) => request(`/api/patients/${id}`, { method: 'DELETE' }),

  addVisit: (patientId, visit) => request(`/api/patients/${patientId}/visits`, { method: 'POST', body: visit }),
  updateVisit: (patientId, visitId, visit) =>
    request(`/api/patients/${patientId}/visits/${visitId}`, { method: 'PUT', body: visit }),
  deleteVisit: (patientId, visitId) => request(`/api/patients/${patientId}/visits/${visitId}`, { method: 'DELETE' }),

  lookupFile: (fileNumber, phone) =>
    request('/api/public/lookup', { method: 'POST', body: { fileNumber, phone }, auth: false }),
};

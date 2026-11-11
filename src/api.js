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

/**
 * Calls the backend API and returns the parsed JSON body (or a Blob with `blob: true`),
 * or throws an ApiError. A FormData body is sent as a multipart upload.
 */
export async function request(path, { method = 'GET', body, auth = true, blob = false } = {}) {
  const headers = {};
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) headers['content-type'] = 'application/json';
  const token = auth ? getToken() : null;
  if (token) headers.authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check the connection and try again.', 0, 'OFFLINE');
  }

  if (res.status === 401 && auth) {
    setToken(null);
    window.dispatchEvent(new Event('admin:logout'));
  }
  if (blob && res.ok) return res.blob();

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status, data?.code);
  }
  return data;
}

export const MAX_UPLOAD_MB = Number(import.meta.env.VITE_MAX_UPLOAD_MB) || 20;
export const MAX_FILES_PER_UPLOAD = 10;

/**
 * Link a patient taps to open one of their PDFs (valid until the lookup's access token expires).
 * With `download: true` the PDF is saved to the device instead of opened.
 */
export const publicDocumentUrl = (docId, token, { download = false } = {}) =>
  `${API_URL}/api/public/documents/${docId}?token=${encodeURIComponent(token)}${download ? '&download=1' : ''}`;

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

  /** items: [{ file: File, title: string }] */
  uploadDocuments: (patientId, items) => {
    const form = new FormData();
    for (const { file, title } of items) {
      form.append('files', file, file.name);
      form.append('titles', title);
    }
    return request(`/api/patients/${patientId}/documents`, { method: 'POST', body: form });
  },
  documentBlob: (patientId, docId) => request(`/api/patients/${patientId}/documents/${docId}`, { blob: true }),
  deleteDocument: (patientId, docId) => request(`/api/patients/${patientId}/documents/${docId}`, { method: 'DELETE' }),

  lookupFile: (fileNumber, phone) =>
    request('/api/public/lookup', { method: 'POST', body: { fileNumber, phone }, auth: false }),
};

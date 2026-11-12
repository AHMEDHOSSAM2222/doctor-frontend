// In-browser stand-in for doctor-backend, used only by the demo build (VITE_DEMO=true).
// It answers the same /api routes with the same rules and messages, using sample data kept
// in this browser's localStorage. Uploaded PDFs are kept in memory until the page reloads.
import { normalizeDigits } from '../format.js';
import { makeSamplePdf } from './samplePdf.js';

export const DEMO_LOGIN = { username: 'admin', password: 'demo1234' };
export const DEMO_PATIENT = { fileNumber: '1001', phone: '01012345678' };

const STORE_KEY = 'clinic-demo-state-v1';
const ADMIN_TOKEN = 'demo-admin-session';
const ACCESS_MINUTES = 30;
const MAX_UPLOAD_MB = 20;
const CLINIC_NAME = import.meta.env.VITE_CLINIC_NAME || 'Demo Clinic';

// ---------- dates ----------
const pad = (n) => String(n).padStart(2, '0');
const isoDate = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const daysAgo = (n) => isoDate(new Date(Date.now() - n * 86_400_000));
const timestamp = (d = new Date()) =>
  `${isoDate(d)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
const timestampDaysAgo = (n, hour = 10) => `${daysAgo(n)} ${pad(hour)}:20:00`;

// ---------- sample data ----------
function seed() {
  const patients = [
    {
      id: 1,
      fileNumber: '1001',
      fullName: 'Mona Ali Hassan',
      phone: '01012345678',
      dateOfBirth: '1990-05-01',
      gender: 'female',
      bloodType: 'O+',
      allergies: 'Penicillin',
      chronicConditions: 'Type 2 diabetes, on metformin since 2022',
      notes: 'Check blood sugar every morning before breakfast and bring the log to each visit.',
      createdAt: timestampDaysAgo(240),
      updatedAt: timestampDaysAgo(3),
    },
    {
      id: 2,
      fileNumber: '1002',
      fullName: 'Youssef Ibrahim',
      phone: '01122334455',
      dateOfBirth: '1978-11-20',
      gender: 'male',
      bloodType: 'A+',
      allergies: null,
      chronicConditions: 'High blood pressure',
      notes: 'Low-salt diet. Measure blood pressure at home twice a week.',
      createdAt: timestampDaysAgo(180),
      updatedAt: timestampDaysAgo(12),
    },
    {
      id: 3,
      fileNumber: '1003',
      fullName: 'Salma Mostafa',
      phone: '01233445566',
      dateOfBirth: '2001-02-14',
      gender: 'female',
      bloodType: 'B+',
      allergies: 'Ibuprofen',
      chronicConditions: null,
      notes: null,
      createdAt: timestampDaysAgo(60),
      updatedAt: timestampDaysAgo(20),
    },
    {
      id: 4,
      fileNumber: '1004',
      fullName: 'Karim Adel',
      phone: '01555667788',
      dateOfBirth: '1965-07-03',
      gender: 'male',
      bloodType: 'AB-',
      allergies: null,
      chronicConditions: 'Asthma',
      notes: 'Uses an inhaler when needed.',
      createdAt: timestampDaysAgo(400),
      updatedAt: timestampDaysAgo(45),
    },
  ];
  const visits = [
    {
      id: 1,
      patientId: 1,
      visitDate: daysAgo(3),
      diagnosis: 'Diabetes follow-up',
      prescription: 'Continue metformin 500 mg twice daily\nAtorvastatin 10 mg at night',
      notes: 'HbA1c 6.8%. Next check in 3 months.',
    },
    {
      id: 2,
      patientId: 1,
      visitDate: daysAgo(95),
      diagnosis: 'Seasonal flu',
      prescription: 'Paracetamol 500 mg every 8 hours for 5 days\nPlenty of fluids and rest',
      notes: null,
    },
    {
      id: 3,
      patientId: 1,
      visitDate: daysAgo(200),
      diagnosis: 'Routine check-up',
      prescription: null,
      notes: 'Blood pressure 120/80. Weight stable.',
    },
    {
      id: 4,
      patientId: 2,
      visitDate: daysAgo(12),
      diagnosis: 'Blood pressure review',
      prescription: 'Amlodipine 5 mg once daily',
      notes: 'Reading today 135/85.',
    },
    {
      id: 5,
      patientId: 3,
      visitDate: daysAgo(20),
      diagnosis: 'Tonsillitis',
      prescription: 'Amoxicillin 500 mg three times daily for 7 days',
      notes: null,
    },
    {
      id: 6,
      patientId: 4,
      visitDate: daysAgo(45),
      diagnosis: 'Asthma review',
      prescription: 'Salbutamol inhaler when needed',
      notes: 'Peak flow normal.',
    },
  ];
  const documents = [
    { id: 1, patientId: 1, title: 'Blood test results', sample: 'blood', createdAt: timestampDaysAgo(3, 11) },
    { id: 2, patientId: 1, title: 'Prescription', sample: 'rx', createdAt: timestampDaysAgo(3, 12) },
    { id: 3, patientId: 1, title: 'Chest X-ray report', sample: 'xray', createdAt: timestampDaysAgo(95, 9) },
    { id: 4, patientId: 2, title: 'ECG report', sample: 'ecg', createdAt: timestampDaysAgo(12, 10) },
  ].map((doc) => ({ ...doc, originalName: `${doc.title}.pdf`, size: 0 }));

  return { password: DEMO_LOGIN.password, nextId: { patient: 5, visit: 7, document: 5 }, patients, visits, documents };
}

// ---------- state ----------
let state = load();
const uploadedFiles = new Map(); // document id -> Blob (kept until the page reloads)

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (saved?.patients) return saved;
  } catch {
    // storage unavailable: start from the sample data
  }
  return seed();
}

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable: the demo still works until the page is closed
  }
}

/** Puts the sample data back and logs out. */
export function resetDemo() {
  state = seed();
  uploadedFiles.clear();
  try {
    localStorage.removeItem(STORE_KEY);
    localStorage.removeItem('doctor-admin-token');
  } catch {
    // ignore
  }
}

// ---------- helpers mirroring the backend ----------
class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const phoneDigits = (value) => normalizeDigits(value).replace(/\D/g, '');
function phonesMatch(a, b) {
  const x = phoneDigits(a);
  const y = phoneDigits(b);
  if (x.length < 7 || y.length < 7) return false;
  const [shorter, longer] = x.length <= y.length ? [x, y] : [y, x];
  return longer.endsWith(shorter);
}

const text = (value, field, { required = false, max = 5000 } = {}) => {
  const str = value == null ? '' : String(value).trim();
  if (required && !str) throw new HttpError(400, `${field} is required`);
  if (str.length > max) throw new HttpError(400, `${field} is too long (max ${max} characters)`);
  return str;
};
const date = (value, field) => {
  const str = text(value, field, { max: 10 });
  const real = /^\d{4}-\d{2}-\d{2}$/.test(str) && new Date(`${str}T00:00:00Z`).toISOString().slice(0, 10) === str;
  if (str && !real) throw new HttpError(400, `${field} must be a date in YYYY-MM-DD format`);
  return str || null;
};

function parsePatient(body = {}) {
  const phone = text(body.phone, 'Phone', { required: true, max: 30 });
  if (phoneDigits(phone).length < 7) throw new HttpError(400, 'Phone must contain at least 7 digits');
  return {
    fileNumber: normalizeDigits(text(body.fileNumber, 'File number', { max: 50 })),
    fullName: text(body.fullName, 'Full name', { required: true, max: 200 }),
    phone,
    dateOfBirth: date(body.dateOfBirth, 'Date of birth'),
    gender: text(body.gender, 'Gender', { max: 10 }) || null,
    bloodType: text(body.bloodType, 'Blood type', { max: 5 }) || null,
    allergies: text(body.allergies, 'Allergies') || null,
    chronicConditions: text(body.chronicConditions, 'Chronic conditions') || null,
    notes: text(body.notes, 'Notes') || null,
  };
}

function parseVisit(body = {}) {
  const visit = {
    visitDate: date(body.visitDate, 'Visit date') || daysAgo(0),
    diagnosis: text(body.diagnosis, 'Diagnosis') || null,
    prescription: text(body.prescription, 'Prescription') || null,
    notes: text(body.notes, 'Notes') || null,
  };
  if (!visit.diagnosis && !visit.prescription && !visit.notes) {
    throw new HttpError(400, 'Enter a diagnosis, prescription or notes for the visit');
  }
  return visit;
}

const sameFileNumber = (a, b) => a.toLowerCase() === b.toLowerCase();
const nextFileNumber = () => {
  const numbers = state.patients
    .map((p) => p.fileNumber)
    .filter((n) => /^\d+$/.test(n))
    .map(Number);
  return String(Math.max(1000, ...numbers) + 1);
};
const byNewest = (key) => (a, b) => (a[key] < b[key] ? 1 : a[key] > b[key] ? -1 : b.id - a.id);

const findPatient = (id) => state.patients.find((p) => p.id === Number(id));
const patientVisits = (id) => state.visits.filter((v) => v.patientId === id).sort(byNewest('visitDate'));
const patientDocuments = (id) => state.documents.filter((d) => d.patientId === id).sort(byNewest('createdAt'));

/** The PDF for a document: an upload from this visit, a generated sample, or a stand-in page. */
export function documentBlob(doc) {
  if (uploadedFiles.has(doc.id)) return uploadedFiles.get(doc.id);
  const patient = findPatient(doc.patientId);
  return makeSamplePdf(doc.sample || 'placeholder', {
    patient,
    date: doc.createdAt.slice(0, 10),
    clinicName: CLINIC_NAME,
    title: doc.title,
  });
}

const sizeOf = (doc) => doc.size || documentBlob(doc).size;
const toDocument = (doc) => ({
  id: doc.id,
  title: doc.title,
  originalName: doc.originalName,
  size: sizeOf(doc),
  createdAt: doc.createdAt,
});
const toVisit = ({ patientId, ...visit }) => visit;
const withDetails = (patient) => ({
  ...patient,
  visits: patientVisits(patient.id).map(toVisit),
  documents: patientDocuments(patient.id).map(toDocument),
});
const touch = (patient) => {
  patient.updatedAt = timestamp();
};

// Patient access tokens carry the patient id and expiry time, like the backend's signed tokens.
const patientToken = (id) => `demo-patient.${id}.${Date.now() + ACCESS_MINUTES * 60_000}`;
/** The patient id for a valid, unexpired patient token, or null. */
export function patientIdFromToken(token) {
  const [prefix, id, expires] = String(token || '').split('.');
  if (prefix !== 'demo-patient' || Number(expires) <= Date.now()) return null;
  return findPatient(id) ? Number(id) : null;
}

/** A document the given patient token may open, or null. */
export function publicDocument(docId, token) {
  const patientId = patientIdFromToken(token);
  return state.documents.find((d) => d.id === Number(docId) && d.patientId === patientId) || null;
}

async function readPdfUploads(form) {
  const files = form.getAll('files');
  const titles = form.getAll('titles');
  if (!files.length) throw new HttpError(400, 'Choose at least one PDF file', 'NO_FILES');
  return Promise.all(
    files.map(async (file, index) => {
      if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
        throw new HttpError(413, `Each PDF must be ${MAX_UPLOAD_MB} MB or smaller`, 'TOO_LARGE');
      }
      if ((await file.slice(0, 5).text()) !== '%PDF-') {
        throw new HttpError(400, `"${file.name}" is not a PDF file`, 'NOT_PDF');
      }
      const title = String(titles[index] ?? '').trim() || file.name.replace(/\.pdf$/i, '');
      return { file, title: title.slice(0, 200) };
    }),
  );
}

// ---------- routes ----------
const routes = [];
const route = (method, pattern, handler, { admin = true } = {}) => {
  const keys = [];
  const regex = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, key) => (keys.push(key), '([^/]+)'))}$`);
  routes.push({ method, regex, keys, handler, admin });
};

route(
  'POST',
  '/api/auth/login',
  ({ body }) => {
    if (body?.username?.trim().toLowerCase() !== DEMO_LOGIN.username || body?.password !== state.password) {
      throw new HttpError(401, 'Wrong username or password');
    }
    return { token: ADMIN_TOKEN, admin: { username: DEMO_LOGIN.username } };
  },
  { admin: false },
);

route('GET', '/api/auth/me', () => ({ admin: { username: DEMO_LOGIN.username } }));

route('POST', '/api/auth/change-password', ({ body }) => {
  if (body?.currentPassword !== state.password) throw new HttpError(400, 'Current password is wrong');
  if (String(body?.newPassword || '').length < 8)
    throw new HttpError(400, 'New password must be at least 8 characters');
  state.password = body.newPassword;
  save();
  return { ok: true };
});

route('GET', '/api/patients', ({ query }) => {
  const search = (query.get('search') || '').trim().toLowerCase();
  const limit = Math.min(Math.max(Number(query.get('limit')) || 50, 1), 200);
  const offset = Math.max(Number(query.get('offset')) || 0, 0);
  const matches = state.patients
    .filter((p) => !search || [p.fileNumber, p.fullName, p.phone].some((v) => v.toLowerCase().includes(search)))
    .sort(byNewest('updatedAt'));
  const patients = matches.slice(offset, offset + limit).map((p) => {
    const visits = patientVisits(p.id);
    return { ...p, visitCount: visits.length, lastVisit: visits[0]?.visitDate ?? null };
  });
  return { patients, total: matches.length };
});

route('GET', '/api/patients/next-file-number', () => ({ fileNumber: nextFileNumber() }));

route('POST', '/api/patients', ({ body }) => {
  const data = parsePatient(body);
  if (!data.fileNumber) data.fileNumber = nextFileNumber();
  if (state.patients.some((p) => sameFileNumber(p.fileNumber, data.fileNumber))) {
    throw new HttpError(409, 'This file number is already used by another patient');
  }
  const now = timestamp();
  const patient = { id: state.nextId.patient++, ...data, createdAt: now, updatedAt: now };
  state.patients.push(patient);
  save();
  return { status: 201, data: { patient: withDetails(patient) } };
});

route('GET', '/api/patients/:id', ({ params }) => {
  const patient = findPatient(params.id);
  if (!patient) throw new HttpError(404, 'Patient not found');
  return { patient: withDetails(patient) };
});

route('PUT', '/api/patients/:id', ({ params, body }) => {
  const patient = findPatient(params.id);
  if (!patient) throw new HttpError(404, 'Patient not found');
  const data = parsePatient(body);
  if (!data.fileNumber) data.fileNumber = patient.fileNumber;
  if (state.patients.some((p) => p.id !== patient.id && sameFileNumber(p.fileNumber, data.fileNumber))) {
    throw new HttpError(409, 'This file number is already used by another patient');
  }
  Object.assign(patient, data);
  touch(patient);
  save();
  return { patient: withDetails(patient) };
});

route('DELETE', '/api/patients/:id', ({ params }) => {
  const patient = findPatient(params.id);
  if (!patient) throw new HttpError(404, 'Patient not found');
  state.patients = state.patients.filter((p) => p.id !== patient.id);
  state.visits = state.visits.filter((v) => v.patientId !== patient.id);
  state.documents = state.documents.filter((d) => d.patientId !== patient.id);
  save();
  return { status: 204 };
});

route('POST', '/api/patients/:id/visits', ({ params, body }) => {
  const patient = findPatient(params.id);
  if (!patient) throw new HttpError(404, 'Patient not found');
  state.visits.push({ id: state.nextId.visit++, patientId: patient.id, ...parseVisit(body) });
  touch(patient);
  save();
  return { status: 201, data: { patient: withDetails(patient) } };
});

route('PUT', '/api/patients/:id/visits/:visitId', ({ params, body }) => {
  const patient = findPatient(params.id);
  if (!patient) throw new HttpError(404, 'Patient not found');
  const visit = state.visits.find((v) => v.id === Number(params.visitId) && v.patientId === patient.id);
  if (!visit) throw new HttpError(404, 'Visit not found');
  Object.assign(visit, parseVisit(body));
  touch(patient);
  save();
  return { patient: withDetails(patient) };
});

route('DELETE', '/api/patients/:id/visits/:visitId', ({ params }) => {
  const patient = findPatient(params.id);
  if (!patient) throw new HttpError(404, 'Patient not found');
  const before = state.visits.length;
  state.visits = state.visits.filter((v) => !(v.id === Number(params.visitId) && v.patientId === patient.id));
  if (state.visits.length === before) throw new HttpError(404, 'Visit not found');
  save();
  return { patient: withDetails(patient) };
});

route('POST', '/api/patients/:id/documents', async ({ params, body }) => {
  const patient = findPatient(params.id);
  if (!patient) throw new HttpError(404, 'Patient not found');
  if (!(body instanceof FormData)) throw new HttpError(400, 'Choose at least one PDF file', 'NO_FILES');
  const uploads = await readPdfUploads(body);
  for (const { file, title } of uploads) {
    const id = state.nextId.document++;
    state.documents.push({
      id,
      patientId: patient.id,
      title,
      originalName: file.name,
      size: file.size,
      createdAt: timestamp(),
    });
    uploadedFiles.set(id, file);
  }
  touch(patient);
  save();
  return { status: 201, data: { patient: withDetails(patient) } };
});

route('GET', '/api/patients/:id/documents/:docId', ({ params }) => {
  const doc = state.documents.find((d) => d.id === Number(params.docId) && d.patientId === Number(params.id));
  if (!doc) throw new HttpError(404, 'Document not found');
  return { blob: documentBlob(doc) };
});

route('DELETE', '/api/patients/:id/documents/:docId', ({ params }) => {
  const patient = findPatient(params.id);
  if (!patient) throw new HttpError(404, 'Patient not found');
  const doc = state.documents.find((d) => d.id === Number(params.docId) && d.patientId === patient.id);
  if (!doc) throw new HttpError(404, 'Document not found');
  state.documents = state.documents.filter((d) => d.id !== doc.id);
  uploadedFiles.delete(doc.id);
  touch(patient);
  save();
  return { patient: withDetails(patient) };
});

route(
  'POST',
  '/api/public/lookup',
  ({ body }) => {
    const fileNumber = normalizeDigits(body?.fileNumber).trim();
    const phone = String(body?.phone || '').trim();
    if (!fileNumber || !phone) throw new HttpError(400, 'File number and phone number are required');
    const patient = state.patients.find((p) => sameFileNumber(p.fileNumber, fileNumber));
    if (!patient || !phonesMatch(patient.phone, phone)) {
      throw new HttpError(404, 'No file matches this file number and phone number');
    }
    // eslint-disable-next-line no-unused-vars
    const { id, phone: _phone, createdAt, ...publicPatient } = patient;
    const token = patientToken(patient.id);
    return {
      patient: publicPatient,
      visits: patientVisits(patient.id).map(({ id: _id, patientId, ...visit }) => visit),
      documents: patientDocuments(patient.id).map((d) => ({
        id: d.id,
        title: d.title,
        size: sizeOf(d),
        createdAt: d.createdAt,
      })),
      access: { token, expiresAt: new Date(Number(token.split('.')[2])).toISOString() },
    };
  },
  { admin: false },
);

route(
  'GET',
  '/api/public/documents/:docId',
  ({ params, query }) => {
    const doc = publicDocument(params.docId, query.get('token'));
    if (!doc) throw new HttpError(404, 'This document is no longer available.');
    return { blob: documentBlob(doc) };
  },
  { admin: false },
);

/**
 * Answers one API call. Returns { status, data } for JSON, { status: 204 } for no content,
 * or { status: 200, blob } for a PDF.
 */
export async function handleRequest({ method, path, query, body, authorization }) {
  for (const r of routes) {
    const match = r.method === method && path.match(r.regex);
    if (!match) continue;
    if (r.admin && authorization !== `Bearer ${ADMIN_TOKEN}`) {
      return { status: 401, data: { error: 'Session expired, please log in again' } };
    }
    const params = Object.fromEntries(r.keys.map((key, i) => [key, decodeURIComponent(match[i + 1])]));
    try {
      const result = await r.handler({ params, query, body });
      if (result?.blob) return { status: 200, blob: result.blob };
      if (result?.status) return { status: result.status, data: result.data ?? null };
      return { status: 200, data: result };
    } catch (err) {
      if (err instanceof HttpError) return { status: err.status, data: { error: err.message, code: err.code } };
      console.error(err);
      return { status: 500, data: { error: 'Something went wrong' } };
    }
  }
  return { status: 404, data: { error: 'Not found' } };
}

import { lazy, Suspense } from 'react';
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import Account from './pages/admin/Account.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import Login from './pages/admin/Login.jsx';
import PatientDetail from './pages/admin/PatientDetail.jsx';
import PatientEditor from './pages/admin/PatientEditor.jsx';
import PatientList from './pages/admin/PatientList.jsx';
import QrCodePage from './pages/admin/QrCodePage.jsx';
import PatientLookup from './pages/PatientLookup.jsx';

const DEMO = import.meta.env.VITE_DEMO === 'true';
const DemoFrame = DEMO ? lazy(() => import('./demo/DemoFrame.jsx')) : null;

/**
 * The demo is published as a single page that cannot use real URL paths,
 * so it keeps the route in memory; "#patient" opens the patient page directly.
 */
function AppRouter({ children }) {
  if (!DEMO) return <BrowserRouter>{children}</BrowserRouter>;
  const start = window.location.hash === '#patient' ? '/patient' : '/admin';
  return (
    <MemoryRouter initialEntries={[start]}>
      <Suspense fallback={null}>
        <DemoFrame />
      </Suspense>
      {children}
    </MemoryRouter>
  );
}

export default function App() {
  return (
    <AppRouter>
      <Routes>
        {/* The system starts in the staff dashboard */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<PatientList />} />
          <Route path="patients/new" element={<PatientEditor />} />
          <Route path="patients/:id" element={<PatientDetail />} />
          <Route path="patients/:id/edit" element={<PatientEditor />} />
          <Route path="qr" element={<QrCodePage />} />
          <Route path="account" element={<Account />} />
        </Route>

        {/* Public page the QR code opens: patients enter their file number and phone number */}
        <Route path="/patient" element={<PatientLookup />} />

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AppRouter>
  );
}

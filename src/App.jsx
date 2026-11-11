import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Account from './pages/admin/Account.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import Login from './pages/admin/Login.jsx';
import PatientDetail from './pages/admin/PatientDetail.jsx';
import PatientEditor from './pages/admin/PatientEditor.jsx';
import PatientList from './pages/admin/PatientList.jsx';
import QrCodePage from './pages/admin/QrCodePage.jsx';
import PatientLookup from './pages/PatientLookup.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public page the QR code opens */}
        <Route path="/" element={<PatientLookup />} />

        {/* Staff dashboard */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<PatientList />} />
          <Route path="patients/new" element={<PatientEditor />} />
          <Route path="patients/:id" element={<PatientDetail />} />
          <Route path="patients/:id/edit" element={<PatientEditor />} />
          <Route path="qr" element={<QrCodePage />} />
          <Route path="account" element={<Account />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

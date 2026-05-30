import { Routes, Route, Navigate } from 'react-router-dom';
import AuditMobilePage from '../pages/AuditMobile/index.jsx';
import NfcMobilePage from '../pages/NfcMobile/index.jsx';
import PlatformPage from '../pages/Platform/index.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route index element={<PlatformPage />} />
      <Route path="/nfc-mobile" element={<NfcMobilePage />} />
      <Route path="/nfc" element={<NfcMobilePage />} />
      <Route path="/audit-mobile" element={<AuditMobilePage />} />
      <Route path="/auditoria" element={<AuditMobilePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

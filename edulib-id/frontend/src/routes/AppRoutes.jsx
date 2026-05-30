import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout.jsx';

import HomePage from '../pages/Home/index.jsx';
import StudentRegisterPage from '../pages/StudentRegister/index.jsx';
import EntryPage from '../pages/Entry/index.jsx';
import ExitPage from '../pages/Exit/index.jsx';
import LoanPage from '../pages/Loan/index.jsx';
import ReturnBookPage from '../pages/ReturnBook/index.jsx';
import AssistantPage from '../pages/Assistant/index.jsx';
import DashboardPage from '../pages/Dashboard/index.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="students/register" element={<StudentRegisterPage />} />
        <Route path="entry" element={<EntryPage />} />
        <Route path="exit" element={<ExitPage />} />
        <Route path="loan" element={<LoanPage />} />
        <Route path="return" element={<ReturnBookPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

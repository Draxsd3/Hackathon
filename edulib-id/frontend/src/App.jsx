import AppRoutes from './routes/AppRoutes.jsx';
import { ToastProvider } from './components/common/Toast.jsx';

export default function App() {
  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  );
}

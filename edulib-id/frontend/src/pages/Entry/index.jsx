import { LogIn } from 'lucide-react';
import { SessionPage } from '../_shared/SessionPage.jsx';

export default function EntryPage() {
  return (
    <SessionPage
      type="entry"
      title="Registrar entrada"
      subtitle="Identifique o aluno por busca, QR Code ou face."
      icon={LogIn}
      ctaLabel="Registrar entrada"
      successLabel="Entrada registrada"
    />
  );
}

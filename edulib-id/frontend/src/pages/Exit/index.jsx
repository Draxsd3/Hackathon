import { LogOut } from 'lucide-react';
import { SessionPage } from '../_shared/SessionPage.jsx';

export default function ExitPage() {
  return (
    <SessionPage
      type="exit"
      title="Registrar saida"
      subtitle="Identifique o aluno e finalize a visita a biblioteca."
      icon={LogOut}
      ctaLabel="Registrar saida"
      successLabel="Saida registrada"
    />
  );
}

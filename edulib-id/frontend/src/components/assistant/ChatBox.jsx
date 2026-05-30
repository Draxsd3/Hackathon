import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { MessageBubble } from './MessageBubble.jsx';
import { Button } from '../common/Button.jsx';

const SUGGESTIONS = [
  'Quais sao os horarios da biblioteca?',
  'Por quantos dias posso ficar com um livro?',
  'Como devolvo um livro?',
  'Como cadastro um aluno novo?',
];

export function ChatBox({ messages, onSend, loading, suggestions = SUGGESTIONS }) {
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submit = (e) => {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || loading) return;
    onSend(text);
    setInput('');
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="rounded-lg bg-white p-4 text-sm text-slate-500 shadow-sm">
            Ola! Sou o assistente da biblioteca. Posso ajudar com regras de emprestimo, horarios,
            cadastro de alunos e mais. Pergunte algo:
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={endRef} />
      </div>

      {messages.length === 0 && (
        <div className="border-t border-slate-200 bg-white px-4 py-2">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSend(s)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte algo..."
          className="input flex-1"
          disabled={loading}
        />
        <Button type="submit" icon={Send} loading={loading} disabled={!input.trim()}>
          Enviar
        </Button>
      </form>
    </div>
  );
}

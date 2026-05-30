import { useState } from 'react';
import { Bot } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { ChatBox } from '../../components/assistant/ChatBox.jsx';
import { askAssistant } from './knowledge.js';

export default function AssistantPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const send = async (text) => {
    const userMsg = {
      id: `m-${Date.now()}-u`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    setTimeout(() => {
      const reply = askAssistant(text);
      const botMsg = {
        id: `m-${Date.now()}-a`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      };
      setMessages((m) => [...m, botMsg]);
      setLoading(false);
    }, 350);
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col">
      <PageHeader
        icon={Bot}
        title="Assistente da biblioteca"
        subtitle="Tire duvidas sobre regras, horarios, emprestimos e fluxos do Edulib-ID."
      />
      <div className="flex-1">
        <ChatBox messages={messages} onSend={send} loading={loading} />
      </div>
    </div>
  );
}

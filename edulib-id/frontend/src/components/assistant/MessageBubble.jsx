import { Bot, User } from 'lucide-react';
import { formatTime } from '../../utils/dateUtils.js';

export function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <span
        className={`flex h-8 w-8 flex-none items-center justify-center rounded-full ${
          isUser ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-700'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </span>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
          isUser ? 'bg-primary-600 text-white' : 'bg-white text-slate-800'
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        <p className={`mt-1 text-[10px] ${isUser ? 'text-primary-100' : 'text-slate-400'}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

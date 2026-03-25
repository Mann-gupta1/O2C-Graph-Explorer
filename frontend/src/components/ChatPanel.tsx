import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Code, Bot } from 'lucide-react';
import type { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (query: string) => void;
}

function BotAvatar() {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
      style={{ background: '#111827' }}>
      <Bot className="w-4 h-4 text-white" />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 mb-4 animate-fade-in-up">
      <BotAvatar />
      <div>
        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          Bot <span className="font-normal" style={{ color: 'var(--text-muted)' }}>Graph Agent</span>
        </p>
        <div className="flex items-center gap-1.5 py-2">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: 'var(--text-muted)',
                animation: `dot-pulse 1.4s infinite ease-in-out ${i * 0.16}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const [showSql, setShowSql] = useState(false);
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex items-start gap-2.5 mb-4 justify-end animate-fade-in-up">
        <div>
          <p className="text-xs font-medium mb-1 text-right" style={{ color: 'var(--text-primary)' }}>
            You
          </p>
          <div className="rounded-2xl rounded-tr-md px-4 py-2.5 text-[13px] leading-relaxed max-w-[300px]"
            style={{
              background: 'var(--user-bubble)',
              color: '#fff',
            }}>
            <p>{message.content}</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--bg-card)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Y</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 mb-4 animate-fade-in-up">
      <BotAvatar />
      <div className="max-w-[320px]">
        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          Bot <span className="font-normal" style={{ color: 'var(--text-muted)' }}>Graph Agent</span>
        </p>
        <div className="text-[13px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_strong]:font-semibold [&_code]:text-indigo-600 [&_code]:bg-indigo-50 [&_code]:px-1 [&_code]:rounded [&_code]:text-xs">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>

        {message.sql && (
          <div className="mt-2">
            <button
              onClick={() => setShowSql(!showSql)}
              className="flex items-center gap-1 text-[11px] font-medium cursor-pointer transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              <Code className="w-3 h-3" />
              {showSql ? 'Hide' : 'View'} SQL
              {showSql ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showSql && (
              <pre className="mt-1.5 p-2.5 rounded-lg text-[11px] overflow-x-auto border"
                style={{
                  background: '#f8f9fb',
                  color: '#4338ca',
                  fontFamily: "'JetBrains Mono', monospace",
                  borderColor: 'var(--border-color)',
                }}>
                {message.sql}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPanel({ messages, isLoading, onSendMessage }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = input.trim();
    if (!query || isLoading) return;
    setInput('');
    onSendMessage(query);
  };

  return (
    <div className="flex flex-col h-full border-l"
      style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>

      <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Chat with Graph
        </h2>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          Order to Cash
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--bot-green)' }} />
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Bot is awaiting instructions
          </span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 border"
            style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Analyze anything"
              disabled={isLoading}
              className="flex-1 bg-transparent outline-none text-[13px]"
              style={{ color: 'var(--text-primary)' }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer disabled:opacity-30 active:scale-95"
              style={{
                background: input.trim() ? 'var(--accent)' : 'var(--bg-card)',
                color: input.trim() ? '#fff' : 'var(--text-muted)',
              }}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, ChevronUp, Code, Loader2 } from 'lucide-react';
import type { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (query: string) => void;
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const [showSql, setShowSql] = useState(false);
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className="max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
        style={{
          background: isUser ? 'var(--accent)' : 'var(--bg-card)',
          color: isUser ? '#fff' : 'var(--text-primary)',
          borderBottomRightRadius: isUser ? '4px' : undefined,
          borderBottomLeftRadius: !isUser ? '4px' : undefined,
        }}
      >
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {message.sql && (
          <div className="mt-2 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => setShowSql(!showSql)}
              className="flex items-center gap-1.5 text-xs cursor-pointer transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Code className="w-3 h-3" />
              {showSql ? 'Hide' : 'View'} SQL
              {showSql ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showSql && (
              <pre className="mt-2 p-2.5 rounded-lg text-xs overflow-x-auto"
                style={{ background: 'rgba(0,0,0,0.3)', color: '#a5b4fc' }}>
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

  const suggestions = [
    "Which products have the most billing documents?",
    "Show sales orders with incomplete flows",
    "Trace the flow of billing document 90504248",
  ];

  return (
    <div className="flex flex-col h-full border-l"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Query Assistant
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Ask questions about the O2C dataset
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="rounded-2xl px-4 py-3 flex items-center gap-2"
              style={{ background: 'var(--bg-card)' }}>
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--accent)' }} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Analyzing...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />

        {messages.length <= 1 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Try these:
            </p>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => { setInput(s); inputRef.current?.focus(); }}
                className="block w-full text-left text-xs p-2.5 rounded-lg border transition-colors cursor-pointer hover:border-indigo-500/40"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}
        className="p-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about the dataset..."
            disabled={isLoading}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-500"
            style={{ color: 'var(--text-primary)' }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

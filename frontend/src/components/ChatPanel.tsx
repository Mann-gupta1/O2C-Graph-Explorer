import { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, ChevronUp, Code, Sparkles, MessageSquare, ShieldAlert, ArrowRight } from 'lucide-react';
import type { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (query: string) => void;
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3 animate-fade-in-up">
      <div className="glass rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2.5">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: 'var(--accent-light)',
                animation: `dot-pulse 1.4s infinite ease-in-out ${i * 0.16}s`,
              }}
            />
          ))}
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Querying database...
        </span>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const [showSql, setShowSql] = useState(false);
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-fade-in-up`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg flex items-center justify-center mr-2 mt-1 shrink-0"
          style={{
            background: message.isRejected
              ? 'rgba(239, 68, 68, 0.15)'
              : 'rgba(99, 102, 241, 0.15)',
          }}>
          {message.isRejected
            ? <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            : <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent-light)' }} />
          }
        </div>
      )}
      <div
        className="max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed"
        style={{
          background: isUser
            ? 'var(--gradient-1)'
            : message.isRejected
              ? 'rgba(239, 68, 68, 0.08)'
              : 'var(--bg-card)',
          color: isUser ? '#fff' : 'var(--text-primary)',
          borderBottomRightRadius: isUser ? '6px' : undefined,
          borderBottomLeftRadius: !isUser ? '6px' : undefined,
          border: !isUser
            ? message.isRejected
              ? '1px solid rgba(239, 68, 68, 0.15)'
              : '1px solid var(--border-color)'
            : undefined,
          boxShadow: isUser
            ? '0 4px 16px rgba(99, 102, 241, 0.25)'
            : '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
      >
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_strong]:text-white [&_code]:text-indigo-300 [&_code]:bg-indigo-500/10 [&_code]:px-1 [&_code]:rounded">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {message.sql && (
          <div className="mt-2.5 pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => setShowSql(!showSql)}
              className="flex items-center gap-1.5 text-[11px] font-medium cursor-pointer transition-colors hover:text-indigo-300"
              style={{ color: 'var(--text-muted)' }}
            >
              <Code className="w-3 h-3" />
              {showSql ? 'Hide' : 'View'} SQL
              {showSql ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showSql && (
              <pre className="mt-2 p-3 rounded-lg text-[11px] overflow-x-auto animate-fade-in-up"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: '#a5b4fc',
                  fontFamily: "'JetBrains Mono', monospace",
                  border: '1px solid rgba(99, 102, 241, 0.1)',
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

  const suggestions = [
    { text: "Which products have the most billing documents?", icon: "chart" },
    { text: "Show sales orders with incomplete flows", icon: "flow" },
    { text: "What is the total billing amount per customer?", icon: "money" },
  ];

  const showWelcome = messages.length <= 1;

  return (
    <div className="flex flex-col h-full border-l"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>

      <div className="px-4 py-3 border-b flex items-center gap-3"
        style={{ borderColor: 'var(--border-color)', background: 'rgba(10, 10, 26, 0.6)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(99, 102, 241, 0.12)' }}>
          <MessageSquare className="w-4 h-4" style={{ color: 'var(--accent-light)' }} />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Query Assistant
          </h2>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            Natural language &rarr; SQL &rarr; Answers
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {showWelcome && (
          <div className="mb-5 animate-fade-in-up">
            <div className="glass rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-light)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  What can I help with?
                </span>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Ask questions about sales orders, deliveries, billing documents, payments, products, or customers. I'll translate your question into SQL and return data-backed answers.
              </p>
            </div>

            <p className="text-[10px] font-medium uppercase tracking-widest mb-2.5 px-1"
              style={{ color: 'var(--text-muted)' }}>
              Try these queries
            </p>
            <div className="space-y-1.5">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s.text); inputRef.current?.focus(); }}
                  className="group flex items-center gap-2.5 w-full text-left text-[11px] p-3 rounded-xl transition-all duration-200 cursor-pointer"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--border-glow)';
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.06)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = 'var(--bg-card)';
                  }}
                >
                  <span className="flex-1">{s.text}</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent-light)' }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.slice(showWelcome ? 1 : 0).map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit}
        className="p-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all duration-200 glow-border"
          style={{ background: 'var(--bg-card)' }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about the O2C dataset..."
            disabled={isLoading}
            className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-gray-600"
            style={{ color: 'var(--text-primary)' }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2 rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-20 active:scale-90"
            style={{
              background: input.trim() ? 'var(--gradient-1)' : 'rgba(99, 102, 241, 0.15)',
              color: '#fff',
              boxShadow: input.trim() ? '0 2px 12px rgba(99, 102, 241, 0.3)' : 'none',
            }}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from './types';

interface AISidebarChatProps {
  messages: ChatMessage[];
  loading: boolean;
  onSendMessage: (text: string) => void;
}

export default function AISidebarChat({ messages, loading, onSendMessage }: AISidebarChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="ai-sidebar">
      <div className="sidebar-header">AI Assistant</div>

      <div className="sidebar-messages">
        {messages.length === 0 && !loading && (
          <div className="sidebar-empty">
            I'll help you find and classify this food. Ask me anything during the process.
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`sidebar-msg ${msg.role}`}>
            <div
              className="sidebar-bubble"
              dangerouslySetInnerHTML={{
                __html: msg.content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'),
              }}
            />
          </div>
        ))}
        {loading && (
          <div className="sidebar-msg assistant">
            <div className="sidebar-bubble typing">
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="sidebar-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="sidebar-input"
          placeholder="Ask anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          autoFocus
        />
        <button type="submit" className="sidebar-send" disabled={!input.trim() || loading}>
          →
        </button>
      </form>

      <style jsx>{`
        .ai-sidebar {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }

        .sidebar-header {
          padding: 12px 16px;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-3, #484860);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          flex-shrink: 0;
        }

        .sidebar-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sidebar-empty {
          font-size: 13px;
          color: var(--text-3, #484860);
          line-height: 1.5;
          padding: 8px 4px;
        }

        .sidebar-msg {
          display: flex;
        }

        .sidebar-msg.user {
          justify-content: flex-end;
        }

        .sidebar-msg.assistant {
          justify-content: flex-start;
        }

        .sidebar-bubble {
          max-width: 90%;
          padding: 8px 12px;
          border-radius: 3px;
          font-size: 13px;
          line-height: 1.5;
        }

        .sidebar-msg.user .sidebar-bubble {
          background: var(--accent, #508898);
          color: #fff;
        }

        .sidebar-msg.assistant .sidebar-bubble {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .sidebar-bubble.typing {
          display: flex;
          gap: 4px;
          align-items: center;
          padding: 10px 14px;
        }

        .dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          animation: bounce 1.4s ease-in-out infinite;
        }

        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }

        .sidebar-form {
          display: flex;
          gap: 6px;
          padding: 10px 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          flex-shrink: 0;
        }

        .sidebar-input {
          flex: 1;
          padding: 8px 10px;
          background: var(--surface, #050505);
          border: 1px solid transparent;
          border-radius: 3px;
          box-shadow: none;
          color: var(--text-1, #e8e8f4);
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 13px;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .sidebar-input:focus {
          border-color: var(--accent, #508898);
        }

        .sidebar-input::placeholder {
          color: var(--text-3, #484860);
        }

        .sidebar-input:disabled {
          opacity: 0.5;
        }

        .sidebar-send {
          padding: 8px 12px;
          background: var(--accent, #508898);
          color: #fff;
          border: none;
          border-radius: 3px;
          font-size: 14px;
          cursor: pointer;
          transition: opacity 0.15s ease;
          flex-shrink: 0;
        }

        .sidebar-send:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .sidebar-send:hover:not(:disabled) {
          opacity: 0.85;
        }

        .sidebar-messages::-webkit-scrollbar { width: 3px; }
        .sidebar-messages::-webkit-scrollbar-track { background: transparent; }
        .sidebar-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
      `}</style>
    </div>
  );
}

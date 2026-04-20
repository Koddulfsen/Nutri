'use client';

/**
 * ChatPhase - AI chat UI for food query clarification
 *
 * Phase 1 of the Smart Add Food flow.
 * Shows a robot pineapple mascot, chat messages, and input.
 */

import { useState, useRef, useEffect } from 'react';
import type { ChatMessage, ClarifyResult } from './types';

interface ChatPhaseProps {
  messages: ChatMessage[];
  loading: boolean;
  clarifyResult: ClarifyResult | null;
  onSendMessage: (text: string) => void;
  onStartSearch: () => void;
}

export default function ChatPhase({
  messages,
  loading,
  clarifyResult,
  onSendMessage,
  onStartSearch,
}: ChatPhaseProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const showSearchButton = clarifyResult && !loading;

  return (
    <div className="chat-phase">
      {/* Robot Pineapple Mascot */}
      {messages.length === 0 && (
        <div className="mascot-area">
          <div className="mascot">
            <svg viewBox="0 0 80 100" width="80" height="100">
              {/* Pineapple body */}
              <ellipse cx="40" cy="62" rx="28" ry="32" fill="#f59e0b" />
              {/* Pineapple cross-hatch pattern */}
              <line x1="20" y1="45" x2="60" y2="80" stroke="#d97706" strokeWidth="1.5" opacity="0.4" />
              <line x1="15" y1="55" x2="55" y2="85" stroke="#d97706" strokeWidth="1.5" opacity="0.4" />
              <line x1="25" y1="35" x2="65" y2="75" stroke="#d97706" strokeWidth="1.5" opacity="0.4" />
              <line x1="60" y1="45" x2="20" y2="80" stroke="#d97706" strokeWidth="1.5" opacity="0.4" />
              <line x1="65" y1="55" x2="25" y2="85" stroke="#d97706" strokeWidth="1.5" opacity="0.4" />
              <line x1="55" y1="35" x2="15" y2="75" stroke="#d97706" strokeWidth="1.5" opacity="0.4" />
              {/* Robot antenna */}
              <line x1="40" y1="30" x2="40" y2="15" stroke="#a3a3a3" strokeWidth="2" />
              <circle cx="40" cy="12" r="4" fill="#d946ef" />
              {/* Crown leaves */}
              <path d="M30 32 Q25 18 32 8" stroke="#22c55e" strokeWidth="2.5" fill="none" />
              <path d="M40 30 Q40 14 42 5" stroke="#16a34a" strokeWidth="2.5" fill="none" />
              <path d="M50 32 Q55 18 48 8" stroke="#22c55e" strokeWidth="2.5" fill="none" />
              {/* Robot eyes */}
              <rect x="29" y="52" width="8" height="6" rx="1" fill="#1a1a1a" />
              <rect x="43" y="52" width="8" height="6" rx="1" fill="#1a1a1a" />
              <rect x="31" y="53" width="3" height="3" rx="0.5" fill="#22d3ee" />
              <rect x="45" y="53" width="3" height="3" rx="0.5" fill="#22d3ee" />
              {/* Smile */}
              <path d="M33 66 Q40 72 47 66" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <div className="mascot-greeting">What food are you looking for?</div>
        </div>
      )}

      {/* Chat Messages */}
      {messages.length > 0 && (
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg ${msg.role}`}>
              <div className="msg-bubble" dangerouslySetInnerHTML={{
                __html: msg.content
                  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
              }} />
            </div>
          ))}
          {loading && (
            <div className="chat-msg assistant">
              <div className="msg-bubble typing">
                <span className="dot" /><span className="dot" /><span className="dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Search Button */}
      {showSearchButton && (
        <button className="search-btn" onClick={onStartSearch}>
          Search {'\u{1F50D}'}
        </button>
      )}

      {/* Input */}
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          placeholder="Type a food name..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          autoFocus
        />
        <button type="submit" className="send-btn" disabled={!input.trim() || loading}>
          {'\u2192'}
        </button>
      </form>

      <style jsx>{`
        .chat-phase {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 300px;
        }

        .mascot-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          gap: 16px;
          padding: 32px 0;
        }

        .mascot {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .mascot-greeting {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 250px;
        }

        .chat-msg {
          display: flex;
        }

        .chat-msg.user {
          justify-content: flex-end;
        }

        .chat-msg.assistant {
          justify-content: flex-start;
        }

        .msg-bubble {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.5;
        }

        .chat-msg.user .msg-bubble {
          background: var(--purple, #d946ef);
          color: #fff;
          border-bottom-right-radius: 4px;
        }

        .chat-msg.assistant .msg-bubble {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.9);
          border-bottom-left-radius: 4px;
        }

        .msg-bubble.typing {
          display: flex;
          gap: 4px;
          padding: 12px 18px;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          animation: bounce 1.4s ease-in-out infinite;
        }

        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }

        .search-btn {
          margin: 12px auto;
          padding: 10px 32px;
          background: var(--purple, #d946ef);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .search-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(217, 70, 239, 0.4);
        }

        .chat-input-form {
          display: flex;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .chat-input {
          flex: 1;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .chat-input:focus {
          outline: none;
          border-color: var(--purple, #d946ef);
        }

        .chat-input:disabled {
          opacity: 0.5;
        }

        .send-btn {
          padding: 10px 16px;
          background: var(--purple, #d946ef);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .send-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .send-btn:hover:not(:disabled) {
          background: var(--purple-dark, #a21caf);
        }

        /* Scrollbar */
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-track { background: transparent; }
        .chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
}

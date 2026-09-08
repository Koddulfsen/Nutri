'use client';

import { useEffect, useRef, useState } from 'react';
import { apiUrl } from '@/lib/utils/base-path';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface FoodLogChatProps {
  date: string;
  onMealLogged?: () => void;
}

const GREETING: Message = {
  role: 'assistant',
  content:
    "Hey — what did you eat? Tell me what you had with as much detail as you can. I'll estimate the portions, propose a draft, and you can confirm or refine.",
};

export default function FoodLogChat({ date, onMealLogged }: FoodLogChatProps) {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    const newUser: Message = { role: 'user', content: text };
    const history = messages.filter((m) => m !== GREETING);
    const nextMessages = [...messages, newUser];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const res = await fetch(apiUrl('/api/ai/log-food'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history, date }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { response: string; loggedAny?: boolean };
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      if (data.loggedAny) onMealLogged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fc-root">
      <div className="fc-thread" ref={threadRef}>
        {messages.map((m, i) => (
          <div key={i} className={`fc-msg fc-msg-${m.role}`}>
            <div className="fc-bubble">{m.content}</div>
          </div>
        ))}
        {sending && (
          <div className="fc-msg fc-msg-assistant">
            <div className="fc-bubble fc-typing">…</div>
          </div>
        )}
        {error && <div className="fc-error">{error}</div>}
      </div>

      <div className="fc-input-wrap">
        <textarea
          ref={inputRef}
          className="fc-input"
          placeholder="Tell me what you ate…"
          value={input}
          rows={4}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          disabled={sending}
        />
        <button
          type="button"
          className="fc-send"
          onClick={send}
          disabled={sending || !input.trim()}
        >
          Send
        </button>
      </div>

      <style jsx>{`
        .fc-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 340px;
          background: transparent;
          color: #2e1a0e;
        }

        .fc-thread {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 14px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .fc-msg {
          display: flex;
        }
        .fc-msg-user {
          justify-content: flex-end;
        }
        .fc-msg-assistant {
          justify-content: flex-start;
        }
        .fc-bubble {
          max-width: 90%;
          padding: 10px 14px;
          border-radius: 10px;
          font-family: var(--font-body);
          font-size: 15px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .fc-msg-user .fc-bubble {
          background: #2e1a0e;
          border: 1px solid #2e1a0e;
          color: #fff5f1;
        }
        .fc-msg-assistant .fc-bubble {
          background: rgba(255, 255, 255, 0.62);
          border: 1px solid rgba(46, 26, 14, 0.16);
          color: #2e1a0e;
        }
        .fc-typing {
          color: rgba(46, 26, 14, 0.5);
          letter-spacing: 0.3em;
        }
        .fc-error {
          color: var(--warn);
          font-size: 12px;
          font-family: var(--font-mono);
          padding: 6px 10px;
          background: rgba(249, 115, 22, 0.06);
          border: 1px solid rgba(249, 115, 22, 0.2);
          border-radius: 3px;
        }

        .fc-input-wrap {
          padding: 12px 0 0;
          border-top: 1px solid rgba(46, 26, 14, 0.14);
          display: flex;
          gap: 8px;
          align-items: flex-end;
          background: transparent;
        }
        .fc-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.7);
          color: #2e1a0e;
          border: 1px solid rgba(46, 26, 14, 0.2);
          border-radius: 10px;
          padding: 9px 11px;
          font-family: var(--font-body);
          font-size: 15px;
          line-height: 1.45;
          resize: none;
          outline: none;
          transition: border-color 0.12s;
        }
        .fc-input:focus {
          border-color: #2e1a0e;
        }
        .fc-input::placeholder {
          color: rgba(46, 26, 14, 0.42);
        }
        .fc-input:disabled {
          opacity: 0.6;
        }
        .fc-send {
          background: #2e1a0e;
          color: #fff5f1;
          border: none;
          border-radius: 10px;
          padding: 10px 18px;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 4px 0 rgba(46, 26, 14, 0.4);
          transition: transform 0.08s, box-shadow 0.08s;
        }
        .fc-send:hover:not(:disabled) {
          transform: translateY(2px);
          box-shadow: 0 2px 0 rgba(46, 26, 14, 0.4);
        }
        .fc-send:active:not(:disabled) {
          transform: translateY(4px);
          box-shadow: 0 0 0 rgba(46, 26, 14, 0.4);
        }
        .fc-send:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

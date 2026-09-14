'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  arriveInChat,
  postChat,
  STATUS_INTERVAL_MS,
  takeHandoff,
  takePendingChat,
  WORKING_STATUSES,
  type ChatReply,
} from '@/lib/chat-handoff';

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

  // Grow the textarea with its content: one line when empty, capped so a
  // long message scrolls inside the box instead of eating the thread.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    // scrollHeight excludes the border, but the box is border-box — add it
    // back or the box is a few px short and shows a scrollbar.
    const border = el.offsetHeight - el.clientHeight;
    const full = el.scrollHeight + border;
    el.style.height = `${Math.min(full, 160)}px`;
    el.style.overflowY = full > 160 ? 'auto' : 'hidden';
  }, [input]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  // A message typed on the front page arrives as this chat's first message,
  // usually with its request already in flight. The ref survives StrictMode's
  // double effect run, so it is picked up once.
  const handoffDone = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (handoffDone.current) return;
    handoffDone.current = true;
    const h = takeHandoff();
    if (h) {
      if (rootRef.current) arriveInChat(rootRef.current);
      setMessages([GREETING, { role: 'user', content: h.text }]);
      setSending(true);
      receive(h.text, h.reply);
      return;
    }
    const pending = takePendingChat();
    if (pending?.trim()) send(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cycles the working status while a reply is pending — same wording the
  // front-page transition shows, so the hand-off reads as one conversation.
  const [statusIdx, setStatusIdx] = useState(0);
  useEffect(() => {
    if (!sending) return;
    setStatusIdx(0);
    const t = setInterval(() => setStatusIdx((i) => (i + 1) % WORKING_STATUSES.length), STATUS_INTERVAL_MS);
    return () => clearInterval(t);
  }, [sending]);

  async function receive(text: string, reply: Promise<ChatReply>) {
    try {
      const data = await reply;
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

  function send(override?: string) {
    const text = (override ?? input).trim();
    if (!text || sending) return;
    setError(null);
    const history = messages.filter((m) => m !== GREETING);
    setMessages([...messages, { role: 'user', content: text }]);
    setInput('');
    setSending(true);
    receive(text, postChat(text, history, date));
  }

  return (
    <div className="fc-root" ref={rootRef}>
      <div className="fc-thread" ref={threadRef}>
        {messages.map((m, i) => (
          <div key={i} className={`fc-msg fc-msg-${m.role}`}>
            <div className="fc-bubble">{m.content}</div>
          </div>
        ))}
        {sending && (
          <div className="fc-msg fc-msg-assistant">
            <div className="fc-bubble fc-typing">{WORKING_STATUSES[statusIdx]}…</div>
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
          rows={1}
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
          onClick={() => send()}
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
          font-style: italic;
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
          box-sizing: border-box;
          min-height: 42px;
          padding: 8px 11px;
          font-family: var(--font-body);
          font-size: 15px;
          line-height: 1.45;
          resize: none;
          overflow-y: hidden;
          max-height: 160px;
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
          box-sizing: border-box;
          height: 42px;
          padding: 0 18px;
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

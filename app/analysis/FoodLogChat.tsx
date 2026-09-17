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
import { useTypewriter } from '@/lib/use-typewriter';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface FoodLogChatProps {
  date: string;
  onMealLogged?: () => void;
  /** Rendered inside the box, right of the conversation, behind a divider */
  aside?: React.ReactNode;
}


export default function FoodLogChat({ date, onMealLogged, aside }: FoodLogChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const typed = useTypewriter(!input && !sending);
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
    el.style.height = `${Math.min(full, 240)}px`;
    el.style.overflowY = full > 240 ? 'auto' : 'hidden';
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
      setMessages([{ role: 'user', content: h.text }]);
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
    const history = messages;
    setMessages([...messages, { role: 'user', content: text }]);
    setInput('');
    setSending(true);
    receive(text, postChat(text, history, date));
  }

  return (
    <div className={`chat-box${aside ? ' chat-box--split' : ''}`} ref={rootRef}>
      <div className="chat-main">
      <div className="chat-thread" ref={threadRef}>
        {messages.length === 0 && !sending && !error && (
          <div className="chat-empty">
            <p className="chat-empty-text">What did you eat today?</p>
            {/* Hand-drawn arrow, looping down-left toward the input (drawn
                pointing right, mirrored by the <g>) */}
            <svg className="chat-empty-arrow" viewBox="0 0 120 150" fill="none" aria-hidden="true">
              <g transform="translate(120 0) scale(-1 1)">
              <path
                d="M30 6 C 14 30, 12 58, 38 70 C 62 81, 84 62, 70 48 C 58 37, 40 52, 48 76 C 55 98, 74 118, 92 138"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M76 136 C 83 138, 88 139, 93 139 C 93 132, 92 126, 90 119"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              </g>
            </svg>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg chat-msg--${m.role}`}>
            <div className="chat-bubble">{m.content}</div>
          </div>
        ))}
        {sending && (
          <div className="chat-msg chat-msg--assistant">
            <div className="chat-bubble chat-typing">{WORKING_STATUSES[statusIdx]}…</div>
          </div>
        )}
        {error && <div className="chat-error">{error}</div>}
      </div>

      <div className="chat-input-wrap">
        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder={sending ? '' : typed ? `${typed}|` : '|'}
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
          className="chat-send"
          onClick={() => send()}
          disabled={sending || !input.trim()}
          aria-label="Send"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
      </div>

      {aside && <aside className="chat-aside">{aside}</aside>}
    </div>
  );
}

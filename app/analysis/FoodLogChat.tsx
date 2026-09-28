'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  arriveInChat,
  FIRST_STATUS,
  postChat,
  ProgressFeed,
  takeHandoff,
  takePendingChat,
  type ChatReply,
  type ChatTurn,
  type Proposal,
  type ProposalItem,
} from '@/lib/chat-handoff';
import { apiUrl } from '@/lib/utils/base-path';
import { useTypewriter } from '@/lib/use-typewriter';

/** One food as the chat hands it to the page to save. */
export interface ChatFoodToAdd {
  foodId: string;
  name: string;
  grams: number;
  /** Display label saved with the item, e.g. "2 eggs". */
  portion: string;
}

type CardStatus = 'open' | 'adding' | 'added' | 'replaced';

/**
 * "Save as recipe" on the card. Built and tested (POST /api/foods/recipes),
 * but recipes are a post-alpha feature — off until then.
 */
const RECIPES_ENABLED = false;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  proposal?: Proposal;
  status?: CardStatus;
  /** Set once the list was saved as a recipe. */
  recipeName?: string;
  cardError?: string;
}

interface FoodLogChatProps {
  date: string;
  /** Saves the foods to the day being viewed. Throws on failure. */
  onAddFoods: (foods: ChatFoodToAdd[]) => Promise<void>;
  /** Rendered inside the box, right of the conversation, behind a divider */
  aside?: React.ReactNode;
}

/** What the server gets back: text, the list each reply proposed, and what became of it. */
function toHistory(messages: Message[]): ChatTurn[] {
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
    ...(m.proposal
      ? { proposal: m.proposal, proposalStatus: m.status === 'added' ? 'added' : m.status === 'replaced' ? 'replaced' : 'open' }
      : {}),
  }));
}

export default function FoodLogChat({ date, onAddFoods, aside }: FoodLogChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(FIRST_STATUS);
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
  }, [messages.length, sending]);

  // A list belongs to the day it was proposed for. Switching day clears the
  // conversation rather than letting an old list be added to another day.
  const firstDate = useRef(date);
  useEffect(() => {
    if (date === firstDate.current) return;
    firstDate.current = date;
    setMessages([]);
    setError(null);
  }, [date]);

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
      const unsubscribe = h.progress.subscribe(setStatus);
      receive(h.text, h.reply).finally(unsubscribe);
      return;
    }
    const pending = takePendingChat();
    if (pending?.trim()) send(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function receive(text: string, reply: Promise<ChatReply>) {
    try {
      const data = await reply;
      setMessages((prev) => [
        // A new list replaces any earlier one that was never added.
        ...prev.map((m) => (data.proposal && m.status === 'open' ? { ...m, status: 'replaced' as const } : m)),
        {
          role: 'assistant',
          content: data.response,
          ...(data.proposal ? { proposal: data.proposal, status: 'open' as const } : {}),
        },
      ]);
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
    const history = toHistory(messages);
    setMessages([...messages, { role: 'user', content: text }]);
    setInput('');
    setSending(true);
    const progress = new ProgressFeed();
    const unsubscribe = progress.subscribe(setStatus);
    receive(text, postChat(text, history, progress.push)).finally(unsubscribe);
  }

  function updateMessage(index: number, change: (m: Message) => Message) {
    setMessages((prev) => prev.map((m, i) => (i === index ? change(m) : m)));
  }

  function updateItems(index: number, change: (items: ProposalItem[]) => ProposalItem[]) {
    updateMessage(index, (m) => (m.proposal ? { ...m, proposal: { items: change(m.proposal.items) } } : m));
  }

  async function addFoods(index: number) {
    const m = messages[index];
    if (!m?.proposal || m.status !== 'open' || m.proposal.items.length === 0) return;
    updateMessage(index, (x) => ({ ...x, status: 'adding', cardError: undefined }));
    try {
      await onAddFoods(
        m.proposal.items.map((i) => ({ foodId: i.foodId, name: i.name, grams: i.grams, portion: i.portion }))
      );
      updateMessage(index, (x) => ({ ...x, status: 'added' }));
    } catch (err) {
      updateMessage(index, (x) => ({
        ...x,
        status: 'open',
        cardError: err instanceof Error ? err.message : 'Could not add these — try again.',
      }));
    }
  }

  async function saveRecipe(index: number, name: string) {
    const m = messages[index];
    if (!m?.proposal) return;
    const res = await fetch(apiUrl('/api/foods/recipes'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        components: m.proposal.items.map((i) => ({ foodId: i.foodId, grams: i.grams })),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || data.error || 'Could not save the recipe.');
    }
    updateMessage(index, (x) => ({ ...x, recipeName: name }));
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
            <div className="chat-msg-body">
              {m.content && <div className="chat-bubble">{m.content}</div>}
              {m.proposal && m.status && (
                <FoodCard
                  items={m.proposal.items}
                  status={m.status}
                  recipeName={m.recipeName}
                  error={m.cardError}
                  onChangeItems={(change) => updateItems(i, change)}
                  onAdd={() => addFoods(i)}
                  onSaveRecipe={(name) => saveRecipe(i, name)}
                />
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="chat-msg chat-msg--assistant">
            <div className="chat-bubble chat-typing">{status}…</div>
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

// ── The proposed list

interface FoodCardProps {
  items: ProposalItem[];
  status: CardStatus;
  recipeName?: string;
  error?: string;
  onChangeItems: (change: (items: ProposalItem[]) => ProposalItem[]) => void;
  onAdd: () => void;
  onSaveRecipe: (name: string) => Promise<void>;
}

function FoodCard({ items, status, recipeName, error, onChangeItems, onAdd, onSaveRecipe }: FoodCardProps) {
  const editable = status === 'open';
  const [naming, setNaming] = useState(false);

  if (status === 'replaced') {
    return <div className="chat-card chat-card--replaced">Updated list below</div>;
  }

  return (
    <div className={`chat-card chat-card--${status}`}>
      <ul className="chat-card-list">
        {items.map((item, idx) => (
          <li key={`${item.foodId}-${idx}`} className="chat-card-row">
            <div className="chat-card-food">
              <span className="chat-card-name">{item.name}</span>
              <span className="chat-card-meta">
                {item.portion}
                {item.guessed && <span className="chat-card-guess">guess</span>}
                {item.note && <span className="chat-card-note">{item.note}</span>}
              </span>
            </div>
            {editable ? (
              <GramsInput
                grams={item.grams}
                onChange={(grams) =>
                  onChangeItems((all) =>
                    // A typed amount replaces the "2 eggs" label, which would no longer be true.
                    all.map((x, j) => (j === idx ? { ...x, grams, portion: `${grams} g` } : x))
                  )
                }
              />
            ) : (
              <span className="chat-card-grams-static">{item.grams} g</span>
            )}
            {editable && (
              <button
                type="button"
                className="chat-card-remove"
                aria-label={`Remove ${item.name}`}
                onClick={() => onChangeItems((all) => all.filter((_, j) => j !== idx))}
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>

      {error && <div className="chat-card-error">{error}</div>}

      <div className="chat-card-actions">
        {status === 'added' ? (
          <span className="chat-card-done">Added ✓</span>
        ) : (
          <button
            type="button"
            className="chat-card-add"
            onClick={onAdd}
            disabled={status === 'adding' || items.length === 0}
          >
            {status === 'adding' ? 'Adding…' : items.length === 1 ? 'Add food' : `Add ${items.length} foods`}
          </button>
        )}
        {!RECIPES_ENABLED ? null : recipeName ? (
          <span className="chat-card-done">Saved as “{recipeName}”</span>
        ) : naming ? (
          <RecipeNameForm onCancel={() => setNaming(false)} onSave={onSaveRecipe} />
        ) : (
          items.length > 1 && (
            <button type="button" className="chat-card-secondary" onClick={() => setNaming(true)}>
              Save as recipe
            </button>
          )
        )}
      </div>
    </div>
  );
}

/** Grams field that lets the box be empty mid-edit without losing the last good value. */
function GramsInput({ grams, onChange }: { grams: number; onChange: (grams: number) => void }) {
  const [text, setText] = useState(String(grams));
  useEffect(() => setText(String(grams)), [grams]);
  return (
    <label className="chat-card-grams">
      <input
        type="number"
        inputMode="decimal"
        min={1}
        max={5000}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const n = Number(e.target.value);
          if (Number.isFinite(n) && n > 0 && n <= 5000) onChange(Math.round(n * 10) / 10);
        }}
        onBlur={() => setText(String(grams))}
        aria-label="Grams"
      />
      <span>g</span>
    </label>
  );
}

function RecipeNameForm({ onCancel, onSave }: { onCancel: () => void; onSave: (name: string) => Promise<void> }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the recipe.');
      setSaving(false);
    }
  }

  return (
    <form
      className="chat-card-recipe"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <input
        autoFocus
        placeholder="Recipe name, e.g. My smoothie"
        value={name}
        maxLength={120}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
      />
      <button type="submit" className="chat-card-secondary" disabled={!name.trim() || saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>
      <button type="button" className="chat-card-secondary" onClick={onCancel}>
        Cancel
      </button>
      {error && <div className="chat-card-error">{error}</div>}
    </form>
  );
}

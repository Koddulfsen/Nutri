'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { leaveForChat, setPendingChat } from '@/lib/chat-handoff';
import { useTypewriter } from '@/lib/use-typewriter';

interface HeroSearchProps {
  isAuthed?: boolean;
}

export default function HeroSearch({ isAuthed = false }: HeroSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typed = useTypewriter(!query);

  const submit = () => {
    const text = query.trim();
    if (!text || sending) return;
    setSending(true);
    setPendingChat(text);
    // Guests have no chat on /analysis, so there is nothing to morph into.
    if (isAuthed && inputRef.current) {
      leaveForChat(inputRef.current, new Date().toISOString().split('T')[0], () =>
        router.push('/analysis')
      );
    } else {
      router.push('/analysis');
    }
  };

  return (
    <div className="home-hero">
      <h1 className="home-headline">Today I had...</h1>

      <form
        className="home-search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          ref={inputRef}
          className="chat-input"
          type="text"
          aria-label="What did you eat?"
          placeholder={typed ? `${typed}|` : '|'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => router.prefetch('/analysis')}
          maxLength={500}
          autoFocus
        />
        <button
          type="submit"
          className="chat-send"
          disabled={!query.trim() || sending}
          aria-label="Send"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </form>
    </div>
  );
}

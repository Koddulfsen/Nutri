/**
 * Front page → /analysis chat handoff.
 *
 * The front-page input is the chat's first message, and the chat starts
 * working the moment you press enter:
 *
 *   1. the AI request fires immediately, from the front page
 *   2. a fixed "ghost" copy of the final chat, starting exactly over the input,
 *      resizes once to the chat's final size — your message plus a working
 *      status appear above the input, so the chat stays the focus
 *   3. meanwhile a curtain slowly fades the front page away, and we navigate
 *      underneath it
 *   4. FoodLogChat mounts, picks up the in-flight request, and the ghost slides
 *      onto the real chat before curtain and ghost fade out
 *
 * The request promise and the ghost live in this module, outside React, so they
 * survive the route change. This is hand-rolled rather than the View
 * Transitions API, which freezes the screen while the route renders and aborts
 * when that render is slow.
 */

import { apiUrl } from '@/lib/utils/base-path';
import type { Proposal, ProposalItem } from '@/lib/ai/food-log-chat';

export type { Proposal, ProposalItem };

export interface ChatReply {
  response: string;
  proposal?: Proposal;
}

/** A turn as the server wants it back: text, plus any list it proposed and what became of it. */
export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
  proposal?: Proposal;
  proposalStatus?: 'open' | 'added' | 'replaced';
}

/**
 * The chat's real progress ("Looking up egg, bread"), as the server reports
 * it. Keeps the latest label so a late subscriber — the chat mounting after
 * the front-page handoff — starts from where the request actually is.
 */
export class ProgressFeed {
  label = FIRST_STATUS;
  private listeners = new Set<(label: string) => void>();

  push = (label: string) => {
    this.label = label;
    this.listeners.forEach((l) => l(label));
  };

  subscribe(listener: (label: string) => void): () => void {
    this.listeners.add(listener);
    listener(this.label);
    return () => this.listeners.delete(listener);
  }
}

export interface Handoff {
  text: string;
  reply: Promise<ChatReply>;
  progress: ProgressFeed;
}

/** Shown until the server reports its first step. */
export const FIRST_STATUS = 'Reading your message';

/** Final chat box size, read from the same CSS vars the /analysis chat uses. */
function chatSize() {
  const probe = document.createElement('div');
  Object.assign(probe.style, {
    position: 'fixed',
    visibility: 'hidden',
    width: 'var(--chat-w)',
    height: 'var(--chat-h)',
  });
  document.body.appendChild(probe);
  const { width, height } = probe.getBoundingClientRect();
  probe.remove();
  return { width, height };
}

const KEY = 'nutri:pending-chat';
const CURTAIN_BG = '#fbc9c3'; // between banana.png (#f8d4cc) and bakgrunn.png (#febfbb)
const EASE = 'cubic-bezier(0.2, 0, 0, 1)';
const EXPAND_MS = 520;
const CURTAIN_DELAY_MS = 180;
const CURTAIN_MS = 700;
const MORPH_MS = 560;
const REVEAL_MS = 420;
const ABANDON_MS = 20000;

let handoff: Handoff | null = null;
let ghost: HTMLDivElement | null = null;
let curtain: HTMLDivElement | null = null;
let unsubscribeStatus: (() => void) | null = null;
let abandonTimer: ReturnType<typeof setTimeout> | null = null;

// ── Message storage (guest path, where there is no chat to hand a request to)

export function setPendingChat(text: string) {
  try {
    sessionStorage.setItem(KEY, text);
  } catch {
    // Storage blocked — the chat just starts empty.
  }
}

export function takePendingChat(): string | null {
  try {
    const text = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return text;
  } catch {
    return null;
  }
}

// ── The request

/**
 * Sends one message. Refusals (not signed in, rate limit, no consent) come
 * back as a JSON error; otherwise the reply streams as one JSON event per
 * line — progress labels, then `done` or `error` (see the route).
 */
export async function postChat(
  message: string,
  history: ChatTurn[],
  onProgress?: (label: string) => void
): Promise<ChatReply> {
  const res = await fetch(apiUrl('/api/ai/log-food'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || data.error || `HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split('\n');
    buffer = done ? '' : lines.pop()!;
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line);
      if (event.type === 'progress') onProgress?.(event.label);
      else if (event.type === 'done') return { response: event.response, proposal: event.proposal };
      else if (event.type === 'error') throw new Error(event.message);
    }
    if (done) break;
  }
  throw new Error('The reply was cut off — please try again.');
}

/** Takes the in-flight front-page request, once. */
export function takeHandoff(): Handoff | null {
  const h = handoff;
  handoff = null;
  return h;
}

// ── The transition

function cleanup() {
  ghost?.remove();
  curtain?.remove();
  ghost = null;
  curtain = null;
  unsubscribeStatus?.();
  if (abandonTimer) clearTimeout(abandonTimer);
  unsubscribeStatus = null;
  abandonTimer = null;
}

function fadeOutAndCleanup() {
  const els = [curtain, ghost].filter(Boolean) as HTMLElement[];
  Promise.all(
    els.map(
      (el) =>
        el.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: REVEAL_MS,
          easing: 'ease-out',
          fill: 'forwards',
        }).finished
    )
  ).finally(cleanup);
}

/** .chat-box border width */
const B = 2;

const ARROW_SVG =
  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

function el(className: string, text?: string) {
  const e = document.createElement('div');
  e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

/**
 * A static copy of the final chat, built from the same classes FoodLogChat
 * renders (globals.css "Chat"), so it cannot drift from either end state.
 * The wrapper starts sized so its input sits exactly over the front-page input.
 */
function buildGhost(input: HTMLInputElement, text: string, progress: ProgressFeed) {
  const rect = input.getBoundingClientRect();
  const pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--chat-pad')) || 16;

  const box = el('chat-box chat-box--split');
  Object.assign(box.style, {
    position: 'fixed',
    top: `${rect.top - B}px`,
    left: `${rect.left - pad - B}px`,
    width: `${rect.width + 2 * (pad + B)}px`,
    height: `${rect.height + pad + 2 * B}px`,
    zIndex: '9999',
    pointerEvents: 'none',
  });

  const thread = el('chat-thread');
  thread.style.overflow = 'hidden';
  const msg = (role: 'user' | 'assistant', content: string, extra = '') => {
    const m = el(`chat-msg chat-msg--${role}`);
    m.appendChild(el(`chat-bubble ${extra}`.trim(), content));
    return m;
  };
  const statusMsg = msg('assistant', `${progress.label}…`, 'chat-typing');
  const status = statusMsg.firstElementChild as HTMLElement;
  thread.append(msg('user', text), statusMsg);

  const wrap = el('chat-input-wrap');
  const field = el('chat-input');
  const cs = getComputedStyle(input);
  const fieldFrom = {
    height: `${rect.height}px`,
    fontSize: cs.fontSize,
    padding: cs.padding,
    borderColor: cs.borderColor,
  };
  Object.assign(field.style, fieldFrom);
  const typed = el('', text);
  const placeholder = el('chat-input-placeholder', '|');
  for (const layer of [typed, placeholder]) {
    Object.assign(layer.style, {
      position: 'absolute',
      inset: '0',
      display: 'flex',
      alignItems: 'center',
      padding: 'inherit',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    });
  }
  placeholder.style.opacity = '0';
  field.style.position = 'relative';
  field.append(typed, placeholder);
  const send = document.createElement('button');
  send.className = 'chat-send';
  send.disabled = true;
  send.tabIndex = -1;
  send.innerHTML = ARROW_SVG;
  wrap.append(field, send);

  const main = el('chat-main');
  main.append(thread, wrap);
  // The food list column: starts at zero width so the input can sit exactly
  // over the front-page input, then opens to its CSS width.
  const aside = el('chat-aside');
  aside.append(el('chat-aside-empty', 'No foods logged'));
  box.append(main, aside);

  unsubscribeStatus = progress.subscribe((label) => {
    if (status.textContent === `${label}…`) return;
    status.animate([{ opacity: 1 }, { opacity: 0 }, { opacity: 1 }], { duration: 360 });
    setTimeout(() => {
      status.textContent = `${label}…`;
    }, 180);
  });

  return { box, rect, pad, thread, typed, placeholder, field, fieldFrom, send, aside };
}

/**
 * Enter on the front page: fire the request, grow the input into a working
 * chat, fade the surroundings, navigate underneath.
 */
export function leaveForChat(input: HTMLInputElement, navigate: () => void) {
  cleanup();
  const text = input.value.trim();
  const progress = new ProgressFeed();
  const reply = postChat(text, [], progress.push);
  reply.catch(() => {}); // handled by FoodLogChat; avoid an unhandled rejection
  handoff = { text, reply, progress };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    navigate();
    return;
  }

  curtain = document.createElement('div');
  Object.assign(curtain.style, {
    position: 'fixed',
    inset: '0',
    background: CURTAIN_BG,
    opacity: '0',
    zIndex: '9998',
    pointerEvents: 'none',
  });

  const { box, rect, pad, thread, typed, placeholder, field, fieldFrom, send, aside } = buildGhost(input, text, progress);
  ghost = box;
  document.body.append(curtain, box);
  input.style.visibility = 'hidden';
  // Side-by-side only on wide screens; stacked (phone) the column is dropped
  // from the ghost rather than animated.
  const asideRow = getComputedStyle(box).flexDirection === 'row';
  const asideCs = getComputedStyle(aside);
  const asideTo = {
    width: asideCs.width,
    paddingLeft: asideCs.paddingLeft,
    paddingRight: asideCs.paddingRight,
  };
  if (asideRow) {
    Object.assign(aside.style, { width: '0px', paddingLeft: '0px', paddingRight: '0px', overflow: 'hidden' });
  } else {
    aside.remove();
  }
  // Real box colours, read after the ghost is in the DOM, so the fade-in ends
  // on exactly what CSS says.
  const { backgroundColor, borderColor, boxShadow } = getComputedStyle(box);
  // Where the input ends up: the chat-box size of .chat-input, unfocused.
  field.removeAttribute('style');
  field.style.position = 'relative';
  const fcs = getComputedStyle(field);
  const fieldTo = {
    // The ghost field holds no in-flow text, so compute a one-line textarea's
    // height the way FoodLogChat's autosize does: line + padding + border.
    height: `${
      parseFloat(fcs.lineHeight) +
      parseFloat(fcs.paddingTop) +
      parseFloat(fcs.paddingBottom) +
      parseFloat(fcs.borderTopWidth) +
      parseFloat(fcs.borderBottomWidth)
    }px`,
    fontSize: fcs.fontSize,
    padding: fcs.padding,
    borderColor: fcs.borderColor,
  };
  Object.assign(field.style, fieldFrom);
  const sendTo = getComputedStyle(send);
  const sendToBox = { width: sendTo.width, height: sendTo.height, right: sendTo.right };
  const inputSend = input.parentElement?.querySelector('.chat-send');
  const sendFrom = inputSend
    ? (() => {
        const c = getComputedStyle(inputSend);
        return { width: c.width, height: c.height, right: c.right };
      })()
    : sendToBox;

  // 1. One resize, straight to the final chat size, centred on screen. The
  //    input keeps the front-page width; the box grows around it. After the
  //    route change the chat only slides into place.
  const { width, height } = chatSize();
  const top = Math.max(16, (window.innerHeight - height) / 2);
  const left = (window.innerWidth - width) / 2;
  box.animate(
    [
      {
        top: `${rect.top - B}px`,
        left: `${rect.left - pad - B}px`,
        width: `${rect.width + 2 * (pad + B)}px`,
        height: `${rect.height + pad + 2 * B}px`,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        boxShadow: 'none',
      },
      { top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px`, backgroundColor, borderColor, boxShadow },
    ],
    { duration: EXPAND_MS, easing: EASE, fill: 'forwards' }
  );
  field.animate([fieldFrom, fieldTo], { duration: EXPAND_MS, easing: EASE, fill: 'forwards' });
  send.animate([sendFrom, sendToBox], { duration: EXPAND_MS, easing: EASE, fill: 'forwards' });
  typed.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' });
  placeholder.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, delay: 200, fill: 'forwards' });
  if (asideRow) {
    aside.animate(
      [
        { width: '0px', paddingLeft: '0px', paddingRight: '0px' },
        asideTo,
      ],
      { duration: EXPAND_MS, easing: EASE, fill: 'forwards' }
    );
    for (const child of Array.from(aside.children)) {
      child.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, delay: 220, fill: 'forwards' });
    }
  }
  thread.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: 320,
    delay: 180,
    easing: 'ease-out',
    fill: 'forwards',
  });

  // 2. The surroundings fade away, slower, behind it.
  curtain
    .animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: CURTAIN_MS,
      delay: CURTAIN_DELAY_MS,
      easing: 'ease-in-out',
      fill: 'forwards',
    })
    // 3. Navigate once nothing of the front page is visible.
    .finished.then(navigate);

  // If the chat never mounts (error page, redirect to login), don't leave the
  // curtain over the screen.
  abandonTimer = setTimeout(fadeOutAndCleanup, ABANDON_MS);
}

/**
 * Called by FoodLogChat on mount with the element the ghost should land on.
 * No-op unless a transition from the front page is in flight.
 */
export function arriveInChat(target: HTMLElement) {
  if (!ghost || !curtain) return;
  if (abandonTimer) clearTimeout(abandonTimer);
  abandonTimer = null;
  const g = ghost;

  // Wait a frame: the router scrolls to top after commit.
  requestAnimationFrame(() => {
    const from = g.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    g.animate(
      [
        { top: `${from.top}px`, left: `${from.left}px`, width: `${from.width}px`, height: `${from.height}px` },
        { top: `${to.top}px`, left: `${to.left}px`, width: `${to.width}px`, height: `${to.height}px` },
      ],
      { duration: MORPH_MS, easing: EASE, fill: 'forwards' }
    ).finished.then(fadeOutAndCleanup);
  });
}

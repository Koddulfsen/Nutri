'use client';

import { useEffect, useState } from 'react';

// Example foods typed into empty chat inputs (front page and /analysis).
const TYPED_ITEMS = [
  'lasagna',
  'a banana',
  'my morning coffee',
  'pad thai',
  'a Big Mac',
  "grandma's beef stew",
  'a chicken burrito',
  'oat milk',
  'dark chocolate',
  'a poke bowl',
  'beef liver',
  'a slice of pepperoni pizza',
  'kimchi fried rice',
  'a Snickers bar',
  'overnight oats',
  'a gin and tonic',
]

// Types and deletes TYPED_ITEMS in a loop. Pauses while `active` is false
// (i.e. the user has typed something) so the placeholder never fights input.
export function useTypewriter(active: boolean) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (!active) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setText(TYPED_ITEMS[0]);
      return;
    }

    let item = 0;
    let chars = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const word = TYPED_ITEMS[item];
      chars += deleting ? -1 : 1;
      setText(word.slice(0, chars));

      let delay = deleting ? 35 : 70 + Math.random() * 60;
      if (!deleting && chars === word.length) {
        deleting = true;
        delay = 1600;
      } else if (deleting && chars === 0) {
        deleting = false;
        item = (item + 1) % TYPED_ITEMS.length;
        delay = 300;
      }
      timer = setTimeout(tick, delay);
    };

    timer = setTimeout(tick, 400);
    return () => clearTimeout(timer);
  }, [active]);

  return text;
}


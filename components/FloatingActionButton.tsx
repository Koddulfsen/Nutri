'use client';

import React from 'react';

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
}

export default function FloatingActionButton({
  onClick,
  label = 'Log new meal'
}: FloatingActionButtonProps) {
  return (
    <button
      className="fab"
      aria-label={label}
      onClick={onClick}
    >
      +
    </button>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AnalysisHeader from '@/app/components/navigation/AnalysisHeader';
import { getGuestSession, removeGuestFood, type GuestFoodEntry } from '@/lib/guest-session';

export default function GuestAnalysisView() {
  const [foods, setFoods] = useState<GuestFoodEntry[]>([]);

  useEffect(() => {
    setFoods(getGuestSession().foods);
  }, []);

  const handleRemove = (id: string) => {
    const updated = removeGuestFood(id);
    setFoods(updated.foods);
  };

  const totalGrams = foods.reduce((s, f) => s + f.portionSize, 0);

  return (
    <div className="guest-page">
      <AnalysisHeader user={null} />

      <div className="guest-banner">
        <span className="guest-banner-text">
          You&apos;re exploring as a guest. Sign in to save your meals and track over time.
        </span>
        <Link href="/login" className="guest-banner-cta">Sign in</Link>
      </div>

      <main className="guest-main">
        <h1 className="guest-title">Your session</h1>
        <p className="guest-subtitle">
          {foods.length === 0
            ? 'Nothing added yet. Use the search on the home page to add a food.'
            : `${foods.length} food${foods.length === 1 ? '' : 's'} · ${Math.round(totalGrams)}g total`}
        </p>

        {foods.length > 0 && (
          <ul className="guest-food-list">
            {foods.map((f) => (
              <li key={f.id} className="guest-food-row">
                <div className="food-info">
                  <div className="food-name">{f.foodName}</div>
                  <div className="food-meta">
                    {Math.round(f.portionSize)}g · {f.portionType}
                  </div>
                </div>
                <button className="remove-btn" onClick={() => handleRemove(f.id)} aria-label="Remove">
                  &#x2715;
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="guest-note">
          <p>
            Full compound analysis is coming to guest mode soon. For now, you can save your session by signing up.
          </p>
          <Link href="/signup" className="guest-cta-btn">Sign up free</Link>
        </div>
      </main>

      <style jsx>{`
        .guest-page {
          min-height: 100vh;
          background: var(--bg, #0a0a0c);
          color: var(--text-1, #e8e8f4);
          font-family: var(--font-body, 'DM Sans', sans-serif);
        }

        .guest-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 12px 24px;
          background: var(--accent-soft, rgba(80,136,152,0.08));
          border-bottom: 1px solid var(--accent-border, rgba(80,136,152,0.14));
          font-size: 13px;
        }

        .guest-banner-text {
          color: var(--text-2, #8080a0);
        }

        .guest-banner-cta {
          color: var(--accent, #508898);
          font-weight: 500;
          text-decoration: none;
        }

        .guest-banner-cta:hover {
          color: var(--text-1, #e8e8f4);
        }

        .guest-main {
          max-width: 720px;
          margin: 0 auto;
          padding: 48px 24px;
        }

        .guest-title {
          font-family: var(--font-display, 'Instrument Serif', serif);
          font-size: 40px;
          font-weight: 400;
          margin: 0 0 8px 0;
          color: var(--text-1, #e8e8f4);
        }

        .guest-subtitle {
          font-size: 13px;
          color: var(--text-3, #484860);
          margin: 0 0 32px 0;
        }

        .guest-food-list {
          list-style: none;
          padding: 0;
          margin: 0 0 40px 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .guest-food-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: var(--bg-accent, #161618);
          border: 1px solid var(--border, #1e1e24);
          border-radius: 3px;
        }

        .food-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-1, #e8e8f4);
        }

        .food-meta {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 11px;
          color: var(--text-3, #484860);
          margin-top: 2px;
        }

        .remove-btn {
          background: transparent;
          border: none;
          color: var(--text-3, #484860);
          font-size: 14px;
          cursor: pointer;
          padding: 6px 10px;
          transition: color 0.15s;
        }

        .remove-btn:hover {
          color: var(--text-1, #e8e8f4);
        }

        .guest-note {
          padding: 24px;
          background: var(--bg-soft, #101014);
          border: 1px solid var(--border, #1e1e24);
          border-radius: 3px;
          text-align: center;
        }

        .guest-note p {
          font-size: 13px;
          color: var(--text-2, #8080a0);
          margin: 0 0 16px 0;
        }

        .guest-cta-btn {
          display: inline-block;
          padding: 10px 24px;
          background: var(--accent, #508898);
          color: #fff;
          border-radius: 3px;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          box-shadow: 0 5px 0 var(--accent-dark, #306070);
          transform: translateY(0);
          transition: transform 0.08s, box-shadow 0.08s;
        }

        .guest-cta-btn:hover {
          transform: translateY(2px);
          box-shadow: 0 3px 0 var(--accent-dark, #306070);
        }
      `}</style>
    </div>
  );
}

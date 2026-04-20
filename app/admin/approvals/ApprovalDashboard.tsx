'use client';

/**
 * Admin Approval Dashboard
 *
 * Client component for reviewing and approving/rejecting pending food additions
 *
 * Features:
 * - List all pending food approvals
 * - View food details + API sources
 * - Approve or reject with notes
 * - Real-time updates
 *
 * Architecture: Multi-Source Food Database System
 * Generated: 2025-11-18
 */

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { apiUrl } from '@/lib/utils/base-path';

interface ApprovalDashboardProps {
  user: User;
}

interface PendingFood {
  approval: {
    id: string;
    status: string;
    requestedBy: string | null;
    requestedAt: string;
  };
  food: {
    id: string;
    name: string;
    commonNames: string[];
    dataSource: string;
    createdAt: string;
  };
  sources: Array<{
    apiSource: string;
    apiFoodId: string;
  }>;
}

export default function ApprovalDashboard({ user }: ApprovalDashboardProps) {
  const [pendingFoods, setPendingFoods] = useState<PendingFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Processing state
  const [processing, setProcessing] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  // Fetch pending approvals
  const fetchPendingApprovals = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(apiUrl('/api/foods/pending?status=PENDING'));

      if (!res.ok) {
        throw new Error('Failed to fetch pending approvals');
      }

      const data = await res.json();
      setPendingFoods(data.foods || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  // Approve or reject food
  const handleReview = async (foodId: string, action: 'approve' | 'reject') => {
    setProcessing(foodId);

    try {
      const res = await fetch(apiUrl(`/api/foods/${foodId}/approve`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reviewNotes: reviewNotes[foodId] || undefined,
          reviewerId: user.id,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || `Failed to ${action} food`);
      }

      // Remove from list
      setPendingFoods(pendingFoods.filter(f => f.food.id !== foodId));

      // Clear notes
      setReviewNotes(prev => {
        const updated = { ...prev };
        delete updated[foodId];
        return updated;
      });

    } catch (error) {
      alert(error instanceof Error ? error.message : `Failed to ${action}`);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading pending approvals...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#ffffff' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '24px' }}>
        <div className="container">
          <h1 style={{ fontSize: '32px', fontWeight: 600, margin: 0 }}>
            Food Approvals Dashboard
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>
            Review and approve/reject community-added foods
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '48px 0' }}>
        <div className="container">
          {error && (
            <div style={{ padding: '16px', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', borderRadius: '8px', marginBottom: '24px', color: 'var(--red)' }}>
              Error: {error}
            </div>
          )}

          {pendingFoods.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
              <div style={{ fontSize: '20px' }}>No pending approvals!</div>
              <div style={{ fontSize: '14px', marginTop: '8px' }}>
                All food additions have been reviewed
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '24px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                {pendingFoods.length} food{pendingFoods.length !== 1 ? 's' : ''} pending review
              </div>

              <div className="approval-list">
                {pendingFoods.map((item) => (
                  <div key={item.food.id} className="approval-card">
                    {/* Food Info */}
                    <div className="approval-header">
                      <div>
                        <h3 className="food-name">{item.food.name}</h3>
                        {item.food.commonNames && item.food.commonNames.length > 0 && (
                          <div className="common-names">
                            Also: {item.food.commonNames.join(', ')}
                          </div>
                        )}
                        <div className="food-meta">
                          Requested {new Date(item.approval.requestedAt).toLocaleDateString()} at{' '}
                          {new Date(item.approval.requestedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    {/* API Sources */}
                    <div className="sources-section">
                      <div className="section-label">API Sources</div>
                      <div className="sources-grid">
                        {item.sources.map((source, index) => (
                          <div key={index} className="source-badge">
                            {source.apiSource === 'CNF' && '🇨🇦 '}
                            {source.apiSource === 'FDC' && '🇺🇸 '}
                            {source.apiSource} (ID: {source.apiFoodId})
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Review Notes */}
                    <div className="review-section">
                      <label className="section-label">Review Notes (optional)</label>
                      <textarea
                        className="review-notes-input"
                        placeholder="Add notes for this review..."
                        value={reviewNotes[item.food.id] || ''}
                        onChange={(e) =>
                          setReviewNotes(prev => ({
                            ...prev,
                            [item.food.id]: e.target.value,
                          }))
                        }
                        disabled={processing === item.food.id}
                      />
                    </div>

                    {/* Actions */}
                    <div className="action-buttons">
                      <button
                        className="btn-reject"
                        onClick={() => handleReview(item.food.id, 'reject')}
                        disabled={processing === item.food.id}
                      >
                        {processing === item.food.id ? 'Processing...' : '✕ Reject'}
                      </button>
                      <button
                        className="btn-approve"
                        onClick={() => handleReview(item.food.id, 'approve')}
                        disabled={processing === item.food.id}
                      >
                        {processing === item.food.id ? 'Processing...' : '✓ Approve'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .approval-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .approval-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 24px;
          transition: all 0.2s;
        }

        .approval-card:hover {
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.03);
        }

        .approval-header {
          margin-bottom: 20px;
        }

        .food-name {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .common-names {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 8px;
        }

        .food-meta {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
        }

        .sources-section {
          margin-bottom: 20px;
        }

        .section-label {
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 12px;
        }

        .sources-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .source-badge {
          padding: 8px 16px;
          background: rgba(106, 255, 149, 0.1);
          border: 1px solid rgba(106, 255, 149, 0.2);
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
        }

        .review-section {
          margin-bottom: 20px;
        }

        .review-notes-input {
          width: 100%;
          min-height: 80px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          transition: all 0.2s;
        }

        .review-notes-input:focus {
          outline: none;
          border-color: var(--purple);
          background: rgba(255, 255, 255, 0.08);
        }

        .review-notes-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn-approve,
        .btn-reject {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-approve {
          background: var(--green);
          color: #0a0a0a;
        }

        .btn-approve:hover:not(:disabled) {
          background: #7fff9f;
          transform: translateY(-1px);
        }

        .btn-approve:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-reject {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .btn-reject:hover:not(:disabled) {
          background: var(--red);
          transform: translateY(-1px);
        }

        .btn-reject:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

'use client';

/**
 * The two demographic inputs the app had no way to set: body weight and life stage.
 *
 * Both were fully built underneath and unreachable. `user_profiles.body_weight_kg_encrypted` and
 * `life_stage_encrypted` are encrypted at rest with the key in a separate table, each has its own
 * GDPR Article 9 consent, the export returns them and erasure removes them — and nothing in the UI
 * ever wrote either one. Pregnancy targets resolve from seven authorities for a life stage no user
 * could select.
 *
 * Why they matter to the number on screen:
 *   - Weight: eight sources publish values per kilogram of body weight (EFSA, DGE, the Nordic council
 *     and the UK for protein; WHO for every amino acid). Without a weight those resolve against a
 *     published reference weight — an assumption about the person. An adult man's protein target is
 *     56.5 g at the reference weight and 65 g at a measured 95 kg.
 *   - Life stage: the third-trimester protein target is 80 g against an everyday 48.6 g.
 *
 * Unlike the age/sex picker in AnalysisClient, which is local state and a what-if tool, this PERSISTS
 * — the values are the user's own, and they outlive the tab.
 *
 * Consent: both fields are refused by the API with a 403 until their consent is on
 * (`bodyMeasurements`, `sensitiveHealthData`). That is not an error to swallow — the component says so
 * and points at Settings, because a field that silently fails to save is worse than one that is absent.
 */

import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/utils/base-path';

type LifeStage = 'NONE' | 'PREGNANT_T1' | 'PREGNANT_T2' | 'PREGNANT_T3' | 'LACTATING_0_6M' | 'LACTATING_7_12M';

const LIFE_STAGES: Array<{ value: LifeStage; label: string }> = [
  { value: 'NONE', label: 'Not pregnant or breastfeeding' },
  { value: 'PREGNANT_T1', label: 'Pregnant — first trimester' },
  { value: 'PREGNANT_T2', label: 'Pregnant — second trimester' },
  { value: 'PREGNANT_T3', label: 'Pregnant — third trimester' },
  { value: 'LACTATING_0_6M', label: 'Breastfeeding — first 6 months' },
  { value: 'LACTATING_7_12M', label: 'Breastfeeding — after 6 months' },
];

/**
 * What the typed text means. Exported because it is the only real logic in this file and the project
 * has no DOM test tooling — the rest is markup.
 *
 * Whole kilograms only: at 0.83 g/kg one kilogram moves a protein target by 0.8 g, so anything finer
 * buys no accuracy and only sharpens a quasi-identifier (docs/DATA-SCOPE-DECISIONS.md). The bounds are
 * a sanity check on typing, not a medical judgement — outside 20-400 kg the input is far likelier to be
 * a slip or a figure in pounds than a person.
 */
export function parseWeightInput(raw: string): { kg: number | null } | { error: string } {
  const trimmed = raw.trim();
  if (trimmed === '') return { kg: null };          // cleared on purpose
  const kg = Number(trimmed.replace(',', '.'));      // a comma decimal is a slip, not a refusal
  if (!Number.isFinite(kg) || kg < 20 || kg > 400) {
    return { error: 'Enter a weight in kilograms, between 20 and 400.' };
  }
  return { kg: Math.round(kg) };
}

interface Props {
  /** Called after a value is saved, so the caller can refresh its targets. */
  onChange?: () => void;
  /** Life stage only applies to some people; hide it rather than show it to everyone. */
  showLifeStage?: boolean;
}

export default function BodyProfile({ onChange, showLifeStage = true }: Props) {
  const [weight, setWeight] = useState<string>('');
  const [lifeStage, setLifeStage] = useState<LifeStage>('NONE');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState<null | 'weight' | 'lifeStage'>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiUrl('/api/user/demographics'));
        if (res.ok) {
          const data = await res.json();
          if (data.bodyWeightKg != null) setWeight(String(data.bodyWeightKg));
          if (data.lifeStage) setLifeStage(data.lifeStage as LifeStage);
        }
      } catch {
        // A profile that will not load is not worth an error banner over a nutrition page; the fields
        // simply start empty and saving still works.
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const save = useCallback(
    async (field: 'weight' | 'lifeStage', body: Record<string, unknown>) => {
      setSaving(field);
      setNotice(null);
      try {
        const res = await fetch(apiUrl('/api/user/demographics'), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.status === 403) {
          // The consent gate. Saying which switch, and where, beats a generic failure.
          const data = await res.json().catch(() => ({}));
          setNotice(data.message ?? 'This needs its own permission in Settings › Privacy.');
          return false;
        }
        if (!res.ok) {
          setNotice('Could not save that — it has not been stored.');
          return false;
        }
        onChange?.();
        return true;
      } catch {
        setNotice('Could not save that — it has not been stored.');
        return false;
      } finally {
        setSaving(null);
      }
    },
    [onChange]
  );

  const commitWeight = async () => {
    const parsed = parseWeightInput(weight);
    if ('error' in parsed) { setNotice(parsed.error); return; }
    setWeight(parsed.kg == null ? '' : String(parsed.kg));
    await save('weight', { bodyWeightKg: parsed.kg });
  };

  if (!loaded) return null;

  return (
    <div className="bp">
      <label className="bp-row">
        <span className="bp-label">Body weight</span>
        <span className="bp-control">
          <input
            className="bp-input"
            inputMode="numeric"
            value={weight}
            placeholder="—"
            aria-label="Body weight in kilograms"
            onChange={(e) => setWeight(e.target.value)}
            onBlur={commitWeight}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            disabled={saving === 'weight'}
          />
          <span className="bp-unit">kg</span>
        </span>
      </label>
      <p className="bp-hint">
        Optional. Some targets — protein and amino acids especially — are set per kilogram of body
        weight. Without this they use an average adult&apos;s weight instead of yours.
      </p>

      {showLifeStage && (
        <>
          <label className="bp-row">
            <span className="bp-label">Life stage</span>
            <span className="bp-control">
              <select
                className="bp-select"
                value={lifeStage}
                aria-label="Pregnancy or breastfeeding status"
                disabled={saving === 'lifeStage'}
                onChange={async (e) => {
                  const next = e.target.value as LifeStage;
                  const previous = lifeStage;
                  setLifeStage(next);
                  const ok = await save('lifeStage', { lifeStage: next });
                  if (!ok) setLifeStage(previous);
                }}
              >
                {LIFE_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </span>
          </label>
          <p className="bp-hint">
            Pregnancy and breastfeeding change several targets substantially — protein rises by about
            half in the third trimester.
          </p>
        </>
      )}

      {notice && <p className="bp-notice" role="status">{notice}</p>}

      <style jsx>{`
        .bp { display: flex; flex-direction: column; gap: 4px; }
        .bp-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .bp-label { font-size: 13px; }
        .bp-control { display: inline-flex; align-items: center; gap: 6px; }
        .bp-input {
          width: 72px;
          text-align: right;
          font: inherit;
          font-size: 13px;
          padding: 4px 6px;
          border: 1px solid rgba(46, 26, 14, 0.2);
          border-radius: 6px;
          background: #fff;
          color: inherit;
        }
        .bp-select {
          font: inherit;
          font-size: 13px;
          padding: 4px 6px;
          border: 1px solid rgba(46, 26, 14, 0.2);
          border-radius: 6px;
          background: #fff;
          color: inherit;
          max-width: 260px;
        }
        .bp-unit { font-size: 12px; opacity: 0.6; }
        .bp-hint { font-size: 11px; line-height: 1.4; opacity: 0.6; margin: 0 0 8px; }
        .bp-notice { font-size: 12px; line-height: 1.4; margin: 4px 0 0; }
      `}</style>
    </div>
  );
}

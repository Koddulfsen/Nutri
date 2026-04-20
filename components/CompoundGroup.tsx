'use client';

import type { Compound } from '@/lib/types';
import CompoundRow from './CompoundRow';

interface CompoundGroupProps {
  group: {
    name: string;
    compounds: Compound[];
  };
  isExpanded: boolean;
  onToggle: () => void;
  expandedCompounds: Set<string>;
  onToggleCompound: (compoundId: string) => void;
}

export default function CompoundGroup({
  group,
  isExpanded,
  onToggle,
  expandedCompounds,
  onToggleCompound
}: CompoundGroupProps) {
  return (
    <section className="compound-group" aria-label={group?.name ?? 'Compound group'}>
      <div
        className="group-header"
        role="button"
        aria-expanded={isExpanded}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        tabIndex={0}
      >
        <span>{group?.name ?? 'Unknown'}</span>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <>
          {group?.compounds?.length > 0 ? (
            group.compounds.map((compound) => (
              <CompoundRow
                key={compound?.id ?? Math.random()}
                compound={compound}
                showContributingFoods={expandedCompounds.has(compound?.id ?? '')}
                onToggleFoods={() => compound?.id && onToggleCompound(compound.id)}
              />
            ))
          ) : (
            <div style={{ padding: '16px', color: 'rgba(255,255,255,0.5)' }}>
              No compounds in this group
            </div>
          )}
        </>
      )}
    </section>
  );
}

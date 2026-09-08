'use client';

import { useState, useEffect, useMemo } from 'react';
import AnalysisHeader from '@/app/components/navigation/AnalysisHeader';
import { apiUrl } from '@/lib/utils/base-path';

const ESSENTIAL_AAS    = new Set(['Histidine','Isoleucine','Leucine','Lysine','Methionine','Phenylalanine','Threonine','Tryptophan','Valine']);
const COND_ESSENTIAL_AAS = new Set(['Arginine','Cysteine','Tyrosine','Glutamine','Glycine','Proline','Serine']);

const STATUS_DOT: Record<string, string> = {
  verified:   'bg-emerald-400',
  review:     'bg-yellow-400',
  flagged:    'bg-red-400',
  unverified: 'bg-white/20',
};
const STATUS_PILL: Record<string, string> = {
  verified:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  review:     'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  flagged:    'bg-red-500/15 text-red-400 border-red-500/25',
  unverified: 'bg-white/5 text-white/30 border-white/10',
};

interface Mapping {
  csId: string; source: string; externalId: string;
  sourceName: string | null; sourceUnit: string | null;
  conversionFactor: string; isCanonical: boolean;
  verificationStatus: string;
}
interface Compound {
  id: string; name: string; type: string; unit: string;
  parentId: string | null; mappings: Mapping[];
}
interface TreeNode extends Compound {
  children: TreeNode[];
  depth: number;
}

function buildTree(compounds: Compound[]): Map<string, TreeNode> {
  const map = new Map<string, TreeNode>();
  compounds.forEach(c => map.set(c.id, { ...c, children: [], depth: 0 }));
  map.forEach(node => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    }
  });
  function setDepth(node: TreeNode, d: number) {
    node.depth = d;
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    node.children.forEach(ch => setDepth(ch, d + 1));
  }
  map.forEach(node => { if (!node.parentId || !map.has(node.parentId)) setDepth(node, 0); });
  return map;
}

// ─── Single compound row ───────────────────────────────────────────────────

function CompoundRow({
  node, search, forceDepth, hideChildren, showPills,
}: {
  node: TreeNode;
  search: string;
  forceDepth?: number;
  hideChildren?: boolean;
  showPills: boolean;
}) {
  const [childrenOpen, setChildrenOpen] = useState(false);
  const [mappingOpen, setMappingOpen] = useState(false);
  const depth = forceDepth ?? node.depth;

  const matchesSearch = !search || node.name.toLowerCase().includes(search.toLowerCase());
  if (!matchesSearch && node.children.length === 0) return null;

  const worstStatus = node.mappings.reduce<string>((worst, m) => {
    const order = ['flagged','review','unverified','verified'];
    return order.indexOf(m.verificationStatus) < order.indexOf(worst) ? m.verificationStatus : worst;
  }, 'verified');

  const hasChildren = !hideChildren && node.children.length > 0;

  return (
    <>
      <div
        className="flex items-start gap-2 py-2 rounded-sm"
        style={{
          paddingLeft: depth > 0 ? `${depth * 20 + 10}px` : '12px',
          paddingRight: '12px',
          background: depth === 0 ? 'var(--bg-soft)' : 'transparent',
          borderLeft: depth > 0 ? '1px solid var(--border-soft)' : 'none',
          marginLeft: depth > 0 ? `${depth * 20}px` : '0',
        }}
      >
        {/* Tree expand — only clickable if has children */}
        <span
          className="text-xs mt-0.5 w-3 shrink-0"
          style={{ color: 'var(--text-3)', cursor: hasChildren ? 'pointer' : 'default' }}
          onClick={() => hasChildren && setChildrenOpen(o => !o)}
        >
          {hasChildren ? (childrenOpen ? '▾' : '▸') : ''}
        </span>

        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${STATUS_DOT[worstStatus]}`} />

        {/* Name — click to toggle mapping detail */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => node.mappings.length > 0 && setMappingOpen(o => !o)}
        >
          <span className="text-sm" style={{ color: depth === 0 ? 'var(--text-1)' : 'var(--text-2)', fontWeight: depth === 0 ? 500 : 400 }}>
            {node.name}
          </span>
          <span className="ml-2 text-xs font-mono" style={{ color: 'var(--text-3)' }}>{node.unit}</span>
          {node.mappings.length === 0 && (
            <span className="ml-2 text-xs px-1 rounded-sm" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-3)' }}>
              no mappings
            </span>
          )}
          {node.mappings.length > 0 && (
            <span className="ml-2 text-xs" style={{ color: 'var(--text-3)' }}>
              {mappingOpen ? '−' : `${node.mappings.length}`}
            </span>
          )}
        </div>

        {/* Source pills — globally toggled */}
        {showPills && (
          <div className="flex flex-wrap gap-1 justify-end shrink-0 max-w-[55%]">
            {node.mappings.map(m => (
              <span
                key={m.csId}
                title={`${m.sourceName ?? m.externalId} (${m.sourceUnit ?? '?'})`}
                className={`text-xs px-1.5 py-0 rounded-sm border ${STATUS_PILL[m.verificationStatus]}`}
              >
                {m.source}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Mapping detail — toggled by clicking the name */}
      {mappingOpen && node.mappings.length > 0 && (
        <div
          className="mb-1 rounded-sm overflow-hidden text-xs"
          style={{
            marginLeft: `${depth * 20 + 28}px`,
            marginRight: '12px',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
          }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--bg-soft)', color: 'var(--text-3)' }}>
                {['Source','ID','Source Name','Unit','CF','Status'].map(h => (
                  <th key={h} className="text-left px-3 py-1.5 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {node.mappings.map(m => (
                <tr key={m.csId} style={{ borderTop: '1px solid var(--border-soft)' }}>
                  <td className="px-3 py-1.5 font-mono" style={{ color: 'var(--accent)' }}>{m.source}</td>
                  <td className="px-3 py-1.5 font-mono" style={{ color: 'var(--text-2)' }}>{m.externalId}</td>
                  <td className="px-3 py-1.5" style={{ color: 'var(--text-1)' }}>{m.sourceName ?? '—'}</td>
                  <td className="px-3 py-1.5 font-mono" style={{ color: 'var(--text-3)' }}>{m.sourceUnit ?? '—'}</td>
                  <td className="px-3 py-1.5 font-mono" style={{ color: 'var(--text-3)' }}>{m.conversionFactor}</td>
                  <td className="px-3 py-1.5">
                    <span className={`px-2 py-0.5 rounded-sm border ${STATUS_PILL[m.verificationStatus]}`}>
                      {m.verificationStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Children */}
      {!hideChildren && childrenOpen && node.children.map(ch => (
        <CompoundRow key={ch.id} node={ch} search={search} forceDepth={(forceDepth ?? 0) + 1} showPills={showPills} />
      ))}
    </>
  );
}

// ─── Section header ────────────────────────────────────────────────────────

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div
      className="flex items-center gap-3 mb-2 px-3 py-2 rounded-sm"
      style={{ background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)' }}
    >
      <h2 className="text-sm font-medium uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
        {label}
      </h2>
      <span className="text-xs" style={{ color: 'var(--text-3)' }}>{count} compounds</span>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function CoreCompoundsPage() {
  const [compounds, setCompounds] = useState<Compound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showPills, setShowPills] = useState(true);

  useEffect(() => {
    fetch(apiUrl('/api/admin/core-compounds'), { credentials: 'same-origin' })
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setCompounds(d.compounds); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const { nodeMap, derived } = useMemo(() => {
    const nodeMap = buildTree(compounds);

    const byName = (name: string) => [...nodeMap.values()].find(n => n.name === name);
    const rootsOfType = (...types: string[]) =>
      [...nodeMap.values()].filter(n => types.includes(n.type) && (!n.parentId || !nodeMap.has(n.parentId)));
    const childrenOf = (name: string, exclude?: Set<string>) => {
      const parent = byName(name);
      if (!parent) return [];
      return parent.children.filter(ch => !exclude?.has(ch.name));
    };

    // ── General: flat list of top-level items + Fiber standalone ──
    const MACRO_NAMES = ['Energy','Water','Salt','Protein','Total Fat','Carbohydrates'];
    const macroFlat = MACRO_NAMES.map(n => byName(n)).filter(Boolean) as TreeNode[];
    const fiber = byName('Dietary Fiber');

    // ── Fats: Total Fat flat, then Sat/Mono/PUFA/Trans as peers, then Sterols ──
    const totalFat = byName('Total Fat');
    const pufa = byName('Polyunsaturated Fat');
    const FAT_ORDER = ['Saturated Fat', 'Monounsaturated Fat', 'Polyunsaturated Fat', 'Trans Fat'];
    const fatCategoriesRaw = [...(totalFat?.children ?? []), ...(pufa ? [pufa] : [])];
    const fatCategories = FAT_ORDER
      .map(name => fatCategoriesRaw.find(n => n.name === name))
      .filter(Boolean) as TreeNode[];
    const sterols = rootsOfType('STEROL');

    // ── Carbs: children of Carbohydrates, excluding Dietary Fiber branch ──
    const FIBER_NAMES = new Set(['Dietary Fiber','Soluble Fiber','Insoluble Fiber','Beta-Glucan','Inulin','Pectin','Resistant Starch']);
    const carbChildren = childrenOf('Carbohydrates', FIBER_NAMES);

    // ── Proteins: amino acids ──
    const aminoAcids = rootsOfType('AMINO_ACID');

    return {
      nodeMap,
      derived: { macroFlat, fiber, totalFat, fatCategories, sterols, carbChildren, aminoAcids },
    };
  }, [compounds]);

  function aaGroup(group: string) {
    return derived.aminoAcids.filter(n => {
      if (group === 'Essential') return ESSENTIAL_AAS.has(n.name);
      if (group === 'Conditionally Essential') return COND_ESSENTIAL_AAS.has(n.name);
      return !ESSENTIAL_AAS.has(n.name) && !COND_ESSENTIAL_AAS.has(n.name);
    });
  }

  const SECTIONS = [
    { key: 'macro',    label: 'General' },
    { key: 'fats',     label: 'Fats' },
    { key: 'carbs',    label: 'Carbohydrates' },
    { key: 'fiber',    label: 'Fiber' },
    { key: 'proteins', label: 'Proteins' },
    { key: 'vitamins', label: 'Vitamins' },
    { key: 'minerals', label: 'Minerals' },
    { key: 'heavy',    label: 'Heavy Metals' },
  ];

  const visible = activeSection ? SECTIONS.filter(s => s.key === activeSection) : SECTIONS;
  const coreCount = compounds.filter(c => c.type !== 'NUCLEOTIDE').length;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text-1)' }}>
      <AnalysisHeader />
      <div className="max-w-[1100px] mx-auto px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-display)' }}>Core Compounds</h1>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>{coreCount} compounds</p>
        </div>

        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <input
            type="text" placeholder="Search..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-sm w-48"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' }}
          />
          <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: 'var(--text-2)' }}>
            <input type="checkbox" checked={showPills} onChange={e => setShowPills(e.target.checked)} className="accent-cyan-500" />
            Source pills
          </label>

          <div className="flex gap-1 flex-wrap">
            {SECTIONS.map(s => (
              <button key={s.key} onClick={() => setActiveSection(activeSection === s.key ? null : s.key)}
                className="px-3 py-1 text-xs rounded-sm border"
                style={{
                  background: activeSection === s.key ? 'var(--accent)' : 'var(--surface)',
                  borderColor: activeSection === s.key ? 'var(--accent)' : 'var(--border)',
                  color: activeSection === s.key ? '#fff' : 'var(--text-2)',
                }}
              >{s.label}</button>
            ))}
          </div>
        </div>

        {loading && <p className="text-sm py-8 text-center" style={{ color: 'var(--text-3)' }}>Loading...</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {!loading && !error && (
          <div className="space-y-8">

            {/* ── MACRONUTRIENTS ── */}
            {visible.some(s => s.key === 'macro') && (
              <div>
                <SectionHeader label="General" count={derived.macroFlat.length + 1} />
                {derived.macroFlat.map(node => (
                  <CompoundRow key={node.id} node={node} search={search} forceDepth={0} hideChildren showPills={showPills} />
                ))}
                {/* Fiber as its own item with its children */}
                {derived.fiber && (
                  <CompoundRow node={derived.fiber} search={search} forceDepth={0} hideChildren showPills={showPills} />
                )}
              </div>
            )}

            {/* ── FATS ── */}
            {visible.some(s => s.key === 'fats') && (
              <div>
                <SectionHeader label="Fats" count={1 + derived.fatCategories.length + derived.sterols.length} />
                {/* Total Fat — standalone, no children */}
                {derived.totalFat && (
                  <CompoundRow node={derived.totalFat} search={search} forceDepth={0} hideChildren showPills={showPills} />
                )}
                {/* Sat / Mono / PUFA / Trans — each expandable at peer level */}
                {derived.fatCategories.map(n => (
                  <CompoundRow key={n.id} node={n} search={search} forceDepth={0} showPills={showPills} />
                ))}
                {/* Sterols */}
                {derived.sterols.length > 0 && (
                  <>
                    <div className="px-3 py-1.5 text-xs mt-3" style={{ color: 'var(--text-3)' }}>Sterols</div>
                    {derived.sterols.map(n => <CompoundRow key={n.id} node={n} search={search} forceDepth={0} showPills={showPills} />)}
                  </>
                )}
              </div>
            )}

            {/* ── CARBOHYDRATES ── */}
            {visible.some(s => s.key === 'carbs') && (
              <div>
                <SectionHeader label="Carbohydrates" count={derived.carbChildren.length} />
                {derived.carbChildren.map(node => (
                  <CompoundRow key={node.id} node={node} search={search} forceDepth={0} showPills={showPills} />
                ))}
              </div>
            )}

            {/* ── FIBER ── */}
            {visible.some(s => s.key === 'fiber') && derived.fiber && (
              <div>
                <SectionHeader label="Fiber" count={1 + derived.fiber.children.length} />
                <CompoundRow node={derived.fiber} search={search} forceDepth={0} showPills={showPills} />
              </div>
            )}

            {/* ── PROTEINS ── */}
            {visible.some(s => s.key === 'proteins') && (
              <div>
                <SectionHeader label="Proteins" count={derived.aminoAcids.length} />
                {(['Essential','Conditionally Essential','Non-Essential'] as const).map(group => {
                  const nodes = aaGroup(group);
                  if (!nodes.length) return null;
                  return (
                    <div key={group} className="mb-3">
                      <div className="px-3 py-1 text-xs" style={{ color: 'var(--text-3)' }}>{group}</div>
                      {nodes.map(n => <CompoundRow key={n.id} node={n} search={search} forceDepth={0} showPills={showPills} />)}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── VITAMINS ── */}
            {visible.some(s => s.key === 'vitamins') && (
              <div>
                {(() => {
                  const byVitName = (name: string) => [...nodeMap.values()].find(n => n.name === name);
                  const FAT_SOLUBLE = ['Vitamin A (RAE)', 'Vitamin D (Total)', 'Vitamin E (Total)', 'Vitamin K (Total)'];
                  const B_VITAMINS  = ['Thiamin (B1)', 'Riboflavin (B2)', 'Niacin (B3)', 'Pantothenic Acid (B5)', 'Vitamin B6', 'Biotin (B7)', 'Folate (Total)', 'Vitamin B12 (Total)'];
                  const OTHER_WATER = ['Vitamin C (Total)', 'Choline (Total)'];
                  const pick = (names: string[]) => names.map(n => byVitName(n)).filter(Boolean) as TreeNode[];
                  const fatSoluble  = pick(FAT_SOLUBLE);
                  const bVitamins   = pick(B_VITAMINS);
                  const otherWater  = pick(OTHER_WATER);
                  const total = fatSoluble.length + bVitamins.length + otherWater.length;
                  return (
                    <>
                      <SectionHeader label="Vitamins" count={total} />

                      <div className="px-3 py-1.5 text-xs mt-1" style={{ color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Fat-Soluble</div>
                      {fatSoluble.map(n => <CompoundRow key={n.id} node={n} search={search} forceDepth={0} showPills={showPills} />)}

                      <div className="px-3 py-1.5 text-xs mt-3" style={{ color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Water-Soluble</div>
                      <div className="px-3 py-1 text-xs" style={{ color: 'var(--text-3)' }}>B Vitamins</div>
                      {bVitamins.map(n => <CompoundRow key={n.id} node={n} search={search} forceDepth={0} showPills={showPills} />)}
                      <div className="mt-1" />
                      {otherWater.map(n => <CompoundRow key={n.id} node={n} search={search} forceDepth={0} showPills={showPills} />)}
                    </>
                  );
                })()}
              </div>
            )}

            {/* ── MINERALS ── */}
            {visible.some(s => s.key === 'minerals') && (
              <div>
                {(() => {
                  const MACROMINERALS = ['Calcium','Chloride','Magnesium','Phosphorus','Potassium','Sodium','Sulfur'];
                  const TRACE_MINERALS = ['Boron','Chromium','Cobalt','Copper','Fluoride','Iodine','Iron (Total)','Manganese','Molybdenum','Selenium','Silicon','Zinc'];
                  const byMinName = (name: string) => [...nodeMap.values()].find(n => n.name === name);
                  const pick = (names: string[]) => names.map(n => byMinName(n)).filter(Boolean) as TreeNode[];
                  const macro = pick(MACROMINERALS);
                  const trace = pick(TRACE_MINERALS);
                  return (
                    <>
                      <SectionHeader label="Minerals" count={macro.length + trace.length} />
                      <div className="px-3 py-1.5 text-xs mt-1" style={{ color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Macrominerals</div>
                      {macro.map(n => <CompoundRow key={n.id} node={n} search={search} forceDepth={0} showPills={showPills} />)}
                      <div className="px-3 py-1.5 text-xs mt-3" style={{ color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Trace Minerals</div>
                      {trace.map(n => <CompoundRow key={n.id} node={n} search={search} forceDepth={0} showPills={showPills} />)}
                    </>
                  );
                })()}
              </div>
            )}

            {/* ── HEAVY METALS ── */}
            {visible.some(s => s.key === 'heavy') && (
              <div>
                {(() => {
                  const roots = [...nodeMap.values()].filter(n => n.type === 'HEAVY_METAL');
                  roots.sort((a, b) => a.name.localeCompare(b.name));
                  return (
                    <>
                      <SectionHeader label="Heavy Metals" count={roots.length} />
                      {roots.map(n => <CompoundRow key={n.id} node={n} search={search} forceDepth={0} showPills={showPills} />)}
                    </>
                  );
                })()}
              </div>
            )}

          </div>
        )}

        <div className="flex gap-4 mt-8 text-xs" style={{ color: 'var(--text-3)' }}>
          {Object.entries(STATUS_PILL).map(([s, cls]) => (
            <span key={s} className={`px-2 py-0.5 rounded-sm border ${cls}`}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

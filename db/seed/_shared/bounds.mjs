/**
 * Physical bounds guard for staging imports.
 *
 * Food composition data has hard physical limits: a per-100 g proximate cannot exceed
 * 100 g. Several importers parse text extracted from PDFs, where a stray page number or
 * index column can land in a value slot and be stored as if it were real. That is how
 * KFCT ended up with "protein = 2964 g" and ASEANFOODS with "moisture = 644 g".
 *
 * This does NOT validate that a value is correct — only that it is not impossible.
 * A wrong-but-plausible number still gets through; that is what cross-source comparison
 * is for. See docs/IMPORT-INTEGRITY-AUDIT.md.
 *
 * Usage:
 *   const guard = createBoundsGuard({ tagUnits });   // Map<tag, unitString>
 *   if (!guard.accept(tag, value)) continue;         // per row
 *   guard.report({ total, maxRejectRatio: 0.01 });   // throws if too many rejects
 */

// INFOODS-style tags for per-100 g proximates, which cannot exceed 100 g.
const GRAM_PROXIMATE_TAGS = new Set([
  'WATER', 'MOIST', 'PROT', 'PROCNT', 'FAT', 'FATCE', 'FAT_G',
  'CHO', 'CHOAVL', 'CHOCDF', 'ASH', 'FIBTG', 'ALC', 'SUGAR',
]);

const isGramUnit = (u) => /^g(\/100\s*g)?$/i.test(String(u ?? '').trim());

/**
 * Hard ceiling for a per-100 g gram value.
 *
 * NOT 100. Two legitimate conventions push real data just above it:
 *   - UK CoFID expresses carbohydrate as monosaccharide equivalents, so white sugar is
 *     genuinely 105 g/100 g (sucrose gains a water molecule on hydrolysis).
 *   - Water measured by difference lands at 100.1-101.4 for diet soft drinks and some soups.
 * Rejecting at 100 would delete correct data. 110 still catches the parser artifacts this
 * guard exists for, which land in the hundreds or thousands (2964, 644, 358, 243).
 */
const GRAM_MAX = 110;

export function createBoundsGuard({ tagUnits } = {}) {
  const rejects = [];

  return {
    /**
     * @returns {boolean} true if the value is physically possible and should be stored
     */
    accept(tag, value) {
      if (value === null || value === undefined) return true;
      const n = Number(value);
      if (!Number.isFinite(n)) return true;

      const upper = String(tag ?? '').toUpperCase();
      const unit = tagUnits?.get?.(tag) ?? tagUnits?.get?.(upper);
      const isGram = GRAM_PROXIMATE_TAGS.has(upper) || isGramUnit(unit);

      if (isGram && (n > GRAM_MAX || n < 0)) {
        rejects.push({ tag, value: n });
        return false;
      }
      return true;
    },

    get rejectCount() { return rejects.length; },

    /**
     * Print what was dropped. Throws when the reject rate suggests a structural break
     * rather than a few stray rows — a silent 90%-wrong import is what this exists to stop.
     */
    report({ total, maxRejectRatio = 0.01, label = 'rows' } = {}) {
      if (rejects.length === 0) {
        console.log(`  Bounds guard: 0 impossible values in ${total} ${label}`);
        return;
      }
      const ratio = total > 0 ? rejects.length / total : 1;
      const sample = rejects.slice(0, 8).map((r) => `${r.tag}=${r.value}`).join(', ');
      console.log(
        `  Bounds guard: REJECTED ${rejects.length}/${total} impossible values ` +
        `(${(ratio * 100).toFixed(2)}%) — ${sample}${rejects.length > 8 ? ', ...' : ''}`
      );
      if (ratio > maxRejectRatio) {
        throw new Error(
          `Bounds guard rejected ${(ratio * 100).toFixed(1)}% of values, above the ` +
          `${(maxRejectRatio * 100).toFixed(1)}% threshold. This looks structural, not stray. ` +
          `Refusing to finish the import.`
        );
      }
    },
  };
}

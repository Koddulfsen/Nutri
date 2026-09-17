/**
 * CNS 2023 附表 3-12 其他膳食成分成年人特定建议值（SPL）和可耐受最高摄入量（UL） — transcribed from
 * cns-2023.pdf PDF page 655 (printed p.639), 2026-09-17. Adults (成年人) only.
 *
 * SPL (特定建议值) is a level to reach for lowering chronic disease risk -> CDRR with valueMin (as PI-NCD).
 *
 * Stored: only components with a Nutri compound. Not stored (no compound yet), as printed:
 *   原花青素 proanthocyanidins SPL 200 mg · 花色苷 anthocyanins SPL 50 mg ·
 *   大豆异黄酮 soy isoflavones SPL 55 mg (premenopausal) / 75 mg (peri- and postmenopausal), UL 120 mg (postmenopausal) ·
 *   绿原酸 chlorogenic acid SPL 200 mg · 植物甾醇酯 phytosterol esters SPL 1.3 g, UL 3.9 g ·
 *   异硫氰酸酯 isothiocyanates SPL 30 mg · 辅酶 Q10 coenzyme Q10 SPL 100 mg · 甜菜碱 betaine SPL 1.5 g, UL 4.0 g ·
 *   硫酸/盐酸氨基葡萄糖 glucosamine sulphate/hydrochloride SPL 1500 mg · 氨基葡萄糖 glucosamine SPL 1000 mg.
 */
export const TABLE_3_12_OTHER: Record<string, { label: string; compound: string; unit: string; spl: number; ul: number | null; note?: string }> = {
  lycopene: { label: '番茄红素', compound: 'Lycopene', unit: 'mg', spl: 15, ul: 70 },
  lutein: { label: '叶黄素', compound: 'Lutein', unit: 'mg', spl: 10, ul: 60 },
  phytosterols: { label: '植物甾醇', compound: 'Total Plant Sterols', unit: 'g', spl: 0.8, ul: 2.4, note: 'Printed as 植物甾醇 (phytosterols).' },
  inulin: { label: '菊粉或低聚果糖', compound: 'Inulin', unit: 'g', spl: 10, ul: null, note: 'Printed as 菊粉或低聚果糖: inulin or oligofructose.' },
  betaGlucan: { label: 'β-葡聚糖（谷物来源）', compound: 'Beta-Glucan', unit: 'g', spl: 3.0, ul: null, note: 'Printed as β-glucan from cereals.' },
};

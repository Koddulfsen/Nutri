/**
 * Test Whole Foods Scoring Algorithm
 *
 * This script tests the structural scoring algorithm against real API data
 * to see if it can effectively distinguish whole foods from processed foods
 * WITHOUT using any hardcoded food/cooking keywords.
 */

// Real API data from our searches
const testData = {
  "chicken breast": {
    cnf: [
      {name: "Chicken breast with broccoli and cheese stuffing, frozen", score: 500},
      {name: "Chicken breast tenders, breaded, cooked in conventional oven", score: 500},
      {name: "Chicken breast tenders, breaded, cooked in microwave", score: 500},
      {name: "Chicken breast tenders, breaded, uncooked", score: 500},
      {name: "Deli-meat, chicken breast, cooked, extra lean", score: 150},
      {name: "Deli-meat, chicken breast (honey glazed)", score: 150},
      {name: "Deli-meat, chicken breast, oven-roasted, fat free, sliced", score: 150},
      {name: "Chicken, broiler, breast, meat and skin, batter dipped, fried", score: 100},
      {name: "Chicken, broiler, breast, meat and skin, flour coated, fried", score: 100},
      {name: "Chicken, broiler, breast, meat, fried", score: 100},
      {name: "Chicken, broiler, breast, meat and skin, raw", score: 100},
      {name: "Chicken, broiler, breast, meat and skin, roasted", score: 100},
      {name: "Chicken, broiler, breast, skinless, boneless, meat, raw", score: 100},
      {name: "Chicken, broiler, breast, meat, roasted", score: 100},
      {name: "Fast foods, entree, chicken, breaded and fried, light meat (breast or wing)", score: 100}
    ],
    fdc: [
      {name: "Chicken breast tenders, breaded, uncooked", score: 448.684},
      {name: "Chicken breast, roll, oven-roasted", score: 448.684},
      {name: "Chicken, breast, boneless, skinless, raw", score: 448.684},
      {name: "Chicken, breast, meat and skin, raw", score: 448.684},
      {name: "Chicken breast tenders, breaded, cooked, microwaved", score: 417.93033},
      {name: "Oscar Mayer, Chicken Breast (honey glazed)", score: 417.93033},
      {name: "Chicken breast, deli, rotisserie seasoned, sliced, prepackaged", score: 391.13034},
      {name: "Chicken, broiler, rotisserie, BBQ, breast, meat and skin", score: 391.13034},
      {name: "Chicken, broilers or fryers, breast, meat and skin, raw", score: 391.13034},
      {name: "Chicken, broiler or fryers, breast, skinless, boneless, meat only, raw", score: 346.68893}
    ]
  },
  "broccoli": {
    cnf: [
      {name: "Broccoli, frozen, spears, unprepared", score: 500},
      {name: "Broccoli, frozen, spears, boiled, drained", score: 500},
      {name: "Broccoli, raw", score: 500},
      {name: "Broccoli, boiled, drained", score: 500},
      {name: "Broccoli, frozen, chopped, unprepared", score: 500},
      {name: "Broccoli, chinese, cooked", score: 500},
      {name: "Broccoli raab (rapini), raw", score: 500},
      {name: "Chicken breast with broccoli and cheese stuffing, frozen", score: 150},
      {name: "Fast foods, side dish, potato, baked, topped with cheese sauce and broccoli", score: 150},
      {name: "Soup, broccoli cheese, canned, condensed", score: 150},
      {name: "Stir fry with beef and broccoli", score: 150}
    ],
    fdc: [
      {name: "Broccoli, raw", score: 368.68448},
      {name: "Broccoli raab, cooked", score: 354.81375},
      {name: "Broccoli raab, raw", score: 354.81375},
      {name: "Broccoli, chinese, cooked", score: 336.8698},
      {name: "Broccoli, chinese, raw", score: 336.8698},
      {name: "Broccoli, leaves, raw", score: 336.8698},
      {name: "Broccoli, stalks, raw", score: 336.8698},
      {name: "Broccoli, flower clusters, raw", score: 310.12238},
      {name: "Babyfood, dinner, broccoli and chicken, junior", score: 287.32083}
    ]
  },
  "salmon": {
    cnf: [
      {name: "Salmonberry, raw", score: 500},
      {name: "Fish oil, salmon", score: 150},
      {name: "Fish, salmon, atlantic, wild, raw", score: 150},
      {name: "Fish, salmon, chinook (spring), smoked", score: 150},
      {name: "Fish, salmon, chinook (spring), raw", score: 150},
      {name: "Fish, salmon, sockeye (red), raw", score: 150},
      {name: "Fish, salmon, sockeye (red), baked or broiled", score: 150},
      {name: "Fish, salmon, atlantic, farmed, raw", score: 150},
      {name: "Fish, salmon, chum (keta), canned, drained solids with bone, unsalted", score: 150}
    ],
    fdc: [
      {name: "Fish oil, salmon", score: 358.02},
      {name: "Fish, salmon, chinook, raw", score: 329.59},
      {name: "Fish, salmon, chum, raw", score: 329.59},
      {name: "Fish, salmon, pink, raw", score: 329.59},
      {name: "Fish, salmon, sockeye, raw", score: 329.59},
      {name: "Salmon, smoked, Alaska Native", score: 311.27}
    ]
  }
};

/**
 * Structural Whole Foods Scoring Algorithm
 * No hardcoded keywords - only structural patterns
 */
function calculateWholeFoodScore(name, query, baseScore) {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const nameWords = name.toLowerCase().split(/[\s,]+/).filter(w => w.length > 0);
  const commaCount = (name.match(/,/g) || []).length;

  // Factor 1: Query Coverage (what % of the result is your search?)
  const matchedWords = queryWords.filter(qw => nameWords.some(nw => nw.includes(qw))).length;
  const coverageScore = (matchedWords / nameWords.length) * 100;

  // Factor 2: Structural Complexity (commas indicate organized attributes)
  const structureScore = (commaCount / Math.max(nameWords.length, 1)) * 100;

  // Factor 3: Compactness (shorter = simpler, usually)
  const compactScore = Math.max(0, 100 - name.length);

  // Factor 4: Query Proximity (are query words clustered together?)
  const queryWordIndices = nameWords
    .map((w, i) => queryWords.some(qw => w.includes(qw)) ? i : -1)
    .filter(i => i >= 0);

  const proximityScore = queryWordIndices.length > 0
    ? 100 - ((Math.max(...queryWordIndices) - Math.min(...queryWordIndices)) * 10)
    : 0;

  // Weighted combination
  const adjustedScore = baseScore + (coverageScore * 2) + structureScore + (compactScore * 0.5) + proximityScore;

  return {
    total: Math.round(adjustedScore),
    breakdown: {
      base: baseScore,
      coverage: Math.round(coverageScore * 2),
      structure: Math.round(structureScore),
      compact: Math.round(compactScore * 0.5),
      proximity: Math.round(proximityScore)
    }
  };
}

/**
 * Test the algorithm and show results
 */
function testScoring() {
  console.log("=".repeat(80));
  console.log("WHOLE FOODS SCORING ALGORITHM TEST");
  console.log("=".repeat(80));
  console.log("\n");

  for (const [query, sources] of Object.entries(testData)) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`QUERY: "${query}"`);
    console.log(`${"=".repeat(80)}\n`);

    for (const [source, items] of Object.entries(sources)) {
      console.log(`\n--- ${source.toUpperCase()} Results (Top 10) ---\n`);

      // Calculate new scores
      const scoredItems = items.map(item => ({
        ...item,
        newScore: calculateWholeFoodScore(item.name, query, item.score)
      }));

      // Sort by new total score
      const sorted = scoredItems.sort((a, b) => b.newScore.total - a.newScore.total);

      // Show top 10
      sorted.slice(0, 10).forEach((item, i) => {
        console.log(`${i + 1}. [${item.newScore.total}] ${item.name}`);
        console.log(`   Original: ${item.score} | Coverage: +${item.newScore.breakdown.coverage} | Structure: +${item.newScore.breakdown.structure} | Compact: +${item.newScore.breakdown.compact} | Proximity: +${item.newScore.breakdown.proximity}`);
        console.log();
      });
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("ANALYSIS COMPLETE");
  console.log("=".repeat(80));
}

// Run the test
testScoring();

/**
 * Prints the top food-search results for a few queries, to eyeball ranking.
 * Read-only.  npx tsx scripts/chat-eval/search-check.ts [query ...]
 */
import 'dotenv/config';
import { searchService } from '@/lib/search/search-service';

async function main() {
  const queries = process.argv.slice(2).length
    ? process.argv.slice(2)
    : ['egg', 'milk', 'bread', 'rice', 'cheese', 'chicken breast', '50%'];
  for (const q of queries) {
    const r = await searchService.searchFoods({ query: q, page: 1, limit: 6, sortBy: 'relevance', sortOrder: 'desc' });
    console.log(q.padEnd(15), '→', r.results.map((x) => x.name).join(' | ') || '(none)');
  }
  const p2 = await searchService.searchFoods({ query: 'a', page: 2, limit: 5, sortBy: 'name', sortOrder: 'asc' });
  console.log('page 2 of "a":', p2.results.length, 'results');
  process.exit(0);
}

main();

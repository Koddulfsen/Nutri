import 'dotenv/config';
import postgres from 'postgres';

/**
 * Verify Source Mapping Completeness
 *
 * All sources now use the compound_sources table.
 *
 * Usage:
 *   npx tsx scripts/verify-source.ts --source=FDC
 *   npx tsx scripts/verify-source.ts --source=DUKE
 *   npx tsx scripts/verify-source.ts  # all sources
 */

interface SourceReport {
  source: string;
  totalMappings: number;
  uniqueCompounds: number;
  byType: Record<string, number>;
  duplicates: number;
  hasCanonical: boolean;
  issues: string[];
}

async function verifySource(
  sql: postgres.Sql,
  source: string
): Promise<SourceReport> {
  const issues: string[] = [];

  // Total mappings
  const [{ total }] = await sql`
    SELECT COUNT(*) as total FROM compound_sources
    WHERE external_source = ${source}
  `;

  // Unique compounds
  const [{ unique_compounds }] = await sql`
    SELECT COUNT(DISTINCT compound_id) as unique_compounds FROM compound_sources
    WHERE external_source = ${source}
  `;

  // By compound type
  const byTypeRows = await sql`
    SELECT c.compound_type, COUNT(*) as count
    FROM compound_sources cs
    JOIN compounds c ON c.id = cs.compound_id
    WHERE cs.external_source = ${source}
    GROUP BY c.compound_type
    ORDER BY count DESC
  `;
  const byType: Record<string, number> = {};
  for (const row of byTypeRows) {
    byType[row.compound_type] = Number(row.count);
  }

  // Check for duplicates
  const [{ dupe_count }] = await sql`
    SELECT COUNT(*) as dupe_count FROM (
      SELECT external_id FROM compound_sources
      WHERE external_source = ${source}
      GROUP BY external_id
      HAVING COUNT(*) > 1
    ) dupes
  `;
  const duplicates = Number(dupe_count);
  if (duplicates > 0) {
    issues.push(`${duplicates} duplicate external_id entries`);
  }

  // Check for canonical mappings
  const [{ canonical_count }] = await sql`
    SELECT COUNT(*) as canonical_count FROM compound_sources
    WHERE external_source = ${source} AND is_canonical = true
  `;
  const hasCanonical = Number(canonical_count) > 0;
  if (!hasCanonical) {
    issues.push('No canonical mappings set');
  }

  return {
    source,
    totalMappings: Number(total),
    uniqueCompounds: Number(unique_compounds),
    byType,
    duplicates,
    hasCanonical,
    issues,
  };
}

function printReport(report: SourceReport) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`SOURCE: ${report.source}`);
  console.log(`${'─'.repeat(60)}`);

  console.log(`\nMappings:`);
  console.log(`  Total: ${report.totalMappings}`);
  console.log(`  Unique compounds: ${report.uniqueCompounds}`);
  if (report.duplicates > 0) {
    console.log(`  Duplicates: ${report.duplicates} ⚠️`);
  }
  console.log(`  Has canonical: ${report.hasCanonical ? 'Yes' : 'No ⚠️'}`);

  console.log(`\nBy compound type:`);
  const types = Object.entries(report.byType).sort((a, b) => b[1] - a[1]);
  for (const [type, count] of types.slice(0, 10)) {
    console.log(`  ${type}: ${count}`);
  }
  if (types.length > 10) {
    console.log(`  ... and ${types.length - 10} more types`);
  }

  if (report.issues.length > 0) {
    console.log(`\nIssues found:`);
    for (const issue of report.issues) {
      console.log(`  ⚠️  ${issue}`);
    }
  } else {
    console.log(`\nStatus: ✅ No issues found`);
  }
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL as string);

  // Parse args
  const args = process.argv.slice(2);
  const sourceArg = args.find(a => a.startsWith('--source='));
  const targetSource = sourceArg?.split('=')[1]?.toUpperCase();

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('SOURCE MAPPING VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════════════');

  // Get all sources
  const allSources = await sql`
    SELECT DISTINCT external_source FROM compound_sources ORDER BY external_source
  `;
  const sourceList = allSources.map(s => s.external_source as string);

  const reports: SourceReport[] = [];

  if (targetSource) {
    // Verify specific source
    if (sourceList.includes(targetSource)) {
      reports.push(await verifySource(sql, targetSource));
    } else {
      console.log(`\nUnknown source: ${targetSource}`);
      console.log(`Valid sources: ${sourceList.join(', ')}`);
      await sql.end();
      return;
    }
  } else {
    // Verify all sources
    console.log(`\nVerifying ${sourceList.length} sources...\n`);

    for (const source of sourceList) {
      reports.push(await verifySource(sql, source));
    }
  }

  // Print reports
  for (const report of reports) {
    printReport(report);
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const totalMappings = reports.reduce((sum, r) => sum + r.totalMappings, 0);
  const sourcesWithIssues = reports.filter(r => r.issues.length > 0);

  console.log(`Sources verified: ${reports.length}`);
  console.log(`Total mappings: ${totalMappings}`);
  console.log(`Sources with issues: ${sourcesWithIssues.length}`);

  if (sourcesWithIssues.length > 0) {
    console.log('\nSources needing attention:');
    for (const r of sourcesWithIssues) {
      console.log(`  - ${r.source}: ${r.issues.join(', ')}`);
    }
  } else {
    console.log('\n✅ All sources verified successfully');
  }

  await sql.end();
}

main().catch(console.error);

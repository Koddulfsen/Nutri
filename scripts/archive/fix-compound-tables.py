#!/usr/bin/env python3
"""
Fix compound mapping tables to ensure all have exactly 18 source rows
(+2 for contaminants: FDA TDS and EFSA Occurrence).
Preserves existing data while adding missing source rows in the correct order.
"""

import re

# The canonical 18 sources in order, with their Type column value
SOURCES = [
    ("FDC", "API"),
    ("CNF", "API"),
    ("AFCD", "CSV"),
    ("CoFID", "CSV"),
    ("CIQUAL", "CSV"),
    ("FOODfiles", "CSV"),
    ("Fineli", "CSV"),
    ("BLS", "CSV"),
    ("NEVO", "CSV"),
    ("Matvaretabellen", "API"),
    ("FRIDA", "CSV"),
    ("MEXT", "CSV"),
    ("KFCT", "CSV"),
    ("INDB", "CSV"),
    ("ASEANFOODS", "CSV"),
    ("FooDB", "API"),
    ("Phenol-Explorer", "CSV"),
    ("Duke's", "Web"),
]

# Extra sources for contaminants (placed before the 18 standard ones)
CONTAMINANT_SOURCES = [
    ("FDA TDS", "CSV"),
    ("EFSA Occurrence", "CSV"),
]

EMPTY_ROW_TEMPLATE = "| {source} | | | | | | {type} | |"


def parse_source_name(row):
    """Extract source name from a table row."""
    match = re.match(r'\|\s*([^|]+?)\s*\|', row)
    if match:
        return match.group(1).strip()
    return None


def is_table_row(line):
    """Check if a line is a markdown table data row (not header or separator)."""
    stripped = line.strip()
    if not stripped.startswith('|'):
        return False
    if 'Source' in stripped and '✓' in stripped:
        return False
    if re.match(r'\|[-\s|]+\|', stripped):
        return False
    return True


def is_table_header(line):
    stripped = line.strip()
    return stripped.startswith('|') and 'Source' in stripped and '✓' in stripped


def is_table_separator(line):
    stripped = line.strip()
    return bool(re.match(r'\|\s*[-:]+\s*(\|\s*[-:]+\s*)+\|', stripped))


def fix_file(filepath):
    """Fix all compound tables in a file."""
    with open(filepath, 'r') as f:
        content = f.read()

    lines = content.split('\n')
    result = []
    i = 0
    compounds_fixed = 0
    is_contaminants = 'contaminant' in filepath.lower()

    while i < len(lines):
        line = lines[i]

        if is_table_header(line):
            result.append(line)
            i += 1

            if i < len(lines) and is_table_separator(lines[i]):
                result.append(lines[i])
                i += 1
            else:
                continue

            # Collect existing data rows
            existing_rows = {}
            while i < len(lines) and is_table_row(lines[i]):
                source_name = parse_source_name(lines[i])
                if source_name:
                    existing_rows[source_name] = lines[i]
                i += 1

            # Build the desired source list for this file
            desired = list(CONTAMINANT_SOURCES) + list(SOURCES) if is_contaminants else list(SOURCES)

            # Check if anything is missing
            desired_names = {s[0] for s in desired}
            existing_names = set(existing_rows.keys())
            missing = desired_names - existing_names

            if missing:
                compounds_fixed += 1

            # Output rows in canonical order
            for source_name, source_type in desired:
                if source_name in existing_rows:
                    result.append(existing_rows[source_name])
                else:
                    result.append(EMPTY_ROW_TEMPLATE.format(
                        source=source_name, type=source_type))
        else:
            result.append(line)
            i += 1

    output = '\n'.join(result)
    with open(filepath, 'w') as f:
        f.write(output)

    return compounds_fixed


if __name__ == '__main__':
    files = [
        '/home/kodd/Nutri/docs/compound-mappings/03-macronutrients.md',
        '/home/kodd/Nutri/docs/compound-mappings/04-vitamins.md',
        '/home/kodd/Nutri/docs/compound-mappings/05-minerals.md',
        '/home/kodd/Nutri/docs/compound-mappings/09-contaminants.md',
    ]

    total_fixed = 0
    for filepath in files:
        fixed = fix_file(filepath)
        total_fixed += fixed
        print(f"{filepath.split('/')[-1]}: {fixed} compound tables fixed")

    print(f"\nTotal: {total_fixed} compound tables fixed")

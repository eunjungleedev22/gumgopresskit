/**
 * Fetches and parses a public Google Sheets tab as CSV.
 *
 * How to get your URLs:
 *   1. Open the Google Sheet → File → Share → "Publish to web"
 *   2. Choose the tab, choose "Comma-separated values (.csv)", click Publish.
 *   3. Copy the URL — it looks like:
 *      https://docs.google.com/spreadsheets/d/{SHEET_ID}/pub?gid={GID}&single=true&output=csv
 *
 * Alternatively use the export URL pattern (no need to publish):
 *   https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={GID}
 *   (Sheet must be set to "Anyone with the link can view")
 */

export type Row = Record<string, string>;

function parseCSV(raw: string): Row[] {
  const rows = splitCSVRows(raw.trim());
  if (rows.length < 2) return [];

  const headers = splitCSVLine(rows[0]).map((h) => h.trim().toLowerCase());

  return rows.slice(1).map((row) => {
    const values = splitCSVLine(row);
    return headers.reduce<Row>((acc, header, i) => {
      acc[header] = (values[i] ?? '').trim();
      return acc;
    }, {});
  });
}

/** Splits CSV into rows, respecting quoted fields that span multiple lines. */
function splitCSVRows(raw: string): string[] {
  const rows: string[] = [];
  let current = '';
  let inQuote = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '"') {
      if (inQuote && raw[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuote = !inQuote;
        current += ch;
      }
    } else if (!inQuote && (ch === '\r' || ch === '\n')) {
      if (ch === '\r' && raw[i + 1] === '\n') i++;
      rows.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current) rows.push(current);
  return rows;
}

/** Handles quoted fields with commas or newlines inside them. */
function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuote = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === ',' && !inQuote) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export async function fetchSheet(csvUrl: string): Promise<Row[]> {
  const res = await fetch(csvUrl, {
    cache: 'default',                      // respect server Cache-Control; don't force bypass
    signal: AbortSignal.timeout(10_000),   // bail after 10 s instead of hanging forever
  });
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status} ${res.statusText}`);
  const text = await res.text();
  return parseCSV(text);
}

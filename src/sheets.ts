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

/**
 * Only Google's own sheet hosts may be used as a data source.
 * `docs.google.com` redirects published CSVs to `*.googleusercontent.com`,
 * which the browser follows on its own — that hop is allowed by the CSP, not here.
 */
const ALLOWED_HOSTS = new Set(['docs.google.com']);

/**
 * Reject anything that is not an https Google Sheets URL. The CSV URLs come
 * from build-time env vars, so this guards against a misconfigured or
 * tampered-with .env pointing the site at an attacker-controlled origin.
 */
function assertAllowed(csvUrl: string): URL {
  let u: URL;
  try {
    u = new URL(csvUrl);
  } catch {
    throw new Error('Sheet URL is not a valid URL');
  }
  if (u.protocol !== 'https:') throw new Error('Sheet URL must use https');
  if (!ALLOWED_HOSTS.has(u.hostname)) throw new Error(`Sheet host not allowed: ${u.hostname}`);
  return u;
}

/** Hard cap so a runaway response cannot exhaust memory. */
const MAX_BYTES = 2_000_000;

/**
 * Read a response body while enforcing MAX_BYTES as it streams, so an oversized
 * response is abandoned mid-flight instead of being fully buffered first.
 */
async function readCapped(res: Response): Promise<string> {
  const declared = Number(res.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BYTES) {
    throw new Error('Sheet response too large');
  }

  if (!res.body) return res.text();

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) throw new Error('Sheet response too large');
      chunks.push(decoder.decode(value, { stream: true }));
    }
  } finally {
    // Releases the connection whether we finished or bailed early
    await reader.cancel().catch(() => {});
  }

  chunks.push(decoder.decode());
  return chunks.join('');
}

export async function fetchSheet(csvUrl: string): Promise<Row[]> {
  const url = assertAllowed(csvUrl);

  const res = await fetch(url, {
    cache: 'default',                      // respect server Cache-Control; don't force bypass
    redirect: 'follow',
    credentials: 'omit',                   // never attach cookies to a third-party origin
    signal: AbortSignal.timeout(10_000),   // bail after 10 s instead of hanging forever
  });
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status} ${res.statusText}`);

  return parseCSV(await readCapped(res));
}

import { publicSourceUrl } from '@/lib/admin/input';
import { statuses } from '@/lib/directory/types';
import { appleId, ImportError } from './apple.ts';

export type Proposal = {
  source_url: string;
  proposed_status: string;
  evidence_summary: string;
  announced_at: string;
  support_version: string;
};
export type ImportInput = {
  number: number;
  url: string;
  appStoreId: string | null;
  proposal: Proposal;
  error: string | null;
};
const columns = [
  'app_store_url',
  'source_url',
  'proposed_status',
  'evidence_summary',
  'announced_at',
  'support_version',
];

function csvRecords(text: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [],
    value = '',
    quoted = false,
    closed = false;
  const cell = () => {
    row.push(value);
    value = '';
    closed = false;
  };
  const record = () => {
    cell();
    if (row.some((item) => item.trim())) records.push(row);
    row = [];
    if (records.length > 201) throw new ImportError('tooManyRows');
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          value += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else value += ch;
    } else if (ch === ',') cell();
    else if (ch === '\r' || ch === '\n') {
      record();
      if (ch === '\r' && text[i + 1] === '\n') i++;
    } else if (ch === '"' && !value && !closed) quoted = true;
    else {
      if (ch === '"' || closed) throw new ImportError('malformedCsv');
      value += ch;
    }
  }
  if (quoted) throw new ImportError('malformedCsv');
  if (value || closed || row.length) record();
  return records;
}

export function parseImport(raw: unknown, mode: unknown): ImportInput[] {
  if (typeof raw !== 'string' || Buffer.byteLength(raw, 'utf8') > 524288)
    throw new ImportError('tooLarge');
  if (mode !== 'csv' && mode !== 'urls') throw new ImportError('invalidInput');
  const text = raw.replace(/^\uFEFF/, '');
  let headers = ['app_store_url'];
  let rows: string[][];
  if (mode === 'csv') {
    rows = csvRecords(text);
    headers = (rows.shift() ?? []).map((item) => item.trim());
    if (
      !headers.includes('app_store_url') ||
      new Set(headers).size !== headers.length ||
      headers.some((key) => !columns.includes(key))
    )
      throw new ImportError('headers');
  } else
    rows = text
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .map((line) => [line]);
  if (!rows.length) throw new ImportError('empty');
  if (rows.length > 200) throw new ImportError('tooManyRows');
  return rows.map((row, index) => {
    const data = Object.fromEntries(headers.map((key, i) => [key, (row[i] ?? '').trim()]));
    const result: ImportInput = {
      number: index + 1,
      url: (data.app_store_url ?? '').slice(0, 2000),
      appStoreId: null,
      proposal: {
        source_url: '',
        proposed_status: '',
        evidence_summary: '',
        announced_at: '',
        support_version: '',
      },
      error: null,
    };
    if (row.length !== headers.length) return { ...result, error: 'columns' };
    try {
      result.appStoreId = appleId(data.app_store_url);
    } catch {
      return { ...result, error: 'invalidUrl' };
    }
    try {
      const source = data.source_url ? publicSourceUrl(data.source_url) : '';
      const status = data.proposed_status ?? '';
      const date = data.announced_at ?? '';
      const quote = data.evidence_summary ?? '';
      const version = data.support_version ?? '';
      if (
        (status && !statuses.includes(status as (typeof statuses)[number])) ||
        quote.length > 4000 ||
        version.length > 100 ||
        (date &&
          (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
            !Number.isFinite(Date.parse(date)) ||
            new Date(date).toISOString().slice(0, 10) !== date))
      )
        throw new Error();
      result.proposal = {
        source_url: source,
        proposed_status: status,
        evidence_summary: quote,
        announced_at: date,
        support_version: version,
      };
    } catch {
      result.error = 'invalidProposal';
    }
    return result;
  });
}

/**
 * CSV export utility — converts an array of objects into a downloadable CSV file.
 */
export function exportToCSV<T extends object>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) {
  if (data.length === 0) return;

  const cols = columns || Object.keys(data[0]).map(k => ({ key: k as keyof T, label: String(k) }));
  const header = cols.map(c => `"${String(c.label)}"`).join(',');
  const rows = data.map(row =>
    cols.map(c => {
      const val = row[c.key];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * CSV import utility — parses a CSV string into an array of objects.
 * First row is treated as headers.
 */
export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  });
}

/**
 * Trigger file picker and return CSV text content.
 */
export function importCSVFile(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) { reject(new Error('No file selected')); return; }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    };
    input.click();
  });
}

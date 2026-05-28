function escapeCsvCell(value: string): string {
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function tableToCsv(table: HTMLTableElement): string {
  const rows = Array.from(table.querySelectorAll("tr"));
  const lines: string[] = [];

  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll("th,td"));
    const values = cells.map((c) =>
      escapeCsvCell((c.textContent ?? "").trim().replace(/\s+/g, " ")),
    );
    if (values.length) lines.push(values.join(","));
  }

  return lines.join("\n");
}

export function downloadTextFile(params: {
  filename: string;
  content: string;
  mimeType: string;
}): void {
  const blob = new Blob([params.content], { type: params.mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = params.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportTableAsCsv(params: {
  tableId: string;
  filename: string;
}): void {
  const el = document.getElementById(params.tableId);
  if (!el) throw new Error(`Table not found: ${params.tableId}`);
  const table = el as HTMLTableElement;
  const csv = tableToCsv(table);
  downloadTextFile({
    filename: params.filename,
    content: csv,
    mimeType: "text/csv;charset=utf-8",
  });
}


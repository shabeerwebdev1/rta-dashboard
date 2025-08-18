function convertToCSV(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) {
    return "";
  }

  // Dynamically get headers from the first object's keys
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];

  for (const row of data) {
    const values = headers.map((header) => {
      let cellValue = row[header];

      if (cellValue === null || cellValue === undefined) {
        return '""';
      }

      // Handle objects by JSON stringifying them
      if (typeof cellValue === "object") {
        cellValue = JSON.stringify(cellValue);
      }

      // Escape double quotes and wrap in double quotes
      const stringValue = String(cellValue).replace(/"/g, '""');
      return `"${stringValue}"`;
    });
    csvRows.push(values.join(","));
  }

  // Add BOM for Excel compatibility
  return "\uFEFF" + csvRows.join("\n");
}

export function exportToCsv(data: Record<string, unknown>[], filename: string) {
  if (!data || data.length === 0) {
    console.error("No data provided to export.");
    return;
  }
  const csvString = convertToCSV(data);
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
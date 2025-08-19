function convertToCSV(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) {
    return "";
  }

  const headers = ["key", "tradeLicenseName", "licenseNumber", "addedBy", "type", "date", "status", "location"];

  const csvRows = [headers.join(",")];

  for (const row of data) {
    const values = headers.map((header) => {
      let cellValue = row[header];

      if (cellValue === null || cellValue === undefined) {
        return '""';
      }

      if (header === "location" && typeof cellValue === "object" && cellValue !== null) {
        const location = cellValue as { lat: number; lng: number };
        cellValue = `"${location.lat}, ${location.lng}"`;
      } else {
        const stringValue = String(cellValue).replace(/"/g, '""');
        cellValue = `"${stringValue}"`;
      }

      return cellValue;
    });
    csvRows.push(values.join(","));
  }

  return "\uFEFF" + csvRows.join("\n");
}

export function exportToCsv(data: Record<string, unknown>[], filename: string) {
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

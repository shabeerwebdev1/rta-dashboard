import type { WhitelistRecord } from "../types";

function convertToCSV(data: WhitelistRecord[]): string {
  if (!data || data.length === 0) {
    return "";
  }

  const headers = [
    "key",
    "tradeLicenseName",
    "licenseNumber",
    "addedBy",
    "type",
    "date",
    "status",
    "location",
  ];

  const csvRows = [headers.join(",")];

  for (const row of data) {
    const values = headers.map((header) => {
      let cellValue = (row as any)[header];

      if (cellValue === null || cellValue === undefined) {
        return '""';
      }

      if (header === "location" && typeof cellValue === "object") {
        cellValue = `"${cellValue.lat}, ${cellValue.lng}"`;
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

export function exportToCsv(data: WhitelistRecord[], filename: string) {
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

interface PageSearchConfig {
  globalSearchKeys: string[];
  columnFilterKeys: string[];
  dateRangeKey: string;
}

export const searchConfig: Record<string, PageSearchConfig> = {
  "whitelist-plates": {
    globalSearchKeys: ["plateNumber", "plateSource"],
    columnFilterKeys: ["plateSource", "plateType", "plateColor", "plateStatus"],
    dateRangeKey: "fromDate",
  },
  "dispute-management": {
    globalSearchKeys: ["plateNumber", "plateSource"],
    columnFilterKeys: ["plateSource", "plateType", "plateColor", "plateStatus"],
    dateRangeKey: "fromDate",
  },
  fines: {
    globalSearchKeys: ["plateNumber", "plateSource"],
    columnFilterKeys: ["plateSource", "plateType", "plateColor", "plateStatus"],
    dateRangeKey: "fromDate",
  },
  "inspection-obstacles": {
    globalSearchKeys: ["plateNumber", "plateSource"],
    columnFilterKeys: ["plateSource", "plateType", "plateColor", "plateStatus"],
    dateRangeKey: "fromDate",
  },
  permits: {
    globalSearchKeys: ["plateNumber", "plateSource"],
    columnFilterKeys: ["plateSource", "plateType", "plateColor", "plateStatus"],
    dateRangeKey: "fromDate",
  },
  pledges: {
    globalSearchKeys: ["plateNumber", "plateSource"],
    columnFilterKeys: ["plateSource", "plateType", "plateColor", "plateStatus"],
    dateRangeKey: "fromDate",
  },
  parkonic: {
    globalSearchKeys: ["plateNumber", "plateSource"],
    columnFilterKeys: ["plateSource", "plateType", "plateColor", "plateStatus"],
    dateRangeKey: "fromDate",
  },
  "whitelist-tradelicenses": {
    globalSearchKeys: ["tradeLicenseNumber", "tradeLicense_EN_Name"],
    columnFilterKeys: ["plateStatus"],
    dateRangeKey: "fromDate",
  },
};

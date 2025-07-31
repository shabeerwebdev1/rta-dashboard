export interface WhitelistRecord {
  key: string;
  tradeLicenseName: string;
  licenseNumber: string;
  date: string;
  location: { lat: number; lng: number };
  status: "Active" | "Expired" | "Pending";
  type: "Trade" | "Plate";
  addedBy: string;
  priority: boolean;
}

export interface PledgeFormValues {
  tradeLicenseNumber: string;
  tradeLicenseName: string;
  businessName: string;
  pledgeType: string;
  fromDate: string | Date;
  toDate?: string | Date;
  documents: Array<{
    file: File;
    type: string;
  }>;
  remarks?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface PledgeRecord {
  id: string;
  tradeLicenseNumber: string;
  tradeLicenseName: string;
  businessName: string;
  pledgeType: "Individual" | "Corporate" | "Government"; // Adjust as needed
  fromDate: string | Date;
  toDate: string | Date;
  status: "Active" | "Expired" | "Pending" | "Revoked"; // Adjust as needed
  createdBy: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  documents: Array<{
    id: string;
    url: string;
    type: "license" | "contract" | "other"; // Adjust as needed
    name: string;
  }>;
  remarks?: string;
}

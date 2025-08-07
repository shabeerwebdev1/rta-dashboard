export interface FineRecord {
  id: string;
  fineNumber: string;
  inspectorDeviceNumber: string;
  assignedArea: string;
  fineType: string;
  fineAmount: number;
  status: "Issued" | "Paid" | "Disputed";
  issueDate: string;
  location: {
    lat: number;
    lng: number;
  };
  vehicleDetails: {
    plateNumber: string;
    vehicleType: string;
  };
}

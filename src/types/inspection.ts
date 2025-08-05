// types/inspection.ts
export interface InspectionRecord {
  key: string;
  obstacleNumber: string;
  zone: string;
  area: string;
  obstacleSource: string;
  paymentDevice: string;
  status: "Open" | "Resolved" | "Pending";
  date: string;
  addedBy: string;
  priority: boolean;
  comments: string;
  location: {
    lat: number;
    lng: number;
  };
  photo?: string;
}

export interface InspectionFormValues {
  zone: string;
  area: string;
  obstacleSource: string;
  paymentDevice: string;
  priority?: boolean;
  comments?: string;
  document?: any;
}

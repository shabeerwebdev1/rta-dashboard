export type ParkonicStatus = "Approved" | "Rejected";

export type ParkonicType = "Parkonic" | "RTA" | "Other";

export type ParkonicDocument = {
  id: string;
  name: string;
  url: string;
};

export type ParkonicRecord = {
  [x: string]: any;
  id: string;
  fineNumber: string;
  issuedBy: string;
  fineAmount: number;
  type: ParkonicType;
  status: ParkonicStatus;
  issuedDate: string;
  location: {
    lat: number;
    lng: number;
  };
  documents?: ParkonicDocument[];
};

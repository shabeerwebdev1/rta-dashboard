export interface IResponseWrapper<T> {
  statusCode: number;
  en_Msg: string | null;
  ar_Msg: string | null;
  data: T;
  successful: boolean;
  validationErrors: IValidationErrors[] | null;
  haveValidationErrors: boolean;
}

export interface IValidationErrors {
  type: number;
  fieldName: string | null;
  enMessage: string | null;
  arMessage: string | null;
}

export interface WhitelistPlateRequestDto {
  [x: string]: any;
  plateNumber: string;
  plateSource: string;
  plateType: string;
  plateColor: string;
  fromDate: string;
  toDate: string;
  plateStatus: string;
  exemptionReason_ID: number;
  exemptionReason_EN: number;
  exemptionReason_AR: number;
}

export interface WhitelistPlateUpdateDto extends WhitelistPlateRequestDto {
  id: number;
}

export interface WhitelistPlateResponseDto {
  id: number;
  plateNumber: string | null;
  plateSource: string | null;
  plateType: string | null;
  plateColor: string | null;
  fromDate: string | null;
  toDate: string | null;
  plateStatus: string | null;
  exemptionReason_ID: number | null;
  exemptionReason_EN: number | null;
  exemptionReason_AR: number | null;
}

export interface WhitelistTradeLicenseRequestDto {
  [x: string]: any;
  tradeLicenseNumber: string;
  tradeLicense_EN_Name: string;
  tradeLicense_AR_Name: string;
  plotNumber: string;
  fromDate: string;
  toDate: string;
  plateStatus: string;
  exemptionReasonId: number;
  exemptionReason_EN: number;
  exemptionReason_AR: number;
}

export interface WhitelistTradeLicenseUpdateDto
  extends WhitelistTradeLicenseRequestDto {
  id: number;
}

export interface WhitelistTradeLicenseResponseDto {
  id: number;
  tradeLicenseNumber: string | null;
  tradeLicense_EN_Name: string | null;
  tradeLicense_AR_Name: string | null;
  plotNumber: string | null;
  fromDate: string | null;
  toDate: string | null;
  plateStatus: string | null;
  exemptionReason_ID: number;
  exemptionReason_EN: number | null;
  exemptionReason_AR: number | null;
}

export interface PledgeRequestDto {
  id: number;
  pledgeNumber: string;
  pledgeType: string;
  tradeLicenseNumber: string;
  businessName: string;
  remarks: string;
  documentUploaded: true;
  documentPath: string;
  submittedBy: string;
  [x: string]: any;
}

export interface PledgeResponseDto {
  [x: string]: any;
  id: number;
  pledgeNumber: string | null;
  pledgeType: string | null;
  tradeLicenseNumber: string | null;
  businessName: string | null;
  remarks: string | null;
  documentUploaded: true | null;
  documentPath: string | null;
  submittedBy: string | null;
}

export interface PledgeUpdateDto extends PledgeRequestDto {
  id: number;
}

export interface InspectionObstacleRequestDto {
  ObstacleNumber: string;
  Zone: string;
  Area: string;
  SourceOfObstacle: string;
  ClosestPaymentDevice: string;
  Photos: string[]; 
  Comments: string;
  ReportedBy: string;
}

export interface InspectionObstacleResponseDto {
  id: number;
  ObstacleNumber: string | null;
  Zone: string | null;
  Area: string | null;
  SourceOfObstacle: string | null;
  ClosestPaymentDevice: string | null;
  Photos: string[] | null;
  Comments: string | null;
  ReportedBy: string | null;
}

export interface InspectionObstacleUpdateDto {
  id: number;
  ObstacleNumber: string;
  Zone: string;
  Area: string;
  SourceOfObstacle: string;
  ClosestPaymentDevice: string;
  Photos: string[];
  Comments: string;
  ReportedBy: string;
}


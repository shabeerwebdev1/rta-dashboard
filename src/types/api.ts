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
  plateNumber: string;
  plateSource: string;
  plateType: string;
  plateColor: string;
  fromDate: string;
  toDate: string;
  plateStatus: string;
  exemptionReason_ID: number;
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
}

export interface WhitelistTradeLicenseRequestDto {
  tradeLicenseNumber: string;
  tradeLicense_EN_Name: string;
  tradeLicense_AR_Name: string;
  plotNumber: string;
  fromDate: string;
  toDate: string;
  plateStatus: string;
  exemptionReason_ID: number;
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
  exemptionReason_ID: number | null;
}

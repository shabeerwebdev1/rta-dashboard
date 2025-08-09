import type { Rule } from "antd/es/form";

export type FormFieldType =
  | "text"
  | "textarea"
  | "select"
  | "date"
  | "dateRange"
  | "file"
  | "hidden";
export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  span: number;
  options?: string[] | { label: string; value: any }[];
  rules?: Rule[];
  fieldMapping?: { from: string; to: string };
  fileCategory?: string;
  dependencies?: string[];
  hidden?: (formValues: any) => boolean;
  responseKey?: string;
  validationType?: "plateNumber" | "alphanumeric_hyphen_uppercase" | "arabic";
  disablePastDates?: boolean;
  showLabel?: boolean;
}

export interface FormConfig {
  modalWidth: string;
  fields: FormField[];
}

export type TableColumnType = "string" | "date" | "tag" | "badge";

export interface TableColumn {
  key: string;
  title: string;
  type: TableColumnType;
  options?: Record<string, string>;
}

export interface TableConfig {
  columns: TableColumn[];
  viewRecord: boolean;
}
export interface PageConfig {
  key: string;
  title: string;
  name: {
    singular: string;
    plural: string;
  };
  api: {
    get: string;
    post: string;
    postContentType?: "application/json" | "multipart/form-data";
    put: string;
    putContentType?: "application/json" | "multipart/form-data";
    delete: string;
    search?: string;
  };
  tableConfig: TableConfig;
  formConfig: FormConfig;
}

import type { Rule } from "antd/es/form";
import type { ReactNode } from "react";

export type FormFieldType = "text" | "textarea" | "select" | "date" | "dateRange" | "file" | "hidden" | "email";

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  span: number;
  options?: string[] | { label: string; value: unknown }[];
  rules?: Rule[];
  fieldMapping?: { from: string; to: string };
  fileCategory?: string;
  dependencies?: string[];
  hidden?: (formValues: Record<string, unknown>) => boolean;
  responseKey?: string;
  validationType?: "plateNumber" | "alphanumeric_hyphen_uppercase" | "arabic";
  disablePastDates?: boolean;
  showLabel?: boolean;
}

export interface FormConfig {
  modalWidth: string;
  fields: FormField[];
}

export type TableColumnType = "string" | "date" | "tag" | "badge" | "select" | "custom";

export interface TableColumn {
  key: string;
  title: string;
  type: TableColumnType;
  options?: string[] | { label: string; value: unknown }[];
  filterable?: boolean;
  sortable?: boolean;
  render?: (text: any, record: any) => React.ReactNode;
}

export interface TableConfig {
  columns: TableColumn[];
  viewRecord: boolean;
  rowKey?: string;
  showEdit?: boolean;
}

export interface StatConfig {
  title: string;
  icon: ReactNode;
  value: (data: any[]) => number | string;
  color?: string;
}

export interface SearchConfig {
  globalSearchKeys: string[];
  columnFilterKeys: string[];
  dateRangeKey: string;
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
  searchConfig?: SearchConfig;
  tableConfig: TableConfig;
  formConfig: FormConfig;
  statsConfig?: StatConfig[];
}
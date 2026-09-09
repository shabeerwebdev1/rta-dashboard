import type { Rule } from "antd/es/form";
import { ColumnsType, ColumnType } from "antd/es/table";
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
  dataIndex?: string;
  width?: number | string;
  align?: string;
  sortable?: boolean;
  render?: (text: any, record: any) => React.ReactNode;
}

export interface TableConfig {
  columns: ColumnsType[];
  viewRecord: boolean;
  rowKey?: string;
  showEdit?: boolean;
}

export interface StatConfig {
  title: string;
  icon: ReactNode;
  value: (data: any[], metadata?: any) => number | string; // ✅ Add optional metadata parameter
  color?: string;
}

export interface SearchConfig {
  globalSearchKeys: string[];
  columnFilterKeys: string[];
  dateRangeKey: string;
  filterKeyMap?: Record<string, string>;
}
export interface AppColumn<T = any> extends ColumnType<T> {
  type?: "string" | "date" | "badge" | "tag" | "ReactNode" | "number" | "custom" | "select";
  sortable?: boolean;
  filterable?: boolean;
  lookupCategory?: number;
}

export type AppColumns<T = any> = AppColumn<T>[];

export interface PageConfig<T = any> {
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
  tableConfig: {
    rowKey: string | undefined;
    columns: AppColumns<T>;
  };
  formConfig: FormConfig;
  statsConfig?: StatConfig[];
}

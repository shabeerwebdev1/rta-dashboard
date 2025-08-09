import type { Rule } from "antd/es/form";

/**
 * Defines the type of an input field in a dynamically generated form.
 */
export type FormFieldType =
  | "text"
  | "textarea"
  | "select"
  | "date"
  | "dateRange"
  | "file"
  | "hidden";

/**
 * Configuration for a single field within a dynamic form.
 */
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
}

/**
 * Defines the overall configuration for a dynamic form, typically within a modal.
 */
export interface FormConfig {
  modalWidth: string;
  fields: FormField[];
}

/**
 * Defines how a data property should be rendered in a dynamic table column.
 */
export type TableColumnType = "string" | "date" | "tag" | "badge";

/**
 * Configuration for a single column in a dynamic table.
 */
export interface TableColumn {
  key: string;
  title: string;
  type: TableColumnType;
  options?: Record<string, string>;
}

/**
 * Defines the overall configuration for a dynamic table.
 */
export interface TableConfig {
  columns: TableColumn[];
  viewRecord: boolean;
}

/**
 * The master configuration object for a dynamic CRUD page.
 * This object drives the behavior of DynamicPage, DynamicTable, DynamicForm, etc.
 */
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
    put: string;
    delete: string;
    search?: string;
  };
  tableConfig: TableConfig;
  formConfig: FormConfig;
}

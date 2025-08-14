import type { PageConfig } from "../../types/config";

export const disputeManagementConfig: PageConfig = {
  key: "dispute-management",
  title: "page.title.dispute-management",
  name: { singular: "Dispute", plural: "Disputes" },
  api: {
    get: "/api/Dispute/GetAll",
    post: "/api/Dispute/Create",
    put: "/api/Dispute/Update",
    delete: "",
  },

  tableConfig: {
    columns: [
      {
        key: "department",
        title: "form.department",
        type: "select",
        options: [
          { label: "Parking", value: 1 },
          { label: "Traffic", value: 2 },
          { label: "Finance", value: 3 },
          { label: "Enforcement", value: 4 },
        ],
      },
      {
        key: "payment_Type",
        title: "form.paymentType",
        type: "select",
        options: [
          { label: "Cash", value: 1 },
          { label: "Credit Card", value: 2 },
          { label: "Online", value: 3 },
        ],
      },
      { key: "phone", title: "form.phoneNumber", type: "string" },
      { key: "crM_Ref", title: "form.crmReference", type: "string" },
    ],

    viewRecord: true,
    showEdit: false,
  },

  formConfig: {
    modalWidth: "720px",
    fields: [
      {
        name: "fine_Number",
        label: "form.fineNumber",
        type: "text",
        required: true,
        span: 12,
      },
      {
        name: "department",
        label: "form.department",
        type: "select",
        required: true,
        span: 12,
        options: [
          { label: "Parking", value: 1 },
          { label: "Traffic", value: 2 },
          { label: "Finance", value: 3 },
          { label: "Enforcement", value: 4 },
        ],
      },
      {
        name: "payment_Type",
        label: "form.paymentType",
        type: "select",
        required: true,
        span: 12,
        options: [
          { label: "Cash", value: 1 },
          { label: "Credit Card", value: 2 },
          { label: "Online", value: 3 },
        ],
      },
      {
        name: "dispute_Reason",
        label: "form.reason",
        type: "text",
        required: true,
        span: 12,
      },
      {
        name: "crM_Ref",
        label: "form.crmReference",
        type: "text",
        required: true,
        span: 12,
      },
      {
        name: "email",
        label: "form.email",
        type: "email",
        required: true,
        span: 12,
      },
      {
        name: "phone",
        label: "form.phoneNumber",
        type: "text",
        required: false,
        span: 12,
      },
      {
        name: "address",
        label: "form.address",
        type: "textarea",
        required: true,
        span: 24,
      },
    ],
  },
};

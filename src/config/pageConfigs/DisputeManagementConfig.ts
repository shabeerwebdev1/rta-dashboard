import type { PageConfig } from "../../types/config";

export const disputeManagementConfig: PageConfig = {
  key: "dispute-management",
  title: "page.title.dispute-management",
  name: { singular: "Dispute", plural: "Disputes" },
  // api: {
  //   get: "/api/Dispute",
  //   post: "/api/Dispute",
  //   put: "/api/Dispute/:id",
  //   delete: "/api/Dispute/:id",
  // },

  api: {
    get: "/api/Pledge",
    post: "/api/Pledge",
    put: "/api/Pledge/:id",
    delete: "/api/Pledge/:id",
  },
  tableConfig: {
    columns: [
      { key: "department", title: "form.department", type: "string" },
      { key: "paymentType", title: "form.paymentType", type: "string" },
      { key: "phoneNumber", title: "form.phoneNumber", type: "string" },
      { key: "crmReference", title: "form.crmReference", type: "string" },
    ],
    viewRecord: true,
  },
  formConfig: {
    modalWidth: "720px",
    fields: [
      {
        name: "department",
        label: "form.department",
        type: "select",
        required: true,
        span: 12,
        options: ["Finance", "Customer Service", "Legal", "Technical Support"],
      },
      {
        name: "paymentType",
        label: "form.paymentType",
        type: "select",
        required: true,
        span: 12,
        options: ["Credit Card", "Debit Card", "Cash", "Online Transfer"],
      },
      {
        name: "reason",
        label: "form.reason",
        type: "text",
        required: true,
        span: 12,
      },
      {
        name: "crmReference",
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
        name: "phoneNumber",
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

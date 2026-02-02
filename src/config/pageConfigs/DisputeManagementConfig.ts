import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import type { PageConfig } from "../../types/config";
import React from "react";
import dayjs from "dayjs";

export const disputeManagementConfig: PageConfig = {
  key: "dispute-management",
  title: "page.title.dispute-management",
  name: { singular: "entity.dispute", plural: "Disputes" },
  api: {
    get: "/api/Dispute/GetAll",
    post: "/api/Dispute/Create",
    put: "/api/Dispute/Update",
    delete: "",
  },
  searchConfig: {
    globalSearchKeys: ["fineId"],
    columnFilterKeys: ["department", "payment_Type"],
    dateRangeKey: "addon",
  },

  statsConfig: [
    {
      title: "stats.TotalDisputes",
      icon: React.createElement(SearchOutlined),
      value: (data, metadata) => `${data?.length || 0} / ${metadata?.totalCount || 0}`,
    },
    {
      title: "stats.Pending",
      icon: React.createElement(ClockCircleOutlined),
      color: "orange",
      value: (data, metadata) =>
        `${data?.filter((d) => d.dispute_Status === 1).length || 0} / ${metadata?.pending || 0}`,
    },
    {
      title: "stats.Approved",
      icon: React.createElement(CheckCircleOutlined),
      color: "green",
      value: (data, metadata) =>
        `${data?.filter((d) => d.dispute_Status === 2).length || 0} / ${metadata?.approved || 0}`,
    },
    {
      title: "stats.Rejected",
      icon: React.createElement(CloseCircleOutlined),
      color: "red",
      value: (data, metadata) =>
        `${data?.filter((d) => d.dispute_Status === 3).length || 0} / ${metadata?.rejected || 0}`,
    },
    {
      title: "stats.InReview",
      icon: React.createElement(SyncOutlined),
      color: "blue",
      value: (data, metadata) =>
        `${data?.filter((d) => d.dispute_Status === 4).length || 0} / ${metadata?.inReview || 0}`,
    },
  ],

  tableConfig: {
    rowKey: "dispute_Id",
    columns: [
      {
        key: "fineId",
        title: "form.fineNumber",
        type: "select",
      },
      {
        key: "dispute_Id",
        title: "form.disputenumber",
        type: "select",
      },
      {
        key: "payment_Type",
        title: "form.paymentType",
        type: "select",
        filterable: true,
        options: [
          { label: "Cash", value: 1 },
          { label: "Credit Card", value: 2 },
          { label: "Online", value: 3 },
        ],
      },
      // { key: "phone", title: "form.phoneNumber", type: "string" },
      // { key: "crm_Ref", title: "form.crmReference", type: "string", sortable: true },
      // { key: "email", title: "form.email", type: "string" },
      { key: "source", title: "form.source", type: "string" },
      {
        key: "created_At",
        title: "form.createdAt",
        type: "string",
        render: (value) => dayjs(value).format("DD MMM YYYY, hh:mm A"),
      },
      {
        key: "dispute_Status",
        title: "form.disputestatus",
        type: "string",
      },
    ],
    viewRecord: true,
    showEdit: true,
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

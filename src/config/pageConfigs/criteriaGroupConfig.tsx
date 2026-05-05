import React from "react";
import type { PageConfig } from "../../types/config";
import { AppstoreOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

export const criteriaGroupConfig: PageConfig = {
  key: "criteria-group",
  title: "page.title.criteriaGroup",
  name: { singular: "entity.criteriaGroup", plural: "entity.criteriaGroups" },
  api: {
    get: "/api/CriteriaGroup/GetAll",
    post: "/api/CriteriaGroup",
    put: "/api/CriteriaGroup",
    delete: "/api/CriteriaGroup/:id",
  },
  searchConfig: {
    globalSearchKeys: ["groupName_EN", "groupName_AR"],
    columnFilterKeys: ["isActive"],
    dateRangeKey: "",
  },
  statsConfig: [
    {
      title: "stats.TotalGroups",
      icon: <AppstoreOutlined />,
      value: (_data: any[], metadata: any) => `${_data.length} / ${metadata?.totalRecords ?? 0}`,
    },
    {
      title: "stats.ActiveGroups",
      icon: <CheckCircleOutlined />,
      value: (_data: any[], metadata: any) =>
        `${_data.filter((d) => d.isActive === true).length} / ${metadata?.active ?? 0}`,
      color: "#52c41a",
    },
    {
      title: "stats.InactiveGroups",
      icon: <CloseCircleOutlined />,
      value: (_data: any[], metadata: any) =>
        `${_data.filter((d) => d.isActive === false).length} / ${metadata?.inActive ?? 0}`,
      color: "#faad14",
    },
  ],
  tableConfig: {
    columns: [
      {
        key: "groupName_EN",
        title: "form.groupNameEn",
        dataIndex: "groupName_EN",
        type: "string",
        sortable: true,
      },
      {
        key: "groupName_AR",
        title: "form.groupNameAr",
        dataIndex: "groupName_AR",
        type: "string",
      },
      // {
      //   key: "details",
      //   title: "form.criteriaSelection",
      //   dataIndex: "details",
      //   type: "ReactNode",
      // },
      {
        key: "isActive",
        title: "form.isActive",
        dataIndex: "isActive",
        type: "tag",
        filterable: true,
        align: "center",
      },
    ],
    viewRecord: true,
  },
  formConfig: {
    modalWidth: "680px",
    fields: [
      {
        name: "groupName_EN",
        label: "form.groupNameEn",
        type: "text",
        required: true,
        span: 12,
      },
      {
        name: "groupName_AR",
        label: "form.groupNameAr",
        type: "text",
        required: true,
        span: 12,
      },
      {
        name: "criteriaWeightIds",
        label: "form.criteriaSelection",
        type: "select",
        required: true,
        span: 24,
      },
      {
        name: "isActive",
        label: "form.isActive",
        type: "switch",
        required: false,
        span: 12,
      },
    ],
  },
};

import { IdcardOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined } from "@ant-design/icons";

export const parkonicLocationPageConfig: PageConfig = {
  key: "parkonic-location",
  title: "page.title.parkonicLocation",
  name: { singular: "Location", plural: "Locations" },
  api: {
    get: "/api/ParkonicLocation",
    post: "/api/ParkonicLocation",
    put: "/api/ParkonicLocation",
    delete: "/api/ParkonicLocation/:id",
  },
  searchConfig: {
    globalSearchKeys: ["locationName", "locationCode"],
    columnFilterKeys: ["status_Id", "city_Id"],
    dateRangeKey: "createdDate",
  },
  statsConfig: [
    {
      title: "Total Locations",
      icon: <IdcardOutlined />,
      value: (data) => data.length,
    },
    {
      title: "Active Locations",
      icon: <CheckCircleOutlined />,
      value: (data) => data.filter((d) => d.status_Id === 1).length, // 1 = Active
      color: "#52c41a",
    },
    {
      title: "Inactive Locations",
      icon: <CloseCircleOutlined />,
      value: (data) => data.filter((d) => d.status_Id === 2).length, // 2 = Inactive
      color: "#ff4d4f",
    },
    
  ],
  tableConfig: {
    columns: [
      { key: "zone", title: "form.zone", dataIndex: "locationName", type: "string", sortable: true },
      { key: "area", title: "form.area", dataIndex: "locationCode", type: "string", sortable: true },
      { key: "street", title: "form.street", dataIndex: "city_Id", type: "string", filterable: true, lookupCategory: 700 },
      { key: "lat", title: "form.lat", dataIndex: "status_Id", type: "tag", filterable: true, lookupCategory: 800 },
      { key: "long", title: "form.long", dataIndex: "createdDate", type: "date", sortable: true },
    ],
    viewRecord: true,
  },

};

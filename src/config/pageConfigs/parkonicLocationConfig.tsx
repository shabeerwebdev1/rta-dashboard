// Define the PageConfig interface if not already defined
interface PageConfig {
  key: string;
  title: string;
  name: { singular: string; plural: string };
  api: {
    get: string;
    post: string;
    put: string;
    delete: string;
  };
  searchConfig?: {
    globalSearchKeys: string[];
    columnFilterKeys?: string[];
    dateRangeKey?: string;
  };
  tableConfig: {
    columns: Array<{
      key: string;
      title: string;
      dataIndex: string;
      type: string;
      sortable?: boolean;
      filterable?: boolean;
      lookupCategory?: number;
    }>;
    viewRecord: boolean;
  };
}

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
    globalSearchKeys: ["zone", "area"],
    columnFilterKeys: ["zone", "area"],
    dateRangeKey: "created_At",
  },
  tableConfig: {
    columns: [
      { key: "zone", title: "form.zone", dataIndex: "zone", type: "string", sortable: true },
      { key: "area", title: "form.area", dataIndex: "area", type: "string", sortable: true },
      { key: "street", title: "form.street", dataIndex: "street", type: "string", sortable: true },
      { key: "latitude", title: "form.lat", dataIndex: "lat", type: "string", sortable: true },
      { key: "longitude", title: "form.long", dataIndex: "long", type: "string", sortable: true },
      { key: "created_At", title: "form.created_At", dataIndex: "long", type: "string", sortable: true },
    ],
    viewRecord: true,
  },
};
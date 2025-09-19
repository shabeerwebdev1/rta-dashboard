import { PageConfig } from "../../types/config";

export const parkonicLocationPageConfig: PageConfig = {
  title: "parkonicLocation.title",
  tableConfig: {
    rowKey: "locationId",
    columns: [
      { key: "zone", title: "parkonicLocation.zone" },
      { key: "area", title: "parkonicLocation.area" },
      { key: "street", title: "parkonicLocation.street" },
      { key: "lat", title: "parkonicLocation.lat" },
      { key: "long", title: "parkonicLocation.long" },
    ],
  },
  searchConfig: {
    globalSearchKeys: ["zone", "area", "street"],
  },
};

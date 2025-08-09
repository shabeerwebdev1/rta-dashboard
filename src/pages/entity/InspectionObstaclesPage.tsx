import React from "react";
import EntityPage from "../EntityPage";
import { pageConfigs } from "../../config/pageConfigs";
import { dynamicApi } from "../../services/rtkApiFactory";

const InspectionObstaclesPage: React.FC = () => {
  const config = pageConfigs["inspection-obstacles"];

  return (
    <EntityPage
      pageKey="inspection-obstacles"
      config={config}
      useGetHook={dynamicApi.useGetInspectionObstaclesQuery}
    />
  );
};

export default InspectionObstaclesPage;

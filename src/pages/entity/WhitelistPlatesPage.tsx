import React from "react";
import EntityPage from "../EntityPage";
import { pageConfigs } from "../../config/pageConfigs";
import { dynamicApi } from "../../services/rtkApiFactory";

const WhitelistPlatesPage: React.FC = () => {
  const config = pageConfigs["whitelist-plates"];

  return (
    <EntityPage
      pageKey="whitelist-plates"
      config={config}
      useGetHook={dynamicApi.useGetPlatesQuery}
      useDeleteHook={dynamicApi.useDeletePlateMutation}
    />
  );
};

export default WhitelistPlatesPage;

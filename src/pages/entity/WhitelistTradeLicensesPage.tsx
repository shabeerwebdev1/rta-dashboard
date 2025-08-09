import React from "react";
import EntityPage from "../EntityPage";
import { pageConfigs } from "../../config/pageConfigs";
import { dynamicApi } from "../../services/rtkApiFactory";

const WhitelistTradeLicensesPage: React.FC = () => {
  const config = pageConfigs["whitelist-tradelicenses"];

  return (
    <EntityPage
      pageKey="whitelist-tradelicenses"
      config={config}
      useGetHook={dynamicApi.useGetTradeLicensesQuery}
      useDeleteHook={dynamicApi.useDeleteTradeLicenseMutation}
    />
  );
};

export default WhitelistTradeLicensesPage;

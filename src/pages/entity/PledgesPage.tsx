import React from "react";
import EntityPage from "../EntityPage";
import { pageConfigs } from "../../config/pageConfigs";
import { dynamicApi } from "../../services/rtkApiFactory";

const PledgesPage: React.FC = () => {
  const config = pageConfigs["pledges"];

  return (
    <EntityPage
      pageKey="pledges"
      config={config}
      useGetHook={dynamicApi.useGetPledgesQuery}
      useDeleteHook={dynamicApi.useDeletePledgeMutation}
    />
  );
};

export default PledgesPage;

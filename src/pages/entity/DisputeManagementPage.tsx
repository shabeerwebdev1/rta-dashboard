import React from "react";
import EntityPage from "../EntityPage";
import { pageConfigs } from "../../config/pageConfigs";
import { dynamicApi } from "../../services/rtkApiFactory";
// Make sure disputeManagementConfig is added to pageConfigs object
const DisputeManagementPage: React.FC = () => {
  const config = pageConfigs["dispute-management"];

  return (
    <EntityPage
      pageKey="dispute-management"
      config={config}
      useGetHook={dynamicApi.useGetDisputesQuery}
      useDeleteHook={dynamicApi.useDeleteDisputeMutation}
    /> 
  );
};

export default DisputeManagementPage;

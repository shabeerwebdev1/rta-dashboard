import { useEffect, useState } from "react";
import { Card, Space, Tabs } from "antd";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";
import i18n from "../config/i18n";
import VehicleInspectionsPage from "./VehicleInspectionsPage";
import ParkingsInspectionsPage from "./ParkingsInspectionsPage";
import { vehicleInspectionsConfig } from "../config/pageConfigs/vehicleInspectionsConfig";
import { parkingsInspectionsConfig } from "../config/pageConfigs/parkingsInspectionsConfig";

const { TabPane } = Tabs;

function FineInspectionsPage() {
  const { setPageTitle } = usePage();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("1");

  // Function to handle tab change
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    
    // Set page title based on active tab
    if (key === "1") {
      setPageTitle(t(vehicleInspectionsConfig.title));
    } else if (key === "2") {
      setPageTitle(t(parkingsInspectionsConfig.title));
    }
  };

  // Set initial page title based on default active tab
  useEffect(() => {
    if (activeTab === "1") {
      setPageTitle(t(vehicleInspectionsConfig.title));
    } else if (activeTab === "2") {
      setPageTitle(t(parkingsInspectionsConfig.title));
    }
  }, [setPageTitle, t, i18n.language, activeTab]);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card bordered={false}>
        <Tabs 
          type="card" 
          defaultActiveKey="1" 
          activeKey={activeTab}
          onChange={handleTabChange}
        >
          <TabPane tab={t("sidebar.Vehicle")} key="1">
            <VehicleInspectionsPage />
          </TabPane>
          <TabPane tab={t("sidebar.Parkings")} key="2">
            <ParkingsInspectionsPage />
          </TabPane>
        </Tabs>
      </Card>
    </Space>
  );
}

export default FineInspectionsPage;
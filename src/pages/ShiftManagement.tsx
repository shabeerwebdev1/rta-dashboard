import React, { useEffect } from "react";
import { Card, Space, Tabs } from "antd";
import UserZoneLinking from "./UserZoneLinking";
import SupervisorManagement from "./SupervisorManagementpage";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";
import { shiftManagementConfig } from "../config/pageConfigs/shiftManagementConfig";
import i18n from "../config/i18n";

const { TabPane } = Tabs;

function ShiftManagement() {
  const { setPageTitle } = usePage();
  const { t } = useTranslation();

  useEffect(() => {
    setPageTitle(t(shiftManagementConfig.title));
  }, [setPageTitle, t, i18n.language]);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card bordered={false}>
        <Tabs type="card" defaultActiveKey="1">
          <TabPane tab={t("tabs.inspectors")} key="1">
            <UserZoneLinking />
          </TabPane>
          <TabPane tab={t("tabs.supervisors")} key="2">
            <SupervisorManagement />
          </TabPane>
        </Tabs>
      </Card>
    </Space>
  );
}

export default ShiftManagement;

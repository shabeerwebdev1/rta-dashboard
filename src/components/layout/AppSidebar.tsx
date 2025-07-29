import { useState } from "react";
import { Layout, Menu, type MenuProps } from "antd";
import {
  CarOutlined,
  FileTextOutlined,
  TeamOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  BarChartOutlined,
  UsergroupAddOutlined,
  IdcardOutlined,
  PushpinOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Sider } = Layout;

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation();

  const menuItems: MenuProps["items"] = [
    { key: "1", icon: <PushpinOutlined />, label: t("sidebar.parking") },
    { key: "2", icon: <CarOutlined />, label: t("sidebar.fleet") },
    { key: "3", icon: <FileTextOutlined />, label: t("sidebar.pledges") },
    { key: "4", icon: <IdcardOutlined />, label: t("sidebar.permits") },
    { key: "5", icon: <TeamOutlined />, label: t("sidebar.hrms") },
    { key: "6", icon: <SearchOutlined />, label: t("sidebar.inspections") },
    { key: "7", icon: <DollarOutlined />, label: t("sidebar.fines") },
    {
      key: "8",
      icon: <ExclamationCircleOutlined />,
      label: t("sidebar.dispute"),
    },
    { key: "9", icon: <CarOutlined />, label: t("sidebar.towing") },
    { key: "10", icon: <UsergroupAddOutlined />, label: t("sidebar.team") },
    { key: "11", icon: <BarChartOutlined />, label: t("sidebar.analytics") },
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      width={250}
      style={{
        position: "sticky",
        top: "0",
        left: "0",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src="/rta-logo.svg"
          alt="RTA Logo"
          style={{ height: "32px", transition: "all 0.2s" }}
        />
      </div>
      <Menu defaultSelectedKeys={["3"]} mode="inline" items={menuItems} />
    </Sider>
  );
};

export default AppSidebar;

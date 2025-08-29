import React from "react";
import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";
import { useTheme } from "../../contexts/ThemeContext";

const { Content } = Layout;

const MainLayout: React.FC = () => {
  const { themeName } = useTheme(); // Get the current theme name
  
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AppSidebar currentTheme={themeName} /> {/* Pass the theme to AppSidebar */}
      <Layout>
        <AppHeader />
        <Content style={{ margin: "0", padding: 24, borderRadius: "8px" }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
import React from "react";
import { Layout } from "antd";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";

const { Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
  isDarkTheme: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, isDarkTheme }) => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AppSidebar isDarkTheme={isDarkTheme} />
      <Layout>
        <AppHeader />
        <Content
          style={{
            margin: "0 16px 24px 16px",
            padding: 24,
            // background: "var(--ant-color-bg-layout)",
            borderRadius: "8px",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;

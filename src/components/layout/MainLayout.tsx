import React from "react";
import { Layout } from "antd";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";

const { Content } = Layout;

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Content
          style={{
            margin: "24px 16px",
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

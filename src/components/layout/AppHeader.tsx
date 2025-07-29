import {
  Layout,
  Space,
  Avatar,
  Badge,
  Dropdown,
  type MenuProps,
  Button,
} from "antd";
import { BellOutlined, UserOutlined, LogoutOutlined } from "@ant-design/icons";
import ThemeSwitcher from "../ThemeSwitcher";
import LanguageSwitcher from "../LanguageSwitcher";

const { Header } = Layout;

const AppHeader = () => {
  const userMenuItems: MenuProps["items"] = [
    { key: "1", icon: <UserOutlined />, label: "Profile" },
    { key: "2", icon: <LogoutOutlined />, label: "Logout", danger: true },
  ];

  return (
    <Header
      style={{
        padding: "0 24px",
        // background: "var(--ant-color-bg-container)",
        position: "sticky",
        top: 0,
        zIndex: 999,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Space size="middle">
          <ThemeSwitcher />
          <LanguageSwitcher />
          <Badge dot>
            <Button type="text" icon={<BellOutlined />} />
          </Badge>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: "pointer" }}>
              <Avatar icon={<UserOutlined />} />
              <span>administrator</span>
            </Space>
          </Dropdown>
        </Space>
      </div>
    </Header>
  );
};

export default AppHeader;

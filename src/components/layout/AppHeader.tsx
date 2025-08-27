import { Layout, Space, Avatar, Badge, Dropdown, type MenuProps, Button, Typography } from "antd";
import { BellOutlined, UserOutlined, LogoutOutlined } from "@ant-design/icons";
import ThemeSwitcher from "../ThemeSwitcher";
import LanguageSwitcher from "../LanguageSwitcher";
import { usePage } from "../../contexts/PageContext";

const { Header } = Layout;
const { Title } = Typography;

const AppHeader = () => {
  const { pageTitle } = usePage();
  const userMenuItems: MenuProps["items"] = [
    { key: "1", icon: <UserOutlined />, label: "Profile" },
    { key: "2", icon: <LogoutOutlined />, label: "Logout", danger: true },
  ];

  return (
    <Header
      className="app-header"
      style={{
        padding: "15px 24px 0",
        background: "inherit",
      }}
    >
      <Title level={3} style={{ margin: 0 }}>
        {pageTitle}
      </Title>

      <Space size="middle" align="center">
        <ThemeSwitcher />
        <LanguageSwitcher />
        <Badge dot>
          <Button type="text" icon={<BellOutlined />} className="header-action-btn" />
        </Badge>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: "pointer", marginBottom: 8 }}>
            <Avatar icon={<UserOutlined />} />
            <span>administrator</span>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default AppHeader;

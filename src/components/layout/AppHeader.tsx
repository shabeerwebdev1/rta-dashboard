import { Layout, Space, Avatar, Badge, Dropdown, type MenuProps, Button, Typography } from "antd";
import { BellOutlined, UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import ThemeSwitcher from "../ThemeSwitcher";
import LanguageSwitcher from "../LanguageSwitcher";
import { usePage } from "../../contexts/PageContext";
import { FULL_PATHS } from "../../constants/paths";

const { Header } = Layout;
const { Title } = Typography;

const AppHeader = () => {
  const { pageTitle } = usePage();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    if (e.key === "2") {
      // 👈 Logout option
      // Here you could also clear auth tokens/localStorage if needed
      navigate(FULL_PATHS.LOGIN, { replace: true });
    }
  };

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
        <Dropdown
          menu={{ items: userMenuItems, onClick: handleMenuClick }}
          placement="bottomRight"
        >
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
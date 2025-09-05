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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // 🔹 Get user info from localStorage
  const userName =
    i18n.language === "ar"
      ? localStorage.getItem("displayNameAr")
      : localStorage.getItem("displayNameEn") || "Guest";

  const userImage = localStorage.getItem("userImage");

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    if (e.key === "2") {
      // Logout option
      localStorage.clear(); // 🔹 Clear tokens + user data
      navigate(FULL_PATHS.SPLASH, { replace: true });
    }
  };

  const userMenuItems: MenuProps["items"] = [
    { key: "1", icon: <UserOutlined />, label: t("Profile") },
    { key: "2", icon: <LogoutOutlined />, label: t("Logout"), danger: true },
  ];

  return (
    <Header
      style={{
        padding: "15px 24px 0",
        background: "inherit",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 999,
        borderBottom: "1px solid var(--ant-color-border-secondary)",
      }}
    >
      <Title level={3} style={{ margin: 0 }}>
        {pageTitle}
      </Title>

      <Space size="middle" align="center">
        <ThemeSwitcher />
        <LanguageSwitcher />
        <Badge dot>
          <Button type="text" icon={<BellOutlined />} />
        </Badge>
        <Dropdown
          menu={{ items: userMenuItems, onClick: handleMenuClick }}
          placement="bottomRight"
        >
          <Space style={{ cursor: "pointer" }}>
            <Avatar src={userImage} icon={<UserOutlined />} />
            <span>{userName}</span>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default AppHeader;

import { Layout, Space, Avatar, Badge, Dropdown, type MenuProps, Button, Typography } from "antd";
import { BellOutlined, UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import ThemeSwitcher from "../ThemeSwitcher";
import LanguageSwitcher from "../LanguageSwitcher";
import { usePage } from "../../contexts/PageContext";

const { Header } = Layout;
const { Title } = Typography;
const EXTERNAL_LOGIN_URL = "https://sso.kandaprojects.live/webapp/ui/common/login.aspx";

const AppHeader = () => {
  const { pageTitle } = usePage();
  const { t, i18n } = useTranslation();

  // 🔹 Get user info from localStorage
  const userName =
    i18n.language === "ar" ? localStorage.getItem("displayNameAr") : localStorage.getItem("displayNameEn") || "Guest";

  const userImage = localStorage.getItem("userImage");

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    if (e.key === "2") {
      localStorage.clear();
      window.location.href = EXTERNAL_LOGIN_URL;
    }
  };

  const userMenuItems: MenuProps["items"] = [{ key: "2", icon: <LogoutOutlined />, label: t("Logout"), danger: true }];

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
        {/* <Badge dot>
          <Button type="text" icon={<BellOutlined />} />
        </Badge> */}
        <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} placement="bottomRight">
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

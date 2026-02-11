import { Layout, Space, Avatar, Dropdown, Badge, Button, type MenuProps, Typography } from "antd";
import { UserOutlined, LogoutOutlined, InboxOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import ThemeSwitcher from "../ThemeSwitcher";
import LanguageSwitcher from "../LanguageSwitcher";
import { usePage } from "../../contexts/PageContext";
import { EXTERNAL_LOGIN_URL } from "../../config/envConfig";
import { FULL_PATHS } from "../../constants/paths";
import { useGetInboxSummaryQuery } from "../../services/rtkApiFactory";

const { Header } = Layout;
const { Title } = Typography;

const AppHeader = () => {
  const { pageTitle } = usePage();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const isReportsPage = location.pathname === FULL_PATHS.REPORTS;

  const userName =
    i18n.language === "ar" ? localStorage.getItem("displayNameAr") : localStorage.getItem("displayNameEn") || "Guest";

  const userImage = localStorage.getItem("userImage");

  const { data: inboxSummary, isLoading } = useGetInboxSummaryQuery(undefined, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 5000,
  });
  
  // bind count safely
  const inboxCount = inboxSummary?.data ?? 0;

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    if (e.key === "2") {
      localStorage.clear();
      window.location.href = EXTERNAL_LOGIN_URL;
    }
  };

  const userMenuItems: MenuProps["items"] = [
    { key: "2", icon: <LogoutOutlined />, label: t("form.Logout"), danger: true },
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
        {!isReportsPage && <LanguageSwitcher />}

        <Badge count={isLoading ? 0 : inboxCount} showZero offset={[-5, 5]} size="small">
          <Button
            type="text"
            className="header-action-btn"
            icon={<InboxOutlined />}
            onClick={() => navigate(FULL_PATHS.INBOX)}
          />
        </Badge>

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

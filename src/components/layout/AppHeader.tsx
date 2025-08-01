import {
  Layout,
  Space,
  Avatar,
  Badge,
  Dropdown,
  type MenuProps,
  Button,
  Typography,
  Tooltip,
} from "antd";
import {
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  CompressOutlined,
  ExpandOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import ThemeSwitcher from "../ThemeSwitcher";
import LanguageSwitcher from "../LanguageSwitcher";
import { usePage } from "../../contexts/PageContext";
import { useCompactMode } from "../../contexts/CompactModeContext";

const { Header } = Layout;
const { Title } = Typography;

const AppHeader = () => {
  const { pageTitle } = usePage();
  const { isCompact, toggleCompactMode } = useCompactMode();
  const { t } = useTranslation();

  const userMenuItems: MenuProps["items"] = [
    { key: "1", icon: <UserOutlined />, label: "Profile" },
    { key: "2", icon: <LogoutOutlined />, label: "Logout", danger: true },
  ];

  return (
    <Header
      style={{
        padding: "0 24px",
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
        {/* <Tooltip
          title={isCompact ? t("header.standardMode") : t("header.compactMode")}
        >
          <Button
            type="text"
            icon={isCompact ? <ExpandOutlined /> : <CompressOutlined />}
            onClick={toggleCompactMode}
          />
        </Tooltip> */}
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
    </Header>
  );
};

export default AppHeader;

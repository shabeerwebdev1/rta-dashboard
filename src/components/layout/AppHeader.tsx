import { Layout, Space, Avatar, Dropdown, Badge, List, Typography, Empty, Button, type MenuProps } from "antd";
import { UserOutlined, LogoutOutlined, BellOutlined, CloseOutlined, DeleteOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import ThemeSwitcher from "../ThemeSwitcher";
import LanguageSwitcher from "../LanguageSwitcher";
import { usePage } from "../../contexts/PageContext";
import { EXTERNAL_LOGIN_URL } from "../../config/envConfig";
import { FULL_PATHS } from "../../constants/paths";

const { Header } = Layout;
const { Title, Text } = Typography;

// Temporary notification data
// const TEMP_NOTIFICATIONS = [
//   {
//     id: 1,
//     title: "New shift assignment",
//     description: "You have been assigned to Zone A for the morning shift",
//     time: "5 minutes ago",
//     read: false,
//     type: "info",
//   },
//   {
//     id: 2,
//     title: "Schedule updated",
//     description: "Your schedule for next week has been updated",
//     time: "1 hour ago",
//     read: false,
//     type: "warning",
//   },
//   {
//     id: 3,
//     title: "Report approved",
//     description: "Your inspection report has been approved by the supervisor",
//     time: "2 hours ago",
//     read: true,
//     type: "success",
//   },
//   {
//     id: 4,
//     title: "Leave request approved",
//     description: "Your leave request for tomorrow has been approved",
//     time: "1 day ago",
//     read: true,
//     type: "success",
//   },
//   {
//     id: 5,
//     title: "System maintenance",
//     description: "Scheduled system maintenance on Friday 8 PM - 10 PM",
//     time: "2 days ago",
//     read: true,
//     type: "error",
//   },
// ];

const AppHeader = () => {
  const { pageTitle } = usePage();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  // const [notifications, setNotifications] = useState(TEMP_NOTIFICATIONS);
  // const [notificationOpen, setNotificationOpen] = useState(false);

  // Check if current page is reports page
  const isReportsPage = location.pathname === FULL_PATHS.REPORTS;

  // Get user info from localStorage
  const userName =
    i18n.language === "ar" ? localStorage.getItem("displayNameAr") : localStorage.getItem("displayNameEn") || "Guest";

  const userImage = localStorage.getItem("userImage");

  // Count unread notifications
  //const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    if (e.key === "2") {
      localStorage.clear();
      window.location.href = EXTERNAL_LOGIN_URL;
    }
  };

  // const handleNotificationClick = (notificationId: number) => {
  //   // Mark notification as read
  //   setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
  // };

  // const handleMarkAllAsRead = () => {
  //   setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  // };

  // const handleClearNotification = (notificationId: number, e: React.MouseEvent) => {
  //   e.stopPropagation(); // Prevent triggering the list item click
  //   setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  // };

  // const handleClearAll = () => {
  //   setNotifications([]);
  // };

  const userMenuItems: MenuProps["items"] = [
    { key: "2", icon: <LogoutOutlined />, label: t("form.Logout"), danger: true },
  ];

  // // Notification dropdown content
  // const notificationContent = (
  //   <div style={{ width: 380, maxHeight: 500, overflow: "auto", backgroundColor: "#fff" }}>
  //     <div
  //       style={{
  //         display: "flex",
  //         justifyContent: "space-between",
  //         alignItems: "center",
  //         padding: "12px 16px",
  //         borderBottom: "1px solid #f0f0f0",
  //         backgroundColor: "#fff",
  //       }}
  //     >
  //       <Text strong style={{ fontSize: 16 }}>
  //         {t("notifications.title", "Notifications")} ({notifications.length})
  //       </Text>
  //       <Space size="small">
  //         {unreadCount > 0 && (
  //           <a onClick={handleMarkAllAsRead} style={{ fontSize: 12 }}>
  //             {t("notifications.markAllRead", "Mark all as read")}
  //           </a>
  //         )}
  //         {notifications.length > 0 && (
  //           <Button
  //             type="text"
  //             size="small"
  //             danger
  //             icon={<DeleteOutlined />}
  //             onClick={handleClearAll}
  //             style={{ fontSize: 12 }}
  //           >
  //             {t("notifications.clearAll", "Clear all")}
  //           </Button>
  //         )}
  //       </Space>
  //     </div>

  //     {notifications.length === 0 ? (
  //       <Empty
  //         image={Empty.PRESENTED_IMAGE_SIMPLE}
  //         description={t("notifications.empty", "No notifications")}
  //         style={{ padding: "40px 0", backgroundColor: "#fff" }}
  //       />
  //     ) : (
  //       <List
  //         itemLayout="horizontal"
  //         dataSource={notifications}
  //         style={{ backgroundColor: "#fff" }}
  //         renderItem={(item) => (
  //           <List.Item
  //             onClick={() => handleNotificationClick(item.id)}
  //             style={{
  //               padding: "12px 16px",
  //               cursor: "pointer",
  //               backgroundColor: item.read ? "#fff" : "#f0f5ff",
  //               transition: "background-color 0.3s",
  //               position: "relative",
  //             }}
  //             onMouseEnter={(e) => {
  //               e.currentTarget.style.backgroundColor = "#f5f5f5";
  //             }}
  //             onMouseLeave={(e) => {
  //               e.currentTarget.style.backgroundColor = item.read ? "#fff" : "#f0f5ff";
  //             }}
  //           >
  //             <List.Item.Meta
  //               title={
  //                 <div
  //                   style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: 24 }}
  //                 >
  //                   <Text strong={!item.read} style={{ fontSize: 14 }}>
  //                     {item.title}
  //                   </Text>
  //                   {!item.read && <Badge status="processing" />}
  //                 </div>
  //               }
  //               description={
  //                 <div>
  //                   <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
  //                     {item.description}
  //                   </Text>
  //                   <Text type="secondary" style={{ fontSize: 12 }}>
  //                     {item.time}
  //                   </Text>
  //                 </div>
  //               }
  //             />
  //             <Button
  //               type="text"
  //               size="small"
  //               icon={<CloseOutlined />}
  //               onClick={(e) => handleClearNotification(item.id, e)}
  //               style={{
  //                 position: "absolute",
  //                 top: 12,
  //                 right: 8,
  //                 opacity: 0.6,
  //               }}
  //               onMouseEnter={(e) => {
  //                 e.currentTarget.style.opacity = "1";
  //               }}
  //               onMouseLeave={(e) => {
  //                 e.currentTarget.style.opacity = "0.6";
  //               }}
  //             />
  //           </List.Item>
  //         )}
  //       />
  //     )}

  //     {notifications.length > 0 && (
  //       <div
  //         style={{
  //           textAlign: "center",
  //           padding: "12px 0",
  //           borderTop: "1px solid #f0f0f0",
  //           backgroundColor: "#fff",
  //         }}
  //       >
  //         <a style={{ fontSize: 13 }}>{t("notifications.viewAll", "View all notifications")}</a>
  //       </div>
  //     )}
  //   </div>
  // );

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
        {/* Hide LanguageSwitcher on Reports page */}
        {!isReportsPage && <LanguageSwitcher />}

        {/* Notification Bell
        <Dropdown
          dropdownRender={() => notificationContent}
          trigger={["click"]}
          open={notificationOpen}
          onOpenChange={setNotificationOpen}
          placement="bottomRight"
        >
          <Badge count={unreadCount} offset={[-5, 5]} size="small">
            <Button type="text" className="header-action-btn" icon={<BellOutlined />} />
          </Badge>
        </Dropdown> */}

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

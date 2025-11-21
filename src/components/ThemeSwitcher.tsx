import { Button, Dropdown, type MenuProps } from "antd";
import { BgColorsOutlined, MoonOutlined } from "@ant-design/icons";
import { useTheme, type ThemeName } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

const ThemeSwitcher = () => {
  const { themeName, setThemeName } = useTheme();
  const { t } = useTranslation();

  // Load the theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("themeName") as ThemeName;
    if (savedTheme) {
      setThemeName(savedTheme);
    }
  }, [setThemeName]);

  const handleThemeChange = (name: ThemeName) => {
    setThemeName(name);
    localStorage.setItem("themeName", name); // Save the theme to localStorage
  };

  const items: MenuProps["items"] = [
    {
      key: "corporateIndigo",
      label: t("form.Indigo"),
      icon: <BgColorsOutlined style={{ color: "#171B7D" }} />,
      onClick: () => handleThemeChange("corporateIndigo"),
    },
    {
      key: "corporateRed",
      label: t("form.Red"),
      icon: <BgColorsOutlined style={{ color: "#ee3a41" }} />,
      onClick: () => handleThemeChange("corporateRed"),
    },
    {
      type: "divider",
    },
    {
      key: "dark",
      label: t("form.DarkMode"),
      icon: <MoonOutlined />,
      onClick: () => handleThemeChange("dark"),
    },
  ];

  return (
    <Dropdown menu={{ items, selectedKeys: [themeName] }} placement="bottomRight" trigger={["click"]}>
      <Button type="text" icon={<BgColorsOutlined />} className="header-action-btn" />
    </Dropdown>
  );
};

export default ThemeSwitcher;

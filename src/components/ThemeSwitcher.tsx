import { Button, Dropdown, type MenuProps } from "antd";
import { SkinOutlined, BgColorsOutlined, MoonOutlined } from "@ant-design/icons";
import { useTheme, type ThemeName } from "../contexts/ThemeContext";

const ThemeSwitcher = () => {
  const { themeName, setThemeName } = useTheme();

  const handleThemeChange = (name: ThemeName) => {
    setThemeName(name);
  };

  const items: MenuProps["items"] = [
    {
      key: "corporateRed",
      label: "Red",
      icon: <BgColorsOutlined style={{ color: "#ee3a41" }} />,
      onClick: () => handleThemeChange("corporateRed"),
    },
    {
      key: "corporateIndigo",
      label: "Indigo",
      icon: <BgColorsOutlined style={{ color: "#171B7D" }} />,
      onClick: () => handleThemeChange("corporateIndigo"),
    },
    {
      type: "divider",
    },
    {
      key: "dark",
      label: "Dark Mode",
      icon: <MoonOutlined />,
      onClick: () => handleThemeChange("dark"),
    },
  ];

  return (
    <Dropdown menu={{ items, selectedKeys: [themeName] }} placement="bottomRight" trigger={["click"]}>
      <Button type="text" icon={<SkinOutlined />} />
    </Dropdown>
  );
};

export default ThemeSwitcher;

import { Button } from "antd";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { useTheme } from "../contexts/ThemeContext";

const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button
      type="text"
      icon={theme === "light" ? <MoonOutlined /> : <SunOutlined />}
      onClick={toggleTheme}
    />
  );
};

export default ThemeSwitcher;

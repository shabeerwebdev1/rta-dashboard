import { Button, Dropdown, type MenuProps } from "antd";
import { GlobalOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
    document.documentElement.lang = lng;
    document.documentElement.dir = i18n.dir(lng);
  };

  const items: MenuProps["items"] = [
    { key: "en", label: "English", onClick: () => handleLanguageChange("en") },
    { key: "ar", label: "العربية", onClick: () => handleLanguageChange("ar") },
  ];

  return (
    <Dropdown menu={{ items }} placement="bottomRight">
      <Button type="text" icon={<GlobalOutlined />} />
    </Dropdown>
  );
};

export default LanguageSwitcher;

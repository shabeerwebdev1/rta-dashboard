import { Button, Dropdown, type MenuProps } from "antd";
import { GlobalOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  // Load the language from localStorage on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") || "en"; // default to English
    i18n.changeLanguage(savedLanguage);
    document.documentElement.lang = savedLanguage;
    document.documentElement.dir = i18n.dir(savedLanguage);
  }, [i18n]);

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
    document.documentElement.lang = lng;
    document.documentElement.dir = i18n.dir(lng);
    localStorage.setItem("language", lng); // Save the selected language to localStorage
  };

  const items: MenuProps["items"] = [
    { key: "en", label: "English", onClick: () => handleLanguageChange("en") },
    { key: "ar", label: "العربية", onClick: () => handleLanguageChange("ar") },
  ];

  return (
    <Dropdown menu={{ items }} placement="bottomRight">
      <Button type="text" icon={<GlobalOutlined />} className="header-action-btn" />
    </Dropdown>
  );
};

export default LanguageSwitcher;
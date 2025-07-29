import { ConfigProvider, theme } from "antd";
import { useTranslation } from "react-i18next";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import MainLayout from "./components/layout/MainLayout";
import WhitelistPage from "./pages/WhitelistPage";
import { corporateLightThemeConfig } from "./config/antdTheme";
import "./config/i18n";
import "./styles/global.css";

const AppContent = () => {
  const { theme: currentTheme } = useTheme();
  const { i18n } = useTranslation();

  const isRtl = i18n.dir() === "rtl";

  return (
    <ConfigProvider
      direction={isRtl ? "rtl" : "ltr"}
      theme={
        currentTheme === "light"
          ? corporateLightThemeConfig
          : { algorithm: theme.darkAlgorithm }
      }
    >
      <MainLayout>
        <WhitelistPage />
      </MainLayout>
    </ConfigProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;

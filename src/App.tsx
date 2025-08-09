import { App, ConfigProvider } from "antd";
import { useTranslation } from "react-i18next";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { PageProvider } from "./contexts/PageContext";
import AppRoutes from "./router";
import { availableThemes } from "./config/antdTheme";
import "./config/i18n";
import "./styles/global.css";
import "./styles/main.css";

const AppContent = () => {
  const { themeName } = useTheme();
  const { i18n } = useTranslation();

  const isRtl = i18n.dir() === "rtl";

  const activeThemeConfig = availableThemes[themeName];

  return (
    <ConfigProvider direction={isRtl ? "rtl" : "ltr"} theme={activeThemeConfig}>
      <App>
        <AppRoutes />
      </App>
    </ConfigProvider>
  );
};

function AppContainer() {
  return (
    <ThemeProvider>
      <PageProvider>
        <AppContent />
      </PageProvider>
    </ThemeProvider>
  );
}

export default AppContainer;

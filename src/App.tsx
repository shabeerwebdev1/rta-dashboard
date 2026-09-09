import { App, ConfigProvider } from "antd";
import { useTranslation } from "react-i18next";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { PageProvider } from "./contexts/PageContext";
import AppRoutes from "./router";
import { availableThemes } from "./config/antdTheme";
import "./config/i18n";
import "./styles/global.css";
import "./styles/main.css";
import { AuthProvider } from "./contexts/AuthContext";
import AppErrorBoundary from "./components/common/AppErrorBoundary";

const AppContent = () => {
  const { themeName } = useTheme();
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const activeThemeConfig = availableThemes[themeName];

  return (
    <ConfigProvider componentSize="large" direction={isRtl ? "rtl" : "ltr"} theme={activeThemeConfig}>
      <App>
        <AppRoutes />
      </App>
    </ConfigProvider>
  );
};

function AppContainer() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <PageProvider>
            <AppContent />
          </PageProvider>
        </ThemeProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}

export default AppContainer;

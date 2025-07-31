import { App, ConfigProvider, theme } from "antd";
import { useTranslation } from "react-i18next";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import {
  CompactModeProvider,
  useCompactMode,
} from "./contexts/CompactModeContext";
import { PageProvider } from "./contexts/PageContext";
import AppRoutes from "./router";
import { corporateLightThemeConfig } from "./config/antdTheme";
import "./config/i18n";
import "./styles/global.css";

const AppContent = () => {
  const { theme: currentTheme } = useTheme();
  const { isCompact } = useCompactMode();
  const { i18n } = useTranslation();

  const isRtl = i18n.dir() === "rtl";

  const lightTheme = corporateLightThemeConfig;

  const darkTheme: typeof corporateLightThemeConfig = {
    ...corporateLightThemeConfig,
    token: {
      ...corporateLightThemeConfig.token,
      colorBgLayout: "#141414",
      colorBgContainer: "#1d1d1d",
      colorBorder: "#303030",
      colorBorderSecondary: "#303030",
      colorText: "rgba(255, 255, 255, 0.85)",
      colorTextSecondary: "rgba(255, 255, 255, 0.65)",
    },
    components: {
      ...corporateLightThemeConfig.components,
      Layout: { headerBg: "#1d1d1d", siderBg: "#000" },
      Card: { colorBgContainer: "#1d1d1d" },
      Table: {
        colorBgContainer: "#1d1d1d",
        headerBg: "#1d1d1d",
        colorBorderSecondary: "#3a3a3a",
      },
      Modal: { contentBg: "#1d1d1d", headerBg: "#1d1d1d" },
    },
    algorithm: theme.darkAlgorithm,
  };

  const activeTheme = currentTheme === "light" ? lightTheme : darkTheme;

  if (isCompact) {
    const compactAlgorithm = Array.isArray(activeTheme.algorithm)
      ? activeTheme.algorithm
      : [activeTheme.algorithm].filter(Boolean);
    activeTheme.algorithm = [...compactAlgorithm, theme.compactAlgorithm];
  }

  return (
    <ConfigProvider direction={isRtl ? "rtl" : "ltr"} theme={activeTheme}>
      {/* Wrap AppRoutes with the antd App component */}
      <App>
        <AppRoutes />
      </App>
    </ConfigProvider>
  );
};

function AppContainer() {
  return (
    <ThemeProvider>
      <CompactModeProvider>
        <PageProvider>
          <AppContent />
        </PageProvider>
      </CompactModeProvider>
    </ThemeProvider>
  );
}

export default AppContainer;

import { App, ConfigProvider } from "antd";
import { useTranslation } from "react-i18next";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { CompactModeProvider } from "./contexts/CompactModeContext";
import { PageProvider } from "./contexts/PageContext";
import AppRoutes from "./router";
import {
  corporateDarkThemeConfig,
  corporateLightThemeConfig,
} from "./config/antdTheme";
import "./config/i18n";
import "./styles/global.css";

const AppContent = () => {
  const { theme: currentTheme } = useTheme();
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const activeTheme =
    currentTheme === "light"
      ? corporateLightThemeConfig
      : corporateDarkThemeConfig;

  // const { isCompact } = useCompactMode();
  // if (isCompact) {
  //   activeTheme.algorithm = [
  //     ...(Array.isArray(activeTheme.algorithm)
  //       ? activeTheme.algorithm
  //       : activeTheme.algorithm
  //         ? [activeTheme.algorithm]
  //         : []),
  //     ...(theme.compactAlgorithm ? [theme.compactAlgorithm] : []),
  //   ] as MappingAlgorithm[];
  // }

  return (
    <ConfigProvider direction={isRtl ? "rtl" : "ltr"} theme={activeTheme}>
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

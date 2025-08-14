import { theme, type ThemeConfig } from "antd";

const indigoPalette = {
  deepIndigo: "#171B7D",
  steelBlue: "#5A7D9A",
  brightRed: "#EB2630",
  offWhite: "#F7F7F7",
  lightGray: "#E3E3E3",
  slateGray: "#444C55",
  offBlack: "#232020",
  mutedText: "#8B7F7F",
};

const redPalette = {
  primaryRed: "#ee3a41",
  textBlack: "#231f20",
  infoBlue: "#00aeef",
  warningOrange: "#faa634",
  successGreen: "#00a967",
  bgLayout: "#f5f7f9",
  bgContainer: "#ffffff",
  borderLight: "#e8e8e8",
  textSecondary: "#6b7280",
};

const corporateIndigoTheme: ThemeConfig = {
  token: {
    fontFamily: "NoirPro, -apple-system, sans-serif",
    borderRadius: 8,
    colorPrimary: indigoPalette.deepIndigo,
    colorError: indigoPalette.brightRed,
    colorInfo: indigoPalette.steelBlue,
    colorSuccess: "#00a967",
    colorWarning: "#faa634",
    colorText: indigoPalette.offBlack,
    colorBgLayout: indigoPalette.lightGray,
    colorBgContainer: indigoPalette.offWhite,
    colorBorder: indigoPalette.lightGray,
    colorBorderSecondary: indigoPalette.lightGray,
  },
  components: {
    Layout: {
      headerBg: indigoPalette.offWhite,
      siderBg: indigoPalette.offBlack,
    },
    Menu: {
      itemBg: "transparent",
      itemColor: indigoPalette.lightGray,
      itemHoverColor: indigoPalette.offWhite,
      itemSelectedColor: indigoPalette.offWhite,
      itemSelectedBg: indigoPalette.deepIndigo,
    },
    Button: { primaryShadow: "none" },
    Modal: {
      contentBg: indigoPalette.offWhite,
      headerBg: indigoPalette.offWhite,
    },
    Table: {
      headerBg: indigoPalette.offWhite,
      colorBgContainer: indigoPalette.offWhite,
    },
  },
};

const corporateRedTheme: ThemeConfig = {
  token: {
    fontFamily: "NoirPro, -apple-system, sans-serif",
    borderRadius: 8,
    colorPrimary: redPalette.primaryRed,
    colorError: redPalette.primaryRed,
    colorInfo: redPalette.infoBlue,
    colorSuccess: redPalette.successGreen,
    colorWarning: redPalette.warningOrange,
    colorText: redPalette.textBlack,
    colorTextSecondary: redPalette.textSecondary,
    colorBgLayout: redPalette.bgLayout,
    colorBgContainer: redPalette.bgContainer,
    colorBorder: redPalette.borderLight,
    colorBorderSecondary: redPalette.bgLayout,
  },
  components: {
    Layout: {
      headerBg: redPalette.bgContainer,
      siderBg: redPalette.bgContainer,
    },
    Menu: {
      itemBg: "transparent",
      itemColor: redPalette.textSecondary,
      itemHoverColor: redPalette.primaryRed,
      itemHoverBg: "#fee2e2",
      itemSelectedColor: redPalette.primaryRed,
      itemSelectedBg: "#fecaca",
    },
    Button: { primaryShadow: "none" },
    Card: { headerBg: "transparent" },
    Table: {
      headerBg: "#ffffffff",
      colorBgContainer: redPalette.bgContainer,
    },
    Modal: {
      headerBg: redPalette.bgContainer,
      contentBg: redPalette.bgContainer,
    },
  },
};

export const corporateDarkThemeConfig: ThemeConfig = {
  ...corporateIndigoTheme,
  token: {
    colorBgLayout: "#141414",
    colorBgContainer: "#1d1d1d",
    colorBorder: "#303030",
    colorBorderSecondary: "#303030",
    colorText: "rgba(255, 255, 255, 0.85)",
    colorTextSecondary: "rgba(255, 255, 255, 0.65)",
  },
  components: {
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

export const availableThemes = {
  corporateIndigo: corporateIndigoTheme,
  corporateRed: corporateRedTheme,
  dark: corporateDarkThemeConfig,
};

import { theme, type ThemeConfig } from "antd";

const paletteold = {
  deepIndigo: "#171B7D",
  steelBlue: "#5A7D9A",
  brightRed: "#EB2630",
  offWhite: "#F7F7F7",
  lightGray: "#E3E3E3",
  slateGray: "#444C55",
  offBlack: "#232020",
  mutedText: "#8B7F7F",
};

const palette = {
  primaryRed: "#ee3a41",
  textBlack: "#231f20",
  infoBlue: "#00aeef",
  warningOrange: "#faa634",
  successGreen: "#00a967",
  highlightYellow: "#ffee01",

  bgLayout: "#f5f7f9",
  bgContainer: "#ffffff",
  borderLight: "#e8e8e8",
  textSecondary: "#6b7280",
  textDisabled: "#d1d5db",
};

export const corporateLightThemeConfig: ThemeConfig = {
  token: {
    fontFamily: "NoirPro, -apple-system, sans-serif",
    borderRadius: 8,

    colorPrimary: palette.primaryRed,
    colorError: palette.primaryRed,
    colorInfo: palette.infoBlue,
    colorSuccess: palette.successGreen,
    colorWarning: palette.warningOrange,

    colorText: palette.textBlack,
    colorTextSecondary: palette.textSecondary,
    colorTextDisabled: palette.textDisabled,

    colorBgLayout: palette.bgLayout,
    colorBgContainer: palette.bgContainer,

    colorBorder: palette.borderLight,
    colorBorderSecondary: palette.bgLayout,
  },
  components: {
    Layout: {
      headerBg: palette.bgContainer,
      siderBg: palette.bgContainer,
    },
    Menu: {
      itemBg: "transparent",
      itemColor: palette.textSecondary,
      itemHoverColor: palette.primaryRed,
      itemHoverBg: "#fee2e2",
      itemSelectedColor: palette.primaryRed,
      itemSelectedBg: "#fecaca",
      subMenuItemBg: palette.bgContainer,
    },
    Button: {
      primaryShadow: "none",
      colorLink: palette.infoBlue,
      colorLinkHover: palette.primaryRed,
    },
    Card: {
      headerBg: "transparent",
    },
    Table: {
      headerBg: palette.bgLayout,
      colorBgContainer: palette.bgContainer,
    },
    Modal: {
      headerBg: palette.bgContainer,
      contentBg: palette.bgContainer,
    },
    Tag: {
      borderRadius: 4,
    },
    Timeline: {
      dotColor: palette.borderLight,
      dotBg: palette.bgContainer,
    },
  },
};

// export const corporateLightThemeConfig: ThemeConfig = {
//   token: {
//     fontFamily: "NoirPro, -apple-system, sans-serif",
//     borderRadius: 8,
//     colorPrimary: palette.deepIndigo,
//     colorError: palette.brightRed,
//     colorInfo: palette.steelBlue,
//     colorText: palette.offBlack,
//     colorTextSecondary: palette.brightRed,
//     colorBgLayout: palette.lightGray,
//     colorBgContainer: palette.offWhite,
//     colorBorder: palette.lightGray,
//     colorBorderSecondary: palette.lightGray,
//   },
//   components: {
//     Layout: {
//       headerBg: palette.offWhite,
//       siderBg: palette.offBlack,
//     },
//     Menu: {
//       itemBg: "transparent",
//       itemColor: palette.lightGray,
//       itemHoverColor: palette.offWhite,
//       itemSelectedColor: palette.offWhite,
//       itemSelectedBg: palette.deepIndigo,
//     },
//     Button: {
//       primaryShadow: "none",
//     },
//     Modal: {
//       contentBg: palette.offWhite,
//       headerBg: palette.offWhite,
//     },
//     Table: {
//       headerBg: palette.offWhite,
//       colorBgContainer: palette.offWhite,
//     },
//   },
// };

export const corporateDarkThemeConfig: ThemeConfig = {
  ...corporateLightThemeConfig,
  token: {
    // ...corporateLightThemeConfig.token,
    colorBgLayout: "#141414",
    colorBgContainer: "#1d1d1d",
    colorBorder: "#303030",
    colorBorderSecondary: "#303030",
    colorText: "rgba(255, 255, 255, 0.85)",
    colorTextSecondary: "rgba(255, 255, 255, 0.65)",
  },
  components: {
    // ...corporateLightThemeConfig.components,
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

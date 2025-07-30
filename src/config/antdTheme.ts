import type { ThemeConfig } from "antd";

const palette = {
  deepIndigo: "#171B7D",
  steelBlue: "#5A7D9A",
  brightRed: "#EB2630",
  offWhite: "#F7F7F7",
  lightGray: "#E3E3E3",
  slateGray: "#444C55",
  offBlack: "#232020",
  mutedText: "#8B7F7F",
};

export const corporateLightThemeConfig: ThemeConfig = {
  token: {
    fontFamily: "NoirPro, -apple-system, sans-serif",
    borderRadius: 8,
    colorPrimary: palette.deepIndigo,
    colorError: palette.brightRed,
    colorInfo: palette.steelBlue,
    colorText: palette.offBlack,
    colorTextSecondary: palette.brightRed,
    colorBgLayout: palette.lightGray,
    colorBgContainer: palette.offWhite,
    colorBorder: palette.lightGray,
    colorBorderSecondary: palette.lightGray,
  },
  components: {
    Layout: {
      headerBg: palette.offWhite,
      siderBg: palette.offBlack,
    },
    Menu: {
      colorItemBg: "transparent",
      colorItemText: palette.lightGray,
      colorItemTextHover: palette.offWhite,
      colorItemTextSelected: palette.offWhite,
      colorItemBgSelected: palette.deepIndigo,
    },
    Button: {
      primaryShadow: "none",
    },
    Modal: {
      contentBg: palette.offWhite,
      headerBg: palette.offWhite,
    },
    Table: {
      headerBg: palette.offWhite,
      colorBgContainer: palette.offWhite,
    },
  },
};

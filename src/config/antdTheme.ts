import type { ThemeConfig } from "antd";

const baseConfig: ThemeConfig = {
  token: {
    fontFamily: "NoirPro, -apple-system, sans-serif",
    borderRadius: 8,
  },
};

const paletteCorporate = {
  brightRed: "#EB2D2F",
  darkRed: "#B92324",
  vibrantGreen: "#017B4A",
  darkGreen: "#01613B",
  goldYellow: "#FCB500",
  royalBlue: "#093D9E",
  darkRoyalBlue: "#073180",
  offWhiteCream: "#EDE7D1",
  stoneBeige: "#C4BCA9",
  black: "#000000",
  white: "#FFFFFF",
  white2: "#eef0f2",
};

export const corporateLightThemeConfig: ThemeConfig = {
  ...baseConfig,
  token: {
    ...baseConfig.token,
    colorPrimary: paletteCorporate.vibrantGreen,
    colorError: paletteCorporate.brightRed,
    colorWarning: paletteCorporate.goldYellow,
    colorInfo: paletteCorporate.royalBlue,
    colorBgLayout: paletteCorporate.white,
    colorBgContainer: paletteCorporate.white,
  },
  components: {
    Layout: {
      headerBg: paletteCorporate.white,
      siderBg: paletteCorporate.darkGreen,
    },
    Menu: {
      colorItemBg: "transparent",
      colorItemText: paletteCorporate.stoneBeige,
      colorItemTextHover: paletteCorporate.white,
      colorItemTextSelected: paletteCorporate.goldYellow,
      colorItemBgSelected: "rgba(252, 181, 0, 0.15)",
    },
    Button: {
      primaryShadow: "none",
    },
  },
};

export const corporateDarkThemeConfig: ThemeConfig = {
  ...baseConfig,
  token: {
    ...baseConfig.token,
    colorPrimary: paletteCorporate.goldYellow,
    colorError: paletteCorporate.brightRed,
    colorWarning: paletteCorporate.goldYellow,
    colorInfo: paletteCorporate.royalBlue,
    colorBgContainer: paletteCorporate.darkGreen,
    colorBgLayout: paletteCorporate.black,
  },
  components: {
    Layout: {
      headerBg: paletteCorporate.darkGreen,
      siderBg: paletteCorporate.black,
    },
    Menu: {
      colorItemBg: "transparent",
      colorItemText: paletteCorporate.stoneBeige,
      colorItemTextHover: paletteCorporate.white,
      colorItemTextSelected: paletteCorporate.goldYellow,
      colorItemBgSelected: "rgba(252, 181, 0, 0.15)",
    },
    Button: {
      primaryShadow: "none",
    },
  },
};

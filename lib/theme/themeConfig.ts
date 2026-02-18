export const themeConfig = {
  name: "PadelFocus Court Blue",
  colors: {
    primary: "#0E4D92",
    primarySoft: "#2F78C6",
    accent: "#D7F95B",
    background: "#F4F8FF",
    surface: "#FFFFFF",
    text: "#0F172A",
    line: "#ADC4DE"
  },
  shadows: {
    stadium: "0 16px 38px -24px rgba(14, 77, 146, 0.45)",
    glow: "0 0 0 1px rgba(14, 77, 146, 0.15), 0 12px 28px -16px rgba(14, 77, 146, 0.55)"
  }
} as const;

export type ThemeConfig = typeof themeConfig;

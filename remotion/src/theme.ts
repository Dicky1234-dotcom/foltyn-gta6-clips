import { Easing } from "remotion";

export const THEME = {
  colors: {
    // Cold Soviet Slate & Winter Palette
    slateBg: "#0D1117",
    concreteDark: "#161B22",
    concreteMid: "#21262D",
    overcoatCharcoal: "#383E42",
    snowParchment: "#EDE4D0",
    
    // Accents & Signals
    lampAmber: "#F59E0B",
    lampWarmGlow: "rgba(245, 158, 11, 0.22)",
    sovietCrimson: "#B91C1C",
    bloodFlash: "rgba(185, 28, 28, 0.45)",
    radarEmerald: "#10B981",
    radarCyan: "#06B6D4",
    
    // CIA & Retrospect
    ciaMarble: "#F8FAFC",
    gildedGold: "#D4AF37",
    gildedGoldDark: "#996515",
    
    // Text
    textPrimary: "#F0F6FC",
    textMuted: "#8B949E",
    textHighlight: "#FCD34D",
    
    // Overlay & Vignette
    vignetteBorder: "rgba(5, 7, 10, 0.75)",
    shadowBlack: "rgba(0, 0, 0, 0.85)",
  },
  
  easings: {
    smoothDolly: Easing.bezier(0.25, 0.1, 0.25, 1.0),
    crashZoom: Easing.bezier(0.16, 1, 0.3, 1),
    fastExit: Easing.bezier(0.4, 0, 1, 1),
    gentleDrift: Easing.inOut(Easing.ease),
  },
  
  springPresets: {
    snappy: { damping: 15, mass: 0.8, stiffness: 120 },
    heavyImpact: { damping: 12, mass: 1.2, stiffness: 180 },
    gentleFloat: { damping: 20, mass: 1.0, stiffness: 60 },
  },
  
  fonts: {
    display: "'Cinzel', 'Trajan Pro', 'Georgia', serif",
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  }
};

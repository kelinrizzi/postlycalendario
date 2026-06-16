export type SlideAlign = "left" | "center" | "right";
export type SlideVPos = "top" | "middle" | "bottom";

export const FONTS = [
  { label: "Inter", value: '"Inter", sans-serif' },
  { label: "Playfair", value: '"Playfair Display", serif' },
  { label: "Poppins", value: '"Poppins", sans-serif' },
  { label: "Bebas Neue", value: '"Bebas Neue", sans-serif' },
  { label: "DM Serif", value: '"DM Serif Display", serif' },
  { label: "Space Grotesk", value: '"Space Grotesk", sans-serif' },
  { label: "Caveat", value: '"Caveat", cursive' },
] as const;

export const PRESET_COLORS = [
  "#ffffff",
  "#0f0f0f",
  "#fa7e1e",
  "#d62976",
  "#962fbf",
  "#4f5bd5",
  "#feda75",
  "#22c55e",
];

export const OVERLAYS = [
  { label: "Nenhum", value: "none" },
  { label: "Escuro", value: "dark" },
  { label: "Claro", value: "light" },
  { label: "Gradiente", value: "gradient" },
] as const;

export type OverlayKind = (typeof OVERLAYS)[number]["value"];

export type Slide = {
  id: string;
  title: string;
  showTitle: boolean;
  titleSize: number;
  text: string;
  imageUrl: string | null;
  imagePrompt: string;
  fontFamily: string;
  fontSize: number; // px
  textColor: string;
  bgColor: string; // fallback when no image
  align: SlideAlign;
  vpos: SlideVPos;
  overlay: OverlayKind;
  logoUrl: string | null;
};

export type Brand = {
  name: string;
  logoUrl: string | null;
  primary: string; // main background / accent color
  secondary: string; // supporting color
  textColor: string;
  fontFamily: string;
  overlay: OverlayKind;
  showLogo: boolean;
  followVisualLine: boolean;
};

export const defaultBrand = (): Brand => ({
  name: "",
  logoUrl: null,
  primary: "#d62976",
  secondary: "#4f5bd5",
  textColor: "#ffffff",
  fontFamily: FONTS[0].value,
  overlay: "dark",
  showLogo: true,
  followVisualLine: true,
});

export const uid = () => Math.random().toString(36).slice(2, 10);

export const blankSlide = (text = "Seu texto aqui", title = ""): Slide => ({
  id: uid(),
  title,
  showTitle: title.length > 0,
  titleSize: 72,
  text,
  imageUrl: null,
  imagePrompt: "",
  fontFamily: FONTS[0].value,
  fontSize: 52,
  textColor: "#ffffff",
  bgColor: "#d62976",
  align: "center",
  vpos: "middle",
  overlay: "dark",
  logoUrl: null,
});

// Apply the brand's visual line to a slide so the feed stays consistent.
export const applyBrand = (slide: Slide, brand: Brand): Slide => {
  if (!brand.followVisualLine) return slide;
  return {
    ...slide,
    fontFamily: brand.fontFamily,
    textColor: brand.textColor,
    bgColor: brand.primary,
    overlay: brand.overlay,
    logoUrl: brand.showLogo ? brand.logoUrl : null,
  };
};


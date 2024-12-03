export interface Theme {
  title?: string;
  favicon?: string;
  radius?: "none" | "sm" | "md" | "lg" | "full";
  brand: string;
  secondary?: {
    dark: string;
    light: string;
  };
  background?: {
    dark: string;
    light: string;
  };
  logo?: {
    dark: string;
    light: string;
  };
  font?: {
    family?: string;
    scale?: string;
  };
  css?: string;
}

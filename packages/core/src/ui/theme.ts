export interface Theme {
  title?: string;
  favicon?: string;
  primary?: {
    dark: string;
    light: string;
  };
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

// React Theme — extracted from https://www.levion-materials.com
// Compatible with: Chakra UI, Stitches, Vanilla Extract, or any CSS-in-JS

/**
 * TypeScript type definition for this theme:
 *
 * interface Theme {
 *   colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    neutral50: string;
    neutral100: string;
    neutral200: string;
    neutral300: string;
    neutral400: string;
 *   };
 *   fonts: {
    body: string;
 *   };
 *   fontSizes: {
    '10': string;
    '14': string;
    '16': string;
    '18': string;
    '20': string;
    '26': string;
    '28': string;
    '64': string;
    '14.994': string;
    '13.3333': string;
    '10.5': string;
 *   };
 *   space: {
    '1': string;
    '8': string;
    '16': string;
    '24': string;
    '29': string;
    '37': string;
    '40': string;
    '43': string;
    '52': string;
    '59': string;
    '68': string;
    '81': string;
    '85': string;
    '120': string;
    '149': string;
    '190': string;
 *   };
 *   radii: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
 *   };
 *   shadows: {
    none: string;
    lg: string;
    xl: string;
 *   };
 *   states: {
 *     hover: { opacity: number };
 *     focus: { opacity: number };
 *     active: { opacity: number };
 *     disabled: { opacity: number };
 *   };
 * }
 */

export const theme = {
  "colors": {
    "primary": "#d96502",
    "secondary": "#116dff",
    "accent": "#b74101",
    "background": "#ffffff",
    "foreground": "#000000",
    "neutral50": "#000000",
    "neutral100": "#ffffff",
    "neutral200": "#141414",
    "neutral300": "#969da5",
    "neutral400": "#d6d6d6"
  },
  "fonts": {
    "body": "'wfont_ced490_9eb54a17069041c7b3a2095964951377', sans-serif"
  },
  "fontSizes": {
    "10": "10px",
    "14": "14px",
    "16": "16px",
    "18": "18px",
    "20": "20px",
    "26": "26px",
    "28": "28px",
    "64": "64px",
    "14.994": "14.994px",
    "13.3333": "13.3333px",
    "10.5": "10.5px"
  },
  "space": {
    "1": "1px",
    "8": "8px",
    "16": "16px",
    "24": "24px",
    "29": "29px",
    "37": "37px",
    "40": "40px",
    "43": "43px",
    "52": "52px",
    "59": "59px",
    "68": "68px",
    "81": "81px",
    "85": "85px",
    "120": "120px",
    "149": "149px",
    "190": "190px"
  },
  "radii": {
    "sm": "4px",
    "md": "8px",
    "lg": "16px",
    "xl": "24px"
  },
  "shadows": {
    "none": "rgba(0, 0, 0, 0) 0px 0px 0px 0px",
    "lg": "rgba(0, 0, 0, 0.25) -1.36px 2.67px 21px 1px",
    "xl": "rgba(0, 0, 0, 0.3) 0px 32px 68px 0px"
  },
  "states": {
    "hover": {
      "opacity": 0.08
    },
    "focus": {
      "opacity": 0.12
    },
    "active": {
      "opacity": 0.16
    },
    "disabled": {
      "opacity": 0.38
    }
  }
};

// MUI v5 theme
export const muiTheme = {
  "palette": {
    "primary": {
      "main": "#d96502",
      "light": "hsl(28, 98%, 58%)",
      "dark": "hsl(28, 98%, 28%)"
    },
    "secondary": {
      "main": "#116dff",
      "light": "hsl(217, 100%, 68%)",
      "dark": "hsl(217, 100%, 38%)"
    },
    "background": {
      "default": "#ffffff",
      "paper": "#b74101"
    },
    "text": {
      "primary": "#000000",
      "secondary": "#116dff"
    }
  },
  "typography": {
    "fontFamily": "'wfont_ced490_9eb54a17069041c7b3a2095964951377', sans-serif",
    "h1": {
      "fontSize": "64px",
      "fontWeight": "400",
      "lineHeight": "89.6px"
    },
    "h2": {
      "fontSize": "26px",
      "fontWeight": "400",
      "lineHeight": "36.4px"
    },
    "h3": {
      "fontSize": "20px",
      "fontWeight": "700",
      "lineHeight": "20px"
    },
    "body1": {
      "fontSize": "16px",
      "fontWeight": "400",
      "lineHeight": "normal"
    }
  },
  "shape": {
    "borderRadius": 8
  },
  "shadows": [
    "rgba(0, 0, 0, 0) 0px 0px 0px 0px",
    "rgba(0, 0, 0, 0.25) -1.36px 2.67px 21px 1px",
    "rgba(0, 0, 0, 0.3) 0px 32px 68px 0px"
  ]
};

export default theme;

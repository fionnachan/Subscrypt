import { defaultTheme } from "evergreen-ui";
import button from "./button";
import input from "./input";
import table from "./table";

const theme = {
    ...defaultTheme,
    fontFamilies: {
      display: "var(--font-family-display)",
      ui: "var(--font-family)",
      mono: "var(--font-family-mono)",
    },
    components: {
      ...(defaultTheme as any).components,
      Button: button,
      Input: input,
      Table: table,
    },
};

export default theme;
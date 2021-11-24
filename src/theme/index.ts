import { defaultTheme } from "evergreen-ui";
import button from "./button";

const theme = {
    ...defaultTheme,
    fontFamilies: {
      display: "Rubik, sans-serif",
    },
    components: {
      ...(defaultTheme as any).components,
      Button: button,
    },
};

export default theme;
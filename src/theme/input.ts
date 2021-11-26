import { defaultTheme } from "evergreen-ui";

const input = {
  baseStyle: {
    ...(defaultTheme as any).components.Input,
    fontSize: "var(--font-size-m)",
    padding: "var(--space-s)",
    border: "1px solid var(--grey-lighter)",
    borderRadius: "var(--border-radius)"
  },
}

export default input;
import { defaultTheme } from "evergreen-ui";

const table = {
  baseStyle: {
    ...(defaultTheme as any).components.Table,
    fontSize: "var(--font-size-m)",
    padding: "var(--space-s)",
    border: "none",
    borderRadius: "var(--border-radius)"
  },
}

export default table;
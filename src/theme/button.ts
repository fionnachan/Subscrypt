import { defaultTheme } from "evergreen-ui";

const button = {
  baseStyle: {
    ...(defaultTheme as any).components.Button,
    fontFamily: "var(--font-family)",
    fontSize: "var(--font-size-s)",
    padding: "var(--space-s)",
    borderRadius: 4,
  },
  appearances: {
    primary: {
      color: "white",
      backgroundColor: "var(--blue)",
      _hover: {
        backgroundColor: 'var(--blue-light)',
      },
    },
    minimal: {
      color: "black",
      backgroundColor: "transparent",
      border: "2px solid #dcdcdc",
      _hover: {
        border: "2px solid #999"
      },
    },
  },
}

export default button;
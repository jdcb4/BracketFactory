import type { Config } from "tailwindcss";

const withAlpha = (variable: string) => `hsl(var(${variable}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          base: withAlpha("--surface-base"),
          raised: withAlpha("--surface-raised"),
          overlay: withAlpha("--surface-overlay"),
          sunken: withAlpha("--surface-sunken")
        },
        text: {
          primary: withAlpha("--text-primary"),
          secondary: withAlpha("--text-secondary"),
          subtle: withAlpha("--text-subtle"),
          "on-accent": withAlpha("--text-on-accent")
        },
        accent: {
          primary: withAlpha("--accent-primary"),
          success: withAlpha("--accent-success"),
          warning: withAlpha("--accent-warning"),
          danger: withAlpha("--accent-danger"),
          info: withAlpha("--accent-info")
        },
        border: {
          default: withAlpha("--border-default"),
          subtle: withAlpha("--border-subtle"),
          strong: withAlpha("--border-strong")
        }
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)"
      },
      fontFamily: {
        body: "var(--font-family-body)",
        display: "var(--font-family-display)"
      },
      fontSize: {
        display: [
          "var(--font-size-display)",
          { lineHeight: "var(--line-height-display)", letterSpacing: "0" }
        ],
        h1: ["var(--font-size-h1)", { lineHeight: "var(--line-height-heading)", letterSpacing: "0" }],
        h2: ["var(--font-size-h2)", { lineHeight: "var(--line-height-heading)", letterSpacing: "0" }],
        h3: ["var(--font-size-h3)", { lineHeight: "var(--line-height-heading)", letterSpacing: "0" }],
        h4: ["var(--font-size-h4)", { lineHeight: "var(--line-height-heading)", letterSpacing: "0" }],
        body: ["var(--font-size-body)", { lineHeight: "var(--line-height-body)", letterSpacing: "0" }],
        "body-sm": [
          "var(--font-size-body-sm)",
          { lineHeight: "var(--line-height-body)", letterSpacing: "0" }
        ],
        caption: [
          "var(--font-size-caption)",
          { lineHeight: "var(--line-height-caption)", letterSpacing: "0" }
        ]
      },
      boxShadow: {
        panel: "var(--shadow-panel)",
        focus: "var(--shadow-focus)"
      },
      height: {
        "wizard-workspace": "var(--wizard-workspace-height)"
      }
    }
  },
  plugins: []
} satisfies Config;

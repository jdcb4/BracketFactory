# Design Tokens

Visual style for this project (colour, typography, radii) is defined as **tokens** — single, named values referenced everywhere they're used. Components compose these tokens; they do not embed raw values, raw colours, or raw Tailwind palette classes.

This is a hard rule, not a style preference. See `AGENTS.md`.

## The three layers

```
┌──────────────────────────────────────────────────────────────────┐
│ src/app/*, src/features/*, src/components/feature-*              │  ← write semantic-token classes only
│   bg-surface-raised, text-text-secondary, text-h2, ...           │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────┐
│ src/components/ui/typography.tsx, src/components/ui/surface.tsx  │  ← reusable primitives
│   <Heading level={2}>, <Body>, <Subtle>, <Surface variant="…">,  │
│   <Stack gap="…">, <Caption>, <Code>                              │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────┐
│ tailwind.config.ts                                               │  ← maps semantic names to CSS vars
│   colors: { surface: { base: 'hsl(var(--surface-base) / …)' } }  │
│   fontSize: { h2: ['var(--font-size-h2)', …] }                   │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────┐
│ src/styles/tokens.css                                            │  ← THE source of truth
│   --surface-base, --text-secondary, --font-size-h2, …            │
│   Includes light + .dark variants. Derivations live HERE.         │
└──────────────────────────────────────────────────────────────────┘
```

## When to use what

| Situation                        | Reach for                                         |
| -------------------------------- | ------------------------------------------------- |
| Heading or display text          | `<Heading level={1..4}>` or `<Heading level={1} display>` |
| Body text                        | `<Body>`                                          |
| Secondary / muted text           | `<Subtle>`                                        |
| Eyebrow / metadata               | `<Caption>`                                       |
| Inline code / monospace          | `<Code>`                                          |
| Coloured panel / card background | `<Surface variant="raised">` (or `overlay`, `sunken`, `base`) |
| Vertical or horizontal stack     | `<Stack gap="default">` (or `tight`, `loose`, `section`) |
| One-off colour or text style     | **Add a token first**, then use it. Don't inline. |

## Available semantic tokens

### Surfaces (use as `bg-surface-*`)

- `surface-base` — page background.
- `surface-raised` — cards, raised panels.
- `surface-overlay` — modals, popovers.
- `surface-sunken` — input fills, recessed areas.

### Text (use as `text-text-*`)

- `text-text-primary` — primary copy.
- `text-text-secondary` — secondary copy.
- `text-text-subtle` — tertiary / placeholder.
- `text-text-on-accent` — text rendered on a strong accent fill.

### Accents

- `bg-accent-primary` / `text-accent-primary` — brand emphasis.
- `bg-accent-success` / `text-accent-success`
- `bg-accent-warning` / `text-accent-warning`
- `bg-accent-danger` / `text-accent-danger`
- `bg-accent-info` / `text-accent-info`

### Borders

- `border-border-default` — default rule.
- `border-border-subtle` — barely-there separator.
- `border-border-strong` — emphasised divider.

### Typography sizes (use as `text-*`)

- `text-display`, `text-h1`, `text-h2`, `text-h3`, `text-h4`, `text-body`, `text-body-sm`, `text-caption`.

Each carries its own line-height and letter-spacing. **You should rarely need these directly — the primitives above already apply them.**

### Layout sizing

- `--wizard-workspace-height` - fixed desktop height for the bracket wizard workbench so parameter steps do not jump as panels change.

## Adding or changing a token

1. **Edit `src/styles/tokens.css`.** Add or change the CSS variable in `:root` and (if it should differ in dark mode) in `.dark`.
2. **If it's a new variable**, expose it in `tailwind.config.ts` under the matching theme key so a class name picks it up.
3. **If it's a new typography pattern** (e.g. a "blockquote" style), add a primitive to `src/components/ui/typography.tsx` rather than encouraging direct use of the class.
4. **If it's a derived value** (hover state, alternate tint), compute it in `tokens.css` as another CSS variable using `color-mix()` or by-hand HSL math. Never compute at the call site.
5. Document non-obvious tokens in this file.

## Theme switching

The project ships with light and dark variants. The active variant is whichever is set on `<html>` (`class="dark"` for dark, no class for light). The default for new projects is dark — change `index.html` if you prefer light.

To support a third theme (e.g. high-contrast, white-label), add a `.theme-foo` block to `tokens.css` overriding the variables, and toggle the class on `<html>` from your theme provider.

## What NOT to do

- ❌ `<h2 className="text-3xl font-semibold tracking-tight">` — write `<Heading level={2}>` instead.
- ❌ `<div className="bg-blue-500">` — write `<Surface variant="raised">` or add an accent token.
- ❌ `<p className="text-neutral-400">` — write `<Subtle>`.
- ❌ Computing a hover colour inline (`bg-blue-500 hover:bg-blue-600`) — define both as tokens.
- ❌ Hex colours, raw rem values, or raw Tailwind palette classes anywhere outside `tokens.css` and `tailwind.config.ts`.

## What's still fine to write inline

Layout-only utilities that don't carry visual style decisions:

- ✅ `flex`, `flex-col`, `items-center`, `justify-between`
- ✅ `min-h-dvh`, `w-full`, `max-w-prose`
- ✅ `px-6`, `py-2`, `gap-4`, `space-y-2`
- ✅ `hidden`, `sm:flex`, responsive prefixes

Layout is composition, not style. The line is "would changing the project's design language affect this class?" If yes, it's a token. If no, it's layout.

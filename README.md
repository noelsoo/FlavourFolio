# FlavourFolio

A recipe manager, meal planner and shopping-list builder. React 18 + TypeScript +
Vite + Tailwind, responsive from a 360px phone to a wide desktop.

```bash
npm install
npm run dev
```

The app is fully functional with no configuration and no network access beyond
the recipe images.

---

## What it does

- **Recipes** — import, search across titles *and* ingredients, filter by cuisine
  and tag, sort by time or calories, favourite, and scale servings live (the
  ingredient quantities re-render as you scale).
- **Cookbooks** — group recipes into named collections.
- **Meal plan** — a week grid with breakfast/lunch/dinner/snack slots, per-day
  calorie totals and a daily average measured against your own targets.
- **Groceries** — generated from the plan, with ingredients properly *combined*
  across recipes and grouped by aisle.
- **Nutrition** — calculated on-device from a reference table, with a confidence
  score and an explicit list of anything that could not be counted.

Everything persists to `localStorage`. Nothing is uploaded.

---

## Nutrition: how the numbers are produced

This is the part worth being precise about, because a nutrition figure that
can't be checked is worse than no figure.

Each ingredient line goes through four steps:

1. **Parse** — `"2 1/4 cups all-purpose flour, sifted"` becomes
   `{ quantity: 2.25, unit: cup, name: "all-purpose flour", note: "sifted" }`.
   Handles unicode fractions (`½`), mixed numbers, ranges (`2-3` → midpoint),
   parenthetical pack sizes (`1 (14 oz) can`), bullets and prep notes.
2. **Match** — the name is normalised (descriptors stripped, words singularised)
   and scored against the food table. A weak match is reported as low
   confidence rather than silently accepted.
3. **Convert to grams** — mass units convert directly; volume units convert via
   the food's **density** (a cup of flour is 125g, a cup of honey is 336g);
   count units via the food's **per-item weight** (a garlic clove is 3g). When
   the conversion needs data we don't have, the line is reported as unresolved
   instead of guessed.
4. **Scale** — the food's per-100g values are scaled by the gram weight and
   summed, then divided by servings.

**Confidence** weights ingredient coverage most heavily, then match quality, and
penalises unmatched lines. The recipe view lists every line that didn't count
and why — `"Cannot convert to grams — no density on record for X"` — so the
estimate is auditable rather than authoritative.

Conversions are verified against standard kitchen equivalents: 1 cup flour =
125g, 1 cup sugar = 200g, 1 cup butter = 227g, 1 tsp salt = 6g, 1 lb = 453.6g.

Values are generic USDA reference figures per 100g. A specific brand will
differ. These are estimates, not dietary advice.

---

## AI features

Two extraction engines, and the app tells you which one produced a result.

### Built in, always available (no key, no network)

- **Link import** reads the page's own `schema.org/Recipe` JSON-LD — the
  structured data most recipe sites publish for Google. What you get is what the
  site actually says. Microdata is handled as a fallback.
- **Paste import** runs a deterministic parser: explicit section headings when
  present, otherwise per-line classification (quantities and units mark
  ingredients, action verbs and sentence length mark steps).

A browser cannot fetch most cross-origin pages, so link import will sometimes be
blocked by the site. When that happens you are told, and pointed at the Paste
tab — the app does not fabricate a recipe to cover it up.

### Optional: Claude

Set `VITE_AI_PROXY_URL` to enable Claude for the hard cases — messy pasted text
and **photographs of recipe cards** (which genuinely need a vision model; there
is no offline substitute, and the app says so plainly when it isn't configured).

```bash
# terminal 1
ANTHROPIC_API_KEY=sk-ant-... node server/ai-proxy.mjs

# .env.local
VITE_AI_PROXY_URL=http://localhost:8787
VITE_FETCH_PROXY_URL=http://localhost:8787/fetch   # optional, for link import
```

**The key stays on the server.** Anything shipped to the browser is readable by
every visitor, so there is deliberately no way to put an API key in the bundle.
`server/ai-proxy.mjs` is a working reference implementation — add auth and rate
limiting before exposing it publicly.

Claude failures always degrade to the local parser rather than breaking the
import. Nutrition is never model-generated: it is always computed on-device from
the reference table.

---

## Components

Built on Radix UI + Tailwind + CVA in the **shadcn/ui file convention**, with a
`components.json` and the `@/` alias configured. That is the same foundation
[21st.dev](https://21st.dev) components compile down to, so they can be dropped
in without refactoring:

```bash
npx shadcn@latest add "https://21st.dev/r/<author>/<component>"
```

> **Note on sourcing:** this build could not fetch component source from
> 21st.dev or `astryx.atmeta.com` — both are blocked by the network policy in
> the environment it was built in. The primitives in `src/components/ui/` were
> written against the same Radix/CVA contract those registries target, so the
> registry command above works once egress is available. No Astryx API was
> guessed at.

---

## Layout

One shell, two form factors — no separate mobile build:

| | Mobile (`< lg`) | Desktop (`≥ lg`) |
|---|---|---|
| Navigation | Bottom tab bar with centre action | Persistent sidebar |
| Modals | Bottom sheets | Centred dialogs |
| Grids | 1 column | 2–4 columns |
| Recipe detail | Stacked | Two columns, sticky nutrition rail |

Safe-area insets are respected, inputs use 16px text so iOS doesn't zoom on
focus, focus rings are keyboard-only, and `prefers-reduced-motion` is honoured.
Light and dark themes are both first-class, with the theme applied before first
paint so there is no flash.

---

## Project structure

```
src/
  lib/
    nutrition/     units · foods · parse · match · compute · aggregate
    ai/            local-extract · jsonld · claude · import-url · extract
    storage.ts     localStorage persistence
  components/
    ui/            Radix/CVA primitives (shadcn convention)
    layout/        AppShell · PageHeader
    nutrition/     NutritionPanel
  contexts/        DataContext · AuthContext
  pages/           8 routes
server/
  ai-proxy.mjs     reference Claude proxy
```

---

## Accounts

There is no backend. The "account" is a local profile in this browser: the
password is not checked against anything and the data never leaves the device.
The login screen says so. Wire `login`/`register` in `AuthContext` to a real
service before treating any of it as authentication.

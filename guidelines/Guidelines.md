# Design system - Harbourline University Applicant Portal

This document describes the system **as it is in code today**. Every shared
component lives in `src/app/components/primitives.tsx`, colours and themes in
`src/app/themes.ts` and `src/styles/themes.css`.

---

## 1. Principles

- **Always LTR.** The root is `dir="ltr" lang="en-AU"`; logical properties
  (`ps/pe`, `ms/me`, `scroll-ps`) are still preferred over physical ones, so
  spacing and alignment follow the writing direction.
- **One component per pattern.** If a pattern appears on two pages, it
  belongs in `primitives.tsx`. Don't duplicate style classes between screens.
- **Colour comes from a variable, not a hard-coded value.** Every use of
  `#008ff0` goes through `--brand` (see §6), so switching theme or page hue
  works on its own.
- **Mobile is not a shrunken desktop.** What opens as a popup on desktop opens
  as a bottom sheet on mobile (`Dialog` does this by itself), and long lists of
  chips go into a "Filter" dialog.

---

## 2. Tokens

### Colour

| Role | Value | Note |
| --- | --- | --- |
| Brand | `--brand` (`#008ff0`) | Buttons, links, icons |
| Brand on hover | `--brand-hover` | |
| Brand tints | `rgba(var(--brand-rgb), α)` | 0.06 / 0.08 / 0.1 / 0.12 / 0.18 |
| Secondary accent | `--accent-2` (`#69c600`) | The dot at the end of every heading |
| Success | `#4e9400` on `rgba(105,198,0,0.12)` | |
| Warning | `#e07000` on `rgba(240,164,0,0.12)` | |
| Error | `#c43c3c` | |
| Primary ink | `#171c23` | Body text |
| Heading ink | `#122736` | Page headings + the top header |
| Surface | `#fff` (card), `#f5f5f7` (secondary surface) | |
| Lines | `rgba(23,28,35,0.05 → 0.3)` | Dividers, borders |

### Typography

`'Inter'` only. **The sizes in code are desktop sizes**; on mobile (up to
767px) the whole system steps down one level automatically - see below.

| Use | Desktop | Mobile | Weight | Line height | Letter spacing |
| --- | --- | --- | --- | --- | --- |
| Page heading | 34px | 25px | 700 | 1.15 `tight` | -0.025em |
| Inner section heading | 22-24px | 20-21px | 700 | 1.15 `tight` | -0.025em |
| Card title | 18px | 16px | 700 | 1.3 `snug` | 0 |
| Emphasised value (score, percentage) | 20px | 18px | 900 | 1 `none` | -0.025em |
| Huge number (days to start of studies) | 52px | 44px | 900 | 1 `none` | -0.025em |
| Label / field title | 16px | 15px | 600-700 | 1.3 `snug` | 0 |
| Body text | 15px / 14px | 14px / 13px | 400 | 1.65 `relaxed` | 0 |
| Metadata, chips | 13px | 12px | 600 | 1.5 `normal` | 0 |
| Notes and tags | 11-12px | 10-11px | 400-600 | 1.3 `snug` | 0 |

**Rules of thumb**

- **Line height follows the role, not the size**: numbers and metrics `1`,
  headings `1.15-1.3`, running text `1.65`. An explanatory paragraph is always
  `leading-relaxed`; a metadata line never is.
- **Negative letter spacing only from 20px up** (`tracking-tight`). Negative
  tracking at small sizes hurts readability - below 20px keep it at 0.
- **Four weights only**: 400 for body, 600 for chips/links/labels, 700 for
  headings, 900 for the big numbers. No 500 and no 800.
- **Line length** of an explanatory paragraph doesn't exceed ~70 characters.
  In a narrow card, shorten the text rather than shrink the font.
- **Secondary text comes from opacity** (50-70% on `ink/primary`) or from
  `ink/secondary` - not from a new shade of grey.

**The mobile scale** is defined once in `src/styles/themes.css`: a
`@media (max-width: 767px)` block that maps every `text-[Npx]` class to a
smaller size, and a separate `@media (min-width: 640px) and (max-width: 767px)`
block for the `sm:` variants. **Scoping the second block is mandatory** -
without it, an `sm:text-*` class on an element overrides the base size on
phones too, even when it isn't active itself. This means:

- **Don't write separate mobile sizes in components.** Write the desktop size,
  and the scale takes care of the rest.
- When a new size comes into use, add a line for it in that block, otherwise
  it stays at the desktop size on phones too.
- `sm:text-*` is kept only when mobile and desktop really need two
  substantially different sizes (e.g. page heading 28→34), not for general
  shrinking.

### Spacing, corners and shadow

- Page padding: `px-4 sm:px-6 md:px-10 pt-8 pb-12`.
- Card padding: `p-5`. Gap between cards: `gap-3` / `gap-4`.
- Corners: card `10px`, inner element `8px`, chip/button `rounded-full`.
- Shadow: `ELEVATION.hover` (brand glow on hover) and `ELEVATION.overlay`
  (dialogs). A card at rest has no shadow.

### Breakpoints

`sm` 640 · `md` 768 · `xl` 1280. The mobile/desktop boundary in logic
(`useIsMobile`) is **768**.

---

## 3. Components

| Component | File | Role |
| --- | --- | --- |
| `Button` | primitives | `primary` / `success` / `tint` / `ghost` / `outline` / `link` / `linkDanger` |
| `StatusBadge` | primitives | Status tag: success / warning / error / neutral |
| `FilterChip` | primitives | Filter/selection chip with a count and a disabled state |
| `LayoutSwitch` | primitives | Two-option view switch, with free-form `labels` |
| `ProgressBar` | primitives | Progress bar in the brand hue |
| `Dialog` + `DialogHeader` | primitives | Popup on desktop, bottom sheet on mobile |
| `SidePanel` | ScholarshipSurveySheet | Side panel on desktop, bottom sheet on mobile |
| `IconCircle` | primitives | Icon in a soft-tinted circle |
| `FieldLabel` / `TextField` / `SelectField` / `FIELD_CLASS` | primitives | Form fields |
| `AdBanner` | primitives | Ad space |
| `PAGE_CONTAINER` | primitives | Consistent content width (760px) for sub-pages |
| `GLASS_CARD` | ui/utils | Glass surface |
| `SectionHeading` | TasksAppointmentsPage | Section heading + green dot |

### Usage rules

- **One primary button** per section. Secondary action - `tint` or `ghost`;
  tertiary action - `link`.
- **A chip** always has a border. A chip whose count is 0 is disabled and not
  clickable, otherwise you land on a "No results" screen.
- **`Dialog` renders through a portal** to the app root (`[data-app-root]`).
  This is critical: a parent with a `transform` (e.g. a carousel card) makes
  `fixed` position relative to it, and the dialog would open inside the card.
  The same rule applies to `SidePanel`.
- **`Dialog` vs `SidePanel`**: `Dialog` for a confirmation, short form or
  filter - an interaction that ends in one sentence. `SidePanel` for choosing
  from a large pool that needs room: search, a grouped list, explanatory info
  and multi-select - when it matters that the page behind stays in context
  (desktop) or that the screen clears for one task (mobile).
- **`AdBanner`** only at the bottom of the six main pages (My profile,
  bookings, tasks, modules, enquiries, messages) - not inside a module, topic,
  assessment, survey or settings.

---

## 4. Screen patterns

**Page skeleton**: `<section>` with page padding → heading (+ switch/action) →
filter → content → `AdBanner`.

**Entity card** (module, topic, assessment): icon + title + status badge,
explanatory text, progress bar, action links. With a single action, the whole
card is clickable.

**Filtering**: up to three chips - in a row. Beyond that, or on mobile - a
"Filter" button with a badge that opens a `Dialog`, with a results line below
it in the form "Showing X of Y" and "Clear filter" when a filter is active.

**Carousel** (bookings, option 2): the focused card on the left - white and
full size, the neighbours at `scale 0.94` and in glass; tapping a neighbour
focuses it; the list is duplicated ×3 for an infinite loop; arrows on desktop
and dots below.

**Accordion**: one item open at a time, `ChevronDown` rotating 180°.

**Selection panel** (scholarship survey): the same content in two wrappers by
`useIsMobile` (boundary 768) -

- **Desktop**: a panel docked to the left of the screen, `460px`
  (`max-w-[92vw]`), full height, entering with `translateX(-100%) → 0` in
  300ms, shadow `ELEVATION.overlay`.
- **Mobile**: a bottom sheet `88vh` tall with top corners `rounded-t-2xl`, a
  grey grab handle (`w-10 h-1`) and a `translateY(100%) → 0` transition.
- **Shared**: a `bg-black/20` backdrop that closes on tap, `Esc` closes, a
  sticky header with name + subtitle and `X` on the right, a scrolling body
  (`overflow-y-auto flex-1 min-h-0`), and a sticky footer with "Cancel" and the
  save action.
- **Inner navigation**: when the panel shows two screens (list → detail), the
  header gets a `ChevronLeft` to go back instead of closing everything; closing
  discards the selection, saving applies it to the row the panel was opened
  from.
- **Preventing duplicates**: an item already chosen elsewhere is shown
  disabled with the label "Already selected" - it doesn't disappear from the
  list.

**Quotas and limits in multi-select**: prevent the error instead of reporting
it - when the quota is reached, the remaining options are dimmed
(`opacity-40`) and disabled, with a grey explanation line below them on how to
swap anyway. Tapping a selected item again removes it and the numbering updates
automatically. The button to continue to the next step is disabled until the
conditions are met, with an explanation line that disappears as soon as you can
continue - not a red error message after tapping. Red is reserved for a real
error the user has already run into.

**Lists inside a card** (history, documents): height-limited with inner
scrolling - 200px on mobile, 280px on desktop (about 4 and 6 rows) - so a card
with dozens of items doesn't stretch the page. On desktop two short lists share
a row (`md:grid-cols-2`) instead of each spanning the full width.

**Text preview**: `line-clamp-2 sm:line-clamp-3`, and a "Read all" button
shown only when the text is actually truncated (`scrollHeight > clientHeight`).
`line-clamp` doesn't survive when the paragraph is a flex item - wrap it in a
div.

**Read / unread** (messages): marked only by a deliberate action - tapping the
card or the envelope icon. Entering the page or scrolling marks nothing;
management actions (favourites, archive) stop event propagation.

**Admin view** (enquiries): `LayoutSwitch` with `labels={["Not admin","Admin"]}`
adds to the card the assigned handler, handling history, view-only documents,
and reply / reopen / attach document actions. Currently hidden behind
`ADMIN_VIEW_ENABLED`, like the survey variant switch behind
`VARIANT_SWITCH_ENABLED` - comparison switches stay in code behind a single
flag and are not deleted.

---

## 5. Accessibility

- Every icon button has an `aria-label`; a chip has `aria-pressed`; an
  accordion has `aria-expanded`; a selection group has `role="radiogroup"`.
- Ad space in `<aside aria-label="Advertisement">`.
- Text on brand is always white; never use colour as the only signal of a
  state - always with an icon or text.

---

## 6. Themes

Defined in `src/app/themes.ts` and injected as CSS variables on the app root;
`src/styles/themes.css` maps the canonical colour classes to the variables.
Thanks to this, **adding a theme doesn't touch screen code**.

| Theme | Characteristic |
| --- | --- |
| Light | The default |
| Dark | `dark: true` - dark surfaces and light text, via the `.dark` class |
| Purple / Teal / Sunset / Pink | Only the brand hue and background change |
| Colourful | `playful: true` + `accents` - a different hue per page, pastel background, 20px corners, coloured shadow and gradient buttons |

- `accentFor(theme, page)` returns the page hue; for a theme without `accents`
  it returns the theme colours - so no existing theme is affected.
- A theme with `surface` (dark cards on a light page) gets the `navy-cards`
  class: the ink inversion sits on the surface itself and is inherited by its
  descendants, not on the page root.
- The top header (navy `#122736`) is the same in every theme. The nav bar
  below it changes with the hue.

**The Figma variable files** live in `design/figma-tokens/` and are generated
from the values in code: a `Primitives` collection (radii, desktop and mobile
typography, spacing, sizes, layout, opacity, durations) and a `Theme`
collection with a mode per theme, including each page's dedicated hue. Full
details in `design/figma-tokens/README.md`. When you add a colour or token in
code, regenerate the files and import them into Figma.

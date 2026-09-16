# AssanPay Console — Design System v2
_Senior-designer standard. Restraint over decoration. Every value here is deliberate; do not invent new ones._

## 1. Principles
- **Restraint**: one accent (warm orange), 3 text levels, 4 radii + pill, 4 shadows max.
- **8pt grid**: only 4 / 8 / 12 / 16 / 20 / 24 / 32 px. No fractional px (13, 17, 23) except the single sanctioned 11px micro-label.
- **Spacing creates hierarchy, not borders.** Related = 8–12px apart, unrelated groups = 24px+.
- **No AI tells**: no purple/blue gradients, no glow drop-shadows, no hover lift+glow+scale combos, no emoji, no rainbow icon sets, no `fade-in-up` on everything, no `bg-clip-text` headlines.

## 2. Color tokens (`app/globals.css`, Tailwind v4 `@theme`)
Warm/orange theme is locked. Light = "Cream", dark = "Ember".

| Token | Light | Dark |
|---|---|---|
| `--color-background` | `#faf7f1` | `#14110d` |
| `--color-foreground` | `#1c1917` | `#f5efe4` |
| `--color-card` | `#ffffff` | `#1e1a15` |
| `--color-muted` | `#f3ede2` | `#292420` |
| `--color-border` | `#e7ddcd` (warm hairline) | `#3a332b` |
| `--color-primary` | `#d97706` | `#f59e0b` |
| `--color-primary-foreground` | `#ffffff` | `#1c1917` |

**Semantic tokens** (define both themes; use with opacity modifiers, e.g. `bg-success/10 text-success border-success/25`):
- `--color-success` `#16a34a` / `#4ade80`, `--color-warning` `#d97706`/`#fbbf24`, `--color-destructive` `#dc2626`/`#f87171`, `--color-info` `#2563eb`/`#60a5fa`
- Status display pattern: **soft tint bg + strong text**, never solid colored chips. Dots + text preferred in tables.
- **Ban**: all `*-950/*` + `*-300/400` dark-only pairings (e.g. `bg-emerald-950/50 text-emerald-300`) — replace with semantic tokens everywhere.

**Method colors** (theme-aware; deeper 600-series light / 400-series dark):
- GET `--color-method-get` `#059669`/`#34d399`, POST `#d97706`/`#fbbf24`, PUT `#2563eb`/`#60a5fa`, PATCH `#7c3aed`/`#a78bfa`, DELETE `#dc2626`/`#f87171`
- Apply to `.method-badge` in globals.css AND `workbench.tsx` method text colors (currently neon `*-400` fixed).

**Text hierarchy** — exactly 3 levels: `text-foreground` (ink), `text-muted-foreground` (secondary 60–70%), `text-muted-foreground/60` (faint). Never a 4th gray.

**Icons**: inherit neutral (`text-muted-foreground`); orange reserved for active/selected icon or one intentional affordance per view. No rainbow icon sets.

## 3. Typography
- **Fonts**: one sans + one mono. Sans for ALL labels/headings/nav; **mono ONLY for data** (endpoints, JSON, IDs, amounts, shortcuts). Ban: mono nav labels, mono table headers, mono "Console" wordmark.
- **Scale**: `text-xs` 12 / `text-sm` 14 / `text-base` 16 / `text-lg` 18 / KPI `text-[28px]` or `text-3xl`.
- **Micro-label** (nav groups, table headers, form labels, card kickers): `text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground` — the ONLY allowed fractional size.
- **Numbers**: `tabular-nums` everywhere numbers repeat (tables, KPIs). KPI values: `font-bold tracking-tight`.
- Max **3 distinct weights** per screen.

## 4. Radius scale
Set `--radius: 0.875rem` → `rounded-sm` 10px / `rounded-md` 12px / `rounded-lg` 14px / `rounded-xl` 18px / `rounded-2xl` 22px.
- **Controls** (buttons, inputs, selects): `rounded-md` (12px)
- **Dropdown items, toasts, inner boxes**: `rounded-lg` (14px)
- **Main cards, panels, sidebar nav**: `rounded-xl` (18px)
- **Modals, drawers, command palette**: `rounded-2xl` (22px)
- **Badges, chips, segmented knobs**: `rounded-full`
- Rule: radius decreases inward; max 2 radii per card. Delete all arbitrary `rounded-[10/11/12/14/16/18/20px]` and `rounded-[1.25rem]` usages — map to the scale.

## 5. Shadows & borders
- **Elevation ladder** (only these): hairline border (resting) < `--shadow-card` < `--shadow-md` (hover emphasis, rare) < `--shadow-overlay` (modals/dropdowns).
- `--shadow-card`: `0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -12px rgb(0 0 0 / 0.08)` — "if you can see it, it's too much".
- **Borders over shadows** for structure: 1px warm hairlines. Inside cards, separate sections with hairlines, never bg fills.
- Dark mode: elevation via background tone step, not stronger shadows.
- **Glow forbidden** except focus rings. Delete `.btn-glow`, `.pulse-glow`, accent drop-shadows on icons.
- Delete the `inset 0 -1px 0 rgba(0,0,0,0.18)` grime (topbar, workbench strip) → plain hairline border.

## 6. Motion
- Hovers: `transition-colors duration-150` only. **Never `transition-all`**, never linear.
- **No translate/scale/glow on card or button hover.** Pressed buttons: `active:scale-[0.99]` (physical).
- Overlays: scale 98% + fade, 200ms. No staggered fade-in-up. Respect `prefers-reduced-motion`.
- Focus: visible always — inputs `focus-visible:ring-2 ring-primary/40`, never removed.

## 7. Component recipes
- **Button**: solid primary for the ONE main action; outline/ghost secondary. Hover = bg shift or subtle shadow only. No lift, no brightness.
- **Card**: white, `rounded-xl`, hairline border, `--shadow-card`. **No hover shadow on base card** — add opt-in `interactive` prop for clickable cards only.
- **Input**: `rounded-md`, hairline border, `bg-card`; focus ring 3px `ring-primary/40`.
- **Tabs**: workbench = underline variant (2px primary underline, **active label `text-foreground`** — fix white-on-cream bug); filters/sidebar = pill segmented (container `bg-muted rounded-full p-1`, active = `bg-primary text-primary-foreground rounded-full shadow-sm`).
- **Table**: header `bg-muted/60`, 11px uppercase tracked secondary; 1px row hairlines; row hover = fill only (`hover:bg-accent/50`); numeric cols right-aligned + tabular-nums; status = dot + text or soft pill.
- **Badge**: pill, `text-xs font-semibold`, soft tint (`bg-primary/10 text-primary` etc.); solid fills only for counts on dark.
- **Sidebar nav**: active = dark pill (`bg-foreground text-background`), inactive icons `text-primary`. Endpoint rows: pure CSS hover (`hover:bg-accent`), selected = dark pill to match.
- **Command palette**: `rounded-2xl` centered modal; sans labels; mono only for paths/shortcuts.
- **Empty states**: centered, one line-icon, specific headline, one primary action, one helper line.
- **Close icons**: lucide `X` only — never the `✕` text character.
- **Pulse**: one subtle pulse pattern only; delete `.pulse-glow`, `.status-dot-live`, `animate-ping` down to a single implementation.

## 8. Copy
- Sandbox-only product: no "live & sandbox gateway" wording (fix login banner).
- No marketing adjectives ("Seamless", "Powerful", "Delve"). Plain, precise labels.

## 9. File ownership (build agents — DO NOT touch others' files)
- **Foundations**: `app/globals.css`, `components/ui/button.tsx`, `card.tsx`, `badge.tsx`, `tabs.tsx`, `input.tsx`, `input-group.tsx`, `toggle-group.tsx`, `dialog.tsx`, `select.tsx`
- **Console chrome**: `components/console/nav-rail.tsx`, `topbar.tsx`, `sidebar.tsx`, `command-palette.tsx`, `app/page.tsx`
- **Workbench & views**: `components/console/workbench.tsx`, `response-panel.tsx`, `history-view.tsx`, `callback-inbox.tsx`, `variables-workspace.tsx`, `environment-status.tsx`, `app/(auth)/login/page.tsx`

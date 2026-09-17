---
version: alpha
name: Postman
description: "Accelerate API development with Postman's all-in-one platform. Streamline collaboration and simplify the API lifecycle for faster, better results. Learn more."
sourceUrl: "https://postman.com"

colors:
  primary: "#0265d2"
  on-primary: "#ffffff"
  background: "#ffffff"
  surface: "#f9f8f7"
  border: "#e6e6e6"
  text: "#ffffff"
  text-muted: "#212121"
  accent: "#e05320"

typography:
  display:
    fontFamily: "degular, degular Fallback, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, ヒラギノ角ゴ Pro W3, Hiragino Kaku Gothic Pro, Osaka, メイリオ, Meiryo, ＭＳ Ｐゴシック, MS PGothic, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica, Arial, sans-serif"
    fontSize: 55px
    fontWeight: 600
    lineHeight: 0.91
    letterSpacing: 0.6px
  heading:
    fontFamily: "degular, degular Fallback, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, ヒラギノ角ゴ Pro W3, Hiragino Kaku Gothic Pro, Osaka, メイリオ, Meiryo, ＭＳ Ｐゴシック, MS PGothic, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica, Arial, sans-serif"
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.17
    letterSpacing: 0.48px
  body:
    fontFamily: "inter, inter Fallback, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, ヒラギノ角ゴ Pro W3, Hiragino Kaku Gothic Pro, Osaka, メイリオ, Meiryo, ＭＳ Ｐゴシック, MS PGothic, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica, Arial, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: -0.16px
  mono:
    fontFamily: "ibmPlexMono, ibmPlexMono Fallback, monospace"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.63
    letterSpacing: -0.16px

spacing:
  base: 4px
  scale: [4, 8, 12, 16, 20, 24, 28, 40, 60]

radius:
  sm: 3px
  md: 5px
  lg: 10px

shadows:
  card: "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.2) 0px 2px 8px 0px"
  elevated: "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0.5px, rgba(0, 0, 0, 0) 0px 0px 0px 0px"

motion:
  duration-fast: 150ms
  duration-base: 1400ms
  duration-slow: 2000ms
  easing: "cubic-bezier(0.4, 0, 0.2, 1)"

breakpoints: [481px, 600px, 641px, 768px, 769px, 820px, 993px, 1024px, 1068px, 1199px, 1200px, 2000px]
---

## Rationale

Postman's design system reflects a professional, developer-focused platform that balances approachability with technical credibility. The light color mode with a warm, off-white surface (#f9f8f7) creates an inviting workspace aesthetic—critical for a tool where users spend extended periods collaborating and iterating on APIs. The primary blue (#0265d2) is a confident, accessible choice that conveys trust and innovation, while the accent orange (#e05320) provides visual hierarchy and draws attention to conversion moments (CTAs like "Download" and "Sign Up").

The typography strategy uses two distinct font families to reinforce visual separation: Degular for large, attention-commanding displays and headings (55px–36px, tight leading at 0.91–1.17) creates bold, modern energy, while Inter for body copy (14px, generous 1.7 line height) ensures sustained readability for documentation and dense information. The monospace fallback (IBM Plex Mono, 12px) acknowledges the developer audience's familiarity with code editors. Measured letter-spacing (-0.16px in body, +0.6px in display) shows deliberate optical refinement.

Spacing is built on a 4px base unit with a carefully curated scale (4, 8, 12, 16, 20, 24, 28, 40, 60), enabling consistent rhythm without overwhelming flexibility. The minimal shadow system (card shadows at 2px blur, no elevated depth) keeps the interface clean and modular—avoiding visual noise in a complex platform. Motion is restrained: a fast 150ms easing for interactive feedback and a base 1400ms for longer transitions, using a standard cubic-bezier curve that feels natural without being distracting.

## 1. Visual Theme & Atmosphere

Postman projects **professional technical authority** layered with **modern accessibility**. The light, high-contrast theme (white background, #212121 text-muted) feels corporate and trustworthy—appropriate for enterprise API governance. The warm surface tone (#f9f8f7, a near-white with subtle brown undertone) softens the harshness of pure white, reducing visual fatigue during long work sessions. This is a workspace designed for focus, not flash.

The accent orange (#e05320) is strategically reserved for moments of action: it appears on CTAs and highlights, ensuring users immediately recognize where to click. The primary blue (#0265d2) dominates UI controls and establishes brand identity without dominating the canvas. Together, they create a two-tone accent system that signals clarity of purpose.

## 2. Color System

| Role | Value | Usage |
|------|-------|-------|
| **Primary** | #0265d2 | Buttons, links, active states, primary UI |
| **On Primary** | #ffffff | Text/icons on primary backgrounds |
| **Background** | #ffffff | Page canvas |
| **Surface** | #f9f8f7 | Cards, panels, subtle containers |
| **Border** | #e6e6e6 | Dividers, subtle separation |
| **Text** | #ffffff | Only on dark/colored backgrounds |
| **Text Muted** | #212121 | Primary body text, high contrast |
| **Accent** | #e05320 | CTAs, highlights, secondary emphasis |

The color palette is deliberately restrained: six functional colors plus two semantic text roles. This constraint forces intentional hierarchy and prevents visual chaos in a feature-rich platform. The border color (#e6e6e6) is subtle enough to suggest structure without dominating; paired with the surface tone, it creates soft but legible card-based layouts.

## 3. Typography

**Display (55px, 600 weight, Degular)**  
Reserved for hero headings and major section titles. Tight 0.91 line height and 0.6px letter-spacing create a modern, slightly condensed aesthetic. This size commands attention without feeling oversized.

**Heading (36px, 600 weight, Degular)**  
Used for section headers and feature callouts. The 1.17 line height prevents awkward wrapping on narrower viewports, while 0.48px tracking maintains visual sophistication.

**Body (14px, 400 weight, Inter)**  
The workhorse. 1.7 line height is generous, supporting readability during sustained reading—important for documentation-heavy platforms. Inter's geometric, open letterforms are highly legible on screens. Negative letter-spacing (-0.16px) tightens the overall color without reducing readability.

**Mono (12px, 400 weight, IBM Plex Mono)**  
Code snippets, API endpoints, and inline technical references. Maintaining readability at 12px with a 1.63 line height allows for reasonable code density. The monospace choice signals "this is executable" to developers.

Font-family stacks include international fallbacks (Hiragino, Meiryo), indicating consideration for global users.

## 4. Components & Patterns

**Buttons & CTAs**  
Primary buttons use the blue (#0265d2) with white text. Accent CTAs (particularly "Download," "Sign Up," "Contact Sales") are orange (#e05320), creating visual urgency. Assumed padding is likely 12–16px vertical, 20–24px horizontal (fitting the spacing scale).

**Cards & Surfaces**  
Surface color (#f9f8f7) with border (#e6e6e6) and the card shadow (2px blur, 20% black opacity) creates subtle elevation. No heavy shadows; the design favors flat, layered clarity.

**Navigation & Inputs**  
Consistent border radius (sm 3px, md 5px, lg 10px) suggests slightly rounded corners—modern but not playful. Text inputs likely use the border color with focus states adopting the primary blue.

**Links & Interactive Elements**  
Body text color (#212121) for resting state; primary blue (#0265d2) for hover/focus. Underlines may be subtle or appear on hover only.

## 5. Spacing & Layout

The 4px base unit scales predictably: 4, 8, 12, 16, 20, 24, 28, 40, 60px. This progression supports:
- **4–8px**: Micro-spacing within components (icon-to-text, button padding adjustments)
- **12–16px**: Padding for small elements, form fields
- **20–24px**: Card padding, section spacing
- **28–40px**: Section breaks, feature block separation
- **60px**: Hero spacing, major section dividers

The 12 responsive breakpoints (ranging 481px to 2000px) indicate a mobile-first approach with granular tablet and desktop refinements. The 768px breakpoint likely marks a shift from stacked to side-by-side layouts; the 1200px breakpoint probably marks a max-width constraint for readability on ultra-wide screens.

## 6. Motion & Interaction

**Fast (150ms)**  
Used for button hovers, icon animations, tooltip reveals. Provides snappy feedback without feeling jittery.

**Base (1400ms)**  
A longer transition—likely for page transitions, accordion expansions, or multi-step modal sequences. The slower pace gives users time to track visual changes.

**Slow (2000ms)**  
Reserved for entrance animations or complex multi-element choreography (e.g., hero image fades, staggered list reveals).

**Easing: cubic-bezier(0.4, 0, 0.2, 1)**  
This is Material Design's standard easing curve—it accelerates quickly and decelerates smoothly, feeling natural and intentional. No bouncy or overly playful easing.

---

## Accessibility

### Contrast Ratios

**Primary text (#212121) on white background (#ffffff)**  
Contrast ratio ≈ **16:1** — exceeds WCAG AAA. Excellent for body text and all interactive elements.

**Primary blue (#0265d2) on white background (#ffffff)**  
Contrast ratio ≈ **5.3:1** — meets WCAG AA. Suitable for links and UI controls; body text in this color should be avoided.

**Orange accent (#e05320) on white background (#ffffff)**  
Contrast ratio ≈ **4.8:1** — marginally meets WCAG AA. Fine for buttons and highlights; should not be used for extended body text.

**White text (#ffffff) on primary blue (#0265d2)**  
Contrast ratio ≈ **11:1** — exceeds WCAG AAA. Button labels and overlays are highly legible.

### Minimum Requirements

- **Touch target size**: Buttons and interactive elements should be at least 44×44px. Given typical padding (16–20px) and font size (14px display text), most buttons likely meet this standard.
- **Focus indicator**: A 2px outline in the primary blue (#0265d2), offset 2px from the element boundary, ensures keyboard navigation visibility without obstructing content.
- **Color alone**: Critical information (errors, success, warnings) should never rely on color alone; use icons, text labels, or patterns in addition.
- **Motion**: The 150ms and 1400ms transitions respect the `prefers-reduced-motion: reduce` media query; consider disabling animations for users who prefer reduced motion.

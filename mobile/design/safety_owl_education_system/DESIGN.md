---
name: Safety Owl Education System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#434655'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#6b38d4'
  on-secondary: '#ffffff'
  secondary-container: '#8455ef'
  on-secondary-container: '#fffbff'
  tertiary: '#6d5000'
  on-tertiary: '#ffffff'
  tertiary-container: '#8b6700'
  on-tertiary-container: '#ffeed3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#ffdf9f'
  tertiary-fixed-dim: '#f9bd22'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#5c4300'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.6'
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-bold:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1'
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: auto
  max-width-content: 1100px
---

## Brand & Style

This design system targets children and teenagers aged 7–15, balancing the playfulness of a game with the structure of an educational platform. The brand personality is **Trustworthy, Encouraging, and Protective**. It utilizes a "Modern Playful" aesthetic—moving away from the thin, fragile lines of corporate SaaS and toward high-utility, chunky, and tactile interfaces that feel physically "safe" to interact with.

The visual style is a hybrid of **Minimalism** (for clarity of information) and **Tactile/Skeuomorphism** (for gamified elements). Large surface areas, generous negative space, and exaggerated rounded corners create an inviting atmosphere that reduces the anxiety often associated with "internet safety" topics. The presence of the mascot, "Cú Cú An Toàn," is integrated through supportive UI moments rather than just decoration.

## Colors

The palette is designed to evoke a sense of digital security while remaining vibrant and engaging.

- **Primary Blue (Safety):** Used for core navigation, primary actions, and "Secure" states.
- **Soft Purple (Innovation/AI):** Used for interactive lessons, AI-guided features, and special hints.
- **Warm Yellow (Guidance):** Used for "Pay Attention" moments, warnings, and achievement highlights.
- **Neutrals:** A range of soft whites and cool grays ensure the vibrant primary colors don't overwhelm the young user. 

Use high-contrast text (Slate 800/900) against light backgrounds to ensure maximum readability for developing eyes.

## Typography

**Be Vietnam Pro** is used exclusively to provide a consistent, friendly, and highly legible experience tailored for Vietnamese diacritics. 

- **Weight Usage:** Use "ExtraBold" or "Black" for Display titles to create a "chunky" game-like feel. Use "Medium" for body text to improve readability on backlit screens.
- **Scalability:** Headlines should be large. On mobile devices, avoid dropping below 16px for any instructional text.
- **Line Height:** Generous line heights (1.6x for body) are essential to help younger readers track lines of text without getting lost.

## Layout & Spacing

This design system uses a **Fluid-Fixed Hybrid Grid**. 
- **Mobile:** 4-column layout with 16px side margins. Elements typically span the full width to provide large "tap targets."
- **Tablet/Desktop:** 12-column layout with a maximum content width of 1100px. Content is centered to prevent eye-strain on ultra-wide monitors.

The spacing rhythm is based on an 8px scale. For this demographic, "Room to breathe" is a functional requirement: use `lg` (40px) or `xl` (64px) spacing between major sections to prevent the UI from feeling cluttered or "homework-like."

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Tactile Shadows**. 

- **The Ground Layer:** The main background is a very soft gray (#F8FAFC) or white.
- **The Card Layer:** White cards with 24px+ rounded corners.
- **The Interactive Layer:** Buttons and active cards use a "3D" shadow effect—a solid 4px-8px offset shadow in a darker shade of the element's color (e.g., a blue button has a dark blue bottom border/shadow). This makes elements look "pressable" and physical.
- **Modal Layer:** High-blur ambient shadows are reserved for alerts and pop-ups, ensuring they feel separated from the educational content.

## Shapes

The shape language is defined by **Maximum Roundedness**. 
- **Standard Components:** Use 24px (1.5rem) as the default radius for cards and containers.
- **Buttons & Inputs:** Use the Pill-shape (fully rounded) for all interactive buttons and text fields to remove "sharpness" from the UI.
- **Icons:** Use "Blob" backdrops behind icons to soften their appearance. Avoid geometric squares.

## Components

### Buttons (Chunky Style)
Buttons are the primary interaction point. They should have a minimum height of 56px for easy tapping. They must feature a "bottom-heavy" border (4px) to simulate a physical button. When pressed, the button should shift down by 2px to provide tactile feedback.

### Progress Bars
Gamified bars with a thick stroke (16px height). Use the Primary Blue for the "fill" and a light version of the same color for the "track." Include a small "Cú Cú" head icon as the progress marker.

### Cards
Cards are the primary container for lessons. They should have 24px padding and a subtle 1px border (#E2E8F0) in addition to their tactile shadow.

### Gamified Badges
Circular or shield-shaped containers. Use the Tertiary Yellow for "Gold" status and Soft Purple for "Skill" status. Badges should always include a thick white outer stroke to pop against any background.

### Input Fields
Inputs should be large with 18px text. The "Active" state should change the border color to Primary Blue and increase the border thickness to 2px.

### List Items
Use "Staggered" lists with large icons on the left. Each list item is its own card, rather than separated by lines, to maintain the chunky, accessible aesthetic.
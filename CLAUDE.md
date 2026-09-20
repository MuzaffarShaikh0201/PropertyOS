# PropertyOS — build reference for Claude Code

Personal property-management app for Indian property owners. v1 is scoped to **Maharashtra rental law only**. Platform: **Expo / React Native, one codebase**, mobile-first, responsive up through tablet and laptop breakpoints (see the "16 · Responsive exhibit" wireframe for the exact layout rules per breakpoint). Navigation: **Expo Router** (file-based).

Wireframes (all 20 screens, light + dark themed): https://claude.ai/artifact/Es7x4MWWMsswWoERBmjZw6
Screen-by-screen spec doc: https://claude.ai/artifact/XA8UYH5eZm5vn4awgEXnNk

Read both before building a screen — the spec doc has the field-by-field behavior; the wireframe artifact has the approved visual language (screen "00") and every screen at high fidelity, light and dark.

## Styling approach

Use **NativeWind** (Tailwind syntax compiled to RN styles), not plain web Tailwind — plain Tailwind/PostCSS has no effect on native iOS/Android screens since RN doesn't parse CSS. Add it (`npx expo install nativewind tailwindcss` + the babel/metro config from NativeWind's Expo guide) before writing screens.

Map the tokens below into `tailwind.config.js` under `theme.extend.colors` / `.borderRadius` / `.fontFamily`, one entry per token name, so screens use `bg-surface`, `text-muted`, `border-strong`, `rounded-md`, `font-display`, etc. instead of raw hex.

## Design tokens (approved — source of truth is wireframe screen "00")

**Color — light** (default)

```
bg #F6F7F7   surface #FFFFFF   surface-2 #F0F2F2   border #DADEDE   border-strong #1B2020
text #1B2020   text-muted #5B6363   text-faint #8B9494
primary #1F7A6E   primary-hover #17645A   primary-pressed #124F47   on-primary #FFFFFF
success-fg #1E7B4D  success-bg #E4F3EA
warning-fg #92650A  warning-bg #FBF0D9
danger-fg  #A23B2E  danger-bg  #FBE4E0
info-fg    #1F7A6E  info-bg    #E3F1EE
```

**Color — dark**

```
bg #14181A   surface #1C2124   surface-2 #242A2D   border #333B3E   border-strong #4A5457
text #EDEFEF   text-muted #9AA3A3   text-faint #6B7576
primary #3FA396   primary-hover #56B5A8   primary-pressed #2C8478   on-primary #0C1210
success-fg #6FD79A  success-bg #163425
warning-fg #E8B854  warning-bg #3A2C10
danger-fg  #F08A75  danger-bg  #3B1712
info-fg    #5FC2B2  info-bg    #16302C
```

Wire both up as an RN color scheme / NativeWind `dark:` variant — every screen must support both, toggle-able, matching the wireframes.

**Typography** — Manrope (display/headings, weights 600/700/800) + Public Sans (body, weights 400/500/600/700). Deliberately not Inter/Roboto/Arial.

**Radius** — sm 8, md 12, pill 999 (px).

**Motion** — fast 120ms (button/chip/press feedback), base 200ms (theme switch, card/border transitions), slow 320ms (a value animating in, e.g. a progress bar). Standard ease-out on the way in, ease-in on the way out. Nothing spins, bounces, or loops without a state actually changing — motion is subtle and functional, never decorative.

**Surface style** — bordered & flat: hairline 1px borders, no drop shadows except a small one under a floating action button.

## Navigation — Expo Router structure

Bottom tabs on phone/tablet (Home, Properties, Finance, Alerts, More) become a **persistent left sidebar** at the laptop breakpoint (see screen 16) — same routes, different chrome, switched with `useWindowDimensions` in the tab layout rather than two separate navigators.

Suggested route layout (adjust as the build reveals better splits, but keep the tab group and the modal/stack flows separate):

```
app/
  _layout.tsx                 root layout — theme provider (light/dark), auth gate
  login.tsx                   01 Login / OTP onboarding

  (tabs)/
    _layout.tsx                tab bar ⇄ sidebar switcher at the laptop breakpoint
    index.tsx                  02 Dashboard (Home)
    properties/
      index.tsx                04 Property Registry (list)
      [id].tsx                  06 Property Detail
    finance/
      index.tsx                12 Rent Ledger / 13 Utility Bills (segmented control, one screen)
    alerts/
      index.tsx                14 Notifications Center
    more/
      index.tsx                More menu → Owner Profiles, Legal Config, Settings

  owners/
    index.tsx                  03 Owner Profiles

  properties/
    new.tsx                    05 Add / Edit Property (modal-presented stack screen)

  tenants/
    new.tsx                    07 Add Tenant Profile

  agreements/
    new/
      step1.tsx                08 New Agreement — Parties & Terms
      step2.tsx                09 New Agreement — Legal & Compliance
      step3.tsx                10 New Agreement — Documents & Review
    [id].tsx                   11 Agreement Detail (renders 11b's On Notice/Ended/Renewed states inline by status)
    [id]/give-notice.tsx        18 Give Notice

  bills/
    new.tsx                    17 Record Utility Bill

  legal-config.tsx             15 Legal Config reference (Maharashtra)
```

The three-step new-agreement flow and the property/tenant/bill "new" screens are stack screens presented modally over whichever tab is active, not tabs themselves.

## Screens (v1, 20 total)

**Onboarding & home** — 01 Login/OTP · 02 Dashboard
**Owners & properties** — 03 Owner Profiles · 04 Property Registry (list) · 05 Add/Edit Property · 06 Property Detail
**Tenancy & agreements** — 07 Add Tenant Profile · 08 New Agreement (Parties & Terms) · 09 New Agreement (Legal & Compliance) · 10 New Agreement (Documents & Review) · 11 Agreement Detail · 11b Agreement states (On Notice / Ended / Renewed) · 18 Give Notice
**Finance** — 12 Rent Ledger · 13 Utility Bills · 17 Record Utility Bill
**Compliance & alerts** — 14 Notifications Center · 15 Legal Config reference (Maharashtra)
**Responsive** — 16 phone → tablet → laptop exhibit (layout rules for every list/table screen)

## Product decisions locked in during review (build to these, not the BRD defaults)

- **Agreement lifecycle**: Active → **On Notice** (record who raised it — owner or tenant — and the expected vacate date from the agreement's notice-period clause) → **Ended** (no automatic action; owner explicitly chooses "Mark vacant" or "Renew") → **Renewed** (creates a brand-new agreement record, never an extension of the old one; both records cross-link so the history is visible).
- **Partial rent/bill payments**: a shortfall is tracked as a separate "pending payment" against the specific period/bill it came from. It is **never** rolled into or added on top of a later period's due amount.
- **Utility bills have variable amounts** — there's no fixed recurring figure. The amount is entered at the time the bill is recorded, along with paid-in-full vs. partial, and a proof-of-payment document upload.
- **Legal Config is version-pinned** to each agreement's creation date. A later change to Maharashtra rental law does not retroactively change numbers on already-created agreements.
- **Tenant profile reuse across agreements** — not needed in v1.
- **Bulk import** — not needed in v1.
- Every agreement carries a **notice period clause**; the "On Notice" status exists specifically to track that clause being invoked.

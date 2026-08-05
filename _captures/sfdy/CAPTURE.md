# Capture: Starflight Dynamics
Source: https://www.starflight-dynamics.com
Date: 2026-08-06
Framework: Wix (SPA, JS-heavy — static rebuild in Astro)

## Pages
| Route | Notes |
|---|---|
| `/` | Hero (space bg), Newsletter (white), Ecosystem Partners, Earth section |
| `/jointhecrew` → `/careers` | Careers: full crew content + open positions |
| `/investors` | Hero, contact info, newsletter |
| `/news` | Grid of 14 articles, newest-first |
| `/news/[slug]` | Individual article pages |
| `/imprint` | German Impressum (§5 TMG) |
| `/privacy-policy` | GDPR privacy policy |
| `/terms-conditions` | (stub — coming soon) |

## Sections (Home, in order)
1. **Nav** — fixed, frosted glass; logo left; INVESTORS / CAREERS / NEWS right
2. **Hero** — full-height, dark space background (hero-bg.jpg); headline about propulsion tech (was "CURRENTLY UNDER CONSTRUCTION" at capture time — use substantive copy)
3. **Newsletter** — white bg (#fff), two-column: left `#SFDY-UPDATES` label + "Stay in the loop." | right email input + blue "SIGN UP" button (#384AD3)
4. **Ecosystem Partners** — heading "ECOSYSTEM PARTNERS"; logos in a row: bavAIRia, BDLI, BDI/NewSpace; all displayed with `filter: brightness(0) invert(1)` (white logos on dark)
5. **Earth section** — full-width earth-from-orbit background (earth-bg.jpg); tagline "SEE YOU UP THERE!"
6. **Footer** — SFDY wordmark, social icons (LinkedIn, Instagram, X, Facebook, email), links: HOME | PRIVACY POLICY | IMPRINT | copyright

## Sections (Careers `/jointhecrew`, in order)
1. **Hero** — sci-fi corridor image (careers-hero.jpg); heading "JOIN THE SFDY CREW!"
2. **HI AT SFDY** — "We're in the business of breaking barriers…"
3. **MORE THAN A COMPANY** — "STARFLIGHT DYNAMICS is a community of dreamers, thinkers and doers…"
4. **GET ON BOARD** — CTA email: join-the-crew@starflight-dynamics.com
5. **FROM MUNICH TO THE STARS** — Munich Space Valley copy
6. **OPEN POSITIONS** — "A complete list of our current vacancies will be available here soon." + proactive applications welcome

## Sections (Investors, in order)
1. **Hero** — rocket launch image (investors-hero.jpg)
2. **Pitch deck callout** — "For any in-depth information and our pitch deck, please do not hesitate to reach out"
3. **Contact** — invest.in@starflight-dynamics.com
4. **Newsletter** — same white-bg block as home

## Design Tokens
See tokens.json

## Assets
| File | Description |
|---|---|
| `assets/logo.png` | SFDY wordmark, white on transparent |
| `assets/hero-bg.jpg` | Home hero background, dark space |
| `assets/earth-bg.jpg` | Earth from orbit, full-width section |
| `assets/careers-hero.jpg` | Sci-fi space corridor |
| `assets/investors-hero.jpg` | Rocket launch |
| `assets/partner-bavairia.png` | bavAIRia partner logo |
| `assets/partner-bdli.png` | BDLI partner logo |
| `assets/partner-newspace.png` | BDI / NewSpace partner logo |

## News Articles (newest-first)
1. New at SFDY: Jonas Radtke, VP Operations — Jun 18, 2026
2. SFDY featured in "Tough Tech by the Tough Ten" Report — Dec 1, 2025
3. COMPANY ANNOUNCEMENT: First ReaGAn milestone cleared! — Nov 4, 2025
4. COMPANY ANNOUNCEMENT: SFDY selected for "The Startup Lithuania Accelerator" — Sep 29, 2025
5. COMPANY ANNOUNCEMENT: Starflight Dynamics awarded BAAINBw contract — Jul 29, 2025 (news grid shows Jul 1)
6. COMPANY ANNOUNCEMENT: Pre-Seed Round for SFDY! — Jul 23, 2025 (news grid shows Apr 15)
7. From Toronto to Space: SFDY Joins the Creative Destruction Lab! — Sep 19, 2024 (news grid: Mar 1)
8. New at SFDY: Carolina Rocha, Chief of Staff — Aug 6, 2024 (Nov 15)
9. New at SFDY: Dr. Tina Sorgenfrei — Jul 22, 2024 (Oct 1)
10. New at SFDY: Matthias Spott, NewSpace pioneer — May 14, 2024 (Sep 1)
11. Reflecting on an incredible year 2023 — Dec 21, 2023 (Dec 31)
12. GATE Space and STARFLIGHT DYNAMICS in exploratory talks — Dec 5, 2023
13. Hello there, we have been missing you! — Nov 28, 2023
14. Welcome, Levion Materials! — Feb 20, 2025

## Social Links
- LinkedIn: https://www.linkedin.com/company/starflight-dynamics/
- Instagram: https://www.instagram.com/starflight_dynamics/
- X: https://twitter.com/SFDY_Space
- Facebook: https://www.facebook.com/profile.php?id=100092226416926

## Contact Emails
- General: mission-control@starflight-dynamics.com
- Investors: invest.in@starflight-dynamics.com
- Careers: join-the-crew@starflight-dynamics.com
- Press: press@starflight-dynamics.com

## Legal (Imprint)
- Starflight Dynamics GmbH, Tal 44, 80331 Munich, Germany
- Legal rep: Dr. Philipp Bauer, Co-Founder & CEO
- Register: HRB282254, Amtsgericht München
- VAT: DE360871568

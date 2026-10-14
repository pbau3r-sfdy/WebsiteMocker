# Phase 12 Legal Checklist: sfdy privacy policy and imprint

**Purpose (D-06, D-09).** Handed to the operator and, if wanted, a lawyer before `/wm-publish sfdy`. Every legal-relevant statement of the two pages is listed as it stands in the source. This is an inventory, not a legal opinion: nothing here is approved, and ticking the boxes does not gate the plan or the publish workflow. Statements are quoted or tightly paraphrased from the files; line numbers refer to the commit that created this file.

Files: `sites/sfdy/src/pages/privacy-policy.astro` (live URL `/privacy-policy`, do not rename), `sites/sfdy/src/pages/imprint.astro`.

## Privacy policy (`privacy-policy.astro`)

| # | Item | Statement | Page | File:line | Operator/lawyer OK | Notes |
|---|---|---|---|---|---|---|
| P1 | Controller | Starflight Dynamics GmbH, Tal 44, 80331 Munich, mission-control@starflight-dynamics.com | Privacy s1 | privacy-policy.astro:8 | [ ] | |
| P2 | Joint controller (Applications) | For applications to positions in Vilnius, Starflight Dynamics UAB, Gynėjų g. 4-333, LT-01110 Vilnius, is joint controller with the GmbH | Privacy s1 | privacy-policy.astro:8 | [ ] | No joint-controller arrangement (Art. 26 GDPR) is referenced; the Jobs page currently says Coming soon |
| P3 | Hosting | Hosted on GitHub Pages (GitHub, Inc., San Francisco, USA); GitHub logs IP address and technical data; certified under the EU-US Data Privacy Framework; no access to logs beyond what GitHub provides | Privacy s2 | privacy-policy.astro:9 | [ ] | Provider and location stated; DPF claim should be re-checked at publish time |
| P4 | Hosting legal basis | Art. 6 (1)(f) GDPR, legitimate interest in a secure, reliable website | Privacy s2 | privacy-policy.astro:9 | [ ] | |
| P5 | Cookies | "This website sets no cookies." | Privacy s3 | privacy-policy.astro:10 | [ ] | Consistent with Plausible cookie-free mode; no consent banner exists in the source |
| P6 | Fonts | All fonts self-hosted; no connection to third-party font services | Privacy s3 | privacy-policy.astro:10 | [ ] | grep of `src` and `public` found no Google Fonts references |
| P7 | Web analytics provider | Plausible Analytics, Plausible Insights OÜ, Tartu, Estonia; data hosted in the EU | Privacy s4 | privacy-policy.astro:12 | [ ] | Phase 10 D-04 confirmed 2026-10-14; the source comment on line 11 still says DRAFT (D-08), a comment only, not rendered |
| P8 | Analytics: cookie-free, no consent | No cookies, no personal data stored, no cross-site tracking, IP address not stored; aggregated statistics only | Privacy s4 | privacy-policy.astro:12 | [ ] | No consent banner is shipped; relies on this statement being true |
| P9 | Analytics legal basis and objection | Art. 6 (1)(f) GDPR; objection any time under Art. 21 by email | Privacy s4 | privacy-policy.astro:12 | [ ] | |
| P10 | Contact form | Name, email and message processed to answer; transmitted through Web3Forms as processor | Privacy s5 | privacy-policy.astro:13 | [ ] | Form posts to `https://api.web3forms.com/submit` (contact.astro:37); no processing agreement referenced |
| P11 | Contact legal basis and retention | Art. 6 (1)(b) where contract-related, otherwise Art. 6 (1)(f); deleted when the request is settled unless retention periods apply | Privacy s5 | privacy-policy.astro:13 | [ ] | |
| P12 | Newsletter | Mailchimp (The Rocket Science Group LLC, Atlanta, USA), DPF certified; double opt-in; sign-up and confirmation time recorded; Art. 6 (1)(a); withdraw via unsubscribe link | Privacy s6 | privacy-policy.astro:14 | [ ] | Form posts to Mailchimp list-manage (Newsletter.astro:4); double opt-in is a Mailchimp audience setting, verify it is on for audience 88bca13b57 |
| P13 | Applications | CV, cover letter, contact data processed; Art. 6 (1)(b); security clearance notice; deleted six months after the decision unless longer retention agreed | Privacy s7 | privacy-policy.astro:15 | [ ] | Jobs collection is removed, no application form exists on the site; applications arrive by email |
| P14 | Social media | Links to LinkedIn, X, Instagram, Facebook; plain links, no data reaches the platforms until clicked | Privacy s8 | privacy-policy.astro:16 | [ ] | Footer has exactly these four (Footer.astro:9-14). The Share component links LinkedIn/X share URLs on posts (Share.astro:8-9), also plain links. wiring.json lists four more socials (threads, youtube, tiktok, discord) not rendered on the site |
| P15 | Data subject rights | Access (15), rectification (16), erasure (17), restriction (18), portability (20), objection (21), withdrawal of consent (7 (3)); contact by email | Privacy s9 | privacy-policy.astro:17 | [ ] | |
| P16 | Supervisory authorities | GmbH: BayLDA, Ansbach; UAB: State Data Protection Inspectorate of Lithuania, Vilnius | Privacy s9 | privacy-policy.astro:17 | [ ] | No separate data protection officer or DPO contact is named; none is stated as required |
| P17 | Automated decisions | No decisions based solely on automated processing, including profiling | Privacy s10 | privacy-policy.astro:18 | [ ] | |
| P18 | Version / last_updated | "Version: 14 October 2026." | Privacy s11 | privacy-policy.astro:19 | [ ] | Preflight reads this as the last_updated date (within 12 months) |
| P19 | Contact for privacy matters | mission-control@starflight-dynamics.com | Privacy s1, s4, s9 | privacy-policy.astro:8,12,17 | [ ] | Shared mailbox, no dedicated data protection contact |

## Imprint (`imprint.astro`)

| # | Item | Statement | Page | File:line | Operator/lawyer OK | Notes |
|---|---|---|---|---|---|---|
| I1 | Company (DE) | Starflight Dynamics GmbH, Tal 44, 80331 Munich, Germany | Imprint | imprint.astro:11-12 | [ ] | |
| I2 | Register (DE) | Amtsgericht München, HRB 282254 | Imprint | imprint.astro:13 | [ ] | |
| I3 | Representative (DE) | Dr. Philipp Bauer, Managing Director | Imprint | imprint.astro:14 | [ ] | |
| I4 | VAT ID | DE360871568 | Imprint | imprint.astro:15 | [ ] | |
| I5 | Contact (DE) | mission-control@starflight-dynamics.com | Imprint | imprint.astro:16 | [ ] | No telephone number shown |
| I6 | Company (LT) | Starflight Dynamics UAB, Gynėjų g. 4-333, LT-01110 Vilnius, Lithuania | Imprint | imprint.astro:18-19 | [ ] | |
| I7 | Register (LT) | Register of Legal Entities of the Republic of Lithuania, company code 307442013 | Imprint | imprint.astro:20 | [ ] | |
| I8 | Representative (LT) | Dr. Philipp Bauer, acting Director | Imprint | imprint.astro:21 | [ ] | |
| I9 | Subsidiary relation | UAB is a wholly owned subsidiary of the GmbH | Imprint | imprint.astro:52 | [ ] | |
| I10 | Content responsibility | Dr. Philipp Bauer, address as above, § 18 (2) MStV | Imprint | imprint.astro:25 | [ ] | |
| I11 | Press contact | press@starflight-dynamics.com | Imprint | imprint.astro:26 | [ ] | |
| I12 | Consumer dispute resolution | Neither willing nor obliged to take part in proceedings before a consumer arbitration board | Imprint | imprint.astro:27 | [ ] | |
| I13 | Liability for content | Own content under § 7 (1) DDG; §§ 8 to 10 DDG no monitoring duty | Imprint | imprint.astro:28 | [ ] | |
| I14 | Liability for links | External sites outside our control; checked when linked; removed on notice | Imprint | imprint.astro:29 | [ ] | External links: social profiles, share links, Mailchimp, Web3Forms |
| I15 | Copyright | German copyright law applies to site content | Imprint | imprint.astro:30 | [ ] | |
| I16 | Image credits | All images by Starflight Dynamics GmbH; some created with AI tools | Imprint | imprint.astro:31 | [ ] | AI-generated imagery disclosure |
| I17 | Social media | Imprint also applies to profiles on LinkedIn, X, Instagram, Facebook | Imprint | imprint.astro:32 | [ ] | |
| I18 | Open-point placeholders | No `tbd` lines are set in the imprint source; the Tbd component renders only the slot in production | Imprint | imprint.astro:8-9 | [ ] | Imprint unchanged by this plan, so the verify-phase-11-1.sh blob assertion was not re-baselined |

## Preflight result

`/wm-preflight` run by hand against `sfdy` on 2026-10-14 (stage 5, before publish).

| check | status | note |
|---|---|---|
| Build completes, no errors | PASS | production and sandbox builds green via `verify-phase-12.sh prod` and `sandbox` |
| No TypeScript errors | PASS | covered by the Astro build |
| No `{{PLACEHOLDER}}` strings in src | PASS | grep for `{{...}}`, PLACEHOLDER, lorem found nothing |
| Hero headline present | PASS | index.astro:30 "We build for Europe's defence in space." |
| At least 1 news post | PASS | src/content/news holds posts from 2025-07-23 on |
| Image references exist | PASS | production build resolves them, no missing-asset errors |
| Wiring: stage reflects progress | PASS | stage 5, not hand-set to 6; publish.yml writes stage 6 and last_deploy |
| Wiring: domain set (stage >= 5) | PASS | www.starflight-dynamics.com |
| Wiring: newsletter not Formspree placeholder | PASS | Mailchimp, audience 88bca13b57, us17 |
| Wiring: contact form id set | PASS | Web3Forms |
| Wiring: socials configured | PASS | status configured; see note P14 on four extra entries |
| Analytics: `plausible()` in astro.config.mjs | PASS | astro.config.mjs:9 |
| Analytics: sandboxUsesProdId absent | PASS | removed from wiring.json |
| Legal: imprint has no placeholder lines | PASS | no dash-only lines, no tbd entries |
| Legal: privacy last_updated within 12 months | PASS | the preflight skill names `privacy.astro`; the real page is `privacy-policy.astro` (Pitfall 9, not renamed because the URL is live); Version 14 October 2026 |
| Legal: legal.impressum and legal.privacy complete | PASS | both "complete" in wiring.json (a status flag, not legal approval) |
| Legal: `check-analytics-gate.mjs sfdy --live` exits 0 | PASS | also asserted in `verify-phase-12.sh ident` |
| `validate-brand.mjs` passes | PASS | asserted in `ident` |
| Keywords: at least 3 primary keywords | PASS | three primary keywords |
| Keywords: hashtag arrays non-empty | WARN | `keywords.json` hashtag arrays (twitter, linkedin, instagram) and `brand.hashtags` are empty, operator decision, non-blocking |

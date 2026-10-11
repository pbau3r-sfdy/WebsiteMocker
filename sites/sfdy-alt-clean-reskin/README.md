# sfdy-alt-clean-reskin — Starflight Dynamics (complete reskin)

Port of the Claude Design "Website complete reskin" (11 Oct 2026) for internal review
with the team and our communication consultants. Sandbox only: no production path,
the live site stays `sfdy-alt-clean`. Pages ask not to be indexed.

- Preview: https://pbau3r-sfdy.github.io/WebsiteMocker/sfdy-alt-clean-reskin/
- Local:   `npm run dev` → http://localhost:4412/WebsiteMocker/sfdy-alt-clean-reskin/

## Open points

Everything still to resolve is marked in high-visibility yellow (`<Tbd id="…">`) and
listed on `/open-points`, with links to each spot. The list lives in
`src/data/open-points.ts`; every marker must reference an entry there (the build
fails otherwise). Resolve the content, then remove the marker and its entry.

## Notes

- Job listings are placeholders and are built on purpose (drafts included) so the
  careers design can be reviewed.
- Fonts (Avenir Next, IBM Plex Mono) are self-hosted, as the Privacy page states.

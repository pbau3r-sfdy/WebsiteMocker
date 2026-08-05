# /wm-list-sites

Print a status overview of all sites in the monorepo.

## Steps

1. Read all `sites/*/wiring.json` files.

2. For each site, display:
   - Slug and display name
   - Maturity stage (number + label)
   - Wiring status: newsletter ✓/—, forms ✓/—, socials ✓/—
   - Legal status: impressum ✓/—, privacy ✓/—
   - Sandbox URL
   - Production domain (if set)
   - Last deploy timestamp

3. Print a summary line: `N sites · X live · Y in progress`.

## Stage labels
| # | Label |
|---|-------|
| 0 | Captured |
| 1 | Instantiated |
| 2 | Content Ready |
| 3 | Wired |
| 4 | Legal Complete |
| 5 | Prod Ready |
| 6 | Live |

## Notes
- If `wiring.json` is missing for a directory, list it as stage 0 / unconfigured

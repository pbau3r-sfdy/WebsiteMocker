# /wm-publish

Build and publish a stage-5 site to its production GitHub Pages URL.

## Steps

1. **Read `sites/<slug>/wiring.json`** — confirm all three fields are set before triggering anything:
   - `stage >= 5` — if not, stop with: "Error: site `<slug>` is stage X — must be stage 5 before publishing"
   - `domain` — if missing, stop with: "Error: domain not set in `sites/<slug>/wiring.json`"
   - `prod_repo` — if missing, stop with: "Error: prod_repo not set in `sites/<slug>/wiring.json`"

2. **Run `/wm-preflight <slug>`** — present the full preflight output. If any item is FAIL, stop and list the failures. Do not proceed to Step 3 until all FAIL items are resolved.

3. **Trigger the publish workflow**:
   ```bash
   gh workflow run publish.yml --field slug=<slug>
   ```
   If this command fails (e.g. `gh` not authenticated, workflow not found), surface the exact error and stop.

4. **Wait for workflow completion** — after triggering, wait 3 seconds for the run to appear, then retrieve the run ID and stream live output:
   ```bash
   sleep 3
   RUN_ID=$(gh run list --workflow publish.yml --limit 1 --json databaseId -q '.[0].databaseId')
   gh run watch "$RUN_ID" --exit-status
   ```
   `gh run watch --exit-status` streams progress to the terminal and exits with the workflow's exit code.

5. **On success** — if `gh run watch` exits 0, print:

   ```
   --- Publish complete ---

   Site: <slug>
   Live URL: https://<domain>

   --- Squarespace DNS Handoff Guide ---

   Add these records in Squarespace Domains > DNS Settings:

   1. CNAME record (www subdomain):
      Host: www
      Points to: pbau3r-sfdy.github.io
      TTL: Automatic

   2. Apex A records (for root domain, e.g. example.com):
      Host: @
      Points to: 185.199.108.153
      Host: @
      Points to: 185.199.109.153
      Host: @
      Points to: 185.199.110.153
      Host: @
      Points to: 185.199.111.153
      TTL: Automatic

   3. CAA record check:
      If the domain has any CAA records, ensure letsencrypt.org is listed.
      Squarespace-hosted domains typically have no CAA records — no action needed.

   4. SSL provisioning:
      GitHub Pages provisions SSL via Let's Encrypt within 15–30 minutes.
      Do NOT enable "Secure" / HTTPS redirect in Squarespace until SSL is active —
      enabling it before the certificate is ready will show a security error.

   5. Default record deletion (IMPORTANT):
      Delete any existing Squarespace-default A records or CNAME records pointing
      to Squarespace servers (typically 198.185.159.x or similar) before saving
      the new records. Leaving both causes DNS conflicts and intermittent 404s.

   wiring.json has been automatically updated to stage: 6.
   ```

6. **On failure** — if `gh run watch` exits non-zero, print:
   ```
   Publish failed. Inspect the workflow log:
   gh run view "$RUN_ID" --log-failed
   ```
   Do not update wiring.json manually — the workflow only commits back on success.

## Notes
- Only works for sites at stage 5 (all preflight checks must pass before triggering)
- `WM_PUBLISH_PAT` must be stored as a repo-level Actions secret before this skill can succeed
- Check workflow status anytime: `gh run list --workflow publish.yml --limit 5`
- Re-deploying an already-live site (stage 6) is safe — publish.yml is idempotent; CNAME and robots.txt are re-written on every run

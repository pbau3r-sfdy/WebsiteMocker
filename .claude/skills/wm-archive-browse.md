# /wm-archive-browse

Browse the Wayback Machine snapshot history for any site in `wiring.json` and optionally capture a historical snapshot's design DNA. The script contacts the CDX API directly — no API keys required. Use this skill to inspect how a site looked at a past date and to pull historical design DNA into `_captures/` for remixing.

---

## Steps

### 1. Collect inputs

Ask the operator for:
- **Slug** — must exist in `sites/` (e.g. `sfdy-alt-clean`), OR a **bare domain name** (e.g. `starflight-dynamics.com`). Validate that the input is non-empty before proceeding.
- **Optional: `--limit N`** — appending this flag to the Step 2 command overrides the default 100-snapshot fetch; useful for domains with a long archive history.

### 2. Run timeline

Execute the script and display its full output:

```bash
node _scripts/archive-browse.mjs <slug>
```

Read all stdout and present the full year-grouped timeline to the operator. Do not reformat or truncate the output — reproduce it exactly as printed.

### 3. Select a snapshot

Prompt the operator:

> "Enter the 14-digit timestamp you want to inspect (e.g. `20240315123045`), or press Enter to exit."

If the operator provides a timestamp, continue to Step 4. If they press Enter or type nothing, go to Step 6.

### 4. Inspect snapshot

Print the `if_` URL in a plain code block so the operator can click it directly:

```
https://web.archive.org/web/<timestamp>if_/<domain>
```

Then say: "Open this URL in your browser to inspect the historical design."

Then ask: "Capture this snapshot? (y/n)"

Do NOT proceed to Step 5 until the operator explicitly types `y`. This confirm gate is mandatory — it cannot be bypassed in this skill, even if the operator has already expressed intent to capture.

### 5. Run capture

Execute the capture handoff:

```bash
node _scripts/archive-browse.mjs <slug> --capture <timestamp>
```

The script validates the timestamp against the CDX response, then hands off to `capture-site.mjs`. Playwright will run inline — wait for it to complete.

After the command finishes, report: "Design DNA written to `_captures/<slug>-<timestamp>/`."

### 6. Done

Timeline browsing complete. Run `/wm-archive-browse` again to inspect another snapshot.

---

## Notes

- **`--limit N`** — appending this flag to the Step 2 command overrides the default 100-snapshot fetch; useful for domains with a long history
- **domain is read from `wiring.json`** — the script reads `sites/<slug>/wiring.json`; if `domain` is null or missing, the script exits 1 with an actionable error — update `wiring.json` before re-running
- **bare domain input** — if the operator provides a domain name (contains a dot) instead of a slug, the script uses it directly without reading `wiring.json`; `--capture` is not available in domain mode (no slug to build the output path)
- **capture output is namespaced** — historical captures land in `_captures/<slug>-<timestamp>/` to prevent overwriting the live site capture in `_captures/<slug>/`
- **CDX fetch requires internet** — the script contacts `web.archive.org`; if the network is unavailable, the script exits 1 with a clear message

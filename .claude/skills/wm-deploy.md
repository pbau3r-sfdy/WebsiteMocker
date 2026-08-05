# /wm-deploy

Build and push to GitHub Pages (sandbox deployment).

## Steps

1. **Confirm** which site to deploy (or "all" for full build).

2. **Build**:
   - Single site: `cd sites/<slug> && npm run build`
   - All: `node _scripts/build-all.js`

3. **Check for build errors** — stop and report if any.

4. **Commit and push**:
   ```bash
   git add -A
   git commit -m "deploy: <slug> — <brief description>"
   git push origin main
   ```

5. **Update `wiring.json`** — set `last_deploy` to current ISO timestamp.

6. **Report** the sandbox URL and that GitHub Actions is now running the deploy (~60–90 seconds to go live).

## Notes
- GitHub Actions handles the actual Pages deploy — this skill just pushes the trigger commit
- Sandbox URL format: `https://pbau3r-sfdy.github.io/WebsiteMocker/<slug>`
- Check Actions status: `gh run list --limit 5`

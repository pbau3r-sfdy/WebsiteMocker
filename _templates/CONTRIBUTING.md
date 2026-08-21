# Contributing to {{SITE_NAME}}

This repository is the contributor surface for the live site at `https://{{DOMAIN}}`. The site
source lives in the [WebsiteMocker](https://github.com/pbau3r-sfdy/WebsiteMocker) sandbox, where
the site operator reviews every change and decides when to publish. Contributions go through a
two-tier model depending on whether you are adding content or requesting a design change.

## Two-tier contribution model

| What you want to do | How to do it |
|---|---|
| Add a news article | Push a `.md` file to `content/news/` |
| Add a job posting | Push a `.md` file to `content/jobs/` |
| Add an announcement | Push a `.md` file to `content/announcements/` |
| Add a blog post | Push a `.md` file to `content/blog/` |
| Change wording on an existing page | Open a **Content Request** issue |
| Change colours, layout, or fonts | Open a **Design Change** issue |
| Add a whole new page | Open a **Design Change** issue |
| Something is broken on the live site | Open a **Bug Report** issue |
| Remove or unpublish existing content | Open a **Content Request** issue |

## Tier 1 — content you can push directly

The only path you may push to is `content/`. Four subdirectories are accepted:

- `content/news/`
- `content/jobs/`
- `content/announcements/`
- `content/blog/`

Files follow the naming convention `YYYY-MM-DD-slug.md` (for example,
`2026-09-01-new-partnership.md`). You can create and edit these files entirely in the GitHub web UI
— no local checkout and no build step required.

**What happens when you push:** your file is sent to the site operator's review queue
automatically. The operator reviews it and, when satisfied, publishes it to `https://{{DOMAIN}}`.
The live site does NOT update the moment you push — publication is a deliberate step taken by the
operator after review.

If a post is time-sensitive, say so in the commit message (for example,
`"Publish by 2026-09-05 — product launch"`) or open a Content Request issue with a `Publish by`
date.

### Tier 2 — everything else

For any change that is not a new content file, open an issue using one of the three templates in
this repository. The triage path is: the operator picks up the issue, implements the change in the
WebsiteMocker sandbox, and publishes it via the normal deploy pipeline.

**Do not push files outside `content/`.** In particular:

- Do not push changes to `.github/` or `CONTRIBUTING.md` — those require operator review and push
  nothing to the live site regardless.
- Do not push to the `gh-pages` branch. That branch is generated output; any hand edit is
  overwritten on the next publish.

## Content format

All content files use YAML frontmatter followed by the post body in Markdown. The schema is
enforced at build time — a file with a missing required field or a wrong type will fail the site
build. Dates must be quoted (`date: "2026-08-20"`, not `date: 2026-08-20`). The GitHub web UI
round-trips unquoted dates inconsistently, and the schema uses `z.coerce.date()` so a quoted ISO
string is the safe form.

### News (`content/news/YYYY-MM-DD-slug.md`)

```yaml
---
title: "Partnership Announced with Acme Ltd"
date: "2026-08-20"
summary: "Brief description for the news index and meta tags."
image: "https://example.com/photo.jpg"   # optional
imageCredit: "Photographer Name"          # optional
tags: ["partnership", "growth"]           # optional
short: "Short card title"                 # optional — used in compact card views
---

Body text in Markdown follows the frontmatter.
```

### Jobs (`content/jobs/YYYY-MM-DD-slug.md`)

```yaml
---
title: "Senior Software Engineer"
department: "Engineering"    # optional
location: "Berlin, Germany"
type: "full-time"            # one of: full-time, part-time, contract
open: true                   # optional — defaults to true; set false to hide the listing
date: "2026-08-20"
---

Job description in Markdown.
```

### Announcements (`content/announcements/YYYY-MM-DD-slug.md`)

```yaml
---
title: "Office Closure — Bank Holiday"
date: "2026-08-20"
summary: "Brief description for the announcements index."
tags: ["office", "holiday"]   # optional
---

Full announcement text in Markdown.
```

### Blog (`content/blog/YYYY-MM-DD-slug.md`)

```yaml
---
title: "How We Build Fast Websites"
date: "2026-08-20"
author: "Jane Smith"          # optional
summary: "Brief description for the blog index and meta tags."
image: "https://example.com/photo.jpg"   # optional
tags: ["engineering", "performance"]     # optional
---

Blog post body in Markdown.
```

## Removing content

The automated sync is additive-only. When your push reaches WebsiteMocker, content files are
copied in; nothing is deleted. **Deleting a file from this repository does NOT unpublish it from
the live site.** To request that a piece of content is removed from `https://{{DOMAIN}}`, open a
Content Request issue and describe what to remove.

## What happens after you push

1. You commit a `.md` file under `content/` on the `main` branch of `{{PROD_REPO}}`.
2. `content-ci.yml` in this repository fires (path-filtered to `content/**/*.md`, so edits to
   `CONTRIBUTING.md` or `.github/` trigger nothing).
3. `content-ci.yml` sends a `content-updated` event to the WebsiteMocker source repository.
4. WebsiteMocker's `content-sync.yml` workflow picks up the event, copies your file into
   `sites/{{SLUG}}/src/content/`, and commits it there — the live site is not touched at this
   point.
5. The site operator reviews the change in the WebsiteMocker sandbox and publishes it. At that
   point `https://{{DOMAIN}}` serves your page.

If step 2 does not happen (the workflow does not appear in the Actions tab within a minute of your
push), check the Actions tab of `{{PROD_REPO}}` for error messages and verify that the
`WM_DISPATCH_PAT` secret is set under *Settings > Secrets and variables > Actions*.

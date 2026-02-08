# Root-level and stale markdown audit

**Date:** February 2025  
**Purpose:** List root-level `.md` files and document cleanup candidates. No files were deleted.

---

## Root-level markdown (repo root only)

| File | Status | Action |
|------|--------|--------|
| `README.md` | Active; main project readme | **Keep** |

There is only one markdown file at the project root: **README.md**. It is in active use and should be kept.

**Note:** `README.md` references `PROFESSIONNALISATION_COMPLETE.md` (missing at root). Consider updating that link to a doc in `docs/` or removing it.

---

## Cleanup candidates (do not delete – document only)

These files look outdated or one-off (completed tasks, old deployment notes). Consider archiving or consolidating into `docs/` when convenient. **None were deleted.**

### In `.cursor/`

| File | Likely status | Suggestion |
|------|----------------|------------|
| `DEPLOYMENT_CHECKLIST.md` | One-off deployment checklist | Archive or merge into `docs/DEPLOYMENT_CHECKLIST.md` if still relevant |
| `DEPLOYMENT_EXECUTE.md` | Completed deployment steps | Archive or remove when no longer needed |
| `DEPLOYMENT_FINAL.md` | Completed deployment report | Archive or remove when no longer needed |
| `DEPLOYMENT_READY.md` | Completed status | Archive or remove when no longer needed |
| `DEPLOYMENT_STATUS.md` | Completed status | Archive or remove when no longer needed |
| `DEPLOYMENT_STEPS.md` | Completed steps | Archive or remove when no longer needed |
| `DEPLOYMENT_SUCCESS.md` | Completed report | Archive or remove when no longer needed |
| `PRE_DEPLOYMENT_GUIDE.md` | May still be useful | Keep or move to `docs/` if referenced |
| `COMPLETION_REPORT.md` | Phase completion report | Archive when no longer needed |
| `FINAL_SUMMARY.md` | Phase summary | Archive when no longer needed |
| `corrections-effectuees.md` | Completed corrections log | Archive when no longer needed |
| `corrections-phase2.md` | Completed phase log | Archive when no longer needed |
| `fichiers-erreurs-rapport.md` | Old error report | Archive when no longer needed |
| `progress-corrections.md` | Old progress log | Archive when no longer needed |
| `audit-plan.md` | May still be useful | Keep or move to `docs/` |
| `CODING_ERRORS_REFERENCE.md` | May still be useful | Keep or move to `docs/` |

### Actively useful (keep as-is unless consolidating)

- `.cursor/rules.md` – cursor rules
- `.cursor/quick-start.md` – quick start
- `.cursor/DEVELOPMENT_BIBLE.md` – referenced by agents
- `.cursor/agents/*` – agent briefs and index

---

## Summary

- **Root:** Only `README.md`; keep it. Fix or remove the broken link to `PROFESSIONNALISATION_COMPLETE.md`.
- **Cleanup candidates:** Several `.cursor/*.md` files look like completed deployment/phase reports and could be archived or removed later; no deletions were made.
- **Active:** `README.md`, `docs/*`, `.cursor/rules.md`, `.cursor/quick-start.md`, `.cursor/DEVELOPMENT_BIBLE.md`, and `.cursor/agents/` appear in use.

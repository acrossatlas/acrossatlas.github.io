# Preparation record

Checked on 2026-09-05 (Asia/Shanghai).

## Local environment

| Item | Status |
| --- | --- |
| Git | 2.50.1, available |
| Node.js | 20.20.2, available |
| npm | 10.8.2, available |
| GitHub CLI | 2.100.0, installed for this workspace |
| Git repository | Initialized locally on `main` |
| Commit-safety hook | Enabled through `.githooks` |
| Git author identity | Configured locally with a GitHub private commit address |
| GitHub authentication | Authenticated as `acrossatlas` |
| Remote repository | `acrossatlas/acrossatlas.github.io` |
| Website framework | React with Vite |
| Website content | Home prototype with Map and Trip tabs plus a date-gated Ongoing card; notebook content pending |
| GitHub Pages publishing | Configured through GitHub Actions |
| Custom domain | Not purchased or configured |

## Identity

- GitHub account: `acrossatlas`
- Intended free site address: `https://acrossatlas.github.io/`
- Intended custom domain: `acrossatlas.cn`

## Integration decision

GitHub CLI is sufficient for repository creation, authentication, remote management, and Pages configuration. A GitHub-specific MCP connection is not required for the planned workflow.

## Prepared safeguards

- Private-material directories and credential files are excluded from Git.
- A local pre-commit hook blocks common private paths, credential formats, raw-photo formats, and files larger than 15 MB.
- Project boundaries distinguish public travel material from private albums and documents.
- The production build is static and remains portable to another static hosting provider.

## Decisions still required

1. Replace fictional journey copy with approved public-safe content.
2. Refine the Map and Trip views after reviewing the first prototype.
3. Purchase and bind `acrossatlas.cn` only after the deployment is approved.

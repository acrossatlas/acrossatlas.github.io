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
| Website framework | Not selected |
| Website content | Not started |
| GitHub Pages publishing | Automatically initialized by GitHub; no site content yet |
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
- No framework or hosting-specific build configuration has been added, preserving those choices for the planning discussion.

## Decisions still required

1. Agree on the information architecture before writing content.
2. Choose the static-site framework after the architecture is clear.
3. Decide when to add the first publishable page; the Pages endpoint is currently empty.
4. Purchase and bind `acrossatlas.cn` only after the local prototype and deployment plan are approved.

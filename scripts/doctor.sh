#!/bin/sh

set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
workspace_gh="$project_root/.tools/bin/gh"

printf 'Project: %s\n' "$project_root"
printf 'Git:     %s\n' "$(git --version)"
printf 'Node:    %s\n' "$(node --version)"
printf 'npm:     %s\n' "$(npm --version)"

if command -v gh >/dev/null 2>&1; then
  gh --version | sed -n '1p'
elif [ -x "$workspace_gh" ]; then
  "$workspace_gh" --version | sed -n '1p'
else
  printf '%s\n' 'GitHub CLI: not found'
  exit 1
fi

if git config --get user.name >/dev/null 2>&1 && git config --get user.email >/dev/null 2>&1; then
  printf 'Git identity: %s <%s>\n' "$(git config --get user.name)" "$(git config --get user.email)"
else
  printf '%s\n' 'Git identity: not configured yet'
fi

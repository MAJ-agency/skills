#!/usr/bin/env bash
# =============================================================================
# Worktrees où une branche a été extraite (HEAD courant ou journal HEAD du worktree),
# pour retrouver la session propriétaire d'une PR : la session dont le `cwd` est ce
# worktree (`list_sessions`).
#
# Usage : bash scripts/chaine/proprietaire.sh <branche>
# =============================================================================
set -euo pipefail
branche=${1:?usage : proprietaire.sh <branche>}

git worktree list --porcelain | awk '/^worktree / { print substr($0, 10) }' | while read -r w; do
  [ -d "$w" ] || continue
  if [ "$(git -C "$w" rev-parse --abbrev-ref HEAD 2>/dev/null)" = "$branche" ] ||
    git -C "$w" reflog --format='%gs' 2>/dev/null | sed -n 's/^checkout: moving from .* to //p' |
    grep -q -F -x "$branche"; then
    echo "$w"
  fi
done

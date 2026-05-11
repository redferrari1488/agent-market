#!/usr/bin/env bash
# Sync Claude Code memory between machines via a single tarball.
#
# Usage:
#   scripts/memory-sync.sh export           # pack ~/.claude/.../memory -> .claude-memory.tar.gz
#   scripts/memory-sync.sh import           # unpack .claude-memory.tar.gz -> ~/.claude/.../memory
#   scripts/memory-sync.sh import --force   # import even if local memory is newer than archive
#
# Transfer .claude-memory.tar.gz between machines via iCloud / Telegram / USB.
# The tarball is gitignored on purpose — memory contains private strategy notes.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ARCHIVE="$REPO_DIR/.claude-memory.tar.gz"

find_memory_dir() {
  local matches count
  matches=$(find "$HOME/.claude/projects" -maxdepth 2 -type d -name memory 2>/dev/null \
    | grep -- '-agent-market/memory$' || true)
  if [[ -z "$matches" ]]; then
    return 1
  fi
  count=$(printf '%s\n' "$matches" | wc -l | tr -d ' ')
  if [[ "$count" -gt 1 ]]; then
    echo "Multiple memory dirs found, set MEMORY_DIR env var to pick one:" >&2
    printf '%s\n' "$matches" >&2
    exit 1
  fi
  printf '%s' "$matches"
}

cmd="${1:-}"
case "$cmd" in
  export)
    MEMORY_DIR="${MEMORY_DIR:-$(find_memory_dir || true)}"
    if [[ -z "${MEMORY_DIR:-}" || ! -d "$MEMORY_DIR" ]]; then
      echo "Memory dir not found. Set MEMORY_DIR explicitly." >&2
      exit 1
    fi
    if [[ -z "$(ls -A "$MEMORY_DIR" 2>/dev/null)" ]]; then
      echo "Memory dir $MEMORY_DIR is empty — refusing to export." >&2
      exit 1
    fi
    tar -czf "$ARCHIVE" -C "$MEMORY_DIR" .
    echo "Exported $MEMORY_DIR"
    echo "         -> $ARCHIVE"
    echo "Files inside:"
    tar -tzf "$ARCHIVE" | sed 's|^\./||' | grep -v '^$' | sort
    echo
    echo "Next: drop $ARCHIVE into iCloud/Telegram/USB, then on the other machine run:"
    echo "  scripts/memory-sync.sh import"
    ;;
  import)
    force="${2:-}"
    if [[ ! -f "$ARCHIVE" ]]; then
      echo "No archive at $ARCHIVE — copy it here first." >&2
      exit 1
    fi
    # Resolve target memory dir. If absent yet (fresh machine), derive from PWD.
    MEMORY_DIR="${MEMORY_DIR:-$(find_memory_dir || true)}"
    if [[ -z "${MEMORY_DIR:-}" ]]; then
      # Build slug from repo path: /Users/foo/agent-market -> -Users-foo-agent-market
      slug="${REPO_DIR//\//-}"
      slug="${slug#-}"
      slug="-$slug"
      MEMORY_DIR="$HOME/.claude/projects/$slug/memory"
      echo "No existing memory dir — creating $MEMORY_DIR"
    fi
    # Safety: don't clobber memory that's newer than the archive
    if [[ "$force" != "--force" && -d "$MEMORY_DIR" && -n "$(ls -A "$MEMORY_DIR" 2>/dev/null)" ]]; then
      tar_mtime=$(stat -f %m "$ARCHIVE" 2>/dev/null || stat -c %Y "$ARCHIVE")
      mem_mtime=$(find "$MEMORY_DIR" -type f -exec stat -f %m {} \; 2>/dev/null | sort -rn | head -1)
      [[ -z "$mem_mtime" ]] && mem_mtime=$(find "$MEMORY_DIR" -type f -exec stat -c %Y {} \; 2>/dev/null | sort -rn | head -1)
      mem_mtime=${mem_mtime:-0}
      if (( mem_mtime > tar_mtime )); then
        echo "Local memory is newer than archive — skipping import."
        echo "  local:   $MEMORY_DIR (mtime $mem_mtime)"
        echo "  archive: $ARCHIVE (mtime $tar_mtime)"
        echo "Pass --force to overwrite anyway."
        exit 0
      fi
    fi
    mkdir -p "$MEMORY_DIR"
    # Clear existing contents safely
    if [[ -n "$MEMORY_DIR" && "$MEMORY_DIR" != "/" && "$MEMORY_DIR" != "$HOME" ]]; then
      find "$MEMORY_DIR" -mindepth 1 -delete
    fi
    tar -xzf "$ARCHIVE" -C "$MEMORY_DIR"
    echo "Imported $ARCHIVE"
    echo "       -> $MEMORY_DIR"
    echo "Files:"
    ls -1 "$MEMORY_DIR"
    ;;
  *)
    echo "Usage: $0 {export|import}" >&2
    exit 1
    ;;
esac

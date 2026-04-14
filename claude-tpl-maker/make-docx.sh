#! /bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
node "$SCRIPT_DIR/.claude/skills/brenso-word/scripts/brenso-rapport.js" "$1" "${2:-brenso-raport.docx}"
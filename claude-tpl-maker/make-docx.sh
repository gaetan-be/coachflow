#! /bin/bash

claude --model "${CLAUDE_MODEL:-claude-sonnet-4-20250514}" --output-format json --dangerously-skip-permissions --allow-dangerously-skip-permissions -p "Génere un rapport BRENSO avec le fichier JSON $1, le nom du rapport doit être brenso-raport.docx" < /dev/null
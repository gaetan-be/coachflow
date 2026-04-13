#! /bin/bash

claude --model best --output-format json  --dangerously-skip-permissions --allow-dangerously-skip-permissions -p "Génere un rapport BRENSO avec le fichier JSON $1, le nom du rapport doit être brenso-raport.docx"
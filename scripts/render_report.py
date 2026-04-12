#!/usr/bin/env python3
"""
Render a docx report from a Jinja2 template using docxtpl.

Reads JSON from stdin with:
  - template_path: path to the .docx template
  - output_path:   path to write the rendered .docx
  - All other keys are passed as template context variables

Exits 0 on success, 1 on error (message on stderr).
"""

import json
import sys
import os
from docxtpl import DocxTemplate, RichText


def make_rich_text(text):
    """Convert a plain string with newlines into a RichText object for docxtpl."""
    if not text:
        return ""
    rt = RichText()
    lines = text.split("\n")
    for i, line in enumerate(lines):
        rt.add(line)
        if i < len(lines) - 1:
            rt.add("\a")  # \a = vertical tab = line break in docx
    return rt


def main():
    try:
        raw = sys.stdin.read()
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"Invalid JSON input: {e}", file=sys.stderr)
        sys.exit(1)

    template_path = data.pop("template_path", None)
    output_path = data.pop("output_path", None)

    if not template_path or not os.path.isfile(template_path):
        print(f"Template not found: {template_path}", file=sys.stderr)
        sys.exit(1)

    if not output_path:
        print("No output_path specified", file=sys.stderr)
        sys.exit(1)

    # Convert AI chapter texts to RichText (preserves line breaks)
    chapter_keys = [
        "chapitre_enneagramme",
        "chapitre_mbti",
        "chapitre_riasec",
        "chapitre_competences_besoins",
        "chapitre_metiers",
        "chapitre_plan_action",
    ]
    for key in chapter_keys:
        if key in data and isinstance(data[key], str) and data[key]:
            data[key] = make_rich_text(data[key])

    # Also convert multi-line plain text fields
    for key in ["notes_coach", "plan_action", "loisirs", "choix"]:
        if key in data and isinstance(data[key], str) and "\n" in data[key]:
            data[key] = make_rich_text(data[key])

    try:
        doc = DocxTemplate(template_path)
        doc.render(data)
        doc.save(output_path)
    except Exception as e:
        print(f"Render error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

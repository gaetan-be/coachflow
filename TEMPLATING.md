# Report Template Cheat Sheet (docxtpl / Jinja2)

The Word template at `templates/report-template.docx` is rendered by Python using [docxtpl](https://docxtpl.readthedocs.io/) which uses Jinja2 syntax.

## Basic variables

```
{{prenom}}  {{nom}}  {{age}}
{{date_naissance}}  {{date_seance}}
{{ecole}}  {{code_postal}}
{{loisirs}}  {{choix}}
{{mbti}}  {{riasec}}
{{ennea_base}}  {{ennea_sous_type}}
{{notes_coach}}  {{plan_action}}
{{valeurs}}  {{competences}}  {{besoins}}
```

These are plain strings. Multi-line fields (`notes_coach`, `plan_action`, `loisirs`, `choix`) and AI chapters are converted to RichText so line breaks render correctly in Word.

## AI-generated chapters

```
{{chapitre_enneagramme}}
{{chapitre_mbti}}
{{chapitre_riasec}}
{{chapitre_competences_besoins}}
{{chapitre_metiers}}
{{chapitre_plan_action}}
```

## Conditionals

Show a block only if a value is set:

```
{% if mbti %}
Type MBTI : {{mbti}}
{% endif %}
```

## Loops — tag lists

`valeurs_list`, `competences_list`, `besoins_list` are arrays of `{val}`.

Inline comma-separated:
```
{% for v in valeurs_list %}{{v.val}}{% if not loop.last %}, {% endif %}{% endfor %}
```

Bullet list (one per paragraph):
```
{% for v in valeurs_list %}
  - {{v.val}}
{% endfor %}
```

## Loops — metiers (nested)

`metiers` is an array of `{nom, motscles, formations}` where `formations` is an array of `{ecole, ville}`.

```
{% for m in metiers %}
Metier {{loop.index}} : {{m.nom}}
{{m.motscles}}

  {% for f in m.formations %}
  - {{f.ecole}} ({{f.ville}})
  {% endfor %}

{% endfor %}
```

## Table row loops

To repeat a table row for each item, use `{%tr %}` tags **inside a table cell**:

```
{%tr for m in metiers %}
| {{m.nom}} | {{m.motscles}} |
{%tr endfor %}
```

Same for tag lists in a table:
```
{%tr for v in valeurs_list %}
| {{v.val}} |
{%tr endfor %}
```

## Table column loops

To repeat columns:
```
{%tc for v in valeurs_list %}
{{v.val}}
{%tc endfor %}
```

## Images (if needed later)

docxtpl supports inserting images via `InlineImage`. Not currently wired up but can be added in `render_report.py`.

## Testing your template

Fast iteration without AI calls:
```bash
npx ts-node src/scripts/generate-report.ts <coachee_id> --skip-ai
```

This generates `output_report.docx` with placeholder text in all AI chapters. Edit your template, re-run, check the output.

## All available variables

| Variable | Type | Description |
|----------|------|-------------|
| `prenom` | string | First name |
| `nom` | string | Last name |
| `date_naissance` | string | Birth date (dd/mm/yyyy) |
| `age` | string | Calculated age |
| `ecole` | string | School name |
| `annee_scolaire` | string | School year |
| `orientation` | string | Current orientation |
| `code_postal` | string | Zip code |
| `loisirs` | RichText | Hobbies (multiline) |
| `choix` | RichText | Career choices (multiline) |
| `date_seance` | string | Session date (dd/mm/yyyy) |
| `ennea_base` | string | Enneagramme types (e.g. "4,7,2") |
| `ennea_sous_type` | string | Subtype (Social/Survie/Tete-a-tete) |
| `mbti` | string | 4-letter MBTI code |
| `riasec` | string | RIASEC codes (e.g. "S,I,E") |
| `valeurs` | string | Comma-separated values |
| `valeurs_list` | array | `[{val: "..."}, ...]` |
| `competences` | string | Comma-separated skills |
| `competences_list` | array | `[{val: "..."}, ...]` |
| `besoins` | string | Comma-separated needs |
| `besoins_list` | array | `[{val: "..."}, ...]` |
| `metiers` | array | `[{nom, motscles, formations: [{ecole, ville}]}]` |
| `plan_action` | RichText | Action plan (multiline) |
| `notes_coach` | RichText | Coach notes (multiline) |
| `chapitre_enneagramme` | RichText | AI chapter |
| `chapitre_mbti` | RichText | AI chapter |
| `chapitre_riasec` | RichText | AI chapter |
| `chapitre_competences_besoins` | RichText | AI chapter |
| `chapitre_metiers` | RichText | AI chapter |
| `chapitre_plan_action` | RichText | AI chapter |

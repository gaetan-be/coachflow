# Project Brief Brenso
We want to create a easier way for a coach to gather the first information from a Young coachee. 
The coach works in a environment where she helps younger people select the right school according to their profile. 
She works with 3 methodologies, MBTI, RIASSEC and the ENEAGRAM. 

The website and backoffice need to be in french exclusively for now. 


In the file: references/brenso-coach-pipeline.html you will find the main page that the coach will use in the backoffice. Ignore the auto-import secion and the document library section.

In the file: references/brenso-questionnaire-jeune.html you will find the page that the young coachee will have to fill in. 

# Workflow
- The coach send a fixed link to the coachee. 
- The coachee, fills in the form (same as references/brenso-questionnaire-jeune.html) and sends it. 
- The coach sees the new filled in form appearing in a list in her backoffice. 
- The coach consults the cochees form in the backoffice, selects the type of profile based on the 3 methodoologies, adds a comment and clicks "Make report". 
- When make report is clicked, a job is queued to create a report
- A background task (Cron job), will process the queued jobs. It will Create a word document report (based on a template), store it in the database, and send it to the coach. 

# Style and colors. 
Respect the Colors, style, fonts and UI mindset in references/brenso-coach-pipeline.html and references/
brenso-questionnaire-jeune.html scrupulusouly.

# Structure of the project
The project has 1 part that is public. 
This he part that the coach sends to the coachee. 
It is exactly what is in the page references/brenso-coach-questionnaire-jeune.html. 

Next to that there is backoffice that is behind a login and password. 
The backoffice has the functionatlities : View all forms, view form (with the make report button)

# Tech requirements
- Docker stack
- Database is Postgresql
- Frontend: HTML, CSS, Javascript for the frontend. Keep it simple.
- Backend: Typescript.

# Datamodel 
* Coach table (Name, login and password)
* Coachee table linkd to Coach
* CoacheeReports table containing the binary data of the report.
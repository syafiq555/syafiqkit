# Research behind the tracker shape (05/11/2026)

**Published templates read** (their web pages; the files themselves were not opened):
- Asana issue log: asana.com/templates/issue-log
- Demandmetric issue log: demandmetric.com/content/issue-log-template
- ProjectManager.com: projectmanager.com/blog/what-is-an-issue-log
- Monday.com: monday.com/blog/project-management/issue-log-template/
- Atlassian Jira issue log: atlassian.com/software/jira/templates/issue-log
- Atlassian Confluence decision log: atlassian.com/software/confluence/templates/decision-log
- Smartsheet issue tracking and RAID sets: smartsheet.com/content/issue-tracking-templates, smartsheet.com/content/raid-templates
- Spreadsheet Daddy RAID template
- ClickUp and Edworking decision logs
- Retable change log
- Getmany client feedback tracker: getmany.com/blog/managing-client-feedback-and-revisions

**What they share:**
- ID, description, raised by kept separate from owner, priority, status, raised / target / closed dates, one comments field.
- Statuses are Open / In progress / Blocked / Resolved / Closed. None names whose turn it is. Only Getmany's two fields (implementation status plus client approval status) and an Airtable client page's "Waiting on" field express it.
- No template keeps a dated reply log.
- Change requests and decisions usually get their own lists, because their fields differ (approved by, scope impact; decision, who decided, when).

**Tools compared for a client-facing tracker:**
- **Google Sheets:** free, and clients already know it. No workflow engine, so the structure has to do the work.
- **ClickUp:** guests on the Free plan get full edit rights; paid plans give a few edit-guest seats plus unlimited read-only guests (clickup.com/pricing).
- **Airtable:** read-only collaborators, forms and share links are free on paid plans (airtable.com/pricing).
- **Open-source options:**
  - Plane: has an Intake inbox for outside requests (docs.plane.so/core-concepts/intake).
  - Redmine: per-role "own issues only" visibility.
  - Leantime: client management in its open-source edition.
  - All of them need a server to run and patch, plus a new login for clients. Huly needs 8 GB RAM, Zammad 6 GB or more, and Focalboard is unmaintained.

**Choice:** a Sheets tracker whose status is whose turn, because the reader needs no new tool. It moves to a board tool (with its client portal) only when the team is ready to make that board the one place the work lives.

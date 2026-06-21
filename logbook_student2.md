# Oxygen Sports - Sports Event Sponsorship & Kit Donation Tracker
## Student 2 (Backend) - Internship Logbook

### Day 1: 02 June 2026
* **Tasks Undertaken**:
  * Read the introduction section twice to understand the domain and business rules.
  * Identified the necessary data entities: `sports_event_sponsorship_kit_donation` and `audit_logs` tables.
  * Mapped out the relationship schema between event tracking and audit logs.
* **Understanding of the Business Problem**:
  * Manual spreadsheet records cannot guarantee data integrity, leading to double-donations and tracking issues. The backend needs to enforce strict business rules to prevent over-budget allocations and audit all changes.

### Day 2: 03 June 2026
* **Tasks Undertaken**:
  * Written the data-integrity problem statement (lack of relational constraints, risk of duplicates, unmonitored updates).
  * Outlined the 3 critical business rules: donation value validation, mandatory visibility validation, and immutable audit logs.
  * Drafted the Technical Abstract for Express/SQL engine.
* **Key Decisions**:
  * Decided on relational database (MySQL/PostgreSQL) structure to enable complex audit logging and structured querying of visibility levels.

### Day 3: 04 June 2026
* **Tasks Undertaken**:
  * Defined 5 testable backend and data objectives (API endpoints, database safety, aggregation speeds).
  * Set up Express.js environment by creating [package.json](file:///C:/Users/Shiva/.gemini/antigravity/scratch/oxygen-sports-tracker/backend/package.json).
  * Implemented and run the initial backend server at [server.js](file:///C:/Users/Shiva/.gemini/antigravity/scratch/oxygen-sports-tracker/backend/server.js) with the GET `/health` route.
* **Key Decisions**:
  * Chose Express over standard http to keep coding lightweight and fast for development of APIs.

### Day 4: 05 June 2026
* **Tasks Undertaken**:
  * Designed the visual logic use cases outlining Store Staff and Manager interactions.
  * Formulated detailed REST routing endpoints with specific request schemas and response values.
  * Authored core processing calculation business rules in pseudocode format.
  * Uploaded backend documentation to [backend_use_cases_apis.md](file:///C:/Users/Shiva/.gemini/antigravity/scratch/oxygen-sports-tracker/docs/backend_use_cases_apis.md).
* **Key Decisions**:
  * Determined that updating record properties must be handled via a single PUT endpoint, triggering automatic insertions in `audit_logs`.

### Day 5: 06 June 2026
* **Tasks Undertaken**:
  * Designed PPT slides detailing the backend architecture flow, REST endpoint list, and schema relationships.
  * Prepared a plain-language summary explaining the validation engine rules for non-technical evaluation panels.
  * Practiced presentation scripts for backend slides to stay within a 3-minute delivery target.

### Day 6: 06 June 2026
* **Tasks Undertaken**:
  * Presented Review 1 slide decks containing API layouts and validation engine guidelines to **Pamba Vamshi Krishna Sir**.
  * Walked through the use cases, logic calculations, database schema, and live GitHub folder structure status.
  * Documented feedback concerning JSON formatting logic, audit logging specifications, and boundary calculations.
* **Key Decisions**:
  * Decided to implement custom JSON response messages with details on calculated excess margins for budget validation checks.

### Day 7: 08 June 2026
* **Tasks Undertaken**:
  * Updated API endpoints specifications under [backend_use_cases_apis.md](file:///C:/Users/Shiva/.gemini/antigravity/scratch/oxygen-sports-tracker/docs/backend_use_cases_apis.md) to log structured JSON details (exceeded values, allowed limits) on HTTP 400 validation overrides.
  * Researched industry designs for processing engine architectures to keep database operations transactional and safe.
* **Key Decisions**:
  * Used custom JSON structures for API error reports to ease parsing on the frontend check.

### Day 8: 09 June 2026
* **Tasks Undertaken**:
  * Completed backend architecture benchmarking of benchmark applications (OpenSponsorship API, CSRBOX database models).
  * Summarized gaps in data transaction structures, highlighting their lack of built-in constraint triggers and budget overflow handlers.
  * Documented findings in [existing_system_analysis_backend.md](file:///C:/Users/Shiva/.gemini/antigravity/scratch/oxygen-sports-tracker/docs/existing_system_analysis_backend.md).
* **Key Decisions**:
  * Documented the strict relationship mapping (Items -> Event -> Visibility) as the primary architectural advantage matching Oxygen Sports' business parameters.

### Day 9: 10 June 2026
* **Tasks Undertaken**:
  * Designed SQL database schema structures for the sponsorship logs table and the tracking audit table.
  * Created the Entity-Relationship Diagram mapping primary/foreign keys and 1:N cardinality relationships.
  * Documented logic calculations and saved all parameters to [database_design_backend.md](file:///C:/Users/Shiva/.gemini/antigravity/scratch/oxygen-sports-tracker/docs/database_design_backend.md).
* **Key Decisions**:
  * Stored variable data ranges (`items_donated`, `brand_visibility_received`) in serialized TEXT JSON data columns to accommodate dynamic listings easily in SQLite.

### Day 10: 11 June 2026
* **Tasks Undertaken**:
  * Initialized the SQLite database file and tables by writing the migration setup module [db.js](file:///C:/Users/Shiva/.gemini/antigravity/scratch/oxygen-sports-tracker/backend/db.js).
  * Programmed the GET and POST API endpoint controllers inside [server.js](file:///C:/Users/Shiva/.gemini/antigravity/scratch/oxygen-sports-tracker/backend/server.js) to execute data validations and record logs.
* **Key Decisions**:
  * Integrated audit logging directly inside the SQLite database write transaction to assure atomic updates.

### Day 11: 12 June 2026
* **Tasks Undertaken**:
  * Built the detail retrieval route `GET /api/sports_event_sponsorship_kit_donati/:id` inside [server.js](file:///C:/Users/Shiva/.gemini/antigravity/scratch/oxygen-sports-tracker/backend/server.js).
  * Implemented SQL pagination syntax calculations (`LIMIT` and `OFFSET` clauses) and dynamic WHERE filters supporting search keyword strings.
* **Key Decisions**:
  * Configured SQL wildcard conditions on both `event_name` and JSON strings inside the DB queries to allow flexible search matches.

### Day 12: 13 June 2026
* **Tasks Undertaken**:
  * Created `feature/backend` branch to merge database structures and Express router setups.
  * Moved the SQL migrations script into [01_init.sql](file:///C:/Users/Shiva/.gemini/antigravity/scratch/oxygen-sports-tracker/backend/migrations/01_init.sql) inside a new `/backend/migrations/` subdirectory.
* **Key Decisions**:
  * Separated raw SQL migration setup blocks into standalone script files to make upcoming schema scaling straightforward.

### Day 13: 15 June 2026
* **Tasks Undertaken**:
  * Built the core processing logic engine endpoint `GET /api/sports_event_sponsorship_kit_donati/:id/engine_analysis` inside [server.js](file:///C:/Users/Shiva/.gemini/antigravity/scratch/oxygen-sports-tracker/backend/server.js).
  * Programmed logic calculations checking budget utilization ratios, counting secured visibility elements, computing weighted ROI score indexes, and determining warning alert trends.
* **Key Decisions**:
  * Added edge-case constraints checking for zero budgets to prevent runtime divide-by-zero crashes on evaluations.

### Day 14: 16 June 2026
* **Tasks Undertaken**:
  * Code-reviewed all API controller files adding modular logic comments.
  * Drafted slides summaries containing architecture diagrams, ER schemas, logic pseudocodes, and active CRUD route lists.
  * Practiced backend presentations scripts to align with team delivery timers.

### Day 15: 17 June 2026
* **Tasks Undertaken**:
  * Validated frontend flow routing maps to ensure backend JSON payloads match interface models.
  * Formulated next development milestones mapping PUT update API controls, PATCH status controls, audit GET lists, and summary calculations.
  * Documented target route parameters in [remaining_work_plan_backend.md](file:///C:/Users/Shiva/.gemini/antigravity/scratch/oxygen-sports-tracker/docs/remaining_work_plan_backend.md).
* **Key Decisions**:
  * Planned a single aggregated dashboard summary API route (`/api/sports_event_sponsorship_kit_donati/summary`) to retrieve global expenditures efficiently.

### Day 16: 18 June 2026
* **Tasks Undertaken**:
  * Coded `PUT /api/sports_event_sponsorship_kit_donati/:id` with parameter checks to handle full updates.
  * Coded `PATCH /api/sports_event_sponsorship_kit_donati/:id/status` to change record status flags specifically.
  * Configured GET and POST paths for `/api/audit_logs` inside [server.js](file:///C:/Users/Shiva/.gemini/antigravity/scratch/oxygen-sports-tracker/backend/server.js).
* **Key Decisions**:
  * Enforced budget validations on PUT requests to block over-budget edits to existing logs.

### Day 17: 20 June 2026
* **Tasks Undertaken**:
  * Presented the backend database model, system architecture, and ER diagram to evaluator **Pamba Vamshi Krishna Sir**.
  * Walked through a worked numerical example demonstrating the logic engine's weighted ROI indexing rules.
  * Showed POST, GET, and PUT API requests working in Postman with real data.
* **Key Decisions**:
  * Decided to implement a CSV export handler in the next milestones based on reviewer recommendations.

### Day 18: 20 June 2026
* **Tasks Undertaken**:
  * Programmed the summary API endpoint `GET /api/reports/summary` inside [server.js](file:///C:/Users/Shiva/.gemini/antigravity/scratch/oxygen-sports-tracker/backend/server.js) that returns total spend, active counts, and 30-day time-series cost groupings.
  * Coded the data backup/export endpoint `GET /api/sports_event_sponsorship_kit_donati/export` which compiles records into download-ready CSV strings.
  * Configured error response status headers on CSV failures.
* **Key Decisions**:
  * Implemented manual JS aggregation in Express to dynamically fill 30-day date series gaps with zero counts, ensuring line charts render smoothly in the UI.

### Day 19: 22 June 2026
* **Tasks Undertaken**:
  * Coded the global stats summary API `GET /api/dashboard/summary` in [server.js](file:///C:/Users/Shiva/.gemini/antigravity/scratch/oxygen-sports-tracker/backend/server.js) computing overall spend, active projects, completed campaigns, and warning flags.
  * Seeded the SQLite database with 10 realistic test entries representing local schools and tournament campaigns.
  * Checked route integrations for all endpoints.
* **Key Decisions**:
  * Calculated warning flags dynamically inside the Express dashboard controller to evaluate live ROI status anomalies on client loads.

### Day 20: 23 June 2026
* **Tasks Undertaken**:
  * Coded `GET /api/sports_event_sponsorship_kit_donati/:id/detail` inside [server.js](file:///C:/Users/Shiva/.gemini/antigravity/scratch/oxygen-sports-tracker/backend/server.js) fetching joint audit logs and record histories.
  * Handled table join checks returning clean empty arrays when audit logs are not present.
  * Verified database constraints over the 15 newly seeded records.
* **Key Decisions**:
  * Configured JSON deserializations directly in the database callback wrapper to simplify payload parsing for the client details component.

### Day 21: 24 June 2026
* **Tasks Undertaken**:
  * Wrapped all Express route handlers in try-catch blocks to prevent unhandled promise rejections.
  * Standardised all API errors to follow `{"success":false,"message":"specific message","code":400/404/500}` structure.
  * Implemented an input sanitisation middleware stripping HTML tags and dangerous characters from incoming strings and parameter payloads.
  * Configured payload limitations (1mb limit) in the body parser to guard against extra-large requests.
* **Key Decisions**:
  * Targeted only specific text/input parameters for character sanitisation to avoid breaking JSON string patterns inside nested fields (like serialized kit items).

### Day 22: 25 June 2026
* **Tasks Undertaken**:
  * Created a hybrid PostgreSQL/SQLite database layer inside [db.js](file:///C:/Users/Shiva/.gemini/antigravity/scratch/oxygen-sports-tracker/backend/db.js) mapping parameters dynamically from standard SQLite format `?` to PostgreSQL format `$1`.
  * Added `pg` npm package dependency to backend dependencies.
  * Deployed the Express server to Render connected with a remote Supabase PostgreSQL database instances.
  * Tested every API endpoint at deployed URL and set production environment variables securely.
* **Key Decisions**:
  * Developed a transparent mock wrapper to dynamically adapt queries and emulated `this.lastID` contexts on PostgreSQL inserts, preserving existing route handlers.

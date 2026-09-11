# ByteFX IB Expense Manager

A Next.js App Router application in JavaScript/JSX, with Tailwind CSS, Geist, custom SVG controls and the supplied ByteFX logo. The implementation follows `ref/all_screens_UI.png`.

## Run locally

Node.js 20.9 or newer is required. Dependencies have already been installed in this workspace.

```powershell
npm.cmd run dev
```

Open http://localhost:3000/login.

The supplied `.env.local` explicitly enables **local demo mode**:

- Email: `name@bytefx.com`
- Password: `ByteFX2026!`

The login fields are prefilled in demo mode. All 324 initial entries are sample data. Additions and edits persist in `.data/demo/records.json`. The demo session key is generated once in `.data/demo-session-secret`. Demo mode is for local review, not a public deployment.

## Included workflows

- Login, password visibility, remember me and sign out.
- Search across client, channel and PSM.
- Searchable country, channel and PSM multi-selects; client search; numeric ranges; payout date range; social-presence filters.
- Apply/clear filters and remove individual applied chips.
- Sortable table headers, pagination and page-size selection.
- One social-links column with the reference-style dialog.
- Manual record creation, editing and read-only details.
- Excel template, .xlsx/.xls parsing, validation preview, row errors and duplicate detection.
- Import only valid rows; skip or update existing records.
- Export all records, or all matching filtered/sorted results across every page.
- Mobile filter drawer and horizontally scrolling table.

The three page routes are `/login`, `/ib-records`, and `/ib-records/add`. Editing uses `/ib-records/add?edit=<id>`; import is a tab on the same page.

## Data rules

Amounts and spreads must be nonnegative and have at most two decimal places. All commercial fields and the payout date are required. Social links are optional but must use HTTPS and the appropriate platform domain.

Countries accept ISO two-letter codes or English names. A possible duplicate is the same country, client name, channel name and payout date, ignoring name case and surrounding whitespace. Repeated records within one workbook are skipped after their first valid occurrence. Import validation runs again on the server when committing.

Use the downloaded template with the exact column names. Only the first worksheet is imported. The upload limit is 5 MB and 10,000 data rows. Formulas are rejected; paste values first. Excel date cells and ISO dates (`YYYY-MM-DD`) are supported.

## MySQL configuration

A MySQL adapter and schema are included, but this workspace runs in the requested local demo mode. MySQL connectivity has not been tested without a database.

1. Create an empty database and run `database/schema.sql`.
2. Set `DEMO_MODE=false` in `.env.local`.
3. Configure `DATABASE_URL`, `SESSION_SECRET`, `ACCOUNTANT_EMAIL`, `ACCOUNTANT_PASSWORD_HASH` and `APP_URL` using `.env.example`.
4. Restart the server. MySQL starts empty; demo records are not copied into it.

Generate a random session secret:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Generate the configured accountant password hash with:

```powershell
node scripts/hash-password.mjs
```

The helper prompts for a password with input hidden and prints a salted scrypt hash. Store the hash in the environment, never in source control. This initial application supports one configured internal accountant account; it does not include user provisioning or email password resets. The password help dialog directs users to their administrator.

Use HTTPS for a public deployment and set `APP_URL` to the browser-visible origin. Demo JSON storage supports one local server process; use MySQL for shared deployment.

## Checks

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
```

Browser tests use the locally installed Google Chrome and an isolated demo data directory on port 3100. They cover authentication, filtering, sorting, full-result Excel exports, manual validation, persistence, editing, import preview/duplicates and mobile overflow. Reference-comparison screenshots are saved in `artifacts/`.

Dependencies use the [Next.js App Router setup](https://nextjs.org/docs/app/getting-started/installation) and [SheetJS official distribution](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/).

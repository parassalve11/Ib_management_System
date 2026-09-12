# ByteFX IB Expense Manager — remaining changes

Extract `ib_management_protal.zip`, then `cd ib_management_protal && npm install && npm run dev`.
No dependency changes, no database changes.

## 1. Full-screen shell (the visible box border)

`src/styles/globals.css`

```
.app-shell  margin: 6px + 1px border + 9px radius + inset shadow   ->  margin 0, no border, no radius
.records-shell  height: calc(100dvh - 12px)                        ->  height: 100dvh
```

The panel is still there; it now reaches every edge of the screen so the outline is gone.
The duplicate override inside `@media (max-width: 600px)` was removed as it is now redundant.

## 2. Delete record — edit screen only

The dialog, the `DELETE /api/ib-records/[id]` route and the styles already existed, but the
only entry point was the edit form, so it was easy to miss.

Final behaviour: **Add IB Data -> Edit Record -> "Delete record"** (bottom left of the form).
That is the only place it appears. The records-table row menu (`...`) and the View Details
dialog keep just Edit record / View details.

The confirm dialog requires the exact client name (GitHub style) and the API re-checks the
name server-side before removing the row, so a mistyped or stale name cannot delete anything.

`src/components/dialogs/DeleteRecordDialog.jsx` now closes itself on success and formats the
payout date in the summary.

## 3. Excel import bug fix (important)

`src/lib/excel.js` used `XLSX.SSF.parse_date_code()` to convert Excel date serials.
`SSF` is **not** exported by the SheetJS ESM bundle that Next.js uses, so any workbook whose
Payout Date column holds a real Excel date (a number, not text) threw a TypeError and failed
the entire import. The Node test runner resolves the CommonJS build, where `SSF` does exist,
which is why the tests never caught it.

Replaced with a self-contained `serialToISODate()` — verified against SheetJS for the 1900
system, the 1900 leap-year quirk (serials 1 / 59 / 61) and the 1904 system.

Also fixed a broken character in the import preview pagination ("Showing 1?100" -> "1–100").

## 4. Test workbooks

`public/samples/`

| File | Rows | Purpose |
|---|---|---|
| `bytefx-ib-sample-50.xlsx` | 50 | Quick end-to-end import. Mixed country formats (`India`, `UAE`, `GB`, `Canada`) to exercise country matching. |
| `bytefx-ib-sample.xlsx` | 5,000 | Full-scale run (2.90 MB, under the 5 MB limit). Unchanged. |
| `bytefx-ib-validation-test.xlsx` | 17 | Every failure path on purpose. |

Expected result for the validation file: **7 Valid, 9 Invalid, 1 Needs attention, 2 warnings**

- Valid: clean row, country by full name, country by alias (`uae`), `$14.50` / `2,500.00`
  currency text, real Excel date serial, one of the repeated pair, row after a blank row
- Invalid: blank client name, `Wakanda`, negative amount, three decimal places, 31 Feb,
  `http://` link, facebook.com in the Telegram column, formula cell, `#REF!` cell
- Warnings: second worksheet ignored, unused `Internal Note` column ignored

To see "Possible duplicate" handling, import the same file twice — the second run should
report duplicates and respect the Skip/Update selector.

The importer step 1 now links all three files. `scripts/generate-test-workbooks.mjs`
regenerates the two small ones.

## 5. Favicon

The ByteFX mark (the icon on the left of the logo, cropped out of `public/bytefx.png`) is now
the browser icon, via the Next.js app-router file convention:

- `src/app/favicon.ico` — multi-size 16 / 32 / 48 / 64, transparent background
- `src/app/icon.png` — 512x512
- `src/app/apple-icon.png` — 180x180 on a white rounded tile for iOS home screens

No code change is needed; Next.js picks these up from `src/app/` and emits the link tags.
`scripts/` has no generator for them — they are committed images. The mark stays legible at
16px (checked at pixel level).

## 6. Tests

`npm test` — 15 pass, 0 fail. Three new tests: date-serial conversion, the 50-row workbook,
and the validation workbook status counts.

## Not verified here

The dev server and browser checks could not be run in this environment (`node_modules` was
not in the zip, and SheetJS installs from its own CDN, which is blocked). Please do one
visual pass on the records screen and one real import after `npm install && npm run dev`.

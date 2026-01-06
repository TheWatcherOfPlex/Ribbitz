# Ribbits Stat Assistant — Project Handoff (VS Code GPT)

This document explains the full project design and the exact implementation tasks the VS Code GPT instance should complete. The goal is a mostly self-automated pipeline:

1) You maintain a single Google Sheet during gameplay.
2) A PowerShell watcher script generates:
   - `mapping.generated.json` (derived from sheet rows)
   - One `.txt` file per stat (organized into folders by Type)
3) OBS reads the `.txt` files as Text Sources and updates live.
4) A second PowerShell script pushes JSON edits back into the sheet so AI can populate/organize values quickly.

---

## 0) High-level requirements (do not change)

### Google Sheet columns (A–E)
- **A = Label** (human friendly name; includes header rows like `== Combat ==`)
- **B = Value** (the displayed value; changes live)
- **C = Type** (dropdown: identity/core/skill/combat/etc.)
- **D = Key** (stable id; used to join sheet ↔ JSON ↔ filenames)
- **E = OutputFile** (optional; overrides output filename)

### Header rows
- Header is any row where **Column A matches**: `== Something ==`
- Apps Script must:
  - insert a **blank row above** each header (if not already blank)
  - style the header row:
    - **Font size 15**
    - **Bold**
    - **Background dark purple** (`#2B124C`)
    - **Text white** (`#FFFFFF`)

### Output organization
- Output `.txt` files must be in **folders by Type**:
  - `<outputFolder>\<type>\<outputFile>`

### Script behavior
- Main script: **Ribbits Stat Assistant**
  - pulls sheet → generates/updates `mapping.generated.json` → writes `.txt` files
  - runs once or loops (polling)
- Second script: **JSON to Sheet**
  - reads JSON edited by AI → updates sheet rows by `Key` (Column D)

---

## 1) Repository / folder structure (recommended)

Create a project folder like:

```
RibbitsStatAssistant/
  ribbits.config.json
  mapping.generated.json          (generated)
  RibbitsStatAssistant.ps1
  JsonToSheet.ps1
  README.md                       (optional, can be this file)
  apps_script/
    RibbitsStatAssistant.gs       (paste into Google Apps Script)
  logs/                           (optional)
```

OBS output folder example:
```
F:\OBS\DND\stats\
  identity\
  core\
  skill\
  combat\
  ...
```

---

## 2) Decisions VS Code GPT must make (pick one and implement)

### Decision A: Google Sheets Authentication for PowerShell
Choose **ONE** of these:

#### Option 1 (recommended): Service Account (headless, reliable)
Pros: no browser auth, stable, best for watchers.  
Cons: you must share the sheet with the service account email.

Implementation requirements:
- Create a Google Cloud project
- Enable **Google Sheets API**
- Create a **Service Account**
- Generate JSON key file: `service-account.json`
- Share your Google Sheet with the service account email (Editor permissions)

PowerShell will:
- Create a JWT
- Exchange it for an access token
- Call Sheets REST API

#### Option 2: OAuth user flow (interactive)
Pros: uses your Google account directly.  
Cons: token refresh/consent complexity; watcher may be brittle.

---

## 3) Google Sheet setup tasks (VS Code GPT must follow exactly)

### A) Create sheet and paste Column A labels
- Paste the provided “Column A list” into Column A (A1 downward).
- Leave B–E empty initially.

### B) Add Apps Script
- Extensions → Apps Script
- Create file: `RibbitsStatAssistant.gs`
- Paste the provided `.gs` framework.

### C) Add trigger + run setup
- In Apps Script:
  - Run `setupRibbitsSheet()` once (authorize when prompted)
  - Add an **installable trigger** for `onEdit`:
    - Event source: Spreadsheet
    - Event type: On edit

Validation:
- Column C has dropdown values.
- Header rows automatically become styled and have a blank row inserted above.

Important: The `onEdit` formatting must not spiral into repeated row insertions.
- The helper inserts only when Column A of the row above is not blank.

---

## 4) PowerShell scripts: required implementation tasks

Two scripts exist as frameworks. VS Code GPT must complete the TODOs (Google API calls) and finish the config wiring.

### Common requirements for both scripts
- Read `ribbits.config.json`
- Call the Google Sheets API to fetch `A:E` values
- Use Column D `Key` as stable join id

### A) Ribbits Stat Assistant.ps1 — MUST implement these functions

#### 1) `Get-SheetValues $cfg`
Must return an array of objects with properties:
- `Row` (1-based row number)
- `A`, `B`, `C`, `D`, `E`

Source:
- Google Sheets API `spreadsheets.values.get`
- Range should be: `'<worksheetName>'!A:E`
- Ensure `majorDimension=ROWS`

Example REST:
- GET `https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{worksheetName}!A:E`

#### 2) Authentication
Implement `Get-AccessToken` helper (if using Service Account):
- Create JWT signed with RSA private key from service account JSON
- POST to token endpoint: `https://oauth2.googleapis.com/token`
- Scope: `https://www.googleapis.com/auth/spreadsheets`

Cache token + expiry in memory to avoid re-auth every 2 seconds.

#### 3) Mapping rules (already specified)
- Header rows: `== ... ==` → add to JSON under `headers`
- Stat rows:
  - `type` from Column C; default `custom` if blank
  - `key` from Column D; if blank, slugify(Label)
  - `outputFile` from Column E; if blank, `"$key.txt"`
  - `cellA = "A{row}"`, `cellB = "B{row}"`
- Output:
  - Write `.txt` per stat to folder `<outputFolder>\<type>\`
  - Use UTF-8 no BOM

#### 4) Change detection
- Use a SHA-256 hash of the table to only rewrite outputs when sheet changes.
- Poll interval from config (2 seconds recommended).

#### 5) Write mapping JSON
- Generate to `mapping.generated.json`
- Ensure `ConvertTo-Json -Depth 10`

### B) JsonToSheet.ps1 — MUST implement these functions

#### 1) `Get-SheetValues $cfg`
Same as above.

#### 2) `Batch-UpdateSheetCells $cfg $updates`
Use Google Sheets API `spreadsheets.values.batchUpdate` to update:
- Column B Values by Key matches
- Optionally update label/type/outputFile when script switches are used

Example REST:
- POST `https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values:batchUpdate`
- Body:
```json
{
  "valueInputOption": "RAW",
  "data": [
    { "range": "Stats!B12", "values": [["17"]] }
  ]
}
```

---

## 5) ribbits.config.json — VS Code GPT must fill these fields

Required fields:
- `sheet.spreadsheetId`
- `sheet.worksheetName`
- `output.folder`
- `generatedMappingPath` (keep default unless desired)
- `pollSeconds`
- `typeOrder` (keep as provided)

If using service account:
- Add path to the credential file:
```json
"auth": {
  "mode": "serviceAccount",
  "serviceAccountJsonPath": ".\\service-account.json"
}
```

If using OAuth:
- Add the needed client config + token caching details.

---

## 6) JSON format expectations

`mapping.generated.json` must contain at minimum:
- `schemaVersion`
- `generatedAtUtc`
- `typeOrder`
- `headers` (array)
- `stats` (array)

Each stat must contain:
- `row`
- `label`
- `type`
- `key`
- `outputFile`
- `cellA`
- `cellB`

Optional: include `value` in generated JSON if helpful. If you do, ensure it does not break downstream.

---

## 7) OBS setup procedure (for user)

OBS side is intentionally simple:
- For each stat you want displayed:
  - Create a Text (GDI+) source
  - Enable “Read from file”
  - Point it to the corresponding `.txt` file the script writes

Because filenames are stable via Key/OutputFile, OBS sources do not break if labels change.

---

## 8) Exact user workflow (must support this)

1) User pastes labels into Column A.
2) Run Apps Script setup:
   - dropdown + header formatting.
3) Run `RibbitsStatAssistant.ps1 -Once`
   - generates initial `mapping.generated.json` + `.txt` files
4) User closes main script
5) VS Code GPT edits JSON:
   - populates Type, Key, OutputFile, values, reorganizes
6) Run `JsonToSheet.ps1` (push JSON → sheet)
7) User deletes old `.txt` files to clean up
8) Run `RibbitsStatAssistant.ps1` again
   - regenerates outputs with final naming and folder layout
9) OBS points sources to those files
10) Keep `RibbitsStatAssistant.ps1` running while playing; sheet edits update OBS live

---

## 9) Implementation hints (explicit instructions for VS Code GPT)

### Hint 1: Always prioritize stable IDs
- If Label changes, do NOT change Key unless user wants to rename files.
- If Key changes, OBS sources will break unless OutputFile stays stable.

### Hint 2: Add a “row skip” rule for headers and blanks
- If Column A is blank → skip row
- If Column A matches header regex → treat as header, skip output .txt generation

### Hint 3: Be careful inserting blank rows above headers
- Insert only if Column A of the row above is not blank.
- Do not insert if already blank.

### Hint 4: Service account is simplest for a watcher
Service account avoids browser-based OAuth and makes “always on” scripts easy.

### Hint 5: Token caching
In PowerShell, store:
- `$script:accessToken`
- `$script:tokenExpiryUtc`
Refresh only when within ~60 seconds of expiry.

### Hint 6: Output efficiency
Only rewrite `.txt` files on change (hashing is already in the framework).
Optionally optimize by writing only changed files.

---

## 10) Testing checklist (VS Code GPT must run through)

### Sheet + Apps Script
- [ ] Column C dropdown appears for at least first 200 rows
- [ ] Header row styling applies correctly
- [ ] Header inserts exactly one blank row above (not repeated)
- [ ] Editing a header label preserves formatting

### Ribbits Stat Assistant (PowerShell)
- [ ] Can fetch A:E data
- [ ] Generates `mapping.generated.json`
- [ ] Creates folders by type
- [ ] Creates `.txt` files with correct values
- [ ] Updates `.txt` when a value changes
- [ ] Does nothing when nothing changed

### JSON to Sheet
- [ ] Reads JSON stats array
- [ ] Matches rows by Key (Column D)
- [ ] Updates Column B for matched keys
- [ ] Optional switches update Column A/C/E correctly

---

## 11) Security constraints
- Do not hardcode secrets/tokens inside the scripts.
- Keep `service-account.json` out of Git (add to `.gitignore`).
- If using OAuth, store refresh tokens securely.

---

## 12) What VS Code GPT should deliver at the end

1) Working `RibbitsStatAssistant.ps1` with:
   - service account auth (preferred)
   - implemented `Get-SheetValues`
   - implemented token caching
   - outputs `.txt` by type
   - generates mapping JSON

2) Working `JsonToSheet.ps1` with:
   - implemented `Batch-UpdateSheetCells`
   - updates values by Key

3) Final `ribbits.config.json` populated with:
   - spreadsheetId
   - worksheetName
   - output folder
   - auth configuration

4) Apps Script installed and triggered:
   - dropdown + header formatting

---

## 13) Optional improvements (only after base works)
- Auto-fill Type based on header section name (mapping dictionary)
- Auto-generate Key on sheet side if blank (Apps Script)
- Auto-generate OutputFile from Key if blank (Apps Script)
- A “cleanup mode” that deletes orphan `.txt` files not present in current mapping
- Multi-line text block outputs for prepared spells, notes, etc.

End of handoff.

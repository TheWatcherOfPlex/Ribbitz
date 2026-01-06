/**
 * Ribbits Stat Assistant - Google Apps Script Framework
 * Sheet Columns:
 * A = Label
 * B = Value
 * C = Type (dropdown)
 * D = Key (stable id; optional)
 * E = OutputFile (optional)
 * 
 * REST API Endpoints (Web App):
 * GET  ?action=getValues  → Returns all A:E values as JSON
 * POST ?action=batchUpdate → Updates multiple cells by Key
 */

const CONFIG = {
  sheetName: "Stats",
  columns: { label: 1, value: 2, type: 3, key: 4, file: 5 },
  headerRegex: /^==\s*(.+?)\s*==\s*$/,
  typeOptions: [
    "identity",
    "core",
    "senses",
    "ability",
    "save",
    "skill",
    "combat",
    "slots",
    "spellcasting",
    "resource",
    "defense",
    "proficiency",
    "equipment",
    "exploration",
    "companions",
    "features",
    "feats",
    "notes",
    "custom"
  ],
  headerStyle: {
    fontSize: 15,
    bold: true,
    fontColor: "#FFFFFF",
    background: "#2B124C" // dark purple
  }
};

/**
 * One-time setup:
 * - Applies dropdown validation to column C
 * - Formats header rows (only run if needed)
 */
function setupRibbitsSheet() {
  const sh = getSheet_();
  applyTypeDropdown_(sh);
  // Don't auto-format headers - they're already formatted from CSV import
  // Only call formatAllHeaderRows_() manually if you need to reformat
}

/**
 * Manual function to format headers (only call if headers lost formatting)
 */
function formatHeaders() {
  const sh = getSheet_();
  formatAllHeaderRows_(sh);
}

/**
 * On edit trigger:
 * - If a header row is added/edited, ensure blank row above + formatting.
 * - If a regular stat row is edited, you may optionally auto-suggest a Type (not implemented here).
 */
function onEdit(e) {
  const sh = e.range.getSheet();
  if (sh.getName() !== CONFIG.sheetName) return;

  const row = e.range.getRow();
  const col = e.range.getColumn();

  // Only care when Column A changes (Label edits)
  if (col !== CONFIG.columns.label) return;

  const label = String(sh.getRange(row, CONFIG.columns.label).getValue() || "").trim();
  if (!label) return;

  if (CONFIG.headerRegex.test(label)) {
    ensureBlankRowAbove_(sh, row);
    styleHeaderRow_(sh, row);
  }
}

/**
 * Returns a normalized array of row objects for non-empty labels (excluding blank separator rows).
 * Includes header rows as type: "header".
 */
function readStatsTable() {
  const sh = getSheet_();
  const lastRow = sh.getLastRow();
  if (lastRow < 1) return [];

  const rng = sh.getRange(1, 1, lastRow, 5);
  const values = rng.getValues();

  const rows = [];
  for (let i = 0; i < values.length; i++) {
    const rowIndex = i + 1;
    const [label, value, type, key, file] = values[i].map(v => (v === null ? "" : v));

    const labelStr = String(label || "").trim();
    if (!labelStr) continue;

    const headerMatch = labelStr.match(CONFIG.headerRegex);
    if (headerMatch) {
      rows.push({
        row: rowIndex,
        kind: "header",
        headerTitle: headerMatch[1],
        label: labelStr
      });
      continue;
    }

    rows.push({
      row: rowIndex,
      kind: "stat",
      label: labelStr,
      value: value,
      type: String(type || "").trim(),
      key: String(key || "").trim(),
      outputFile: String(file || "").trim()
    });
  }
  return rows;
}

/**
 * Writes a list of stat objects back into the sheet (by Key).
 * Expects objects like: { key, value, label?, type?, outputFile? }
 * - Only updates rows that already exist (by Key column).
 * - Extension: You can add "insert if missing" later if desired.
 */
function updateSheetFromJson(stats) {
  const sh = getSheet_();
  const lastRow = sh.getLastRow();
  if (lastRow < 1) return { updated: 0 };

  const keyCol = CONFIG.columns.key;
  const valueCol = CONFIG.columns.value;

  const keys = sh.getRange(1, keyCol, lastRow, 1).getValues().flat().map(k => String(k || "").trim());
  const keyToRow = new Map();
  keys.forEach((k, idx) => { if (k) keyToRow.set(k, idx + 1); });

  let updated = 0;
  stats.forEach(s => {
    const k = String(s.key || "").trim();
    if (!k) return;
    const row = keyToRow.get(k);
    if (!row) return;

    sh.getRange(row, valueCol).setValue(s.value ?? "");
    updated++;
  });

  return { updated };
}

/* ----------------- Helpers ----------------- */

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(CONFIG.sheetName);
  if (!sh) throw new Error(`Sheet not found: ${CONFIG.sheetName}`);
  return sh;
}

function applyTypeDropdown_(sh) {
  const lastRow = Math.max(sh.getLastRow(), 1);
  const range = sh.getRange(1, CONFIG.columns.type, lastRow, 1);

  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.typeOptions, true)
    .setAllowInvalid(true) // allow temporary blanks
    .build();

  range.setDataValidation(rule);
}

function formatAllHeaderRows_(sh) {
  const lastRow = sh.getLastRow();
  if (lastRow < 1) return;

  const labels = sh.getRange(1, CONFIG.columns.label, lastRow, 1).getValues().flat();
  for (let i = 0; i < labels.length; i++) {
    const row = i + 1;
    const label = String(labels[i] || "").trim();
    if (!label) continue;
    if (CONFIG.headerRegex.test(label)) {
      // Only style the header, don't insert blank rows (CSV already has structure)
      styleHeaderRow_(sh, row);
    }
  }
}

function ensureBlankRowAbove_(sh, headerRow) {
  if (headerRow <= 1) return;

  const above = headerRow - 1;
  const aboveLabel = String(sh.getRange(above, CONFIG.columns.label).getValue() || "").trim();

  // If row above is not blank in column A, insert a blank row above the header
  if (aboveLabel) {
    sh.insertRowBefore(headerRow);
    // After insertion, header shifts down by 1. Style the shifted row.
    styleHeaderRow_(sh, headerRow + 1);
  }
}

function styleHeaderRow_(sh, row) {
  const rng = sh.getRange(row, 1, 1, 5);
  rng.setFontWeight(CONFIG.headerStyle.bold ? "bold" : "normal");
  rng.setFontSize(CONFIG.headerStyle.fontSize);
  rng.setFontColor(CONFIG.headerStyle.fontColor);
  rng.setBackground(CONFIG.headerStyle.background);
}

/* ----------------- REST API Endpoints (Web App) ----------------- */

/**
 * Web App GET endpoint
 * ?action=getValues → Returns all A:E row data as JSON
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === "getValues") {
      return handleGetValues_();
    }
    
    return jsonResponse_({ error: "Unknown action" }, 400);
    
  } catch (error) {
    return jsonResponse_({ error: error.toString() }, 500);
  }
}

/**
 * Web App POST endpoint
 * ?action=batchUpdate → Updates cells by Key
 * Body: JSON array of { key, value, label?, type?, outputFile? }
 */
function doPost(e) {
  try {
    const action = e.parameter.action;
    
    if (action === "batchUpdate") {
      return handleBatchUpdate_(e);
    }
    
    return jsonResponse_({ error: "Unknown action" }, 400);
    
  } catch (error) {
    return jsonResponse_({ error: error.toString() }, 500);
  }
}

/**
 * Returns all sheet values (A:E) as JSON array
 */
function handleGetValues_() {
  const sh = getSheet_();
  const lastRow = sh.getLastRow();
  
  if (lastRow < 1) {
    return jsonResponse_({ rows: [] });
  }
  
  const range = sh.getRange(1, 1, lastRow, 5);
  const values = range.getValues();
  
  const rows = [];
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    rows.push({
      row: i + 1,
      A: row[0] || "",
      B: row[1] || "",
      C: row[2] || "",
      D: row[3] || "",
      E: row[4] || ""
    });
  }
  
  return jsonResponse_({ rows: rows });
}

/**
 * Batch updates cells by Key
 */
function handleBatchUpdate_(e) {
  const sh = getSheet_();
  const lastRow = sh.getLastRow();
  
  if (lastRow < 1) {
    return jsonResponse_({ error: "Sheet is empty" }, 400);
  }
  
  // Parse request body
  let stats;
  try {
    const postData = e.postData.contents;
    stats = JSON.parse(postData);
  } catch (error) {
    return jsonResponse_({ error: "Invalid JSON: " + error.toString() }, 400);
  }
  
  if (!Array.isArray(stats)) {
    return jsonResponse_({ error: "Body must be an array" }, 400);
  }
  
  // Build Key → Row map
  const keyCol = CONFIG.columns.key;
  const keys = sh.getRange(1, keyCol, lastRow, 1).getValues().flat();
  const keyToRow = new Map();
  keys.forEach((k, idx) => {
    const key = String(k || "").trim();
    if (key) keyToRow.set(key, idx + 1);
  });
  
  // Prepare batch updates
  const updates = [];
  let matched = 0;
  let notFound = 0;
  
  stats.forEach(stat => {
    const key = String(stat.key || "").trim();
    if (!key) return;
    
    const row = keyToRow.get(key);
    if (!row) {
      notFound++;
      return;
    }
    
    matched++;
    
    // Always update Value (Column B)
    if (stat.value !== undefined) {
      updates.push({
        range: sh.getRange(row, CONFIG.columns.value),
        value: stat.value
      });
    }
    
    // Optionally update Label (Column A)
    if (stat.label !== undefined) {
      updates.push({
        range: sh.getRange(row, CONFIG.columns.label),
        value: stat.label
      });
    }
    
    // Optionally update Type (Column C)
    if (stat.type !== undefined) {
      updates.push({
        range: sh.getRange(row, CONFIG.columns.type),
        value: stat.type
      });
    }
    
    // Optionally update OutputFile (Column E)
    if (stat.outputFile !== undefined) {
      updates.push({
        range: sh.getRange(row, CONFIG.columns.file),
        value: stat.outputFile
      });
    }
  });
  
  // Apply all updates - force text format to prevent date conversion
  updates.forEach(u => {
    u.range.setNumberFormat('@'); // @ = plain text format
    u.range.setValue(String(u.value));
  });
  
  return jsonResponse_({
    success: true,
    matched: matched,
    notFound: notFound,
    cellsUpdated: updates.length
  });
}

/**
 * Helper to create JSON response
 */
function jsonResponse_(data, status = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  
  if (status !== 200) {
    // Note: Apps Script doesn't support custom HTTP status codes in response,
    // but we can include it in the JSON
    data.statusCode = status;
  }
  
  return output;
}

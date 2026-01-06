# 🐸 Ribbits OBS Auto Sync - Complete System Documentation

## 📋 **What This System Does**

The Ribbits OBS Auto Sync system automatically updates text files for OBS overlays by watching a Google Sheet. When you update stats during gameplay (HP, spell slots, resources, etc.), OBS displays the changes within 90 seconds.

### **Key Features:**
- ✅ **130+ tracked stats** organized by category
- ✅ **Real-time sync** from Google Sheets to text files
- ✅ **90-second polling** (ultra-safe for API quotas)
- ✅ **Organized by type** (health, combat, slots, resources, etc.)
- ✅ **OBS-ready** text files for overlays
- ✅ **Prevents date conversion** (values like "4/4" stay as text!)

---

## 📁 **Folder Structure**

```
OBS Auto Sync\
├── Start Stat Watcher.lnk          ← Double-click to start watching
├── Sync JSON to Sheet.lnk          ← Reverse sync (rarely needed)
│
├── Config\
│   ├── ribbits.config.json         ← Main configuration
│   ├── ribbits-stats-COMPLETE.json ← Full stat template (reference)
│   ├── ribbits-stats-IMPORT-FIXED.csv ← CSV for sheet import (USE THIS!)
│   └── RESTORE_VALUES.csv          ← Backup of correct values
│
├── Documentation\
│   ├── HANDOFF.md                  ← This file (complete guide)
│   ├── Engine_README.md            ← Technical details
│   └── Engine_QUICKSTART.md        ← Quick start guide
│
├── Engine\
│   ├── RibbitsStatAssistant.ps1    ← Main watcher script
│   ├── JsonToSheet.ps1             ← Reverse sync script
│   ├── mapping.generated.json      ← Generated mapping (auto-created)
│   ├── Google Apps Script Framework.gs ← Web app code (copy to Google)
│   ├── Login.txt                   ← Google account info
│   └── .gitignore                  ← Git exclusions
│
└── Stats\                          ← OUTPUT: Text files for OBS
    ├── health\
    │   ├── hp-current.txt
    │   ├── hp-max.txt
    │   └── temp-hp.txt
    ├── combat\
    ├── slots\
    ├── resource\
    ├── spellcasting\
    └── [more categories...]
```

---

## 🚀 **Quick Start**

### **Daily Use:**

1. **Start the watcher** (before streaming):
   ```
   Double-click: "Start Stat Watcher.lnk"
   ```
   - Window opens and shows "Checking sheet..."
   - Leave this running during gameplay

2. **Update stats during gameplay:**
   - Open Google Sheet: "Ribbits Stats"
   - Edit values in **Column B** (Value column)
   - Changes sync to OBS within 90 seconds

3. **Stop the watcher** (after streaming):
   - Close the PowerShell window
   - Or press `Ctrl+C`

---

## 📊 **Google Sheet Structure**

Your Google Sheet has 5 columns:

| Column | Name | Purpose | Example |
|--------|------|---------|---------|
| **A** | Label | Display name | "HP Current" |
| **B** | Value | **EDIT THIS!** | "70" or "4/4" |
| **C** | Type | Category | "health" |
| **D** | Key | Unique ID | "hp-current" |
| **E** | OutputFile | Filename | "hp-current.txt" |

**Headers** (like `== Health & Combat ==`) organize stats visually:
- Purple background, white text, bold font
- Don't generate files (they're visual organizers)

---

## 🎨 **Initial Setup (First Time Only)**

### **Step 1: Import the Sheet**

1. **Open Google Sheet → File → Import**
2. **Upload:** `Config\ribbits-stats-IMPORT-FIXED.csv`
3. **Import location:** Replace current sheet
4. **Separator:** Comma
5. **Import**

### **Step 2: Setup Apps Script**

1. **Extensions → Apps Script**
2. **Copy code** from `Engine\Google Apps Script Framework.gs`
3. **Paste** entire code (Ctrl+A, Ctrl+V)
4. **Save** (Ctrl+S)

### **Step 3: Format Headers (Makes Them Pretty!)**

1. In Apps Script editor, **function dropdown** → Select **`formatHeaders`**
2. **Click Run** ▶️
3. Approve permissions if prompted
4. Headers now have purple background, white text, bold!

### **Step 4: Deploy Web App**

1. **Deploy → New deployment**
2. **Type:** Web app
3. **Execute as:** Me
4. **Who has access:** Anyone
5. **Deploy**
6. **Copy the Web App URL**
7. **Paste URL** into `Config\ribbits.config.json` → `auth.webAppUrl`

### **Step 5: Test!**

```powershell
cd "F:\Working Files\GitHub Desktop\Ribbitz\OBS Auto Sync\Engine"
.\RibbitsStatAssistant.ps1 -Once
```

Should generate 130 stat files!

---

## 🎮 **Common Tasks**

### **Task 1: Update HP During Combat**
1. Open Google Sheet
2. Find row: "HP Current"
3. Change Column B value: `70` → `52`
4. Wait ~90 seconds
5. OBS overlay updates automatically

### **Task 2: Track Spell Slots**
1. Find "1st Level Slots" row
2. Change value: `4/4` → `2/4`
3. OBS updates within 90 seconds

### **Task 3: Reset Resources (Long Rest)**
1. Update all resource values back to max
2. Example: "Active Camo Uses": `2/5` → `5/5`
3. All changes sync together

---

## ⚙️ **Configuration**

### **File:** `Config\ribbits.config.json`

```json
{
  "sheet": {
    "spreadsheetId": "YOUR_SHEET_ID",
    "worksheetName": "Stats",
    "range": "A:E"
  },
  "auth": {
    "mode": "webApp",
    "webAppUrl": "YOUR_WEB_APP_URL"
  },
  "output": {
    "folder": "F:\\...\\Stats",
    "encoding": "utf8NoBom"
  },
  "pollSeconds": 90
}
```

**Key Settings:**
- `pollSeconds: 90` - Checks Google Sheets every 90 seconds (1.5 minutes)
- `folder` - Where `.txt` files are saved for OBS
- `webAppUrl` - Your deployed Google Apps Script URL

---

## 🔧 **Troubleshooting**

### **Problem: Values converting to dates (4/4 → April 4)**
**Solution:** Already fixed! The system now:
- ✅ CSV uses apostrophe prefix (`'4/4`) to force text
- ✅ Apps Script sets text format (`.setNumberFormat('@')`)
- ✅ Never converts slashes to dates again!

### **Problem: Watcher won't start**
**Solution:**
```powershell
cd "F:\Working Files\GitHub Desktop\Ribbitz\OBS Auto Sync\Engine"
.\RibbitsStatAssistant.ps1 -Once
```
This runs once to see error messages.

### **Problem: Changes not updating in OBS**
**Check:**
1. ✅ Is watcher running? (PowerShell window open?)
2. ✅ Is it showing "No changes" or "Change detected"?
3. ✅ Are OBS text sources pointing to correct files?
4. ✅ Wait full 90 seconds after sheet edit

### **Problem: Headers look wrong or stats misplaced**
**Solution:**
1. Re-import `Config\ribbits-stats-IMPORT-FIXED.csv`
2. Run `formatHeaders()` in Apps Script
3. Don't run `setupRibbitsSheet()` - it's for dropdowns only!

### **Problem: Need to restore sheet to original state**
**Solution:**
1. Import `Config\ribbits-stats-IMPORT-FIXED.csv`
2. Run `formatHeaders()` in Apps Script
3. Done! All 130 stats restored with correct values

---

## 📊 **Stat Categories**

Stats are organized into folders by type:

| Type | Contains | Examples |
|------|----------|----------|
| **health** | HP values | hp-current, hp-max, temp-hp |
| **combat** | Combat stats | ac, initiative, attack bonuses |
| **slots** | Spell slots | slots-1st, slots-2nd, slots-3rd, etc. |
| **resource** | Limited uses | wild-shape, active-camo, darts |
| **spellcasting** | Magic stats | spell-dc, spell-attack |
| **senses** | Perception etc | passive-perception, darkvision |
| **identity** | Character info | name, race, class, level |
| **ability** | Ability scores | str, dex, con, wis, int, cha |
| **save** | Saving throws | save-str, save-dex, etc. |
| **skill** | Skill bonuses | skill-stealth, skill-perception |
| **features** | Class features | symbiotic-active, halo-damage |

---

## 🔄 **Advanced: Reverse Sync (JSON to Sheet)**

Rarely needed, but available if you manually edit `mapping.generated.json`:

```powershell
Double-click: "Sync JSON to Sheet.lnk"
```

This pushes changes FROM the mapping file TO Google Sheets.

**Use cases:**
- Bulk stat updates via JSON editing
- Restoring previous state
- Advanced automation

---

## 📈 **API Quota Info**

**Google Apps Script Limits:**
- 20,000 URL Fetch calls per day (consumer account)

**Your Usage:**
- 90-second polling = 960 calls/day (if left on 24 hours)
- **4.8% of daily quota** ✅
- Safe for multiple sessions
- Safe even if forgotten overnight

---

## 🎯 **OBS Setup**

### **Adding Stats to OBS:**

1. **Add Text Source:**
   - Right-click scene → Add → Text (GDI+)
   
2. **Configure:**
   - ✅ Check "Read from file"
   - Browse to: `Stats\health\hp-current.txt`
   - Set font, color, size

3. **Position & Style:**
   - Move to overlay position
   - Add outlines, shadows
   - Group related stats

4. **Repeat for all stats you want to display!**

---

## 🛠️ **Maintenance**

### **No maintenance needed!**
- System auto-updates
- No database to manage
- No server to maintain
- Just Google Sheets + PowerShell

### **Backup (Optional):**
- Google Sheet auto-saves
- `Config\RESTORE_VALUES.csv` has backup of all values
- `Config\` folder is your source of truth

---

## 📞 **Quick Reference**

**Start Watching:** Double-click `Start Stat Watcher.lnk`  
**Edit Stats:** Open Google Sheet → Edit Column B  
**View Output:** `Stats\` folder → organized by type  
**Config:** `Config\ribbits.config.json`  
**Help:** `Documentation\` folder

---

## ✅ **System Status Checklist**

Before streaming:
- [ ] Google Sheet accessible
- [ ] Stat Watcher running (window open)
- [ ] OBS text sources configured
- [ ] Test: Edit a stat, wait 90s, check OBS

During streaming:
- [ ] Stat Watcher window still open
- [ ] Update sheet as needed
- [ ] Check "Change detected!" messages

After streaming:
- [ ] Close Stat Watcher (Ctrl+C or close window)
- [ ] Optional: Save sheet state

---

## 🎓 **Apps Script Functions**

**Available Functions:**

- **`formatHeaders()`** - Styles header rows (purple, bold, white text)
  - Run after importing CSV to make headers pretty
  
- **`setupRibbitsSheet()`** - Adds Type dropdowns to Column C
  - Optional, only if you want dropdowns

- **`doGet()`** - Web App endpoint for fetching sheet data
  - Called automatically by watcher script
  
- **`doPost()`** - Web App endpoint for updating sheet
  - Called by JsonToSheet.ps1

**Don't run:** `formatAllHeaderRows_()` or `ensureBlankRowAbove_()` directly!

---

## 🎉 **That's It!**

You're all set! The system runs itself - just update your Google Sheet and let it handle the rest.

**Happy streaming! 🐸**

---

*Last Updated: January 6, 2026*  
*System Version: 2.1 (Final - Working Perfectly!)*  
*Status: ✅ Production Ready*

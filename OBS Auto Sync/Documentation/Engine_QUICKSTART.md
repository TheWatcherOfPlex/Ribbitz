# 🚀 Quick Start Guide - Ribbits Stat Assistant (Web App Mode)

**No service account needed!** This version uses your Apps Script web app deployment.

---

## ✅ Prerequisites (Already Done!)

- [x] Google Sheet created
- [x] Apps Script deployed as web app
- [x] Web app URL configured in `ribbits.config.json`

You're ready to go!

---

## 🎯 Step 1: Update Apps Script

1. **Open your Google Sheet**
2. **Extensions → Apps Script**
3. **Replace ALL code** with the updated `Google Apps Script Framework.gs` file
4. **Save** (Ctrl+S)
5. **Deploy:**
   - Click "Deploy" → "Manage deployments"
   - Click the edit icon (pencil) on your existing deployment
   - Under "Version", select "New version"
   - Click "Deploy"
   - ✅ This updates your existing web app without changing the URL!

---

## 🧪 Step 2: Test It!

1. **Open PowerShell:**
   ```powershell
   cd "F:\Working Files\GitHub Desktop\Ribbitz\OBS Auto Sync\Engine"
   ```

2. **Run once to test:**
   ```powershell
   .\RibbitsStatAssistant.ps1 -Once
   ```

3. **Check for success:**
   - Should see: "Checking sheet..."
   - Should see: "Change detected! Regenerating outputs..."
   - Should see: "Wrote X stat files"
   - Should see: "Done!"

4. **Verify output:**
   ```powershell
   ls "..\Stats"
   ```
   - Should see folders by type (identity, core, combat, etc.)
   - Each folder contains `.txt` files

---

## 🎮 Step 3: Use During Gameplay

### Start Continuous Polling:
```powershell
cd "F:\Working Files\GitHub Desktop\Ribbitz\OBS Auto Sync\Engine"
.\RibbitsStatAssistant.ps1
```

Leave this running! It checks your sheet every 2 seconds and updates `.txt` files automatically.

### Stop Polling:
Press **Ctrl+C**

---

## 🎬 Step 4: Setup OBS

For each stat you want to display:

1. **Add Source → Text (GDI+)**
2. **Check "Read from file"**
3. **Browse to:**
   ```
   F:\Working Files\GitHub Desktop\Ribbitz\OBS Auto Sync\Stats\<type>\<filename>.txt
   ```
4. **Format the text** (font, color, size, etc.)

**Done!** OBS will automatically show updated values as you edit the sheet.

---

## 🤖 AI-Assisted Batch Editing

When you want to populate/reorganize many stats at once:

### 1. Generate mapping:
```powershell
.\RibbitsStatAssistant.ps1 -Once
```

### 2. Edit `mapping.generated.json` with AI
- Fill in values, types, keys, output files
- Reorganize, add new stats, etc.

### 3. Push changes to sheet:
```powershell
.\JsonToSheet.ps1
```

Or with optional switches:
```powershell
.\JsonToSheet.ps1 -UpdateTypes -UpdateOutputFiles
```

### 4. Regenerate outputs:
```powershell
.\RibbitsStatAssistant.ps1 -Once
```

---

## 🐛 Troubleshooting

### "Web App Error: Script function not found"
**Fix:** Redeploy your Apps Script as a new version (Step 1)

### "Web App Error: Sheet not found: Stats"
**Fix:** Verify worksheet name matches in `ribbits.config.json`

### No output files generated
**Fix:** Check that Column A has labels and Column D has keys in your sheet

### OBS not updating
**Fix:** 
- Verify file path in OBS source is correct
- Try hide/unhide the source to refresh it
- Check that the `.txt` file actually exists and has content

### Script crashes immediately
**Fix:**
- Check PowerShell error message
- Verify web app URL in `ribbits.config.json` is correct
- Test web app URL in browser: `<url>?action=getValues`

---

## 📊 Google Sheet Structure Reminder

| Column A | Column B | Column C | Column D | Column E |
|----------|----------|----------|----------|----------|
| Label | Value | Type | Key | OutputFile |
| Name | Ribbitz | identity | name | character-name.txt |
| HP Current | 85 | combat | hp-current | |
| HP Max | 120 | combat | hp-max | |

**Headers:** Format as `== Section Name ==`

---

## ⚙️ Configuration

Edit `ribbits.config.json`:

```json
{
  "auth": {
    "mode": "webApp",
    "webAppUrl": "YOUR_WEB_APP_URL_HERE"
  },
  "output": {
    "folder": "PATH_TO_OUTPUT_FOLDER"
  },
  "pollSeconds": 2
}
```

---

## 🎯 Quick Command Reference

```powershell
# Navigate
cd "F:\Working Files\GitHub Desktop\Ribbitz\OBS Auto Sync\Engine"

# Test (single run)
.\RibbitsStatAssistant.ps1 -Once

# Run continuously
.\RibbitsStatAssistant.ps1

# Push JSON to sheet (values only)
.\JsonToSheet.ps1

# Push with all columns
.\JsonToSheet.ps1 -UpdateLabels -UpdateTypes -UpdateOutputFiles
```

---

## ✨ Advantages of Web App Mode

✅ **No service account needed** - works around organization policy  
✅ **Simpler setup** - no credential files to manage  
✅ **Runs as you** - uses your permissions automatically  
✅ **No token expiry** - web apps handle auth for you  
✅ **Same functionality** - everything works the same way!

---

**🐸 Ready to stream with live stats! 🐸**

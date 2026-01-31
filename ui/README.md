# Ribbitz UI (React + Sync Server)

## 📍 Run from the repo root

All commands must be run from the repo directory:

```
F:\Working Files\GitHub Desktop\Ribbitz
```

---

## ✅ Start the Sync Backend

```bash
cd "F:\Working Files\GitHub Desktop\Ribbitz\ui\server"
copy .env.example .env
# edit .env to add APPS_SCRIPT_WEBAPP_URL (your deployed web app URL)
npm install
npm run dev
```

> **Note:** `mapping.generated.json` is unrelated. This UI now uses your Apps Script Web App endpoint instead of a service-account JSON.

### Apps Script Deployment
After updating `OBS Auto Sync/Engine/Google Apps Script Framework.gs`, re-deploy the web app so the UI can use the new endpoints:
1. Open the Apps Script project.
2. Deploy → Manage deployments → Edit → Deploy.
3. Copy the updated Web App URL into `APPS_SCRIPT_WEBAPP_URL` if it changes.

### Inventory Sheet Format
Create a Google Sheet tab named **Inventory** with these columns:

| Column | Field | Example |
|---|---|---|
| A | Name | Vanguard Blowgun +1 |
| B | Quantity | 1 |
| C | Category | Weapons |
| D | Weight | 1 lb |
| E | Notes | Broken, single-shot |
| F | Image URL | https://.../blowgun.png |

## ✅ Start the UI

```bash
cd "F:\Working Files\GitHub Desktop\Ribbitz\ui"
npm run dev
```

---

## 🔧 Offline Snapshot
The backend writes `snapshot.json` every 10 minutes. If the sheet can’t be reached, the UI loads from this snapshot and shows **OFFLINE**.
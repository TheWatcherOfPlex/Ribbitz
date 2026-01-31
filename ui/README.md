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

## ✅ Start the UI

```bash
cd "F:\Working Files\GitHub Desktop\Ribbitz\ui"
npm run dev
```

---

## 🔧 Offline Snapshot
The backend writes `snapshot.json` every 10 minutes. If the sheet can’t be reached, the UI loads from this snapshot and shows **OFFLINE**.
# KBN Designs — PI Payment Tracking

Vercel frontend + Google Apps Script backend.

## Structure
- `index.html` — Frontend (login, dashboard, PI, payments, staff log, analytics)
- `api/rpc.js` — Vercel serverless proxy to GAS
- `Code.gs` — GAS backend (deploy as Web App)
- `vercel.json` — Vercel config

## Deploy Steps

### 1. Google Apps Script
1. Create new GAS project
2. Paste `Code.gs`
3. Set Script Properties:
   - `SPREADSHEET_ID` = your Google Sheet ID
   - `API_SECRET` = any strong random string (same value in Vercel)
4. Deploy as Web App:
   - Execute as: Me
   - Who has access: Anyone
5. Copy the Web App URL → this becomes `GAS_URL`

### 2. Vercel
1. Push this folder to GitHub
2. Import project in Vercel
3. Add Environment Variables:
   - `GAS_URL` = the Web App URL from step 1
   - `GAS_SECRET` = same value as `API_SECRET` in GAS
4. Deploy

## Notes
- All business logic stays in GAS (sheet as database)
- Frontend is pure static HTML served by Vercel
- Session tokens are still managed by GAS CacheService
- Attachment folders are hardcoded in Code.gs (update if needed)

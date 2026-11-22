# KBN Designs — PI Payment Tracking (PWA)

Vercel frontend + Firebase reads + GAS writes.

## Architecture
- **Reads**: `/api/snapshot` → Firebase Firestore (`pi_snapshots/latest`) → instant
- **Writes**: `/api/rpc` → GAS → Sheet (source of truth)
- **Client**: localStorage cache for instant open + background refresh
- **PWA**: installable, offline shell

## Files
- `index.html` — Frontend (PWA meta, filters fixed, filtered print/CSV)
- `manifest.json` — PWA manifest
- `sw.js` — Service worker
- `api/snapshot.js` — Firebase read endpoint
- `api/rpc.js` — GAS proxy for writes
- `Code.gs` — GAS backend (includes getSnapshot)

## Setup

### 1. Firebase
- Create project, enable Firestore
- Create service account → download JSON
- Set Vercel env:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY` (escape newlines as `\n`)

### 2. GAS
- Deploy `Code.gs` as Web App
- Script Properties: `SPREADSHEET_ID`, `API_SECRET`
- After any write, call `getSnapshot` and save result to Firestore `pi_snapshots/latest`
  (can be done from Vercel after successful rpc, or scheduled)

### 3. Vercel
- Push this folder
- Env vars:
  - `GAS_URL`, `GAS_SECRET`
  - Firebase vars above
- Deploy

### 4. Icons
Add `icon-192.png`, `icon-512.png`, `icon-180.png` in root (or use any logo).

## Firebase Sync (auto)

After any Create/Update/Delete, GAS calls `_notifyVercelSync()` which hits:
`https://<your-app>.vercel.app/api/sync?bump=1&secret=<SYNC_SECRET>`

Vercel `/api/sync` then:
1. Calls GAS `getSnapshot`
2. Saves to Firestore:
   - `piapp_snap/latest`  (full data)
   - `piapp_meta/sync`    (last sync time + counts)

### Script Properties needed in GAS
- `VERCEL_SYNC_URL` = `https://pi.kbndesigns.com/api/sync`
- `SYNC_SECRET` = any strong random string (same as Vercel env `SYNC_SECRET`)

### Vercel env
- `GAS_URL`, `GAS_SECRET`
- `SYNC_SECRET` (same as GAS)
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

After first write (or manual call to `/api/sync?bump=1&secret=...`), Firebase collections will appear.

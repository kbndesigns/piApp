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

## Behavior
- App opens instantly from localStorage cache
- Background fetch from `/api/snapshot` updates data
- After Create/Update/Delete → forces fresh load from GAS and updates cache
- Print / CSV buttons export **currently filtered rows only**
- Tables scroll both horizontally and vertically
- Installable as PWA

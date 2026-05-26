# Plan: Database Backup & Restore for Bé An Toàn Số

Add backup and restore functionality for the entire database and application data (both Supabase tables and LocalStorage keys) to allow seamless migration to another environment.

## 🎯 Success Criteria
1. **Consolidated Export**: Admin can export both client-side data (LocalStorage keys) and server-side data (Supabase tables) into a single downloadable `.json` file.
2. **Seamless Restore**: Admin can upload the exported JSON file to restore the entire system state (overwriting or merging data).
3. **Simple & Intuitive Admin UI**: Clear "Backup" and "Restore" controls in a new sub-tab or section of the Admin Dashboard.
4. **Validation & Security**: The restore tool validates the structure of the JSON file before importing to prevent corrupting state.
5. **No Data Loss**: Verifiable backup and restore path.

---

## 🛠️ Proposed Changes

### Component 1: API Endpoints (Supabase Data Sync)

#### [NEW] [route.ts](file:///Applications/work/Websiteantoanso/src/app/api/admin/backup-restore/route.ts)
Create a new API route `/api/admin/backup-restore` with:
- `GET`: Fetches all records from all primary Supabase tables using `supabaseAdmin` client.
  - Tables: `profiles`, `learning_paths`, `topics`, `questions`, `results`, `teachers`.
- `POST`: Accepts a dump of Supabase tables and performs bulk upserts using `supabaseAdmin`.
  - Clears/overwrites existing records in the table or does safe upserts (with `id` keys).

### Component 2: Frontend Services

#### [NEW] [backupService.ts](file:///Applications/work/Websiteantoanso/src/lib/backupService.ts)
A service utility to handle:
- Gathering LocalStorage keys (e.g. `bats:*`, `be-an-toan-so-storage`).
- Calling `/api/admin/backup-restore` to get Supabase data.
- Triggering browser download of the consolidated `.json` file.
- Parsing uploaded JSON, validating keys and shapes, restoring LocalStorage keys, and submitting Supabase data to `/api/admin/backup-restore`.

### Component 3: User Interface

#### [MODIFY] [AdminDashboard.tsx](file:///Applications/work/Websiteantoanso/src/components/admin/AdminDashboard.tsx)
- Add a new tab `system` ("Hệ thống" / "Cài đặt") to `NAV` configuration.
- Implement the "Hệ thống" tab view with Backup & Restore actions:
  - **Tải file sao lưu (Backup)**: Download current snapshot.
  - **Khôi phục dữ liệu (Restore)**: File uploader with validation, preview counts of tables/keys to be imported, and a confirmation dialog.

---

## 📋 Task Breakdown

### Task 1: API Route for Backup/Restore
- **Agent**: `backend-specialist`
- **Skills**: `api-patterns`, `nodejs-best-practices`
- **Priority**: High
- **Dependencies**: None
- **INPUT**: Supabase connection with admin client (`supabase-admin.ts`)
- **OUTPUT**: Working endpoints at `/api/admin/backup-restore`
- **VERIFY**: Use Postman/curl or a script to verify GET returns JSON matching all tables, and POST accepts tables data.

### Task 2: Backup Service Utility
- **Agent**: `frontend-specialist`
- **Skills**: `clean-code`
- **Priority**: Medium
- **Dependencies**: Task 1
- **INPUT**: LocalStorage keys specification and API endpoints
- **OUTPUT**: JS utility that creates, validates, and loads backups
- **VERIFY**: Unit test or integration test showing a mock JSON structure passes schema validation.

### Task 3: Admin UI tab integration
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`
- **Priority**: Medium
- **Dependencies**: Task 2
- **INPUT**: `AdminDashboard.tsx`
- **OUTPUT**: New "Hệ thống" tab with export/import controls
- **VERIFY**: Click Backup to trigger file download, verify the file contains correct keys and database arrays.

---

## 🏁 Phase X: Verification Plan

### Automated Tests
- Build verification: `npm run build`
- Type checking: `npx tsc --noEmit`
- Run verify all: `python .agent/scripts/verify_all.py`

### Manual Verification
1. Open Admin Dashboard -> Navigate to "Hệ thống"
2. Click "Tải file sao lưu" and check downloaded JSON content
3. Clear LocalStorage and database entries (or alter values)
4. Upload backup file, confirm restore, and verify all lists/stats reload correctly

# Migration guide: data.json → MongoDB

Purpose
- Provide step-by-step guidance to migrate the mock in-file persistence (`server/data.json`) to a MongoDB-backed persistence layer and a lightweight adapter.

Prerequisites
- A running MongoDB instance (local or hosted). Example connection string: `mongodb://localhost:27017/careergenie`
- Node.js environment (this repo already uses Node, ensure `npm install` run after adding `mongodb` dependency).

High-level steps
1. Install dependency
   - Run: `npm install mongodb`

2. Review `server/mongo_adapter.js`
   - This repository includes a simple adapter script that can connect and populate collections from `server/data.json`.

3. Run migration (one-time)
   - Example:

```powershell
npm run mongo:migrate -- mongodb://localhost:27017/careergenie
```

4. Verify data
   - Use `mongosh` or a GUI client to inspect `users`, `jobs`, `applications`, and `resumeResults` collections.

5. Replace read/write calls in `server/mock-server.js` with adapter calls
   - Replace `readData()` / `writeData()` with queries to MongoDB collections. Keep existing JSON shape for compatibility.

6. Add connection lifecycle management
   - Connect once at server start, reuse `MongoClient` across requests, and gracefully close on shutdown.

7. Add indexes
   - Create useful indexes for production readiness:
     - `users.email` (unique)
     - `jobs.status` and `jobs.tags`
     - `applications.studentId`, `applications.jobId`

8. Backup & restore
   - Keep the `server/backups/` approach as a pre-migration safety net.
   - For MongoDB use `mongodump`/`mongorestore` or your managed provider's backup tools.

9. Environment and secrets
   - Store the MongoDB connection string in an env var, e.g. `MONGODB_URI`.

10. Testing and verification
   - Run app and tests against a test MongoDB database (e.g., `careergenie_test`).
   - Add integration tests ensuring endpoint behavior unchanged.

Notes and suggestions
- Start with a read-only migration (keep `server/data.json` as source-of-truth) and run the app in a feature branch until verification is complete.
- Use a migration lock or single-run migration script to avoid double-import.
- Consider using `mongoose` or a small ORM if you want schema-level validation; the adapter here uses the native `mongodb` driver for minimal footprint.

Example mapping
- `data.users` → `users` collection
- `data.jobs` → `jobs` collection
- `data.applications` → `applications` collection
- `data.resumeResults` → `resumeResults` collection

If you want, I can now wire the server to optionally read from MongoDB when `MONGODB_URI` is set, leaving file fallback intact. Proceed? 

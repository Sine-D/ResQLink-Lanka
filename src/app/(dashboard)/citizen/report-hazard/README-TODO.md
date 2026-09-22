# TODO — Member 2: Citizen Hazard Reporting Module

The basic scaffold for Member 2 is created (Mongoose model `HazardReport`, route `/citizen/report-hazard`, DMC verification route `/dmc/hazard-reports`, and API `POST /api/hazard-reports`).

## Open Flows to Implement for Rubric Completion:
1. **Offline Queue & Sync:** Implement IndexedDB or localStorage offline queue per use case scenario when network connection drops.
2. **Photo Upload & Compression:** Add photo attachment preview and S3 / Cloudinary image upload.
3. **Verification Workflow:** DMC Officer verify/reject actions updating report status to `VERIFIED` or `REJECTED`.
4. **Unit Tests:** Add Jest unit test suite for `hazardReportService.ts`.

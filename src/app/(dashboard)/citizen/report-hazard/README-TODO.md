# TODO — Member 2: Citizen Hazard Reporting Module

The basic scaffold for Member 2 is created (Mongoose model `HazardReport`, route `/citizen/report-hazard`, DMC verification route `/dmc/hazard-reports`, and API `POST /api/hazard-reports`).

## Implemented Flows
1. **Offline Queue & Sync:** IndexedDB queue, Pending Synchronization UI, automatic online retry, and idempotent server synchronization.
2. **Photo Capture & Upload:** Mobile camera/file capture with type and size validation; evidence is stored with the report.
3. **Verification Workflow:** DMC-only verify/reject actions, rejection reasons, officer ID, and decision timestamps.
4. **Citizen Tracking:** Citizens can view Pending Verification, Verified, Rejected, and locally queued reports.
5. **Unit Tests:** Jest coverage for hazard report lookup, verification, rejection, and audit fields.

## Future Production Enhancement
- Move base64 evidence images from MongoDB to managed object storage such as S3 or Cloudinary for production-scale storage and delivery.

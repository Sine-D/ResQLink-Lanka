export const HAZARD_QUEUE_CHANGED_EVENT = "resqlink:hazard-queue-changed";

const DATABASE_NAME = "resqlink-offline";
const STORE_NAME = "hazard-report-queue";
const DATABASE_VERSION = 1;

export interface HazardReportSubmission {
  clientReportId: string;
  hazardType: string;
  description: string;
  locationName: string;
  coordinates: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  photoUrl: string;
}

export interface QueuedHazardReport extends HazardReportSubmission {
  queuedAt: string;
  retryCount: number;
  lastError?: string;
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "clientReportId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open the offline report queue"));
  });
}

function completeTransaction(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("Offline queue operation failed"));
    transaction.onabort = () => reject(transaction.error || new Error("Offline queue operation was cancelled"));
  });
}

function announceQueueChange() {
  window.dispatchEvent(new CustomEvent(HAZARD_QUEUE_CHANGED_EVENT));
}

export async function queueHazardReport(payload: HazardReportSubmission) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).put({
    ...payload,
    queuedAt: new Date().toISOString(),
    retryCount: 0,
  } satisfies QueuedHazardReport);
  await completeTransaction(transaction);
  database.close();
  announceQueueChange();
}

export async function getQueuedHazardReports() {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readonly");
  const request = transaction.objectStore(STORE_NAME).getAll();
  const reports = await new Promise<QueuedHazardReport[]>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as QueuedHazardReport[]);
    request.onerror = () => reject(request.error || new Error("Could not read offline reports"));
  });
  await completeTransaction(transaction);
  database.close();
  return reports.sort((a, b) => b.queuedAt.localeCompare(a.queuedAt));
}

async function removeQueuedHazardReport(clientReportId: string) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).delete(clientReportId);
  await completeTransaction(transaction);
  database.close();
}

async function recordSyncError(report: QueuedHazardReport, message: string) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).put({
    ...report,
    retryCount: report.retryCount + 1,
    lastError: message,
  } satisfies QueuedHazardReport);
  await completeTransaction(transaction);
  database.close();
}

export async function synchronizeQueuedHazardReports() {
  if (!navigator.onLine) return { synchronized: 0, failed: 0 };

  const reports = await getQueuedHazardReports();
  let synchronized = 0;
  let failed = 0;

  for (const report of reports) {
    try {
      const payload: HazardReportSubmission = {
        clientReportId: report.clientReportId,
        hazardType: report.hazardType,
        description: report.description,
        locationName: report.locationName,
        coordinates: report.coordinates,
        photoUrl: report.photoUrl,
      };
      const response = await fetch("/api/hazard-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || `Synchronization failed (${response.status})`);
      }

      await removeQueuedHazardReport(report.clientReportId);
      synchronized += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Synchronization failed";
      await recordSyncError(report, message);
      failed += 1;
    }
  }

  announceQueueChange();
  return { synchronized, failed };
}

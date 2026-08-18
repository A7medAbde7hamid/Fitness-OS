const DB_NAME = 'ai-fitness-os';
const DB_VERSION = 1;

const STORES = {
  SYNC_QUEUE: 'syncQueue',
  PENDING_MEASUREMENTS: 'pendingMeasurements',
  PENDING_ACTIVITIES: 'pendingActivities',
  PENDING_MEALS: 'pendingMeals',
  PENDING_WORKOUTS: 'pendingWorkouts',
  CHECK_INS: 'checkIns',
  WEEKLY_REPORTS: 'weeklyReports',
} as const;

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const store = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PENDING_MEASUREMENTS)) {
        const store = db.createObjectStore(STORES.PENDING_MEASUREMENTS, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PENDING_ACTIVITIES)) {
        const store = db.createObjectStore(STORES.PENDING_ACTIVITIES, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PENDING_MEALS)) {
        const store = db.createObjectStore(STORES.PENDING_MEALS, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PENDING_WORKOUTS)) {
        const store = db.createObjectStore(STORES.PENDING_WORKOUTS, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.CHECK_INS)) {
        const store = db.createObjectStore(STORES.CHECK_INS, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('date', 'date', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.WEEKLY_REPORTS)) {
        const store = db.createObjectStore(STORES.WEEKLY_REPORTS, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
  const db = await openDB();
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class IndexedDBRepository {
  static async getAll<T>(storeName: string): Promise<T[]> {
    const store = await getStore(storeName);
    return promisifyRequest(store.getAll());
  }

  static async getById<T>(storeName: string, id: string): Promise<T | undefined> {
    const store = await getStore(storeName);
    return promisifyRequest(store.get(id));
  }

  static async put<T>(storeName: string, item: T): Promise<void> {
    const store = await getStore(storeName, 'readwrite');
    await promisifyRequest(store.put(item));
  }

  static async delete(storeName: string, id: string): Promise<void> {
    const store = await getStore(storeName, 'readwrite');
    await promisifyRequest(store.delete(id));
  }

  static async getByIndex<T>(storeName: string, indexName: string, key: string | IDBKeyRange): Promise<T[]> {
    const store = await getStore(storeName);
    const index = store.index(indexName);
    return promisifyRequest(index.getAll(key));
  }

  static async clear(storeName: string): Promise<void> {
    const store = await getStore(storeName, 'readwrite');
    await promisifyRequest(store.clear());
  }

  static async count(storeName: string): Promise<number> {
    const store = await getStore(storeName);
    return promisifyRequest(store.count());
  }

  // Sync Queue operations
  static async getSyncQueue(): Promise<import('../types').SyncOperation[]> {
    return this.getAll<import('../types').SyncOperation>(STORES.SYNC_QUEUE);
  }

  static async getSyncQueueByStatus(status: import('../types').SyncOperationStatus): Promise<import('../types').SyncOperation[]> {
    return this.getByIndex<import('../types').SyncOperation>(STORES.SYNC_QUEUE, 'status', status);
  }

  static async addToSyncQueue(operation: import('../types').SyncOperation): Promise<void> {
    await this.put(STORES.SYNC_QUEUE, operation);
  }

  static async updateSyncOperation(operation: import('../types').SyncOperation): Promise<void> {
    await this.put(STORES.SYNC_QUEUE, operation);
  }

  static async removeSyncOperation(id: string): Promise<void> {
    await this.delete(STORES.SYNC_QUEUE, id);
  }

  static async clearSyncQueue(): Promise<void> {
    await this.clear(STORES.SYNC_QUEUE);
  }

  // Pending items
  static async getPendingMeasurements(userId: string): Promise<import('../types').WeightMeasurement[]> {
    const all = await this.getByIndex<import('../types').WeightMeasurement>(STORES.PENDING_MEASUREMENTS, 'userId', userId);
    return all;
  }

  static async addPendingMeasurement(measurement: import('../types').WeightMeasurement): Promise<void> {
    await this.put(STORES.PENDING_MEASUREMENTS, measurement);
  }

  static async removePendingMeasurement(id: string): Promise<void> {
    await this.delete(STORES.PENDING_MEASUREMENTS, id);
  }

  static async getPendingActivities(userId: string): Promise<import('../types').ActivityLog[]> {
    return this.getByIndex<import('../types').ActivityLog>(STORES.PENDING_ACTIVITIES, 'userId', userId);
  }

  static async addPendingActivity(activity: import('../types').ActivityLog): Promise<void> {
    await this.put(STORES.PENDING_ACTIVITIES, activity);
  }

  static async removePendingActivity(id: string): Promise<void> {
    await this.delete(STORES.PENDING_ACTIVITIES, id);
  }

  static async getPendingMeals(userId: string): Promise<import('../types').Meal[]> {
    return this.getByIndex<import('../types').Meal>(STORES.PENDING_MEALS, 'userId', userId);
  }

  static async addPendingMeal(meal: import('../types').Meal): Promise<void> {
    await this.put(STORES.PENDING_MEALS, meal);
  }

  static async removePendingMeal(id: string): Promise<void> {
    await this.delete(STORES.PENDING_MEALS, id);
  }

  static async getPendingWorkouts(userId: string): Promise<import('../types').WorkoutSession[]> {
    return this.getByIndex<import('../types').WorkoutSession>(STORES.PENDING_WORKOUTS, 'userId', userId);
  }

  static async addPendingWorkout(workout: import('../types').WorkoutSession): Promise<void> {
    await this.put(STORES.PENDING_WORKOUTS, workout);
  }

  static async removePendingWorkout(id: string): Promise<void> {
    await this.delete(STORES.PENDING_WORKOUTS, id);
  }

  // Check-ins
  static async getCheckIns(userId: string): Promise<import('../types').DailyCheckIn[]> {
    return this.getByIndex<import('../types').DailyCheckIn>(STORES.CHECK_INS, 'userId', userId);
  }

  static async getCheckInByDate(userId: string, date: string): Promise<import('../types').DailyCheckIn | undefined> {
    const all = await this.getCheckIns(userId);
    return all.find((c) => c.date === date);
  }

  static async saveCheckIn(checkIn: import('../types').DailyCheckIn): Promise<void> {
    await this.put(STORES.CHECK_INS, checkIn);
  }

  // Weekly Reports
  static async getWeeklyReports(userId: string): Promise<import('../types').WeeklyReportData[]> {
    return this.getByIndex<import('../types').WeeklyReportData>(STORES.WEEKLY_REPORTS, 'userId', userId);
  }

  static async saveWeeklyReport(report: import('../types').WeeklyReportData): Promise<void> {
    await this.put(STORES.WEEKLY_REPORTS, report);
  }

  static async close(): Promise<void> {
    if (dbInstance) {
      dbInstance.close();
      dbInstance = null;
    }
  }
}

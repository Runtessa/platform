export type RegistryPackagePayload = {
  name: string;
  version: string;
  packageVersion?: string;
  source: string;
  dependencies?: string[];
  fileExtension?: string;
};

export type RegistryPackageMetadata = {
  name: string;
  version: string;
  packageVersion?: string;
  dependencies?: string[];
  fileExtension?: string;
};

type CachedPayloadRecord = {
  kind: "payload";
  key: string;
  packageName: string;
  requestVersion: string;
  resolvedVersion: string;
  payload: RegistryPackagePayload;
  updatedAt: number;
};

type CachedLatestAliasRecord = {
  kind: "latest-alias";
  key: string;
  packageName: string;
  resolvedVersion: string;
  updatedAt: number;
};

type CacheRecord = CachedPayloadRecord | CachedLatestAliasRecord;

const DB_NAME = "idp-kernel-package-cache";
const DB_VERSION = 1;
const STORE_NAME = "packages";

const exactPayloadKey = (packageName: string, version: string) =>
  `payload:${packageName}@${version}`;
const latestAliasKey = (packageName: string) => `latest:${packageName}`;

export class BrowserPackageCache {
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  isAvailable() {
    return typeof indexedDB !== "undefined";
  }

  async getPayload(packageName: string, version: string) {
    const record = await this.getRecord<CachedPayloadRecord>(
      exactPayloadKey(packageName, version),
    );
    return record?.payload ?? null;
  }

  async putPayload(
    packageName: string,
    requestVersion: string,
    resolvedVersion: string,
    payload: RegistryPackagePayload,
  ) {
    await this.putRecord({
      kind: "payload",
      key: exactPayloadKey(packageName, requestVersion),
      packageName,
      requestVersion,
      resolvedVersion,
      payload,
      updatedAt: Date.now(),
    });
  }

  async deletePayload(packageName: string, version: string) {
    await this.deleteRecord(exactPayloadKey(packageName, version));
  }

  async getLatestAlias(packageName: string) {
    return this.getRecord<CachedLatestAliasRecord>(latestAliasKey(packageName));
  }

  async putLatestAlias(packageName: string, resolvedVersion: string) {
    await this.putRecord({
      kind: "latest-alias",
      key: latestAliasKey(packageName),
      packageName,
      resolvedVersion,
      updatedAt: Date.now(),
    });
  }

  async clearLatestAlias(packageName: string) {
    await this.deleteRecord(latestAliasKey(packageName));
  }

  private async openDb(): Promise<IDBDatabase | null> {
    if (!this.isAvailable()) return null;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: "key" });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
        request.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  private async withStore<T>(
    mode: IDBTransactionMode,
    handler: (store: IDBObjectStore) => Promise<T>,
  ) {
    const db = await this.openDb();
    if (!db) return null;
    try {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      return await handler(store);
    } catch {
      return null;
    }
  }

  private async getRecord<T extends CacheRecord>(key: string) {
    return this.withStore("readonly", (store) => {
      return new Promise<T | null>((resolve) => {
        const request = store.get(key);
        request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
        request.onerror = () => resolve(null);
      });
    });
  }

  private async putRecord(record: CacheRecord) {
    await this.withStore("readwrite", (store) => {
      return new Promise<void>((resolve) => {
        const request = store.put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });
    });
  }

  private async deleteRecord(key: string) {
    await this.withStore("readwrite", (store) => {
      return new Promise<void>((resolve) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });
    });
  }
}

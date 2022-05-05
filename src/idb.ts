import { createPromise } from 'wait';

function safariFix() {
  const isSafari =
    //@ts-ignore
    !navigator.userAgentData &&
    /Safari\//.test(navigator.userAgent) &&
    !/Chrom(e|ium)\//.test(navigator.userAgent);

  // No point putting other browsers or older versions of Safari through this mess.
  if (!isSafari || !indexedDB.databases) return;

  indexedDB.deleteDatabase('dummy-database');
}
safariFix();

const category = 'idb';

const READONLY: Set<Method> = new Set(['get', 'getAll', 'getBound', 'getLastEntry', 'count']);
//const READWRITE: Set<Method> = new Set(['add', 'set', 'delete']);

type Method = 'get' | 'getAll' | 'getBound' | 'getLastEntry' | 'count' | 'add' | 'set' | 'delete';
type Schema = (oldVersion: number, db: IDBDatabase, tx: IDBTransaction) => void;
type Beacon = (action: string, opts?: unknown) => void;

interface TransactionOptions {
  storeName: string;
  indexName?: string;
}

export default class IndexedDB {
  public onError = (err: Error): void => console.error(err);
  public onVersionChange = (): void => alert('A new database update is available. Reload the tab to complete the update?');
  public onBlocked = (): void => alert('A database update is required but blocked in another tab. Please close all tabs to perform the update.');

  private _name: string;
  private _version: number;
  private _schema: Schema;
  private _beacon: Beacon;

  private _inProgress = null;
  private _db = null;

  /**
   * v2
   * - beacon function is passed into class (prev only url)
   * - new ```onError```, ```onVersionChange```, ```onBlocked``` public functions. Overwrite to implement.
   */
  constructor(name: string, version: number, schema: Schema, beacon: Beacon) {
    this._name = name;
    this._version = version;
    this._schema = schema;
    this._beacon = beacon;
  }

  private _handleError(err: Error): null {
    this._beacon(`idb-open/error`, { label: err.message });
    this.onError(err);
    return null;
  }
  /**
   * Must return null on error otherwise won't reset ```this._inProgress```
   */
  private _openIndexedDB(): Promise<IDBDatabase | null> {
    return new Promise(async (resolve, _) => {
      try {
        let request = indexedDB.open(this._name, this._version);
        request.onsuccess = () => {
          const { name, version } = request.result;

          console.log('idb-open/database', { name, version, origin: location.pathname });

          request.result.onversionchange = () => {
            this._beacon('idb/version-change-or-database-deleted');
            this.onVersionChange();
          };

          resolve(request.result);
        }
        request.onerror = () => resolve(this._handleError(new Error(request.error.message)));
        request.onblocked = () => {
          this._beacon('idb-open/blocked');
          this.onBlocked();
        };
        request.onupgradeneeded = (e) => {
          const db = request.result;
          const upgrade = e.target as IDBOpenDBRequest;

          this._schema(e.oldVersion, db, upgrade.transaction);
        };
      } catch (err) {
        resolve(this._handleError(err))
      }
    });
  }

  public async open(): Promise<IDBDatabase> {
    if (!this._db) {
      if (this._inProgress) return this._inProgress;
      this._inProgress = createPromise();

      this._db = await this._openIndexedDB();

      this._inProgress.resolve(this._db);
      this._inProgress = null;
    }
    return this._db;
  }
  public close(): void {
    if (this._db) {
      console.log('idb/closing-database', this._db.name);
      this._db.close();
      this._db = null;
    }
    return;
  }

  private async _promisifyIDBTransaction(method: Method, options: TransactionOptions): Promise<any> {
    const { storeName, indexName } = options;

    const db = await this.open();

    const tx = db.transaction(storeName, READONLY.has(method) ? 'readonly' : 'readwrite');
    const store = tx.objectStore(storeName);
    const index = indexName ? store.index(indexName) : null;
    return {
      target: index || store,
      done: new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve('done');
        tx.onerror = (e) => {
          const request = e.target as IDBRequest | IDBTransaction;
          reject(request.error.message);
        };
      }),
    }
  }
  private _promisifyIDBCursorRequest(req: IDBRequest): Promise<any> {
    return new Promise(async (resolve, reject) => {
      req.onsuccess = async () => {
        let cursor = req.result;
        if (!!cursor === false) return resolve(undefined);
        else resolve(cursor);
      };
      req.onerror = () => reject(req.error);
    });
  }
  private _promisifyIDBRequest(req: IDBRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  /**
   * Add or replace items
   * @param values - must contain keyPath if not auto-incrementing
   * @param storeName
   */
  add(values = [], storeName: string) {
    return new Promise(async (resolve, reject) => {
      try {
        if (Array.isArray(values) === false) throw new Error('Values must be an array.');

        const { target, done }  = await this._promisifyIDBTransaction('add', { storeName });

        const { keyPath, autoIncrement } = target;

        for (let value of values) {
          if (autoIncrement === false && value[keyPath as string] === undefined) {
            throw new Error(`key '${keyPath}' is required but missing.`);
          } else if (autoIncrement && value[keyPath as string]) {
            throw new Error(`key '${keyPath}' is auto-incrementing and must not be set.`);
          }

          // not used ```add``` as put allows overwriting
          target.put(value);
        }

        await done;
        resolve('success');
      } catch (err) {
        this._beacon(`idb-add/${storeName}`, { label: err.message });
        reject(err);
      }
    });
  }

  /**
   * Update an item already present in the database
   * @param value
   * @param storeName
   */
  set(value: any, storeName: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const { target, done }  = await this._promisifyIDBTransaction('set', { storeName });

        const { keyPath } = target;
        const key = value[keyPath as string];

        if (!key) {
          throw new Error(`key '${keyPath}' is required but missing.`);
        }

        let found = false;

        const cursorRequest = target.openCursor(IDBKeyRange.only(key));
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!!cursor === false) {
            if (found === false) tx.put(value);
            return;
          }
          found = true;
          cursor.update(Object.assign({}, cursor.value, value));
          cursor.continue();
        };
        cursorRequest.onerror = () => reject(cursorRequest.error);

        await done;
        resolve('success');
      } catch (err) {
        this._beacon(`idb-set/${storeName}`, { label: err.message });
        reject(err);
      }
    });
  }

  get(key: string, storeName: string, indexName = undefined): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let result = null;

        const { target, done }  = await this._promisifyIDBTransaction('get', { storeName, indexName });

        const query = target.openCursor(IDBKeyRange.only(key));
        let cursor: any = true;
        while (!!cursor) {
          cursor = await this._promisifyIDBCursorRequest(query);
          if (cursor) {
            result = cursor.value;
            cursor.continue();
          }
        }
        await done;
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  }

  getAll(storeName: string, indexName = null, key = null, limit = null) {
    return new Promise(async (resolve, reject) => {
      try {
        const { target, done }  = await this._promisifyIDBTransaction('getAll', { storeName, indexName });

        const query = target.getAll(key, limit);
        const result = await this._promisifyIDBRequest(query);
        await done;
        resolve(result);
      } catch (err) {
        this._beacon(`idb-getAll/${storeName}`, { label: err.message });
        reject(err);
      }
    });
  }

  getBound(storeName: string, indexName: string, lower: string, upper = null) {
    return new Promise(async (resolve, reject) => {
      try {
        let result = [];
        const { target, done }  = await this._promisifyIDBTransaction('getBound', { storeName, indexName });

        const keyRange = lower && upper
          ? IDBKeyRange.bound(lower, upper)
          : IDBKeyRange.only(lower);

        const query = target.openCursor(keyRange, 'prev');

        let cursor: any = true;
        while (!!cursor) {
          cursor = await this._promisifyIDBCursorRequest(query);
          if (cursor) {
            result.push(cursor.value);
            cursor.continue();
          }
        }

        await done;
        resolve(result);
      } catch (err) {
        this._beacon(`idb-getBound/${storeName}`, { label: err.message });
        reject(err);
      }
    });
  }

  getLastEntry(storeName: string, indexName = null, direction: IDBCursorDirection) {
    return new Promise(async (resolve, reject) => {
      try {
        let result = null;
        const { target, done }  = await this._promisifyIDBTransaction('getLastEntry', { storeName, indexName });

        const query = target.openCursor(null, direction);

        let cursor: any = true;
        while (!!cursor) {
          cursor = await this._promisifyIDBCursorRequest(query);
          if (cursor) {
            result = cursor.value;
            cursor.continue();
          }
        }
        await done;
        resolve(result);
      } catch (err) {
        this._beacon(`idb-getLastEntry/${storeName}`, { label: err.message });
        reject(err);
      }
    });
  }

  delete(storeName: string, key = null) {
    return new Promise(async (resolve, reject) => {
      try {
        const { target, done }  = await this._promisifyIDBTransaction('delete', { storeName });

        const query = key ? target.delete(key) : target.clear();
        await this._promisifyIDBRequest(query);

        await done;
        resolve('success');
      } catch (err) {
        this._beacon(`idb-delete/${storeName}`, { label: err.message });
        reject(err);
      }
    });
  }

  count(storeName: string, indexName = null, lower = null, upper = null) {
    return new Promise(async (resolve, reject) => {
      try {
        const { target, done }  = await this._promisifyIDBTransaction('count', { storeName, indexName });

        const keyRange = lower && upper
          ? IDBKeyRange.bound(lower, upper)
          : lower
          ? IDBKeyRange.only(lower)
          : null;

        const query = indexName && keyRange
          ? target.count(keyRange)
          : target.count();

        const result = await this._promisifyIDBRequest(query);

        await done;
        resolve(result);
      } catch (err) {
        this._beacon(`idb-count/${storeName}`, { label: err.message });
        reject(err);
      }
    });
  }

  public deleteDatabase(name = this._name): Promise<string> {
    return new Promise((resolve, reject) => {
      this.close();
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = ((_) => resolve(`idb/deleted-database ${name}`));
      request.onerror = ((_) => reject('Error deleting the database'));
    });
  }

  /**
   * Debugging only
   */
  set version(version: number) {
    this._version = version;
  }
}

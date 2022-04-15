import idbReady from 'safari-14-idb-fix';
import { createPromise } from 'wait';

const category = 'idb';

const READONLY: Set<Method> = new Set(['get', 'getAll', 'getBound', 'getLastEntry', 'count']);
//const READWRITE: Set<Method> = new Set(['add', 'set', 'delete']);

type Method = 'get' | 'getAll' | 'getBound' | 'getLastEntry' | 'count' | 'add' | 'set' | 'delete';
type Schema = (oldVersion: number, db: IDBDatabase, tx: IDBTransaction) => void;
type Beacon = (action: string, opts?: unknown) => void;

interface TransactionOptions {
  storeName: string;
  indexName?: string;
  state?: { result: any };
  resolve: (value: any) => void;
  reject: (value: any) => void;
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
        await idbReady();

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

          if (e.oldVersion === 0) {
            this._beacon(`idb-open/install`, { category });
          } else {
            this._beacon(`idb-open/upgrade`, { category, label: 'old-version', value: e.oldVersion });
          }

          this._schema(e.oldVersion, db, upgrade.transaction);
        };
      } catch (err) {
        resolve(this._handleError(err))
      }
    });
  }

  public async open(): Promise<IDBDatabase> {
    if (!this._db) {
      if (this._inProgress) {
        console.warn('open database in progress');
        return this._inProgress;
      }
      this._inProgress = createPromise();

      this._db = await this._openIndexedDB();

      this._inProgress.resolve(this._db);
      this._inProgress = null;
    }
    return this._db;
  }
  public close(): void {
    if (this._db === null) {
      return;
    } else {
      const { name } = this._db;
      this._db.close();
      this._db = null;
      console.log('idb-close/database', name);
      return;
    }
  }

  private _handleTransactionError(e: Event) {
    const request = e.target as IDBRequest;
    const { name, message } = request.error;
    console.warn('_handleTransactionError', name, message);
    return message;
  }
  private async _transaction(method: Method, options: TransactionOptions) {
    const {
      storeName,
      indexName,
      state = { result: 'success' },
      resolve,
      reject
    } = options;

    const mode = READONLY.has(method) ? 'readonly' : 'readwrite';

    const db = await this.open();
    const tx = db.transaction(storeName, mode);
    tx.oncomplete = () => resolve(state.result);
    tx.onerror = (e) => reject(this._handleTransactionError(e));

    const store = tx.objectStore(storeName);
    const index = indexName ? store.index(indexName) : null;

    return index || store;
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

        const tx = <IDBObjectStore>await this._transaction('add', {
          storeName,
          resolve,
          reject,
        });

        const { keyPath, autoIncrement } = tx;

        for (let value of values) {
          if (autoIncrement === false && value[keyPath as string] === undefined) {
            throw new Error(`key '${keyPath}' is required but missing.`);
          } else if (autoIncrement && value[keyPath as string]) {
            throw new Error(`key '${keyPath}' is auto-incrementing and must not be set.`);
          }

          // not used ```add``` as put allows overwriting
          tx.put(value);
        }
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
        const tx = <IDBObjectStore>await this._transaction('set', {
          storeName,
          resolve,
          reject,
        });

        const { keyPath } = tx;
        const key = value[keyPath as string];

        if (!key) {
          throw new Error(`key '${keyPath}' is required but missing.`);
        }

        let found = false;

        const cursorRequest = tx.openCursor(IDBKeyRange.only(key));
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
      } catch (err) {
        this._beacon(`idb-set/${storeName}`, { label: err.message });
        reject(err);
      }
    });
  }

  get(key: string, storeName: string, indexName = undefined): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const state = { result: null };

      const tx = await this._transaction('get', {
        storeName,
        indexName,
        state,
        resolve,
        reject,
      });

      const cursorRequest = tx.openCursor(IDBKeyRange.only(key));
      cursorRequest.onsuccess = () => {
        let cursor = cursorRequest.result;
        if (!!cursor === false) return;
        state.result = cursor.value;
        cursor.continue();
      };
      cursorRequest.onerror = () => reject(cursorRequest.error);
    });
  }

  getAll(storeName: string, indexName = null, key = null, limit = null) {
    return new Promise(async (resolve, reject) => {
      try {
        const tx = await this._transaction('getAll', {
          storeName,
          indexName,
          resolve,
          reject
        });

        const request = tx.getAll(key, limit);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (err) {
        this._beacon(`idb-getAll/${storeName}`, { label: err.message });
        reject(err);
      }
    });
  }

  getBound(storeName: string, indexName: string, lower: string, upper = null) {
    return new Promise(async (resolve, reject) => {
      try {
        const state = { result: [] };
        const tx = await this._transaction('getBound', {
          storeName,
          indexName,
          state,
          resolve,
          reject
        });

        const keyRange = lower && upper
          ? IDBKeyRange.bound(lower, upper)
          : IDBKeyRange.only(lower);
        const cursorRequest = tx.openCursor(keyRange, 'prev');
        cursorRequest.onsuccess = () => {
          let cursor = cursorRequest.result;
          if (!!cursor == false) return;
          state.result.push(cursor.value);
          cursor.continue();
        };
        cursorRequest.onerror = () => reject(cursorRequest.error);
      } catch (err) {
        this._beacon(`idb-getBound/${storeName}`, { label: err.message });
        reject(err);
      }
    });
  }

  getLastEntry(storeName: string, indexName = null, direction: IDBCursorDirection) {
    return new Promise(async (resolve, reject) => {
      try {
        const state = { result: null };
        const tx = await this._transaction('getLastEntry', {
          storeName,
          indexName,
          state,
          resolve,
          reject
        });

        const cursorRequest = tx.openCursor(null, direction);

        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!!cursor === false) return;
          state.result = cursor.value;
        };
        cursorRequest.onerror = () => reject(cursorRequest.error);
      } catch (err) {
        this._beacon(`idb-getLastEntry/${storeName}`, { label: err.message });
        reject(err);
      }
    });
  }

  delete(storeName: string, key = null) {
    return new Promise(async (resolve, reject) => {
      try {
        const tx = <IDBObjectStore>await this._transaction('delete', {
          storeName,
          resolve,
          reject
        });

        const request = key ? tx.delete(key) : tx.clear();
        request.onsuccess = () => resolve('success');
        request.onerror = () => reject(request.error);
      } catch (err) {
        this._beacon(`idb-delete/${storeName}`, { label: err.message });
        reject(err);
      }
    });
  }

  count(storeName: string, indexName = null, lower = null, upper = null) {
    return new Promise(async (resolve, reject) => {
      try {
        const tx = await this._transaction('count', {
          storeName,
          indexName,
          resolve,
          reject
        });

        const keyRange = lower && upper
          ? IDBKeyRange.bound(lower, upper)
          : lower
          ? IDBKeyRange.only(lower)
          : null;

        const request = indexName && keyRange
          ? tx.count(keyRange)
          : tx.count();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);

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

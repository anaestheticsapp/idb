import idbReady from 'safari-14-idb-fix';
import { createPromise } from 'wait';

type Schema = (oldVersion: number, db: IDBDatabase, tx: IDBTransaction) => void;

const METHOD = {
  GET: 'get',
  GETALL: 'getAll',
  COUNT: 'count',
  ADD: 'add',
  SET: 'set',
  DELETE: 'delete',
}
const READONLY = new Set([METHOD.GET, METHOD.GETALL, METHOD.COUNT]);
const READWRITE = new Set([METHOD.ADD, METHOD.SET, METHOD.DELETE]);

export class IndexedDB {
  public onError = (_err: Error): void => null;
  public onVersionChange = (): void => null;
  public onBlocked = (): void => null;

  private _database: string;
  private _version: number;
  private _schema: Schema;

  private _inProgress = null;
  private _db = null;

  get storeNames() {
    return new Set(this._db.objectStoreNames);
  }
  set version(version: number) {
    this._version = version;
  }
  get version() {
    return this._db?.version;
  }
  get name() {
    return this._db?.name;
  }

  /**
   * v3
   */
  constructor(database: string, version: number, schema: Schema) {
    this._database = database;
    this._version = version;
    this._schema = schema;
  }

  private _connect(): Promise<IDBDatabase | null> {
    return new Promise(async (resolve, reject) => {
      try {
        await idbReady();

        let request = indexedDB.open(this._database, this._version);
        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => this.onVersionChange();

          console.log('idb/connected', { name: db.name, version: db.version, origin: location.pathname });

          resolve(db);
        }
        // throw error instead ? possible
        request.onerror = () => reject(new Error(request.error.message));
        request.onblocked = () => this.onBlocked();
        request.onupgradeneeded = (e) => this._schema(e.oldVersion, request.result, (e.target as IDBRequest).transaction);
      } catch (err) {
        reject(err)
      }
    });
  }
  public async open(): Promise<IDBDatabase> {
    if (!this._db) {
      try {
        if (this._inProgress) return await this._inProgress;
        this._inProgress = createPromise();
        this._db = await this._connect();
      } catch (err) {
        this._db = null;
        this.onError(err);
      } finally {
        if (this._inProgress) {
          this._inProgress.resolve(this._db);
          this._inProgress = null;
        }
      }
    }
    return this._db;
  }
  public close(): void {
    if (this._db) {
      console.log('idb/closed', this._db.name);
      this._db.close();
      this._db = null;
    }
    return;
  }
  public delete(name = this._database): Promise<string> {
    return new Promise((resolve, reject) => {
      this.close();
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = ((_) => resolve(`idb/deleted-database ${name}`));
      request.onerror = ((_) => reject('Error deleting the database'));
    });
  }

  private _validateRequest(prop: string, args: any[], store: IDBObjectStore) {
    const { keyPath, autoIncrement } = store;
    const [arg1] = args;

    if (prop === 'add') {
      if (Array.isArray(arg1) === false)
        throw new Error('You must pass an array into the "add" method.');

      for (let value of arg1) {
        const key = value[keyPath as string];

        if (!autoIncrement && !key)
          throw new Error(`key '${keyPath}' is required but missing.`);
        else if (autoIncrement && key)
          throw new Error(`key '${keyPath}' is auto-incrementing and must not be set.`);
      }
    } else if (prop === 'set') {
      if (!arg1[keyPath as string])
        throw new Error(`key '${keyPath}' is required but missing.`);
    }
  }

  private async _promisifyIDBTransaction(prop: string, request: string) {
    const [storeName, indexName] = request.split('/').filter(Boolean);
    const db = await this.open();
    const tx = db.transaction(storeName, READONLY.has(prop) ? 'readonly' : 'readwrite');
    const store = tx.objectStore(storeName);
    const index = indexName ? store.index(indexName) : null;
    return {
      store,
      index,
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
  private _getKeyRange(prop: string, args: any[]): IDBKeyRange | null {
    const [lower, upper] = args;
    if (prop === 'delete' || prop === 'get' || prop === 'count') {
      if ((lower && upper)) {
        return IDBKeyRange.bound(lower, upper);
      } else if (lower) {
        return IDBKeyRange.only(lower);
      }
    }
    return null;
  }
  private _getDirection(args: any[]): IDBCursorDirection {
    const [key, dir] = args;
    if (key === null && dir) {
      return dir as IDBCursorDirection;
    } else {
      return 'prev';
    }
  }
  private _methods(request: string, prop: string, args: any[]) {
    return new Promise(async (resolve, reject) => {
      try {
        let result = [];

        const { store, index, done }  = await this._promisifyIDBTransaction(prop, request);

        const keyRange = this._getKeyRange(prop, args);
        const direction = this._getDirection(args);

        this._validateRequest(prop, args, store);

        switch (prop) {
          case METHOD.GET: {
            const query = (index || store).openCursor(keyRange, direction);
            let cursor: any = true;
            while (!!cursor) {
              cursor = await this._promisifyIDBCursorRequest(query);
              if (cursor) {
                result.push(cursor.value);
                cursor.continue();
              }
            }
            break;
          }
          case METHOD.GETALL: {
            const [key, limit] = args;
            const query = (index || store).getAll(key, limit ? +limit : null);
            result = await this._promisifyIDBRequest(query);
            break;
          }
          case METHOD.COUNT: {
            const query = (index || store).count(keyRange);
            result = await this._promisifyIDBRequest(query);
            break;
          }
          case METHOD.ADD: {
            for (let value of args[0]) {
              // store.add throws error when item already exists, store.put overwrites item
              store.put(value);
            }
            break;
          }
          case METHOD.DELETE: {
            const query = keyRange
              ? store.delete(keyRange)
              : store.clear();
            await this._promisifyIDBRequest(query);
            break;
          }
          case METHOD.SET: {
            const [value] = args;
            const key = value[store.keyPath as string];

            const query = store.openCursor(IDBKeyRange.only(key));
            let cursor: any = true;
            while (!!cursor) {
              cursor = await this._promisifyIDBCursorRequest(query);
              if (cursor) {
                console.log('UPDATE');

                cursor.update(Object.assign({}, cursor.value, value));
                break;
                //cursor.continue();
              } else {
                console.log('PUT');
                store.put(value);
              }
            }
            break;
          }
          default:
            throw new Error(`method "${prop}" not found`);
        }
        await done;
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  }
  /**
   * - ```get(key: string)```
   * - ```get(lower: string, upper: string)```
   * - ```get(null, direction: string)``` - get last
   * - ```getAll(key?: string, limit: number)```
   */
  public proxy(request = '') {
    return new Proxy({ request }, {
      get: (obj, prop: string) => {
        if (READONLY.has(prop) || READWRITE.has(prop)) {
          return (...args: any[]) => this._methods(obj.request, prop, args);
        }
        return this.proxy(`${obj.request}/${prop}`);
      },
    });
  }
}

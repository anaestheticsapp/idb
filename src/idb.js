// https://bugs.webkit.org/show_bug.cgi?id=226547#c26
// workaround for macOS Big Sur 11.4 and iOS 14.6
indexedDB.deleteDatabase('dummy-database');

export default class IndexedDB {
  constructor(name, version, schema, beacon) {
    this._DB_NAME = name;
    this._DB_VERSION = version;
    this._SCHEMA = schema;
    this._BEACON_URL = beacon;

    this.db = null;
    this._openDatabase = () => {
      if (this._openDatabase.once) return;
      console.log('Opening IndexedDB', location.pathname);

      this._openDatabase.once = true;
      this._database = this.openIndexedDB();
    };
  }
  _beacon(action, opts = {}) {
    const body = JSON.stringify(Object.assign({}, { action: action }, opts));
    if ('sendBeacon' in navigator) {
      navigator.sendBeacon(this._BEACON_URL, body);
    } else {
      fetch(this._BEACON_URL, { body, credentials: 'same-origin', method: 'POST' })
        .then((res) => console.log(res))
        .catch((err) => console.error(err));
    }
  }
  openIndexedDB() {
    return new Promise((resolve, reject) => {
      let request = indexedDB.open(this._DB_NAME, this._DB_VERSION);
      request.addEventListener('error', (event) => {
        this._beacon(`[client] error idb:31`, { label: request.error });
      });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        this._beacon(`[client] error idb:36`, { label: request.error });
        reject(request.error);
      };
      request.onblocked = () => {
        this._beacon('[client] db blocked idb:42');
      };
      request.onversionchange = () => {
        this._beacon('[client] idb version change idb:46');
        request.close();
      };
      request.onupgradeneeded = (e) => {
        this._beacon('[client] idb upgrade needed idb:46', { category: 'database' });
        const db = request.result;
        const tx = e.currentTarget.transaction;
        const oldVersion = e.oldVersion;

        this._SCHEMA(oldVersion, db, tx);
      };
    });
  }
  async open() {
    if (!this.db) {
      this._openDatabase();
      this.db = await this._database;
      this._openDatabase.once = null;
    }
    return this.db; // for old version
  }
  close() {
    if (!this.db) {
      console.warn('unable to close idb: connection is not open');
    } else {
      this.db.close();
      this.db = null;
      return 'idb succesfully closed';
    }
  }
  get(key, storeName, indexName = null) {
    return new Promise(async (resolve, reject) => {
      if (!this.db) this.db = await this.open();
      const transaction = this.db.transaction(storeName, 'readonly');
      transaction.oncomplete = () => resolve(item);
      transaction.onerror = () => reject(transaction.error);

      const objectStore = transaction.objectStore(storeName);
      const store = indexName ? objectStore.index(indexName) : objectStore;

      const keyRange = IDBKeyRange.only(key);
      const cursorRequest = store.openCursor(keyRange);
      let item = '';
      cursorRequest.onsuccess = () => {
        let result = cursorRequest.result;
        if (!!result == false) return;
        item = result.value;
        result.continue();
      };
      cursorRequest.onerror = () => reject(cursorRequest.error);
    });
  }
  getAll(storeName, indexName = null, key = null, limit = null) {
    return new Promise(async (resolve, reject) => {
      if (!this.db) await this.open();
      const transaction = this.db.transaction(storeName, 'readonly');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      const objectStore = transaction.objectStore(storeName);
      const store = indexName ? objectStore.index(indexName) : objectStore;
      const request = store.getAll(key, limit);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  getBound(storeName, indexName, lower, upper = null) {
    return new Promise(async (resolve, reject) => {
      if (!this.db) this.db = await this.open();
      const transaction = this.db.transaction(storeName, 'readonly');
      transaction.oncomplete = () => resolve(results);
      transaction.onerror = () => reject(transaction.error);

      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const keyRange = lower && upper ? IDBKeyRange.bound(lower, upper) : IDBKeyRange.only(lower);
      const cursorRequest = index.openCursor(keyRange, 'prev');
      let results = [];
      cursorRequest.onsuccess = () => {
        let row = cursorRequest.result;
        if (!!row == false) return;
        results.push(row.value);
        row.continue();
      };
      cursorRequest.onerror = () => reject(cursorRequest.error);
    });
  }
  getLastEntry(storeName, indexName = null, direction = 'prev') {
    return new Promise(async (resolve, reject) => {
      if (!this.db) await this.open();
      const transaction = this.db.transaction(storeName, 'readonly');
      transaction.oncomplete = () => resolve(item);
      transaction.onerror = () => reject(transaction.error);

      const objectStore = transaction.objectStore(storeName);
      const store = indexName ? objectStore.index(indexName) : objectStore;
      const cursorRequest = store.openCursor(null, direction);

      let item = null;
      cursorRequest.onsuccess = () => {
        if (!!cursorRequest.result == false) return;
        item = cursorRequest.result.value;
      };
      cursorRequest.onerror = () => reject(cursorRequest.error);
    });
  }
  // key must be in value if store does not auto-increment
  add(values = [], storeName) {
    return new Promise(async (resolve, reject) => {
      if (!this.db) this.db = await this.open();
      const transaction = this.db.transaction(storeName, 'readwrite');
      transaction.oncomplete = () => resolve('success');
      transaction.onerror = () => reject(transaction.error);
      const store = transaction.objectStore(storeName);
      for (let val of values) {
        store.put(val); // if changed to add will throw error null if values is empty
      }
    });
  }
  // does not work for stores that auto-increment
  // set() updates value if already present, add() inserts a completely new value
  set(val, storeName) {
    return new Promise(async (resolve, reject) => {
      if (!val.id) return console.error('value has no id!');
      if (!this.db) this.db = await this.open();
      const transaction = this.db.transaction(storeName, 'readwrite');
      transaction.oncomplete = () => resolve('success');
      transaction.onerror = () => reject(transaction.error);

      const store = transaction.objectStore(storeName);
      const keyRange = IDBKeyRange.only(val.id);
      const cursorRequest = store.openCursor(keyRange);
      let found = false;
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (!!cursor == false) {
          if (!found) store.put(val);
          return;
        }
        cursor.update(Object.assign({}, cursor.value, val));
        found = true;
        cursor.continue();
      };
      cursorRequest.onerror = () => reject(cursorRequest.error);
    });
  }
  delete(storeName, key = null) {
    return new Promise(async (resolve, reject) => {
      if (!this.db) this.db = await this.open();
      const transaction = this.db.transaction(storeName, 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      const objectStore = transaction.objectStore(storeName);
      const request = key ? objectStore.delete(key) : objectStore.clear();

      request.onsuccess = () => resolve('success');
      request.onerror = () => reject(request.error);
    });
  }
  count(storeName, indexName = null, lower = null, upper = null) {
    return new Promise(async (resolve, reject) => {
      if (!this.db) this.db = await this.open();
      const transaction = this.db.transaction(storeName, 'readonly');
      transaction.oncomplete = () => resolve(results);
      transaction.onerror = () => reject(transaction.error);

      const store = transaction.objectStore(storeName);
      const index = indexName ? store.index(indexName) : null;
      const keyRange = lower && upper ? IDBKeyRange.bound(lower, upper) : IDBKeyRange.only(lower);

      let results;
      const request = lower ? index.count(keyRange) : index ? index.count() : store.count();
      request.onsuccess = () => {
        results = request.result;
      };
      request.onerror = () => reject(request.error);
    });
  }
}

import { IndexedDB } from 'idb2';

/**
 * Create a new object store
 * @param db
 * @param storeName
 * @param index
 * @param opts - by default: ```keypath = "id"``` and ```autoIncrement = false```
 */
function create(db: IDBDatabase, storeName: string, index = [], opts = { keyPath: 'id', autoIncrement: false }) {
  const store = db.createObjectStore(storeName, opts);
  for (const name of index) {
    store.createIndex(name, name, { unique: false });
  }
}
function remove(db: IDBDatabase, storeName: string) {
  return db.deleteObjectStore(storeName);
}
function index(tx: IDBTransaction, storeName: string, index: string) {
  return tx.objectStore(storeName).createIndex(index, index, { unique: false });
}
/**
 *
 * @param oldVersion must not be 0
 * @param db IndexedDb
 * @param tx required when store already exists (ie adding an index to an existing store)
 */
export const SCHEMA = (oldVersion: number, db: IDBDatabase, tx: IDBTransaction): void => {
  if (oldVersion > 0) {
    console.log(`idb/upgrading`, { oldVersion });
  }

  switch (oldVersion) {
    case 0: {
      console.log(`idb/installing`);
      create(db, 'store1');
      create(db, 'store2', ['date', 'role']);
      create(db, 'store3', [], { keyPath: 'id', autoIncrement: true });
    }
  }
};

export async function testProxy(db: IndexedDB) {
  const idb = db.proxy();

  const [getLastAsc] = await idb.store1.get(null);
  console.assert(getLastAsc.id === 'test', 'last entry - ascending');

  const [getLastDesc] = await idb.store1.get(null, 'next');
  console.assert(getLastDesc.id === 'alphabet', 'last entry - descending');

  const boundKeyOnly = await idb.store2.role.get('test');
  console.assert(boundKeyOnly.length === 2, 'bound key only', boundKeyOnly);

  const bound = await idb.store2.date.get('2022-01-01', '2022-04-01');
  console.assert(bound.length === 4, 'bound', bound);

  const getIndex = await idb.store2.date.get();
  console.assert(getIndex.length === 5, 'getIndex', getIndex);

  await idb.store2.delete();

  const clearStore = await idb.store2.getAll();
  console.assert(clearStore.length === 0, 'delete store', clearStore);
  console.groupEnd();
}

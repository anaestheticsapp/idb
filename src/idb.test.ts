import IndexedDB from './idb.js';

const beacon = (action, opts = { label: '', value: '' }) => console.warn(action, opts.label || '', opts.value || '');
const delay = (ms: number) => new Promise((res) => setTimeout(() => res(null), ms));

const NAME = 'db-test';

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
const SCHEMA = (oldVersion: number, db: IDBDatabase, tx: IDBTransaction): void => {
  switch (oldVersion) {
    case 0: {
      create(db, 'store1');
      create(db, 'store2', ['index1', 'index2']);
      create(db, 'store3', [], { keyPath: 'id', autoIncrement: true });
    }
  }
};

async function testVersionErrors() {
  console.group('testVersionErrors');
  let errors = new Set();

  const VERSION_ZERO_ERROR = `Failed to execute 'open' on 'IDBFactory': The version provided must not be 0.`;
  const VERSION_INCORRECT = `The requested version (1) is less than the existing version (2).`;

  const idb = new IndexedDB(NAME, 2, SCHEMA, beacon);
  idb.onError = (err) => errors.add(err.message);
  await idb.open().catch((err) => err);
  idb.close();

  console.log('test: version 0 not allowed');
  idb.version = 0;
  await idb.open().catch((err) => err);
  console.assert(errors.has(VERSION_ZERO_ERROR), VERSION_ZERO_ERROR);

  console.log('test: new version lower than existing version');
  idb.version = 1;
  await idb.open().catch((err) => err);
  console.assert(errors.has(VERSION_INCORRECT), VERSION_INCORRECT);

  console.log(await idb.deleteDatabase());
  console.groupEnd();
}
async function testVersionChangeTab1() {
  console.group('testVersionChange Tab 1');

  const idb = new IndexedDB(NAME, 1, SCHEMA, beacon);
  idb.onVersionChange = () => {
    const res = confirm('A new database update is available. Reload the tab to complete the update?');
    if (res) {
      idb.close();
      location.reload();
    }
  }
  idb.open();

  console.log('tab 1 db remains open. tab 2 should request version change in tab 1 (this one)');
  console.groupEnd();
}
async function testVersionChangeTab2() {
  console.group('testVersionChange Tab 2');

  const idb = new IndexedDB(NAME, 1, SCHEMA, beacon);
  await idb.open();
  idb.close();

  console.log('changing version in 3s, confirm box in tab 1. Cancel will block, Ok will update');
  await delay(3000);

  idb.version = 2;
  await idb.open();

  console.log('Deleting database in 3s');
  await delay(3000);

  console.log(await idb.deleteDatabase());
  console.groupEnd();
}
async function testAddToDatabase() {
  console.group('testAddToDatabase');

  const idb = new IndexedDB(NAME, 1, SCHEMA, beacon);
  await idb.open();

  await idb.add([{ id: 'test' }], 'store-does-not-exist').catch((err) => err);

  await idb.add(null, 'store1').catch((err) => err);

  await idb.add([{ prop: 'test' }], 'store1').catch((err) => err);

  await idb.add([{ id: 'do-not-provide-id' }], 'store3').catch((err) => err);

  await idb.add([{ id: 'test', prop: 'value-already-present' }], 'store1').catch((err) => err);
  await idb.add([{ id: 'test', prop: 'value-already-present-overwritten' }], 'store1').catch((err) => err);


  await idb.set({ id: 'test', prop2: 'prop-added-to-value' }, 'store1').catch((err) => err);

  await idb.set({ id: 'new-value2', prop2: 'added value' }, 'store1').catch((err) => err);

  await idb.set({ prop2: 'id-missing' }, 'store1').catch((err) => err);

  const getAll = await idb.getAll('store1').catch((err) => err);
  console.log(getAll);


  const get1 = await idb.get('key-does-not-exist', 'store1').catch((err) => err);
  console.assert(get1 === null, 'key-does-not-exist should be null');

  const get2 = await idb.get('test', 'store1').catch((err) => err);
  console.assert(get2?.id === 'test', 'get2', get2);

  const getAll2 = await idb.getAll('store-does-not-exist').catch((_) => null);
  console.log(getAll2);

  const count = await idb.count('store1').catch((_) => null);
  console.log(count);





  return;
  console.log('Deleting database in 60s');
  await delay(60000);
  console.log(await idb.deleteDatabase());
  console.groupEnd();
}

(function test() {
  const test1 = document.getElementById('test1');
  test1.addEventListener('click', testVersionErrors);

  const test2a = document.getElementById('test2a');
  test2a.addEventListener('click', testVersionChangeTab1);
  const test2b = document.getElementById('test2b');
  test2b.addEventListener('click', testVersionChangeTab2);

  const test3 = document.getElementById('test3');
  test3.addEventListener('click', testAddToDatabase);


})();

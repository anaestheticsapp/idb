---
title: IndexedDB Demo
date: 2022-01-14
summary: IndexedDB Demo
description: IndexedDB Demo
tags: IndexedDB Demo
---
# IndexedDB Test
<idb-demo></idb-demo>

```js
idb.store2.add([{}, {}, {}]);
idb.store2.set({});
idb.store2.delete(); // delete store
idb.store2.delete(key); // delete key


/**
 * keyRange: undefined | null | key | [lowerKey, upperKey]
 * limit: number
 * direction: 'last' | 'first'
 * getAll returns array of items
 * get returns item as array
 * count returns number
 */
const getAll = idb.store2.getAll(keyRange, limit?: number);
const getAll = idb.store2.getAll();
const getAll = idb.store2.role.getAll();
const getAll = idb.store2.role.getAll(null, 100); // limit to 100
const getAll = idb.store2.role.getAll('admin', 100);
const getAll = idb.store2.role.getAll('admin');
const getAll = idb.store2.date.getAll(['2022-01-01', '2022-06-01'], 100);

const getBound = idb.store2.role.getAll([lower, upper], limit?: number);

// returns [] but only single item
const getEntry = idb.store2.role.get(keyRange, direction);
const getLastEntry = idb.store2.role.get(null, 'last');
const getFirstEntry = idb.store2.role.get(null, 'first');

const count = idb.store2.count(keyRange);
```

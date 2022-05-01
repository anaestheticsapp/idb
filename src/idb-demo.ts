import { SCHEMA } from 'idb-schema';
import { IndexedDB } from 'idb2';
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

const category = 'idb-demo';

@customElement(category)
export class IDBDemo extends LitElement {
  @state() _stores = [];
  @state() _store = 'store1';
  @state() _index = '';
  @state() _result = '';

  _connections: Set<IndexedDB> = new Set();
  _idb;
  _indexList = {
    store1: [],
    store2: ['date', 'role'],
    store3: [],
  };

  async _openDb(version: number) {
    const db = new IndexedDB('test-db', version, SCHEMA);
    db.onError = (err) => console.error(err.message);
    db.onVersionChange = () => console.error('version change');
    db.onBlocked = () => console.error('blocked');

    this._connections.add(db);
    await db.open();
    this._idb = db.proxy();
    return this._viewStores();
  }
  _clearState(conn: IndexedDB) {
    this._connections.delete(conn);
    const [db] = [...this._connections];
    this._idb = db ? db.proxy() : undefined;
    this._stores = [];
    this._store = 'store1';
    this._index = '';
  }
  _closeDb(e: Event) {
    const btn = e.target as HTMLButtonElement;
    const index = btn.dataset.conn;
    const connections = [...this._connections];
    const conn = connections[index]
    conn.close();
    return this._clearState(conn);
  }
  _deleteDb(e: Event) {
    const btn = e.target as HTMLButtonElement;
    const index = btn.dataset.conn;
    const connections = [...this._connections];
    const conn = connections[index]
    conn.delete();
    return this._clearState(conn);
  }
  async _viewStores() {
    this._store = this._store || 'store1';
    const [store1, store2] = await Promise.all([
      this._idb.store1.getAll(),
      this._idb.store2.getAll(),
    ]);
    this._stores = [
      { key: 'store1', value: store1 },
      { key: 'store2', value: store2 },
    ];
  }

  async _onClick(e: Event) {
    const btn = e.target as HTMLButtonElement;
    switch (btn.id) {
      case 'open-v1':
        return this._openDb(1);
      case 'open-v2':
        return this._openDb(2);
      case 'populate-store1':
        await this._idb.store1.add([
          { id: 'alphabet', value: 'entry1' },
          { id: 'dog', value: 'entry2' },
          { id: 'test', value: 'test-value' },
          { id: 'deleteme', value: 'nothing' },
        ]);
        return this._viewStores();
      case 'populate-store2':
        await this._idb.store2.add([
          { id: 'user1', date: '2022-01-01', role: 'admin' },
          { id: 'user2', date: '2022-02-01', role: 'user' },
          { id: 'user3', date: '2022-04-01', role: 'test' },
          { id: 'user4', date: '2022-03-01', role: 'user' },
          { id: 'user5', date: '2022-05-01', role: 'test' },
          { id: 'user6', role: 'INACTIVE' },
        ]);
        return this._viewStores();
    }
  }
  _onSelectPath(e: Event) {
    const el = e.target as HTMLButtonElement;
    if (el.name === 'store') {
      this._store = el.textContent;
      this._index = '';
    } else if (el.name === 'index') {
      this._index = el.textContent;
    }
  }
  async _onSubmit(e: SubmitEvent) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const method = (e.submitter as HTMLButtonElement).value;

    const store = this._store;
    const index = this._index;

    let arr = [];
    let obj = { id: undefined };
    for (const [key, value] of formData.entries()) {
      if (value) {
        obj[key] = value;
        arr.push(value);
      }
    }

    const args = method === 'add'
      ? [[obj]]
      : method === 'set'
      ? [obj]
      : method === 'delete' || method === 'get' || method === 'getAll'
      ? arr
      : [obj?.id];

    console.log(store, index, method, args);

    if (index) {
      this._result = await this._idb[store][index][method].apply(this, args);
    } else {
      this._result = await this._idb[store][method].apply(this, args);
    }
    this._viewStores();
  }

  renderConnections() {
    return [...this._connections].map((db: IndexedDB, i) => {
      if (db.name === undefined) return;
      return html`<div>
        <span>Database ${db.name} version ${db.version}</span>
        <button type="button" data-conn="${i}" @click=${this._closeDb}>Close</button>
        <button type="button" data-conn="${i}" @click=${this._deleteDb}>Delete</button>
      </div>`;
    });
  }
  renderStore() {
    const store = this._stores.find((store) => store.key === this._store);
    console.log(store);

    if (!store) return;
    return html`
      <h1>${this._store}</h1>
      ${store.value.map((item) => html`<div>${JSON.stringify(item)}</div>`)}
    `;
  }
  renderWriteStore() {
    switch (this._store) {
      case 'store1':
        return html`
          <input name="id" autocomplete="off" placeholder="id" type="text" />
          <input name="value" autocomplete="off" placeholder="value" type="text" />
        `;
      case 'store2':
        return html`
          <input name="id" autocomplete="off" placeholder="id" type="text" />
          <input name="date" autocomplete="off" placeholder="date" type="text" />
          <input name="role" autocomplete="off" placeholder="role" type="text" />
        `;
      default:
        return;
    }
  }
  render() {
    return html`
      <slot></slot>
      <form name="idb" @submit="${this._onSubmit}">
        <fieldset @click="${this._onClick}">
          <legend>Connection</legend>
          <button type="button" id="open-v1">Open Version 1</button>
          <button type="button" id="open-v2">Open Version 2</button>
        </fieldset>
        <fieldset @click="${this._onSelectPath}">
          <legend>Select</legend>
            <span>
              ${this._stores.map((store) => html`<button name="store" type="button" id="${store.key}" ?disabled="${this._store === store.key}">${store.key}</button>`)}
            </span>
            <span>
              ${this._indexList[this._store].map(
                (index) => html`<button name="index" type="button" id="${this._store}-${index}" ?disabled="${this._index === index}">${index}</button>`
              )}
            </span>
        </fieldset>
        <fieldset @click="${this._onClick}">
          <legend>Populate Stores</legend>
          <button type="button" id="populate-store1">store1</button>
          <button type="button" id="populate-store2">store2</button>
        </fieldset>
        <fieldset>
          <legend>Write</legend>
          ${this.renderWriteStore()}
          <button type="submit" value="add" id="add">Add</button>
          <button type="submit" value="set" id="set">Set</button>
          <button type="submit" value="delete" id="delete">Delete</button>
        </fieldset>
        <fieldset>
          <legend>Read</legend>
          <input name="arg1" autocomplete="off" placeholder="arg1" type="text" />
          <input name="arg2" autocomplete="off" placeholder="arg2" type="text" />
          <button type="submit" value="get" id="get">get</button>
          <button type="submit" value="getAll" id="getAll">getAll</button>
          <button type="submit" value="count" id="count">count</button>
          <div>${JSON.stringify(this._result)}</div>
        </fieldset>
      </form>
      ${this.renderConnections()}
      ${this.renderStore()}
    `;
  }
  static styles = css`
    :host * {
      box-sizing: border-box;
    }
    header {
      display: flex;
      gap: var(--space-s);
      align-items: center;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    [category]: IDBDemo;
  }
}

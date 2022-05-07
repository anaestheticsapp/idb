import { schema, types } from 'idb-schema';
import { IndexedDB } from 'idb2';
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

const category = 'idb-demo';

@customElement(category)
export class IDBDemo extends LitElement {
  @state() _availableStores = [];
  @state() _selectedStore = 'store1';
  @state() _selectedIndex = '';
  @state() _result = [];

  _connections: Map<IndexedDB, string> = new Map();

  _idb: any;
  _indexList = {};

  _getRandomWord = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  _setConnection(db: IndexedDB, msg: string) {
    this._connections.set(db, msg);
    this.requestUpdate();
  }
  _getConnection(e: Event) {
    const btn = e.target as HTMLButtonElement;
    const index = btn.dataset.conn;
    const connections = [...this._connections.keys()];
    return connections[index];
  }

  async _openDb(version: number) {
    const idb = new IndexedDB('test-db', version, schema, types);
    idb.onError = (err) => {
      console.error(err.name, err.message);
      this._setConnection(idb, err.message);
    };
    idb.onVersionChange = () => this._setConnection(idb, 'version change');
    idb.onBlocked = () => this._setConnection(idb, 'blocked');

    this._setConnection(idb, 'opening');
    const db = await idb.open();
    this._setConnection(idb, `connected to ${db.name} ${db.version}`);

    this._idb = idb.proxy();

    const storeNames = [...db.objectStoreNames];
    const indexList = {};

    const transaction = db.transaction(storeNames, 'readonly');
    for (const store of storeNames) {
      indexList[store] = ['none', ...transaction.objectStore(store).indexNames];
    }

    this._selectedStore = storeNames[0];
    this._availableStores = storeNames;
    this._indexList = indexList;
  }

  _clearState(conn: IndexedDB) {
    this._connections.delete(conn);
    const [db] = [...this._connections.keys()];
    this._idb = db ? db.proxy() : undefined;
    this._availableStores = [];
    this._selectedStore = 'store1';
    this._selectedIndex = '';
  }
  _closeDb(e: Event) {
    const conn = this._getConnection(e);
    conn.close();
    return this._clearState(conn);
  }
  _deleteDb(e: Event) {
    const conn = this._getConnection(e);
    conn.delete();
    return this._clearState(conn);
  }

  async _generateRandomValues() {
    const store = this._selectedStore;
    const roles = ['admin', 'user', 'test'];

    const values = [];
    for (let i = 0; i < 1000; i++) {
      const id = crypto.randomUUID();

      if (store === 'store1') {
        const [value] = crypto.getRandomValues(new Uint32Array(10));
        values.push({ id, value });
      } else if (store === 'store2') {
        const month = Math.floor(Math.random() * 12) - 1;
        const day = Math.floor(Math.random() * 12);
        values.push({ id, date: new Date(2022, month, day), role: this._getRandomWord(roles) });
      } else {
        throw Error('Unknown store');
      }
    }

    await this._idb[store].add(values);
  }
  async _onClick(e: Event) {
    const btn = e.target as HTMLButtonElement;
    switch (btn.id) {
      case 'open-v1':
        return this._openDb(1);
      case 'open-v2':
        return this._openDb(2);
      case 'generate-random':
        return this._generateRandomValues();
    }
  }
  _onSelectPath(e: Event) {
    const el = e.target as HTMLButtonElement;
    if (el.name === 'store') {
      this._selectedStore = el.textContent;
      this._selectedIndex = '';
    } else if (el.name === 'index') {
      if (el.textContent === 'none') this._selectedIndex = '';
      else this._selectedIndex = el.textContent;
    }
  }
  async _onSubmit(e: SubmitEvent) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const method = (e.submitter as HTMLButtonElement).value;
    const isReadOnly = method === 'get' || method === 'getAll' || method === 'count';
    const isWrite = method === 'add' || method === 'set' || method === 'delete';

    const store = this._selectedStore;
    const index = this._selectedIndex;

    let arr = [];
    let obj = {};
    for (const [key, value] of formData.entries()) {
      if (!value) continue;
      const isArg = key === 'arg1' || key === 'arg2';
      if ((isReadOnly && isArg) || (isWrite && !isArg)) {
        console.log(key, value);
        obj[key] = value;
        arr.push(value);
      }
    }

    console.log(arr, obj);

    let args;
    if (method === 'add') {
      args = [[obj]];
    } else if (method === 'set') {
      args = [obj];
    } else {
      args = arr;
    }

    console.log({ store, index, method, args });

    this._result = index
      ? await this._idb[store][index][method].apply(this, args)
      : await this._idb[store][method].apply(this, args);
  }

  renderWriteInputFields() {
    const store = this._selectedStore;
    const props = types[store];
    return props.keys.map((key: string) => html`<input name="${key}" autocomplete="off" placeholder="${key}" type="text" />`);
  }

  renderConnections() {
    return [...this._connections.entries()].map(([db, message], i) => {
      return html`<div>
        <span>Database ${db.name} version ${db.version || db._version}</span>
        <button type="button" data-conn="${i}" @click=${this._closeDb}>Close</button>
        <button type="button" data-conn="${i}" @click=${this._deleteDb}>Delete</button>
        <span>${message}</span>
      </div>`;
    });
  }
  renderformConnection() {
    return html`
      <fieldset @click="${this._onClick}">
        <legend>Connection</legend>
        <button type="button" id="open-v1">Open Version 1</button>
        <button type="button" id="open-v2">Open Version 2</button>
        ${this.renderConnections()}
      </fieldset>
    `;
  }
  renderAvailableStores() {
    return html`
      <fieldset @click="${this._onSelectPath}">
        <legend>Select</legend>
          ${this._availableStores.map((store) => html`<button name="store" type="button" id="${store}" ?disabled="${this._selectedStore === store}">${store}</button>`)}
      </fieldset>
    `;
  }
  renderResults() {
    return this._result.map((item) => html`<div>${JSON.stringify(item)}</div>`);
  }

  render() {
    return html`
      <slot></slot>
      <form name="idb" @submit="${this._onSubmit}">
        ${this.renderformConnection()}
        ${this.renderAvailableStores()}
        <fieldset>
          <legend>Write</legend>
          <div>
            ${this.renderWriteInputFields()}
            <button type="submit" value="add" id="add">Add</button>
            <button type="submit" value="set" id="set">Set</button>
            <button type="submit" value="delete" id="delete">Delete</button>
          </div>
          <div>
            <button type="button" id="generate-random" @click="${this._onClick}">Generate Random</button>
          </div>
        </fieldset>
        <fieldset>
          <legend>Read</legend>
          <div @click="${this._onSelectPath}">
            Index:
            ${this._indexList[this._selectedStore]?.map(
              (index: string) => html`<button name="index" type="button" id="${this._selectedStore}-${index}" ?disabled="${this._selectedIndex === index}">${index}</button>`
            )}
          </div>
          <div>
            <input name="arg1" autocomplete="off" placeholder="arg1" type="text" />
            <input name="arg2" autocomplete="off" placeholder="arg2" type="text" />
            <button type="submit" value="get" id="get">get</button>
            <button type="submit" value="getAll" id="getAll">getAll</button>
            <button type="submit" value="count" id="count">count</button>
          </div>
          <div>
            ${Array.isArray(this._result) ? this.renderResults() : this._result}
          </div>
        </fieldset>
      </form>
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
    fieldset div {
      padding: var(--space-xxs);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    [category]: IDBDemo;
  }
}

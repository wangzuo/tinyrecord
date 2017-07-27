import _ from 'lodash';

export default class Result {
  constructor(columns, rows, columnTypes = {}) {
    this.columns = columns;
    this.rows = rows;
    this.columnTypes = columnTypes;
    this._hashRows = null;
  }

  get length() {
    return this.rows.length;
  }

  get hashRows() {
    if (!this._hashRows) {
      this._hashRows = this.rows.map(row => _.zipObject(this.columns, row));
    }

    return this._hashRows;
  }

  first() {
    if (!this.rows.length) return null;
    return _.zipObject(this.columns, this.rows[0]);
  }

  each(fn) {}

  toHash() {
    return this.hashRows;
  }
}

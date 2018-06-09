// @flow
import _ from 'lodash';

export default class FromClause {
  value: any;
  name: string;

  constructor(value: any, name: string) {
    this.value = value;
    this.name = name;
  }

  binds() {
    if (this.value instanceof Relation) {
      return this.value.boundAttributes();
    }

    return [];
  }

  merge(other: FromClause) {
    return this;
  }

  empty() {
    return _.isNull(this.value);
  }

  static get empty() {
    if (!this._empty) {
      this._empty = new this(null, null);
    }
    return this._empty;
  }
}

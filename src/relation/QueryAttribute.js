// @flow
import Attribute from '../Attribute';

export default class QueryAttribute extends Attribute {
  typeCast(value) {
    return value;
  }

  get valueForDatabase() {
    if (!this._valueForDatabase) {
      this._valueForDatabase = super.valueForDatabase;
    }
    return this._valueForDatabase;
  }

  withCastValue(value) {
    return new QueryAttribute(this.name, value, this.type);
  }
}

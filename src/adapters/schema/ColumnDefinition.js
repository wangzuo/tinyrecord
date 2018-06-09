// @flow
export default class ColumnDefinition {
  name: string;
  type: string;
  sqlType: string;

  constructor(name: string, type: string, options, sqlType: string) {
    this.name = name;
    this.type = type;
    this.options = options;
    this.sqlType = sqlType;
  }

  primaryKey() {
    return this.options.primaryKey;
  }

  set limit(value) {
    this.options.limit = value;
  }
  get limit() {
    return this.options.limit;
  }

  set precision(value) {
    this.options.precision = value;
  }
  get precision() {
    return this.options.precision;
  }

  // scale, default, nil, collation, comment
}

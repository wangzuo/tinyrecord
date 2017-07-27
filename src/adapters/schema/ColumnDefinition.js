export default class ColumnDefinition {
  constructor(name, type, options, sqlType) {
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

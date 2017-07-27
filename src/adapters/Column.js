export default class Column {
  constructor(
    name,
    _default,
    sqlTypeMetaData = null,
    nil = true,
    tableName = null,
    defaultFunction = null,
    collation = null,
    comment = null
  ) {
    this.name = name;
    this.tableName = tableName;
    this.sqlTypeMetaData = sqlTypeMetaData;
    this.nil = nil;
    this.default = _default;
    this.defaultFunction = defaultFunction;
    this.collation = collation;
    this.comment = comment;
  }

  humanName() {
    // human_attribute_name
    return this.name
      .split('_')
      .map(str => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase())
      .join(' ');
  }

  initWith(coder) {
    this.name = coder.name;
  }

  encodeWith(coder) {
    coder['name'] = this.name;
  }
}

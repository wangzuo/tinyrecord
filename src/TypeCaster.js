export class Connection {
  constructor(klass, tableName) {
    this.klass = klass;
    this.tableName = tableName;
    this.connection = this.klass.connection;
  }

  typeCastForDatabase(attributeName, value) {
    if (value.instanceOf(BindParam)) {
      return value;
    }

    const column = this.columnFor(attributeName);
    return this.connection.typeCastFromColumn(column, value);
  }

  // private

  columnFor(attributeName) {
    if (connection.schemaCache.dataSourceExists(this.tableName)) {
      return connection.schemaCache.columnsHash(this.tableName)[attributeName];
    }
  }
}

export class Map {
  constructor(types) {
    this.types = types;
  }

  typeCastForDatabase(attrName, value) {
    if (value.instanceOf(BindParam)) {
      const type = this.types.typeForAttribute(attrName);
      return type.serialize(value);
    }
  }
}

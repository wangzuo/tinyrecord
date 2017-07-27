export default class SchemaCreation {
  constructor(conn) {
    this.conn = conn;

    [
      'quoteTableName',
      'quoteColumnName',
      'quoteDefaultExpression',
      'typeToSql'
    ].forEach(method => (this[method] = conn[method].bind(conn)));
  }

  accept(o) {
    const m = `visit${o.constructor.name}`;
    return this[m](o);
  }

  visitAlterTable(o) {
    let sql = `ALTER TABLE ${this.quoteTableName(o.name)} `;
    sql += o.adds.map(col => this.accept(col)).join(' ');
    sql += o.foreignKeyAdds.map(fk => this.visitAddForeignKey(fk)).join(' ');
    sql += o.foreignKeyDrops.map(fk => this.visitDropForeignKey(fk)).join(' ');
    return sql;
  }

  visitColumnDefinition(o) {
    o.sqlType = this.typeToSql(o.type, o.options);
    const columnSql = `${this.quoteColumnName(o.name)} ${o.sqlType}`;
    // this.add_column_options(column_sql, column_options(o)) unless o.type == :primary_key
    return columnSql;
  }

  visitAddColumnDefinition(o) {
    return `ADD ${this.accept(o.column)}`;
  }

  visitTableDefinition(o) {
    let createSql = `CREATE${o.temporary
      ? ' TEMPORARY'
      : ''} TABLE ${this.quoteTableName(o.name)} `;

    const statements = o.columns.map(c => this.accept(c));

    if (statements.length) {
      createSql += `(${statements.join(', ')})`;
    }

    return createSql;
  }

  visitPrimaryKeyDefinition(o) {
    return `PRIMARY KEY (${o.name.join(', ')})`;
  }

  visitForeignKeyDefinition(o) {}

  visitAddForeignKey(o) {
    return `ADD ${this.accept(o)}`;
  }

  visitDropForeignKey(name) {
    return `DROP CONSTRAINT ${this.quoteColumnName(name)}`;
  }

  tableOptions(o) {
    return {
      comment: o.comment,
      options: o.options
    };
  }

  addTableOptions(createSql, options) {}

  columnOptions(o) {
    return { ...o, column: o };
  }

  addColumnOptions() {}

  toSql(sql) {
    if (sql.toSql) return sql.toSql();
    return sql;
  }

  foreignKeyInCreate(fromTable, toTable, options) {}

  actionSql(action, dependency) {}
}

// @flow
import _ from 'lodash';

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
    if (o.constructor.name.match(/TableDefinition/)) {
      return this.visitTableDefinition(o);
    }

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
    let columnSql = `${this.quoteColumnName(o.name)} ${o.sqlType}`;
    if (o.type !== 'primaryKey') {
      columnSql = this.addColumnOptions(columnSql, { ...o.options, column: o });
    }

    return columnSql;
  }

  visitAddColumnDefinition(o) {
    return `ADD ${this.accept(o.column)}`;
  }

  visitTableDefinition(o) {
    let createSql = `CREATE${
      o.temporary ? ' TEMPORARY' : ''
    } TABLE ${this.quoteTableName(o.name)} `;

    const statements = o.columns.map(c => this.accept(c));

    if (statements.length) {
      createSql += `(${statements.join(', ')})`;
    }

    createSql = this.addTableOptions(createSql, {
      comment: o.comment,
      options: o.options
    });

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

  addTableOptions(createSql, options) {
    if (options.options) {
      createSql += ` ${options.options}`;
    }
    return createSql;
  }

  columnOptions(o) {
    return { ...o, column: o };
  }

  addColumnOptions(sql, options) {
    // TODO: conn.options_include_default?
    if (!_.isUndefined(options.default)) {
      sql += ` DEFAULT ${this.quoteDefaultExpression(
        options.default,
        options.column
      )}`;
    }

    if (options.null === false) {
      sql += ' NOT NULL';
    }

    if (options.autoIncrement === true) {
      sql += ' AUTO_INCREMENT';
    }

    if (options.primaryKey === true) {
      sql += ' PRIMARY KEY';
    }

    return sql;
  }

  toSql(sql) {
    if (sql.toSql) return sql.toSql();
    return sql;
  }

  foreignKeyInCreate(fromTable, toTable, options) {}

  actionSql(action, dependency) {}
}

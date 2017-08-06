import _ from 'lodash';
import AbstractAdapter from './AbstractAdapter';
import Result from '../Result';
import Column from './Column';

const NATIVE_DATABASE_TYPES = {
  primaryKey: 'INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL',
  string: { name: 'varchar' },
  text: { name: 'text' },
  integer: { name: 'integer' },
  float: { name: 'float' },
  decimal: { name: 'decimal' },
  datetime: { name: 'datetime' }, // todo: datetime not null
  time: { name: 'time' },
  date: { name: 'date' },
  binary: { name: 'blob' },
  boolean: { name: 'boolean' }
};

export default class Sqlite3Adapter extends AbstractAdapter {
  static ADAPTER_NAME = 'SQLite';

  constructor(connection, logger, connectionOptions, config) {
    super(connection, logger, config);
    const sqlite3 = require('sqlite3');

    this.connection = new sqlite3.Database(':memory:'); // todo
    this.nativeDatabaseTypes = NATIVE_DATABASE_TYPES;
    this.supportsDdlTransactions = true;
    this.supportSavepoints = true;

    // alias
    this.columnDefinitions = this.tableStructure;
    this.addBelongsTo = this.addReference;
  }

  async explain(arel, binds = []) {
    sql = `EXPLAIN QUERY PLAN ${await this.toSql(arel, binds)}`;
    return new ExplainPrettyPrinter().pp(
      await this.execQuery(sql, 'EXPLAIN', [])
    );
  }

  // todo: try {} catch {}
  async execQuery(sql, name = null, binds = [], options = {}) {
    const prepare = options.prepare || false;
    const typeCastedBinds = this.typeCastedBinds(binds);

    console.log('execQuery', sql, typeCastedBinds);

    if (!prepare) {
      const stmt = this.connection.prepare(sql);

      if (!this.withoutPreparedStatement(binds)) {
        stmt.bind(typeCastedBinds);
      }

      return new Promise((resolve, reject) => {
        stmt.all((err, rows) => {
          if (err) return reject(err);

          // todo: empty when result empty
          const cols = rows.map(row => _.keys(row))[0];
          const records = rows.map(row => _.values(row));

          return resolve(new Result(cols, records));
        });

        stmt.finalize();
      });
    } else {
    }
  }

  async execInsert(
    sql,
    name = null,
    binds = [],
    pk = null,
    sequenceName = null
  ) {
    [sql, binds] = this.sqlForInsert(sql, pk, null, sequenceName, binds);

    const stmt = this.connection.prepare(sql);
    const typeCastedBinds = this.typeCastedBinds(binds);
    stmt.bind(typeCastedBinds);

    return new Promise((resolve, reject) => {
      stmt.run(function(err) {
        if (err) return reject(err); // todo: error

        const result = new Result();
        result.lastInsertRowId = this.lastID;

        return resolve(result);
      });
    });
  }

  async execDelete(sql, name = 'SQL', binds = []) {
    return await this.execQuery(sql, name, binds);
  }

  async execUpdate(sql, name = 'SQL', binds = []) {
    console.log(sql, binds);
    // return await this.execDelete(...args);
  }

  lastInsertedId(result) {
    return result.lastInsertRowId;
  }

  async execute(sql, name = null) {
    console.log('execute', sql);

    return new Promise((resolve, reject) => {
      this.connection.run(sql, (err, response) => {
        if (err) return reject(err);
        return resolve(response);
      });
    });
  }

  beginDbTransaction() {
    this.log('begin transaction', null, () => {
      this.connection.transaction();
    });
  }

  commitDbTransaction() {
    this.log('commit transaction', null, () => {
      this.connection.commit();
    });
  }

  execRollbackDbTransaction() {
    this.log('rollback transaction', null, () => {
      this.connection.rollback();
    });
  }

  primaryKeys(tableName) {
    const pks = this.tableStructure(tableName).filter(f => f.pk > 0);
    return pks.sort((a, b) => a.pk - b.pk).map(f => f.name);
  }

  async removeIndex(tableName, options = {}) {
    const indexName = this.indexNameForRemove(tableName, options);
    await this.execQuery(`DROP INDEX ${this.quoteColumn_Name(indexName)}`);
  }

  async renameTable(tableName, newName) {
    await this.execQuery(
      `ALTER TABLE ${this.quoteTableName(
        tableName
      )} RENAME TO ${this.quoteTableName(newName)}`
    );
    return await this.renameTableIndexes(tableName, newName);
  }

  newColumnFromField(tableName, field) {
    let _default = null; // todo

    const typeMetadata = this.fetchTypeMetadata(field.type);
    return new Column(
      field.name,
      _default,
      typeMetadata,
      field.notnull === 0,
      tableName,
      null,
      field.collation
    );
  }

  dataSourceSql(name = null, options = {}) {
    const type = options.type || null;
    const scope = this.quotedScope(name, { type });
    scope.type = scope.type || "'table','view'";

    let sql = "SELECT name FROM sqlite_master WHERE name <> 'sqlite_sequence'";
    if (scope.name) {
      sql += ` AND name = ${scope.name}`;
    }
    sql += ` AND type IN (${scope.type})`;
    return sql;
  }

  quotedScope(name, options = {}) {
    let type = options.type || null;

    if (type === 'BASE TABLE') type = "'table'";
    else if (type === 'VIEW') type = "'view'";
    const scope = {};
    if (name) scope.name = this.quote(name);
    if (type) scope.type = type;

    return scope;
  }

  async tableStructure(tableName) {
    const structure = await this.execQuery(
      `PRAGMA table_info(${this.quoteTableName(tableName)})`,
      'SCHEMA'
    );

    if (_.isEmpty(structure)) {
      throw new Error(`Could not find table ${tableName}`);
    }

    return await this.tableStructureWithCollation(tableName, structure);
  }

  async tableStructureWithCollation(tableName, basicStructure) {
    const collationHash = {};
    const sql = `SELECT sql FROM (SELECT * FROM sqlite_master UNION ALL SELECT * FROM sqlite_temp_master) WHERE type = 'table' AND name = ${this.quote(
      tableName
    )}`;

    const result = (await this.execQuery(sql, 'SCHEMA')).first();

    if (result) {
      // todo
      const columnString = _.last(result.sql.split('('));
      columnString.split(',').forEach(columnString => {
        const m = columnString.match(/.*\"(\w+)\".*collate\s+\"(\w+)\".*/);

        if (m) {
          collationHash[m[1]] = m[2];
        }
      });

      // todo
      // return basicStructure.map(column => {
      //   const columnName = column.name;

      //   return column;
      // });

      return basicStructure.hashRows;
    }
  }
}

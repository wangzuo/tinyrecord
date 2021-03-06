// @flow
import _ from 'lodash';
import * as Arel from 'arel';
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
  datetime: { name: 'datetime' },
  time: { name: 'time' },
  date: { name: 'date' },
  binary: { name: 'blob' },
  boolean: { name: 'boolean' }
};

export default class Sqlite3Adapter extends AbstractAdapter {
  static ADAPTER_NAME = 'SQLite';

  constructor(connection, logger, connectionOptions, config) {
    super(connection, logger, config);

    this.supportsDdlTransactions = true;
    this.supportSavepoints = true;

    // alias
    this.columnDefinitions = this.tableStructure;
    this.addBelongsTo = this.addReference;
  }

  get nativeDatabaseTypes() {
    return NATIVE_DATABASE_TYPES;
  }

  get arelVisitor() {
    return new Arel.visitors.SQLite(this);
  }

  async explain(arel, binds = []) {
    sql = `EXPLAIN QUERY PLAN ${await this.toSql(arel, binds)}`;
    return new ExplainPrettyPrinter().pp(
      await this.execQuery(sql, 'EXPLAIN', [])
    );
  }

  // todo: try {} catch {}
  execQuery(sql, name = null, binds = [], options = {}) {
    const prepare = options.prepare || false;
    const typeCastedBinds = this.typeCastedBinds(binds);

    return this.log({ sql, name, binds, typeCastedBinds }, () => {
      if (!prepare) {
        const stmt = this.connection.prepare(sql);

        if (!this.withoutPreparedStatement(binds)) {
          stmt.bind(typeCastedBinds);
        }

        return new Promise((resolve, reject) => {
          try {
            const rows = stmt.all();
            // todo: empty when result empty
            const cols = rows.map(row => _.keys(row))[0];
            const records = rows.map(row => _.values(row));

            resolve(new Result(cols, records));
          } catch (e) {
            reject(e);
          }
        });
      } else {
      }
    });
  }

  execInsert(sql, name = null, binds = [], pk = null, sequenceName = null) {
    [sql, binds] = this.sqlForInsert(sql, pk, null, sequenceName, binds);

    const stmt = this.connection.prepare(sql);
    const typeCastedBinds = this.typeCastedBinds(binds);

    stmt.bind(typeCastedBinds);

    return this.log(
      { sql, binds, typeCastedBinds },
      () =>
        new Promise((resolve, reject) => {
          try {
            const { lastInsertROWID } = stmt.run();
            const result = new Result(); // todo: not result hacks
            result.lastInsertRowId = lastInsertROWID;
            return resolve(result);
          } catch (e) {
            reject(e);
          }
        })
    );
  }

  execDelete(sql, name = 'SQL', binds = []) {
    return this.execQuery(sql, name, binds);
  }

  async execUpdate(sql, name = 'SQL', binds = []) {
    const typeCastedBinds = this.typeCastedBinds(binds);

    return this.log({ sql, name, binds, typeCastedBinds }, () => {
      const stmt = this.connection.prepare(sql);
      stmt.bind(typeCastedBinds);

      return new Promise((resolve, reject) => {
        try {
          const info = stmt.run();
          resolve(new Result([], []));
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  // todo: execInsert result fix
  lastInsertedId(result) {
    return result.lastInsertRowId;
  }

  execute(sql, name = null) {
    return this.log(
      { sql, name },
      () =>
        new Promise((resolve, reject) => {
          try {
            const result = this.connection.prepare(sql).run();
            resolve(result);
          } catch (e) {
            reject(e);
          }
        })
    );
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
    const _default = (() => {
      if (_.isNull(field.dflt_value)) return null;

      const m1 = field.dflt_value.match(/^null$/i);
      if (m1) return null;

      const m2 = field.dflt_value.match(/^'(.*)'$/m);
      if (m2) return m2[1];

      const m3 = field.dflt_value.match(/^"(.*)"$/m);
      if (m3) return m3[1];

      return field.dflt_value;
    })();

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

  quotedDate(value) {
    return value.toISOString();
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

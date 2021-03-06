// @flow
import _ from 'lodash';
import * as Arel from 'arel';
import AbstractAdapter from './AbstractAdapter';
import Result from '../Result';
import Mysql2TableDefinition from './Mysql2TableDefinition';
import Mysql2Column from './Mysql2Column';
import Mysql2TypeMetadata from './Mysql2TypeMetadata';
import * as Type from '../Type';

const NATIVE_DATABASE_TYPES = {
  primaryKey: 'bigint auto_increment PRIMARY KEY',
  string: { name: 'varchar', limit: 255 },
  text: { name: 'text', limit: 65535 },
  integer: { name: 'int', limit: 4 },
  float: { name: 'float' },
  decimal: { name: 'decimal' },
  datetime: { name: 'datetime' },
  timestamp: { name: 'timestamp' },
  time: { name: 'time' },
  date: { name: 'date' },
  binary: { name: 'blob', limit: 65535 },
  boolean: { name: 'tinyint', limit: 1 },
  json: { name: 'json' }
};

export default class Mysql2Adapter extends AbstractAdapter {
  static ADAPTER_NAME = 'Mysql2';

  constructor(connection, logger, connectionOptions, config) {
    super(connection, logger, config);
  }

  get nativeDatabaseTypes() {
    return NATIVE_DATABASE_TYPES;
  }

  // todo
  async disconnect() {
    return new Promise((resolve, reject) => {
      this.connection.end(err => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  get arelVisitor() {
    return new Arel.visitors.MySQL(this);
  }

  // todo: sql
  async createDatabase(name, options = {}) {
    const sql = options.collation
      ? `CREATE DATABASE ${this.quoteTableName(
          name
        )} DEFAULT CHARACTER SET ${this.quoteTableName(
          options.charset || 'utf8'
        )} COLLATE ${this.quoteTableName(options.collation)}`
      : `CREATE DATABASE ${this.quoteTableName(
          name
        )} DEFAULT CHARACTER SET ${this.quoteTableName(
          options.charset || 'utf8'
        )}`;

    await this.execute(sql);
  }

  async dropDatabase(name) {
    await this.execute(`DROP DATABASE IF EXISTS ${this.quoteTableName(name)}`);
  }

  async recreateDatabase(name, options = {}) {
    await this.dropDatabase(name);
    await this.createDatabase(name, options);
  }

  // TODO:
  async execute(sql, name = null) {
    return await this.log(
      { sql, name },
      () =>
        new Promise((resolve, reject) => {
          this.connection.query(sql, (err, results, fields) => {
            if (err) return reject(err);
            if (err) return reject(err);
            if (!fields) return resolve(results);

            const result = new Result(
              fields.map(x => x.name),
              results.map(x => _.values(x))
            );
            resolve(result);
          });
        })
    );
  }

  async executeStmt(sql, name, binds) {
    const typeCastedBinds = this.typeCastedBinds(binds);

    return await this.log(
      { sql, name, binds, typeCastedBinds },
      () =>
        new Promise((resolve, reject) => {
          this.connection.execute(
            sql,
            typeCastedBinds,
            (err, results, fields) => {
              if (err) return reject(err);
              if (!fields) return resolve(results);

              const result = new Result(
                fields.map(x => x.name),
                results.map(x => _.values(x))
              );
              resolve(result);
            }
          );
        })
    );
  }

  async execQuery(sql, name = 'SQL', binds = [], options = {}) {
    const prepare = options.prepare || false;
    // if (this.withoutPreparedStatement(binds)) {
    // }

    // TODO: without_prepared_statement?
    const result = binds.length
      ? await this.executeStmt(sql, name, binds)
      : await this.execute(sql, name);

    return result;
  }

  lastInsertedId(result) {
    return result.insertId;
  }

  // quoting

  quoteColumnName(columnName) {
    return `\`${columnName}\``;
  }

  quoteTableName(tableName) {
    return `\`${tableName}\``;
  }

  get quotedTrue() {
    return '1';
  }

  get unquotedTrue() {
    return 1;
  }

  get quotedFalse() {
    return '0';
  }

  get unquotedFalse() {
    return 0;
  }

  // todo
  // quotedDate(value) {}
  // quotedBinary(value) {}

  async createTable(tableName, options = {}, block) {
    return await super.createTable(
      tableName,
      { ...options, options: 'ENGINE=InnoDB' },
      block
    );
  }

  createTableDefinition(...args) {
    return new Mysql2TableDefinition(...args);
  }

  async dropTable(tableName, options = {}) {
    const sql = `DROP${options.temporary ? ' TEMPORARY' : ''} TABLE${
      options.ifExists ? ' IF EXISTS' : ''
    } ${this.quoteTableName(tableName)}${
      options.force === 'cascade' ? ' CASCADE' : ''
    }`;

    return await this.execute(sql);
  }

  typeToSql(type, options = {}) {
    const limit = options.limit || null;
    const precision = options.precision || null;
    const scale = options.scope || null;
    const unsigned = options.unsigned || null;

    let sql = do {
      if (type === 'integer') {
        this.integerToSql(limit);
      } else if (type === 'text') {
        this.textToSql(limit);
      } else if (type === 'blob') {
        this.binaryToSql(limit);
      } else if (type === 'binary') {
        _.isNull(limit)
          ? 'blob'
          : limit >= 0 && limit <= 0xfff
            ? `varbinary(${limit})`
            : this.binaryToSql(limit);
      } else {
        super.typeToSql(type, options);
      }
    };

    if (options.unsigned && type !== 'primaryKey') {
      sql += ' unsigned';
    }

    return sql;
  }

  integerToSql(limit) {
    if (limit === 1) {
      return 'tinyint';
    } else if (limit === 2) {
      return 'smallint';
    } else if (_.isNull(limit) || limit === 4) {
      return 'int';
    } else if (limit >= 5 && limit <= 8) {
      return 'bigint';
    }

    throw new Error(
      `No integer type has byte size ${limit}. Use a decimal with scale 0 instead.`
    );
  }

  textToSql(limit) {
    if (_.isNull(limit)) return 'text';
    if (limit >= 0 && limit <= 0xff) return 'tinytext';
    if (limit >= 0x100 && limit <= 0xffff) return 'text';
    if (limit >= 0x10000 && limit <= 0xffffff) return 'mediumtext';
    if (limit >= 0x1000000 && limit <= 0xffffffff) return 'longtext';

    throw new Error(`No text type has byte length ${limit}`);
  }

  binaryToSql(limit) {
    if (limit >= 0 && limit <= 0xff) return 'tinyblob';
    if (limit >= 0x100 && limit <= 0xffff) return 'blob';
    if (limit >= 0x10000 && limit <= 0xffffff) return 'mediumblob';
    if (limit >= 0x1000000 && limit <= 0xffffffff) return 'longblob';

    throw new Error(`No binary type has byte length ${limit}`);
  }

  dataSourceSql(name = null, options = {}) {
    const scope = this.quotedScope(name, { type: options.type });
    let sql = 'SELECT table_name FROM information_schema.tables';
    sql += ` WHERE table_schema = ${scope.schema}`;
    if (scope.name) {
      sql += ` AND table_name = ${scope.name}`;
    }
    if (scope.type) {
      sql += ` AND table_type = ${scope.type}`;
    }
    return sql;
  }

  quotedScope(string = null, options = {}) {
    const [schema, name] = this.extractSchemaQualifiedName(string);
    const scope = {};
    scope.schema = schema ? this.quote(schema) : 'database()';
    if (name) scope.name = this.quote(name);
    if (options.type) scope.type = this.quote(options.type);
    return scope;
  }

  extractSchemaQualifiedName(string) {
    if (!string) return [null, null];
    let [schema, name] = string.match(/[^`.\s]+|`[^`]*`/g);
    if (!name) {
      name = schema;
      schema = null;
    }
    return [schema, name];
  }

  async columnDefinitions(tableName) {
    const result = await this.execute(
      `SHOW FULL FIELDS FROM ${this.quoteTableName(tableName)}`,
      'SCHEMA'
    );

    return result.hashRows;
  }

  newColumnFromField(tableName, field) {
    let _default = null;
    let _defaultFunction = null;

    const typeMetadata = this.fetchTypeMetadata(field.Type, field.Extra);

    if (
      typeMetadata.type === 'datetime' &&
      field.Default === 'CURRENT_TIMESTAMP'
    ) {
      _default = null;
      _defaultFunction = field.Default;
    } else {
      _default = field.Default;
      _defaultFunction = null;
    }

    return new Mysql2Column(
      field.Field,
      _default,
      typeMetadata,
      field.Null === 'YES',
      tableName,
      _defaultFunction,
      field.Collation,
      { comment: !_.isEmpty(field.Comment) }
    );
  }

  fetchTypeMetadata(sqlType, extra = '') {
    return new Mysql2TypeMetadata(super.fetchTypeMetadata(sqlType), { extra });
  }

  // private

  initializeTypeMap(m) {
    super.initializeTypeMap(m);

    // todo: more types
    // this.registerClassWithLimit(m, /char/i, MysqlString);

    m.registerType(/tinytext/i, new Type.Text({ limit: 2 ** 8 - 1 }));
    // m.registerType(/tinyblob/i, new Type.Binary({ limit: 2 ** 8 - 1 }));
    m.registerType(/text/i, new Type.Text({ limit: 2 ** 16 - 1 }));
    // m.registerType(/blob/i, new Type.Binary({ limit: 2 ** 16 - 1 }));
    m.registerType(/mediumtext/i, new Type.Text({ limit: 2 ** 24 - 1 }));
    // m.registerType(/mediumblob/i, new Type.Binary({ limit: 2 ** 24 - 1 }));
    m.registerType(/longtext/i, new Type.Text({ limit: 2 ** 32 - 1 }));
    // m.registerType(/longblob/i, new Type.Binary({ limit: 2 ** 32 - 1 }));
    m.registerType(/^float/i, new Type.Float({ limit: 24 }));
    m.registerType(/^double/i, new Type.Float({ limit: 53 }));
    m.registerType(/^json/i, new Type.Json());

    m.registerType(/^tinyint\(1\)/i, new Type.Boolean());
  }
}

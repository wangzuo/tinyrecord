import _ from 'lodash';
import AbstractAdapter from './AbstractAdapter';
import Result from '../Result';
import Mysql2TableDefinition from './Mysql2TableDefinition';
import Mysql2Column from './Mysql2Column';
import Mysql2TypeMetadata from './Mysql2TypeMetadata';

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
  ADAPTER_NAME = 'Mysql2';

  constructor(connection, logger, connectionOptions, config) {
    super(connection, logger, config);
    this.nativeDatabaseTypes = NATIVE_DATABASE_TYPES;
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

  async createDatabase(name, options = {}) {
    if (options.collation) {
      await this.execute(
        `CREATE DATABASE ${this.quoteTableName(
          name
        )} DEFAULT CHARACTER SET ${this.quoteTableName(
          options.charset || 'utf8'
        )} COLLATE #{quoteTableName(options.collation)}`
      );
    } else {
      await this.execute(
        `CREATE DATABASE ${this.quoteTableName(
          name
        )} DEFAULT CHARACTER SET ${this.quoteTableName(
          options.charset || 'utf8'
        )}`
      );
    }
  }

  async dropDatabase(name) {
    await this.execute(`DROP DATABASE IF EXISTS ${this.quoteTableName(name)}`);
  }

  async recreateDatabase(name, options = {}) {
    await this.dropDatabase(name);
    await this.createDatabase(name, options);
  }

  async execute(sql, name = null) {
    return await this.log(
      { sql, name },
      () =>
        new Promise((resolve, reject) => {
          this.connection.query(sql, (err, rows, fields) => {
            if (err) return reject(err);
            resolve(rows);
          });
        })
    );
  }

  async executeStmt(sql, name, binds) {
    const typeCastedBinds = this.typeCastedBinds(binds);

    return await this.log(
      { sql, name, binds },
      () =>
        new Promise((resolve, reject) => {
          this.connection.execute(sql, typeCastedBinds, (err, rows, fields) => {
            if (err) return reject(err);
            resolve(rows);
          });
        })
    );
  }

  async execQuery(sql, name = 'SQL', binds = [], options = {}) {
    const prepare = options.prepare || false;
    // if (this.withoutPreparedStatement(binds)) {
    // }

    // TODO: without_prepared_statement?
    if (!binds.length) {
      return await this.execute(sql, name);
    } else {
      return await this.executeStmt(sql, name, binds);
    }
  }

  async selectRows(arel, name = null, binds = []) {
    const sql = await this.toSql(arel, binds);
    const result = await this.execute(sql, name);
    return result.map(x => _.values(x));
  }

  quoteTableName(tableName) {
    return `\`${tableName}\``;
  }

  quoteColumnName(columnName) {
    return `\`${columnName}\``;
  }

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
    const sql = `DROP${options.temporary
      ? ' TEMPORARY'
      : ''} TABLE${options.ifExists ? ' IF EXISTS' : ''} ${this.quoteTableName(
      tableName
    )}${options.force === 'cascade' ? ' CASCADE' : ''}`;

    await this.execute(sql);
  }

  typeToSql(type, options = {}) {
    let sql = do {
      if (type === 'integer') {
        this.integerToSql(options.limit);
      } else if (type === 'text') {
        this.textToSql(options.limit);
      } else if (type === 'blob') {
        this.binaryToSql(optionslimit);
      } else if (type === 'binary') {
        // todo
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
      return 'init';
    } else if (limit >= 5 && limit <= 8) {
      return 'bigint';
    }

    throw new Errror(
      `No integer type has byte size ${limit}. Use a decimal with scale 0 instead.`
    );
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

    return result;
  }

  newColumnFromField(tableName, field) {
    let _default = null; // todo

    const typeMetadata = this.fetchTypeMetadata(field.type);
    return new Mysql2Column(
      field.Field,
      _default,
      typeMetadata,
      field.Null === 'YES',
      tableName,
      null,
      field.Collation,
      { comment: !_.isEmpty(field.Comment) }
    );
  }

  fetchTypeMetadata(sqlType, extra = '') {
    return new Mysql2TypeMetadata(super.fetchTypeMetadata(sqlType), { extra });
  }
}

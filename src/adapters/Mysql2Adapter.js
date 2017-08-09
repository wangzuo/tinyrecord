import _ from 'lodash';
import AbstractAdapter from './AbstractAdapter';
import Result from '../Result';

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
    super(connection);
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

  async execute(sql, name = null) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, (err, rows, fields) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  async execQuery(sql, name = 'SQL', binds = [], options = {}) {
    console.log('execQuery', sql, binds);

    const prepare = options.prepare || false;
    // if (this.withoutPreparedStatement(binds)) {
    // }

    return await this.execute(sql, name);
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
}

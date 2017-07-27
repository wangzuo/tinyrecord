import _ from 'lodash';
import AlterTable from './schema/AlterTable';
import SchemaCreation from './schema/SchemaCreation';
import TableDefinition from './schema/TableDefinition';
import Table from './schema/Table';
import SchemaCache from './schema/SchemaCache';
import Relation from '../Relation';
import TypeMap from '../type/TypeMap';
import * as Type from '../Type';
import SqlTypeMetadata from './SqlTypeMetadata';

export default class AbstractAdapter {
  static ADAPTER_NAME = 'Abstract';

  constructor(connection) {
    this.connection = connection;
    this.schemaCreation = new SchemaCreation(this);
    this.nativeDatabaseTypes = {};
    this.schemaCache = new SchemaCache(this);

    this.typeMap = new TypeMap();
    this.initializeTypeMap(this.typeMap);
    // todo
    this.preparedStatements = false;
  }

  initializeTypeMap(m) {
    this.registerClassWithLimit(m, /boolean/i, Type.Boolean);
    this.registerClassWithLimit(m, /char/i, Type.String);
    this.registerClassWithLimit(m, /binary/i, Type.Binary);
    this.registerClassWithLimit(m, /text/i, Type.Text);
    this.registerClassWithLimit(m, /date/i, Type.Date);
    this.registerClassWithLimit(m, /time/i, Type.Time);
    this.registerClassWithLimit(m, /datetime/i, Type.Datetime);
    this.registerClassWithLimit(m, /float/i, Type.Float);
    this.registerClassWithLimit(m, /int/i, Type.Integer);

    m.aliasType(/blob/i, 'binary');
    m.aliasType(/clob/i, 'text');
    m.aliasType(/timestamp/i, 'datetime');
    m.aliasType(/numeric/i, 'decimal');
    m.aliasType(/number/i, 'decimal');
    m.aliasType(/double/i, 'float');

    m.registerType(/decimal/i, sqlType => {
      const scale = this.extractScale(sqlType);
      const precision = this.extractPrecision(sqlType);

      if (scale === 0) {
        return new Type.DecimalWithoutScale({ precision });
      } else {
        return new Type.Decimal({ precision, scale });
      }
    });

    return m;
  }

  registerClassWithLimit(mapping, key, kclass) {
    return mapping.registerType(key, (...args) => {
      const limit = this.extractLimit(_.last(args));
      return new kclass({ limit });
    });
  }

  withoutPreparedStatement(binds) {
    return !this.preparedStatements || _.isEmpty(binds);
  }

  toSql(arel, binds = []) {
    if (arel.ast) {
      const collected = this.visitor.accept(arel.ast, this.collector);
      return collected.compile(binds, this);
    }
    return arel;
  }

  async select(sql, name = null, binds = []) {
    return await this.execQuery(sql, name, binds, { prepare: false });
  }

  async selectPrepared(sql, name = null, binds = []) {
    return await this.execQuery(sql, name, binds, { prepare: true });
  }

  async selectAll(arel, name = null, binds = [], options = {}) {
    let { preparable } = options || null;
    [arel, binds] = this.bindsFromRelation(arel, binds);
    const sql = this.toSql(arel, binds);
    if (
      !this.preparedStatements ||
      (_.isString(arel) && _.isNull(preparable))
    ) {
      preparable = false;
    } else {
      preparable = visitor.preparable;
    }

    if (this.preparedStatements && preparable) {
      return await this.selectPrepared(sql, name, binds);
    }

    return await this.select(sql, name, binds);
  }

  bindsFromRelation(relation, binds) {
    if (relation instanceof Relation && _.isEmpty(binds)) {
      relation = relation.arel;
      binds = relation.boundAttributes;
    }
    return [relation, binds];
  }

  async selectOne(arel, name = null, binds = []) {}

  async selectValue(arel, name = null, binds = []) {}

  async selectValues(arel, name = null, binds = []) {
    const result = await this.selectRows(arel, name, binds);
    return result.rows.map(row => row[0]);
  }

  async selectRows(arel, name = null, binds = []) {
    return this.selectAll(arel, name, binds);
  }

  async execute(sql, name = null) {}

  async execQuery(sql, name = 'SQL', binds = []) {
    throw new Error('Not implemented error');
  }

  dataSourceSql(name = null, options = {}) {
    throw new Error('Not implemented error');
  }

  quotedScope(name = null, options = {}) {
    throw new Error('Not implemented error');
  }

  async tables() {
    return await this.selectValues(
      this.dataSourceSql(null, { type: 'BASE TABLE' }),
      'SCHEMA'
    );
  }

  async tableExists(tableName) {
    const tables = await this.selectValues(
      this.dataSourceSql(tableName, { type: 'BASE TABLE' }),
      'SCHEMA'
    );
    return !_.isEmpty(tables);
  }

  async views() {
    return await this.selectValues(
      this.dataSourceSql(null, { type: 'VIEW' }),
      'SCHEMA'
    );
  }
  async viewExists(viewName) {
    await this.selectValues(
      this.dataSourceSql(viewName, { type: 'VIEW' }),
      'SCHEMA'
    );
  }
  async indexes() {
    throw new Error('#indexes is not implemented');
  }

  async indexExists(tableName, columnName, options = {}) {}

  async columns(tableName) {
    const columnDefinitions = await this.columnDefinitions(tableName);

    return columnDefinitions.map(field =>
      this.newColumnFromField(tableName, field)
    );
  }

  async columnExists(tableName, columnName, type = null, options = {}) {}

  primaryKey(tableName) {
    const pk = this.primaryKeys(tableName);
  }

  async createTable(tableName, options = {}, block) {
    const comment = options.comment || null;
    const td = this.createTableDefinition(
      tableName,
      options.temporary,
      options.options,
      options.as,
      { comment }
    );

    if (options.id !== false && !options.as) {
      const pk = options.primaryKey || 'id'; // todo: getPrimaryKey

      if (_.isArray(pk)) {
        td.primaryKeys(pk);
      } else {
        td.primaryKey(pk, options.id || options.primaryKey, options);
      }
    }

    if (block) block(td);

    if (options.force) {
      await this.dropTable(tableName, { ...options, ifExists: true });
    }

    const sql = this.schemaCreation.accept(td);
    await this.execute(sql);
  }

  async changeTable(tableName, options = {}) {}

  async renameTable(tableName, newName) {
    throw new Error('rename_table is not implemented');
  }

  async dropTable(tableName, options = {}) {
    const sql = `DROP TABLE${options.ifExists
      ? ' IF EXISTS'
      : ''} ${this.quoteTableName(tableName)}`;
    await this.execute(sql);
  }

  async addColumn(tableName, columnName, type, options = {}) {
    const at = this.createAlterTable(tableName);
    at.addColumn(columnName, type, options);
    const sql = this.schemaCreation.accept(at);
    await this.execute(sql);
  }

  async removeColumns(tableName, ...columnNames) {
    if (_.isEmpty(columnNames)) {
      throw new Error(
        `You must specify at least one column name. Example: remove_columns(:people, :first_name)`
      );
    }

    for (const columnName of columnNames) {
      await this.removeColumn(tableName, columnName);
    }
  }

  async removeColumn(tableName, columnName, type = null, options = {}) {
    const sql = `ALTER TABLE ${this.quoteTableName(
      tableName
    )} DROP ${this.quoteColumnName(columnName)}`;

    await this.execute(sql);
  }

  changeColumn(tableName, columnName, type, options = {}) {
    throw new Error('change_column is not implemented');
  }

  changeColumnDefault(tableName, columnName, defaultOrChanges) {}

  changeColumnNull(tableName, columnName, nil, _default = null) {
    throw new Error('changeColumnNull is not implemented');
  }

  renameColumn(tableName, columnName, newColumnName) {
    throw new Error('renameColumn is not implemented');
  }

  addIndex(tableName, columnName, options = {}) {}
  removeIndex(tableName, options = {}) {}
  renameIndex(tableName, oldName, newName) {}
  indexName(tableName, options) {}
  indexNameExists(tableName, indexName, _default = null) {}

  addReference(tableName, refName, options) {}
  removeReference(tableName, refName) {}

  async addTimestamps(tableName, options = {}) {
    options.null = options.null || false;

    await this.addColumn(tableName, 'created_at', 'datetime', options);
    await this.addColumn(tableName, 'updated_at', 'datetime', options);
  }

  async removeTimestamps(tableName, options = {}) {
    await this.removeColumn(tableName, 'updated_at');
    await this.removeColumn(tableName, 'created_at');
  }

  foreignKeys(tableName) {
    throw new Error('foreignKeys is not implemented');
  }

  addForeignKey(fromTable, toTable, options = {}) {}
  removeForeignKey(fromTable) {}
  foreignKeyExists(fromTable) {}
  foreignKeyColumnFor(tableName) {}
  foreignKeyOptions(fromTable, toTable) {}

  dumpSchemaInformatin() {}
  initializeSchemaMigrationsTable() {}
  initializeInternalMetadataTable() {}

  internalStringOptionsForPrimaryKey() {
    return { primaryKey: true };
  }
  assume_migrated_upto_version() {}

  // todo
  quote(value) {
    return `'${value}'`;
  }

  quoteTableName(tableName) {
    return `"${tableName}"`;
  }

  quoteColumnName(columnName) {
    return `"${columnName}"`;
  }

  quoteDefaultExpression() {}

  createTableDefinition(...args) {
    return new TableDefinition(...args);
  }

  createAlterTable(name) {
    return new AlterTable(this.createTableDefinition(name));
  }

  updateTableDefinition(tableName, base) {
    return new Table(tableName, base);
  }

  typeToSql(type, options = {}) {
    const native = this.nativeDatabaseTypes[type];

    if (native) {
      let columnTypeSql = native.name || native;
      const limit = options.limit || native.limit;
      const precision = options.precision || native.precision;
      const scale = options.scale || native.scale;

      if (type === 'decimal') {
        if (precision) {
          columnTypeSql += scale ? `(${precision},${scale})` : `"${precision}"`;
        } else if (scale) {
          throw new Error(
            'Error adding decimal column: precision cannot be empty if scale is specified'
          );
        }
      } else if (
        _.includes(['datetime', 'timestamp', 'time', 'interval'], type) &&
        precision
      ) {
        if (precision >= 0 && precision <= 6) {
          columnTypeSql += `(${precision})`;
        } else {
          throw new Error(
            `No ${native.name} type has precision of ${precision}. The allowed range of precision is from 0 to 6`
          );
        }
      } else if (type !== 'primaryKey' && limit) {
        columnTypeSql += `(${limit})`;
      }

      return columnTypeSql;
    }

    return type;
  }

  fetchTypeMetadata(sqlType) {
    const castType = this.lookupCastType(sqlType);

    return new SqlTypeMetadata({
      sqlType,
      type: castType.type,
      limit: castType.limit,
      precision: castType.precision,
      scale: castType.scale
    });
  }

  lookupCastTypeFromColumn(column) {
    return this.lookupCastType(column.sqlType);
  }

  lookupCastType(sqlType) {
    return this.typeMap.lookup(sqlType)();
  }
}

import _ from 'lodash';
import * as Arel from 'arel';
import Logger from './Logger';
import * as TypeCaster from './TypeCaster';
import AttributeSet, { Builder } from './AttributeSet';
import Attribute from './Attribute';
import PredicateBuilder from './relation/PredicateBuilder';
import TableMetadata from './TableMetadata';
import Relation from './Relation';
import StatementCache from './StatementCache';
import { Resolver } from './ConnectionSpecification';

// todo
const NO_DEFAULT_PROVIDED = {};

export default class Base {
  static recordTimestamps = true;
  static logger = new Logger();

  static establishConnection(config) {
    const resolver = new Resolver({});
    const spec = resolver.spec(config);
    this.connection = this[spec.adapterMethod](spec.config);
    return this.connection;
  }

  static sqlite3Connection(config) {
    if (!config.database) {
      throw new Error('No database file specified. Missing argument: database');
    }

    const { default: Sqlite3Adapter } = require('./adapters/Sqlite3Adapter');
    const sqlite3 = require('sqlite3');
    sqlite3.verbose();

    const db = new sqlite3.Database(config.database);

    // todo
    if (config.timeout) {
    }

    // logger = null
    return new Sqlite3Adapter(db, this.logger, null, config);
  }

  static mysql2Connection(config) {
    const { default: Mysql2Adapter } = require('./adapters/Mysql2Adapter');
    const mysql = require('mysql2');
    const connection = mysql.createConnection(config);
    return new Mysql2Adapter(connection, this.logger, null, config);
  }

  static get relation() {
    const relation = Relation.create(
      this,
      this.arelTable,
      this.predicateBuilder
    );

    return relation;
  }

  static async find(...ids) {
    const id = ids[0];

    // todo: this.primaryKey
    const statement = this.cachedFindByStatement('id', params =>
      this.where({ id: params.bind() }).limit(1)
    );

    const records = await statement.execute([id], this, this.connection);
    const record = records[0];

    if (!record) {
      throw new Error(`Couldn't find with 'id' = ${id}`);
    }

    return record;
  }

  // todo
  static cachedFindByStatement(key, block) {
    return StatementCache.create(this.connection, block);
  }

  static get arelTable() {
    if (!this._arelTable) {
      this._arelTable = new Arel.Table(this.tableName, {
        typeCaster: this.typeCaster
      });
    }
    return this._arelTable;
  }

  static get typeCaster() {
    return new TypeCaster.Map(this);
  }

  static get predicateBuilder() {
    if (!this._predicateBuilder) {
      this._predicateBuilder = new PredicateBuilder(this.tableMetadata);
    }
    return this._predicateBuilder;
  }

  static get tableMetadata() {
    return new TableMetadata(this, this.arelTable);
  }

  static arelAttribute(name, table) {
    table = table || this.arelTable;
    return table.column(name);
  }

  static get tableName() {
    if (!this._tableName) {
      return this.resetTableName();
    }
    return this._tableName;
  }

  static set tableName(value) {
    this._tableName = value;
    // this._quotedTableName = null;
    // this.arelTable = null;
    // this.sequenceName = null;
    // this.predicateBuilder = null;
  }

  static get quotedTableName() {
    if (this._quotedTableName) return this._quotedTableName;
    return this.connection.quotedTableName(this.tableName);
  }

  static resetTableName() {
    return this.computeTableName();
  }

  static fullTableNamePrefix() {}

  static fullTableNameSuffix() {}

  get inheritanceColumn() {}
  set inheritanceColumn(value) {
    return value;
  }

  get sequenceName() {}
  resetSequenceName() {}
  set sequenceName(value) {
    return value;
  }

  prefetchPrimaryKey() {}
  nextSequenceValue() {}

  static async tableExists() {
    return await this.connection.schemaCache.dataSourceExists(this.tableName);
  }

  static async attributesBuilder() {
    if (!this._attributesBuilder) {
      const attributeTypes = await this.attributeTypes();
      const columnsHash = await this.columnsHash();

      this._attributesBuilder = new Builder(
        attributeTypes,
        this.primaryKey,
        name => {
          if (!columnsHash[name]) {
            return this._defaultAttributes(name);
          }
        }
      );
    }

    return this._attributesBuilder;
  }

  static async columnsHash() {
    await this.loadSchema();
    return this._columnsHash;
  }

  static async columns() {
    await this.loadSchema();
    if (!this._columns) {
      this._columns = _.values(await this.columnsHash());
    }
    return this._columns;
  }

  static async attributeTypes() {
    if (!this._attributeTypes) {
      this._attributeTypes = {}; // todo
      await this.loadSchema();
    }

    return this._attributeTypes;
  }

  async yamlEncoder() {}

  static async typeForAttribute(attrName, block) {
    const attributeTypes = await this.attributeTypes();
    if (block) return block(attributeTypes[attrName]);
    return attributeTypes[attrName];
  }

  static async loadSchema() {
    if (this._schemaLoaded) return;
    await this.loadSchema_();
    this._schemaLoaded = true;
  }

  static async loadSchema_() {
    this._columnsHash = await this.connection.schemaCache.columnsHash(
      this.tableName
    );

    _.forEach(this._columnsHash, (column, name) => {
      this.defineAttribute(
        name,
        this.connection.lookupCastTypeFromColumn(column),
        {
          default: column.default,
          userProvidedDefault: false
        }
      );
    });

    // attribute decorator
    _.forEach(await this.attributeTypes(), (type, name) => {
      this.defineAttribute(name, type);
    });
  }

  static computeTableName() {
    return pluralize(this.name).toLowerCase();
  }

  static attribute(name, castType, ...args) {
    castType = castType || new Value();
    this.reloadSchemaFromCache();
  }

  static defineAttribute(name, castType, options = {}) {
    options = Object.assign(
      { default: NO_DEFAULT_PROVIDED, userProvidedDefault: true },
      options
    );

    if (!this._attributeTypes) this._attributeTypes = {};
    this._attributeTypes[name] = castType;

    this.defineDefaultAttribute(name, options.default, castType, {
      fromUser: options.userProvidedDefault
    });
  }

  static defineDefaultAttribute(name, value, type, { fromUser }) {
    let defineAttribute;

    if (value == NO_DEFAULT_PROVIDED) {
      defineAttribute = this._defaultAttributes.get(name).withType(type);
    } else if (fromUser) {
    } else {
      defineAttribute = Attribute.fromDatabase(name, value, type);
    }

    this._defaultAttributes.set(name, defineAttribute);
  }

  static get _defaultAttributes() {
    if (!this.__defaultAttributes) {
      this.__defaultAttributes = new AttributeSet({});
    }
    return this.__defaultAttributes;
  }

  static async new(attributes, block) {
    await this.loadSchema();

    await this.defineAttributeMethods();

    const object = new this();
    object.attributes = _.cloneDeep(this._defaultAttributes);

    object.initInternals();
    object.initializeInternalsCallback();

    if (attributes) {
      object.assignAttributes(attributes);
    }

    if (block) block(object);

    // object._runInitializeCallbacks();

    return object;
  }

  initInternals() {
    this.readonly = false;
    this.destroyed = false;
    this.markedForDestruction = false;
    this.destroyedByAssociation = null;
    this._newRecord = true;
    this._startTransactionState = {};
    this.transactionState = null;
  }

  initializeInternalsCallback() {}

  assignAttributes(attributes) {
    Object.assign(this, attributes);
  }

  static async create(attributes = null, block) {
    if (_.isArray(attributes)) {
      // create multiple
    } else {
      const obj = await this.new(attributes, block);
      await obj.save();
      return obj;
    }
  }

  static async create_(attributeNames = null, block) {}

  static allocate() {
    return new this();
  }

  static async instantiate(attributes, columnTypes = {}, block) {
    await this.defineAttributeMethods();

    const klass = this;
    const attributesBuilder = await klass.attributesBuilder();
    attributes = attributesBuilder.buildFromDatabase(attributes, columnTypes);
    const object = new this();
    return object.initWith({ attributes, newRecord: false }, block);
  }

  initWith(coder) {
    this.attributes = coder.attributes;
    return this;
  }

  newRecord() {
    return this._newRecord;
  }

  isDestroyed() {}

  isPersisted() {}

  async save(args, block) {
    // dirty

    // validations

    return await this.createOrUpdate(args, block);
  }

  async delete() {}
  async destroy() {}
  async becomes() {}

  async updateAttribute(name, value) {}

  async update(attributes) {
    this.assignAttributes(attributes);
    return await this.save();
  }

  // alias
  async updateAttributes(...args) {
    return this.update(...args);
  }

  async updateColumn(name, value) {
    return this.updateColumns({ [name]: value });
  }

  async updateColumns(attributes) {}

  increment(attribute, by = 1) {
    this[attribute] = this[attribute] || 0;
    this[attribute] += by;
    return this;
  }

  decrement(attribute, by = 1) {
    return this.increment(attribute, -by);
  }

  toggle(attribute) {}

  async reload(options = null) {}
  async touch(...args) {}

  // private

  destroyAssociations() {}
  destroyRow() {}
  relationForDestroy() {}

  async createOrUpdate(args, block) {
    // run save callbacks
    await this._runSaveCallbacks();

    const result = this.newRecord()
      ? await this._createRecord(block)
      : await this._updateRecord(args, block);
    return result !== false;
  }

  async _updateRecord(attributeNames, block) {
    // todo: timestamps

    attributeNames = attributeNames || (await this.attributeNames());
    const attributesValues = this.arelAttributesWithValuesForUpdate(
      attributeNames
    );
    const rowsAffected = await this.constructor
      .unscoped()
      ._updateRecord(attributesValues, this.id, this.idInDatabase);
    // if (block) block(this);
    // return rowsAffected;
  }

  async _createRecord(attributeNames, block) {
    // todo: timestamps
    if (this.constructor.recordTimestamps) {
      const currentTime = new Date();
      ['createdAt', 'updatedAt'].forEach(column => {
        this[column] = currentTime;
      });
    }

    attributeNames = attributeNames || (await this.attributeNames());
    const attributesValues = this.arelAttributesWithValuesForCreate(
      attributeNames
    );

    const newId = await this.constructor.unscoped().insert(attributesValues);

    // if (this.contructor.primarykey) {
    this.id = this.id || newId;
    // }

    this._newRecord = false;

    if (block) block(this);

    return this.id;
  }

  verifyReadonlyAttribute(name) {}

  _raiseRecordNotDestroyed() {}

  belongsToTouchMethod() {
    return 'touch';
  }

  _raiseReadonlyRecordError() {}

  // callbacks

  static beforeSave() {}

  async _runSaveCallbacks() {}

  async _runCreateCallbacks() {}

  async _runUpdateCallbacks() {}

  // TODO
  // attribute methods

  static async defineAttributeMethods() {
    if (this._attributeMethodsGenerated) return false;

    const attributeNames = await this.attributeNames();
    for (const attrName of attributeNames) {
      this.defineAttributeMethod(attrName);
    }

    this._attributeMethodsGenerated = true;
  }

  static defineAttributeMethod(attrName) {
    this.defineMethodAttribute(attrName);
  }

  static defineMethodAttribute(attrName) {
    Object.defineProperty(this.prototype, attrName, {
      get() {
        // console.log('get', attrName);
        return this.attributes.fetchValue(attrName);
      },
      set(value) {
        // todo
        // console.log('set', attrName, value);
        this.attributes.writeFromUser(attrName, value);
      }
    });
  }

  static undefineAttributeMethods() {}
  static instanceMethodAlreadyImplemented(methodName) {}
  static dangerousAttributeMethod(name) {}
  static methodDefinedWithin() {}
  static dangerousClassMethod(methodName) {}

  static attributeMethod(attribute) {
    // super() || (this.tableExists() && this.columnNames.)
  }

  static async attributeNames() {
    if (!this._attributeNames) {
      this._attributeNames =
        !this.abstractClass() && (await this.tableExists())
          ? _.keys(await this.attributeTypes())
          : [];
    }

    return this._attributeNames;
  }

  async attributeNames() {
    return await this.constructor.attributeNames();
  }

  static hasAttribute(attrName) {
    // this.attributeTypes;
  }

  static columnForAttribute(name) {
    // this.columnsHash
  }

  respondTo(name) {}
  hasAttribute(attrName) {}
  attributes() {}
  attributeForInspect(attrName) {}
  attributePresent(attribute) {}

  arelAttributesWithValuesForCreate(attributeNames) {
    return this.arelAttributesWithValues(
      this.attributesForCreate(attributeNames)
    );
  }

  arelAttributesWithValuesForUpdate(attributeNames) {
    return this.arelAttributesWithValues(
      this.attributesForUpdate(attributeNames)
    );
  }

  arelAttributesWithValues(attributeNames) {
    const attrs = new Map();
    const arelTable = this.constructor.arelTable;

    attributeNames.forEach(name => {
      attrs.set(arelTable.column(name), this.typecastedAttributeValue(name));
    });

    return attrs;
  }

  attributesForCreate(attributeNames) {
    return attributeNames;
  }

  attributesForUpdate(attributeNames) {
    return attributeNames;
  }

  typecastedAttributeValue(name) {
    return this._readAttribute(name);
  }

  _readAttribute(name) {
    return this[name];
  }

  static abstractClass() {
    return false;
  }

  // sanitization

  static sanitizeSqlForConditions(condition) {
    return condition;
  }

  static sanitizeSqlForAssignment() {}
  static sanitizeSqlForOrder() {}

  static sanitizeSql(...args) {
    return this.sanitizeSqlForConditions(...args);
  }

  static expandHashConditionsForAggregates() {}
  static sanitizeSqlHashForAssignment() {}
  static sanitizeSqlLike() {}
  static sanitizeSqlArray() {}
  static replaceBindVariables() {}
  static replaceBindVariable() {}
  static replaceNamedBindVariables() {}
  static quoteBoundValue() {}
  static raiseIfBindArityMismatch() {}

  // quering

  static async findBySql(sql, binds = [], options = {}, block) {
    const preparable = options.preparable || null;
    const resultSet = await this.connection.selectAll(
      this.sanitizeSql(sql),
      'Load',
      binds,
      { preparable }
    );
    const columnTypes = _.clone(resultSet.columnTypes);

    const records = [];
    for (const record of resultSet.hashRows) {
      records.push(await this.instantiate(record, columnTypes, block));
    }

    return records;
  }

  static where(...args) {
    return this.all.where(...args);
  }

  static order(...args) {
    return this.all.order(...args);
  }

  // scoping

  static get all() {
    // TODO: getter?
    if (this.currentScope) {
      return this.currentScope.clone();
    }

    return this.defaultScoped;
  }

  static get defaultScoped() {
    const scope = this.relation;
    return scope;
  }

  // todo
  static buildDefaultScope() {}

  static defaultExtensions() {}

  static scope(name, body, block) {}

  static validScopeName(name) {}

  static unscoped(block) {
    if (block) {
      return this.relation.scoping(block());
    }
    return this.relation;
  }
}

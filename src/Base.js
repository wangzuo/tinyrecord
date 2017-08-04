import _ from 'lodash';
import * as Arel from 'arel';
import Sqlite3Adapter from './adapters/Sqlite3Adapter';
import Mysql2Adapter from './adapters/Mysql2Adapter';
import * as TypeCaster from './TypeCaster';
import AttributeSet from './AttributeSet';
import Attribute from './Attribute';
import PredicateBuilder from './relation/PredicateBuilder';
import TableMetadata from './TableMetadata';
import Relation from './Relation';

// todo
const NO_DEFAULT_PROVIDED = {};

export default class Base {
  static establishConnection(config) {
    this.connection = new Sqlite3Adapter();
    // this.connection = new Mysql2Adapter();
    return this.connection;
  }

  static get relation() {
    const relation = Relation.create(
      this,
      this.arelTable,
      this.predicateBuilder
    );

    return relation;
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

    this.defineAttributeMethods();

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
    this.newRecord = true;
    this._startTransactionState = {};
    this.transactionState = null;
  }

  initializeInternalsCallback() {}

  assignAttributes(attributes) {
    _.forEach(attributes, (v, k) => {
      this[k] = v; // todo
    });
  }

  static arelAttribute(name, table) {}

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

  static async instantiate(attributes, columnTypes = {}, block) {
    const klass = this;
    const attributesBuilder = await klass.attributesBuilder();
    attributes = attributesBuilder.buildFromDatabase(attributes, columnTypes);
    return klass.allocate().initWith({ attributes, newRecord: false }, block);
  }

  isNewRecord() {
    return true;
  }

  isDestroyed() {}

  isPersisted() {}

  async save(args, block) {
    try {
      return this.createOrUpdate(args, block);
    } catch (e) {
      // todo: error
      return false;
    }
  }

  async delete() {}
  async destroy() {}
  async becomes() {}

  async updateAttribute(name, value) {}

  async update(attributes) {}

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
    const result = this.isNewRecord()
      ? await this._createRecord(block)
      : await this._updateRecord(args, block);
    return result !== false;
  }

  async _updateRecord(attributeNames, block) {
    attributeNames = attributeNames || (await this.attributeNames());

    const rowsAffected = 0;

    if (block) block(this);

    return rowsAffected;
  }

  async _createRecord(attributeNames, block) {
    attributeNames = attributeNames || (await this.attributeNames());
    const attributesValues = this.arelAttributesWithValuesForCreate(
      attributeNames
    );

    const newId = await this.constructor.unscoped().insert(attributesValues);

    // if (this.contructor.primarykey) {
    this.id = this.id || newId;
    // }

    this.newRecord = false;

    if (block) block(this);

    return this.id;
  }

  verifyReadonlyAttribute(name) {}

  _raiseRecordNotDestroyed() {}

  belongsToTouchMethod() {
    return 'touch';
  }

  _raiseReadonlyRecordError() {}

  static defineAttributeMethods() {
    if (this._attributeMethodsGenerated) return false;
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

  typecastedAttributeValue(name) {
    return this._readAttribute(name);
  }

  _readAttribute(name) {
    return this[name];
  }

  static abstractClass() {
    return false;
  }

  // scoping

  static unscoped(block) {
    if (block) {
      return this.relation.scoping(block());
    }
    return this.relation;
  }
}

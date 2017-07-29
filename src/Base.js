import _ from 'lodash';
import * as Arel from 'arel';
import Sqlite3Adapter from './adapters/Sqlite3Adapter';
import Mysql2Adapter from './adapters/Mysql2Adapter';
import * as TypeCaster from './TypeCaster';
import AttributeSet from './AttributeSet';
import Attribute from './Attribute';
import PredicateBuilder from './relation/PredicateBuilder';
import TableMetadata from './TableMetadata';

// todo
const NO_DEFAULT_PROVIDED = 'NO_DEFAULT_PROVIDED';

export default class Base {
  static establishConnection(config) {
    this.connection = new Sqlite3Adapter();
    // this.connection = new Mysql2Adapter();
    return this.connection;
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

  static async loadSchema() {
    if (this._schemaLoaded) return;

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

    this._schemaLoaded = true;
  }

  static attribute(name, castType, ...args) {
    castType = castType || new Value();
    this.reloadSchemaFromCache();
  }

  static defineAttribute(name, castType, options = {}) {
    // const _default =

    if (!this._attributeTypes) this._attributeTypes = {};

    this._attributeTypes[name] = castType;
    this.defineDefaultAttribute(
      name,
      options.default || NO_DEFAULT_PROVIDED,
      castType,
      {
        fromUser: options.userProvidedDefault || true
      }
    );
  }

  static defineDefaultAttribute(name, value, type, { fromUser }) {
    let defineAttribute = Attribute.fromDatabase(name, value, type);
    // if (value === NO_DEFAULT_PROVIDED) {
    // } else if (fromUser) {
    // } else {
    // }

    this._defaultAttributes().set(name, defineAttribute);
  }

  static _defaultAttributes() {
    if (!this.__defaultAttributes) {
      this.__defaultAttributes = new AttributeSet({});
    }
    return this.__defaultAttributes;
  }

  static async new(attributes, block) {
    await this.loadSchema();

    const object = new this();
    object.attributes = this.defaultAttributes;

    if (attributes) {
      object.assignAttributes(attributes);
    }

    if (block) block(object);

    return object;
  }

  assignAttributes(attributes) {
    _.forEach(attributes, (v, k) => {
      this[k] = v; // todo
    });
  }

  static arelAttribute(name, table) {}

  static async create(attributes = null, block) {
    if (_.isArray(attributes)) {
      const objects = [];
      for (const attr of attributes) {
        objects.push(await this.new(attr, block));
      }
    } else {
      const object = await this.new(attributes, block);
      await object.save();
      return object;
    }
  }

  async save() {
    await this.createOrUpdate();
  }

  async update() {}

  async delete() {}

  async destroy() {}

  async createOrUpdate() {
    await this._createRecord();
  }

  async _createRecord() {}
}

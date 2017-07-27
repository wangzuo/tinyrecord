import _ from 'lodash';
import * as Arel from 'arel';
import QueryAttribute from './relation/QueryAttribute';

export const MULTI_VALUE_METHODS = [
  'includes',
  'eagerLoad',
  'preload',
  'select',
  'group',
  'order',
  'joins',
  'leftOuterJoins',
  'references',
  'extending',
  'unscope'
];

export const SINGLE_VALUE_METHODS = [
  'limit',
  'offset',
  'lock',
  'readonly',
  'reordering',
  'reverseOrder',
  'distinct',
  'create_with'
];

export const CLAUSE_METHODS = ['where', 'having', 'from'];

export const INVALID_METHODS_FOR_DELETE_ALL = [
  'limit',
  'distinct',
  'offset',
  'group',
  'having'
];

export const VALUE_METHODS = [
  ...MULTI_VALUE_METHODS,
  ...SINGLE_VALUE_METHODS,
  ...CLAUSE_METHODS
];

export const ONE_AS_ONE = '1 AS one';

export default class Relation {
  // todo: delegation
  static create(klass, ...args) {
    return new klass.Relation(klass, ...args);
  }

  constructor(klass, table, predicateBuilder, values = {}) {
    this.klass = klass;
    this.table = table;
    this.values = values;
    this.offsets = {};
    this.loaded = false;
    this.predicateBuilder = predicateBuilder;

    // extend(this, FinderMethods);
    // extend(this, Calculations);
    // extend(this, SpawnMethods);
    // extend(this, Batches);
    // extend(this, Explain);

    // todo
    // extend(this, Delegation);
    // delegation delgate
    this.tableName = this.klass.tableName;
    // this.quotedTableName = this.klass.quotedTableName.bind(this.klass);
    // this.primaryKey = this.klass.primaryKey;
    // this.quotedPrimaryKey = this.klass.quotedPrimaryKey.bind(this.klass);
    // this.columnsHash = this.klass.columnsHash;
    this.connection = this.klass.connection;
    // this.ast = this.arel.ast;
    // this.locked = this.are.locked;
  }

  // todo: spawnmethod
  clone() {}

  async insert(values) {
    let primaryKeyValue = null;

    // if(this.primaryKey && isObject(values)) {
    //   primaryKeyValue = values
    // }

    const im = this.arel.createInsert();
    im.into(this.table);

    const [substitutes, binds] = await this.substituteValues(values);

    im.insert(substitutes);

    return await this.klass.connection.insert(
      im,
      'SQL',
      false,
      null,
      null,
      binds
    );
  }

  async _updateRecord(values, id, idWas) {
    const [substitutes, binds] = await this.substituteValues(values);
    const scope = this.klass.unscoped;

    // const relation =scope.where(this.k)

    return this.klass.connection.update(um, 'SQL', bvs);
  }

  async substituteValues(values) {
    const binds = [];
    const substitutes = [];

    for (const [arelAttr, value] of values) {
      binds.push(
        new QueryAttribute(
          arelAttr.name,
          value,
          await this.klass.typeForAttribute(arelAttr.name)
        )
      );
      substitutes.push([arelAttr, new Arel.nodes.BindParam()]);
    }

    return [substitutes, binds];
  }

  arelAttribute(name) {
    return this.klass.arelAttribute(name, this.table);
  }

  new(...args) {
    return scoping(() => this.klass.new(...args));
  }

  // alias
  builds(...args) {
    return this.new(...args);
  }

  create(...args) {}
  create_(...args) {}

  firstOrCreate(attributes = null, block) {}
  firstOrCreate_(attributes = null, block) {}

  firstOrInitialize(attributes = null, block) {}

  findOrCreateBy() {}
  findOrCreateBy_() {}

  findOrInitializeBy() {}

  explain() {
    this.execExplain();
  }

  async toArray() {
    return await this.records();
  }

  async records() {
    await this.load();
    return this._records;
  }

  encodeWith(coder) {}

  async size() {
    if (this.loaded) return this._records.length;
    return await this.count('all');
  }

  async empty() {
    // if(this.loaded) {
    //   return isEmpty(this._records)
    // }
    // return !(await this.exists_());
  }

  async none() {}

  async any() {}
  async one() {}
  async many() {}

  cacheKey(timestampColumn = 'updated_at') {
    // this.cacheKeys = this.cacheKeys || {};
    // this.cacheKeys[timestampColumn] = this.cacheKeys[timestampColumn] ||
  }

  scoping(block) {
    const previous = this.klass.currentScope;
    this.klass.currentScope = this;
    // this.klass.currentScope = previous
    return block();
  }

  async updateAll(updates) {
    if (isEmpty(updates)) {
      throw new Error('Empty list of attributes to change');
    }

    const stmt = new Arel.UpdateManager();
    stmt.set(Arel.sql(this.klass.sanitize_sql_for_assignment(updates)));
    stmt.table(this.table);

    if (this.hasJoinValues()) {
      this.klass.connection.joinToUpdate(
        stmt,
        arel,
        this.arelAttribute(this.primaryKey)
      );
    } else {
      stmt.key = this.arelAttribute(this.primaryKey);
      stmt.take(this.arel.limit);
      stmt.order(...this.arel.orders);
      stmt.wheres = this.arel.constraints;
    }

    return this.klass.connection.update(stmt, 'SQL', bound_attributes);
  }

  async update(id = 'all', attributes) {
    if (isArray(id)) {
      // return id.map
    } else if (id === 'all') {
      this.records.forEach(record => record.update(attributes));
    } else {
    }
  }

  async destroyAll() {
    this.records.forEach(x => x.destroy());
    this.reset();
  }

  async destroy(id) {
    if (idArray(id)) {
      return id.map(oneId => this.destroy(oneId));
    }

    return this.find(id).destroy();
  }

  async deleteAll() {
    const stmt = new Arel.DeleteManager();
    stmt.from(table);

    if (this.hasJoinValues()) {
      this.klass.connection.joinToDelete(
        stmt,
        this.arel,
        this.arelAttribute(primaryKey)
      );
    } else {
      stmt.wheres = this.arel.constraints;
    }

    const affected = this.klass.connection.delete(stmt, 'SQL', boundAttributes);

    this.reset();
    return affected;
  }

  async delete(idOrArray) {
    this.where({ primaryKey: idOrArray }).deleteAll();
  }

  async load(block) {
    if (!this.loaded) {
      // todo
      // resolve whereClause.binds type
      for (let i = 0, l = this.whereClause.binds.length; i < l; i++) {
        const type = this.whereClause.binds[i].type;
        this.whereClause.binds[i].type = await type;
      }

      await this.execQueries(block);
    }

    return this;
  }

  async reload() {
    this.reset();
    await this.load();
  }

  reset() {
    this.last = null;
    this._toSql = null;
    this.orderClause = null;
    this.scopeForCreate = null;
    this.arel = null;
    this.loaded = null;
    this.shouldEagerLoad = null;
    this.joinDependency = null;
    this.records = [];
    this.offsets = {};
    return this;
  }

  async toSql() {
    if (!this._toSql) {
      const relation = this;
      const conn = this.klass.connection;
      this._toSql = await conn.toSql(relation.arel, relation.boundAttributes);
    }

    return this._toSql;
  }

  whereValuesHash(relationTableName) {
    return this.whereClause.toH(relationTableName || this.tableName);
  }

  get scopeForCreate() {
    if (!this._scopeForCreate) {
      this._scopeForCreate = this.whereValuesHash.merge(this.createWithValue);
    }

    return this._scopeForCreate;
  }

  async needsEagerLoading() {}

  // private

  hasJoinValues() {
    // !this.joinsValues.empty
    return false;
  }

  async execQueries(block) {
    this._records = await this.klass.findBySql(
      this.arel,
      this.boundAttributes,
      block
    );

    // this.records = this.needsEagerLoading()
    //   ? this.findWithAssociation
    //   : this.klass.findBySql(this.arel, this.bindAttributes, block);

    this._loaded = true;
    return this._records;
  }

  buildPreloader() {
    return new Preloader();
  }

  references_eager_loaded_tables() {}

  isTablesInString(string) {
    if (!string) return [];

    return [];
  }

  find(...args) {}
  findBy(arg, ...args) {}
  take(limit = null) {}
  first(limit = null) {}
  last(limit = null) {}
  second() {}
  third() {}
  fourth() {}
  fifth() {}
  forthTwo() {}
  thirdToLast() {}
  secondToLast() {}
  exists(conditions = 'none') {}
  raiseRecordNotFoundException() {}
  offsetIndex() {}
  findWithAssocations() {}
  constructRelationForExists() {}
  constructJoinDependency() {}
  constructRelationForAssociationCalculations() {}
  applyJoinDependency(relation, joinDependency) {}
  limitedIdsFor(relation) {}
  usingLimitableReflections() {}
  findWithIds(...ids) {}
  findOne(id) {}
  findSome(ids) {}
  findSomeOrdered(ids) {}
  findTake() {}
  findTakeWithLimit(limit) {}
  findNth(index) {}
  findNthWithLimit() {}
  findNthFromLast() {}
  findLast(limit) {}
}

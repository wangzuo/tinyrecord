import _ from 'lodash';
import * as Arel from 'arel';
import QueryAttribute from './relation/QueryAttribute';
import WhereClause from './relation/WhereClause';
import FromClause from './relation/FromClause';
import WhereClauseFactory from './relation/WhereClauseFactory';

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
  'createWith'
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

    VALUE_METHODS.forEach(name => {
      const methodName = _.includes(MULTI_VALUE_METHODS, name)
        ? `${name}Values`
        : _.includes(SINGLE_VALUE_METHODS, name)
          ? `${name}Value`
          : _.includes(CLAUSE_METHODS, name) ? `${name}Clause` : '';

      if (methodName) {
        Object.defineProperty(this, methodName, {
          get() {
            return this.getValue(name);
          },
          set(value) {
            this.setValue(name, value);
          }
        });
      }
    });
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
    if (_.isEmpty(updates)) {
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

  toSql() {
    if (!this._toSql) {
      const relation = this;
      const conn = this.klass.connection;
      this._toSql = conn.toSql(relation.arel, relation.boundAttributes);
    }

    return this._toSql;
  }

  whereValuesJSON(relationTableName) {
    return this.whereClause.toJSON(relationTableName || this.tableName);
  }

  get scopeForCreate() {
    if (!this._scopeForCreate) {
      this._scopeForCreate = _.merge(
        this.whereValuesJSON(),
        this.createWithValue
      );
    }

    return this._scopeForCreate;
  }

  // todo

  eagerLoading() {
    if (!this._shouldEagerLoad) {
      this._shouldEagerLoad =
        !_.isEmpty(this.eagerLoadValues) ||
        (!_.isEmpty(this.includesValues) &&
          (!_.isEmpty(this.joinedIncludesValues) ||
            this.referencesEagerLoaded_Tables));
    }
    return this._shouldEagerLoad;
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

  get boundAttributes() {
    // todo: limit

    // todo: offset

    return this.connection.combineBindParameters({
      // fromClause: this.fromClause.binds,
      // joinClause: this.arel.bind_values,
      whereClause: this.whereClause.binds
      // havingClause: this.havingClause.binds,
      // limit: this.limitBind,
      // offset: this.offsetBind
    });
  }

  includes(...args) {}
  includes_(...args) {}

  eagerLoad() {}
  eagerLoad_() {}

  preload() {}
  preload_() {}

  references(...tableNames) {
    return this.references_(...tableNames);
  }
  references_(...tableNames) {
    tableNames = _.flatten(tableNames);
    this.referencesValues = _.uniq([...this.referencesValues, ...tableNames]);
    return this;
  }

  select(...fields) {}
  _select_(...fields) {}

  group(...args) {}
  group_(...args) {}

  order(...args) {}
  order_(...args) {}

  reorder(...args) {}
  reorder_(...args) {}

  unscope(...args) {}
  unscope_(...args) {}

  joins(...args) {}
  joins_(...args) {}

  leftOuterJoins(...args) {}
  leftOuterJoins_(...args) {}

  // alias
  leftJoins(...args) {
    return this.leftOuterJoins(...args);
  }

  where(opts = 'chain', ...rest) {
    if (opts === 'chain') {
      return new WhereChain();
    } else if (_.isEmpty(opts)) {
      return this;
    }

    return this.where_(opts, ...rest);
  }

  where_(opts, ...rest) {
    this.whereClause = this.whereClause.add(
      this.whereClauseFactory.build(opts, rest)
    );
    return this;
  }

  rewhere(conditions) {
    this.unscope({ where: _.keys(conditions) }).where(conditions);
  }

  or(other) {
    if (!other instanceof Relation) {
      throw new Error(
        `You have passed ${other.constructor
          .name} object to #or. Pass an ActiveRecord::Relation object instead.`
      );
    }

    return this.spawn.oR(other);
  }

  or_(other) {}

  having() {}
  having_() {}

  limit() {}
  limit_() {}

  offset() {}
  offset_() {}

  lock(locks = true) {
    return this.spawn.locK(locks);
  }

  lock_(locks = true) {}

  none() {}
  none_() {}

  readonly(value = true) {}
  readonly_(value = true) {}

  createWith(value) {}
  createWith_(value) {
    if (value) {
      value = this.sanitize_forbidden_attributes(value);
      this.createWithValue = _.merge(this.createWithValue, value);
    } else {
      this.createWithValue = {};
    }

    return this;
  }

  from(value, subqueryName = null) {
    return this.from_(value, subqueryName);
  }

  from_(value, subqueryName = null) {
    this.fromClause = new FromClause(value, subqueryName);
    return this;
  }

  distinct(value = true) {}
  distinct_(value = true) {
    this.distinctValue = value;
    return this;
  }

  extending() {
    return this;
  }

  extending_() {}

  reverseOrder() {}
  reverseOrder_() {}

  get arel() {
    if (!this._arel) {
      this._arel = this.buildArel();
    }
    return this._arel;
  }

  getValue(name) {
    return this.values[name] || this.defaultValueFor(name);
  }

  setValue(name, value) {
    // assert_mutability!
    this.values[name] = value;
  }

  // private

  // assert_mutability!() {}

  buildArel() {
    const arel = new Arel.SelectManager(this.table);

    // if (!isEmpty(this.joinsValues)) {
    //   this.buildJoin(arel, flatten(this.joinsValues));
    // }

    if (!this.whereClause.empty()) {
      arel.where(this.whereClause.ast);
    }

    this.buildOrder(arel);
    this.buildSelect(arel);

    arel.distinct(this.distinctValue);

    // if (!_.isEmpty(this.fromClause)) {
    //   arel.from(this.buildFrom);
    // }

    // if (this.lockValue) {
    //   arel.lock(this.lockValue);
    // }

    return arel;
  }

  buildFrom() {
    const opts = this.fromClause.value;
    let name = this.fromClause.name;

    if (opts instanceof Relation) {
      name = name || 'subquery';
      opts.arel.as(name);
    }

    return opts;
  }

  buildLeftOuterJoins(manager, outerJoins) {
    const buckets = _.groupBy(outerJoins, join => {});

    return this.buildJoinQuery(manager, buckets, new Arel.nodes.OuterJoin());
  }

  buildJoins() {}

  buildJoinQuery(manager, buckets, joinType) {}

  convertJoinStringsToAst(table, joins) {}

  buildSelect(arel) {
    if (_.isEmpty(this.selectValues)) {
      arel.project(this.klass.arelTable.column(Arel.star()));
    } else {
      arel.project(...this.arelColumns(_.uniq(this.selectValues)));
    }
  }

  arelColumns(columns) {
    return columns.map(field => {
      return field;
    });
  }

  reverseSqlOrder(orderQuery) {}

  doesNotSupportReverse_(order): boolean {}

  buildOrder(arel) {
    const orders = _(this.orderValues).uniq().filter(x => !x);

    if (!_.isEmpty(orders)) {
      arel.order(...orders);
    }
  }

  validateOrderArgs(args) {}
  preprocessOrderArgs(args) {}

  checkIfMethodHasArguments_(methodName, args) {}
  structurallyIncompatibleValuesForOr(other) {}

  get whereClauseFactory() {
    if (!this._whereClauseFactory) {
      this._whereClauseFactory = new WhereClauseFactory(
        this.klass,
        this.predicateBuilder
      );
    }

    return this._whereClauseFactory;
  }

  // alias
  get havingClauseFactory() {
    return this.whereClauseFactory;
  }

  defaultValueFor(name) {
    if (name === 'createWith') {
      return {};
    } else if (name === 'readonly') {
      return false;
    } else if (name === 'where' || name === 'having') {
      return WhereClause.empty;
    } else if (name === 'from') {
      return FromClause.empty;
    } else if (_.includes(MULTI_VALUE_METHODS, name)) {
      return [];
    } else if (_.includes(SINGLE_VALUE_METHODS, name)) {
      return null;
    }

    throw new Error(`unknown relation value ${name}`);
  }
}

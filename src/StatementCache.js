import _ from 'lodash';
import * as Arel from 'arel';

class Substitute {}

class Query {
  constructor(sql) {
    this.sql = sql;
  }

  sqlFor(binds, connection) {
    return this.sql;
  }
}

class PartialQuery extends Query {
  constructor(values) {
    super();
    this.values = values;
    // this.indexes =
  }

  sqlFor(binds, connection) {}
}

class Params {
  bind() {
    return new Substitute();
  }
}

class BindMap {
  constructor(boundAttributes) {
    this.indexes = [];
    this.boundAttributes = boundAttributes;

    boundAttributes.forEach((attr, i) => {
      if (attr.value instanceof Substitute) {
        this.indexes.push(i);
      }
    });
  }

  bind(values) {
    const bas = _.clone(this.boundAttributes);
    this.indexes.forEach((offset, i) => {
      bas[offset] = bas[offset].withCastValue(values[i]);
    });
    return bas;
  }
}

export default class StatementCache {
  static query(sql) {
    return new Query(sql);
  }

  static partialQuery(values) {
    return new PartialQuery(values);
  }

  static create(connection, block) {
    block = block || (() => {});
    const relation = block(new Params());
    const bindMap = new BindMap(relation.boundAttributes);
    const queryBuilder = connection.cacheableQuery(this, relation.arel);
    return new this(queryBuilder, bindMap);
  }

  constructor(queryBuilder, bindMap) {
    this.queryBuilder = queryBuilder;
    this.bindMap = bindMap;
  }

  // alias
  async execute(params, klass, connection, block) {
    // TODO: resolve type promise
    for (const bind of this.bindMap.boundAttributes) {
      bind.type = _.isFunction(bind.type) ? await bind.type() : bind.type;
    }

    const bindValues = this.bindMap.bind(params);
    const sql = this.queryBuilder.sqlFor(bindValues, connection);

    return await klass.findBySql(sql, bindValues, { preparable: true }, block);
  }

  // alias
  call(...args) {
    return this.execute(...args);
  }
}

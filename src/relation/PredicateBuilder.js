import _ from 'lodash';
import * as Arel from 'arel';
import QueryAttribute from './QueryAttribute';

export default class PredicateBuilder {
  constructor(table) {
    this.table = table;
    this.handlers = [];
  }

  buildFromHash(attributes) {
    return this.expandFromHash(attributes);
  }

  createBinds(attributes) {
    return this.createBindsForHash(attributes);
  }

  static references(attributes) {}

  registerHandler(kclass, handler) {}

  build(attribute, value) {
    // todo
    return attribute.eq(value);
  }

  expandFromHash(attributes) {
    return _.flatMap(attributes, (value, key) => {
      return this.build(this.table.arelAttribute(key), value);
    });
  }

  createBindsForHash(attributes) {
    attributes = _.clone(attributes); // todo
    const binds = [];

    _.forEach(attributes, (value, columnName) => {
      const bindAttribute = this.buildBindAttribute(columnName, value);

      attributes[columnName] = new Arel.nodes.BindParam();
      binds.push(bindAttribute);
    });

    return [attributes, binds];
  }

  // private

  buildBindAttribute(columnName, value) {
    return new QueryAttribute(columnName, value, this.table.type(columnName));
  }
}

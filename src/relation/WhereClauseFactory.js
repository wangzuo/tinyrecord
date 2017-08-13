import _ from 'lodash';
import * as Arel from 'arel';
import WhereClause from './WhereClause';

export default class WhereClauseFactory {
  constructor(klass, predicateBuilder) {
    this.klass = klass;
    this.predicateBuilder = predicateBuilder;
  }

  build(opts, other) {
    let parts = null;
    let binds = [];

    if (_.isString(opts) || _.isArray(opts)) {
    } else if (_.isPlainObject(opts)) {
      // const attributes = this.predicateBuilder.resolveColumnAliases(opts);

      const result = this.predicateBuilder.createBinds(opts);
      const attributes = result[0];
      binds = result[1];
      parts = this.predicateBuilder.buildFromHash(attributes);
    } else if (opts instanceof Arel.nodes.Node) {
      parts = [opts];
    } else {
      throw new Error(`Unsupported argument type ${opts}`);
    }

    return new WhereClause(parts, binds);
  }

  // private

  performCaseSensitive(options) {
    return options && options.caseSensitive;
  }

  buildForCaseSensitive(attributes, options) {
    let parts = [];
    let binds = [];

    _.forEach(attributes, (value, attribute) => {});

    return [parts, binds];
  }
}

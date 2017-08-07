import _ from 'lodash';

export class ConnectionUrlResolver {
  constructor(url) {
    if (!url) {
      throw new Error('Database URL cannot be empty');
    }

    const parsed = require('url').parse(url);
    this.adapter = parsed.protocol && parsed.protocol.replace(':', '');
    if (this.adapter === 'postgres') this.adapter = 'postgresql';
    this.uri = parsed;
  }

  databaseFromPath() {
    if (this.adapter === 'sqlite3') {
      return this.uri.pathname;
    }
    return this.uri.pathname.replace(/^\//, '');
  }

  toJSON() {
    return {
      ...require('querystring').parse(this.uri.query),
      adapter: this.adapter,
      username: this.uri.auth && this.uri.auth.split(':')[0],
      password: this.uri.auth && this.uri.auth.split(':')[1],
      port: parseInt(this.uri.port, 10),
      database: this.databaseFromPath(),
      host: this.uri.hostname
    };
  }
}

export class Resolver {
  constructor(configurations) {
    this.configurations = configurations;
  }

  resolve(config) {
    if (config) {
      return this._resolveConnection(config);
    } else {
      // todo: environment
    }

    throw new Error('AdapterNotSpecified');
  }

  spec(config) {
    const spec = this.resolve(config);

    if (!spec.adapter) {
      throw new Error('database configuration does not specify adapter');
    }

    // const pathToAdapter = `./adapters/${_.capitalize(spec.adapter)}Adapter`;

    // todo: error
    // const adapter = require(pathToAdapter);
    const adapterMethod = `${spec.adapter}Connection`;

    // Object.assign(this, {
    //   default: adapter.default
    // });

    // if (!this[adapterMethod]) {
    //   throw new Error(
    //     `database configuration specifies nonexistent ${spec.adapter} adapter`
    //   );
    // }

    return new ConnectionSpecification(
      spec.name || 'primary',
      _.omit(spec, ['name']),
      adapterMethod
    );
  }

  _resolveConnection(spec) {
    if (this.configurations[spec]) {
      return this._resolveSymbolConnection(spec);
    } else if (_.isString(spec)) {
      return this._resolveUrlConnection(spec);
    } else if (_.isObject(spec)) {
      return this._resolveHashConnection(spec);
    }
  }

  _resolveSymbolConnection(spec) {
    const config = this.configurations[spec];
    if (config) {
      return { ...this._resolveConnection(config), name: spec };
    }

    throw new Error(`${spec} database is not configured.`);
  }

  _resolveHashConnection(spec) {
    // if spec["url"] && spec["url"] !~ /^jdbc:/
    if (!spec.url) return spec;

    const connectionHash = this._resolveUrlConnection(spec.url);
    return { ...spec, connectionHash };
  }

  _resolveUrlConnection(url) {
    return new ConnectionUrlResolver(url).toJSON();
  }
}

export default class ConnectionSpecification {
  constructor(name, config, adapterMethod) {
    this.name = name;
    this.config = config;
    this.adapterMethod = adapterMethod;
  }
}

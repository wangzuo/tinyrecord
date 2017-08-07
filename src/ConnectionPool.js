export default class ConnectionPool {
  constructor(spec) {
    this.spec = spec;

    const pathToAdapter = `./adapters/${capitalize(
      spec.config.adapter
    )}Adapter`;
    const adapter = require(pathToAdapter);

    return adapter.connect(spec.config);
  }

  get connection() {
    return this.checkout();
    console.log('get connection');
  }

  releaseConnection() {}

  withConnection() {}

  isConnected() {}

  disconnect() {}

  checkout() {}

  acquireConnection(checkoutTimeout) {}
}

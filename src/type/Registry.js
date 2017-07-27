export default class Registry {
  constructor() {
    this.registrations = [];
  }

  register(typeName, klass = null) {}

  lookup(symbol, ...args) {}
}

class Registration {
  constructor(name, block) {
    this.name = name;
    this.block = block;
  }

  call() {}

  matches() {}
}

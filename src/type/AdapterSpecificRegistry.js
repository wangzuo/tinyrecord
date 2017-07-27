import Registry from './Registry';

export default class AdapterSpecificRegistry extends Registry {
  static addModifier(options, klass, ...args) {
    this.registrations.push(
      new DecorationRegistration(options, klass, ...args)
    );
  }

  // private

  registrationKlass() {}
  findRegistration(symbol, ...args) {}
}

class Registration {
  constructor(name, block, options = {}) {
    this.name = name;
    this.block = block;
    this.adapter = options.adapter || null;
    this.override = options.override || null;
  }

  call() {}
  matches(typeName, ...args) {}
}

class DecorationRegistration extends Registration {
  // constructor(options, klass, _options = {}) {
  //   this.options = options;
  //   this.klass = klass;
  //   this.adapter = _options.adapter || null;
  // }

  call() {}
  matches() {}
}

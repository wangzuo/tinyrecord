import Value from './type/Value';
// import AdapterSpecificRegistry from './type/AdapterSpecificRegistry';

// const registry = new AdapterSpecificRegistry();

export default class Type {
  register(typeName, klass = null) {}

  lookup() {}

  static get defaultValue() {
    return new Value();
    // if(this._default)
  }
}

export Boolean from './type/Boolean';
export String from './type/String';
export Binary from './type/Binary';
export Text from './type/Text';
export Date from './type/Date';
export Time from './type/Time';
export DateTime from './type/DateTime';
export Float from './type/Float';
export Integer from './type/Integer';
export Json from './type/json';

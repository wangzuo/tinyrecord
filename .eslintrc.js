module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
    jest: true
  },
  extends: ['eslint:recommended'],
  rules: {
    'no-console': 'off'
  },
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module'
  },
  ecmaFeatures: {
    generators: true,
    experimentalObjectRestSpread: true
  }
};

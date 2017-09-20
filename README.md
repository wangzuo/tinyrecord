# tinyrecord
[![npm](https://img.shields.io/npm/v/tinyrecord.svg)](https://www.npmjs.com/package/tinyrecord)
[![Build Status](https://travis-ci.org/wangzuo/tinyrecord.svg?branch=master)](https://travis-ci.org/wangzuo/tinyrecord)
[![codecov](https://codecov.io/gh/wangzuo/tinyrecord/branch/master/graph/badge.svg)](https://codecov.io/gh/wangzuo/tinyrecord)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

**[wip]** ActiveRecord in node

#### Installation
``` sh
yarn add tinyrecord
# npm i tinyrecord --save
```

#### Establish connection
``` javascript
const { Base } = require('tinyrecord');

// yarn add sqlite3
Base.establishConnection({
  adapter: 'sqlite3',
  database: ':memory:'
});

// yarn add mysql2
Base.establishConnection({
  adapter: 'mysql2',
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'tinyrecord'
});
```

#### Model
``` javascript
const { Base } = require('tinyrecord');

class Post extends Base {}
Post.tableName = 'posts';

module.exports = Post;
```

#### Crud
``` javascript
const post = await Post.new({ title: 'hello' });
await post.save();

const post = await Post.create({ title: 'hello' });
await post.update({ title: 'world' });
```

#### Query
``` javascript
const sql = await Post.order({ id: 'asc' }).toSql();
const posts = await Post.limit(10).records();
```

#### Commands
``` sh
tiny db:create
tiny db:drop
tiny db:migrate
tiny migration:create AddTitleToPosts title:string
tiny model:create Post title:string
```

#### License
MIT

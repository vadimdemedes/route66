# Route66

Route66 is a router middleware inspired by Rails for Koa and Express.


## How is it different?

It is designed to suit **big** Node.js apps, with ability to customize the way requests are dispatched.  
Route66 provides a great API for readable and comfortable definitions of routes.
Route66 can adapt to every project structure out there by letting you decide how request should be dispatched.

To better understand the idea behind this project, check out this example:

```
var Router = require('route66');
var express = require('express');

var router = new Router();
var app = express();

router.setup(function () {
  this.get('/posts/create', 'posts#create');
});

router.dispatch(function (route, req, res) {
  var controllerName = route.controller; // "posts"
  var methodName = route.method; // "create"
  
  // require PostsController and execute "create" method
  PostsController.create(req, res);
});

app.use(router.express());
```


## Features

- Flexible (allows you to handle the request the way you want)
- Lightweight (165 sloc, commented and understandable code)
- Convenient API for defining routes
- Compatible with Koa and Express
- Automatically parses parameters from urls


## Installation

Install via npm:

```
$ npm install route66 --save
```


## All-in-one example

**Website with a full documentation will be created soon.**

```javascript
var Router = require('route66');

var router = new Router();

router.setup(function () {
  this.root('home#index');
  
  this.get('/welcome', 'home#welcome');
  
  this.post('/contact', 'contact#send');
  
  this.resource('task');
  
  this.resource('user', { except: ['destroy'] });
  
  this.resource('post', function () {
    this.resource('comment', { only: ['create'] });
  });
  
  this.namespace('api', function () {
    this.resource('task');
  });
});
```

#### Dispatching requests in Express apps

```javascript
var Router = require('route66');
var express = require('express');

var router = new Router();
var app = express();

router.setup(function () {
  this.namespace('api/v1', function () {
    this.post('/posts', 'posts#create');
  });
});

router.dispatch(function (route, req, res) {
  /*
  route = {
    controller: 'posts',
    method: 'create',
    namespace: 'api/v1'
  }
  */
});

app.use(router.express());
```

#### Dispatching requests in Koa apps

```javascript
var Router = require('route66');
var koa = require('koa');

var router = new Router();
var app = koa();

router.setup(function () {
  this.namespace('api/v1', function () {
    this.post('/posts', 'posts#create');
  });
});

router.dispatch(function *(route, context) {
  /*
  route = {
    controller: 'posts',
    method: 'create',
    namespace: 'api/v1'
  }
  */
  
  // this is also context
  // this == context
});

app.use(router.koa());
```


## Tests

[![Circle CI](https://circleci.com/gh/vdemedes/route66.svg?style=svg)](https://circleci.com/gh/vdemedes/route66)

**Note**: You must have Node.js v0.11.x installed.

To run tests, execute this:

```
$ npm test
```


## License

Route66 is released under the MIT license.

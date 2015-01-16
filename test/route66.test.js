/**
* Test dependencies
*/

var parallel = require('async').parallel;
var request = require('supertest');
var express = require('express');
var koa = require('koa');

var Router = require('../');

require('chai').use(helpers).should();

/**
* Tests
*/

describe ('Router', function () {
  describe ('Definition', function () {
    var router;

    beforeEach (function () {
      router = new Router;
    });

    it ('should define root route', function () {
      router.setup(function () {
        this.root('home#welcome');
      });

      var routes = router.routes;
      routes.length.should.equal(1);

      routes.should.have.a.route('get', '/', 'home#welcome');
    });

    it ('should define route', function () {
      router.setup(function () {
        this.get('/welcome', 'home#welcome');
      });

      var routes = router.routes;
      routes.length.should.equal(1);

      routes.should.have.a.route('get', '/welcome', 'home#welcome');
    });

    it ('should throw an error if route target was not specified', function () {
      try {
        router.setup(function () {
          this.get('/welcome');
        });
      } catch (e) {
        e.message.should.equal('Target was not specified for route GET /welcome');
      } finally {
        var routes = router.routes;
        routes.length.should.equal(0);
      }
    });

    it ('should define a namespaced route', function () {
      router.setup(function () {
        this.namespace('api', function () {
          this.get('/posts/new', 'posts#new');
        });

        this.get('/welcome', 'home#welcome');
      });

      var routes = router.routes;
      routes.length.should.equal(2);

      routes.should.have.a.route('get', '/api/posts/new', 'api/posts#new');
      routes.should.have.a.route('get', '/welcome', 'home#welcome');
    });

    it ('should define a resource', function () {
      router.setup(function () {
        this.resource('post');
      });

      var routes = router.routes;
      routes.length.should.equal(7);

      routes.should.have.a.route('get', '/posts', 'posts#index');
      routes.should.have.a.route('get', '/posts/new', 'posts#new');
      routes.should.have.a.route('get', '/posts/:post_id/edit', 'posts#edit');
      routes.should.have.a.route('get', '/posts/:post_id', 'posts#show');
      routes.should.have.a.route('post', '/posts', 'posts#create');
      routes.should.have.a.route('put', '/posts/:post_id', 'posts#update');
      routes.should.have.a.route('delete', '/posts/:post_id', 'posts#destroy');
    });

    it ('should define a resource with only allowed methods', function () {
      router.setup(function () {
        this.resource('post', { only: ['index', 'show'] });
      });

      var routes = router.routes;
      routes.length.should.equal(2);

      routes.should.have.a.route('get', '/posts', 'posts#index');
      routes.should.have.a.route('get', '/posts/:post_id', 'posts#show');
    });

    it ('should define a resource with all methods except specified ones', function () {
      router.setup(function () {
        this.resource('post', { except: ['index', 'show'] });
      });

      var routes = router.routes;
      routes.length.should.equal(5);

      routes.should.have.a.route('get', '/posts/new', 'posts#new');
      routes.should.have.a.route('get', '/posts/:post_id/edit', 'posts#edit');
      routes.should.have.a.route('post', '/posts', 'posts#create');
      routes.should.have.a.route('put', '/posts/:post_id', 'posts#update');
      routes.should.have.a.route('delete', '/posts/:post_id', 'posts#destroy');
    });

    it ('should define a resource with nested routes', function () {
      router.setup(function () {
        this.resource('post', function () {
          this.get('/custom', 'posts#custom');
        });
      });

      var routes = router.routes;
      routes.length.should.equal(8);

      routes.should.have.a.route('get', '/posts', 'posts#index');
      routes.should.have.a.route('get', '/posts/new', 'posts#new');
      routes.should.have.a.route('get', '/posts/:post_id/edit', 'posts#edit');
      routes.should.have.a.route('get', '/posts/:post_id', 'posts#show');
      routes.should.have.a.route('post', '/posts', 'posts#create');
      routes.should.have.a.route('put', '/posts/:post_id', 'posts#update');
      routes.should.have.a.route('delete', '/posts/:post_id', 'posts#destroy');
      routes.should.have.a.route('get', '/posts/:post_id/custom', 'posts#custom');
    });

    it ('should define nested resources', function () {
      router.setup(function () {
        this.resource('post', function () {
          this.resource('comment');
        });
      });

      var routes = router.routes;
      routes.length.should.equal(14);

      routes.should.have.a.route('get', '/posts', 'posts#index');
      routes.should.have.a.route('get', '/posts/new', 'posts#new');
      routes.should.have.a.route('get', '/posts/:post_id/edit', 'posts#edit');
      routes.should.have.a.route('get', '/posts/:post_id', 'posts#show');
      routes.should.have.a.route('post', '/posts', 'posts#create');
      routes.should.have.a.route('put', '/posts/:post_id', 'posts#update');
      routes.should.have.a.route('delete', '/posts/:post_id', 'posts#destroy');

      routes.should.have.a.route('get', '/posts/:post_id/comments', 'comments#index');
      routes.should.have.a.route('get', '/posts/:post_id/comments/new', 'comments#new');
      routes.should.have.a.route('get', '/posts/:post_id/comments/:comment_id/edit', 'comments#edit');
      routes.should.have.a.route('get', '/posts/:post_id/comments/:comment_id', 'comments#show');
      routes.should.have.a.route('post', '/posts/:post_id/comments', 'comments#create');
      routes.should.have.a.route('put', '/posts/:post_id/comments/:comment_id', 'comments#update');
      routes.should.have.a.route('delete', '/posts/:post_id/comments/:comment_id', 'comments#destroy');
    });

    it ('should define resource with nested collection resource', function () {
      router.setup(function () {
        this.resource('post', function () {
          this.get('/member', 'posts#member');
          this.get('/collection', 'posts#collection', { on: 'collection' });

          this.resource('comment', { on: 'collection' }, function () {
            this.get('/member', 'comments#member');
            this.get('/collection', 'comments#collection', { on: 'collection' });
          });
        });
      });

      var routes = router.routes;
      routes.length.should.equal(18);

      routes.should.have.a.route('get', '/posts', 'posts#index');
      routes.should.have.a.route('get', '/posts/new', 'posts#new');
      routes.should.have.a.route('get', '/posts/:post_id/edit', 'posts#edit');
      routes.should.have.a.route('get', '/posts/:post_id', 'posts#show');
      routes.should.have.a.route('post', '/posts', 'posts#create');
      routes.should.have.a.route('put', '/posts/:post_id', 'posts#update');
      routes.should.have.a.route('delete', '/posts/:post_id', 'posts#destroy');
      routes.should.have.a.route('get', '/posts/:post_id/member', 'posts#member');
      routes.should.have.a.route('get', '/posts/collection', 'posts#collection')

      routes.should.have.a.route('get', '/posts/comments', 'comments#index');
      routes.should.have.a.route('get', '/posts/comments/new', 'comments#new');
      routes.should.have.a.route('get', '/posts/comments/:comment_id/edit', 'comments#edit');
      routes.should.have.a.route('get', '/posts/comments/:comment_id', 'comments#show');
      routes.should.have.a.route('post', '/posts/comments', 'comments#create');
      routes.should.have.a.route('put', '/posts/comments/:comment_id', 'comments#update');
      routes.should.have.a.route('delete', '/posts/comments/:comment_id', 'comments#destroy');
      routes.should.have.a.route('get', '/posts/comments/:comment_id/member', 'comments#member');
      routes.should.have.a.route('get', '/posts/comments/collection', 'comments#collection');
    });
  });
  
  describe ('Dispatching', function () {
    describe ('Express', function () {
      var context = {};

      beforeEach (function () {
        var router = new Router;
        
        router.dispatch(function (route, req, res) {
          res.end(route.target);
        });
        
        var app = express();
        
        app.use(router.express());
        
        context.router = router;
        context.app = app.listen();
      });

      require('./tests/dispatch')('express', context);
    });
    
    describe ('Koa', function () {
      var context = {};
      
      beforeEach (function () {
        var router = new Router;
        
        router.dispatch(function *(route, context) {
          this.body = route.target;
        });
        
        var app = koa();
        
        app.use(router.koa());
        
        context.router = router;
        context.app = app.listen();
      });
      
      require('./tests/dispatch')('koa', context);
    });
  });
});


/**
* Helpers
*/

function helpers (chai, utils) {
  chai.Assertion.addMethod('route', function (method, path, target) {
    var routes = utils.flag(this, 'object');

    var index = 0;
    var route;

    while (route = routes[index++]) {
      if (route.method === method &&
        route.path === path &&
        route.target === target) return;
    }

    throw new Error('Router is missing route ' + method.toUpperCase() + ' ' + path);
  });
}

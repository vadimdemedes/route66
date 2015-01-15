/**
 * Dependencies
 */

var parallel = require('async').parallel;
var request = require('supertest');

/**
 * Tests
 */

module.exports = function (context) {
  var router, app;
  
  beforeEach (function () {
    router = context.router;
    app = context.app;
  });
  
  it ('should dispatch a root route', function (done) {
    router.setup(function () {
      this.root('home#welcome');
    });
    
    request(app)
      .get('/')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        
        res.text.should.equal('home#welcome');
        done();
      });
  });

  it ('should dispatch a route', function (done) {
    router.setup(function () {
      this.get('/welcome', 'home#welcome');
    });
  
    request(app)
      .get('/welcome')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        
        res.text.should.equal('home#welcome');
        done();
      });
  });
  
  it ('should dispatch a namespaced route', function (done) {
    router.setup(function () {
      this.namespace('api', function () {
        this.get('/posts/new', 'posts#new');
      });
  
      this.get('/welcome', 'home#welcome');
    });
  
    parallel([
      function (next) {
        request(app)
          .get('/api/posts/new')
          .expect(200)
          .end(function (err, res) {
            if (err) return next(err);
          
            res.text.should.equal('api/posts#new');
            next();
          });
      },
      function (next) {
        request(app)
          .get('/welcome')
          .expect(200)
          .end(function (err, res) {
            if (err) return next(err);
          
            res.text.should.equal('home#welcome');
            next();
          });
      }
    ], done);
  });
  
  it ('should define a resource', function (done) {
    router.setup(function () {
      this.resource('post');
    });
  
    parallel([
      function postsIndex (next) {
        request(app)
          .get('/posts')
          .expect(200)
          .end(function (err, res) {
            if (err) return next(err);
            
            res.text.should.equal('posts#index');
            next();
          });
      },
      
      function postsNew (next) {
        request(app)
          .get('/posts/new')
          .expect(200)
          .end(function (err, res) {
            if (err) return next(err);
            
            res.text.should.equal('posts#new');
            next();
          });
      },
      
      function postsEdit (next) {
        request(app)
          .get('/posts/1/edit')
          .expect(200)
          .end(function (err, res) {
            if (err) return next(err);
            
            res.text.should.equal('posts#edit');
            next();
          });
      },
      
      function postsShow (next) {
        request(app)
          .get('/posts/1')
          .expect(200)
          .end(function (err, res) {
            if (err) return next(err);
            
            res.text.should.equal('posts#show');
            next();
          });
      },
      
      function postsCreate (next) {
        request(app)
          .post('/posts')
          .expect(200)
          .end(function (err, res) {
            if (err) return next(err);
            
            res.text.should.equal('posts#create');
            next();
          });
      },
      
      function postsUpdate (next) {
        request(app)
          .put('/posts/1')
          .expect(200)
          .end(function (err, res) {
            if (err) return next(err);
            
            res.text.should.equal('posts#update');
            next();
          });
      },
      
      function postsDestroy (next) {
        request(app)
          .del('/posts/1')
          .expect(200)
          .end(function (err, res) {
            if (err) return next(err);
            
            res.text.should.equal('posts#destroy');
            next();
          });
      }
    ], done);
  });
};

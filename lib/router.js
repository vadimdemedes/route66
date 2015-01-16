/**
 * Dependencies
 */

var pathToRegexp = require('path-to-regexp');
var methods = require('methods');
var inflect = require('inflect');

require('./util');


/**
 * Router
 */

class Router {
  constructor () {
    this.routes = [];
    
    // private variables
    this._compiledRoutes = {};
    this._namespaces = [];
    this._path = [];
  }
  
  setup (routes) {
    routes.call(this);
    
    methods.forEach(method => {
      this._compiledRoutes[method] = [];
    });
    
    this.routes.forEach(route => {
      let [namespace, method] = route.target.split('#');
      
      namespace = namespace.split('/');
      let controller = namespace.pop();
      namespace = namespace.join('/');
      
      let target = route.target;
      let path = route.path;
      
      let keys = [];
      let regexp = pathToRegexp(route.path, keys);
      keys = keys.map(key => key.name);
      
      this._compiledRoutes[route.method].push({
        path,
        regexp,
        keys,
        namespace,
        controller,
        method,
        target
      });
    });
  }
  
  match (method, path, target, options = {}) {
    if (!target) {
      throw new Error(`Target was not specified for route ${ method.toUpperCase() } ${ path }`);
    }
    
    let namespaces = this._namespaces;
    let fullPath = this._path;
    
    // remove slashes at the start and end
    path = path.replace(/^\/|\/$/g, '');
    
    // if route is on collection
    // remove last component in path
    // /posts/:post_id => /posts
    if (options.on === 'collection') {
      var lastComponent = fullPath.pop();
    }
    
    // insert path component at the end
    fullPath.push(path);
    
    // if there are namespaces
    // append them to the target
    if (namespaces.length) {
      let namespace = namespaces.join('/');
      target = `${ namespace }/${ target }`;
    }
    
    // build a path and prepend a slash
    path = `/${ fullPath.join('/') }`;
    
    let route = { method, path, target };
    
    // add route to the collection
    this.routes.push(route);
    
    // after route was added
    // remove its component from path
    fullPath.length--;
    
    // route is on collection
    // so removed component needs to be put back
    // /posts => /posts/:post_id
    if (lastComponent) {
      fullPath.push(lastComponent);
    }
  }
  
  root (target) {
    this.match('get', '/', target);
  }
  
  get (path, target, options) {
    this.match('get', path, target, options);
  }
  
  post (path, target, options) {
    this.match('post', path, target, options);
  }
  
  put (path, target, options) {
    this.match('put', path, target, options);
  }
  
  delete (path, target, options) {
    this.match('delete', path, target, options);
  }
  
  namespace (path, routes) {
    let namespaces = this._namespaces;
    let fullPath = this._path;
    
    // remove slashes at the start and end
    path = path.replace(/^\/|\/$/g, '');
    
    // add path component
    fullPath.push(path);
    
    // keeping track of all namespaces
    namespaces.push(path);
    
    routes.call(this);
    
    // remove namespace name from path
    fullPath.pop();
    
    // namespace is no longer needed, remove
    namespaces.length--;
  }
  
  resource (name, options = {}, routes) {
    let fullPath = this._path;
    
    if ('undefined' === typeof routes) {
      routes = emptyFunction;
    }
    
    if ('function' === typeof options) {
      routes = options;
      options = {};
    }
    
    let pluralName = inflect.pluralize(name);
    let singularName = inflect.singularize(name);
    
    let except = options.except || [];
    let only = options.only || [];
    
    let methods = [
      'index',
      'new',
      'edit',
      'show',
      'create',
      'update',
      'destroy'
    ];
    
    if (only.length) {
      methods = methods.filter(method => only.includes(method));
    }
    
    if (except.length) {
      methods = methods.filter(method => !except.includes(method));
    }
    
    // if it's a collection resource
    // remove :id part of previous resource
    // and put it back later
    if (options.on === 'collection') {
      var lastComponent = fullPath.pop();
    }
    
    // define CRUD methods
    if (methods.includes('index'))   this.get(pluralName, `${ pluralName }#index`);
    if (methods.includes('new'))     this.get(`${ pluralName }/new`, `${ pluralName }#new`);
    if (methods.includes('edit'))    this.get(`${ pluralName }/:${ singularName }_id/edit`, `${ pluralName }#edit`);
    if (methods.includes('show'))    this.get(`${ pluralName }/:${ singularName }_id`, `${ pluralName }#show`);
    if (methods.includes('create'))  this.post(pluralName, `${ pluralName }#create`);
    if (methods.includes('update'))  this.put(`${ pluralName }/:${ singularName }_id`, `${ pluralName }#update`);
    if (methods.includes('destroy')) this.delete(`${ pluralName }/:${ singularName }_id`, `${ pluralName }#destroy`);
    
    // add /resource/:resource_id to the path
    // add separately, because :resource_id 
    // component may be removed by nested collection routes
    fullPath.push(pluralName, `:${ singularName }_id`);
    
    // define nested routes
    routes.call(this);
    
    // remove /resource/:resource_id
    // that was added previously
    fullPath.length -= 2;
    
    // if it was a collection resource
    // put back :resource_id of a previous resource
    if (lastComponent) {
      fullPath.push(lastComponent);
    }
  }
  
  dispatch (fn) {
    this._dispatch = fn;
  }
  
  express () {
    let router = this;
    
    return function (req, res, next) {
      if (!router._dispatch) {
        throw new Error('Router does not have a dispatch function.');
      }
      
      let { route, params } = router.resolve(req.method, req.url);
      
      if (!route) {
        res.status = 404;
        next(false);
        return;
      }
      
      req.params = params;
      
      router._dispatch(route, req, res, next);
    };
  }
  
  koa () {
    let router = this;
    
    return function *(next) {
      if (!router._dispatch) {
        throw new Error('Router does not have a dispatch function.');
      }
      
      let { route, params } = router.resolve(this.method, this.url);
      
      if (!route) {
        this.status = 404;
        yield next;
        return;
      }
      
      this.params = params;
      
      yield router._dispatch.call(this, route, this);
    };
  }
  
  resolve (method, url) {
    method = method.toLowerCase();
    
    let routes = this._compiledRoutes[method];
    
    let route;
    let index = 0;
    
    while (route = routes[index++]) {
      let params;
      
      if (params = route.regexp.exec(url)) {
        params = params.slice(1).map(decodeURIComponent);
        
        route.keys.forEach((key, i) => params[key] = params[i]);
        
        return { route, params };
      }
    }
  }
}

var emptyFunction = function () {};


/**
 * Expose Router
 */

module.exports = Router;

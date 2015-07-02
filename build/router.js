"use strict";

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

/**
 * Dependencies
 */

var pathToRegexp = require("path-to-regexp");
var methods = require("methods");
var inflect = require("inflect");
var parse = require("url").parse;

/**
 * Router
 */

var Router = (function () {
  function Router() {
    _classCallCheck(this, Router);

    this.routes = [];

    // private variables
    this._compiledRoutes = {};
    this._namespaces = [];
    this._path = [];
  }

  Router.prototype.setup = function setup(routes) {
    var _this = this;

    routes.call(this);

    methods.forEach(function (method) {
      _this._compiledRoutes[method] = [];
    });

    this.routes.forEach(function (route) {
      var _route$target$split = route.target.split("#");

      var _route$target$split2 = _slicedToArray(_route$target$split, 2);

      var namespace = _route$target$split2[0];
      var method = _route$target$split2[1];

      namespace = namespace.split("/");
      var controller = namespace.pop();
      namespace = namespace.join("/");

      var target = route.target;
      var path = route.path;

      var keys = [];
      var regexp = pathToRegexp(route.path, keys);
      keys = keys.map(function (key) {
        return key.name;
      });

      _this._compiledRoutes[route.method].push({
        path: path,
        regexp: regexp,
        keys: keys,
        namespace: namespace,
        controller: controller,
        method: method,
        target: target
      });
    });
  };

  Router.prototype.match = function match(method, path, target) {
    var options = arguments[3] === undefined ? {} : arguments[3];

    if (!target) {
      throw new Error("Target was not specified for route " + method.toUpperCase() + " " + path);
    }

    var namespaces = this._namespaces;
    var fullPath = this._path;

    // remove slashes at the start and end
    path = path.replace(/^\/|\/$/g, "");

    // if route is on collection
    // remove last component in path
    // /posts/:post_id => /posts
    if (options.on === "collection") {
      var lastComponent = fullPath.pop();
    }

    // insert path component at the end
    fullPath.push(path);

    // if there are namespaces
    // append them to the target
    if (namespaces.length) {
      var namespace = namespaces.join("/");
      target = "" + namespace + "/" + target;
    }

    // build a path and prepend a slash
    path = "/" + fullPath.join("/");

    var route = { method: method, path: path, target: target };

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
  };

  Router.prototype.root = function root(target) {
    this.match("get", "/", target);
  };

  Router.prototype.get = function get(path, target, options) {
    this.match("get", path, target, options);
  };

  Router.prototype.post = function post(path, target, options) {
    this.match("post", path, target, options);
  };

  Router.prototype.put = function put(path, target, options) {
    this.match("put", path, target, options);
  };

  Router.prototype["delete"] = function _delete(path, target, options) {
    this.match("delete", path, target, options);
  };

  Router.prototype.namespace = function namespace(path, routes) {
    var namespaces = this._namespaces;
    var fullPath = this._path;

    // remove slashes at the start and end
    path = path.replace(/^\/|\/$/g, "");

    // add path component
    fullPath.push(path);

    // keeping track of all namespaces
    namespaces.push(path);

    routes.call(this);

    // remove namespace name from path
    fullPath.pop();

    // namespace is no longer needed, remove
    namespaces.length--;
  };

  Router.prototype.resource = function resource(name, _x, routes) {
    var options = arguments[1] === undefined ? {} : arguments[1];

    var fullPath = this._path;

    if ("undefined" === typeof routes) {
      routes = noop;
    }

    if ("function" === typeof options) {
      routes = options;
      options = {};
    }

    var pluralName = inflect.pluralize(name);
    var singularName = inflect.singularize(name);

    var except = options.except || [];
    var only = options.only || [];

    var methods = ["index", "new", "edit", "show", "create", "update", "destroy"];

    if (only.length) {
      methods = methods.filter(function (method) {
        return includes(only, method);
      });
    }

    if (except.length) {
      methods = methods.filter(function (method) {
        return !includes(except, method);
      });
    }

    // if it's a collection resource
    // remove :id part of previous resource
    // and put it back later
    if (options.on === "collection") {
      var lastComponent = fullPath.pop();
    }

    // define CRUD methods
    if (includes(methods, "index")) this.get(pluralName, "" + pluralName + "#index");
    if (includes(methods, "new")) this.get("" + pluralName + "/new", "" + pluralName + "#new");
    if (includes(methods, "edit")) this.get("" + pluralName + "/:" + singularName + "_id/edit", "" + pluralName + "#edit");
    if (includes(methods, "show")) this.get("" + pluralName + "/:" + singularName + "_id", "" + pluralName + "#show");
    if (includes(methods, "create")) this.post(pluralName, "" + pluralName + "#create");
    if (includes(methods, "update")) this.put("" + pluralName + "/:" + singularName + "_id", "" + pluralName + "#update");
    if (includes(methods, "destroy")) this["delete"]("" + pluralName + "/:" + singularName + "_id", "" + pluralName + "#destroy");

    // add /resource/:resource_id to the path
    // add separately, because :resource_id
    // component may be removed by nested collection routes
    fullPath.push(pluralName, ":" + singularName + "_id");

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
  };

  Router.prototype.dispatch = function dispatch(fn) {
    this._dispatch = fn;
  };

  Router.prototype.express = function express() {
    var router = this;

    return function (req, res, next) {
      if (!router._dispatch) {
        throw new Error("Router does not have a dispatch function.");
      }

      var route = router.resolve(req.method, req.url);

      if (!route) {
        res.status = 404;
        next(false);
        return;
      }

      req.params = route.params;

      router._dispatch(route, req, res, next);
    };
  };

  Router.prototype.koa = function koa() {
    var router = this;

    return function* (next) {
      if (!router._dispatch) {
        throw new Error("Router does not have a dispatch function.");
      }

      var route = router.resolve(this.method, this.url);

      if (!route) {
        this.status = 404;
        yield next;
        return;
      }

      this.params = route.params;

      yield router._dispatch.call(this, route, this);
    };
  };

  Router.prototype.resolve = function resolve(method, url) {
    method = method.toLowerCase();

    var routes = this._compiledRoutes[method];

    var route = undefined;
    var index = 0;

    url = parse(url).pathname;

    while (route = routes[index++]) {
      var _ret = (function () {
        var params = undefined;

        if (params = route.regexp.exec(url)) {
          // extract parameters from .exec() result
          // and decodeURIComponent each of them
          params = params.slice(1).map(decodeURIComponent);

          // assign keys to params array
          route.keys.forEach(function (key, i) {
            return params[key] = params[i];
          });
          route.params = params;

          return {
            v: route
          };
        }
      })();

      if (typeof _ret === "object") {
        return _ret.v;
      }
    }
  };

  return Router;
})();

var noop = function noop() {};

/**
 * Helpers
 */

function includes(arr, el) {
  return arr.indexOf(el) >= 0;
}

/**
 * Expose Router
 */

module.exports = Router;

"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

/**
 * Dependencies
 */

var pathToRegexp = require("path-to-regexp");
var methods = require("methods");
var inflect = require("inflect");

require("./util");


/**
 * Router
 */

var Router = (function () {
  function Router() {
    this.routes = [];

    // private variables
    this._compiledRoutes = {};
    this._namespaces = [];
    this._path = [];
  }

  _prototypeProperties(Router, null, {
    setup: {
      value: function setup(routes) {
        var _this = this;
        routes.call(this);

        methods.forEach(function (method) {
          _this._compiledRoutes[method] = [];
        });

        this.routes.forEach(function (route) {
          var keys = [];
          var regexp = pathToRegexp(route.path, keys);

          route = {
            path: route.path,
            regexp: regexp,
            keys: keys,
            method: route.method,
            target: route.target
          };

          _this._compiledRoutes[route.method].push(route);
        });
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    match: {
      value: function match(method, path, target) {
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
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    root: {
      value: function root(target) {
        this.match("get", "/", target);
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    get: {
      value: function get(path, target, options) {
        this.match("get", path, target, options);
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    post: {
      value: function post(path, target, options) {
        this.match("post", path, target, options);
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    put: {
      value: function put(path, target, options) {
        this.match("put", path, target, options);
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    "delete": {
      value: function _delete(path, target, options) {
        this.match("delete", path, target, options);
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    namespace: {
      value: function namespace(path, routes) {
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
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    resource: {
      value: function resource(name, options, routes) {
        var options = arguments[1] === undefined ? {} : arguments[1];
        var fullPath = this._path;

        if ("undefined" === typeof routes) {
          routes = emptyFunction;
        }

        if ("function" === typeof options) {
          routes = options;
          options = {};
        }

        var pluralName = inflect.pluralize(name);
        var singularName = inflect.singularize(name);

        var except = options.except || [];
        var only = options.only || [];

        var _methods = ["index", "new", "edit", "show", "create", "update", "destroy"];

        if (only.length) {
          _methods = _methods.filter(function (method) {
            return only.includes(method);
          });
        }

        if (except.length) {
          _methods = _methods.filter(function (method) {
            return !except.includes(method);
          });
        }

        // if it's a collection resource
        // remove :id part of previous resource
        // and put it back later
        if (options.on === "collection") {
          var lastComponent = fullPath.pop();
        }

        // define CRUD methods
        if (_methods.includes("index")) this.get(pluralName, "" + pluralName + "#index");
        if (_methods.includes("new")) this.get("" + pluralName + "/new", "" + pluralName + "#new");
        if (_methods.includes("edit")) this.get("" + pluralName + "/:" + singularName + "_id/edit", "" + pluralName + "#edit");
        if (_methods.includes("show")) this.get("" + pluralName + "/:" + singularName + "_id", "" + pluralName + "#show");
        if (_methods.includes("create")) this.post(pluralName, "" + pluralName + "#create");
        if (_methods.includes("update")) this.put("" + pluralName + "/:" + singularName + "_id", "" + pluralName + "#update");
        if (_methods.includes("destroy")) this["delete"]("" + pluralName + "/:" + singularName + "_id", "" + pluralName + "#destroy");

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
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    dispatch: {
      value: function dispatch(fn) {
        this._dispatch = fn;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    express: {
      value: function express() {
        var router = this;

        return function (req, res, next) {
          if (!router._dispatch) {
            throw new Error("Router does not have a dispatch function.");
          }

          var method = req.method.toLowerCase();
          var routes = router._compiledRoutes[method];

          var route = undefined;
          var index = 0;

          while (route = routes[index++]) {
            if (route.regexp.test(req.url)) {
              return router._dispatch(route, req, res, next);
            }
          }

          res.status = 404;
          next(false);
        };
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    koa: {
      value: function koa() {
        var router = this;

        return function* (next) {
          if (!router._dispatch) {
            throw new Error("Router does not have a dispatch function.");
          }

          var method = this.method.toLowerCase();
          var routes = router._compiledRoutes[method];

          var route = undefined;
          var index = 0;

          while (route = routes[index++]) {
            if (route.regexp.test(this.url)) {
              return yield router._dispatch.call(this, route, this);
            }
          }

          this.status = 404;
          yield next;
        };
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return Router;
})();

var emptyFunction = function () {};


/**
 * Expose Router
 */

module.exports = Router;

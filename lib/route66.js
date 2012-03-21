var Route66, async, methods, routes, toArray;

async = require('async');

Route66 = function(req, res, next) {
  var i, route, values, _i, _len, _ref;
  _ref = routes[req.method.toLowerCase()];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    route = _ref[_i];
    if (route.match.test(req.url)) {
      values = route.match.exec(req.url).slice(1);
      i = 0;
      req.params = {};
      while (true) {
        if (i >= values.length) break;
        req.params[route.params[i]] = values[i];
        i++;
      }
      return async.forEachSeries(route.functions, function(fn, nextFn) {
        return fn(req, res, nextFn);
      }, function() {
        return next();
      });
    }
  }
};

Route66.addRoute = function(method, match, functions) {
  var matchClone, params, result;
  params = [];
  matchClone = match;
  while (true) {
    result = /\:([A-Za-z_]+)\/?/.exec(matchClone);
    if (result) {
      params.push(result.slice(1).toString());
      matchClone = matchClone.replace(/\:([A-Za-z_]+)\/?/, '');
    }
    if (!/\:([A-Za-z_]+)\/?/.test(matchClone)) break;
  }
  routes[method].push({
    match: new RegExp('^' + match.replace(/\//g, '\\/?').replace(/\:([A-Za-z_]+)(\?)?\/?/g, '([A-Za-z0-9_]+)$2') + '$'),
    params: params,
    functions: toArray(functions).slice(1)
  });
  return Route66.sort();
};

toArray = function(object) {
  var item, items;
  items = [];
  for (item in object) {
    items.push(object[item]);
  }
  return items;
};

routes = {};

methods = ['get', 'post', 'patch', 'put', 'delete', 'head'];

Route66.sort = function() {
  var method, _i, _len, _results;
  _results = [];
  for (_i = 0, _len = methods.length; _i < _len; _i++) {
    method = methods[_i];
    _results.push(routes[method].sort(function(a, b) {
      return b.match.toString().length - a.match.toString().length;
    }));
  }
  return _results;
};

async.forEach(methods, function(method, nextMethod) {
  routes[method] = [];
  Route66[method] = function(match) {
    return Route66.addRoute(method, match, arguments);
  };
  return nextMethod();
}, function() {
  return module.exports = Route66;
});

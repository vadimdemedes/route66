var Route66, async, methods, routes, toArray, url;

async = require('async');

url = require('url');

Route66 = function(req, res, next) {
  var functions, i, requestUrl, route, values, _i, _len, _ref;
  _ref = routes[req.method.toLowerCase()];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    route = _ref[_i];
    requestUrl = req.url.replace(url.parse(req.url).search, '');
    if (route.match.test(requestUrl)) {
      values = route.match.exec(requestUrl).slice(1);
      i = 0;
      req.params = {};
      while (true) {
        if (i >= values.length) break;
        req.params[route.params[i]] = values[i];
        i++;
      }
      functions = route.functions;
      return async.forEachSeries(functions, function(fn, nextFn) {
        fn(req, res, nextFn);
        if (functions.length === 0) return nextFn();
      }, function() {});
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
    functions: functions instanceof Array ? functions : toArray(functions).slice(1)
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

methods = ['get', 'post', 'patch', 'put', 'del', 'head'];

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

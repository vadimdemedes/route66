async = require 'async'

Route66 = (req, res, next) ->
	for route in routes[req.method.toLowerCase()]
		if route.match.test req.url
			values = route.match.exec(req.url).slice 1
			i = 0
			req.params = {}
			loop
				break if i >= values.length
				req.params[route.params[i]] = values[i]
				i++
			return async.forEachSeries route.functions, (fn, nextFn) ->
				fn(req, res, nextFn)
			, ->
				do next

Route66.addRoute = (method, match, functions) ->
	params = []
	matchClone = match
	loop
		result = /\:([A-Za-z_]+)\/?/.exec matchClone
		if result
			params.push result.slice(1).toString()
			matchClone = matchClone.replace /\:([A-Za-z_]+)\/?/, ''
		break if not /\:([A-Za-z_]+)\/?/.test matchClone
	routes[method].push
		match: new RegExp match.replace(/\//g, '\\/?').replace(/\:([A-Za-z_]+)(\?)?\/?/g, '([A-Za-z0-9_]+)$2')
		params: params
		functions: toArray(functions).slice 1
	do Route66.sort

toArray = (object) ->
	items = []
	for item of object
		items.push object[item]
	items

routes = {}
methods = ['get', 'post', 'patch', 'put', 'delete', 'head']

for method in methods
	routes[method] = []
	Route66[method] = (match) ->
		Route66.addRoute method, match, arguments

Route66.sort = ->
	for method in methods
		routes[method].sort (a, b) ->
			b.match.toString().length - a.match.toString().length

module.exports = Route66
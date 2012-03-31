async = require 'async'
url = require 'url'

Route66 = (req, res, next) -> # function, that we are pushing to our connect middleware stack
	for route in routes[req.method.toLowerCase()] # getting routes, that match current HTTP method
		if route.match.test req.url.replace(url.parse(req.url).search, '')
			values = route.match.exec(req.url).slice 1 # getting params from URL
			i = 0
			req.params = {}
			loop
				break if i >= values.length
				req.params[route.params[i]] = values[i] # getting key and value and setting them
				i++
			return async.forEachSeries route.functions, (fn, nextFn) -> # calling functions
				fn(req, res, nextFn)
			, ->
				do next

Route66.addRoute = (method, match, functions) -> # generic method for adding routes
	params = []
	matchClone = match # for some dark magic
	loop
		result = /\:([A-Za-z_]+)\/?/.exec matchClone # getting keys/names of parameters
		if result
			params.push result.slice(1).toString()
			matchClone = matchClone.replace /\:([A-Za-z_]+)\/?/, ''
		break if not /\:([A-Za-z_]+)\/?/.test matchClone # while there are still some
	routes[method].push
		match: new RegExp '^' + match.replace(/\//g, '\\/?').replace(/\:([A-Za-z_]+)(\?)?\/?/g, '([A-Za-z0-9_]+)$2') + '$' # making RegExp from string
		params: params
		functions: toArray(functions).slice 1
	do Route66.sort

toArray = (object) ->
	items = []
	for item of object
		items.push object[item]
	items

routes = {}
methods = ['get', 'post', 'patch', 'put', 'del', 'head']

Route66.sort = -> # we have to sort routes, for correct dispatching
	for method in methods
		routes[method].sort (a, b) ->
			b.match.toString().length - a.match.toString().length

async.forEach methods, (method, nextMethod) ->
	routes[method] = []
	Route66[method] = (match) ->
		Route66.addRoute method, match, arguments
	do nextMethod
, ->
	module.exports = Route66 # preparing for the journey
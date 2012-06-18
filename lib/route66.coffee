async = require 'async'
url = require 'url'

Route66 = (req, res) -> # function, that we are pushing to our connect middleware stack
	if req.method is 'DELETE'
		method = 'del'
	else
		method = req.method.toLowerCase()
	
	for route in routes[method] # getting routes, that match current HTTP method
		requestUrl = req.url.replace url.parse(req.url).search, ''
		if route.match.test requestUrl
			values = route.match.exec(requestUrl).slice 1 # getting params from URL
			i = 0
			req.params = {}
			loop
				break if i >= values.length
				req.params[route.params[i]] = values[i] # getting key and value and setting them
				i++
			functions = route.functions
			return async.forEachSeries functions, (fn, nextFn) -> # calling functions
				fn(req, res, nextFn)
				do nextFn if functions.length is 0 # we should end this sometime
			, ->
	
	if Route66.notFoundRoute
		Route66.notFoundRoute req, res
	else
		res.end "Could not #{ req.method } #{ req.url }"

Route66.notFound = (route) ->
	Route66.notFoundRoute = route

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
		match: new RegExp '^' + match.replace(/\//g, '\\/?').replace(/\:([A-Za-z_]+)(\?)?\/?/g, '([A-Za-z0-9_-]+)$2') + '$' # making RegExp from string
		params: params
		functions: if functions instanceof Array then functions else toArray(functions).slice 1
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
			aMatch = a.match.toString()
			bMatch = b.match.toString()
			if -1 < aMatch.indexOf('([A-Za-z0-9_-]+)')
				true
			else if -1 < bMatch.indexOf('([A-Za-z0-9_-]+)')
				false
			else
				bMatch.length - aMatch.length

methods.forEach (method) ->
	routes[method] = []
	Route66[method] = (match) ->
		Route66.addRoute method, match, arguments

module.exports = Route66 # preparing for the journey
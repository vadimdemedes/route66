async = require 'async'
url = require 'url'

Route66 = (req, res) -> # function, that we are pushing to our connect middleware stack
	method = if req.method is 'DELETE' then 'del' else req.method.toLowerCase()
	
	requestUrl = req.url.replace url.parse(req.url).search, ''
	
	for route in Route66.routes[method] # getting routes, that match current HTTP method
		if route.regex.test requestUrl
			values = route.regex.exec(requestUrl).slice 1 # getting params from URL
			i = 0
			req.params = {}
			loop
				break if i >= values.length
				req.params[route.params[i]] = values[i] # getting key and value and setting them
				i++
			
			return async.forEachSeries route.functions, (fn, nextFn) -> # calling functions
				fn(req, res, nextFn)
				nextFn() if route.functions.length is 0 # we should end this sometime
			, ->
	
	res.statusCode = 404
	if Route66.notFoundRoute
		Route66.notFoundRoute req, res
	else
		res.end "Could not #{ req.method } #{ req.url }"

Route66.routes = {}

Route66.notFound = (route) ->
	Route66.notFoundRoute = route

Route66.addRoute = (method, route, functions) -> # generic method for adding routes
	params = []
	routeClone = route # for some dark magic
	loop
		result = /\:([A-Za-z_]+)\/?/.exec routeClone # getting keys/names of parameters
		if result
			params.push result.slice(1).toString()
			routeClone = routeClone.replace /\:([A-Za-z_]+)\/?/, ''
		break if not /\:([A-Za-z_]+)\/?/.test(routeClone) # while there are still some
	
	Route66.routes[method].push
		route: route
		regex: new RegExp('^' + route.replace(/\//g, '\\/').replace(/\:([A-Za-z_]+)(\?)?\/?/g, '$2([A-Za-z0-9@.=_-]+)$2') + '\\/?$') # making RegExp from string
		params: params
		functions: if functions instanceof Array then functions else toArray(functions).slice 1
	
	Route66.sort()

toArray = (object) ->
	items = []
	items.push object[item] for item of object
	items

methods = ['get', 'post', 'patch', 'put', 'del', 'head', 'options']

Route66.autosort = yes

Route66.sort = -> # we have to sort routes, for correct dispatching
	return if not Route66.autosort
	
	sort = (a, b) ->
		aRegex = a.regex.toString()
		bRegex = b.regex.toString()
		if -1 < aRegex.indexOf('([A-Za-z0-9_-]+)')
			true
		else if -1 < bRegex.indexOf('([A-Za-z0-9_-]+)')
			false
		#else bRegex.length - aRegex.length
		else
			numberOfParams = a: 0, b: 0
			loop
				paramsIn = a: yes, b: yes
				if /\:[A-Za-z0-9_]+/.test a.route
					numberOfParams.a++
					a.route = a.route.replace(/\:[A-Za-z0-9_]+/, '')
				else paramsIn.a = no
				
				if /\:[A-Za-z0-9_]+/.test b.route
					numberOfParams.b++
					b.route = b.route.replace(/\:[A-Za-z0-9_]+/, '')
				else paramsIn.b = no
				
				break if not paramsIn.a and not paramsIn.b
			
			return numberOfParams.a > numberOfParams.b
	
	for method in methods
		if Route66.routes[method].length > 0
			first = []
			middle = []
			last = []
		
			for route in Route66.routes[method]
				if route.route is '/'
					last.push route
				else if /\:[A-Za-z0-9_]+/.test route.route
					middle.push route
				else first.push route
			
			first.sort sort
			middle.sort sort
			
			first.push route for route in middle
			first.push route for route in last
		
			Route66.routes[method] = first
	
	undefined

methods.forEach (method) ->
	Route66.routes[method] = []
	Route66[method] = (route) -> Route66.addRoute method, route, arguments

module.exports = Route66 # preparing for the journey
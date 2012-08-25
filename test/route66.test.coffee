connect = require 'connect'
request = require 'request'
router = require '../lib/route66'
router.autosort = yes

require 'should'

app = do connect

router.get '/', (req, res) ->
	res.end 'GET /'

router.get '/withMiddleware', (req, res, next) ->
	req.message = 'GET /withMiddleware'
	do next
, (req, res) ->
	res.end req.message

router.get '/posts/:title?', (req, res) ->
	res.end req.params.title or 'empty'

router.post '/', (req, res) ->
	res.end 'POST /'

router.get '/:first/:second', (req, res) ->
	res.end 'Only parameters'

router.get '/:id', (req, res) ->
	res.end 'Got an id!'

router.get '/new', (req, res) ->
	res.end 'Creating new resource'

router.notFound (req, res) ->
	res.end "Not found."

app.use router
app.listen 8080

describe 'Route66', ->
	it 'should match "GET /" route', (done) ->
		request
			url: 'http://localhost:8080/'
			method: 'GET'
		, (err, res) ->
			res.body.should.equal 'GET /'
			done()
	
	it 'should match "GET /posts/:title?" route', (done) ->
		request
			url: 'http://localhost:8080/posts/i.love-apple'
			method: 'GET'
		, (err, res) ->
			res.body.should.equal 'i.love-apple'
			
			request
				url: 'http://localhost:8080/posts'
				method: 'GET'
			, (err, res) ->
				res.body.should.equal 'empty'
				done()
	
	it 'should match "POST /" route', (done) ->
		request
			url: 'http://localhost:8080/'
			method: 'POST'
		, (err, res) ->
			res.body.should.equal 'POST /'
			done()
	
	it 'should call middleware stack', (done) ->
		request
			url: 'http://localhost:8080/withMiddleware'
			method: 'GET'
		, (err, res) ->
			res.body.should.equal 'GET /withMiddleware'
			done()
	
	it 'should match not wrong route', (done) ->
		request
			url: 'http://localhost:8080/first/second/'
			method: 'GET'
		, (err, res) ->
			res.body.should.equal 'Only parameters'
			request
				url: 'http://localhost:8080/123'
				method: 'GET'
			, (err, res) ->
				res.body.should.equal 'Got an id!'
				request
					url: 'http://localhost:8080/new'
					method: 'GET'
				, (err, res) ->
					res.body.should.equal 'Creating new resource'
					done()
	
	it 'should respond with an error', (done) ->
		request
			url: 'http://localhost:8080/one/two/error'
			method: 'GET'
		, (err, res) ->
			res.body.should.equal 'Not found.'
			done()
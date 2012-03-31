# Route66

Route66 - is a middleware for routing for Connect 2.0. It was created, because original *connect.router* was removed from the latest version. It supports multiple methods, request params and easy patterns.

# Installation

`npm install route66`

# Usage

```coffee-script
router = require 'route66'
connect = require 'connect'
app = connect()

router.get '/', (req, res) -> # simplest route declaration
	res.end()
	
router.get '/new', (req, res) -> # another simple route
	res.end()

router.post '/', (req, res, next) -> # now, with middleware
	do next
, (req, res) ->
	res.end()
	
router.get '/:id', (req, res) -> # with request params
	req.params.id
	res.end()
	
app.use router
app.listen 3000
```

Available methods: get, post, put, patch, del, head.
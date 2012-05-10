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

router.notFound (req, res) -> # when nothing found
	res.end 'Oops, did not find anything.'
	
app.use router
app.listen 3000
```

Available methods: get, post, put, patch, del, head.

# Tests

Run tests using:

```mocha```

# License

(The MIT License)

Copyright (c) 2011 Vadim Demedes sbioko@gmail.com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
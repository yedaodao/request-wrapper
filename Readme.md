# request-wrapper

[![npm](https://img.shields.io/badge/npm-2.15.0-blue.svg)](https://www.npmjs.com/package/request-wrapper)

A capsulation for request which is a node popular lib

## Installation

```shell
$ npm install request-wrapper
```

## Get Started

request-wrapper is only a simple capsulation for [request](https://github.com/request/request). It's destination is to provide the http response which is a promise and more unified control of http request, response and error

```javascript
var RequestWrapper = require('request-wrapper');
var http = new RequestWrapper();
http.request({
    url: "https://nodejs.org/en/"
})
    .then(function (res) {
        console.log(res);
    })
    .error(function (err) {
        console.log(err);
    });
```

## Dependencies

It depends on *bluebird* which is popular promise lib.

## API

### .request(options)

The options arg is based on the option in request lib.

The arguments about http are in here: [link](https://github.com/request/request#requestoptions-callback)

And you can use ':' in url and 'params' in options for concating url parts easily.

```javascipt
// The request url is 'http://example.com/product/id'
http.request({
	url: 'http://example.com/:path/id',
	params: {
		path: 'product'
	}
})
```

### .then(res)

The Object includes all response infomation. You can get body using ```res.body``` and so on.

### .catch(error)

The Object like following:

```json
{
	error: "error object or error msg",
	response: "whole response infomation like res in then method"
}
``` 

### .setCallback(res, body, resolve, reject)

You can modify the logic for judging success via this method. In addition, you must use `resolve` or `reject` method to return `res` object.

```javascript
http.setCallback(function(res, body, resolve, reject){
	var code = res ? res.statusCode : null;
        if (!code || code < 200 || code >= 400) {
            return reject(res);
        }
        if (body.error) {
            return reject(res);
        }
        resolve(res);
})
```

### transformErr

A series functions to handle error.

```javascript
// log error info
http.transormErr.push(function(reqConfig, err, res, body){
	logger.error({
	   request: JSON.stringify(reqConfig),
	   error: JSON.stringify(err),
	   response: JSON.stringify(res)
	});
});
```

### transformReq

A series functions to handle request.

```javascript
// add custom header for every request
http.transformReq.push(function(reqConfig, body, headers, status, req){
	headers['custorm-header'] = 'custom-value';
})
```

### transformRes

A series functions to handle response.

```javascript
// log info for every response
http.transformRes.push(function(reqConfig, body, headers, status, res){
	logger.info(res.body);
})
```


Thank you.



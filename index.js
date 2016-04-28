var _ = require('lodash'),
    request = require('request'),
    Q = require('q');


var defaultReq = {
    method: 'GET',
    json: true,
    headers: {
        'Content-Type': 'application/json;charset=utf-8'
    },
    timeout: 10000
};

/**
 * Class: request wrapper for getting promise
 * @param commonConfig like request config
 */
function reqHttp(commonConfig) {
    this.defaultConfig = _.assign({}, defaultReq, commonConfig);
    this.defaultCallback = function (err, res, body, defered) {
        var code = res ? res.statusCode : null;
        if (!code || code < 200 || code >= 400) {
            return defered.reject(res);
        }
        return defered.resolve(res);
    };
    this.transformErr = [];
    this.transformReq = [];
    this.transformRes = [];
}

reqHttp.prototype.setCallBack = function (func) {
    assertArgFn(func);

    this.defaultCallback = func;
};

reqHttp.prototype.request = function (config) {
    var reqConfig = _.assign({}, this.defaultConfig, config);
    reqConfig.headers = mergeHeaders(this.defaultConfig, config);
    var reqData = transformData(reqConfig, reqConfig.body, reqConfig.headers, null, this.transformReq),
        headers = reqConfig.headers,
        defered = Q.defer(),
        promise = defered.promise,
        self = this;

    // pre-process headers
    if (_.isUndefined(headers)) {
        for (var header in headers) {
            if (header && header.toLowerCase() === 'content-type') {
                delete headers[header];
            }
        }
    }

    // handle url
    if (reqConfig.params != null) {
        var url = reqConfig.url;
        for (var p in reqConfig.params) {
            //TODO no strict
            url = url.replace(new RegExp(':' + p, 'g'), reqConfig.params[p]);
        }
        reqConfig.url = url;
    }

    // real request
    request(reqConfig, function (err, res, body) {
        if (err) {
            err = transformErr(reqConfig, err, res, body, self.transformErr);
            return defered.reject(err);
        }
        var resData = transformData(reqConfig, res.body, res.headers, res.statusCode, self.transformRes);
        return self.defaultCallback(err, res, resData, defered);
    });

    /**
     * custom the success handler on promise obj
     * @param func
     * @returns {*}
     */
    promise.success = function (func) {
        assertArgFn(func);

        promise.then(function (res) {
            func(res.body, res.statusCode, res.headers, res);
        });
        return promise;
    };

    /**
     * custom the error handler on promise obj
     * @param func
     */
    promise.error = function (func) {
        assertArgFn(func);
        promise.then(null, function (res) {
            func(res.body, res.statusCode, res.headers, res);
        });
        return promise;
    };

    return promise;


    /**
     * handle data by an array of functions
     * the args must be use as references
     * @param reqConfig
     * @param data
     * @param headers
     * @param status
     * @param fns
     * @returns {*}
     */
    function transformData(reqConfig, data, headers, status, fns) {
        if (_.isFunction(fns)) {
            fns(reqConfig, data, headers, status);
        }
        if (_.isArray(fns)) {
            fns.forEach(function (fn) {
                fn(reqConfig, data, headers, status);
            });
        }
        return data;
    }

    /**
     * handle err by an array of functions
     * the args must be use as references
     * @param reqConfig
     * @param err
     * @param res
     * @param body
     * @param fns
     * @returns {*}
     */
    function transformErr(reqConfig, err, res, body, fns) {
        if (_.isFunction(fns)) {
            fns(reqConfig, err, res, body);
        }
        if (_.isArray(fns)) {
            fns.forEach(function (fn) {
                fn(reqConfig, err, res, body);
            });
        }
        return err;
    }
};

/**
 * check if the arg is a function
 * @param func
 * @returns {boolean}
 */
function assertArgFn(func) {
    if (!_.isFunction(func)) {
        throw new Error('The arg must be a function.');
    }
    return true;
}

/**
 * merge headers
 * @returns {{}}
 */
function mergeHeaders() {
    var headers = {},
        args = (arguments && arguments.length) ? [].slice.call(arguments, 0) : [];
    args.forEach(function (item) {
        var h = item['headers'];
        if (h == null) {
            return false;
        }
        for (var i in h) {
            headers[i] = h[i];
        }
    });
    return headers;
}

module.exports = reqHttp;

var _ = require('lodash'),
    request = require('request-promise'),
    Promise = require('bluebird');


var defaultReq = {
    method: 'GET',
    json: true,
    headers: {
        'Content-Type': 'application/json;charset=utf-8'
    },
    timeout: 10000,
    resolveWithFullResponse: true,
    simple: false
};

/**
 * Class: request wrapper for getting promise
 * @param commonConfig like request config
 */
function ReqHttp(commonConfig) {
    this.defaultConfig = _.assign({}, defaultReq, commonConfig);
    this.defaultCallback = function (res, body, resolve, reject) {
        var code = res ? res.statusCode : null;
        if (!code || code < 200 || code >= 400) {
            return reject(res);
        }
        return resolve(res);
    };
    this.transformErr = [];
    this.transformReq = [];
    this.transformRes = [];
}

ReqHttp.prototype.setCallBack = function (func) {
    assertArgFn(func);

    this.defaultCallback = func;
};

ReqHttp.prototype.request = function (config) {
    var reqConfig = _.assign({}, this.defaultConfig, config);
    reqConfig.headers = mergeHeaders(this.defaultConfig, config);
    var reqData = transformData(reqConfig, reqConfig.body, reqConfig.headers, null, this.transformReq),
        headers = reqConfig.headers,
        self = this;

    // pre-process headers
    if (!_.isUndefined(headers)) {
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

    return new Promise(function (resolve, reject) {
        // real request
        request(reqConfig)
            .then(function (res) {
                var resData = transformData(reqConfig, res.body, res.headers, res.statusCode, self.transformRes);
                self.defaultCallback(res, resData, resolve, reject);
            })
            .catch(function (err) {
                reject({
                    error: err,
                    response: null
                });
            });
    })
        .then(function (res) {
            return res;
        })
        .catch(function (errObj) {
            if (!_.isObject(errObj)) {
                return {
                    error: 'unknown',
                    response: {}
                }
            }
            if (!_.has(errObj, 'response') || !_.has(errObj, 'error')) {
                errObj = {
                    error: 'http error',
                    response: errObj
                }
            }
            var body = _.has(errObj, 'response.body') ? errObj.response.body : {};
            errObj.error = transformErr(reqConfig, errObj.error, errObj.response, body, self.transformErr);
            return errObj;
        });


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

module.exports = ReqHttp;

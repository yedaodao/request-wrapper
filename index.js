var _ = require('lodash'),
    request = require('request-promise'),
    Promise = require('bluebird'),
    RequestError = require('request-promise/errors');


var defaultReq = {
        method: 'GET',
        json: true,
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        timeout: 10000,
        resolveWithFullResponse: true
    },
    StatusCodeError = RequestError.StatusCodeError;

/**
 * Class: request wrapper for getting promise
 * @param commonConfig like request config
 */
function ReqHttp(commonConfig) {
    var headers = mergeHeaders(defaultReq, commonConfig);
    this.defaultConfig = _.assign({}, defaultReq, commonConfig);
    this.defaultConfig.headers = headers;
    this.transformErr = [];
    this.transformReq = [];
    this.transformRes = [];
}

ReqHttp.prototype.request = function (config) {
    var headers = mergeHeaders(this.defaultConfig, config);
    var reqConfig = _.assign({}, this.defaultConfig, config);
    reqConfig.headers = headers;
    var reqData = transformData(reqConfig, reqConfig.body, reqConfig.headers, null, this.transformReq),
        self = this;

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
                transformData(reqConfig, res.body, res.headers, res.statusCode, self.transformRes);
                resolve(res);
            })
            .catch(function (err) {
                reject(err);
            });
    })
        .catch(function (errObj) {
            var res = errObj.response || {};
            transformErr(reqConfig, errObj, res, self.transformErr);
            throw errObj;
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
     * @param fns
     * @returns {*}
     */
    function transformErr(reqConfig, err, res, fns) {
        if (_.isFunction(fns)) {
            fns(reqConfig, err, res);
        }
        if (_.isArray(fns)) {
            fns.forEach(function (fn) {
                fn(reqConfig, err, res);
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
        if (!item) {
            return false;
        }
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

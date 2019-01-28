/**
 * Copyright (c) 2015-present, Parse, LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
/* global wx */
import CoreManager from './CoreManager';
import ParseError from './ParseError';

export type RequestOptions = {
  useMasterKey?: boolean;
  sessionToken?: string;
  installationId?: string;
  include?: any;
};

export type FullOptions = {
  success?: any;
  error?: any;
  useMasterKey?: boolean;
  sessionToken?: string;
  installationId?: string;
};

const RESTController = {
  ajax(method: string, url: string, data: any, headers?: any) {
    var res, rej;
    var promise = new Promise((resolve, reject) => { res = resolve; rej = reject; });
    promise.resolve = res;
    promise.reject = rej;
    
    var payload = JSON.parse(payloadString);
    var headers = {};
    headers["content-type"] = "application/json";
    headers["X-Parse-Application-Id"] = payload._ApplicationId;
    delete payload._ApplicationId;
    if (payload._JavaScriptKey) {
      headers["X-Parse-JavaScript-Key"] = payload._JavaScriptKey;
      delete payload._JavaScriptKey;
    }
    if (payload._MasterKey) {
      headers["X-Parse-Master-Key"] = payload._MasterKey;
      delete payload._MasterKey;
    }

    // wx request document
    // https://developers.weixin.qq.com/miniprogram/en/dev/api/network-request.html#wxrequestobject
    wx.request({
      url: url,
      data: payload,
      header: headers,
      method: method,
      success: function(response) {
        var res = (response.header && response.header['X-Parse-Job-Status-Id']) || response.data;
        promise.resolve({
          response: res,
          status: response.statusCode
        });
      },
      fail: function(err) {
        promise.reject(err);
      }
    });

    return promise;
  },

  request(method: string, path: string, data: mixed, options?: RequestOptions) {
    options = options || {};
    var url = CoreManager.get('SERVER_URL');
    if (url[url.length - 1] !== '/') {
      url += '/';
    }
    url += path;

    var payload = {};
    if (data && typeof data === 'object') {
      for (var k in data) {
        payload[k] = data[k];
      }
    }

    if (method !== 'POST') {
      payload._method = method;
      method = 'POST';
    }

    payload._ApplicationId = CoreManager.get('APPLICATION_ID');
    const jsKey = CoreManager.get('JAVASCRIPT_KEY');
    if (jsKey) {
      payload._JavaScriptKey = jsKey;
    }
    payload._ClientVersion = CoreManager.get('VERSION');

    var useMasterKey = options.useMasterKey;
    if (typeof useMasterKey === 'undefined') {
      useMasterKey = CoreManager.get('USE_MASTER_KEY');
    }
    if (useMasterKey) {
      if (CoreManager.get('MASTER_KEY')) {
        delete payload._JavaScriptKey;
        payload._MasterKey = CoreManager.get('MASTER_KEY');
      } else {
        throw new Error('Cannot use the Master Key, it has not been provided.');
      }
    }

    if (CoreManager.get('FORCE_REVOCABLE_SESSION')) {
      payload._RevocableSession = '1';
    }

    var installationId = options.installationId;
    var installationIdPromise;
    if (installationId && typeof installationId === 'string') {
      installationIdPromise = Promise.resolve(installationId);
    } else {
      var installationController = CoreManager.getInstallationController();
      installationIdPromise = installationController.currentInstallationId();
    }

    return installationIdPromise.then((iid) => {
      payload._InstallationId = iid;
      var userController = CoreManager.getUserController();
      if (options && typeof options.sessionToken === 'string') {
        return Promise.resolve(options.sessionToken);
      } else if (userController) {
        return userController.currentUserAsync().then((user) => {
          if (user) {
            return Promise.resolve(user.getSessionToken());
          }
          return Promise.resolve(null);
        });
      }
      return Promise.resolve(null);
    }).then((token) => {
      if (token) {
        payload._SessionToken = token;
      }

      var payloadString = JSON.stringify(payload);

      return RESTController.ajax(method, url, payloadString).then(({ response }) => {
        return response;
      });
    }).catch(function(response: { responseText: string }) {
      // Transform the error into an instance of ParseError by trying to parse
      // the error string as JSON
      var error;
      if (response && response.responseText) {
        try {
          var errorJSON = JSON.parse(response.responseText);
          error = new ParseError(errorJSON.code, errorJSON.error);
        } catch (e) {
          // If we fail to parse the error text, that's okay.
          error = new ParseError(
            ParseError.INVALID_JSON,
            'Received an error with invalid JSON from Parse: ' +
              response.responseText
          );
        }
      } else {
        error = new ParseError(
          ParseError.CONNECTION_FAILED,
          'XMLHttpRequest failed: ' + JSON.stringify(response)
        );
      }

      return Promise.reject(error);
    });
  }
}

module.exports = RESTController;

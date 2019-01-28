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

import CoreManager from './CoreManager';

var RESTController = {
  ajax(...args): Promise {
    var controller = CoreManager.getRESTController();
    return controller.ajax().apply(null, args);
  },

  request(...args): Promise {
    var controller = CoreManager.getRESTController();
    return controller.request().apply(null, args);
  }
};

module.exports = RESTController;

if (process.env.PARSE_BUILD === 'wx-miniprogram') {
  CoreManager.setRESTController(require('./RESTController.wx-miniprogram'));
} else {
  CoreManager.setRESTController(require('./RESTController.default'));
}

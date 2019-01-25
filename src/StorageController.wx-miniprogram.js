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
// wx mini program storage api
// => https://developers.weixin.qq.com/miniprogram/en/dev/api/data.html
// tips: wx mini program storage size restriction is 10MB
var StorageController = {
  async: 0,

  getItem(path: string): ?string {
    try {
      return wx.getStorageSync(path);
    } catch (e) {
      return null;
    }
  },

  setItem(path: string, value: string) {
    try {
      wx.setStorage(path, value);
    } catch (e) {
      // Quota exceeded, possibly due to wx mini program storage size restriction
    }
  },

  removeItem(path: string) {
    try {
      wx.removeStorageSync(path)
    } catch (e) {
      // Do nothing when catch error
    }
  },

  clear() {
    try {
      wx.clearStorageSync()
    } catch (e) {
      // Do nothing when catch error
    }
  }
};

module.exports = StorageController;

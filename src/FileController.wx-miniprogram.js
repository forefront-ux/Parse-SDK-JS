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

/**
 * A Parse.File is a local representation of a file that is saved to the Parse
 * cloud.
 * @alias Parse.File
 */
class ParseFile {
  _name: string;
  _url: ?string;

  /**
   * @param name {String} The file's name. This will be prefixed by a unique
   *     value once the file has finished saving. The file name must begin with
   *     an alphanumeric character, and consist of alphanumeric characters,
   *     periods, spaces, underscores, or dashes.
   * @param data {Array} The data for the file, as either:
   *     1. an Array of byte value Numbers, or
   *     2. an Object like { base64: "..." } with a base64-encoded String.
   *     3. a File object selected with a file upload control. (3) only works
   *        in Firefox 3.6+, Safari 6.0.2+, Chrome 7+, and IE 10+.
   *        For example:
   * <pre>
   * var fileUploadControl = $("#profilePhotoFileUpload")[0];
   * if (fileUploadControl.files.length > 0) {
   *   var file = fileUploadControl.files[0];
   *   var name = "photo.jpg";
   *   var parseFile = new Parse.File(name, file);
   *   parseFile.save().then(function() {
   *     // The file has been saved to Parse.
   *   }, function(error) {
   *     // The file either could not be read, or could not be saved to Parse.
   *   });
   * }</pre>
   * @param type {String} Optional Content-Type header to use for the file. If
   *     this is omitted, the content type will be inferred from the name's
   *     extension.
   */
  constructor(name: string) {
    this._name = name;
  }

  /**
   * Gets the name of the file. Before save is called, this is the filename
   * given by the user. After save is called, that name gets prefixed with a
   * unique identifier.
   * @return {String}
   */
  name(): string {
    return this._name;
  }

  /**
   * Gets the url of the file. It is only available after you save the file or
   * after you get the file from a Parse.Object.
   * @param {Object} options An object to specify url options
   * @return {String}
   */
  url(options?: { forceSecure?: boolean }): ?string {
    options = options || {};
    if (!this._url) {
      return;
    }
    if (options.forceSecure) {
      return this._url.replace(/^http:\/\//i, 'https://');
    } else {
      return this._url;
    }
  }

  /**
   * Saves the file to the Parse cloud.
   * @param {Object} options
   * @return {Promise} Promise that is resolved when the save finishes.
   */
  save(options?: { useMasterKey?: boolean, success?: any, error?: any }) {
    options = options || {};
    var controller = CoreManager.getFileController();
    if (!this._previousSave) {
      this._previousSave = controller.saveFile(this._name).then((res) => {
        this._name = res.name;
        this._url = res.url;
        return this;
      });
    }
    if (this._previousSave) {
      return this._previousSave;
    }
  }

  equals(other: mixed): boolean {
    if (this === other) {
      return true;
    }
    // Unsaved Files are never equal, since they will be saved to different URLs
    return (
      (other instanceof ParseFile) &&
      this.name() === other.name() &&
      this.url() === other.url() &&
      typeof this.url() !== 'undefined'
    );
  }
}

var WxFileController = {
  saveFile: function(name: string) {
    // To directly upload a File, we use a REST-style AJAX request
    var headers = {
      'X-Parse-Application-ID': CoreManager.get('APPLICATION_ID')
    };
    var jsKey = CoreManager.get('JAVASCRIPT_KEY');
    if (jsKey) {
      headers['X-Parse-JavaScript-Key'] = jsKey;
    }
    var url = CoreManager.get('SERVER_URL');
    if (url[url.length - 1] !== '/') {
      url += '/';
    }
    url += 'files/' + name;
    return wx.chooseImage({
      count: 1,
      sizeType: ['original'],
      success(res) {
        const tempFilePaths = res.tempFilePaths
        return wx.uploadFile({
          url,
          filePath: tempFilePaths[0],
          name: name,
          header: headers,
          success(res) {
            return res && res.data;
          }
        });
      }
    });
  },

  saveBase64: function() {
    throw new Error('saveBase64 can only be used in wx mini program');
  }
};

CoreManager.setFileController(WxFileController);

export default ParseFile;

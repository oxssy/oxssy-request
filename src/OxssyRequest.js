import { setLocation } from 'oxssy-router';
import { compile } from 'path-to-regexp';
import { stringify } from 'querystring';
import request from './http';


export default class OxssyRequest {
  constructor(url, requestOxssy = null, responseOxssy = null, option = {}) {
    this.url = url;
    this.authenticate = null;
    this.authRedirect = null;
    this.compiledUrl = compile(url);
    this.requestOxssy = requestOxssy;
    this.responseOxssy = responseOxssy;
    const {
      loadingOxssy,
      method,
      requestErrorOxssy,
    } = option;
    this.loadingOxssy = loadingOxssy;
    this.method = method || (requestOxssy ? 'post' : 'get');
    this.requestErrorOxssy = requestErrorOxssy;
    this.send = this.send.bind(this);
  }

  getRequestOxssy(params) {
    if (!this.requestOxssy) {
      return null;
    }
    if (typeof this.requestOxssy === 'function') {
      return this.requestOxssy(params);
    }
    return this.requestOxssy;
  }

  getResponseOxssy(params) {
    if (!this.responseOxssy) {
      return null;
    }
    if (typeof this.responseOxssy === 'function') {
      return this.responseOxssy(params);
    }
    return this.responseOxssy;
  }

  getRequestUrl(params, search) {
    return `${this.compiledUrl(typeof params === 'object' ? params : {})}` +
      `${search ? `?${stringify(search)}` : ''}`;
  }

  setLoading(isLoading, params) {
    if (!this.loadingOxssy) {
      return Promise.resolve();
    }
    if (typeof this.loadingOxssy === 'function') {
      return this.loadingOxssy(params).update(isLoading);
    }
    return this.loadingOxssy.update(isLoading);
  }

  setRequestError(requestError, params) {
    if (!this.requestErrorOxssy || (requestError && requestError.oxssy)) {
      return Promise.resolve();
    }
    if (typeof this.requestErrorOxssy === 'function') {
      return this.requestErrorOxssy(params).update(requestError ? requestError.message : null);
    }
    return this.requestErrorOxssy.update(requestError ? requestError.message : null);
  }

  onResponse(response, params) {
    if (response.redirect) {
      const { pathname, search } = response.redirect;
      setLocation(pathname, search);
    }
    const responseOxssy = this.getResponseOxssy(params);
    return (responseOxssy && Object.keys(response).includes('update'))
      ? this.responseOxssy.update(response.update)
      : Promise.resolve();
  }

  validateRequest(params) {
    const requestOxssy = this.getRequestOxssy(params);
    return requestOxssy ? requestOxssy.validate(true) : Promise.resolve();
  }

  send(params = null, search = null) {
    return this.setRequestError(null, params)
      .then(() => this.setLoading(true, params))
      .then(() => this.validateRequest(params))
      .then(() => {
        const requestOxssy = this.getRequestOxssy(params);
        return request(
          this.getRequestUrl(params, search),
          this.method,
          requestOxssy ? requestOxssy.value : null,
        );
      })
      .then(response => this.onResponse(response, params))
      .catch(error => this.setRequestError(error, params))
      .then(() => this.setLoading(false, params));
  }
}

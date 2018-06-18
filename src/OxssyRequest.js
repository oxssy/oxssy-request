import http from 'http';
import { setLocation } from 'oxssy-router';
import { compile } from 'path-to-regexp';
import { stringify } from 'querystring';
import request from './http';
import validate from './validate';


export default class OxssyRequest {
  constructor(url, requestOxssy = null, responseOxssy = null, option = {}) {
    this.url = url;
    this.compiledUrl = compile(url);
    this.requestOxssy = requestOxssy;
    this.responseOxssy = responseOxssy;
    const {
      loadingOxssy,
      method,
      requestErrorOxssy,
    } = option;
    this.loadingOxssy = loadingOxssy;
    this.method = method;
    this.requestErrorOxssy = requestErrorOxssy;
    this.send = this.send.bind(this);
  }

  setLoading(isLoading) {
    return this.loadingOxssy ? this.loadingOxssy.update(isLoading) : Promise.resolve();
  }

  setRequestError(requestError) {
    return (this.requestErrorOxssy && !(requestError && requestError.oxssy))
      ? this.requestErrorOxssy.update(requestError ? requestError.message : null)
      : Promise.resolve();
  }

  onResponse(response) {
    const { redirect, update } = response;
    if (redirect) {
      const { pathname, search } = redirect;
      setLocation(pathname, search);
    }
    return this.responseOxssy ? this.responseOxssy.update(update) : Promise.resolve();
  }

  validateRequest() {
    return this.requestOxssy ? this.requestOxssy.validate(true) : Promise.resolve();
  }

  send(params = null, query = null) {
    return this.setRequestError(null)
      .then(() => this.setLoading(true))
      .then(() => this.validateRequest())
      .then(() => request(
        `${this.compiledUrl(typeof params === 'object' ? params : {})}` +
        `${query ? `?${stringify(query)}` : ''}`,
        this.requestOxssy ? this.requestOxssy.value : null,
        this.method,
      ))
      .then(response => this.onResponse(response))
      .catch(error => this.setRequestError(error))
      .then(() => this.setLoading(false));
  }

  handle(app, computeResponse = null) {
    const method = this.method.toLowerCase();
    if (!(method in http.METHODS)) {
      throw new Error(`OxssyRequest: cannot handle request with unknown method ${method}`);
    }
    if (this.responseOxssy && !computeResponse) {
      throw new Error(`OxssyRequest: missing computeUpdate function for ${method}(${this.url})`);
    }
    app[method](this.url, (req, res) => {
      try {
        if (this.requestOxssy) {
          validate(this.requestOxssy, req.body);
        }
      } catch (error) {
        res.statusMessage = http.STATUS_CODES[400];
        return res.status(400).end();
      }
      try {
        const {
          cookie,
          cookieOption,
          redirect,
          update,
        } = computeResponse(
          this.requestOxssy ? this.requestOxssy.value : null,
          req,
        );
        let resRedirect = null;
        if (redirect) {
          resRedirect = typeof redirect === 'string'
            ? { pathname: redirect }
            : { pathname: redirect.pathname, search: redirect.search };
        }
        if (this.responseOxssy) {
          validate(this.responseOxssy, update);
        }
        if (cookie) {
          Object.entries(cookie).forEach(([name, value]) => {
            res.cookie(
              name,
              value,
              (cookieOption && cookieOption[name]) ? cookieOption[name] : null,
            );
          });
        }
        return res.json({
          redirect: resRedirect,
          update,
        });
      } catch (error) {
        res.statusMessage = http.STATUS_CODES[500];
        return res.status(500).end();
      }
    });
  }
}

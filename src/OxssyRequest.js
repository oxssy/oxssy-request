import { setLocation } from 'oxssy-router';
import { ValidationError } from 'oxssy';
import request from './http';


export default class OxssyRequest {
  constructor(
    url, method, requestOxssy, responseOxssy, validationErrorOxssy = null,
    requestErrorOxssy = null, loadingOxssy = null,
  ) {
    this.url = url;
    this.method = method;
    this.requestOxssy = Object.keys(requestOxssy) ? requestOxssy : null;
    this.responseOxssy = responseOxssy;
    this.validationErrorOxssy = validationErrorOxssy;
    this.requestErrorOxssy = requestErrorOxssy;
    this.loadingOxssy = loadingOxssy;
  }

  setLoading(isLoading) {
    return this.loadingOxssy ? this.loadingOxssy.update(isLoading) : Promise.resolve();
  }

  setValidationError(validationError) {
    return this.validationErrorOxssy
      ? this.validationErrorOxssy.update(validationError ? validationError.errorCode : null)
      : Promise.resolve();
  }

  setRequestError(requestError) {
    return this.requestErrorOxssy
      ? this.requestErrorOxssy.update(requestError ? requestError.message : null)
      : Promise.resolve();
  }

  clearErrors() {
    return Promise.all([this.setValidationError(null), this.setRequestError(null)]);
  }

  onResponse(response) {
    const { location, update } = response;
    if (location) {
      const { pathname, search } = location;
      setLocation(pathname, search);
    }
    return this.responseOxssy.update(update);
  }

  send() {
    return this.clearErrors()
      .then(() => this.setLoading(true))
      .then(() => this.requestOxssy.validate())
      .then(() => request(
        this.url,
        this.requestOxssy ? this.requestOxssy.value : null,
        this.method,
      ))
      .then(this.onResponse)
      .catch((error) => {
        if (error instanceof ValidationError) {
          this.setValidationError(error);
        } else {
          this.setRequestError(error);
        }
      })
      .then(this.setLoading(false));
  }
}

import http from 'http';
import validate from './validate';

const logToConsole = message => console.log(message);
const defaultLogger = {
  debug: logToConsole,
  error: logToConsole,
  info: logToConsole,
  warning: logToConsole,
};

const validateRequest = (req, requestOxssy) => {
  if (!requestOxssy) {
    return null;
  }
  validate(requestOxssy, req.body, true);
  return req.body;
};

const handleRequestError = (res, requestError, logger) => {
  logger.info(`Request validation fails. Error message: ${requestError.message}`);
  res.statusMessage = http.STATUS_CODES[400];
  res.status(400).end();
};

const handleServerError = (res, serverError, logger) => {
  logger.error(`Server error while handling request. Error message ${serverError.message}`);
  res.statusMessage = http.STATUS_CODES[500];
  res.status(500).end();
};

const handleAuthenticationError = (req, res, redirect, logger) => {
  logger.info(`Unathenticated request from ${req.ip}.${redirect
    ? ` Redirected to ${redirect}`
    : ''}`);
  if (redirect) {
    res.redirect(redirect);
  } else {
    res.statusMessage = http.STATUS_CODES[403];
    res.status(403).end();
  }
};

const handleResponse = (res, responseOxssy, computed, logger) => {
  logger.info(`Handler response data computed: ${JSON.stringify(computed)}`);
  const response = {};
  const { cookie, cookieOption, redirect } = computed;
  if (redirect) {
    response.redirect = typeof redirect === 'string'
      ? { pathname: redirect }
      : { pathname: redirect.pathname, search: redirect.search };
  }
  if (responseOxssy && Object.keys(computed).includes('update')) {
    validate(responseOxssy, computed.update);
    response.update = computed.update;
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
  res.json(response);
};

export const authenticate = (request, computeAuthenticate, redirect = null) => {
  request.authenticate = computeAuthenticate;
  request.authRedirect = redirect;
};

export const handle = (app, request, computeResponse, logger = defaultLogger) => {
  if (!http.METHODS.includes(request.method.toUpperCase())) {
    throw new Error(`OxssyRequest: cannot handle request with unknown method ${request.method}`);
  }
  app[request.method](request.url, (req, res) => {
    logger.info(`Handling request at '${request.url}' with request body: ${JSON.stringify(req.body)}`);
    const requestOxssy = request.getRequestOxssy(req.params);
    const responseOxssy = request.getResponseOxssy(req.params);
    return new Promise((resolve, reject) => {
      if (request.authenticate && !request.authenticate(req)) {
        reject();
      } else {
        resolve();
      }
    }).then(
      () => Promise.resolve(validateRequest(req, requestOxssy))
        .then(
          body => Promise.resolve(computeResponse(body, req, logger))
            .then(computed => handleResponse(res, responseOxssy, computed, logger))
            .catch(serverError => handleServerError(res, serverError, logger)),
          requestError => handleRequestError(res, requestError, logger),
        ),
      () => handleAuthenticationError(req, res, request.authRedirect, logger),
    );
  });
};

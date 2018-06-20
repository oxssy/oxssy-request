import http from 'http';
import validate from './validate';


const handle = (app, request, computeResponse) => {
  if (!http.METHODS.includes(request.method.toUpperCase())) {
    throw new Error(`OxssyRequest: cannot handle request with unknown method ${request.method}`);
  }
  app[request.method](request.url, (req, res) => {
    const requestOxssy = request.getRequestOxssy(req.params);
    const responseOxssy = request.getResponseOxssy(req.params);
    try {
      if (requestOxssy) {
        validate(requestOxssy, req.body);
      }
    } catch (error) {
      res.statusMessage = http.STATUS_CODES[400];
      return res.status(400).end();
    }
    try {
      const response = {};
      const computed = computeResponse(requestOxssy ? requestOxssy.value : null, req);
      const { cookie, cookieOption, redirect } = computed;
      if (redirect) {
        response.redirect = typeof redirect === 'string'
          ? { pathname: redirect }
          : { pathname: redirect.pathname, search: redirect.search };
      }
      if (responseOxssy && Object.keys(computed).includes('update')) {
        validate(responseOxssy, computed.update, false);
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
      return res.json(response);
    } catch (error) {
      res.statusMessage = http.STATUS_CODES[500];
      return res.status(500).end();
    }
  });
};
export default handle;
